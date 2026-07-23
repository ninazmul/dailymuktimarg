import Link from "next/link";
import Image from "next/image";

interface HomepageSectionProps {
  section: {
    _id: string;
    sectionName: string;
    customTitle?: string;
    sectionType: string;
    layoutType?: string;
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
    headline?: string;
    featured?: boolean;
    trending?: boolean;
    breaking?: boolean;
  }[];
}

export default function HomepageSection({ section, articles }: HomepageSectionProps) {
  if (articles.length === 0) return null;

  const categorySlug = section.categoryId?.slug;
  const displayTitle = section.customTitle || section.sectionName;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-gray-800 border-l-4 border-primary pl-3">
          {displayTitle}
        </h2>
        {categorySlug && (
          <Link href={`/category/${categorySlug}`} className="text-xs font-semibold text-primary hover:underline">
            View All →
          </Link>
        )}
      </div>

      {section.layoutType === "list" ? (
        /* List Layout */
        <div className="space-y-3">
          {articles.map((article) => (
            <Link key={article._id} href={`/news/${article.slug}`} className="group flex gap-4 bg-white rounded-xl border p-3 hover:shadow-md transition">
              <div className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0">
                <Image src={article.featuredImage} alt={article.title} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  {article.categoryId?.name && (
                    <span className="text-[10px] font-bold text-primary uppercase">{article.categoryId.name}</span>
                  )}
                  {article.headline && article.headline !== "none" && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      {article.headline}
                    </span>
                  )}
                  {article.featured && (
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {article.publishDate ? new Date(article.publishDate).toLocaleDateString() : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Grid Layout (default) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <Link key={article._id} href={`/news/${article.slug}`} className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="relative aspect-video">
                  <Image src={article.featuredImage} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    {article.categoryId?.name && (
                      <span className="text-[10px] font-bold text-primary uppercase">{article.categoryId.name}</span>
                    )}
                    {article.headline && article.headline !== "none" && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        {article.headline}
                      </span>
                    )}
                    {article.featured && (
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{article.summary}</p>
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
