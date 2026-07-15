import { requirePermission } from "@/lib/auth/rbac";
import { getDistinctFolders } from "@/lib/actions/media.actions";
import MediaClient from "./MediaClient";

export const dynamic = "force-dynamic";

export default async function MediaDashboardPage() {
  // Enforce read permission on the media module
  const access = await requirePermission("media", "read");

  // Fetch folders for initial client state
  const initialFolders = await getDistinctFolders();

  return <MediaClient initialFolders={initialFolders} access={access} />;
}
