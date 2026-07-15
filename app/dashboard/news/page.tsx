import { requirePermission } from "@/lib/auth/rbac";
import { getNewsArticles } from "@/lib/actions/news.actions";
import { getCategories } from "@/lib/actions/category.actions";
import NewsClient from "./NewsClient";

export const dynamic = "force-dynamic";

export default async function NewsDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{
    search?: string;
    categoryId?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const access = await requirePermission("news", "read");

  const resolvedParams = (await searchParams) ?? {};
  const search = resolvedParams.search || "";
  const categoryId = resolvedParams.categoryId || "";
  const status = resolvedParams.status || "all";
  const page = parseInt(resolvedParams.page || "1") || 1;

  const [result, categories] = await Promise.all([
    getNewsArticles({
      page,
      limit: 15,
      search,
      categoryId,
      status,
    }),
    getCategories(),
  ]);

  return (
    <NewsClient
      initialResult={result}
      categories={categories}
      initialSearch={search}
      initialCategory={categoryId}
      initialStatus={status}
      access={access}
    />
  );
}
