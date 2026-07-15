"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadDropzone } from "@/lib/uploadthing";
import { getMediaItems, getDistinctFolders } from "@/lib/actions/media.actions";
import { IMedia } from "@/lib/database/models/media.model";
import Image from "next/image";
import Loader from "@/components/shared/Loader";
import { FileText, Search } from "lucide-react";
import { toast } from "react-hot-toast";

interface MediaLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  allowedTypes?: string[]; // e.g. ["image", "pdf"]
}

export default function MediaLibraryModal({
  open,
  onOpenChange,
  onSelect,
}: MediaLibraryModalProps) {
  const [items, setItems] = useState<IMedia[]>([]);
  const [folders, setFolders] = useState<string[]>(["Root"]);
  const [selectedFolder, setSelectedFolder] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("browse");

  // Filter to only show image files
  const filteredItems = items.filter((item) =>
    item.mimeType?.startsWith("image/"),
  );

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const response = await getMediaItems({
        folder: selectedFolder,
        search: searchQuery,
        limit: 50,
      });
      setItems(response.items);

      const distinctFolders = await getDistinctFolders();
      setFolders(distinctFolders);
    } catch (error) {
      toast.error("Failed to load media library assets.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open, selectedFolder, searchQuery]);

  const handleUploadComplete = () => {
    toast.success("File uploaded successfully.");
    setActiveTab("browse");
    fetchMedia();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Media Library
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="browse">Browse Assets</TabsTrigger>
            <TabsTrigger value="upload">Upload New Asset</TabsTrigger>
          </TabsList>

          <TabsContent
            value="browse"
            className="flex-1 flex flex-col overflow-hidden min-h-0"
          >
            {/* Filter controls */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4.5 w-4.5 text-gray-500" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Folders</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder} value={folder}>
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assets Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg bg-gray-50 p-4">
              {isLoading ? (
                <Loader label="Loading library assets..." />
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[250px] text-gray-500">
                  <p>No media files found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {filteredItems.map((item) => {
                    const isImage = item.mimeType?.startsWith("image/");
                    return (
                      <div
                        key={item._id.toString()}
                        className="group relative cursor-pointer border rounded-lg bg-white overflow-hidden hover:shadow-md transition aspect-square"
                        onClick={() => {
                          onSelect(item.url);
                          onOpenChange(false);
                        }}
                      >
                        {isImage ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={item.url}
                              alt={item.altText || item.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 250px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                            <FileText className="w-10 h-10 text-primary/50 mb-2" />
                            <span className="text-xs font-medium text-gray-600 truncate w-full">
                              {item.name}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Button size="sm" variant="secondary">
                            Select Asset
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="upload"
            className="flex-1 overflow-y-auto min-h-0"
          >
            <div className="border rounded-lg bg-gray-50 p-6 flex flex-col items-center justify-center">
              <div className="w-full max-w-lg">
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Upload Destination Folder
                  </label>
                  <Select
                    value={selectedFolder === "All" ? "Root" : selectedFolder}
                    onValueChange={setSelectedFolder}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder} value={folder}>
                          {folder}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <UploadDropzone
                  endpoint="mediaUploader"
                  input={{
                    folder: selectedFolder === "All" ? "Root" : selectedFolder,
                  }}
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={(error: Error) => {
                    toast.error(`Upload failed: ${error.message}`);
                  }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
