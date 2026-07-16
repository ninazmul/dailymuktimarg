import { requirePermission } from "@/lib/auth/rbac";
import { getPages } from "@/lib/actions/page.actions";
import PagesClient from "./PagesClient";

export const dynamic = "force-dynamic";

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const access = await requirePermission("pages", "read");
  const resolvedSearchParams = await searchParams;

  const page = parseInt(resolvedSearchParams.page || "1") || 1;
  const search = resolvedSearchParams.search || "";
  const result = await getPages({ page, limit: 20, search });

  return (
    <PagesClient
      initialResult={result}
      initialSearch={search}
      access={access}
    />
  );
}
