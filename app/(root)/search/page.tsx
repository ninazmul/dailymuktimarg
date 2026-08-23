import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";
import Category from "@/lib/database/models/category.model";
import Tag from "@/lib/database/models/tag.model";
import { getAds } from "@/lib/actions/ad.actions";
import Ad from "@/components/shared/Ad";
import NewsSidebar from "@/components/shared/NewsSidebar";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  buildPageTitle,
  buildRobots,
  getSeoInfo,
  toAbsoluteUrl,
  SEO_DEFAULTS,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    tag?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const resolved = (await searchParams) ?? {} as { q?: string; category?: string; tag?: string; page?: string };
  const seo = await getSeoInfo();
  const query = (resolved.q || "").trim();
  const cat = (resolved.category || "").trim();
  const tag = (resolved.tag || "").trim();

  let pageTitle = "খুঁজুন";
  let desc = `${seo.siteBrand}-এ সংবাদ, ক্যাটাগরি ও ট্যাগ অনুসন্ধান করুন।`;
  if (query) {
    pageTitle = `"${query}" - অনুসন্ধান ফলাফল`;
    desc = `"${query}" খুঁজে পাওয়া সংবাদ ও প্রতিবেদন।`;
  } else if (cat) {
    pageTitle = `ক্যাটাগরি: ${cat}`;
    desc = `${cat} ক্যাটাগরির সকল সংবাদ।`;
  } else if (tag) {
    pageTitle = `ট্যাগ: #${tag}`;
    desc = `#${tag} ট্যাগযুক্ত সকল সংবাদ।`;
  }
  const absoluteOg = toAbsoluteUrl(seo.ogImage, seo.canonicalUrlBase);
  return {
    title: pageTitle,
    description: desc,
    alternates: {
      canonical: "/search",
    },
    robots: buildRobots({ index: !!(query || cat || tag), follow: false }),
    openGraph: {
      title: buildPageTitle(pageTitle, seo.siteBrand),
      description: desc,
      url: seo.canonicalUrlBase + "/search",
      siteName: seo.siteBrand,
      locale: "bn_BD",
      type: "website",
      images: absoluteOg
        ? [{ url: absoluteOg, width: 1200, height: 630, alt: pageTitle }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: buildPageTitle(pageTitle, seo.siteBrand),
      description: desc,
      images: absoluteOg ? [absoluteOg] : undefined,
      creator: "@dailymuktimarg",
      site: "@dailymuktimarg",
    },
  };
}

const ARTICLE_CARD_FIELDS =
  "title slug summary featuredImage categoryId publishDate";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    tag?: string;
    page?: string;
  }>;
}) {
  const resolvedSearch = (await searchParams) ?? {};
  const query = resolvedSearch.q || "";
  const catSlug = resolvedSearch.category || "";
  const tagSlug = resolvedSearch.tag || "";
  const page = parseInt(resolvedSearch.page || "1") || 1;
  const limit = 12;

  await connectToDatabase();

  const [categories, tags, activeAds] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Tag.find().sort({ name: 1 }).lean(),
    getAds({ status: "active" }),
  ]);

  const sidebarAds = activeAds.filter((ad) => ad.placement === "sidebar");
  const inlineAds = activeAds.filter((ad) => ad.placement === "inline");

  // Construct search query
  const searchFilter: any = { status: "published" };

  if (query) {
    searchFilter.$or = [
      { title: { $regex: query, $options: "i" } },
      { slug: { $regex: query, $options: "i" } },
    ];
  }

  if (catSlug) {
    const categoryDoc: any = await Category.findOne({ slug: catSlug }).lean();
    if (categoryDoc) {
      searchFilter.categoryId = categoryDoc._id;
    }
  }

  if (tagSlug) {
    const tagDoc: any = await Tag.findOne({ slug: tagSlug }).lean();
    if (tagDoc) {
      searchFilter.tags = tagDoc._id;
    }
  }

  const [articles, totalCount, mostViewed, trendingNews] = await Promise.all([
    News.find(searchFilter)
      .select(ARTICLE_CARD_FIELDS)
      .sort({ publishDate: -1 })
      .populate("categoryId", "name slug")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<any[]>(),
    News.countDocuments(searchFilter),
    News.find({ status: "published" })
      .select(ARTICLE_CARD_FIELDS)
      .populate("categoryId", "name slug")
      .sort({ views: -1 })
      .limit(5)
      .lean<any[]>(),
    News.find({ status: "published", trending: true })
      .select(ARTICLE_CARD_FIELDS)
      .populate("categoryId", "name slug")
      .sort({ publishDate: -1 })
      .limit(5)
      .lean<any[]>(),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const safeArticles = JSON.parse(JSON.stringify(articles));
  const safeMostViewed = JSON.parse(JSON.stringify(mostViewed));
  let safeTrending = JSON.parse(JSON.stringify(trendingNews));

  if (safeTrending.length === 0) {
    const fallbackTrending = await News.find({ status: "published" })
      .select(ARTICLE_CARD_FIELDS)
      .populate("categoryId", "name slug")
      .sort({ views: -1, publishDate: -1 })
      .skip(5)
      .limit(5)
      .lean<any[]>();
    safeTrending = JSON.parse(JSON.stringify(fallbackTrending));
  }

  const canonicalBase = SEO_DEFAULTS.canonicalUrlBase;
  const brand = SEO_DEFAULTS.siteBrand;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonicalBase}/search#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: brand, item: canonicalBase },
      {
        "@type": "ListItem",
        position: 2,
        name: "অনুসন্ধান",
        item: `${canonicalBase}/search`,
      },
    ],
  };

  const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  const toBn = (n: number | string) =>
    n.toString().replace(/\d/g, (d) => bnNums[parseInt(d, 10)]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <h1 className="text-3xl font-black text-gray-800 border-l-4 border-primary pl-4 mb-8">
        Search Archive
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Filters Sidebar */}
            <div className="bg-white border rounded-xl p-5 h-fit space-y-6">
              <form method="GET" action="/search" className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Search Keywords
                  </label>
                  <input
                    type="text"
                    name="q"
                    defaultValue={query}
                    placeholder="e.g. politics, dynamic layouts..."
                    className="w-full text-sm border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-primary outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={catSlug}
                    className="w-full text-sm border rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c: any) => (
                      <option key={c._id.toString()} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    ট্যাগ
                  </label>
                  <select
                    name="tag"
                    defaultValue={tagSlug}
                    className="w-full text-sm border rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
                  >
                    <option value="">সকল ট্যাগ</option>
                    {tags.map((t: any) => (
                      <option key={t._id.toString()} value={t.slug}>
                        #{t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/95 text-white text-sm font-semibold p-2.5 rounded-lg transition"
                >
                  ফিল্টার করুন
                </button>
                <Link
                  href="/search"
                  className="block text-center text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  ফিল্টার রিসেট করুন
                </Link>
              </form>
            </div>

            {/* Results grid */}
            <div className="lg:col-span-2 space-y-6">
              {safeArticles.length === 0 ? (
                <div className="text-center p-12 border border-dashed rounded-xl text-gray-500 bg-white">
                  কোনো সংবাদ পাওয়া যায়নি। অনুগ্রহ করে অন্য কীওয়ার্ড দিয়ে চেষ্টা করুন।
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {safeArticles.map((article: any) => (
                      <Link
                        key={article._id}
                        href={`/news/${article.slug}`}
                        className="group bg-white rounded-xl border overflow-hidden hover:shadow-lg transition"
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
                          {article.categoryId?.name && (
                            <span className="text-[10px] font-bold text-primary uppercase">
                              {article.categoryId.name}
                            </span>
                          )}
                          <h3 className="text-sm font-bold text-gray-800 mt-1 line-clamp-2 group-hover:text-primary transition">
                            {article.title}
                          </h3>
                          {article.summary && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                              {article.summary}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-2">
                            {article.publishDate
                              ? new Date(article.publishDate).toLocaleDateString(
                                "bn-BD",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )
                              : ""}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Inline Ads */}
                  {inlineAds.length > 0 && (
                    <div className="my-8 max-w-3xl mx-auto space-y-4">
                      {inlineAds.map((ad) => (
                        <Ad key={ad._id.toString()} ad={ad} />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      {page > 1 && (
                        <Link
                          href={`/search?q=${query}&category=${catSlug}&tag=${tagSlug}&page=${page - 1}`}
                          className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                        >
                          ← আগের পাতা
                        </Link>
                      )}
                      <span className="px-4 py-2 text-sm text-gray-500 bg-white border rounded-lg">
                        পাতা {toBn(page)} / {toBn(totalPages)}
                      </span>
                      {page < totalPages && (
                        <Link
                          href={`/search?q=${query}&category=${catSlug}&tag=${tagSlug}&page=${page + 1}`}
                          className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                        >
                          পরের পাতা →
                        </Link>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Unified Sidebar */}
        <NewsSidebar
          mostViewedArticles={safeMostViewed}
          trendingArticles={safeTrending}
          sidebarAds={sidebarAds}
        />
      </div>
    </div>
  );
}
