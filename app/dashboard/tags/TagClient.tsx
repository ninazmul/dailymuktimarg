"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tag as TagIcon,
  Trash2,
  Edit2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  createTag,
  updateTag,
  deleteTag,
  getTags,
} from "@/lib/actions/tag.actions";
import { ITag } from "@/lib/database/models/tag.model";
import { toast } from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";

export default function TagClient({
  initialResult,
  initialSearch,
  access,
}: {
  initialResult: {
    tags: ITag[];
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
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canCreate = hasPermission(access, "tags", "create");
  const canUpdate = hasPermission(access, "tags", "update");
  const canDelete = hasPermission(access, "tags", "delete");
  const canEditForm = isEditing ? canUpdate : canCreate;
  const canMutate = canUpdate || canDelete;

  const resetForm = () => {
    setName("");
    setSlug("");
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditClick = (tag: ITag) => {
    setIsEditing(true);
    setEditingId(tag._id.toString());
    setName(tag.name);
    setSlug(tag.slug);
  };

  const reloadTags = async (page = result.currentPage, query = search) => {
    try {
      const response = await getTags({
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
    reloadTags(1, val);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.replace(`${pathname}?${params.toString()}`);
    reloadTags(newPage, search);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Tag name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editingId) {
        await updateTag(editingId, { name, slug: slug.trim() || undefined });
        toast.success("Tag updated.");
      } else {
        await createTag({ name, slug: slug.trim() || undefined });
        toast.success("Tag created.");
      }
      resetForm();
      await reloadTags();
    } catch (error: any) {
      toast.error(error.message || "Failed to save tag.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    try {
      await deleteTag(id);
      toast.success("Tag deleted.");
      await reloadTags();
      if (editingId === id) resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tag.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Tags List panel */}
      <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <TagIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-800">Manage Tags</h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tags..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
        </div>

        {result.tags.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-xl text-gray-500">
            No tags found. Add tags using the form on the right.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {result.tags.map((tag) => (
                <div
                  key={tag._id.toString()}
                  className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-semibold text-gray-800 truncate">
                      {tag.name}
                    </span>
                    <span className="text-xs text-gray-400">/{tag.slug}</span>
                  </div>
                  {canMutate && (
                    <div className="flex shrink-0">
                      {canUpdate && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleEditClick(tag)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDelete(tag._id.toString())}
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
                  Showing page {result.currentPage} of {result.totalPages} ({result.totalCount} items)
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
      <div className="w-full lg:w-96 bg-white p-6 rounded-xl border border-gray-200 shrink-0 h-fit">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-gray-800">
            {isEditing ? "Modify Tag" : "Create New Tag"}
          </h3>
          {isEditing && (
            <Button size="icon" variant="ghost" onClick={resetForm} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="tag-name">Tag Name *</Label>
            <Input
              id="tag-name"
              placeholder="e.g. Breaking, Election 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tag-slug">URL Slug (Optional)</Label>
            <Input
              id="tag-slug"
              placeholder="Auto-generated if empty"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full justify-center" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Tag"}
          </Button>
        </form>
      </div>
      )}
    </div>
  );
}
