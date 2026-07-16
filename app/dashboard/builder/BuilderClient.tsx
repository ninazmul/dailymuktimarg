"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutGrid,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  createHomepageSection,
  updateHomepageSection,
  deleteHomepageSection,
  reorderHomepageSections,
  getHomepageSections,
} from "@/lib/actions/homepage.actions";
import { IHomepageLayout } from "@/lib/database/models/homepageLayout.model";
import { ICategory } from "@/lib/database/models/category.model";
import { toast } from "react-hot-toast";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";

const SECTION_TYPES = [
  { value: "hero", label: "Hero Banner" },
  { value: "lead", label: "Lead Stories Grid" },
  { value: "categoryGrid", label: "Category News Grid" },
  { value: "trending", label: "Trending Now" },
  { value: "breaking", label: "Breaking News" },
  { value: "featured", label: "Featured Articles" },
  { value: "widgets", label: "Widgets Row" },
  { value: "videoGallery", label: "Video Gallery" },
  { value: "photoGallery", label: "Photo Gallery" },
];

const LAYOUT_TYPES = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
  { value: "slider", label: "Slider" },
  { value: "sidebarLayout", label: "Sidebar Layout" },
];

const AD_PLACEMENT_OPTIONS = [
  { value: "", label: "None" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "inline", label: "Inline" },
];

export default function BuilderClient({
  initialSections,
  categories,
  access,
}: {
  initialSections: IHomepageLayout[];
  categories: ICategory[];
  access: DashboardAccess;
}) {
  const [sections, setSections] = useState<IHomepageLayout[]>(initialSections);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [sectionName, setSectionName] = useState("");
  const [sectionType, setSectionType] = useState("categoryGrid");
  const [categoryId, setCategoryId] = useState("");
  const [postsCount, setPostsCount] = useState(6);
  const [layoutType, setLayoutType] = useState("grid");
  const [enabled, setEnabled] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  // New fields
  const [customTitle, setCustomTitle] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [filters, setFilters] = useState({
    featured: false,
    trending: false,
    breaking: false,
    hasVideo: false,
  });
  const [adPlacement, setAdPlacement] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canCreate = hasPermission(access, "homepage-builder", "create");
  const canUpdate = hasPermission(access, "homepage-builder", "update");
  const canDelete = hasPermission(access, "homepage-builder", "delete");
  const canMutate = canUpdate || canDelete;

  const resetForm = () => {
    setSectionName("");
    setSectionType("categoryGrid");
    setCategoryId("");
    setPostsCount(6);
    setLayoutType("grid");
    setEnabled(true);
    setIsPinned(false);
    setCustomTitle("");
    setBackgroundColor("");
    setFilters({
      featured: false,
      trending: false,
      breaking: false,
      hasVideo: false,
    });
    setAdPlacement("");
    setEditingId(null);
  };

  const reload = async () => {
    const data = await getHomepageSections();
    setSections(data);
  };

  const openEdit = (s: IHomepageLayout) => {
    setEditingId(s._id.toString());
    setSectionName(s.sectionName);
    setSectionType(s.sectionType);
    setCategoryId(
      s.categoryId
        ? (s.categoryId as any)._id?.toString() || s.categoryId.toString()
        : "",
    );
    setPostsCount(s.postsCount || 6);
    setLayoutType(s.layoutType || "grid");
    setEnabled(s.enabled !== false);
    setIsPinned(s.isPinned || false);
    setCustomTitle(s.customTitle || "");
    setBackgroundColor(s.backgroundColor || "");
    setFilters({
      featured: s.filters?.featured ?? false,
      trending: s.filters?.trending ?? false,
      breaking: s.filters?.breaking ?? false,
      hasVideo: s.filters?.hasVideo ?? false,
    });
    setAdPlacement(s.adPlacement || "");
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!sectionName.trim()) {
      toast.error("Section name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        sectionName,
        sectionType,
        categoryId: categoryId || undefined,
        postsCount,
        layoutType,
        enabled,
        isPinned,
        customTitle: customTitle || undefined,
        backgroundColor: backgroundColor || undefined,
        filters: {
          featured: filters.featured || undefined,
          trending: filters.trending || undefined,
          breaking: filters.breaking || undefined,
          hasVideo: filters.hasVideo || undefined,
        },
        adPlacement: adPlacement || undefined,
      };
      if (editingId) {
        await updateHomepageSection(editingId, payload);
        toast.success("Section updated.");
      } else {
        await createHomepageSection(payload);
        toast.success("Section created.");
      }
      resetForm();
      setIsFormOpen(false);
      await reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to save section.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this homepage section?")) return;
    try {
      await deleteHomepageSection(id);
      toast.success("Section removed.");
      await reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete.");
    }
  };

  const handleToggleEnabled = async (s: IHomepageLayout) => {
    try {
      await updateHomepageSection(s._id.toString(), { enabled: !s.enabled });
      await reload();
    } catch (err: any) {
      toast.error("Failed to toggle.");
    }
  };

  const moveSection = async (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSections.length) return;

    [newSections[index], newSections[swapIdx]] = [
      newSections[swapIdx],
      newSections[index],
    ];
    setSections(newSections);

    try {
      await reorderHomepageSections(
        newSections.map((s, i) => ({ id: s._id.toString(), order: i })),
      );
    } catch (err: any) {
      toast.error("Reorder failed.");
      await reload();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-800">
            Homepage Layout Builder
          </h2>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Add Section
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Drag sections to reorder how content appears on the public homepage.
        Each section maps to a visual block.
      </p>

      {sections.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-xl text-gray-500">
          No homepage sections configured. Click "Add Section" to start
          building.
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((s, idx) => (
            <div
              key={s._id.toString()}
              className={`flex items-center gap-4 p-4 rounded-lg border transition ${
                s.enabled ? "bg-white" : "bg-gray-50 opacity-60"
              }`}
            >
              <GripVertical className="w-5 h-5 text-gray-400 shrink-0 cursor-grab" />

              <div className="flex flex-col md:flex-row md:items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                    {s.sectionType}
                  </span>
                  <span className="font-semibold text-gray-800 truncate">
                    {s.sectionName}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  {(s.categoryId as any)?.name && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      {(s.categoryId as any).name}
                    </span>
                  )}
                  <span>{s.postsCount} posts</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                    {s.layoutType}
                  </span>
                  {s.isPinned && (
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      Pinned
                    </span>
                  )}
                  {s.backgroundColor && (
                    <span
                      className="px-2 py-0.5 rounded border"
                      style={{ backgroundColor: s.backgroundColor }}
                    >
                      Custom BG
                    </span>
                  )}
                  {s.adPlacement && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Ad: {s.adPlacement}
                    </span>
                  )}
                </div>
              </div>

              {canMutate && (
                <div className="flex items-center gap-1 shrink-0">
                  {canUpdate && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => moveSection(idx, "up")}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => moveSection(idx, "down")}
                        disabled={idx === sections.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleToggleEnabled(s)}
                      >
                        {s.enabled ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(s)}
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </Button>
                    </>
                  )}
                  {canDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleDelete(s._id.toString())}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Section" : "Add Homepage Section"}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic">
            <TabsList>
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>Section Name *</Label>
                <Input
                  placeholder="e.g. Politics Grid, Sports Highlights"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Section Type</Label>
                  <Select value={sectionType} onValueChange={setSectionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Layout Style</Label>
                  <Select value={layoutType} onValueChange={setLayoutType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYOUT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Linked Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((c) => (
                        <SelectItem
                          key={c._id.toString()}
                          value={c._id.toString()}
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Posts Count</Label>
                  <Input
                    type="number"
                    value={postsCount}
                    onChange={(e) =>
                      setPostsCount(parseInt(e.target.value) || 6)
                    }
                  />
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sec-enabled"
                    checked={enabled}
                    onCheckedChange={(v) => setEnabled(!!v)}
                  />
                  <Label htmlFor="sec-enabled" className="cursor-pointer">
                    Enabled
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sec-pinned"
                    checked={isPinned}
                    onCheckedChange={(v) => setIsPinned(!!v)}
                  />
                  <Label htmlFor="sec-pinned" className="cursor-pointer">
                    Pinned
                  </Label>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="advanced" className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>Custom Title (optional)</Label>
                <Input
                  placeholder="Custom display title for this section"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Background Color (optional)</Label>
                <Input
                  type="color"
                  value={backgroundColor || "#ffffff"}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Article Filters</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="f-featured"
                      checked={filters.featured}
                      onCheckedChange={(v) =>
                        setFilters((prev) => ({ ...prev, featured: !!v }))
                      }
                    />
                    <Label htmlFor="f-featured" className="cursor-pointer">
                      Featured Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="f-trending"
                      checked={filters.trending}
                      onCheckedChange={(v) =>
                        setFilters((prev) => ({ ...prev, trending: !!v }))
                      }
                    />
                    <Label htmlFor="f-trending" className="cursor-pointer">
                      Trending Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="f-breaking"
                      checked={filters.breaking}
                      onCheckedChange={(v) =>
                        setFilters((prev) => ({ ...prev, breaking: !!v }))
                      }
                    />
                    <Label htmlFor="f-breaking" className="cursor-pointer">
                      Breaking Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="f-video"
                      checked={filters.hasVideo}
                      onCheckedChange={(v) =>
                        setFilters((prev) => ({ ...prev, hasVideo: !!v }))
                      }
                    />
                    <Label htmlFor="f-video" className="cursor-pointer">
                      With Video Only
                    </Label>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Ad Placement</Label>
                <Select value={adPlacement} onValueChange={setAdPlacement}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AD_PLACEMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Create Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
