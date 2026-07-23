import Link from "next/link";
import { requireDashboardAccess } from "@/lib/auth/rbac";
import { canAccessModule, hasPermission } from "@/lib/auth/rbac-rules";
import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";
import Category from "@/lib/database/models/category.model";
import User from "@/lib/database/models/user.model";
import Poll from "@/lib/database/models/poll.model";
import Ad from "@/lib/database/models/ad.model";
import Media from "@/lib/database/models/media.model";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Clock,
  Edit3,
  Eye,
  FileText,
  Flame,
  FolderTree,
  Image as ImageIcon,
  LayoutGrid,
  Megaphone,
  Newspaper,
  Plus,
  Radio,
  Star,
  TrendingUp,
  Users,
  Vote,
} from "lucide-react";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-slate-50 text-slate-700 border-slate-200",
  review: "bg-amber-50 text-amber-700 border-amber-200",
  archived: "bg-rose-50 text-rose-700 border-rose-200",
};

const DASHBOARD_STORY_FIELDS =
  "title slug categoryId publishDate updatedAt views status leadPosition";

function formatDate(value?: Date | string | null) {
  if (!value) return "Unscheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value || 0);
}

export default async function DashboardPage() {
  const access = await requireDashboardAccess("/");
  await connectToDatabase();

  const canReadNews = canAccessModule(access, "news");
  const canCreateNews = hasPermission(access, "news", "create");
  const canUpdateNews = hasPermission(access, "news", "update");
  const canReadBuilder = canAccessModule(access, "homepage-builder");
  const canReadMedia = canAccessModule(access, "media");
  const canReadPolls = canAccessModule(access, "polls");
  const canReadAds = canAccessModule(access, "ads");
  const canReadUsers = canAccessModule(access, "users");
  const canReadCategories = canAccessModule(access, "categories");

  const [
    newsMetrics,
    totalCategories,
    totalUsers,
    activePolls,
    activeAds,
    mediaAssets,
  ] = await Promise.all([
    canReadNews
      ? Promise.all([
          News.countDocuments(),
          News.countDocuments({ status: "published" }),
          News.countDocuments({ status: "draft" }),
          News.countDocuments({ status: "review" }),
          News.countDocuments({ status: "archived" }),
          News.countDocuments({ breaking: true, status: "published" }),
          News.countDocuments({ lead: true }),
          News.countDocuments({ featured: true }),
          News.countDocuments({ trending: true }),
          News.countDocuments({ schedulePublish: { $gte: new Date() } }),
          News.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
          News.find()
            .select(DASHBOARD_STORY_FIELDS)
            .populate("categoryId", "name slug")
            .sort({ views: -1, publishDate: -1 })
            .limit(5)
            .lean(),
          News.find({ status: { $in: ["draft", "review"] } })
            .select(DASHBOARD_STORY_FIELDS)
            .populate("categoryId", "name slug")
            .sort({ updatedAt: -1 })
            .limit(6)
            .lean(),
          News.find({ lead: true })
            .select(DASHBOARD_STORY_FIELDS)
            .populate("categoryId", "name slug")
            .sort({ leadPosition: 1 })
            .limit(6)
            .lean(),
          News.aggregate([
            { $group: { _id: "$categoryId", count: { $sum: 1 }, views: { $sum: "$views" } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "category",
              },
            },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
            { $project: { count: 1, views: 1, "category.name": 1, "category.slug": 1 } },
          ]),
        ])
      : Promise.resolve([
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          [],
          [],
          [],
          [],
          [],
        ] as const),
    canReadCategories ? Category.countDocuments() : Promise.resolve(0),
    canReadUsers ? User.countDocuments() : Promise.resolve(0),
    canReadPolls ? Poll.countDocuments({ status: "active" }) : Promise.resolve(0),
    canReadAds ? Ad.countDocuments({ status: "active" }) : Promise.resolve(0),
    canReadMedia ? Media.countDocuments() : Promise.resolve(0),
  ]);

  const [
    totalArticles,
    publishedArticles,
    draftArticles,
    reviewArticles,
    archivedArticles,
    breakingArticles,
    leadArticlesCount,
    featuredArticles,
    trendingArticles,
    scheduledArticles,
    totalViewsResult,
    topStories,
    latestEditorialQueue,
    leadStories,
    categoryPerformance,
  ] = newsMetrics;

  const totalViews = totalViewsResult[0]?.total || 0;
  const publishRate =
    totalArticles > 0 ? Math.round((publishedArticles / totalArticles) * 100) : 0;

  const headlineStats = [
    {
      label: "Total Articles",
      value: totalArticles,
      icon: Newspaper,
      accent: "bg-sky-50 text-sky-700 border-sky-200",
      show: canReadNews,
    },
    {
      label: "Published",
      value: publishedArticles,
      icon: TrendingUp,
      accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
      show: canReadNews,
    },
    {
      label: "In Review",
      value: reviewArticles,
      icon: Edit3,
      accent: "bg-amber-50 text-amber-700 border-amber-200",
      show: canReadNews,
    },
    {
      label: "Total Views",
      value: totalViews,
      icon: Eye,
      accent: "bg-rose-50 text-rose-700 border-rose-200",
      show: canReadNews,
    },
    {
      label: "Categories",
      value: totalCategories,
      icon: FolderTree,
      accent: "bg-violet-50 text-violet-700 border-violet-200",
      show: canReadCategories,
    },
    {
      label: "Users",
      value: totalUsers,
      icon: Users,
      accent: "bg-cyan-50 text-cyan-700 border-cyan-200",
      show: canReadUsers,
    },
  ].filter((item) => item.show);

  const quickActions = [
    {
      label: "Create Article",
      href: "/dashboard/news/create",
      icon: Plus,
      show: canCreateNews,
    },
    {
      label: "Review Queue",
      href: "/dashboard/news?status=review",
      icon: Edit3,
      show: canUpdateNews,
    },
    {
      label: "Homepage Builder",
      href: "/dashboard/builder",
      icon: LayoutGrid,
      show: canReadBuilder,
    },
    {
      label: "Media Library",
      href: "/dashboard/media",
      icon: ImageIcon,
      show: canReadMedia,
    },
  ].filter((item) => item.show);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Radio className="w-4 h-4" />
            Newsroom Console
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {access.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track publishing flow, homepage placement, audience attention, and newsroom operations.
          </p>
        </div>

        {quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-primary/40 hover:text-primary transition"
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {headlineStats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {headlineStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className={`rounded-md border p-2 ${stat.accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 text-2xl font-bold text-gray-900">
                  {formatNumber(stat.value)}
                </div>
                <div className="text-xs font-medium text-gray-500">{stat.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {canReadNews && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-6">
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Editorial Pipeline</h2>
                <p className="text-xs text-gray-500">Current story status across the newsroom.</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{publishRate}%</div>
                <div className="text-xs text-gray-500">publish rate</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Drafts", value: draftArticles, color: "bg-slate-600" },
                { label: "Review", value: reviewArticles, color: "bg-amber-500" },
                { label: "Published", value: publishedArticles, color: "bg-emerald-600" },
                { label: "Archived", value: archivedArticles, color: "bg-rose-600" },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">{item.label}</span>
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  </div>
                  <div className="mt-2 text-xl font-bold text-gray-900">{formatNumber(item.value)}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { label: "Breaking", value: breakingArticles, icon: Flame },
                { label: "Lead Slots", value: leadArticlesCount, icon: Star },
                { label: "Featured", value: featuredArticles, icon: FileText },
                { label: "Scheduled", value: scheduledArticles, icon: CalendarClock },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-md bg-gray-50 p-3">
                    <Icon className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-sm font-bold text-gray-900">{formatNumber(item.value)}</div>
                      <div className="text-xs text-gray-500">{item.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Operations</h2>
                <p className="text-xs text-gray-500">Active site surfaces.</p>
              </div>
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>

            <div className="space-y-3">
              {[
                { label: "Active Polls", value: activePolls, icon: Vote, show: canReadPolls },
                { label: "Active Ads", value: activeAds, icon: Megaphone, show: canReadAds },
                { label: "Media Assets", value: mediaAssets, icon: ImageIcon, show: canReadMedia },
              ]
                .filter((item) => item.show)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between rounded-md border border-gray-200 p-3">
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{formatNumber(item.value)}</span>
                    </div>
                  );
                })}
            </div>
          </section>
        </div>
      )}

      {canReadNews && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Top Viewed Stories</h2>
                <p className="text-xs text-gray-500">Audience attention across published and draft content.</p>
              </div>
              <Link href="/dashboard/news" className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                News
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {topStories.length === 0 ? (
                <div className="text-sm text-gray-500 border border-dashed rounded-md p-6 text-center">
                  No stories available yet.
                </div>
              ) : (
                topStories.map((story: any, index) => (
                  <Link
                    key={story._id.toString()}
                    href={`/dashboard/news/${story._id}/edit`}
                    className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-md border border-gray-200 p-3 hover:border-primary/40 transition"
                  >
                    <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{story.title}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {(story.categoryId as any)?.name || "Uncategorized"} · {formatDate(story.publishDate)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                      <Eye className="w-4 h-4 text-gray-400" />
                      {formatNumber(story.views)}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Category Performance</h2>
                <p className="text-xs text-gray-500">Story volume and views by desk.</p>
              </div>
              <FolderTree className="w-5 h-5 text-primary" />
            </div>

            <div className="space-y-3">
              {categoryPerformance.length === 0 ? (
                <div className="text-sm text-gray-500 border border-dashed rounded-md p-6 text-center">
                  No category activity yet.
                </div>
              ) : (
                categoryPerformance.map((item: any) => (
                  <div key={item._id?.toString() || "uncategorized"} className="rounded-md border border-gray-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-gray-900 truncate">
                        {item.category?.name || "Uncategorized"}
                      </div>
                      <div className="text-xs font-semibold text-gray-500">
                        {formatNumber(item.count)} stories
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(100, Math.max(8, (item.count / Math.max(1, totalArticles)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {formatNumber(item.views)} views
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {canReadNews && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Homepage Lead Slots</h2>
                <p className="text-xs text-gray-500">Stories currently assigned to lead positions.</p>
              </div>
              <Star className="w-5 h-5 text-primary" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {Array.from({ length: 12 }, (_, i) => {
                const position = i + 1;
                const story = leadStories.find((item: any) => item.leadPosition === position);
                return (
                  <div key={position} className="rounded-md border border-gray-200 p-3 min-h-[96px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary">Lead {position}</span>
                      {story && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusStyles[story.status] || statusStyles.draft}`}>
                          {story.status}
                        </span>
                      )}
                    </div>
                    {story ? (
                      <div>
                        <div className="font-semibold text-gray-900 line-clamp-2">{story.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(story.categoryId as any)?.name || "Uncategorized"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">No story assigned</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Editorial Queue</h2>
                <p className="text-xs text-gray-500">Latest drafts and stories awaiting review.</p>
              </div>
              <Clock className="w-5 h-5 text-primary" />
            </div>

            <div className="space-y-2">
              {latestEditorialQueue.length === 0 ? (
                <div className="text-sm text-gray-500 border border-dashed rounded-md p-6 text-center">
                  Draft and review queue is clear.
                </div>
              ) : (
                latestEditorialQueue.map((story: any) => (
                  <Link
                    key={story._id.toString()}
                    href={`/dashboard/news/${story._id}/edit`}
                    className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-3 hover:border-primary/40 transition"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{story.title}</div>
                      <div className="text-xs text-gray-500">
                        Updated {formatDate(story.updatedAt)} · {(story.categoryId as any)?.name || "Uncategorized"}
                      </div>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusStyles[story.status] || statusStyles.draft}`}>
                      {story.status}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
