"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PenTool,
  Trash2,
  Edit2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  User,
} from "lucide-react";
import {
  createReporter,
  updateReporter,
  deleteReporter,
  getReporters,
} from "@/lib/actions/reporter.actions";
import { IReporter } from "@/lib/database/models/reporter.model";
import { toast } from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";

export default function ReportersClient({
  initialResult,
  initialSearch,
  access,
}: {
  initialResult: {
    reporters: IReporter[];
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
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canCreate = hasPermission(access, "reporters", "create");
  const canUpdate = hasPermission(access, "reporters", "update");
  const canDelete = hasPermission(access, "reporters", "delete");
  const canEditForm = isEditing ? canUpdate : canCreate;
  const canMutate = canUpdate || canDelete;

  const resetForm = () => {
    setName("");
    setEmail("");
    setBio("");
    setImage("");
    setFacebookUrl("");
    setTwitterUrl("");
    setInstagramUrl("");
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEditClick = (reporter: IReporter) => {
    setIsEditing(true);
    setEditingId(reporter._id.toString());
    setName(reporter.name);
    setEmail(reporter.email || "");
    setBio(reporter.bio || "");
    setImage(reporter.image || "");
    const links = reporter.socialLinks
      ? Object.fromEntries(reporter.socialLinks)
      : {};
    setFacebookUrl(links.facebook || "");
    setTwitterUrl(links.twitter || "");
    setInstagramUrl(links.instagram || "");
  };

  const reloadReporters = async (page = result.currentPage, query = search) => {
    try {
      const response = await getReporters({
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
    reloadReporters(1, val);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.replace(`${pathname}?${params.toString()}`);
    reloadReporters(newPage, search);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const socialLinks: Record<string, string> = {};
      if (facebookUrl.trim()) socialLinks.facebook = facebookUrl.trim();
      if (twitterUrl.trim()) socialLinks.twitter = twitterUrl.trim();
      if (instagramUrl.trim()) socialLinks.instagram = instagramUrl.trim();
      
      if (isEditing && editingId) {
        await updateReporter(editingId, { 
        name, 
        email: email.trim() || undefined, 
        bio: bio.trim() || undefined, 
        image: image.trim() || undefined, 
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      });
        toast.success("Reporter updated.");
      } else {
        await createReporter({ 
        name, 
        email: email.trim() || undefined, 
        bio: bio.trim() || undefined, 
        image: image.trim() || undefined, 
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      });
        toast.success("Reporter created.");
      }
      resetForm();
      await reloadReporters();
    } catch (error: any) {
      toast.error(error.message || "Failed to save reporter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reporter?")) return;
    try {
      await deleteReporter(id);
      toast.success("Reporter deleted.");
      await reloadReporters();
      if (editingId === id) resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete reporter.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Reporters List panel */}
      <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <PenTool className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-800">Manage Reporters</h2>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search reporters..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
        </div>

        {result.reporters.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-xl text-gray-500">
            No reporters found. Add reporters using the form on the right.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-3">
              {result.reporters.map((reporter) => {
              const links = reporter.socialLinks
                ? Object.fromEntries(reporter.socialLinks)
                : {};
              
              return (
                <div
                  key={reporter._id.toString()}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-4 w-32 h-32">
                    {reporter.image ? (
                      <img
                        src={reporter.image}
                        alt={reporter.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold text-gray-800">
                      {reporter.name}
                    </span>
                    {reporter.email && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {reporter.email}
                      </span>
                    )}
                    {reporter.bio && (
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {reporter.bio}
                      </p>
                    )}
                    {Object.keys(links).length > 0 && (
                      <div className="flex gap-2 mt-1">
                        {links.facebook && (
                        <span className="text-xs text-blue-600">Facebook</span>
                      )}
                        {links.twitter && (
                        <span className="text-xs text-blue-400">Twitter</span>
                      )}
                        {links.instagram && (
                        <span className="text-xs text-pink-600">Instagram</span>
                      )}
                      </div>
                    )}
                  </div>
                  {canMutate && (
                    <div className="flex shrink-0">
                      {canUpdate && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleEditClick(reporter)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDelete(reporter._id.toString())}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
            {isEditing ? "Modify Reporter" : "Create New Reporter"}
          </h3>
          {isEditing && (
            <Button size="icon" variant="ghost" onClick={resetForm} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reporter-name">Name *</Label>
            <Input
              id="reporter-name"
              placeholder="Reporter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reporter-email">Email (Optional)</Label>
            <Input
              id="reporter-email"
              type="email"
              placeholder="reporter@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reporter-image">Profile Image URL (Optional)</Label>
            <Input
              id="reporter-image"
              placeholder="https://..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reporter-bio">Bio (Optional)</Label>
            <Textarea
              id="reporter-bio"
              placeholder="Short bio about reporter"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Social Links (Optional)</Label>
            <div className="space-y-2">
              <Input
                placeholder="Facebook URL"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
              />
              <Input
                placeholder="Twitter/X URL"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
              />
              <Input
                placeholder="Instagram URL"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full justify-center" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Reporter"}
          </Button>
        </form>
      </div>
      )}
    </div>
  );
}
