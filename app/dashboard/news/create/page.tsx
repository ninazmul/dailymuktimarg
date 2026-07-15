import { requirePermission } from "@/lib/auth/rbac";
import { getCategories } from "@/lib/actions/category.actions";
import { getAllTags } from "@/lib/actions/tag.actions";
import { getAllReporters } from "@/lib/actions/reporter.actions";
import { getAllAuthors } from "@/lib/actions/author.actions";
import NewsForm from "../NewsForm";

export const dynamic = "force-dynamic";

export default async function CreateNewsPage() {
  await requirePermission("news", "create");

  const [categories, tags, reporters, authors] = await Promise.all([
    getCategories(),
    getAllTags(),
    getAllReporters(),
    getAllAuthors(),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Create News Article
        </h2>
        <p className="text-sm text-gray-500">
          Draft, schedule, or publish a new article.
        </p>
      </div>
      <NewsForm
        categories={categories}
        tags={tags}
        reporters={reporters}
        authors={authors}
      />
    </div>
  );
}
