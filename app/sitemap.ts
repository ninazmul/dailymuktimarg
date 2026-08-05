import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";
import Category from "@/lib/database/models/category.model";
import PageModel from "@/lib/database/models/page.model";
import Gallery from "@/lib/database/models/gallery.model";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectToDatabase();

  const baseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    "https://dailymuktimarg.com";

  const articles = await News.find({ status: "published" })
    .select("slug updatedAt publishDate")
    .sort({ publishDate: -1 })
    .limit(5000)
    .lean<any[]>();

  const articleUrls = articles.map((article) => ({
    url: `${baseUrl}/news/${article.slug}`,
    lastModified: article.updatedAt
      ? new Date(article.updatedAt)
      : article.publishDate
        ? new Date(article.publishDate)
        : new Date(),
    changeFrequency:
      article.publishDate &&
      Date.now() - new Date(article.publishDate).getTime() < 1000 * 60 * 60 * 48
        ? ("hourly" as const)
        : ("yearly" as const),
    priority:
      article.publishDate &&
      Date.now() - new Date(article.publishDate).getTime() <
        1000 * 60 * 60 * 24 * 7
        ? 0.9
        : 0.6,
    alternates: {
      languages: { "bn-BD": `${baseUrl}/news/${article.slug}` },
    },
  }));

  const categories = await Category.find()
    .select("slug updatedAt")
    .lean<any[]>();
  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
    alternates: {
      languages: { "bn-BD": `${baseUrl}/category/${cat.slug}` },
    },
  }));

  const pages = await PageModel.find({ status: "published" })
    .select("slug updatedAt")
    .lean<any[]>();
  const pageUrls = pages.map((page) => ({
    url: `${baseUrl}/pages/${page.slug}`,
    lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const galleries = await Gallery.find({ status: "published" })
    .select("slug updatedAt")
    .lean<any[]>();
  const galleryListUrl = {
    url: `${baseUrl}/gallery`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.75,
    alternates: {
      languages: { "bn-BD": `${baseUrl}/gallery` },
    },
  };
  const galleryDetailUrls = galleries.map((g: any) => ({
    url: `${baseUrl}/gallery/${g.slug}`,
    lastModified: g.updatedAt ? new Date(g.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const staticExtras: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/todays-news`,
      lastModified: new Date(),
      changeFrequency: "always" as const,
      priority: 0.95,
      alternates: { languages: { "bn-BD": `${baseUrl}/todays-news` } },
    },
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "always" as const,
      priority: 1.0,
      alternates: { languages: { "bn-BD": baseUrl } },
    },
    ...staticExtras,
    galleryListUrl,
    ...categoryUrls,
    ...galleryDetailUrls,
    ...articleUrls,
    ...pageUrls,
  ];
}
