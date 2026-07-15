"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  UserPlus,
  Trash2,
} from "lucide-react";
import { IUser } from "@/lib/database/models/user.model";
import {
  getAllUsers,
  updateUserPermissions,
  createPreRegisteredAdmin,
  deleteUser,
} from "@/lib/actions/rbac.actions";
import {
  CMS_MODULES,
  CmsModule,
  CMS_ACTIONS,
  MODULE_LABELS,
  SUPER_ADMIN_ONLY_MODULES,
} from "@/constants/permissions";
import { toast } from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Loader from "@/components/shared/Loader";
import {
  DashboardAccess,
  hasPermission as userHasPermission,
} from "@/lib/auth/rbac-rules";

const SUPER_ADMIN_EMAIL = "nazmulsaw@gmail.com";

function hasAllDashboardPermissions(
  permissions: { module: string; actions: string[] }[] = [],
) {
  return CMS_MODULES.filter(
    (module) =>
      module !== "dashboard" && !SUPER_ADMIN_ONLY_MODULES.includes(module),
  ).every((module) => {
    const modulePerms = permissions.find((p) => p.module === module);
    if (!modulePerms) return false;

    return CMS_ACTIONS.every(
      (action) =>
        modulePerms.actions.includes(action) ||
        modulePerms.actions.includes("all"),
    );
  });
}

function isSuperAdminUser(user: Pick<IUser, "email" | "permissions">) {
  return (
    user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
    hasAllDashboardPermissions(user.permissions)
  );
}

export default function UsersClient({
  initialUsers,
  access,
}: {
  initialUsers: {
    users: IUser[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    superAdminCount: number;
  };
  access: DashboardAccess;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [usersResult, setUsersResult] = useState(initialUsers);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [isLoading, setIsLoading] = useState(false);

  // User permissions dialog state
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [permissions, setPermissions] = useState<
    { module: string; actions: string[] }[]
  >([]);

  // Pre-register Admin dialog state
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const canCreate = userHasPermission(access, "users", "create");
  const canUpdate = userHasPermission(access, "users", "update");
  const canDelete = userHasPermission(access, "users", "delete");
  const canMutate = canUpdate || canDelete;

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminEmail.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmittingAdmin(true);
    try {
      await createPreRegisteredAdmin({
        name: newAdminName,
        email: newAdminEmail,
      });
      toast.success("Admin pre-registered successfully");
      setIsAddAdminOpen(false);
      setNewAdminName("");
      setNewAdminEmail("");
      reloadUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to pre-register admin");
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const reloadUsers = async (
    page = usersResult.currentPage,
    query = search,
  ) => {
    setIsLoading(true);
    try {
      const response = await getAllUsers({ page, limit: 20, search: query });
      setUsersResult(response);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle permission for user being edited
  const togglePermission = (module: string, action: string) => {
    setPermissions((prev) => {
      const existing = prev.find((p) => p.module === module);
      if (existing) {
        const newActions = existing.actions.includes(action)
          ? existing.actions.filter((a) => a !== action)
          : [...existing.actions, action];
        if (newActions.length === 0) {
          return prev.filter((p) => p.module !== module);
        } else {
          return prev.map((p) =>
            p.module === module ? { ...p, actions: newActions } : p,
          );
        }
      } else {
        return [...prev, { module, actions: [action] }];
      }
    });
  };

  const isSelectedPermission = (module: string, action: string) => {
    const perm = permissions.find((p) => p.module === module);
    return perm?.actions.includes(action) || false;
  };

  const openPermissionsDialog = (user: IUser) => {
    setEditingUser(user);
    setPermissions(user.permissions || []);
    setIsPermissionsDialogOpen(true);
  };

  const handleSelectAllPermissions = () => {
    const allPermissions = CMS_MODULES.filter((m) => m !== "dashboard").map((module) => ({
      module,
      actions: [...CMS_ACTIONS],
    }));
    setPermissions(allPermissions);
  };

  const handleClearAllPermissions = () => {
    setPermissions([]);
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;

    setIsLoading(true);
    try {
      await updateUserPermissions(editingUser._id.toString(), permissions);
      toast.success("Permissions updated successfully");
      setIsPermissionsDialogOpen(false);
      reloadUsers();
    } catch (error) {
      toast.error("Failed to save permissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (value) params.set("search", value);
    else params.delete("search");
    router.replace(`${pathname}?${params.toString()}`);
    reloadUsers(1, value);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.replace(`${pathname}?${params.toString()}`);
    reloadUsers(newPage);
  };

  const handleDeleteUser = async (user: IUser) => {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;

    try {
      await deleteUser(user._id.toString());
      toast.success("User deleted successfully");
      reloadUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-800 hover:bg-green-100"
      : "bg-red-100 text-red-800 hover:bg-red-100";
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-800">
            Users & Permissions
          </h2>
        </div>
        {canCreate && (
          <Button onClick={() => setIsAddAdminOpen(true)} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Admin by Email
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <Loader label="Loading users list..." />
      ) : usersResult.users.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-xl text-gray-500">
          No users found.
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto bg-gray-50/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                {canMutate && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersResult.users.map((user) => {
                const isSuperAdmin = isSuperAdminUser(user);
                const isLastSuperAdmin =
                  isSuperAdmin && usersResult.superAdminCount <= 1;
                return (
                  <TableRow key={user._id.toString()} className="bg-white">
                    <TableCell className="font-semibold text-gray-800">
                      <div className="flex items-center gap-2">
                        {user.name}
                        {isSuperAdmin && (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs">
                            Super Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    {canMutate && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canUpdate && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openPermissionsDialog(user)}
                                disabled={isSuperAdmin}
                                title={isSuperAdmin ? "Super Admin has full access" : "Edit Permissions"}
                              >
                                <Edit className="w-4 h-4 text-gray-600" />
                              </Button>
                            </>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user)}
                              disabled={isLastSuperAdmin}
                              title={isLastSuperAdmin ? "Cannot delete the last Super Admin" : "Delete User"}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {usersResult.totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t bg-white text-sm text-gray-500">
              <span>
                Page {usersResult.currentPage} of {usersResult.totalPages} (
                {usersResult.totalCount} users)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={usersResult.currentPage === 1}
                  onClick={() => handlePageChange(usersResult.currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={usersResult.currentPage === usersResult.totalPages}
                  onClick={() => handlePageChange(usersResult.currentPage + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Permissions Dialog */}
      {canUpdate && (
      <Dialog
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Permissions for {editingUser?.name}</DialogTitle>
            <DialogDescription>
              Configure permissions for this user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Permissions</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllPermissions}
                  className="h-8 text-xs"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllPermissions}
                  className="h-8 text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-4">
              {CMS_MODULES.filter((m) => !["dashboard"].includes(m)).map(
                (module) => (
                  <div key={module} className="space-y-2">
                    <div className="font-semibold text-sm text-gray-700">
                      {MODULE_LABELS[module as CmsModule]}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {CMS_ACTIONS.map((action) => (
                        <label
                          key={action}
                          className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
                        >
                          <Checkbox
                            checked={isSelectedPermission(module, action)}
                            onCheckedChange={() =>
                              togglePermission(module, action)
                            }
                          />
                          <span className="capitalize">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsPermissionsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePermissions} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              ) : (
                "Save Permissions"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Add Admin Dialog */}
      {canCreate && (
      <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleAddAdmin}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-800">Pre-register Admin User</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Add an administrator's email. When they sign up or log in, they will automatically be matched to this profile and gain access.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name" className="text-gray-700">Full Name</Label>
                <Input
                  id="admin-name"
                  placeholder="e.g. John Doe"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-gray-700">Email Address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddAdminOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingAdmin}>
                {isSubmittingAdmin ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </div>
                ) : (
                  "Pre-register Admin"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
