import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";
import Category from "@/lib/database/models/category.model";
import Tag from "@/lib/database/models/tag.model";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ARTICLE_CARD_FIELDS =
  "title slug summary featuredImage categoryId publishDate";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    tag?: string;
    page?: string;
  }>;
}) {
  const resolvedSearch = (await searchParams) ?? {};
  const query = resolvedSearch.q || "";
  const catSlug = resolvedSearch.category || "";
  const tagSlug = resolvedSearch.tag || "";
  const page = parseInt(resolvedSearch.page || "1") || 1;
  const limit = 12;

  await connectToDatabase();

  const [categories, tags] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Tag.find().sort({ name: 1 }).lean(),
  ]);

  // Construct search query
  const searchFilter: any = { status: "published" };

  if (query) {
    searchFilter.$or = [
      { title: { $regex: query, $options: "i" } },
      { slug: { $regex: query, $options: "i" } },
    ];
  }

  if (catSlug) {
    const categoryDoc: any = await Category.findOne({ slug: catSlug }).lean();
    if (categoryDoc) {
      searchFilter.categoryId = categoryDoc._id;
    }
  }

  if (tagSlug) {
    const tagDoc: any = await Tag.findOne({ slug: tagSlug }).lean();
    if (tagDoc) {
      searchFilter.tags = tagDoc._id;
    }
  }

  const [articles, totalCount] = await Promise.all([
    News.find(searchFilter)
      .select(ARTICLE_CARD_FIELDS)
      .sort({ publishDate: -1 })
      .populate("categoryId", "name slug")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<any[]>(),
    News.countDocuments(searchFilter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const safeArticles = JSON.parse(JSON.stringify(articles));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-gray-800 border-l-4 border-primary pl-4 mb-8">
        Search Archive
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="bg-white border rounded-xl p-5 h-fit space-y-6">
          <form method="GET" action="/search" className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Search Keywords
              </label>
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="e.g. politics, dynamic layouts..."
                className="w-full text-sm border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-primary outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Category
              </label>
              <select
                name="category"
                defaultValue={catSlug}
                className="w-full text-sm border rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((c: any) => (
                  <option key={c._id.toString()} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Tag
              </label>
              <select
                name="tag"
                defaultValue={tagSlug}
                className="w-full text-sm border rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none"
              >
                <option value="">All Tags</option>
                {tags.map((t: any) => (
                  <option key={t._id.toString()} value={t.slug}>
                    #{t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/95 text-white text-sm font-semibold p-2.5 rounded-lg transition"
            >
              Filter Articles
            </button>
            <Link
              href="/search"
              className="block text-center text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Reset Filters
            </Link>
          </form>
        </div>

        {/* Results grid */}
        <div className="lg:col-span-3 space-y-6">
          {safeArticles.length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-xl text-gray-500 bg-white">
              No matching articles found. Try modifying your search keywords or
              tags.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {safeArticles.map((article: any) => (
                  <Link
                    key={article._id}
                    href={`/news/${article.slug}`}
                    className="group bg-white rounded-xl border overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={article.featuredImage}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      {article.categoryId?.name && (
                        <span className="text-[10px] font-bold text-primary uppercase">
                          {article.categoryId.name}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-gray-800 mt-1 line-clamp-2 group-hover:text-primary transition">
                        {article.title}
                      </h3>
                      {article.summary && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-2">
                        {article.publishDate
                          ? new Date(article.publishDate).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {page > 1 && (
                    <Link
                      href={`/search?q=${query}&category=${catSlug}&tag=${tagSlug}&page=${page - 1}`}
                      className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                    >
                      ← Previous
                    </Link>
                  )}
                  <span className="px-4 py-2 text-sm text-gray-500 bg-white border rounded-lg">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/search?q=${query}&category=${catSlug}&tag=${tagSlug}&page=${page + 1}`}
                      className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
