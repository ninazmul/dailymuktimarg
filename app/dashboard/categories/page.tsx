import { requirePermission } from "@/lib/auth/rbac";
import { getCategories } from "@/lib/actions/category.actions";
import CategoryClient from "./CategoryClient";

export const dynamic = "force-dynamic";

export default async function CategoriesDashboardPage() {
  const access = await requirePermission("categories", "read");
  const categories = await getCategories();

  return <CategoryClient initialCategories={categories} access={access} />;
}
