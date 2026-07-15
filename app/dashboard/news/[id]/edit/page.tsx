import { requirePermission } from "@/lib/auth/rbac";
import { getNewsArticleById } from "@/lib/actions/news.actions";
import { getCategories } from "@/lib/actions/category.actions";
import { getAllTags } from "@/lib/actions/tag.actions";
import { getAllReporters } from "@/lib/actions/reporter.actions";
import { getAllAuthors } from "@/lib/actions/author.actions";
import { notFound } from "next/navigation";
import NewsForm from "../../NewsForm";

export const dynamic = "force-dynamic";

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("news", "update");

  const resolvedParams = await params;
  const articleId = resolvedParams.id;

  const [article, categories, tags, reporters, authors] = await Promise.all([
    getNewsArticleById(articleId),
    getCategories(),
    getAllTags(),
    getAllReporters(),
    getAllAuthors(),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Edit News Article</h2>
        <p className="text-sm text-gray-500">
          Update draft details or change publication settings.
        </p>
      </div>
      <NewsForm
        initialData={article}
        categories={categories}
        tags={tags}
        reporters={reporters}
        authors={authors}
      />
    </div>
  );
}
