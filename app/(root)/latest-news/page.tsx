import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAds } from "@/lib/actions/ad.actions";
import Ad from "@/components/shared/Ad";
import NewsSidebar from "@/components/shared/NewsSidebar";
import {
  SEO_DEFAULTS,
  buildPageTitle,
  buildRobots,
  getSeoInfo,
  toAbsoluteUrl,
} from "@/lib/seo";

const ARTICLE_CARD_FIELDS =
  "title slug summary featuredImage categoryId nestedCategoryId publishDate";

interface PageProps {
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoInfo();
  const pageTitle = "সর্বশেষ সংবাদ";
  const desc = `সর্বশেষ প্রকাশিত সকল সংবাদ ও প্রতিবেদন। ${seo.siteBrand}।`;
  const absoluteOg = toAbsoluteUrl(seo.ogImage, seo.canonicalUrlBase);
  return {
    title: buildPageTitle(pageTitle, seo.siteBrand),
    description: desc,
    alternates: {
      canonical: `/latest-news`,
    },
    robots: buildRobots(),
    openGraph: {
      title: buildPageTitle(pageTitle, seo.siteBrand),
      description: desc,
      url: `${seo.canonicalUrlBase}/latest-news`,
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
      images: seo.twitterCardImage
        ? ([toAbsoluteUrl(seo.twitterCardImage, seo.canonicalUrlBase)].filter(
          Boolean,
        ) as string[])
        : undefined,
      creator: "@dailymuktimarg",
      site: "@dailymuktimarg",
    },
  };
}

export default async function LatestNewsPage({ searchParams }: PageProps) {
  const resolvedSearch = (await searchParams) ?? {};
  const page = parseInt(resolvedSearch.page || "1") || 1;
  const limit = 12;

  await connectToDatabase();

  const [activeAds, seo] = await Promise.all([
    getAds({ status: "active" }),
    getSeoInfo(),
  ]);

  const sidebarAds = activeAds.filter((ad) => ad.placement === "sidebar");
  const inlineAds = activeAds.filter((ad) => ad.placement === "inline");

  const query = { status: "published" };

  const [articles, totalCount, mostViewed, trendingNews] = await Promise.all([
    News.find(query)
      .select(ARTICLE_CARD_FIELDS)
      .populate("categoryId", "name slug")
      .populate("nestedCategoryId", "name slug")
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<any[]>(),
    News.countDocuments(query),
    News.find(query)
      .select(ARTICLE_CARD_FIELDS)
      .populate("categoryId", "name slug")
      .sort({ views: -1 })
      .limit(5)
      .lean<any[]>(),
    News.find({ ...query, trending: true })
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

  // Fallback for trending if not enough tagged articles
  if (safeTrending.length === 0) {
    const fallbackTrending = await News.find(query)
      .select(ARTICLE_CARD_FIELDS)
      .populate("categoryId", "name slug")
      .sort({ views: -1, publishDate: -1 })
      .skip(5)
      .limit(5)
      .lean<any[]>();
    safeTrending = JSON.parse(JSON.stringify(fallbackTrending));
  }

  const brand = seo.siteBrand || SEO_DEFAULTS.siteBrand;
  const canonicalBase =
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    SEO_DEFAULTS.canonicalUrlBase;
  const pageUrl = `${canonicalBase}/latest-news`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: brand,
        item: canonicalBase,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "সর্বশেষ সংবাদ",
        item: pageUrl,
      },
    ],
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": pageUrl,
    name: "সর্বশেষ সংবাদ",
    description: `সর্বশেষ প্রকাশিত সকল সংবাদ ও প্রতিবেদন। ${brand}।`,
    inLanguage: "bn-BD",
    url: pageUrl,
    isPartOf: { "@id": `${canonicalBase}/#website` },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-primary">
              {brand}
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-semibold">সর্বশেষ সংবাদ</span>
          </nav>

          {/* Page Header */}
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-3xl font-black text-gray-800 border-l-4 border-primary pl-4">
              সর্বশেষ সংবাদ
            </h1>
            {/* Live indicator */}
            <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              লাইভ
            </span>
          </div>

          {/* Total count info */}
          {totalCount > 0 && (
            <p className="text-sm text-gray-500 mb-6">
              মোট{" "}
              <span className="font-semibold text-gray-700">
                {toBn(totalCount)}
              </span>{" "}
              টি সংবাদ পাওয়া গেছে
            </p>
          )}

          {safeArticles.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              কোনো সংবাদ পাওয়া যায়নি।
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {safeArticles.map((article: any) => (
                <Link
                  key={article._id}
                  href={`/news/${article.slug}`}
                  className="group bg-white rounded-xl border overflow-hidden hover:shadow-lg transition"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={article.featuredImage || "/assets/images/logo.png"}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    {(article.nestedCategoryId?.name ||
                      article.categoryId?.name) && (
                        <span className="text-[10px] font-bold text-primary uppercase">
                          {article.nestedCategoryId?.name ||
                            article.categoryId.name}
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
          )}

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
                  href={`/latest-news?page=${page - 1}`}
                  className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                >
                  ← আগের পাতা
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-gray-500">
                পাতা {toBn(page)} / {toBn(totalPages)}
              </span>
              {page < totalPages && (
                <Link
                  href={`/latest-news?page=${page + 1}`}
                  className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                >
                  পরের পাতা →
                </Link>
              )}
            </div>
          )}
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
