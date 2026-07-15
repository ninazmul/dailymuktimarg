"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/database";
import User, { IUser, IUserPermission } from "@/lib/database/models/user.model";
import {
  CmsModule,
  CmsAction,
  SUPER_ADMIN_ONLY_MODULES,
} from "@/constants/permissions";
import { hasPermission, canAccessModule, DashboardAccess } from "./rbac-rules";

// ===== Core RBAC helpers =====
const SUPER_ADMIN_EMAIL = "nazmulsaw@gmail.com";

export async function getCurrentDashboardAccess(): Promise<DashboardAccess | null> {
  const { userId } = await auth();
  if (!userId) return null;

  await connectToDatabase();

  // Fetch Clerk user details directly via Clerk SDK
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);

  const email =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress || "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User";
  const imageUrl = clerkUser.imageUrl || "";

  // Find by clerkId or email (fallback for manual pre-promotion)
  let dbUser = await User.findOne({ clerkId: userId });
  if (!dbUser && email) {
    dbUser = await User.findOne({ email: email.toLowerCase() });
  }

  if (dbUser) {
    // Sync information & update clerkId if it was placeholder/outdated.
    // To avoid concurrent VersionError conflicts, we perform an atomic update instead of .save()
    dbUser = await User.findByIdAndUpdate(
      dbUser._id,
      {
        $set: {
          clerkId: userId,
          email: email,
          name: name,
          imageUrl: imageUrl,
        }
      },
      { returnDocument: "after" }
    );
  } else {
    // Create new record
    try {
      dbUser = await User.create({
        clerkId: userId,
        email: email.toLowerCase(),
        name,
        imageUrl,
        status: "active",
        permissions: [],
      });
    } catch (createError: any) {
      // In case of concurrent creation race condition, try to fetch again
      if (createError.code === 11000) {
        dbUser = await User.findOne({ clerkId: userId });
        if (!dbUser && email) {
          dbUser = await User.findOne({ email: email.toLowerCase() });
        }
      } else {
        throw createError;
      }
    }
  }

  if (!dbUser || dbUser.status === "suspended") return null;

  const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  let permissions: { module: string; actions: string[] }[] = [];

  if (isSuperAdmin) {
    // Super admin has all permissions
    permissions = []; // We'll handle this in hasPermission
  } else {
    permissions = (dbUser.permissions ?? []).map((p: IUserPermission) => ({
      module: p.module,
      actions: p.actions,
    }));
  }

  return {
    userId,
    dbUserId: dbUser._id.toString(),
    email,
    name: dbUser.name,
    isSuperAdmin,
    permissions,
  };
}

/**
 * Ensures the current user has dashboard access.
 * Redirects to the given URL if the user lacks any CMS role.
 */
export async function requireDashboardAccess(
  redirectTo = "/",
): Promise<DashboardAccess> {
  const access = await getCurrentDashboardAccess();
  if (!access) {
    redirect(redirectTo);
  }
  return access!;
}



/**
 * Guard used inside Server Actions to enforce RBAC.
 * Throws an error if the user lacks the required permission.
 */
export async function requirePermission(
  module: CmsModule,
  action: CmsAction,
): Promise<DashboardAccess> {
  const access = await requireDashboardAccess("/");

  if (!hasPermission(access, module, action)) {
    throw new Error(
      `Forbidden: You lack the "${action}" permission on "${module}".`,
    );
  }

  return access;
}
