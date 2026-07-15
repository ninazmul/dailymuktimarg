import { requirePermission } from "@/lib/auth/rbac";
import { getAllUsers } from "@/lib/actions/rbac.actions";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const access = await requirePermission("users", "read");
  const usersResult = await getAllUsers({ page: 1, limit: 20 });

  return <UsersClient initialUsers={usersResult} access={access} />;
}
