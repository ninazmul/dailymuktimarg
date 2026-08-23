import Link from "next/link";
import Image from "next/image";
import { Play, Image as ImageIcon, ChevronRight } from "lucide-react";
import { getVideoEmbedUrl } from "@/lib/utils";

interface HomepageSectionProps {
  section: {
    _id: string;
    sectionName: string;
    customTitle?: string;
    sectionType: string;
    layoutType?: string;
    backgroundColor?: string;
    categoryId?: { name: string; slug: string };
  };
  articles: {
    _id: string;
    title: string;
    slug: string;
    featuredImage: string;
    summary?: string;
    publishDate?: string;
    categoryId?: { name: string; slug: string };
    featured?: boolean;
    trending?: boolean;
    breaking?: boolean;
    video?: string;
    gallery?: any[];
  }[];
}

export default function HomepageSection({
  section,
  articles,
}: HomepageSectionProps) {
  if (!articles || articles.length === 0) return null;

  const categorySlug = section.categoryId?.slug;
  const rawTitle = section.customTitle || section.sectionName;

  const TITLE_MAP: Record<string, string> = {
    "Trending News": "আলোচিত সংবাদ",
    Trending: "আলোচিত সংবাদ",
    "Latest News": "সর্বশেষ সংবাদ",
    Latest: "সর্বশেষ",
    "Most Read": "সর্বাধিক পঠিত",
    "Most Read Articles": "সর্বাধিক পঠিত",
    Featured: "নির্বাচিত সংবাদ",
    "Featured Picks": "নির্বাচিত সংবাদ",
    "Video News": "ভিডিও সংবাদ",
    "Video News Gallery": "ভিডিও সংবাদ",
    "Photo Gallery": "ফটো গ্যালারি",
    "Photo News Gallery": "ফটো গ্যালারি",
    "Breaking News": "জরুরি সংবাদ",
  };

  const displayTitle = TITLE_MAP[rawTitle] || rawTitle;
  const layout = section.layoutType || "grid";
  const isVideoGallery = section.sectionType === "videoGallery";

  // Video Preview Component for videoGallery sections
  const VideoPreview = ({
    article,
    className = "",
  }: {
    article: any;
    className?: string;
  }) => {
    const embedUrl = article.video ? getVideoEmbedUrl(article.video) : null;
    if (isVideoGallery && embedUrl) {
      return (
        <div className={`relative w-full h-full ${className}`}>
          <iframe
            src={embedUrl}
            title={article.title}
            className="absolute inset-0 w-full h-full"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }
    // Fallback to image with play icon for non-videoGallery sections or invalid embed URLs
    return (
      <div className={`relative w-full h-full ${className}`}>
        <Image
          src={article.featuredImage}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {article.video && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
            <Play className="w-6 h-6 md:w-8 md:h-8 text-white fill-white" />
          </div>
        )}
      </div>
    );
  };

  // Card Badges Helper Component
  const ArticleBadges = ({ article }: { article: any }) => (
    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
      {article.categoryId?.name && (
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
          {article.categoryId.name}
        </span>
      )}
      {article.featured && (
        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
          নির্বাচিত
        </span>
      )}
      {article.trending && (
        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
          আলোচিত
        </span>
      )}
      {article.video && (
        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex items-center gap-1">
          <Play className="w-2.5 h-2.5 fill-red-600" /> ভিডিও
        </span>
      )}
      {article.gallery && article.gallery.length > 0 && (
        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-1">
          <ImageIcon className="w-2.5 h-2.5" /> গ্যালারি (
          {article.gallery.length})
        </span>
      )}
    </div>
  );

  return (
    <section
      className={`rounded-2xl transition-all ${
        section.backgroundColor ? "p-5 border border-gray-200/80 shadow-sm" : ""
      }`}
      style={
        section.backgroundColor
          ? { backgroundColor: section.backgroundColor }
          : {}
      }
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-gray-800 border-l-4 border-primary pl-3">
          {displayTitle}
        </h2>
        {categorySlug && (
          <Link
            href={`/category/${categorySlug}`}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>সব দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Layout Rendering Options */}
      {layout === "list" ? (
        /* List Layout */
        <div className="space-y-3">
          {articles.map((article) => (
            <Link
              key={article._id}
              href={`/news/${article.slug}`}
              className="group flex gap-4 bg-white rounded-xl border p-3 hover:shadow-md transition"
            >
              <div className="relative w-32 h-24 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                <VideoPreview article={article} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <ArticleBadges article={article} />
                  <h3 className="text-sm md:text-base font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                </div>
                {article.publishDate && (
                  <p className="text-[11px] text-gray-400 mt-2">
                    {new Date(article.publishDate).toLocaleDateString("bn-BD")}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : layout === "slider" ? (
        /* Slider / Horizontal Scroll Carousel Layout */
        <div className="flex gap-4 overflow-x-auto max-w-full pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-200">
          {articles.map((article) => (
            <Link
              key={article._id}
              href={`/news/${article.slug}`}
              className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition flex flex-col justify-between shrink-0 w-72 sm:w-80 snap-start"
            >
              <div>
                <div className="relative aspect-video bg-gray-100">
                  <VideoPreview article={article} />
                </div>
                <div className="p-4">
                  <ArticleBadges article={article} />
                  <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                    {article.title}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : layout === "sidebarLayout" ? (
        /* Sidebar Layout (1 Big Featured Lead Card + Right Stacked Cards) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Lead Card (Col 1-2) */}
          {articles[0] && (
            <div className="lg:col-span-2">
              <Link
                href={`/news/${articles[0].slug}`}
                className="group block bg-white rounded-xl border overflow-hidden hover:shadow-md transition h-full flex flex-col"
              >
                <div className="relative aspect-[16/9] bg-gray-100 w-full">
                  <VideoPreview article={articles[0]} />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <ArticleBadges article={articles[0]} />
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-primary transition">
                      {articles[0].title}
                    </h3>
                    {articles[0].summary && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                        {articles[0].summary}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Right Stacked Cards (Col 3) */}
          <div className="flex flex-col gap-3">
            {articles.slice(1, 5).map((article) => (
              <Link
                key={article._id}
                href={`/news/${article.slug}`}
                className="group flex gap-3 bg-white rounded-xl border p-2.5 hover:shadow-sm transition"
              >
                <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  <VideoPreview article={article} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <ArticleBadges article={article} />
                  <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                    {article.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : layout === "sidebar" ? (
        /* Sidebar Widget Layout */
        <div className="flex flex-col gap-3">
          {articles.map((article) => (
            <Link
              key={article._id}
              href={`/news/${article.slug}`}
              className="group flex gap-3 bg-white rounded-xl border p-2.5 hover:shadow-md transition"
            >
              <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                <VideoPreview article={article} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <ArticleBadges article={article} />
                <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                  {article.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Grid Layout (default 3 columns) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <Link
              key={article._id}
              href={`/news/${article.slug}`}
              className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video bg-gray-100">
                  <VideoPreview article={article} />
                </div>
                <div className="p-4">
                  <ArticleBadges article={article} />
                  <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
