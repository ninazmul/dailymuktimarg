
import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, Tag, User, Share2 } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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
    keywords: article.seoKeywords?.join(", "),
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  await connectToDatabase();

  const article = await News.findOneAndUpdate(
    { slug, status: "published" },
    { $inc: { views: 1 } },
    { returnDocument: "after" },
  )
    .populate("categoryId", "name slug")
    .populate("tags", "name slug")
    .populate("authorId", "name")
    .populate("reporterId", "name")
    .lean<any>();

  if (!article) notFound();

  // Related articles
  const related = await News.find({
    status: "published",
    categoryId: article.categoryId?._id,
    _id: { $ne: article._id },
  })
    .populate("categoryId", "name slug")
    .sort({ publishDate: -1 })
    .limit(4)
    .lean<any[]>();

  const safeRelated = JSON.parse(JSON.stringify(related));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dailymuktimarg.com";

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": article.featuredImage ? [article.featuredImage] : [],
    "datePublished": article.publishDate ? new Date(article.publishDate).toISOString() : new Date().toISOString(),
    "dateModified": article.updatedAt ? new Date(article.updatedAt).toISOString() : new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": article.authorId?.name || "Daily Muktimarg Editor",
    },
    "publisher": {
      "@type": "Organization",
      "name": "Daily Muktimarg",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
      },
    },
    "description": article.summary || article.seoDescription || "",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl,
      },
      ...(article.categoryId
        ? [
            {
              "@type": "ListItem",
              "position": 2,
              "name": article.categoryId.name,
              "item": `${baseUrl}/category/${article.categoryId.slug}`,
            },
          ]
        : []),
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Structured Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        {article.categoryId && (
          <>
            <Link href={`/category/${article.categoryId.slug}`} className="hover:text-primary">{article.categoryId.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-400 truncate max-w-[250px]">{article.title}</span>
      </nav>

      {/* Category Badge */}
      {article.categoryId && (
        <Link href={`/category/${article.categoryId.slug}`} className="inline-block text-xs font-bold bg-primary text-white px-3 py-1 rounded-full mb-3">
          {article.categoryId.name}
        </Link>
      )}

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
        {article.title}
      </h1>

      {/* Summary */}
      {article.summary && (
        <p className="text-lg text-gray-600 leading-relaxed mb-6 border-l-4 border-primary pl-4">
          {article.summary}
        </p>
      )}

      {/* Meta Row */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b">
        {article.authorId?.name && (
          <span className="flex items-center gap-1"><User className="w-4 h-4" />{article.authorId.name}</span>
        )}
        {article.publishDate && (
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {new Date(article.publishDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        )}
        <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{article.views?.toLocaleString() || 0} views</span>
      </div>

      {/* Featured Image */}
      {article.featuredImage && (
        <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
          <Image src={article.featuredImage} alt={article.title} fill className="object-cover" priority />
          {article.imageCaption && (
            <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 text-center">
              {article.imageCaption}
            </p>
          )}
        </div>
      )}

      {/* Article Body */}
      <article
        className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t">
          <Tag className="w-4 h-4 text-gray-400" />
          {article.tags.map((tag: any) => (
            <Link key={tag._id} href={`/search?tag=${tag.slug}`} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition">
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Reporter Credit */}
      {article.reporterId?.name && (
        <p className="text-sm text-gray-500 mt-4">
          Report: <span className="font-semibold">{article.reporterId.name}</span>
        </p>
      )}

      {/* Related Articles */}
      {safeRelated.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-black text-gray-800 border-l-4 border-primary pl-3 mb-4">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {safeRelated.map((rel: any) => (
              <Link key={rel._id} href={`/news/${rel.slug}`} className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition">
                <div className="relative aspect-video">
                  <Image src={rel.featuredImage} alt={rel.title} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">{rel.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
