// ====== URL QUERY PARAMS
export type UrlQueryParams = {
  params: string;
  key: string;
  value: string | null;
};

export type RemoveUrlQueryParams = {
  params: string;
  keysToRemove: string[];
};

// ====== PAGINATION
export type PaginationParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type PaginatedResult<T> = {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

// ====== NEWS PARAMS
export type NewsFormParams = {
  title: string;
  subtitle?: string;
  slug: string;
  summary?: string;
  content?: string;
  featuredImage: string;
  gallery?: string[];
  video?: string;
  categoryId: string;
  nestedCategoryId?: string;
  tags?: string[];
  reporterId?: string;
  authorId?: string;
  source?: string;
  location?: string;
  publishDate?: string;
  schedulePublish?: string;
  status: "draft" | "review" | "published" | "archived";
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  featured?: boolean;
  trending?: boolean;
  breaking?: boolean;
  headline?: string;
  lead?: boolean;
  leadPosition?: number;
  relatedNews?: string[];
};

// ====== CATEGORY PARAMS
export type CategoryFormParams = {
  name: string;
  slug?: string;
  parentId?: string;
  priority?: number;
  isNavbar?: boolean;
};

// ====== TAG PARAMS
export type TagFormParams = {
  name: string;
  slug?: string;
};

// ====== SETTING PARAMS
export type SettingFormParams = {
  contactEmail?: string;
  phoneNumber?: string;
  address?: string;
  socialLinks?: Record<string, string>;
  headerScript?: string;
  footerScript?: string;
  maintenanceMode?: boolean;
};

// ====== AD PARAMS
export type AdFormParams = {
  placement: "header" | "sidebar" | "footer" | "popup" | "sticky" | "inline" | "mobile";
  client?: string;
  imageUrl?: string;
  htmlCode?: string;
  targetUrl?: string;
  startDate?: string;
  endDate?: string;
  status?: "active" | "inactive";
  priority?: number;
};



// ====== POLL PARAMS
export type PollFormParams = {
  question: string;
  options: { text: string }[];
  startDate?: string;
  endDate?: string;
  status?: "active" | "closed";
};

// ====== PAGE PARAMS
export type PageFormParams = {
  title: string;
  slug: string;
  content: string;
  status?: "draft" | "published";
  seo?: {
    title?: string;
    description?: string;
  };
};

// ====== HOMEPAGE LAYOUT PARAMS
export type HomepageLayoutFormParams = {
  sectionName: string;
  sectionType: "hero" | "lead" | "categoryGrid" | "trending" | "widgets" | "videoGallery" | "photoGallery";
  categoryId?: string;
  postsCount?: number;
  layoutType?: "grid" | "list" | "slider" | "sidebarLayout";
  enabled?: boolean;
  isPinned?: boolean;
  order?: number;
};
