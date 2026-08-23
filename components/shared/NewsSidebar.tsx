import Link from "next/link";
import Image from "next/image";
import Ad from "@/components/shared/Ad";

interface NewsItem {
  _id: string | any;
  title: string;
  slug: string;
  featuredImage?: string;
  views?: number;
  publishDate?: string | Date;
  categoryId?: {
    _id?: string;
    name?: string;
    slug?: string;
  };
}

interface NewsSidebarProps {
  mostViewedArticles?: NewsItem[];
  trendingArticles?: NewsItem[];
  latestArticles?: NewsItem[];
  relatedArticles?: NewsItem[];
  sidebarAds?: any[];
  className?: string;
}

const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const toBn = (n: number | string) =>
  n.toString().replace(/\d/g, (d) => bnNums[parseInt(d, 10)]);

export default function NewsSidebar({
  mostViewedArticles = [],
  trendingArticles = [],
  latestArticles = [],
  relatedArticles = [],
  sidebarAds = [],
  className = "",
}: NewsSidebarProps) {
  const hasContent =
    mostViewedArticles.length > 0 ||
    trendingArticles.length > 0 ||
    latestArticles.length > 0 ||
    relatedArticles.length > 0 ||
    sidebarAds.length > 0;

  if (!hasContent) return null;

  return (
    <aside
      className={`w-full lg:w-80 flex-shrink-0 space-y-6 lg:sticky lg:top-24 lg:self-start ${className}`}
    >
      {/* Top Sidebar Ad */}
      {sidebarAds.slice(0, 1).map((ad) => (
        <Ad key={ad._id?.toString() || "ad-0"} ad={ad} />
      ))}

      {/* Related Articles Widget (used on article detail pages) */}
      {relatedArticles.length > 0 && (
        <div className="space-y-4 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 border-l-4 border-primary pl-3">
            সম্পর্কিত সংবাদ
          </h2>
          <div className="flex flex-col gap-3">
            {relatedArticles.map((item) => (
              <Link
                key={item._id?.toString()}
                href={`/news/${item.slug}`}
                className="group flex gap-3 bg-white rounded-xl border p-2.5 hover:shadow-md transition"
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
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
                      {item.categoryId.name}
                    </span>
                  )}
                  <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition leading-snug">
                    {item.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Latest Articles Widget (when explicitly supplied and related is not enough) */}
      {latestArticles.length > 0 && (
        <div className="space-y-4 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 border-l-4 border-blue-600 pl-3">
            সর্বশেষ সংবাদ
          </h2>
          <div className="flex flex-col gap-3">
            {latestArticles.map((item) => (
              <Link
                key={item._id?.toString()}
                href={`/news/${item.slug}`}
                className="group flex gap-3 bg-white rounded-xl border p-2.5 hover:shadow-md transition"
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
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                      {item.categoryId.name}
                    </span>
                  )}
                  <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition leading-snug">
                    {item.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Most Read Articles Widget */}
      {mostViewedArticles.length > 0 && (
        <div className="space-y-4 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 border-l-4 border-amber-500 pl-3">
            সর্বাধিক পঠিত
          </h2>
          <div className="flex flex-col gap-3">
            {mostViewedArticles.map((item, idx) => (
              <Link
                key={item._id?.toString()}
                href={`/news/${item.slug}`}
                className="group flex gap-3 bg-white rounded-xl border p-2.5 hover:shadow-md transition items-center"
              >
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                  {toBn(idx + 1)}
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
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      {toBn(item.views)} বার পঠিত
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Middle Sidebar Ad */}
      {sidebarAds.slice(1, 2).map((ad) => (
        <Ad key={ad._id?.toString() || "ad-1"} ad={ad} />
      ))}

      {/* Trending Articles Widget */}
      {trendingArticles.length > 0 && (
        <div className="space-y-4 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 border-l-4 border-rose-500 pl-3 flex items-center gap-1.5">
            <span>আলোচিত সংবাদ</span>
          </h2>
          <div className="flex flex-col gap-3">
            {trendingArticles.map((item, idx) => (
              <Link
                key={item._id?.toString()}
                href={`/news/${item.slug}`}
                className="group flex gap-3 bg-white rounded-xl border p-2.5 hover:shadow-md transition items-center"
              >
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
                  {toBn(idx + 1)}
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
                  {item.categoryId?.name && (
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-0.5">
                      {item.categoryId.name}
                    </span>
                  )}
                  <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition leading-snug">
                    {item.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Remaining Sidebar Ads */}
      {sidebarAds.slice(2).map((ad, idx) => (
        <Ad key={ad._id?.toString() || `ad-${idx + 2}`} ad={ad} />
      ))}
    </aside>
  );
}
