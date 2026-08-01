"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  File,
  Trash2,
  Edit2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FolderTree,
  Plus,
  ArrowUp,
  ArrowDown,
  Users,
  LayoutGrid,
  Image as ImageIcon,
  Megaphone,
  HelpCircle,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  createPage,
  updatePage,
  deletePage,
  getPages,
  getTopLevelPages,
} from "@/lib/actions/page.actions";
import {
  IPage,
  IPageSection,
  IPageFounder,
  IPageFeatureCard,
} from "@/lib/database/models/page.model";
import { toast } from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { generateSlug } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MediaLibraryModal from "@/components/shared/MediaLibrary/MediaLibraryModal";

export default function PagesClient({
  initialResult,
  initialSearch,
  access,
}: {
  initialResult: {
    pages: IPage[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  initialSearch: string;
  access: DashboardAccess;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [result, setResult] = useState(initialResult);
  const [search, setSearch] = useState(initialSearch);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Top-level pages for the parent dropdown
  const [topLevelPages, setTopLevelPages] = useState<IPage[]>([]);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [priority, setPriority] = useState(0);
  const [parentId, setParentId] = useState<string>("none");
  const [sections, setSections] = useState<IPageSection[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form tab selection ("basic" | "sections")
  const [activeFormTab, setActiveFormTab] = useState<"basic" | "sections">("basic");

  // Media Library selector state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [onMediaSelectCallback, setOnMediaSelectCallback] = useState<
    ((url: string) => void) | null
  >(null);

  // Permissions fallback: if user reached /dashboard/pages (requirePermission passed), enable form unless explicitly restricted
  const canCreate = hasPermission(access, "pages", "create") || access.isSuperAdmin || !access.permissions || access.permissions.length === 0;
  const canUpdate = hasPermission(access, "pages", "update") || access.isSuperAdmin || !access.permissions || access.permissions.length === 0;
  const canDelete = hasPermission(access, "pages", "delete") || access.isSuperAdmin || !access.permissions || access.permissions.length === 0;
  const canEditForm = isEditing ? canUpdate : canCreate;
  const canMutate = canUpdate || canDelete;

  // Load top-level pages for the parent dropdown
  useEffect(() => {
    getTopLevelPages().then((pages) => setTopLevelPages(pages));
  }, [result]);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setContent("");
    setStatus("published");
    setPriority(0);
    setParentId("none");
    setSections([]);
    setSeoTitle("");
    setSeoDescription("");
    setIsEditing(false);
    setEditingId(null);
    setActiveFormTab("basic");
  };

  const handleAddNewPageClick = () => {
    resetForm();
    toast.success("Ready to create a new top-level page.");
  };

  const handleCreateSubPageClick = (parentPage: IPage) => {
    resetForm();
    setParentId(parentPage._id.toString());
    toast.success(`Creating sub-page under "${parentPage.title}".`);
  };

  const handleEditClick = (page: IPage) => {
    setIsEditing(true);
    setEditingId(page._id.toString());
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content || "");
    setStatus(page.status);
    setPriority(page.priority || 0);
    setParentId(page.parentId ? page.parentId.toString() : "none");
    setSections(page.sections ? JSON.parse(JSON.stringify(page.sections)) : []);
    setSeoTitle(page.seo?.title || "");
    setSeoDescription(page.seo?.description || "");
    setActiveFormTab("basic");
  };

  const reloadPages = async (page = result.currentPage, query = search) => {
    try {
      const response = await getPages({
        page,
        limit: 20,
        search: query,
      });
      setResult(response);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);

    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("search", val);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
    reloadPages(1, val);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.replace(`${pathname}?${params.toString()}`);
    reloadPages(newPage, search);
  };

  const handleAutoSlug = () => {
    if (title) {
      setSlug(generateSlug(title));
      toast.success("Slug generated from title.");
    } else {
      toast.error("Please enter a title first.");
    }
  };

  const buildPageUrl = (page: IPage) => {
    if (page.parentId) {
      const parent = topLevelPages.find(
        (p) => p._id.toString() === page.parentId?.toString(),
      );
      return parent
        ? `/pages/${parent.slug}/${page.slug}`
        : `/pages/[parent]/${page.slug}`;
    }
    return `/pages/${page.slug}`;
  };

  /* ==================== SECTION BUILDER HELPERS ==================== */
  const addSection = (type: IPageSection["type"]) => {
    const newSec: IPageSection = {
      id: "sec_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      type,
      enabled: true,
      order: sections.length,
      title: getDefaultSectionTitle(type),
      subtitle: "",
      backgroundColor: "default",
      content: type === "richText" ? "<p>Write your content here...</p>" : "",
      founders:
        type === "founders"
          ? [
              {
                name: "Founder Name",
                role: "Founder & CEO",
                bio: "Bio description here...",
              },
            ]
          : [],
      featureCards:
        type === "featureCards"
          ? [
              {
                title: "Feature Title",
                description: "Feature description details.",
              },
            ]
          : [],
      imageBanner:
        type === "imageBanner"
          ? {
              imageUrl: "",
              layout: "full",
              caption: "",
            }
          : undefined,
      cta:
        type === "cta"
          ? {
              heading: "Ready to get started?",
              subheading: "Join thousands of readers today.",
              buttonText: "Contact Us",
              buttonUrl: "/pages/contact",
            }
          : undefined,
      faqs:
        type === "faq"
          ? [{ question: "Frequently asked question?", answer: "Answer details here." }]
          : [],
    };
    setSections([...sections, newSec]);
    toast.success(`Added ${getSectionLabel(type)} section.`);
  };

  const removeSection = (index: number) => {
    const next = [...sections];
    next.splice(index, 1);
    setSections(next);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sections.length - 1)
    ) {
      return;
    }
    const next = [...sections];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;

    // re-index order
    next.forEach((s, idx) => (s.order = idx));
    setSections(next);
  };

  const updateSectionField = (index: number, field: string, value: any) => {
    const next = [...sections];
    (next[index] as any)[field] = value;
    setSections(next);
  };

  const openImagePicker = (callback: (url: string) => void) => {
    setOnMediaSelectCallback(() => callback);
    setMediaModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title,
        slug,
        content: content.trim() || (sections.length > 0 ? "<p></p>" : ""),
        status,
        priority,
        parentId: parentId === "none" ? null : parentId,
        sections,
        seo: {
          title: seoTitle.trim() || undefined,
          description: seoDescription.trim() || undefined,
        },
      };

      if (isEditing && editingId) {
        await updatePage(editingId, payload);
        toast.success("Page updated.");
      } else {
        await createPage(payload);
        toast.success("Page created.");
      }
      resetForm();
      await reloadPages();
    } catch (error: any) {
      toast.error(error.message || "Failed to save page.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const hasChildren = result.pages.some(
      (p) => p.parentId?.toString() === id,
    );
    const confirmMsg = hasChildren
      ? "This page has sub-pages. Deleting it will also delete all sub-pages. Continue?"
      : "Are you sure you want to delete this page?";

    if (!confirm(confirmMsg)) return;
    try {
      await deletePage(id);
      toast.success("Page deleted.");
      await reloadPages();
      if (editingId === id) resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete page.");
    }
  };

  const groupedDisplay = (() => {
    const parents = result.pages.filter((p) => !p.parentId);
    const children = result.pages.filter((p) => !!p.parentId);
    const items: { page: IPage; isChild: boolean }[] = [];
    for (const parent of parents) {
      items.push({ page: parent, isChild: false });
      const subs = children.filter(
        (c) => c.parentId?.toString() === parent._id.toString(),
      );
      for (const child of subs) {
        items.push({ page: child, isChild: true });
      }
    }
    const listedParentIds = new Set(parents.map((p) => p._id.toString()));
    for (const child of children) {
      if (!listedParentIds.has(child.parentId?.toString() ?? "")) {
        items.push({ page: child, isChild: true });
      }
    }
    return items;
  })();

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      {/* Pages List panel */}
      <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <File className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Manage Pages & Sub-Pages</h2>
              <p className="text-xs text-gray-500">Create, structure, and customize your site pages.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleAddNewPageClick}
              className="bg-primary hover:bg-primary/80 text-white font-bold text-xs gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create New Page
            </Button>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search pages..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {groupedDisplay.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-xl text-gray-500">
            No pages found. Create a page using the form on the right.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              {groupedDisplay.map(({ page, isChild }) => (
                <div
                  key={page._id.toString()}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition gap-3 ${
                    isChild
                      ? "ml-6 bg-red-50/40 border-red-100 hover:bg-primary/20"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isChild ? (
                        <ChevronDown className="w-3.5 h-3.5 text-red-400 rotate-[-90deg]" />
                      ) : (
                        <FolderTree className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="font-mono font-bold text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                        P:{page.priority || 0}
                      </span>
                      <span className="font-semibold text-gray-800 text-sm">
                        {page.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          page.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {page.status}
                      </span>
                      {isChild ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">
                          Sub-Page
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-semibold">
                          Top Page
                        </span>
                      )}
                      {page.sections && page.sections.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          {page.sections.length} section(s)
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 ml-5 font-mono">
                      {buildPageUrl(page)}
                    </span>
                  </div>
                  {canMutate && (
                    <div className="flex items-center shrink-0 gap-1.5">
                      {!isChild && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1 bg-white border-primary/80 text-primary hover:bg-primary/10"
                          onClick={() => handleCreateSubPageClick(page)}
                          title="Add sub-page under this parent page"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Sub-Page
                        </Button>
                      )}
                      {canUpdate && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2.5 text-xs text-gray-700 hover:text-primary gap-1"
                          onClick={() => handleEditClick(page)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(page._id.toString())}
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="flex justify-between items-center pt-6 border-t mt-6 text-sm text-gray-500">
                <span>
                  Showing page {result.currentPage} of {result.totalPages} (
                  {result.totalCount} items)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={result.currentPage === 1}
                    onClick={() => handlePageChange(result.currentPage - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={result.currentPage === result.totalPages}
                    onClick={() => handlePageChange(result.currentPage + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form panel */}
      {canEditForm && (
        <div className="w-full xl:w-[620px] bg-white p-6 rounded-xl border border-gray-200 shrink-0 h-fit shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-800">
                {isEditing
                  ? "Modify Page"
                  : parentId !== "none"
                    ? "Create New Sub-Page"
                    : "Create Top-Level Page"}
              </h3>
              <p className="text-xs text-gray-500">
                {isEditing
                  ? "Update page settings and customizable sections."
                  : parentId !== "none"
                    ? `Adding a sub-page under "${
                        topLevelPages.find((p) => p._id.toString() === parentId)
                          ?.title || "Parent"
                      }".`
                    : "Configure page basic info and modular sections below."}
              </p>
            </div>
            {isEditing ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={resetForm}
                className="h-8 w-8"
                title="Cancel Edit"
              >
                <X className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={resetForm}
                className="text-xs h-8"
              >
                Clear Form
              </Button>
            )}
          </div>

          {parentId !== "none" && !isEditing && (
            <div className="mb-4 p-2.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between text-xs text-purple-800 font-medium">
              <span>
                📍 Creating <strong>Sub-Page</strong> under:{" "}
                <strong>
                  {topLevelPages.find((p) => p._id.toString() === parentId)
                    ?.title || "Parent"}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setParentId("none")}
                className="text-purple-600 hover:underline font-bold text-[11px]"
              >
                Make Top-Level
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. BASIC INFO & HIERARCHY */}
            <div className="space-y-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <File className="w-4 h-4 text-primary" />
                1. Page Details & Link Structure
              </h4>

              <div className="space-y-1.5">
                <Label htmlFor="page-parent">Parent Page (Sub-Page Selector)</Label>
                <Select value={parentId} onValueChange={(v) => setParentId(v)}>
                  <SelectTrigger id="page-parent" className="bg-white">
                    <SelectValue placeholder="None (top-level page)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level page)</SelectItem>
                    {topLevelPages
                      .filter(
                        (p) => !isEditing || p._id.toString() !== editingId,
                      )
                      .map((p) => (
                        <SelectItem
                          key={p._id.toString()}
                          value={p._id.toString()}
                        >
                          📂 {p.title} (/pages/{p.slug})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 font-mono">
                  {parentId !== "none"
                    ? `Public URL: /pages/${
                        topLevelPages.find((p) => p._id.toString() === parentId)
                          ?.slug ?? "parent"
                      }/${slug || "slug"}`
                    : `Public URL: /pages/${slug || "slug"}`}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="page-title">Page Title *</Label>
                <Input
                  id="page-title"
                  placeholder="e.g. About Us, Our Team, Services"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="page-slug">URL Slug *</Label>
                <div className="flex gap-2">
                  <Input
                    id="page-slug"
                    placeholder="about-us"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="bg-white font-mono text-xs"
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAutoSlug}
                    className="gap-1.5 shrink-0 text-xs"
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    Auto Slug
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="page-status">Publish Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v: any) => setStatus(v)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="page-priority">Sort Priority</Label>
                  <Input
                    id="page-priority"
                    type="number"
                    placeholder="0"
                    value={priority}
                    onChange={(e) =>
                      setPriority(parseInt(e.target.value) || 0)
                    }
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. MODULAR SECTIONS BUILDER (PROMINENT) */}
            <div className="space-y-4 border border-primary/20 bg-primary/5 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    2. Add Functional Modular Sections
                  </h4>
                  <p className="text-xs text-gray-600">
                    Add Founder cards, Feature grids, Banners, CTAs, and FAQs to design your page.
                  </p>
                </div>
                {sections.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-full font-bold">
                    {sections.length} Section(s)
                  </span>
                )}
              </div>

              {/* Add Section Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addSection("founders")}
                  className="gap-1.5 bg-white border-primary/80 hover:bg-primary/20 text-gray-800 font-semibold text-xs justify-start h-10 shadow-xs"
                >
                  <Users className="w-4 h-4 text-primary shrink-0" />
                  + Founders / Team
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addSection("featureCards")}
                  className="gap-1.5 bg-white border-blue-200 hover:bg-blue-50 text-gray-800 font-semibold text-xs justify-start h-10 shadow-xs"
                >
                  <LayoutGrid className="w-4 h-4 text-blue-600 shrink-0" />
                  + Feature Cards
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addSection("imageBanner")}
                  className="gap-1.5 bg-white border-emerald-200 hover:bg-emerald-50 text-gray-800 font-semibold text-xs justify-start h-10 shadow-xs"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  + Image Banner
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addSection("cta")}
                  className="gap-1.5 bg-white border-amber-200 hover:bg-amber-50 text-gray-800 font-semibold text-xs justify-start h-10 shadow-xs"
                >
                  <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />
                  + Call to Action
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addSection("faq")}
                  className="gap-1.5 bg-white border-purple-200 hover:bg-purple-50 text-gray-800 font-semibold text-xs justify-start h-10 shadow-xs"
                >
                  <HelpCircle className="w-4 h-4 text-purple-600 shrink-0" />
                  + FAQ Accordion
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addSection("richText")}
                  className="gap-1.5 bg-white border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold text-xs justify-start h-10 shadow-xs"
                >
                  <FileText className="w-4 h-4 text-gray-600 shrink-0" />
                  + Rich Text Block
                </Button>
              </div>

              {/* Active Section List */}
              {sections.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-primary/30 rounded-xl bg-white text-gray-500 space-y-1">
                  <p className="text-xs font-semibold text-gray-700">
                    No modular sections added to this page yet.
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Click any button above (e.g. <strong>+ Founders / Team</strong>) to add functional interactive content!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {sections.map((sec, secIdx) => (
                    <div
                      key={sec.id || secIdx}
                      className={`border rounded-xl p-4 space-y-4 transition ${
                        sec.enabled === false
                          ? "bg-gray-100 opacity-60"
                          : "bg-white shadow-sm border-gray-300"
                      }`}
                    >
                      {/* Section Header Bar */}
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="p-1.5 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                            #{secIdx + 1}
                          </span>
                          <span className="font-bold text-sm text-gray-800">
                            {getSectionLabel(sec.type)}
                          </span>
                          <span className="text-xs text-gray-500 italic">
                            ({sec.title || "No Section Header"})
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={secIdx === 0}
                            onClick={() => moveSection(secIdx, "up")}
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={secIdx === sections.length - 1}
                            onClick={() => moveSection(secIdx, "down")}
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() =>
                              updateSectionField(
                                secIdx,
                                "enabled",
                                sec.enabled === false ? true : false,
                              )
                            }
                            title={
                              sec.enabled === false
                                ? "Enable Section"
                                : "Disable Section"
                            }
                          >
                            {sec.enabled === false ? (
                              <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-green-600" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-primary hover:text-red-700"
                            onClick={() => removeSection(secIdx)}
                            title="Delete Section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Common Section Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Section Heading Title</Label>
                          <Input
                            placeholder="Section title"
                            value={sec.title || ""}
                            onChange={(e) =>
                              updateSectionField(secIdx, "title", e.target.value)
                            }
                            className="h-8 text-xs bg-gray-50"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Section Subtitle</Label>
                          <Input
                            placeholder="Section subtitle / description"
                            value={sec.subtitle || ""}
                            onChange={(e) =>
                              updateSectionField(
                                secIdx,
                                "subtitle",
                                e.target.value,
                              )
                            }
                            className="h-8 text-xs bg-gray-50"
                          />
                        </div>
                      </div>

                      {/* TYPE SPECIFIC FORM EDITORS */}
                      {/* 1. FOUNDERS SECTION */}
                      {sec.type === "founders" && (
                        <div className="border-t pt-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-primary">
                              Founder / Team Member Cards ({sec.founders?.length || 0})
                            </Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 border-primary/80 text-primary"
                              onClick={() => {
                                const list = sec.founders || [];
                                updateSectionField(secIdx, "founders", [
                                  ...list,
                                  {
                                    name: "Founder Name",
                                    role: "Founder & CEO",
                                    bio: "Bio details here...",
                                  },
                                ]);
                              }}
                            >
                              <Plus className="w-3 h-3" /> Add Member
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {(sec.founders || []).map((f, fIdx) => (
                              <div
                                key={fIdx}
                                className="p-3 bg-gray-50 border rounded-lg space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-gray-700">
                                    Member #{fIdx + 1}: {f.name || "Unnamed"}
                                  </span>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-primary"
                                    onClick={() => {
                                      const list = [...(sec.founders || [])];
                                      list.splice(fIdx, 1);
                                      updateSectionField(
                                        secIdx,
                                        "founders",
                                        list,
                                      );
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-[11px]">Name *</Label>
                                    <Input
                                      placeholder="Full Name"
                                      value={f.name}
                                      onChange={(e) => {
                                        const list = [...(sec.founders || [])];
                                        list[fIdx].name = e.target.value;
                                        updateSectionField(
                                          secIdx,
                                          "founders",
                                          list,
                                        );
                                      }}
                                      className="h-7 text-xs bg-white"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-[11px]">Title / Role *</Label>
                                    <Input
                                      placeholder="e.g. Founder & Managing Editor"
                                      value={f.role}
                                      onChange={(e) => {
                                        const list = [...(sec.founders || [])];
                                        list[fIdx].role = e.target.value;
                                        updateSectionField(
                                          secIdx,
                                          "founders",
                                          list,
                                        );
                                      }}
                                      className="h-7 text-xs bg-white"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-[11px]">Founder Photo URL</Label>
                                  <div className="flex gap-1.5">
                                    <Input
                                      placeholder="https://..."
                                      value={f.image || ""}
                                      onChange={(e) => {
                                        const list = [...(sec.founders || [])];
                                        list[fIdx].image = e.target.value;
                                        updateSectionField(
                                          secIdx,
                                          "founders",
                                          list,
                                        );
                                      }}
                                      className="h-7 text-xs bg-white"
                                    />
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      className="h-7 text-[11px] shrink-0"
                                      onClick={() =>
                                        openImagePicker((url) => {
                                          const list = [...(sec.founders || [])];
                                          list[fIdx].image = url;
                                          updateSectionField(
                                            secIdx,
                                            "founders",
                                            list,
                                          );
                                        })
                                      }
                                    >
                                      Media Library
                                    </Button>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-[11px]">Bio Description</Label>
                                  <Textarea
                                    placeholder="Short founder biography..."
                                    value={f.bio || ""}
                                    onChange={(e) => {
                                      const list = [...(sec.founders || [])];
                                      list[fIdx].bio = e.target.value;
                                      updateSectionField(
                                        secIdx,
                                        "founders",
                                        list,
                                      );
                                    }}
                                    className="text-xs bg-white"
                                    rows={2}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <Input
                                    placeholder="LinkedIn URL"
                                    value={f.linkedin || ""}
                                    onChange={(e) => {
                                      const list = [...(sec.founders || [])];
                                      list[fIdx].linkedin = e.target.value;
                                      updateSectionField(secIdx, "founders", list);
                                    }}
                                    className="h-7 text-xs bg-white"
                                  />
                                  <Input
                                    placeholder="Twitter / X URL"
                                    value={f.twitter || ""}
                                    onChange={(e) => {
                                      const list = [...(sec.founders || [])];
                                      list[fIdx].twitter = e.target.value;
                                      updateSectionField(secIdx, "founders", list);
                                    }}
                                    className="h-7 text-xs bg-white"
                                  />
                                  <Input
                                    placeholder="Facebook URL"
                                    value={f.facebook || ""}
                                    onChange={(e) => {
                                      const list = [...(sec.founders || [])];
                                      list[fIdx].facebook = e.target.value;
                                      updateSectionField(secIdx, "founders", list);
                                    }}
                                    className="h-7 text-xs bg-white"
                                  />
                                  <Input
                                    placeholder="Email Address"
                                    value={f.email || ""}
                                    onChange={(e) => {
                                      const list = [...(sec.founders || [])];
                                      list[fIdx].email = e.target.value;
                                      updateSectionField(secIdx, "founders", list);
                                    }}
                                    className="h-7 text-xs bg-white"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. FEATURE CARDS SECTION */}
                      {sec.type === "featureCards" && (
                        <div className="border-t pt-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-blue-600">
                              Feature Cards ({sec.featureCards?.length || 0})
                            </Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 border-blue-200 text-blue-600"
                              onClick={() => {
                                const list = sec.featureCards || [];
                                updateSectionField(secIdx, "featureCards", [
                                  ...list,
                                  {
                                    title: "New Feature",
                                    description: "Feature description details.",
                                  },
                                ]);
                              }}
                            >
                              <Plus className="w-3 h-3" /> Add Card
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {(sec.featureCards || []).map((c, cIdx) => (
                              <div
                                key={cIdx}
                                className="p-3 bg-gray-50 border rounded-lg space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-gray-700">
                                    Card #{cIdx + 1}: {c.title || "Untitled"}
                                  </span>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-primary"
                                    onClick={() => {
                                      const list = [...(sec.featureCards || [])];
                                      list.splice(cIdx, 1);
                                      updateSectionField(
                                        secIdx,
                                        "featureCards",
                                        list,
                                      );
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>

                                <div>
                                  <Label className="text-[11px]">Card Title</Label>
                                  <Input
                                    placeholder="Title"
                                    value={c.title}
                                    onChange={(e) => {
                                      const list = [...(sec.featureCards || [])];
                                      list[cIdx].title = e.target.value;
                                      updateSectionField(
                                        secIdx,
                                        "featureCards",
                                        list,
                                      );
                                    }}
                                    className="h-7 text-xs bg-white"
                                  />
                                </div>

                                <div>
                                  <Label className="text-[11px]">Description</Label>
                                  <Textarea
                                    placeholder="Card description..."
                                    value={c.description}
                                    onChange={(e) => {
                                      const list = [...(sec.featureCards || [])];
                                      list[cIdx].description = e.target.value;
                                      updateSectionField(
                                        secIdx,
                                        "featureCards",
                                        list,
                                      );
                                    }}
                                    className="text-xs bg-white"
                                    rows={2}
                                  />
                                </div>

                                <div>
                                  <Label className="text-[11px]">Card Image URL</Label>
                                  <div className="flex gap-1.5">
                                    <Input
                                      placeholder="https://..."
                                      value={c.image || ""}
                                      onChange={(e) => {
                                        const list = [...(sec.featureCards || [])];
                                        list[cIdx].image = e.target.value;
                                        updateSectionField(
                                          secIdx,
                                          "featureCards",
                                          list,
                                        );
                                      }}
                                      className="h-7 text-xs bg-white"
                                    />
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      className="h-7 text-[11px] shrink-0"
                                      onClick={() =>
                                        openImagePicker((url) => {
                                          const list = [...(sec.featureCards || [])];
                                          list[cIdx].image = url;
                                          updateSectionField(
                                            secIdx,
                                            "featureCards",
                                            list,
                                          );
                                        })
                                      }
                                    >
                                      Media Library
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Link URL (e.g. /pages/about)"
                                    value={c.linkUrl || ""}
                                    onChange={(e) => {
                                      const list = [...(sec.featureCards || [])];
                                      list[cIdx].linkUrl = e.target.value;
                                      updateSectionField(
                                        secIdx,
                                        "featureCards",
                                        list,
                                      );
                                    }}
                                    className="h-7 text-xs bg-white"
                                  />
                                  <Input
                                    placeholder="Link Text (e.g. Learn More)"
                                    value={c.linkText || ""}
                                    onChange={(e) => {
                                      const list = [...(sec.featureCards || [])];
                                      list[cIdx].linkText = e.target.value;
                                      updateSectionField(
                                        secIdx,
                                        "featureCards",
                                        list,
                                      );
                                    }}
                                    className="h-7 text-xs bg-white"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. IMAGE BANNER SECTION */}
                      {sec.type === "imageBanner" && (
                        <div className="border-t pt-3 space-y-2 text-xs">
                          <Label className="text-xs font-bold text-emerald-600">
                            Banner Image & Layout
                          </Label>
                          <div>
                            <Label className="text-[11px]">Image URL *</Label>
                            <div className="flex gap-1.5">
                              <Input
                                placeholder="https://..."
                                value={sec.imageBanner?.imageUrl || ""}
                                onChange={(e) =>
                                  updateSectionField(secIdx, "imageBanner", {
                                    ...sec.imageBanner,
                                    imageUrl: e.target.value,
                                  })
                                }
                                className="h-7 text-xs bg-gray-50"
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="h-7 text-[11px] shrink-0"
                                onClick={() =>
                                  openImagePicker((url) =>
                                    updateSectionField(secIdx, "imageBanner", {
                                      ...sec.imageBanner,
                                      imageUrl: url,
                                    }),
                                  )
                                }
                              >
                                Media Library
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[11px]">Layout Style</Label>
                              <Select
                                value={sec.imageBanner?.layout || "full"}
                                onValueChange={(val: any) =>
                                  updateSectionField(secIdx, "imageBanner", {
                                    ...sec.imageBanner,
                                    layout: val,
                                  })
                                }
                              >
                                <SelectTrigger className="h-7 text-xs bg-gray-50">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full">Full Width</SelectItem>
                                  <SelectItem value="contained">
                                    Contained Box
                                  </SelectItem>
                                  <SelectItem value="split-left">
                                    Image Left / Text Right
                                  </SelectItem>
                                  <SelectItem value="split-right">
                                    Image Right / Text Left
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-[11px]">Caption / Sub-Text</Label>
                              <Input
                                placeholder="Banner caption..."
                                value={sec.imageBanner?.caption || ""}
                                onChange={(e) =>
                                  updateSectionField(secIdx, "imageBanner", {
                                    ...sec.imageBanner,
                                    caption: e.target.value,
                                  })
                                }
                                className="h-7 text-xs bg-gray-50"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. CTA SECTION */}
                      {sec.type === "cta" && (
                        <div className="border-t pt-3 space-y-2 text-xs">
                          <Label className="text-xs font-bold text-amber-600">
                            Call To Action Highlight Settings
                          </Label>
                          <div>
                            <Label className="text-[11px]">Heading *</Label>
                            <Input
                              placeholder="Call to action headline"
                              value={sec.cta?.heading || ""}
                              onChange={(e) =>
                                updateSectionField(secIdx, "cta", {
                                  ...sec.cta,
                                  heading: e.target.value,
                                })
                              }
                              className="h-7 text-xs bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px]">Subheading</Label>
                            <Input
                              placeholder="Subheading details"
                              value={sec.cta?.subheading || ""}
                              onChange={(e) =>
                                updateSectionField(secIdx, "cta", {
                                  ...sec.cta,
                                  subheading: e.target.value,
                                })
                              }
                              className="h-7 text-xs bg-gray-50"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Button Label (e.g. Join Now)"
                              value={sec.cta?.buttonText || ""}
                              onChange={(e) =>
                                updateSectionField(secIdx, "cta", {
                                  ...sec.cta,
                                  buttonText: e.target.value,
                                })
                              }
                              className="h-7 text-xs bg-gray-50"
                            />
                            <Input
                              placeholder="Button Destination URL"
                              value={sec.cta?.buttonUrl || ""}
                              onChange={(e) =>
                                updateSectionField(secIdx, "cta", {
                                  ...sec.cta,
                                  buttonUrl: e.target.value,
                                })
                              }
                              className="h-7 text-xs bg-gray-50"
                            />
                          </div>
                        </div>
                      )}

                      {/* 5. FAQ SECTION */}
                      {sec.type === "faq" && (
                        <div className="border-t pt-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-purple-600">
                              FAQ Accordion Items ({sec.faqs?.length || 0})
                            </Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 border-purple-200 text-purple-600"
                              onClick={() => {
                                const list = sec.faqs || [];
                                updateSectionField(secIdx, "faqs", [
                                  ...list,
                                  { question: "Question?", answer: "Answer." },
                                ]);
                              }}
                            >
                              <Plus className="w-3 h-3" /> Add Question
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {(sec.faqs || []).map((faqItem, qIdx) => (
                              <div
                                key={qIdx}
                                className="p-2.5 bg-gray-50 border rounded-lg space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <Input
                                    placeholder="Question..."
                                    value={faqItem.question}
                                    onChange={(e) => {
                                      const list = [...(sec.faqs || [])];
                                      list[qIdx].question = e.target.value;
                                      updateSectionField(secIdx, "faqs", list);
                                    }}
                                    className="h-7 text-xs bg-white font-semibold"
                                  />
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-primary ml-1 shrink-0"
                                    onClick={() => {
                                      const list = [...(sec.faqs || [])];
                                      list.splice(qIdx, 1);
                                      updateSectionField(secIdx, "faqs", list);
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                                <Textarea
                                  placeholder="Answer details..."
                                  value={faqItem.answer}
                                  onChange={(e) => {
                                    const list = [...(sec.faqs || [])];
                                    list[qIdx].answer = e.target.value;
                                    updateSectionField(secIdx, "faqs", list);
                                  }}
                                  className="text-xs bg-white"
                                  rows={2}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 6. RICH TEXT SECTION */}
                      {sec.type === "richText" && (
                        <div className="border-t pt-3 space-y-1.5">
                          <Label className="text-xs font-bold text-gray-700">
                            Rich Text Article Block
                          </Label>
                          <RichTextEditor
                            value={sec.content || ""}
                            onChange={(val) =>
                              updateSectionField(secIdx, "content", val)
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. OPTIONAL BODY TEXT (FALLBACK) */}
            <div className="space-y-1.5 border-t pt-4">
              <Label className="text-xs font-semibold text-gray-700">
                Fallback Body HTML (Optional)
              </Label>
              <RichTextEditor value={content} onChange={setContent} />
              <p className="text-[11px] text-gray-500">
                Fallback HTML content if no dynamic sections above are added.
              </p>
            </div>

            {/* 4. SEO OPTIONS */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-xs text-gray-700 uppercase tracking-wider">
                SEO Settings
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="page-seo-title" className="text-xs">SEO Title (Optional)</Label>
                <Input
                  id="page-seo-title"
                  placeholder="Custom Meta Title"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="page-seo-description" className="text-xs">
                  SEO Description (Optional)
                </Label>
                <Textarea
                  id="page-seo-description"
                  placeholder="Custom Meta Description"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 text-base mt-6 shadow"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving Page..."
                : isEditing
                  ? "Save Page Changes"
                  : "Create Page"}
            </Button>
          </form>
        </div>
      )}

      {/* Media Library Selector Modal */}
      <MediaLibraryModal
        open={mediaModalOpen}
        onOpenChange={setMediaModalOpen}
        onSelect={(url) => {
          if (onMediaSelectCallback) {
            onMediaSelectCallback(url);
          }
          setMediaModalOpen(false);
          toast.success("Image selected!");
        }}
      />
    </div>
  );
}

function getDefaultSectionTitle(type: IPageSection["type"]): string {
  switch (type) {
    case "founders":
      return "Meet Our Founders & Team";
    case "featureCards":
      return "Key Highlights";
    case "imageBanner":
      return "";
    case "cta":
      return "";
    case "faq":
      return "Frequently Asked Questions";
    case "richText":
      return "";
    default:
      return "";
  }
}

function getSectionLabel(type: IPageSection["type"]): string {
  switch (type) {
    case "founders":
      return "Founders / Team Cards";
    case "featureCards":
      return "Feature Cards Grid";
    case "imageBanner":
      return "Image Banner";
    case "cta":
      return "Call to Action (CTA)";
    case "faq":
      return "FAQ Accordion";
    case "richText":
      return "Rich Text Content";
    default:
      return type;
  }
}
