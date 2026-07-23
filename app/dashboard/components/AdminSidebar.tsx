"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  File,
  FolderTree,
  Tag,
  LayoutGrid,
  Image as ImageIcon,
  Camera,
  PenTool,
  UserSquare2,
  Megaphone,
  Vote,
  Users,
  ShieldAlert,
  History,
  Settings as SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardAccess, canAccessModule } from "@/lib/auth/rbac-rules";
import {
  CMS_MODULES,
  CmsModule,
  MODULE_LABELS,
  MODULE_ROUTES,
} from "@/constants/permissions";

const iconMap: Partial<
  Record<CmsModule, React.ComponentType<{ className?: string }>>
> = {
  dashboard: LayoutDashboard,
  news: FileText,
  categories: FolderTree,
  tags: Tag,
  "homepage-builder": LayoutGrid,
  media: ImageIcon,
  gallery: Camera,
  reporters: PenTool,
  authors: UserSquare2,
  ads: Megaphone,
  polls: Vote,
  pages: File,
  users: Users,
  "audit-logs": History,
  settings: SettingsIcon,
};

const IMPLEMENTED_MODULES: CmsModule[] = [
  "dashboard",
  "news",
  "categories",
  "tags",
  "homepage-builder",
  "media",
  "gallery",
  "reporters",
  "authors",
  "ads",
  "polls",
  "pages",
  "users",
  "audit-logs",
  "settings",
];

export default function AdminSidebar({ access }: { access: DashboardAccess }) {
  const currentPath = usePathname();

  // Filter modules user is permitted to read/access and are physically implemented as dashboard pages
  const visibleModules = IMPLEMENTED_MODULES.filter((module) => {
    // Everyone with dashboard access sees the main dashboard overview
    if (module === "dashboard") return true;
    return canAccessModule(access, module);
  });

  return (
    <Sidebar
      className="bg-white text-primary font-semibold shadow-md"
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup className="space-y-4">
          <SidebarGroupLabel className="h-auto py-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 w-full"
            >
              <div className="relative w-10 h-10 rounded-md overflow-hidden bg-primary/5 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">M</span>
              </div>
              <span className="text-lg font-bold text-primary truncate">
                Muktimarg CMS
              </span>
            </Link>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {visibleModules.map((module) => {
                const title = MODULE_LABELS[module];
                const url = MODULE_ROUTES[module];
                const Icon = iconMap[module];

                const isActive =
                  url === "/dashboard"
                    ? currentPath === url
                    : currentPath === url || currentPath.startsWith(`${url}/`);

                return (
                  <SidebarMenuItem key={module}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={url}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition ${
                          isActive
                            ? "bg-primary text-white shadow-sm"
                            : "hover:bg-primary/10 hover:text-primary text-gray-700"
                        }`}
                      >
                        {Icon && <Icon className="w-5 h-5" />}
                        <span className="truncate">{title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
