import { requirePermission } from "@/lib/auth/rbac";
import { getTags } from "@/lib/actions/tag.actions";
import TagClient from "./TagClient";

export const dynamic = "force-dynamic";

export default async function TagsDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; page?: string }>;
}) {
  const access = await requirePermission("tags", "read");

  const resolvedParams = (await searchParams) ?? {};
  const search = resolvedParams.search || "";
  const page = parseInt(resolvedParams.page || "1") || 1;

  const result = await getTags({
    page,
    limit: 20,
    search,
  });

  return (
    <TagClient
      initialResult={result}
      initialSearch={search}
      access={access}
    />
  );
}
