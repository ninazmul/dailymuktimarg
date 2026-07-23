import { getSetting } from "@/lib/actions/setting.actions";
import { getCategories } from "@/lib/actions/category.actions";
import { getTodaysNewsArticles } from "@/lib/actions/news.actions";
import TodaysNewsPublicClient from "./TodaysNewsPublicClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "আজকের পত্রিকা | Daily Muktimarg",
  description: "আজকের প্রকাশিত সকল খবর, আপডেট এবং বিশেষ প্রতিবেদন।",
};

export default async function TodaysNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const setting = await getSetting();
  const categories = await getCategories();

  const layout = setting?.todaysNewsLayout || {};
  const limit = layout.postsPerPage || 24;
  const sortBy = layout.sortBy || "publishDate";

  const newsData = await getTodaysNewsArticles({
    categoryId: resolvedParams.category,
    search: resolvedParams.search,
    page: resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1,
    limit,
    sortBy,
  });

  return (
    <TodaysNewsPublicClient
      layout={layout}
      categories={categories}
      initialNewsData={newsData}
      selectedCategory={resolvedParams.category || "all"}
      searchQuery={resolvedParams.search || ""}
    />
  );
}
