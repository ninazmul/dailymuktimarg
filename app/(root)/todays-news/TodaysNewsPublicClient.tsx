"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Newspaper,
  Search,
  Clock,
  Eye,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Flame,
  BookOpen,
} from "lucide-react";
import { ICategory } from "@/lib/database/models/category.model";

interface NewsItem {
  _id: any;
  title: string;
  subtitle?: string;
  slug: string;
  summary?: string;
  featuredImage: string;
  categoryId?: { _id: any; name: string; slug: string };
  publishDate?: string;
  views?: number;
  lead?: boolean;
}

interface SidebarData {
  latestArticles: NewsItem[];
  mostViewedArticles: NewsItem[];
  sidebarAds: any[];
}

function toBengaliNumerals(num: number | string): string {
  const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num.toString().replace(/\d/g, (digit) => bnNums[parseInt(digit, 10)]);
}

function formatPublishTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${toBengaliNumerals(formattedHours)}:${toBengaliNumerals(minutesStr)} ${ampm}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ==================== SIDEBAR COMPONENT ==================== */
function TodaysSidebar({ data }: { data: SidebarData }) {
  return (
    <aside className="w-full lg:w-80 flex-shrink-0 space-y-6 h-fit lg:sticky lg:top-24">
      {/* Sidebar Ads */}
      {data.sidebarAds.map((ad: any) =>
        ad.imageUrl ? (
          <div
            key={ad._id}
            className="rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm"
          >
            {ad.linkUrl ? (
              <Link href={ad.linkUrl} target="_blank" rel="noopener noreferrer">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title || "Advertisement"}
                  width={320}
                  height={160}
                  className="w-full object-cover"
                />
              </Link>
            ) : (
              <Image
                src={ad.imageUrl}
                alt={ad.title || "Advertisement"}
                width={320}
                height={160}
                className="w-full object-cover"
              />
            )}
          </div>
        ) : null
      )}

      {/* Latest News Widget */}
      {data.latestArticles.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="w-1 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              সর্বশেষ সংবাদ
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {data.latestArticles.map((item) => (
              <Link
                key={item._id}
                href={`/news/${item.slug}`}
                className="group flex gap-3 rounded-xl p-2 hover:bg-gray-50 transition"
              >
                <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
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
                  <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition leading-snug">
                    {item.title}
                  </h4>
                  {item.publishDate && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatPublishTime(item.publishDate)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Most Read Widget */}
      {data.mostViewedArticles.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="w-1 h-5 bg-amber-500 rounded-full" />
            <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              সর্বাধিক পঠিত
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {data.mostViewedArticles.map((item, idx) => (
              <Link
                key={item._id}
                href={`/news/${item.slug}`}
                className="group flex gap-3 items-center rounded-xl p-2 hover:bg-amber-50/60 transition"
              >
                <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center shrink-0 border border-amber-200">
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
                  <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition leading-snug">
                    {item.title}
                  </h4>
                  {item.views !== undefined && item.views > 0 && (
                    <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {toBengaliNumerals(item.views)} বার পড়া হয়েছে
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* "Today's Highlights" decorative widget */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/90 to-emerald-800 p-5 text-white shadow-lg">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-300" />
            <h3 className="font-black text-sm">আজকের হাইলাইট</h3>
          </div>
          <p className="text-xs text-emerald-100 leading-relaxed">
            আজকের সব গুরুত্বপূর্ণ সংবাদ এক জায়গায়। সর্বশেষ আপডেট পেতে নিয়মিত ভিজিট করুন।
          </p>
          <Link
            href="/todays-news"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white transition"
          >
            সব খবর দেখুন <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

/* ==================== MAIN CLIENT COMPONENT ==================== */
export default function TodaysNewsPublicClient({
  layout,
  categories,
  initialNewsData,
  selectedCategory,
  searchQuery,
  sidebarData,
}: {
  layout: any;
  categories: ICategory[];
  initialNewsData: {
    articles: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    isTodayOnly: boolean;
  };
  selectedCategory: string;
  searchQuery: string;
  sidebarData?: SidebarData | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchQuery);

  const title = layout.title || "আজকের পত্রিকা";
  const subtitle = layout.subtitle || "আজকের প্রকাশিত সকল প্রধান সংবাদ এবং আপডেট";
  const layoutStyle = layout.layoutStyle || "leadGrid";
  const showLeadHero = layout.showLeadHero !== false;
  const showCategoryFilter = layout.showCategoryFilter !== false;
  const hasSidebar = !!sidebarData;

  const articles = initialNewsData.articles || [];
  const leadArticle = showLeadHero && layoutStyle === "leadGrid" && articles.length > 0 ? articles[0] : null;
  const gridArticles = leadArticle ? articles.slice(1) : articles;

  const handleCategoryChange = (catId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (catId === "all") {
      params.delete("category");
    } else {
      params.set("category", catId);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-primary/95 via-primary to-emerald-900 text-white py-12 px-4 shadow-inner relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs sm:text-sm font-semibold">
            <Newspaper className="w-4 h-4 text-emerald-300" />
            <span>{title}</span>
            <span className="opacity-40">•</span>
            <span className="text-emerald-200">
              {toBengaliNumerals(initialNewsData.totalCount)} টি সংবাদ
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight drop-shadow-sm">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto">
            {subtitle}
          </p>

          <div className="text-xs text-emerald-200 flex items-center justify-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(new Date().toISOString())}</span>
          </div>

          {!initialNewsData.isTodayOnly && (
            <div className="inline-block bg-amber-500/20 text-amber-200 border border-amber-400/30 px-3 py-1 rounded-md text-xs font-medium">
              আজকে প্রকাশিত সংবাদ প্রক্রিয়াধীন। সাম্প্রতিক গুরুত্বপূর্ণ সংবাদ প্রদর্শিত হচ্ছে।
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        {/* Category Filters & Search Bar */}
        {showCategoryFilter && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              <button
                onClick={() => handleCategoryChange("all")}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition ${
                  selectedCategory === "all"
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                সব খবর
              </button>

              {categories.slice(0, 8).map((cat) => {
                const catIdStr = String(cat._id);
                return (
                  <button
                    key={catIdStr}
                    onClick={() => handleCategoryChange(catIdStr)}
                    className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition ${
                      selectedCategory === catIdStr
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Live Search */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="আজকের খবর খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </form>
          </div>
        )}

        {/* Main layout: content + optional sidebar */}
        <div className={`flex flex-col ${hasSidebar ? "lg:flex-row gap-8 items-start" : ""}`}>
          {/* Main Content Area */}
          <div className={hasSidebar ? "flex-1 min-w-0" : "w-full"}>
            {articles.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3">
                <Newspaper className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-lg font-bold text-gray-700">কোনো সংবাদ পাওয়া যায়নি</h3>
                <p className="text-xs text-gray-400">নতুন সংবাদ প্রকাশিত হলে এখানে সংগৃহীত হবে।</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Hero Lead Story (leadGrid layout) */}
                {layoutStyle === "leadGrid" && leadArticle && (
                  <div className="bg-white rounded-3xl overflow-hidden border border-gray-200/80 shadow-md hover:shadow-xl transition group grid grid-cols-1 lg:grid-cols-12 gap-0">
                    <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[380px]">
                      <Image
                        src={leadArticle.featuredImage || "/assets/images/logo.png"}
                        alt={leadArticle.title}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> আজকের প্রধান সংবাদ
                      </div>
                    </div>

                    <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        {leadArticle.categoryId && (
                          <span className="text-xs font-extrabold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-md">
                            {leadArticle.categoryId.name}
                          </span>
                        )}

                        <Link href={`/news/${leadArticle.slug}`}>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug hover:text-primary transition line-clamp-3 mt-2">
                            {leadArticle.title}
                          </h2>
                        </Link>

                        {leadArticle.summary && (
                          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                            {leadArticle.summary}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>{formatPublishTime(leadArticle.publishDate)}</span>
                        </div>

                        <Link
                          href={`/news/${leadArticle.slug}`}
                          className="text-primary font-bold hover:underline flex items-center gap-0.5"
                        >
                          পড়ুন <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Articles Grid or List */}
                {layoutStyle === "list" ? (
                  /* List View */
                  <div className="space-y-4">
                    {(leadArticle ? gridArticles : articles).map((item) => (
                      <div
                        key={item._id}
                        className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row gap-4 sm:gap-6 items-start group"
                      >
                        <div className="relative w-full sm:w-44 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                          <Image
                            src={item.featuredImage || "/assets/images/logo.png"}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {item.categoryId && (
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {item.categoryId.name}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatPublishTime(item.publishDate)}
                            </span>
                          </div>

                          <Link href={`/news/${item.slug}`}>
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 hover:text-primary transition line-clamp-2">
                              {item.title}
                            </h3>
                          </Link>

                          {item.summary && (
                            <p className="text-xs text-gray-500 line-clamp-2">{item.summary}</p>
                          )}

                          {item.views !== undefined && item.views > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                              <Eye className="w-3 h-3" /> {toBengaliNumerals(item.views)} বার পড়া হয়েছে
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Grid View (default for leadGrid & grid) */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {(leadArticle ? gridArticles : articles).map((item) => (
                      <div
                        key={item._id}
                        className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col group"
                      >
                        <div className="relative h-48 w-full overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={item.featuredImage || "/assets/images/logo.png"}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-300"
                          />
                          {item.categoryId && (
                            <span className="absolute top-3 left-3 bg-primary/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-sm backdrop-blur-sm">
                              {item.categoryId.name}
                            </span>
                          )}
                        </div>

                        <div className="p-4 flex flex-col flex-1 space-y-2">
                          <Link href={`/news/${item.slug}`} className="flex-1">
                            <h3 className="text-sm font-bold text-gray-900 hover:text-primary transition line-clamp-2 leading-snug">
                              {item.title}
                            </h3>
                          </Link>

                          {item.summary && (
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                              {item.summary}
                            </p>
                          )}

                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 mt-auto">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-primary" />
                              {formatPublishTime(item.publishDate)}
                            </span>

                            {item.views !== undefined && item.views > 0 && (
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {toBengaliNumerals(item.views)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {initialNewsData.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-6">
                    <button
                      onClick={() => handlePageChange(initialNewsData.currentPage - 1)}
                      disabled={initialNewsData.currentPage <= 1}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ← আগের
                    </button>
                    {Array.from({ length: Math.min(initialNewsData.totalPages, 7) }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                          initialNewsData.currentPage === p
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {toBengaliNumerals(p)}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(initialNewsData.currentPage + 1)}
                      disabled={initialNewsData.currentPage >= initialNewsData.totalPages}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      পরের →
                    </button>
                  </div>
                )}

                {/* Stats bar at bottom */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    মোট <strong className="text-gray-800">{toBengaliNumerals(initialNewsData.totalCount)}</strong> টি সংবাদ
                  </span>
                  <span className="text-gray-400">
                    পৃষ্ঠা {toBengaliNumerals(initialNewsData.currentPage)} / {toBengaliNumerals(initialNewsData.totalPages)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          {hasSidebar && sidebarData && (
            <TodaysSidebar data={sidebarData} />
          )}
        </div>
      </div>
    </div>
  );
}
