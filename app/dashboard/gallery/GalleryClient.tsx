"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Camera,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Image as ImageIcon,
  Search,
  Sparkles,
} from "lucide-react";
import {
  createGallery,
  updateGallery,
  deleteGallery,
  getGalleries,
} from "@/lib/actions/gallery.actions";
import { IGallery, ISecondaryPhoto } from "@/lib/database/models/gallery.model";
import { toast } from "react-hot-toast";
import MediaLibraryModal from "@/components/shared/MediaLibrary/MediaLibraryModal";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";
import Image from "next/image";
import Link from "next/link";

interface SecondaryPhotoState {
  url: string;
  caption: string;
}

export default function GalleryClient({
  initialResult,
  access,
}: {
  initialResult: { items: IGallery[]; totalCount: number; totalPages: number; currentPage: number };
  access: DashboardAccess;
}) {
  const [items, setItems] = useState<IGallery[]>(initialResult.items);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [secondaryPhotos, setSecondaryPhotos] = useState<SecondaryPhotoState[]>([]);
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Media Library Selection Modal State
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [mediaTargetIndex, setMediaTargetIndex] = useState<number | "main">("main");

  const canCreate = hasPermission(access, "gallery", "create");
  const canUpdate = hasPermission(access, "gallery", "update");
  const canDelete = hasPermission(access, "gallery", "delete");

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setSlug("");
    setMainImage("");
    setSecondaryPhotos([]);
    setStatus("published");
    setEditingId(null);
  };

  const reloadData = async () => {
    const res = await getGalleries({
      search: searchQuery,
      status: filterStatus === "all" ? undefined : filterStatus,
      limit: 50,
    });
    setItems(res.items);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await reloadData();
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditModal = (item: IGallery) => {
    setEditingId(item._id.toString());
    setTitle(item.title || "");
    setSubtitle(item.subtitle || "");
    setSlug(item.slug || "");
    setMainImage(item.mainImage || "");
    setSecondaryPhotos(
      item.secondaryPhotos?.map((p) => ({
        url: p.url || "",
        caption: p.caption || "",
      })) || []
    );
    setStatus(item.status || "published");
    setIsFormOpen(true);
  };

  const handleMainImagePick = () => {
    setMediaTargetIndex("main");
    setIsMediaOpen(true);
  };

  const handleSecondaryImagePick = (index: number) => {
    setMediaTargetIndex(index);
    setIsMediaOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    if (mediaTargetIndex === "main") {
      setMainImage(url);
    } else if (typeof mediaTargetIndex === "number") {
      const updated = [...secondaryPhotos];
      if (updated[mediaTargetIndex]) {
        updated[mediaTargetIndex].url = url;
        setSecondaryPhotos(updated);
      }
    }
    setIsMediaOpen(false);
  };

  const addSecondaryPhoto = () => {
    setSecondaryPhotos([...secondaryPhotos, { url: "", caption: "" }]);
  };

  const updateSecondaryPhoto = (index: number, key: "url" | "caption", value: string) => {
    const updated = [...secondaryPhotos];
    updated[index][key] = value;
    setSecondaryPhotos(updated);
  };

  const removeSecondaryPhoto = (index: number) => {
    setSecondaryPhotos(secondaryPhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!mainImage.trim()) {
      toast.error("Main cover image is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        subtitle,
        slug: slug.trim() || undefined,
        mainImage,
        secondaryPhotos: secondaryPhotos.filter((p) => p.url.trim() !== ""),
        status,
      };

      if (editingId) {
        await updateGallery(editingId, payload);
        toast.success("Gallery item updated successfully");
      } else {
        await createGallery(payload);
        toast.success("Gallery item created successfully");
      }

      resetForm();
      setIsFormOpen(false);
      await reloadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save gallery item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo gallery album?")) return;
    try {
      await deleteGallery(id);
      toast.success("Gallery deleted successfully");
      await reloadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete gallery");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-7 h-7 text-primary" />
            Gallery & Photos Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage photo albums, main images, and secondary photo collections with captions.
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Gallery
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 p-4 rounded-lg">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <Input
            placeholder="Search galleries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs bg-white"
          />
          <Button type="submit" variant="secondary" size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter Status:</Label>
          <Select
            value={filterStatus}
            onValueChange={(val) => {
              setFilterStatus(val);
              setTimeout(() => reloadData(), 50);
            }}
          >
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[100px]">Cover</TableHead>
              <TableHead>Title & Subtitle</TableHead>
              <TableHead className="w-[140px]">Secondary Photos</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[140px]">Created At</TableHead>
              <TableHead className="text-right w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  No gallery albums found. Click &quot;Add New Gallery&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item._id.toString()}>
                  <TableCell>
                    <div className="relative w-16 h-12 rounded overflow-hidden bg-gray-100 border">
                      {item.mainImage ? (
                        <Image
                          src={item.mainImage}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-gray-900 line-clamp-1">{item.title}</div>
                    {item.subtitle && (
                      <div className="text-xs text-gray-500 line-clamp-1">{item.subtitle}</div>
                    )}
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">/gallery/{item.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {item.secondaryPhotos?.length || 0} photos
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.status === "published"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.status === "published" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="View Public Page"
                        >
                          <Link href={`/gallery/${item.slug}`} target="_blank">
                            <ExternalLink className="w-4 h-4 text-gray-600" />
                          </Link>
                        </Button>
                      )}
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item._id.toString())}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Dialog Form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              {editingId ? "Edit Gallery Album" : "Create New Gallery Album"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-2">
            {/* Title & Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold">
                  Gallery Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Annual Festival Highlights 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="font-semibold">
                  Slug (URL path)
                </Label>
                <Input
                  id="slug"
                  placeholder="e.g. annual-festival-2026 (auto generated if empty)"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle" className="font-semibold">
                Subtitle / Brief Description
              </Label>
              <Textarea
                id="subtitle"
                placeholder="A brief overview or tagline for this photo collection..."
                rows={2}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            {/* Main Cover Image */}
            <div className="space-y-3 p-4 bg-gray-50 border rounded-lg">
              <Label className="font-semibold text-gray-900 block">
                Main Cover Photo <span className="text-red-500">*</span>
              </Label>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {mainImage ? (
                  <div className="relative w-32 h-20 rounded-md overflow-hidden border bg-white flex-shrink-0">
                    <Image src={mainImage} alt="Main Preview" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-32 h-20 rounded-md border border-dashed flex flex-col items-center justify-center bg-white text-gray-400 text-xs gap-1 flex-shrink-0">
                    <ImageIcon className="w-6 h-6" />
                    <span>No Image</span>
                  </div>
                )}

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste main image URL..."
                      value={mainImage}
                      onChange={(e) => setMainImage(e.target.value)}
                      className="bg-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleMainImagePick}
                      className="whitespace-nowrap flex items-center gap-1"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Select / Upload
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Photos Options with Captions */}
            <div className="space-y-4 border p-4 rounded-lg bg-gray-50/50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Secondary Photos & Captions</h3>
                  <p className="text-xs text-gray-500">
                    Add extra photos to this gallery along with individual photo captions.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addSecondaryPhoto}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-primary border-primary hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4" /> Add Secondary Photo
                </Button>
              </div>

              {secondaryPhotos.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500 border border-dashed rounded-md bg-white">
                  No secondary photos added yet. Click &quot;Add Secondary Photo&quot; to append images with captions.
                </div>
              ) : (
                <div className="space-y-4">
                  {secondaryPhotos.map((photo, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row gap-4 items-start p-3 bg-white rounded-lg border border-gray-200 relative group"
                    >
                      <div className="relative w-full sm:w-28 h-20 rounded border bg-gray-100 flex-shrink-0 overflow-hidden">
                        {photo.url ? (
                          <Image src={photo.url} alt={`Photo ${index + 1}`} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                            <ImageIcon className="w-5 h-5 mb-1" />
                            <span>Photo {index + 1}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Secondary Photo URL..."
                            value={photo.url}
                            onChange={(e) => updateSecondaryPhoto(index, "url", e.target.value)}
                            className="text-xs"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSecondaryImagePick(index)}
                            className="whitespace-nowrap text-xs"
                          >
                            Upload/Select
                          </Button>
                        </div>
                        <Input
                          placeholder="Photo Caption (e.g. Spectators enjoying the performance)..."
                          value={photo.caption}
                          onChange={(e) => updateSecondaryPhoto(index, "caption", e.target.value)}
                          className="text-xs"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSecondaryPhoto(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 self-end sm:self-start"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="font-semibold">Publication Status</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Footer */}
            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? "Saving..." : editingId ? "Update Gallery" : "Create Gallery"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Media Library Modal Integration */}
      <MediaLibraryModal
        open={isMediaOpen}
        onOpenChange={setIsMediaOpen}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
