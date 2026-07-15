"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Folder,
  Plus,
  Search,
  Upload,
  FileText,
  Copy,
  Trash2,
  Edit2,
  X,
  ExternalLink,
} from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing";
import {
  getMediaItems,
  deleteMediaItem,
  updateMediaAltText,
  renameMediaItem,
  getDistinctFolders,
} from "@/lib/actions/media.actions";
import { IMedia } from "@/lib/database/models/media.model";
import Image from "next/image";
import Loader from "@/components/shared/Loader";
import { toast } from "react-hot-toast";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";

export default function MediaClient({
  initialFolders,
  access,
}: {
  initialFolders: string[];
  access: DashboardAccess;
}) {
  const [folders, setFolders] = useState<string[]>(initialFolders);
  const [selectedFolder, setSelectedFolder] = useState<string>("All");
  const [items, setItems] = useState<IMedia[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modal controls
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  // Detail sidebar item state
  const [selectedItem, setSelectedItem] = useState<IMedia | null>(null);
  const [tempAlt, setTempAlt] = useState("");
  const [tempName, setTempName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const canCreate = hasPermission(access, "media", "create");
  const canUpdate = hasPermission(access, "media", "update");
  const canDelete = hasPermission(access, "media", "delete");

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await getMediaItems({
        folder: selectedFolder,
        search: searchQuery,
        limit: 100,
      });
      setItems(response.items);

      // Refresh folders list
      const updatedFolders = await getDistinctFolders();
      setFolders(updatedFolders);
    } catch (error) {
      toast.error("Failed to load library items.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedFolder, searchQuery]);

  const handleCreateFolder = () => {
    const formatted = newFolderName.trim().replace(/[^\w\s-]/g, "");
    if (!formatted) {
      toast.error("Invalid folder name.");
      return;
    }
    if (folders.includes(formatted)) {
      toast.error("Folder already exists.");
      return;
    }
    setFolders((prev) => [...prev, formatted].sort());
    setSelectedFolder(formatted);
    setNewFolderName("");
    setIsFolderOpen(false);
    toast.success(`Folder "${formatted}" created.`);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Copied to clipboard.");
  };

  const handleSaveDetails = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      if (tempAlt !== selectedItem.altText) {
        await updateMediaAltText(selectedItem._id.toString(), tempAlt);
      }
      if (tempName !== selectedItem.name) {
        await renameMediaItem(selectedItem._id.toString(), tempName);
      }
      toast.success("Asset details updated.");
      fetchItems();
      setSelectedItem(null);
    } catch (error) {
      toast.error("Failed to update asset details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this media asset?")) return;
    try {
      await deleteMediaItem(id);
      toast.success("Asset deleted.");
      setSelectedItem(null);
      fetchItems();
    } catch (error) {
      toast.error("Failed to delete asset.");
    }
  };

  const handleUploadComplete = () => {
    toast.success("Uploads finished.");
    setIsUploadOpen(false);
    fetchItems();
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-140px)]">
      {/* Sidebar: Folders List */}
      <div className="w-full md:w-60 bg-white p-4 rounded-xl border border-gray-200 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
            Folders
          </h3>
          {canCreate && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setIsFolderOpen(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="space-y-1">
          <Button
            variant={selectedFolder === "All" ? "default" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => setSelectedFolder("All")}
          >
            <Folder className="w-4 h-4" />
            <span>All Assets</span>
          </Button>
          {folders.map((folder) => (
            <Button
              key={folder}
              variant={selectedFolder === folder ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setSelectedFolder(folder)}
            >
              <Folder className="w-4 h-4" />
              <span className="truncate">{folder}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search library assets by name or alt text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {canCreate && (
            <div className="flex gap-2 w-full md:w-auto">
              <Button onClick={() => setIsUploadOpen(true)} className="gap-2 w-full md:w-auto">
                <Upload className="w-4 h-4" />
                Upload Files
              </Button>
            </div>
          )}
        </div>

        {/* Assets Grid */}
        {isLoading ? (
          <Loader label="Loading assets grid..." />
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] border border-dashed rounded-xl p-8 text-gray-500">
            <p>No media files found inside "{selectedFolder}" folder.</p>
            {canCreate && (
              <Button onClick={() => setIsUploadOpen(true)} variant="link" className="mt-2">
                Upload your first file
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => {
              const isImage = item.mimeType?.startsWith("image/");
              return (
                <div
                  key={item._id.toString()}
                  className={`group relative border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition aspect-square bg-gray-50 ${
                    selectedItem?._id === item._id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => {
                    setSelectedItem(item);
                    setTempAlt(item.altText || "");
                    setTempName(item.name || "");
                  }}
                >
                  {isImage ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={item.url}
                        alt={item.altText || item.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 200px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <FileText className="w-12 h-12 text-primary/40 mb-2" />
                      <span className="text-xs font-semibold text-gray-700 truncate w-full text-center px-1">
                        {item.name}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(item.url);
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Side Drawer Modal */}
      {selectedItem && (
        <div className="w-full md:w-80 bg-white p-6 rounded-xl border border-gray-200 shrink-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 text-lg">Asset Details</h3>
              <Button size="icon" variant="ghost" onClick={() => setSelectedItem(null)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-gray-50 mb-6 flex items-center justify-center">
              {selectedItem.mimeType?.startsWith("image/") ? (
                <Image
                  src={selectedItem.url}
                  alt={selectedItem.altText || selectedItem.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <FileText className="w-16 h-16 text-primary/40" />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  File Name
                </label>
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  disabled={!canUpdate}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  SEO Alt Text
                </label>
                <Input
                  value={tempAlt}
                  onChange={(e) => setTempAlt(e.target.value)}
                  placeholder="Describe image for search engines & screen readers"
                  disabled={!canUpdate}
                />
              </div>

              <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                <p><span className="font-semibold">Mime Type:</span> {selectedItem.mimeType}</p>
                {selectedItem.size && (
                  <p>
                    <span className="font-semibold">File Size:</span>{" "}
                    {(selectedItem.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
                <p>
                  <span className="font-semibold">Created:</span>{" "}
                  {new Date(selectedItem.createdAt || "").toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2 pt-4 border-t">
            {canUpdate && (
              <Button
                className="w-full justify-center gap-2"
                onClick={handleSaveDetails}
                disabled={isSaving}
              >
                Save Details
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
                asChild
              >
                <a href={selectedItem.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  View Original
                </a>
              </Button>
              {canDelete && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteItem(selectedItem._id.toString())}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Folder Creation Dialog */}
      {canCreate && (
      <Dialog open={isFolderOpen} onOpenChange={setIsFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g. Sports, Politics, Entertainment"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Upload files Dialog */}
      {canCreate && (
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload Media to "{selectedFolder === "All" ? "Root" : selectedFolder}"</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <UploadDropzone
              endpoint="mediaUploader"
              input={{ folder: selectedFolder === "All" ? "Root" : selectedFolder }}
              onClientUploadComplete={handleUploadComplete}
              onUploadError={(error: Error) => {
                toast.error(`Upload failed: ${error.message}`);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
