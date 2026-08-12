import { connectToDatabase } from "@/lib/database";
import Category from "@/lib/database/models/category.model";
import News from "@/lib/database/models/news.model";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAds } from "@/lib/actions/ad.actions";
import Ad from "@/components/shared/Ad";
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
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [{ slug }, seo, _db] = await Promise.all([
    params,
    getSeoInfo(),
    connectToDatabase(),
  ]);
  const cat = await Category.findOne({ slug }).lean<any>();
  if (!cat) {
    return {
      title: buildPageTitle("ক্যাটাগরি পাওয়া যায়নি", seo.siteBrand),
      robots: buildRobots({ index: false }),
    };
  }
  const pageTitle = cat.name;
  const desc =
    cat.description ||
    `${cat.name} বিভাগের সকল সংবাদ, আপডেট এবং প্রতিবেদন। ${seo.siteBrand}।`;
  const absoluteOg = toAbsoluteUrl(seo.ogImage, seo.canonicalUrlBase);
  return {
    title: pageTitle,
    description: desc,
    alternates: {
      canonical: `/category/${cat.slug}`,
    },
    robots: buildRobots(),
    openGraph: {
      title: buildPageTitle(pageTitle, seo.siteBrand),
      description: desc,
      url: `${seo.canonicalUrlBase}/category/${cat.slug}`,
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

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const page = parseInt(resolvedSearch.page || "1") || 1;
  const limit = 12;

  await connectToDatabase();

  const [category, activeAds] = await Promise.all([
    Category.findOne({ slug }).lean<any>(),
    getAds({ status: "active" }),
  ]);

  if (!category) notFound();

  const sidebarAds = activeAds.filter((ad) => ad.placement === "sidebar");
  const inlineAds = activeAds.filter((ad) => ad.placement === "inline");

  // Find all sub-categories via materialized path
  const allCatIds = [category._id];
  const descendants = await Category.find({
    path: new RegExp(`,${category.slug},`),
  }).lean<any[]>();
  descendants.forEach((d) => allCatIds.push(d._id));

  const query = {
    status: "published",
    $or: [
      { categoryId: { $in: allCatIds } },
      { nestedCategoryId: { $in: allCatIds } },
    ],
  };

  const [articles, totalCount] = await Promise.all([
    News.find(query)
      .select(ARTICLE_CARD_FIELDS)
      .populate("categoryId", "name slug")
      .populate("nestedCategoryId", "name slug")
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<any[]>(),
    News.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const safeArticles = JSON.parse(JSON.stringify(articles));

  // Sub-categories for sidebar
  const subCats = descendants.filter(
    (d) => d.parentId?.toString() === category._id.toString(),
  );

  // Build ancestor chain by walking up parentId
  const ancestors: any[] = [];
  if (category.parentId) {
    let current = await Category.findById(category.parentId).lean<any>();
    while (current) {
      ancestors.push(current);
      if (current.parentId) {
        current = await Category.findById(current.parentId).lean<any>();
      } else {
        current = null;
      }
    }
  }

  const canonicalBase =
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    SEO_DEFAULTS.canonicalUrlBase;
  const brand = SEO_DEFAULTS.siteBrand;
  const categoryUrl = `${canonicalBase}/category/${category.slug}`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${categoryUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: brand,
        item: canonicalBase,
      },
      ...(ancestors || []).reverse().map((a: any, idx: number) => ({
        "@type": "ListItem" as const,
        position: idx + 2,
        name: a.name,
        item: `${canonicalBase}/category/${a.slug}`,
      })),
      {
        "@type": "ListItem",
        position: (ancestors?.length || 0) + 2,
        name: category.name,
        item: categoryUrl,
      },
    ],
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": categoryUrl,
    name: category.name,
    description:
      category.description ||
      `${category.name} বিভাগের সকল সংবাদ, আপডেট এবং প্রতিবেদন।`,
    inLanguage: "bn-BD",
    url: categoryUrl,
    isPartOf: { "@id": `${canonicalBase}/#website` },
  };

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
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-primary">
              {brand}
            </Link>
            <span>/</span>
            {(ancestors || [])
              .slice()
              .reverse()
              .map((a: any) => (
                <span key={a._id} className="flex items-center gap-2">
                  <Link
                    href={`/category/${a.slug}`}
                    className="hover:text-primary"
                  >
                    {a.name}
                  </Link>
                  <span>/</span>
                </span>
              ))}
            <span className="text-gray-800 font-semibold">{category.name}</span>
          </nav>

          <h1 className="text-3xl font-black text-gray-800 border-l-4 border-primary pl-4 mb-6">
            {category.name}
          </h1>

          {/* Sub-category chips */}
          {subCats.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {subCats.map((sc: any) => (
                <Link
                  key={sc._id}
                  href={`/category/${sc.slug}`}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition font-medium"
                >
                  {sc.name}
                </Link>
              ))}
            </div>
          )}

          {safeArticles.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              No articles found in this category.
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
                      src={article.featuredImage}
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
                        ? new Date(article.publishDate).toLocaleDateString()
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
                  href={`/category/${slug}?page=${page - 1}`}
                  className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                >
                  ← Previous
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/category/${slug}?page=${page + 1}`}
                  className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Ads */}
        {sidebarAds.length > 0 && (
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            {sidebarAds.map((ad) => (
              <Ad key={ad._id.toString()} ad={ad} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
