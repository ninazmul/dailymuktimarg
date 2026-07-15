import {
  CmsModule,
  CmsAction,
  SUPER_ADMIN_ONLY_MODULES,
} from "@/constants/permissions";

export interface DashboardAccess {
  userId: string;
  dbUserId: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  permissions: { module: string; actions: string[] }[];
}

/**
 * Checks if a given DashboardAccess object has a specific permission.
 * Super Admins always have all permissions.
 */
export function hasPermission(
  access: DashboardAccess,
  module: CmsModule,
  action: CmsAction,
): boolean {
  if (access.isSuperAdmin) return true;

  // Super-admin-only modules cannot be delegated
  if (SUPER_ADMIN_ONLY_MODULES.includes(module)) return false;

  const modulePerms = access.permissions.find((p) => p.module === module);
  if (!modulePerms) return false;

  return modulePerms.actions.includes(action) || modulePerms.actions.includes("all");
}

/**
 * Checks if a user can access a particular CMS module at all (has at least read).
 */
export function canAccessModule(
  access: DashboardAccess,
  module: CmsModule,
): boolean {
  return hasPermission(access, module, "read");
}
