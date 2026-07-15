import { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";
import Category from "@/lib/database/models/category.model";
import PageModel from "@/lib/database/models/page.model";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectToDatabase();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dailymuktimarg.com";

  // Get articles
  const articles = await News.find({ status: "published" })
    .select("slug updatedAt")
    .lean<any[]>();

  const articleUrls = articles.map((article) => ({
    url: `${baseUrl}/news/${article.slug}`,
    lastModified: article.updatedAt ? new Date(article.updatedAt) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Get categories
  const categories = await Category.find().select("slug").lean<any[]>();
  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Get static pages
  const pages = await PageModel.find({ status: "published" })
    .select("slug updatedAt")
    .lean<any[]>();
  const pageUrls = pages.map((page) => ({
    url: `${baseUrl}/pages/${page.slug}`,
    lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "always" as const,
      priority: 1.0,
    },
    ...categoryUrls,
    ...articleUrls,
    ...pageUrls,
  ];
}
