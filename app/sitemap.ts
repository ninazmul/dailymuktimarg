import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";
import Category from "@/lib/database/models/category.model";
import PageModel from "@/lib/database/models/page.model";
import Gallery from "@/lib/database/models/gallery.model";

export const dynamic = "force-dynamic";

function toAbsolute(urlOrPath: string, base: string): string {
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  const cleanBase = base.replace(/\/$/, "");
  const cleanPath = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
  return `${cleanBase}${cleanPath}`;
}

function computeChangeFreq(
  publishDate?: Date | string,
  updatedAt?: Date | string,
): MetadataRoute.Sitemap[number]["changeFrequency"] {
  const now = Date.now();
  const pubTime = publishDate ? new Date(publishDate).getTime() : now;
  const updTime = updatedAt ? new Date(updatedAt).getTime() : pubTime;
  const ageHours = (now - Math.max(pubTime, updTime)) / (1000 * 60 * 60);

  if (ageHours < 48) return "hourly";
  if (ageHours < 24 * 7) return "daily";
  if (ageHours < 24 * 30) return "weekly";
  if (ageHours < 24 * 365) return "monthly";
  return "yearly";
}

function computePriority(
  publishDate?: Date | string,
  isFeatured?: boolean,
  isBreaking?: boolean,
): number {
  const now = Date.now();
  const pubTime = publishDate ? new Date(publishDate).getTime() : now;
  const ageDays = (now - pubTime) / (1000 * 60 * 60 * 24);

  let priority = 0.6;
  if (ageDays < 1) priority = 1.0;
  else if (ageDays < 2) priority = 0.95;
  else if (ageDays < 3) priority = 0.9;
  else if (ageDays < 7) priority = 0.85;
  else if (ageDays < 14) priority = 0.8;
  else if (ageDays < 30) priority = 0.75;
  else if (ageDays < 90) priority = 0.7;
  else if (ageDays < 365) priority = 0.65;

  if (isBreaking) priority = Math.min(1.0, priority + 0.05);
  if (isFeatured) priority = Math.min(1.0, priority + 0.03);
  return Math.round(priority * 100) / 100;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectToDatabase();

  const baseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    "https://dailymuktimarg.com";

  const articles = await News.find({ status: "published" })
    .select(
      "slug updatedAt publishDate featuredImage title seoTitle featured breaking keywords",
    )
    .sort({ publishDate: -1 })
    .limit(5000)
    .lean<any[]>();

  const articleUrls: MetadataRoute.Sitemap = articles.map((article) => {
    const articleUrl = `${baseUrl}/news/${article.slug}`;
    const lastMod = article.updatedAt
      ? new Date(article.updatedAt)
      : article.publishDate
        ? new Date(article.publishDate)
        : new Date();
    const imageEntry: string[] | undefined = article.featuredImage
      ? [toAbsolute(article.featuredImage, baseUrl)]
      : undefined;

    return {
      url: articleUrl,
      lastModified: lastMod,
      changeFrequency: computeChangeFreq(
        article.publishDate,
        article.updatedAt,
      ),
      priority: computePriority(
        article.publishDate,
        article.featured,
        article.breaking,
      ),
      images: imageEntry,
      alternates: {
        languages: {
          "x-default": articleUrl,
          "bn-BD": articleUrl,
          en: articleUrl,
        },
      },
    };
  });

  const categories = await Category.find()
    .select("slug updatedAt")
    .lean<any[]>();
  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
    alternates: {
      languages: {
        "bn-BD": `${baseUrl}/category/${cat.slug}`,
        en: `${baseUrl}/category/${cat.slug}`,
        "x-default": `${baseUrl}/category/${cat.slug}`,
      },
    },
  }));

  const pages = await PageModel.find({ status: "published" })
    .select("slug updatedAt featuredImage title")
    .lean<any[]>();
  const pageUrls = pages.map((page) => ({
    url: `${baseUrl}/pages/${page.slug}`,
    lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
    images: page.featuredImage
      ? [toAbsolute(page.featuredImage, baseUrl)]
      : undefined,
  }));

  const galleries = await Gallery.find({ status: "published" })
    .select("slug updatedAt featuredImage title")
    .lean<any[]>();
  const galleryListUrl = {
    url: `${baseUrl}/gallery`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.75,
    alternates: {
      languages: {
        "bn-BD": `${baseUrl}/gallery`,
        en: `${baseUrl}/gallery`,
        "x-default": `${baseUrl}/gallery`,
      },
    },
  };
  const galleryDetailUrls = galleries.map((g: any) => ({
    url: `${baseUrl}/gallery/${g.slug}`,
    lastModified: g.updatedAt ? new Date(g.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
    images: g.featuredImage
      ? [toAbsolute(g.featuredImage, baseUrl)]
      : undefined,
  }));

  const staticExtras: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/todays-news`,
      lastModified: new Date(),
      changeFrequency: "always" as const,
      priority: 0.95,
      alternates: {
        languages: {
          "bn-BD": `${baseUrl}/todays-news`,
          en: `${baseUrl}/todays-news`,
          "x-default": `${baseUrl}/todays-news`,
        },
      },
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "always" as const,
      priority: 0.7,
      alternates: {
        languages: {
          "bn-BD": `${baseUrl}/search`,
          en: `${baseUrl}/search`,
        },
      },
    },
    {
      url: `${baseUrl}/feed.xml`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.9,
    },
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "always" as const,
      priority: 1.0,
      alternates: {
        languages: {
          "bn-BD": baseUrl,
          en: baseUrl,
          "x-default": baseUrl,
        },
      },
    },
    ...staticExtras,
    galleryListUrl,
    ...categoryUrls,
    ...galleryDetailUrls,
    ...articleUrls,
    ...pageUrls,
  ];
}
