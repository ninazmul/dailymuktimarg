import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, Tag, User, Play } from "lucide-react";
import type { Metadata } from "next";
import { getAds } from "@/lib/actions/ad.actions";
import Ad from "@/components/shared/Ad";
import NewsSidebar from "@/components/shared/NewsSidebar";
import { getVideoEmbedUrl } from "@/lib/utils";
import FramedImageWithDownload from "@/components/shared/FramedImageWithDownload";
import {
  SEO_DEFAULTS,
  buildPageTitle,
  buildRobots,
  getSeoInfo,
  toAbsoluteUrl,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [seoRes, _db] = await Promise.all([getSeoInfo(), connectToDatabase()]);
  const metadataBase = new URL(seoRes.canonicalUrlBase);

  const article = await News.findOne({ slug, status: "published" })
    .populate("categoryId", "name slug")
    .populate("authorId", "name")
    .lean<any>();

  if (!article) {
    return {
      metadataBase,
      title: buildPageTitle("সংবাদ পাওয়া যায়নি", seoRes.siteBrand),
      robots: buildRobots({ index: false }),
    };
  }

  const pageTitle = article.seoTitle || article.title;
  const formattedTitle = buildPageTitle(pageTitle, seoRes.siteBrand);
  const description =
    article.metaDescription || article.summary || article.title;
  const articleUrl = `${seoRes.canonicalUrlBase}/news/${article.slug}`;
  const canonical =
    article.canonicalUrl && article.canonicalUrl.trim() !== ""
      ? article.canonicalUrl
      : articleUrl;
  const absoluteFeatured = toAbsoluteUrl(
    article.featuredImage,
    seoRes.canonicalUrlBase,
  );

  const publishISO = article.publishDate
    ? new Date(article.publishDate).toISOString()
    : undefined;
  const modifiedISO = article.updatedAt
    ? new Date(article.updatedAt).toISOString()
    : publishISO;

  const mergedKeywords =
    Array.isArray(article.keywords) && article.keywords.length
      ? article.keywords
      : seoRes.siteKeywords.slice(0, 10);

  return {
    metadataBase,
    title: formattedTitle,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical,
      languages: {
        "x-default": articleUrl,
        "bn-BD": articleUrl,
      },
    },
    robots: buildRobots(),
    category: article.categoryId?.name || SEO_DEFAULTS.category,
    authors: article.authorId?.name
      ? [{ name: article.authorId.name }]
      : SEO_DEFAULTS.authors,
    creator: SEO_DEFAULTS.siteName,
    publisher: SEO_DEFAULTS.publisher,
    openGraph: {
      title: formattedTitle,
      description,
      url: articleUrl,
      siteName: seoRes.siteBrand || "দৈনিক মুক্তিমার্গ",
      locale: "bn_BD",
      type: "article",
      determiner: "auto",
      publishedTime: publishISO,
      modifiedTime: modifiedISO,
      authors: article.authorId?.name
        ? [article.authorId.name]
        : [seoRes.siteBrand || "দৈনিক মুক্তিমার্গ"],
      section: article.categoryId?.name || undefined,
      tags:
        Array.isArray(article.keywords) && article.keywords.length
          ? article.keywords
          : seoRes.siteKeywords.slice(0, 8),
      images: absoluteFeatured
        ? [
          {
            url: absoluteFeatured,
            width: 1200,
            height: 675,
            alt: article.title,
            type: "image/webp",
            secureUrl: absoluteFeatured,
          },
        ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: formattedTitle,
      description,
      images: absoluteFeatured ? [absoluteFeatured] : undefined,
      creator: "@dailymuktimarg",
      site: "@dailymuktimarg",
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  await connectToDatabase();

  const [article, activeAds, trending] = await Promise.all([
    News.findOneAndUpdate(
      { slug, status: "published" },
      { $inc: { views: 1 } },
      { returnDocument: "after" },
    )
      .populate("categoryId", "name slug")
      .populate("nestedCategoryId", "name slug")
      .populate("categoryIds", "name slug")
      .populate("nestedCategoryIds", "name slug")
      .populate("tags", "name slug")
      .populate("authorId", "name")
      .populate("reporterId", "name")
      .lean<any>(),
    getAds({ status: "active" }),
    News.find({ status: "published", trending: true })
      .populate("categoryId", "name slug")
      .sort({ publishDate: -1 })
      .limit(5)
      .lean<any[]>(),
  ]);

  if (!article) notFound();

  const sidebarAds = activeAds.filter((ad) => ad.placement === "sidebar");
  const inlineAds = activeAds.filter((ad) => ad.placement === "inline");

  // Related articles (matching any primary, secondary or multiple category)
  const allArticleCatIds = [
    article.categoryId?._id || article.categoryId,
    article.nestedCategoryId?._id || article.nestedCategoryId,
    ...(Array.isArray(article.categoryIds)
      ? article.categoryIds.map((c: any) => c?._id || c)
      : []),
    ...(Array.isArray(article.nestedCategoryIds)
      ? article.nestedCategoryIds.map((c: any) => c?._id || c)
      : []),
  ].filter(Boolean);

  const related = await News.find({
    status: "published",
    ...(allArticleCatIds.length > 0
      ? {
        $or: [
          { categoryId: { $in: allArticleCatIds } },
          { nestedCategoryId: { $in: allArticleCatIds } },
          { categoryIds: { $in: allArticleCatIds } },
          { nestedCategoryIds: { $in: allArticleCatIds } },
        ],
      }
      : {}),
    _id: { $ne: article._id },
  })
    .populate("categoryId", "name slug")
    .populate("nestedCategoryId", "name slug")
    .populate("categoryIds", "name slug")
    .populate("nestedCategoryIds", "name slug")
    .sort({ publishDate: -1 })
    .limit(6)
    .lean<any[]>();

  // Latest articles for sidebar fallback
  const latest = await News.find({
    status: "published",
    _id: { $ne: article._id },
  })
    .populate("categoryId", "name slug")
    .sort({ publishDate: -1 })
    .limit(6)
    .lean<any[]>();

  // Most viewed articles for sidebar
  const mostViewed = await News.find({
    status: "published",
    _id: { $ne: article._id },
  })
    .populate("categoryId", "name slug")
    .sort({ views: -1 })
    .limit(5)
    .lean<any[]>();

  const safeRelated = JSON.parse(JSON.stringify(related));
  const safeLatest = JSON.parse(JSON.stringify(latest));
  const safeMostViewed = JSON.parse(JSON.stringify(mostViewed));
  const safeTrending = JSON.parse(JSON.stringify(trending));
  const safeArticle = JSON.parse(JSON.stringify(article));

  const canonicalBase =
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    "https://dailymuktimarg.com";
  const brand = "দৈনিক মুক্তিমার্গ";
  const brandEn = "Daily Muktimarg";
  const articleUrl = `${canonicalBase}/news/${article.slug}`;
  const absoluteFeatured = article.featuredImage
    ? article.featuredImage.startsWith("http")
      ? article.featuredImage
      : `${canonicalBase}${article.featuredImage}`
    : null;
  const logoUrl = `${canonicalBase}/assets/images/logo.webp`;

  const tagNames =
    Array.isArray(article.tags) && article.tags.length
      ? article.tags
        .map((t: any) =>
          typeof t === "object" && t.name
            ? t.name
            : typeof t === "string"
              ? t
              : null,
        )
        .filter(Boolean)
      : [];

  const speakableContent: string[] = [];
  if (article.summary) speakableContent.push(article.summary);
  if (article.title) speakableContent.unshift(article.title);
  const speakableText = speakableContent.join(" ");

  const datePublished = article.publishDate
    ? new Date(article.publishDate).toISOString()
    : new Date().toISOString();
  const dateModified = article.updatedAt
    ? new Date(article.updatedAt).toISOString()
    : datePublished;
  const copyrightYear = new Date(datePublished).getFullYear();

  const publisherOrg = {
    "@id": `${canonicalBase}/#organization`,
    "@type": "NewsMediaOrganization",
    name: brand,
    alternateName: brandEn,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: 600,
      height: 60,
    },
    url: `${canonicalBase}/`,
    sameAs: [
      "https://twitter.com/dailymuktimarg",
      "https://facebook.com/dailymuktimarg",
    ],
    foundingDate: "2020",
  };

  const authorEntity = article.authorId?.name
    ? {
      "@type": "Person",
      name: article.authorId.name,
      url: article.reporterId
        ? `${canonicalBase}/#reporter-${article.reporterId}`
        : `${canonicalBase}/about`,
    }
    : publisherOrg;

  const videoEmbed = article.video ? getVideoEmbedUrl(article.video) : null;

  const newsArticleLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${articleUrl}#newsArticle`,
    headline: article.seoTitle || article.title,
    alternativeHeadline:
      article.seoTitle && article.seoTitle !== article.title
        ? article.title
        : article.subtitle || undefined,
    description: article.metaDescription || article.summary || article.title,
    inLanguage: "bn-BD",
    wordCount:
      typeof article.content === "string"
        ? article.content
          .replace(/<[^>]+>/g, "")
          .trim()
          .split(/\s+/).length
        : undefined,
    keywords:
      Array.isArray(article.keywords) && article.keywords.length
        ? article.keywords.join(", ")
        : undefined,
    articleSection: article.categoryId?.name || undefined,
    image: absoluteFeatured
      ? [
        {
          "@type": "ImageObject",
          url: absoluteFeatured,
          width: 1920,
          height: 1080,
          caption: article.imageCaption || article.title,
          representativeOfPage: "True",
          inLanguage: "bn-BD",
        },
      ]
      : undefined,
    thumbnailUrl: absoluteFeatured || undefined,
    datePublished,
    dateModified,
    dateline: article.location || undefined,
    author: authorEntity,
    creator: article.reporterId?.name
      ? {
        "@type": "Person",
        name: article.reporterId.name,
      }
      : authorEntity,
    contributor: tagNames.length
      ? tagNames.map((name: string) => ({
        "@type": "Organization",
        name,
      }))
      : undefined,
    editor: article.authorId?.name
      ? {
        "@type": "Person",
        name: article.authorId.name,
      }
      : {
        "@type": "Person",
        name: brand,
      },
    publisher: publisherOrg,
    sourceOrganization: publisherOrg,
    copyrightHolder: {
      "@id": `${canonicalBase}/#organization`,
    },
    copyrightYear,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    isPartOf: { "@id": `${canonicalBase}/#website` },
    articleBody:
      typeof article.content === "string"
        ? article.content
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 4000)
        : undefined,
    isAccessibleForFree: true,
    pageStart: 1,
    pageEnd: 1,
    printColumn: "online",
    printEdition: "Online Edition",
    speakable: speakableText
      ? {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".prose p:first-of-type"],
        xpath: ["/html/body/h1", "/html/body//p[1]"],
      }
      : undefined,
    video:
      videoEmbed || article.video
        ? {
          "@type": "VideoObject",
          name: article.title,
          description: article.summary || article.title,
          thumbnailUrl: absoluteFeatured || undefined,
          embedUrl: videoEmbed || undefined,
          contentUrl: article.video || undefined,
          uploadDate: datePublished,
          publisher: publisherOrg,
        }
        : undefined,
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${canonicalBase}/#website`,
    url: `${canonicalBase}/`,
    name: brand,
    alternateName: brandEn,
    inLanguage: ["bn-BD", "en-US"],
    publisher: {
      "@id": `${canonicalBase}/#organization`,
    },
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${canonicalBase}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    ],
  };

  const webpageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": articleUrl,
    url: articleUrl,
    name: article.seoTitle || article.title,
    description: article.metaDescription || article.summary || article.title,
    inLanguage: "bn-BD",
    isPartOf: { "@id": `${canonicalBase}/#website` },
    breadcrumb: {
      "@id": `${articleUrl}#breadcrumb`,
    },
    datePublished,
    dateModified,
    lastReviewed: dateModified,
    reviewedBy: article.authorId?.name
      ? {
        "@type": "Person",
        name: article.authorId.name,
      }
      : {
        "@type": "Organization",
        name: brand,
      },
    primaryImageOfPage: absoluteFeatured
      ? {
        "@type": "ImageObject",
        url: absoluteFeatured,
      }
      : undefined,
    publisher: {
      "@id": `${canonicalBase}/#organization`,
    },
    copyrightHolder: {
      "@id": `${canonicalBase}/#organization`,
    },
    copyrightYear,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${articleUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: brand,
        item: canonicalBase,
      },
      ...(article.categoryId
        ? [
          {
            "@type": "ListItem",
            position: 2,
            name: article.categoryId.name,
            item: `${canonicalBase}/category/${article.categoryId.slug}`,
          },
        ]
        : []),
      {
        "@type": "ListItem",
        position: article.categoryId ? 3 : 2,
        name: article.title,
        item: articleUrl,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(breadcrumbJsonLd),
            }}
          />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span>/</span>
            {article.categoryId && (
              <>
                <Link
                  href={`/category/${article.categoryId.slug}`}
                  className="hover:text-primary"
                >
                  {article.categoryId.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-400 truncate max-w-[250px]">
              {article.title}
            </span>
          </nav>

          {/* Category & Sub-category Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Primary category */}
            {article.categoryId && (
              <Link
                href={`/category/${article.categoryId.slug}`}
                className="inline-block text-xs font-bold bg-primary text-white px-3 py-1 rounded-full"
              >
                {article.categoryId.name}
              </Link>
            )}
            {/* Additional categories (categoryIds minus the primary one) */}
            {Array.isArray(article.categoryIds) &&
              article.categoryIds
                .filter(
                  (c: any) =>
                    c._id?.toString() !== article.categoryId?._id?.toString(),
                )
                .map((c: any) => (
                  <Link
                    key={c._id}
                    href={`/category/${c.slug}`}
                    className="inline-block text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 hover:bg-primary/20 transition"
                  >
                    {c.name}
                  </Link>
                ))}
            {/* Sub-categories */}
            {Array.isArray(article.nestedCategoryIds) &&
              article.nestedCategoryIds.map((sub: any) => (
                <Link
                  key={sub._id}
                  href={`/category/${sub.slug}`}
                  className="inline-block text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-200 transition"
                >
                  {sub.name}
                </Link>
              ))}
            {/* Legacy single nestedCategoryId fallback */}
            {!Array.isArray(article.nestedCategoryIds) &&
              article.nestedCategoryId && (
                <Link
                  href={`/category/${article.nestedCategoryId.slug}`}
                  className="inline-block text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-200 transition"
                >
                  {article.nestedCategoryId.name}
                </Link>
              )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-2">
            {article.title}
          </h1>

          {/* Subtitle */}
          {article.subtitle && (
            <h2 className="text-xl font-semibold text-primary mb-4">
              {article.subtitle}
            </h2>
          )}

          {/* Summary */}
          {article.summary && (
            <p className="text-lg text-gray-600 leading-relaxed mb-6 border-l-4 border-primary pl-4">
              {article.summary}
            </p>
          )}

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b">
            {article.location && (
              <span className="flex items-center gap-1">
                📍 {article.location}
              </span>
            )}
            {article.authorId?.name && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {article.authorId.name}
              </span>
            )}
            {article.publishDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(article.publishDate).toLocaleDateString("bn-BD", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {article.views?.toLocaleString() || 0} views
            </span>
            {article.source && (
              <span className="flex items-center gap-1">
                📰 Source: {article.source}
              </span>
            )}
          </div>

          {article.featuredImage && (
            <FramedImageWithDownload
              featuredImage={article.featuredImage}
              title={article.title}
              imageCaption={article.imageCaption}
              slug={article.slug}
            />
          )}

          {/* Video Embed */}
          {(() => {
            const videoEmbedUrl = getVideoEmbedUrl(article.video);
            if (!videoEmbedUrl) return null;
            return (
              <div className="mb-8 space-y-3">
                <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                  <Play className="w-5 h-5 fill-red-600" />
                  <span>Watch Video</span>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg border border-gray-200">
                  <iframe
                    src={videoEmbedUrl}
                    title={article.title || "Video Player"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            );
          })()}

          {/* Article Body */}
          <article
            className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Inline Ads */}
          {inlineAds.length > 0 && (
            <div className="my-8 max-w-3xl mx-auto space-y-4">
              {inlineAds.map((ad) => (
                <Ad key={ad._id.toString()} ad={ad} />
              ))}
            </div>
          )}

          {/* Image Gallery */}
          {article.gallery && article.gallery.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🖼️ ফটো গ্যালারি</span>
                <span className="text-xs font-normal text-gray-500">
                  ({article.gallery.length} photos)
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {article.gallery.map((item: any, idx: number) => {
                  const imgUrl = typeof item === "string" ? item : item?.url;
                  const caption = typeof item === "object" ? item?.caption : "";
                  if (!imgUrl) return null;

                  return (
                    <figure
                      key={idx}
                      className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      <div className="relative aspect-video w-full">
                        <Image
                          src={imgUrl}
                          alt={caption || `Gallery image ${idx + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                      {caption && (
                        <figcaption className="p-2.5 text-xs text-gray-600 font-medium bg-white border-t border-gray-100">
                          {caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t">
              <Tag className="w-4 h-4 text-gray-400" />
              {article.tags.map((tag: any) => (
                <Link
                  key={tag._id}
                  href={`/search?tag=${tag.slug}`}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Reporter Credit */}
          {article.reporterId?.name && (
            <p className="text-sm text-gray-500 mt-4">
              প্রতিবেদন:{" "}
              <span className="font-semibold">{article.reporterId.name}</span>
            </p>
          )}
        </div>

        {/* Unified Sidebar */}
        <NewsSidebar
          relatedArticles={safeRelated}
          latestArticles={safeRelated.length < 3 ? safeLatest : []}
          mostViewedArticles={safeMostViewed}
          trendingArticles={safeTrending}
          sidebarAds={sidebarAds}
        />
      </div>
    </div>
  );
}
