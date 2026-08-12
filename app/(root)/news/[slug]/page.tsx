import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, Tag, User, Play } from "lucide-react";
import type { Metadata } from "next";
import { getAds } from "@/lib/actions/ad.actions";
import Ad from "@/components/shared/Ad";
import { getVideoEmbedUrl } from "@/lib/utils";
import FramedImageWithDownload from "@/components/shared/FramedImageWithDownload";
import {
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
  const article = await News.findOne({ slug, status: "published" })
    .populate("categoryId", "name slug")
    .populate("authorId", "name")
    .lean<any>();

  if (!article) {
    return {
      title: buildPageTitle("সংবাদ পাওয়া যায়নি", seoRes.siteBrand),
      robots: buildRobots({ index: false }),
    };
  }

  const pageTitle = article.seoTitle || article.title;
  const description =
    article.metaDescription || article.summary || article.title;
  const articleUrl = `${seoRes.canonicalUrlBase}/news/${article.slug}`;
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

  return {
    title: pageTitle,
    description,
    keywords: article.keywords?.join(", "),
    alternates: {
      canonical: `/news/${article.slug}`,
    },
    robots: buildRobots(),
    openGraph: {
      title: pageTitle,
      description,
      url: articleUrl,
      siteName: "দৈনিক মুক্তিমার্গ",
      locale: "bn_BD",
      type: "article",
      publishedTime: publishISO,
      modifiedTime: modifiedISO,
      authors: article.authorId?.name ? [article.authorId.name] : undefined,
      section: article.categoryId?.name || undefined,
      tags: Array.isArray(article.keywords) ? article.keywords : undefined,
      images: absoluteFeatured
        ? [
            {
              url: absoluteFeatured,
              width: 1200,
              height: 675,
              alt: article.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
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

  const [article, activeAds] = await Promise.all([
    News.findOneAndUpdate(
      { slug, status: "published" },
      { $inc: { views: 1 } },
      { returnDocument: "after" },
    )
      .populate("categoryId", "name slug")
      .populate("tags", "name slug")
      .populate("authorId", "name")
      .populate("reporterId", "name")
      .lean<any>(),
    getAds({ status: "active" }),
  ]);

  if (!article) notFound();

  const sidebarAds = activeAds.filter((ad) => ad.placement === "sidebar");
  const inlineAds = activeAds.filter((ad) => ad.placement === "inline");

  // Related articles
  const related = await News.find({
    status: "published",
    categoryId: article.categoryId?._id,
    _id: { $ne: article._id },
  })
    .populate("categoryId", "name slug")
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${articleUrl}#newsArticle`,
    headline: article.seoTitle || article.title,
    alternativeHeadline:
      article.seoTitle && article.seoTitle !== article.title
        ? article.title
        : undefined,
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
          },
        ]
      : undefined,
    thumbnailUrl: absoluteFeatured || undefined,
    datePublished: article.publishDate
      ? new Date(article.publishDate).toISOString()
      : new Date().toISOString(),
    dateModified: article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : article.publishDate
        ? new Date(article.publishDate).toISOString()
        : new Date().toISOString(),
    author: article.authorId?.name
      ? {
          "@type": "Person",
          name: article.authorId.name,
        }
      : {
          "@type": "Organization",
          name: brand,
        },
    contributor:
      Array.isArray(article.tags) && article.tags.length
        ? article.tags.map((t: string) => ({
            "@type": "Organization",
            name: t,
          }))
        : undefined,
    editor: article.authorId?.name || brand,
    publisher: {
      "@id": `${canonicalBase}/#organization`,
      "@type": "NewsMediaOrganization",
      name: brand,
      alternateName: brandEn,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
        width: 512,
        height: 512,
      },
      url: `${canonicalBase}/`,
    },
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
    hasPart: article.videoUrl
      ? {
          "@type": "Clip",
          url: article.videoUrl,
        }
      : undefined,
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
          {/* Structured Markup */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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

          {/* Category Badge */}
          {article.categoryId && (
            <Link
              href={`/category/${article.categoryId.slug}`}
              className="inline-block text-xs font-bold bg-primary text-white px-3 py-1 rounded-full mb-3"
            >
              {article.categoryId.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-2">
            {article.title}
          </h1>

          {/* Subtitle */}
          {article.subtitle && (
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
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
              Report:{" "}
              <span className="font-semibold">{article.reporterId.name}</span>
            </p>
          )}
        </div>

        {/* Sidebar */}
        {(sidebarAds.length > 0 ||
          safeRelated.length > 0 ||
          safeLatest.length > 0 ||
          safeMostViewed.length > 0) && (
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Advertisements */}
            {sidebarAds.map((ad) => (
              <Ad key={ad._id.toString()} ad={ad} />
            ))}

            {/* Related Articles on Sidebar */}
            {safeRelated.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-800 border-l-4 border-primary pl-3">
                  Related Articles
                </h2>
                <div className="flex flex-col gap-3">
                  {safeRelated.map((rel: any) => (
                    <Link
                      key={rel._id}
                      href={`/news/${rel.slug}`}
                      className="group flex gap-3 bg-white rounded-xl border p-2.5 hover:shadow-md transition"
                    >
                      <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <Image
                          src={rel.featuredImage || "/assets/images/logo.png"}
                          alt={rel.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        {rel.categoryId?.name && (
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                            {rel.categoryId.name}
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                          {rel.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Articles on Sidebar */}
            {safeRelated.length < 3 && safeLatest.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-800 border-l-4 border-blue-600 pl-3">
                  Latest News
                </h2>
                <div className="flex flex-col gap-3">
                  {safeLatest.map((item: any) => (
                    <Link
                      key={item._id}
                      href={`/news/${item.slug}`}
                      className="group flex gap-3 bg-white rounded-xl border p-2.5 hover:shadow-md transition"
                    >
                      <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <Image
                          src={item.featuredImage || "/assets/images/logo.png"}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        {item.categoryId?.name && (
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                            {item.categoryId.name}
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                          {item.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Most Viewed Articles Widget on Sidebar */}
            {safeMostViewed.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-800 border-l-4 border-amber-500 pl-3">
                  Most Read Articles
                </h2>
                <div className="flex flex-col gap-3">
                  {safeMostViewed.map((item: any, idx: number) => (
                    <Link
                      key={item._id}
                      href={`/news/${item.slug}`}
                      className="group flex gap-3 bg-white rounded-xl border p-2.5 hover:shadow-md transition items-center"
                    >
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <Image
                          src={item.featuredImage || "/assets/images/logo.png"}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          {item.views || 0} views
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
