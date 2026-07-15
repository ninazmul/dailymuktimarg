import { requirePermission } from "@/lib/auth/rbac";
import { getHomepageSections } from "@/lib/actions/homepage.actions";
import { getCategories } from "@/lib/actions/category.actions";
import BuilderClient from "./BuilderClient";

export const dynamic = "force-dynamic";

export default async function HomepageBuilderPage() {
  const access = await requirePermission("homepage-builder", "read");
  const [sections, categories] = await Promise.all([
    getHomepageSections(),
    getCategories(),
  ]);

  return <BuilderClient initialSections={sections} categories={categories} access={access} />;
}
