"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  X,
  ChevronRight,
  Settings,
} from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/category.actions";
import { ICategory } from "@/lib/database/models/category.model";
import { toast } from "react-hot-toast";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";

export default function CategoryClient({
  initialCategories,
  access,
}: {
  initialCategories: ICategory[];
  access: DashboardAccess;
}) {
  const [categories, setCategories] = useState<ICategory[]>(initialCategories);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [priority, setPriority] = useState<number>(0);
  const [isNavbar, setIsNavbar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canCreate = hasPermission(access, "categories", "create");
  const canUpdate = hasPermission(access, "categories", "update");
  const canDelete = hasPermission(access, "categories", "delete");
  const canEditForm = isEditing ? canUpdate : canCreate;
  const canMutate = canUpdate || canDelete;

  const resetForm = () => {
    setName("");
    setSlug("");
    setParentId("none");
    setPriority(0);
    setIsNavbar(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditClick = (cat: ICategory) => {
    setIsEditing(true);
    setEditingId(cat._id.toString());
    setName(cat.name);
    setSlug(cat.slug);
    setParentId(cat.parentId ? (cat.parentId as any)._id?.toString() || cat.parentId.toString() : "none");
    setPriority(cat.priority || 0);
    setIsNavbar(cat.isNavbar || false);
  };

  const reloadCategories = async () => {
    try {
      const { getCategories } = await import("@/lib/actions/category.actions");
      const data = await getCategories();
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        slug: slug.trim() || undefined,
        parentId: parentId === "none" ? undefined : parentId,
        priority,
        isNavbar,
      };

      if (isEditing && editingId) {
        await updateCategory(editingId, payload);
        toast.success("Category updated.");
      } else {
        await createCategory(payload);
        toast.success("Category created.");
      }
      resetForm();
      await reloadCategories();
    } catch (error: any) {
      toast.error(error.message || "Operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory(id);
      toast.success("Category deleted.");
      await reloadCategories();
      if (editingId === id) resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category.");
    }
  };

  // Build recursive tree map helper
  const renderTree = (parent: string | null = null, depth = 0) => {
    const list = categories.filter((c) => {
      const pid = c.parentId ? (c.parentId as any)._id?.toString() || c.parentId.toString() : null;
      return pid === parent;
    });

    if (list.length === 0) return null;

    return (
      <div className="space-y-2 mt-2">
        {list.map((cat) => (
          <div key={cat._id.toString()} className="flex flex-col">
            <div
              className={`flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50 transition`}
              style={{ marginLeft: `${depth * 20}px` }}
            >
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-800">{cat.name}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  /{cat.slug}
                </span>
                {cat.isNavbar && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Nav
                  </span>
                )}
                {cat.priority > 0 && (
                  <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                    Priority: {cat.priority}
                  </span>
                )}
              </div>

              {canMutate && (
                <div className="flex gap-2">
                  {canUpdate && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEditClick(cat)}
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleDelete(cat._id.toString())}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            {renderTree(cat._id.toString(), depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Category List Panel */}
      <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <FolderTree className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-800">Category Structure</h2>
        </div>

        {categories.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-xl text-gray-500">
            No categories defined yet. Use the form to add categories.
          </div>
        ) : (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {renderTree(null)}
          </div>
        )}
      </div>

      {/* Form Panel */}
      {canEditForm && (
      <div className="w-full lg:w-96 bg-white p-6 rounded-xl border border-gray-200 shrink-0 h-fit">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-gray-800">
            {isEditing ? "Modify Category" : "Add New Category"}
          </h3>
          {isEditing && (
            <Button size="icon" variant="ghost" onClick={resetForm} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Category Title *</Label>
            <Input
              id="cat-name"
              placeholder="e.g. International, Sports"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">URL Slug (Optional)</Label>
            <Input
              id="cat-slug"
              placeholder="Auto-generated if empty"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-parent">Parent Category</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Parent Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Root Category)</SelectItem>
                {categories
                  .filter((cat) => cat._id.toString() !== editingId)
                  .map((cat) => (
                    <SelectItem key={cat._id.toString()} value={cat._id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-priority">Priority Order</Label>
              <Input
                id="cat-priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="cat-nav"
                checked={isNavbar}
                onCheckedChange={(checked) => setIsNavbar(!!checked)}
              />
              <Label htmlFor="cat-nav" className="cursor-pointer">
                Show in Navbar
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full justify-center" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : isEditing ? "Save Changes" : "Create Category"}
          </Button>
        </form>
      </div>
      )}
    </div>
  );
}
