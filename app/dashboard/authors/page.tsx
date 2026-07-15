import { requirePermission } from "@/lib/auth/rbac";
import { getAuthors } from "@/lib/actions/author.actions";
import AuthorsClient from "./AuthorsClient";

export const dynamic = "force-dynamic";

export default async function AuthorsDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; page?: string }>;
}) {
  const access = await requirePermission("authors", "read");

  const resolvedParams = (await searchParams) ?? {};
  const search = resolvedParams.search || "";
  const page = parseInt(resolvedParams.page || "1") || 1;

  const result = await getAuthors({
    page,
    limit: 20,
    search,
  });

  return (
    <AuthorsClient
      initialResult={result}
      initialSearch={search}
      access={access}
    />
  );
}
