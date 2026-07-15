
"use client";

import {
  CmsModule,
  CmsAction,
  SUPER_ADMIN_ONLY_MODULES,
} from "@/constants/permissions";

interface DashboardAccess {
  userId: string;
  dbUserId: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  permissions: { module: string; actions: string[] }[];
}

export function usePermissions(access: DashboardAccess) {
  function hasPermission(module: CmsModule, action: CmsAction): boolean {
    if (access.isSuperAdmin) return true;

    if (SUPER_ADMIN_ONLY_MODULES.includes(module)) return false;

    const modulePerms = access.permissions.find((p) => p.module === module);
    if (!modulePerms) return false;

    return modulePerms.actions.includes(action) || modulePerms.actions.includes("all");
  }

  function canAccessModule(module: CmsModule): boolean {
    return hasPermission(module, "read");
  }

  return { hasPermission, canAccessModule };
}
