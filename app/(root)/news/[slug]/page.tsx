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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  await connectToDatabase();
  const article = await News.findOne({ slug, status: "published" })
    .populate("categoryId", "name slug")
    .lean<any>();

  if (!article) return { title: "Article Not Found" };

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.summary,
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.summary,
      images: article.featuredImage ? [article.featuredImage] : [],
      type: "article",
    },
    keywords: article.keywords?.join(", "),
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

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://dailymuktimarg.com";

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    image: article.featuredImage ? [article.featuredImage] : [],
    datePublished: article.publishDate
      ? new Date(article.publishDate).toISOString()
      : new Date().toISOString(),
    dateModified: article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : new Date().toISOString(),
    author: {
      "@type": "Person",
      name: article.authorId?.name || "Daily Muktimarg Editor",
    },
    publisher: {
      "@type": "Organization",
      name: "Daily Muktimarg",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    description: article.summary || article.seoDescription || "",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      ...(article.categoryId
        ? [
          {
            "@type": "ListItem",
            position: 2,
            name: article.categoryId.name,
            item: `${baseUrl}/category/${article.categoryId.slug}`,
          },
        ]
        : []),
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

          {/* Featured Image with Photo Frame & Logo on Bottom Border */}
          {article.featuredImage && (
            <figure className="mb-10">
              {/*
               * Frame structure:
               *  ┌──────────────────────────────────┐  ← top border (bg-primary, 4px md:8px)
               *  │           [image]                │  ← left/right borders
               *  ├──────────────────────────────────┤
               *  │  ─────────── [LOGO] ───────────  │  ← bottom border band
               *  └──────────────────────────────────┘
               */}
              <div
                className="rounded-2xl bg-primary overflow-hidden"
                style={{
                  boxShadow: "0 4px 24px rgba(34,107,58,0.22), 0 1.5px 6px rgba(0,0,0,0.10)",
                }}
              >
                {/* ── Image inside full padding (all 4 sides bordered) ── */}
                <div className="p-[4px] md:p-[10px] pb-[4px] md:pb-[10px]">
                  <div className="relative">
                    {/* Top corner accents */}
                    <span className="absolute top-0 left-0 w-5 h-5 md:w-7 md:h-7 border-t-2 border-l-2 md:border-t-[3px] md:border-l-[3px] border-white/40 rounded-tl-lg pointer-events-none z-10" />
                    <span className="absolute top-0 right-0 w-5 h-5 md:w-7 md:h-7 border-t-2 border-r-2 md:border-t-[3px] md:border-r-[3px] border-white/40 rounded-tr-lg pointer-events-none z-10" />
                    {/* Bottom corner accents */}
                    <span className="absolute bottom-0 left-0 w-5 h-5 md:w-7 md:h-7 border-b-2 border-l-2 md:border-b-[3px] md:border-l-[3px] border-white/40 rounded-bl-lg pointer-events-none z-10" />
                    <span className="absolute bottom-0 right-0 w-5 h-5 md:w-7 md:h-7 border-b-2 border-r-2 md:border-b-[3px] md:border-r-[3px] border-white/40 rounded-br-lg pointer-events-none z-10" />

                    {/* Image — fully rounded on all 4 corners */}
                    <div className="relative aspect-video rounded-xl overflow-hidden">
                      <Image
                        src={article.featuredImage}
                        alt={article.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>
                </div>

                {/* ── Bottom border band: ─── LOGO ─── ── */}
                <div className="flex items-center gap-0 px-3 md:px-6 py-2 md:py-3">
                  {/* Left line */}
                  <div className="flex-1 h-[1.5px] md:h-[2px] bg-white/40 rounded-full" />

                  {/* Logo badge */}
                  <div className="mx-3 md:mx-5 flex items-center gap-2 bg-white px-4 md:px-6 py-1.5 md:py-2 rounded-full shadow-lg border-2 border-primary/20 shrink-0">
                    <Image
                      src="/assets/images/logo.webp"
                      alt="Daily Muktimarg"
                      width={120}
                      height={36}
                      className="h-5 md:h-7 w-auto object-contain"
                    />
                  </div>

                  {/* Right line */}
                  <div className="flex-1 h-[1.5px] md:h-[2px] bg-white/40 rounded-full" />
                </div>
              </div>

              {article.imageCaption && (
                <figcaption className="text-xs text-gray-500 italic mt-2 text-center bg-gray-50 py-1.5 px-3 rounded-md border border-gray-100">
                  📷 {article.imageCaption}
                </figcaption>
              )}
            </figure>
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
                <span className="text-xs font-normal text-gray-500">({article.gallery.length} photos)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {article.gallery.map((item: any, idx: number) => {
                  const imgUrl = typeof item === "string" ? item : item?.url;
                  const caption = typeof item === "object" ? item?.caption : "";
                  if (!imgUrl) return null;

                  return (
                    <figure key={idx} className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
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
        {(sidebarAds.length > 0 || safeRelated.length > 0 || safeLatest.length > 0 || safeMostViewed.length > 0) && (
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
