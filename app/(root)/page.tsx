import { connectToDatabase } from "@/lib/database";
import HomepageLayout from "@/lib/database/models/homepageLayout.model";
import News from "@/lib/database/models/news.model";
import { getActivePoll } from "@/lib/actions/poll.actions";
import { getAds } from "@/lib/actions/ad.actions";
import HomepageSection from "@/components/shared/HomepageSection";
import PollWidget from "@/components/shared/PollWidget";
import Ad from "@/components/shared/Ad";
import AdCarousel from "@/components/shared/AdCarousel";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, TrendingUp, Zap } from "lucide-react";

export const revalidate = 60;

const ARTICLE_CARD_FIELDS =
  "title slug summary featuredImage categoryId publishDate views leadPosition gallery video headline featured trending breaking";

export default async function HomePage() {
  await connectToDatabase();

  // Fetch active ads
  const activeAds = await getAds({ status: "active" });
  const headerAds = activeAds.filter((ad) => ad.placement === "header");
  const sidebarAds = activeAds.filter((ad) => ad.placement === "sidebar");
  const inlineAds = activeAds.filter((ad) => ad.placement === "inline");
  const popupAds = activeAds.filter((ad) => ad.placement === "popup");
  const stickyAds = activeAds.filter((ad) => ad.placement === "sticky");
  const mobileAds = activeAds.filter((ad) => ad.placement === "mobile");

  // Fetch all enabled homepage sections
  const sections = await HomepageLayout.find({ enabled: true })
    .populate("categoryId", "name slug")
    .sort({ order: 1 })
    .lean();

  // Fetch lead articles for the hero
  const leadArticles = await News.find({
    lead: true,
    status: "published",
  })
    .select(`${ARTICLE_CARD_FIELDS} lead`)
    .populate("categoryId", "name slug")
    .sort({ leadPosition: 1 })
    .limit(12)
    .lean();

  // Fetch published articles assigned to Headline Groups (Top Headlines, Editor's Pick, etc.)
  const headlineGroupArticles = await News.find({
    status: "published",
    headline: { $ne: null, $nin: ["none", ""] },
  })
    .select(ARTICLE_CARD_FIELDS)
    .populate("categoryId", "name slug")
    .sort({ publishDate: -1 })
    .limit(9)
    .lean();

  // Fetch Editor's Featured Pick articles
  const featuredArticles = await News.find({
    status: "published",
    featured: true,
  })
    .select(ARTICLE_CARD_FIELDS)
    .populate("categoryId", "name slug")
    .sort({ publishDate: -1 })
    .limit(6)
    .lean();

  // Fetch Trending Articles Panel items
  const trendingArticles = await News.find({
    status: "published",
    trending: true,
  })
    .select(ARTICLE_CARD_FIELDS)
    .populate("categoryId", "name slug")
    .sort({ publishDate: -1 })
    .limit(6)
    .lean();

  // Pre-fetch articles for each section
  const sectionData = await Promise.all(
    sections.map(async (section: any) => {
      const query: any = { status: "published" };

      // Apply filters
      if (section.filters) {
        if (section.filters.featured) query.featured = true;
        if (section.filters.trending) query.trending = true;
        if (section.filters.breaking) query.breaking = true;
        if (section.filters.hasVideo) query.video = { $ne: null };
        if (section.filters.headline) query.headline = section.filters.headline;
      }

      if (section.sectionType === "trending") {
        const articles = await News.find(query)
          .select(ARTICLE_CARD_FIELDS)
          .populate("categoryId", "name slug")
          .sort({ views: -1 })
          .limit(section.postsCount || 6)
          .lean();
        return {
          section: JSON.parse(JSON.stringify(section)),
          articles: JSON.parse(JSON.stringify(articles)),
        };
      }

      if (section.sectionType === "breaking") {
        query.breaking = true;
        const articles = await News.find(query)
          .select(ARTICLE_CARD_FIELDS)
          .populate("categoryId", "name slug")
          .sort({ publishDate: -1 })
          .limit(section.postsCount || 6)
          .lean();
        return {
          section: JSON.parse(JSON.stringify(section)),
          articles: JSON.parse(JSON.stringify(articles)),
        };
      }

      if (section.sectionType === "featured") {
        query.featured = true;
        const articles = await News.find(query)
          .select(ARTICLE_CARD_FIELDS)
          .populate("categoryId", "name slug")
          .sort({ publishDate: -1 })
          .limit(section.postsCount || 6)
          .lean();
        return {
          section: JSON.parse(JSON.stringify(section)),
          articles: JSON.parse(JSON.stringify(articles)),
        };
      }

      if (section.sectionType === "videoGallery") {
        query.video = { $ne: null };
        const articles = await News.find(query)
          .select(ARTICLE_CARD_FIELDS)
          .populate("categoryId", "name slug")
          .sort({ publishDate: -1 })
          .limit(section.postsCount || 6)
          .lean();
        return {
          section: JSON.parse(JSON.stringify(section)),
          articles: JSON.parse(JSON.stringify(articles)),
        };
      }

      if (section.sectionType === "photoGallery") {
        query.gallery = { $ne: [] };
        const articles = await News.find(query)
          .select(ARTICLE_CARD_FIELDS)
          .populate("categoryId", "name slug")
          .sort({ publishDate: -1 })
          .limit(section.postsCount || 6)
          .lean();
        return {
          section: JSON.parse(JSON.stringify(section)),
          articles: JSON.parse(JSON.stringify(articles)),
        };
      }

      if (section.categoryId) {
        query.categoryId = section.categoryId._id || section.categoryId;
      }

      const articles = await News.find(query)
        .select(ARTICLE_CARD_FIELDS)
        .populate("categoryId", "name slug")
        .sort({ publishDate: -1 })
        .limit(section.postsCount || 6)
        .lean();

      return {
        section: JSON.parse(JSON.stringify(section)),
        articles: JSON.parse(JSON.stringify(articles)),
      };
    }),
  );

  const safeLeads = JSON.parse(JSON.stringify(leadArticles));
  const safeHeadlineArticles = JSON.parse(JSON.stringify(headlineGroupArticles));
  const safeFeaturedArticles = JSON.parse(JSON.stringify(featuredArticles));
  const safeTrendingArticles = JSON.parse(JSON.stringify(trendingArticles));
  const activePoll = await getActivePoll();

  // Function to find an ad for a specific section's adPlacement
  const getAdForPlacement = (placement: string | undefined) => {
    if (!placement) return undefined;
    return activeAds.find((ad) => ad.placement === placement);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {/* Lead Stories Hero */}
          {safeLeads.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Main Lead */}
              {safeLeads[0] && (
                <div className="md:col-span-2 md:row-span-2">
                  <Link
                    href={`/news/${safeLeads[0].slug}`}
                    className="group block relative rounded-xl overflow-hidden aspect-[16/10] bg-gray-200"
                  >
                    <Image
                      src={safeLeads[0].featuredImage}
                      alt={safeLeads[0].title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {safeLeads[0].categoryId?.name && (
                          <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded inline-block">
                            {safeLeads[0].categoryId.name}
                          </span>
                        )}
                        {safeLeads[0].headline && safeLeads[0].headline !== "none" && (
                          <span className="text-xs font-bold bg-amber-500 text-white px-2 py-1 rounded inline-block">
                            {safeLeads[0].headline}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight group-hover:underline">
                        {safeLeads[0].title}
                      </h2>
                      {safeLeads[0].summary && (
                        <p className="text-sm text-gray-200 mt-2 line-clamp-2">
                          {safeLeads[0].summary}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              )}

              {/* Secondary Leads */}
              <div className="flex flex-col gap-4">
                {safeLeads.slice(1, 3).map((article: any) => (
                  <Link
                    key={article._id}
                    href={`/news/${article.slug}`}
                    className="group block relative rounded-xl overflow-hidden aspect-[16/9] bg-gray-200"
                  >
                    <Image
                      src={article.featuredImage}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {article.headline && article.headline !== "none" && (
                        <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded mb-1 inline-block">
                          {article.headline}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-white leading-snug group-hover:underline line-clamp-2">
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Header Ad After Hero */}
          {headerAds.length > 0 && (
            <AdCarousel ads={headerAds} className="max-w-4xl mx-auto" />
          )}

          {/* Secondary Lead Row */}
          {safeLeads.length > 3 && (
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {safeLeads.slice(3, 12).map((article: any) => (
                <Link
                  key={article._id}
                  href={`/news/${article.slug}`}
                  className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={article.featuredImage}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {article.categoryId?.name && (
                        <span className="text-[10px] font-bold text-primary uppercase">
                          {article.categoryId.name}
                        </span>
                      )}
                      {article.headline && article.headline !== "none" && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          {article.headline}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 mt-1 line-clamp-2 group-hover:text-primary transition">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {/* Editor's Featured Pick Section */}
          {safeFeaturedArticles.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 border-l-4 border-purple-600 pl-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Editor's Featured Picks
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {safeFeaturedArticles.map((article: any) => (
                  <Link
                    key={article._id}
                    href={`/news/${article.slug}`}
                    className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video">
                        <Image
                          src={article.featuredImage}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded">
                            Featured
                          </span>
                          {article.categoryId?.name && (
                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                              {article.categoryId.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                          {article.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Trending Articles Panel Section */}
          {safeTrendingArticles.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 border-l-4 border-blue-600 pl-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Trending Articles Panel
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {safeTrendingArticles.map((article: any) => (
                  <Link
                    key={article._id}
                    href={`/news/${article.slug}`}
                    className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video">
                        <Image
                          src={article.featuredImage}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
                            Trending
                          </span>
                          {article.categoryId?.name && (
                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                              {article.categoryId.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                          {article.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Headline Groups Highlights */}
          {safeHeadlineArticles.length > 0 && (
            <section className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900 border-l-4 border-amber-500 pl-3">
                  Top Headline Groups
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {safeHeadlineArticles.map((article: any) => (
                  <Link
                    key={article._id}
                    href={`/news/${article.slug}`}
                    className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video">
                        <Image
                          src={article.featuredImage}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded">
                            {article.headline}
                          </span>
                          {article.categoryId?.name && (
                            <span className="text-[10px] font-bold text-gray-500 uppercase">
                              {article.categoryId.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                          {article.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Dynamic Sections */}
          {sectionData.map(({ section, articles }, index) => (
            <div
              key={section._id}
              className="space-y-4"
              style={
                section.backgroundColor
                  ? { backgroundColor: section.backgroundColor }
                  : {}
              }
            >
              {section.adPlacement === "top" && (
                <Ad
                  ad={activeAds.find((a) => a.placement === "inline")!}
                  className="max-w-4xl mx-auto"
                />
              )}
              <HomepageSection section={section} articles={articles} />
              {(section.adPlacement === "bottom" ||
                section.adPlacement === "inline") && (
                <Ad
                  ad={activeAds.find((a) => a.placement === "inline")!}
                  className="max-w-4xl mx-auto"
                />
              )}
            </div>
          ))}

          {/* Poll Widget */}
          {activePoll && (
            <section className="max-w-md mx-auto">
              <PollWidget poll={activePoll} />
            </section>
          )}
        </div>

        {/* Sidebar */}
        {sidebarAds.length > 0 && (
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            {sidebarAds.map((ad) => (
              <Ad key={ad._id.toString()} ad={ad} />
            ))}
          </div>
        )}
      </div>
      {/* Global ads */}
      {popupAds.map((ad) => (
        <Ad key={ad._id.toString()} ad={ad} />
      ))}
      {stickyAds.map((ad) => (
        <Ad key={ad._id.toString()} ad={ad} />
      ))}
      {mobileAds.map((ad) => (
        <Ad key={ad._id.toString()} ad={ad} />
      ))}
    </div>
  );
}
