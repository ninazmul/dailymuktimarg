import { getSetting } from "@/lib/actions/setting.actions";
import { getCategories } from "@/lib/actions/category.actions";
import { getTodaysNewsArticles } from "@/lib/actions/news.actions";
import { getAds } from "@/lib/actions/ad.actions";
import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";
import TodaysNewsPublicClient from "./TodaysNewsPublicClient";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "আজকের পত্রিকা | Daily Muktimarg",
  description: "আজকের প্রকাশিত সকল খবর, আপডেট এবং বিশেষ প্রতিবেদন।",
};

const ARTICLE_CARD_FIELDS =
  "title slug summary featuredImage categoryId publishDate views";

export default async function TodaysNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const setting = await getSetting();

  const layout = setting?.todaysNewsLayout || {};
  const limit = layout.postsPerPage || 24;
  const sortBy = layout.sortBy || "publishDate";
  // Must be strictly true — false/undefined both mean no sidebar
  const showSidebar = layout.showSidebar === true;

  const [categories, newsData] = await Promise.all([
    getCategories(),
    getTodaysNewsArticles({
      categoryId: resolvedParams.category,
      search: resolvedParams.search,
      page: resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1,
      limit,
      sortBy,
    }),
  ]);

  // Only fetch sidebar data when enabled in dashboard settings
  let sidebarData: {
    latestArticles: any[];
    mostViewedArticles: any[];
    sidebarAds: any[];
  } | null = null;

  if (showSidebar) {
    await connectToDatabase();

    const [latestRaw, mostViewedRaw, ads] = await Promise.all([
      News.find({ status: "published" })
        .select(ARTICLE_CARD_FIELDS)
        .populate("categoryId", "name slug")
        .sort({ publishDate: -1 })
        .limit(6)
        .lean(),

      News.find({ status: "published" })
        .select(ARTICLE_CARD_FIELDS)
        .populate("categoryId", "name slug")
        .sort({ views: -1 })
        .limit(5)
        .lean(),

      getAds({ status: "active" }),
    ]);

    const sidebarAds = (ads as any[]).filter((ad) => ad.placement === "sidebar");

    sidebarData = {
      latestArticles: JSON.parse(JSON.stringify(latestRaw)),
      mostViewedArticles: JSON.parse(JSON.stringify(mostViewedRaw)),
      sidebarAds: JSON.parse(JSON.stringify(sidebarAds)),
    };
  }

  return (
    <TodaysNewsPublicClient
      layout={layout}
      categories={categories}
      initialNewsData={newsData}
      selectedCategory={resolvedParams.category || "all"}
      searchQuery={resolvedParams.search || ""}
      sidebarData={sidebarData}
    />
  );
}
