"use client";

import { useState } from "react";
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
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import {
  createPage,
  updatePage,
  deletePage,
  getPages,
} from "@/lib/actions/page.actions";
import { IPage } from "@/lib/database/models/page.model";
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

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [priority, setPriority] = useState(0);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCreate = hasPermission(access, "pages", "create");
  const canUpdate = hasPermission(access, "pages", "update");
  const canDelete = hasPermission(access, "pages", "delete");
  const canEditForm = isEditing ? canUpdate : canCreate;
  const canMutate = canUpdate || canDelete;

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setContent("");
    setStatus("published");
    setPriority(0);
    setSeoTitle("");
    setSeoDescription("");
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditClick = (page: IPage) => {
    setIsEditing(true);
    setEditingId(page._id.toString());
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content);
    setStatus(page.status);
    setPriority(page.priority || 0);
    setSeoTitle(page.seo?.title || "");
    setSeoDescription(page.seo?.description || "");
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

    // Update URL query parameters
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error("Title, slug, and content are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title,
        slug,
        content,
        status,
        priority,
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
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      await deletePage(id);
      toast.success("Page deleted.");
      await reloadPages();
      if (editingId === id) resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete page.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Pages List panel */}
      <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <File className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-800">Manage Pages</h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search pages..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
        </div>

        {result.pages.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-xl text-gray-500">
            No pages found. Add pages using the form on the right.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-3">
              {result.pages.map((page) => (
                <div
                  key={page._id.toString()}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-gray-500 min-w-[24px] text-center">
                        {page.priority || 0}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {page.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          page.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {page.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      /pages/{page.slug}
                    </span>
                  </div>
                  {canMutate && (
                    <div className="flex shrink-0">
                      {canUpdate && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleEditClick(page)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDelete(page._id.toString())}
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
        <div className="w-full lg:w-[500px] bg-white p-6 rounded-xl border border-gray-200 shrink-0 h-fit">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-800">
              {isEditing ? "Modify Page" : "Create New Page"}
            </h3>
            {isEditing && (
              <Button
                size="icon"
                variant="ghost"
                onClick={resetForm}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="page-title">Title *</Label>
              <Input
                id="page-title"
                placeholder="Page title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="page-slug">Slug *</Label>
              <div className="flex gap-2">
                <Input
                  id="page-slug"
                  placeholder="page-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAutoSlug}
                  className="gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Content *</Label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="page-status">Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="page-priority">Priority</Label>
              <Input
                id="page-priority"
                type="number"
                placeholder="0"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500">
                Higher numbers appear first in the footer.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="page-seo-title">SEO Title (Optional)</Label>
              <Input
                id="page-seo-title"
                placeholder="SEO title"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="page-seo-description">
                SEO Description (Optional)
              </Label>
              <Textarea
                id="page-seo-description"
                placeholder="SEO description"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Page"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
