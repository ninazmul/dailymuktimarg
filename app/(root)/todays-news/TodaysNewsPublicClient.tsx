"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Newspaper, Calendar, Search, Clock, Eye, Sparkles, ChevronRight, Layers } from "lucide-react";
import { ICategory } from "@/lib/database/models/category.model";

interface NewsItem {
  _id: any;
  title: string;
  subtitle?: string;
  slug: string;
  summary?: string;
  featuredImage: string;
  categoryId?: { _id: any; name: string; slug: string };
  reporterId?: { name: string; image?: string };
  authorId?: { name: string; image?: string };
  publishDate?: string;
  views?: number;
  lead?: boolean;
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

export default function TodaysNewsPublicClient({
  layout,
  categories,
  initialNewsData,
  selectedCategory,
  searchQuery,
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

  const articles = initialNewsData.articles || [];
  const leadArticle = showLeadHero && articles.length > 0 ? articles[0] : null;
  const gridArticles = showLeadHero && articles.length > 0 ? articles.slice(1) : articles;

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
      <div className="bg-gradient-to-r from-primary/95 via-primary to-emerald-900 text-white py-12 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs sm:text-sm font-semibold">
            <Newspaper className="w-4 h-4 text-emerald-300" />
            <span>{title}</span>
            <span className="opacity-40">•</span>
            <span className="text-emerald-200">
              {toBengaliNumerals(initialNewsData.totalCount)} টি সংবাদ
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto">
            {subtitle}
          </p>

          {!initialNewsData.isTodayOnly && (
            <div className="inline-block bg-amber-500/20 text-amber-200 border border-amber-400/30 px-3 py-1 rounded-md text-xs font-medium">
              আজকে প্রকাশিত সংবাদ প্রক্রিয়াধীন। সাম্প্রতিক গুরুত্বপূর্ণ সংবাদ প্রদর্শিত হচ্ছে।
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        {/* Category Filters & Search Bar */}
        {showCategoryFilter && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80 flex flex-col md:flex-row gap-4 items-center justify-between">
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

        {/* Content Area */}
        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3">
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-lg font-bold text-gray-700">কোনো সংবাদ পাওয়া যায়নি</h3>
            <p className="text-xs text-gray-400">নতুন সংবাদ প্রকাশিত হলে এখানে সংগৃহীত হবে।</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hero Lead Story (If enabled and leadGrid layout) */}
            {layoutStyle === "leadGrid" && leadArticle && (
              <div className="bg-white rounded-3xl overflow-hidden border border-gray-200/80 shadow-md hover:shadow-xl transition group grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[400px]">
                  <Image
                    src={leadArticle.featuredImage || "/assets/images/logo.png"}
                    alt={leadArticle.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                    priority
                  />
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
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug hover:text-primary transition line-clamp-3">
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
                      পড়ুন <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Grid or List */}
            {layoutStyle === "list" ? (
              /* List View */
              <div className="space-y-4">
                {(layoutStyle === "leadGrid" ? gridArticles : articles).map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center"
                  >
                    <div className="relative w-full sm:w-48 h-36 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={item.featuredImage || "/assets/images/logo.png"}
                        alt={item.title}
                        fill
                        className="object-cover hover:scale-105 transition duration-300"
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Grid View (default for leadGrid & grid) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(layoutStyle === "leadGrid" ? gridArticles : articles).map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                        <Image
                          src={item.featuredImage || "/assets/images/logo.png"}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-300"
                        />
                        {item.categoryId && (
                          <span className="absolute top-3 left-3 bg-primary/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-sm">
                            {item.categoryId.name}
                          </span>
                        )}
                      </div>

                      <div className="p-4 space-y-2">
                        <Link href={`/news/${item.slug}`}>
                          <h3 className="text-base font-bold text-gray-900 hover:text-primary transition line-clamp-2 leading-snug">
                            {item.title}
                          </h3>
                        </Link>

                        {item.summary && (
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {item.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary" />
                        {formatPublishTime(item.publishDate)}
                      </span>

                      {item.views !== undefined && item.views > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-gray-400" />
                          {toBengaliNumerals(item.views)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {initialNewsData.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-6">
                {Array.from({ length: initialNewsData.totalPages }, (_, i) => i + 1).map((p) => (
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
