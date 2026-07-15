import { requirePermission } from "@/lib/auth/rbac";
import { getReporters } from "@/lib/actions/reporter.actions";
import ReportersClient from "./ReportersClient";

export const dynamic = "force-dynamic";

export default async function ReportersDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; page?: string }>;
}) {
  const access = await requirePermission("reporters", "read");

  const resolvedParams = (await searchParams) ?? {};
  const search = resolvedParams.search || "";
  const page = parseInt(resolvedParams.page || "1") || 1;

  const result = await getReporters({
    page,
    limit: 20,
    search,
  });

  return (
    <ReportersClient
      initialResult={result}
      initialSearch={search}
      access={access}
    />
  );
}
