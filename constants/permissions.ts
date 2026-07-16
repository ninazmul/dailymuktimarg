// ===== CMS Module & Permission Definitions =====

export const CMS_MODULES = [
  "dashboard",
  "news",
  "categories",
  "tags",
  "homepage-builder",
  "media",
  "reporters",
  "authors",
  "ads",
  "polls",
  "pages",
  "users",
  "audit-logs",
  "settings",
] as const;

export type CmsModule = (typeof CMS_MODULES)[number];

export const CMS_ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
  "publish",
  "unpublish",
  "import",
  "export",
] as const;

export type CmsAction = (typeof CMS_ACTIONS)[number];

// Modules that only Super Admin can access (cannot be delegated)
export const SUPER_ADMIN_ONLY_MODULES: CmsModule[] = ["audit-logs"];

// Human-readable labels for dashboard sidebar navigation
export const MODULE_LABELS: Record<CmsModule, string> = {
  dashboard: "Dashboard",
  news: "News",
  categories: "Categories",
  tags: "Tags",
  "homepage-builder": "Homepage Builder",
  media: "Media Library",
  reporters: "Reporters",
  authors: "Authors",
  ads: "Advertisements",
  polls: "Polls",
  pages: "Pages",
  users: "Users",
  "audit-logs": "Audit Logs",
  settings: "Settings",
};

// Sidebar icon mapping keys (resolved in the sidebar component)
export const MODULE_ROUTES: Record<CmsModule, string> = {
  dashboard: "/dashboard",
  news: "/dashboard/news",
  categories: "/dashboard/categories",
  tags: "/dashboard/tags",
  "homepage-builder": "/dashboard/builder",
  media: "/dashboard/media",
  reporters: "/dashboard/reporters",
  authors: "/dashboard/authors",
  ads: "/dashboard/ads",
  polls: "/dashboard/polls",
  pages: "/dashboard/pages",
  users: "/dashboard/users",
  "audit-logs": "/dashboard/audit-logs",
  settings: "/dashboard/settings",
};
