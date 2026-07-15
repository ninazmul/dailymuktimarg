import { requirePermission } from "@/lib/auth/rbac";
import { getAuditLogs } from "@/lib/actions/rbac.actions";
import AuditLogsClient from "./AuditLogsClient";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  await requirePermission("audit-logs", "read");
  const auditResult = await getAuditLogs({ page: 1, limit: 20 });

  return <AuditLogsClient initialResult={auditResult} />;
}
