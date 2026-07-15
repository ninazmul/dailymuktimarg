"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Megaphone, Plus, Trash2, Edit2 } from "lucide-react";
import { createAd, updateAd, deleteAd, getAds } from "@/lib/actions/ad.actions";
import { IAd } from "@/lib/database/models/ad.model";
import { toast } from "react-hot-toast";
import MediaLibraryModal from "@/components/shared/MediaLibrary/MediaLibraryModal";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";

const PLACEMENTS = ["header", "sidebar", "footer", "popup", "sticky", "inline", "mobile"] as const;

export default function AdsClient({
  initialAds,
  access,
}: {
  initialAds: IAd[];
  access: DashboardAccess;
}) {
  const [ads, setAds] = useState<IAd[]>(initialAds);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [placement, setPlacement] = useState<string>("sidebar");
  const [client, setClient] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [priority, setPriority] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canCreate = hasPermission(access, "ads", "create");
  const canUpdate = hasPermission(access, "ads", "update");
  const canDelete = hasPermission(access, "ads", "delete");
  const canMutate = canUpdate || canDelete;

  const resetForm = () => {
    setPlacement("sidebar"); setClient(""); setImageUrl(""); setHtmlCode("");
    setTargetUrl(""); setStartDate(""); setEndDate(""); setStatus("active");
    setPriority(0); setEditingId(null);
  };

  const reload = async () => { const data = await getAds(); setAds(data); };

  const openEdit = (ad: IAd) => {
    setEditingId(ad._id.toString());
    setPlacement(ad.placement); setClient(ad.client || "");
    setImageUrl(ad.imageUrl || ""); setHtmlCode(ad.htmlCode || "");
    setTargetUrl(ad.targetUrl || ""); setStatus(ad.status || "active");
    setPriority(ad.priority || 0);
    setStartDate(ad.startDate ? new Date(ad.startDate).toISOString().slice(0, 10) : "");
    setEndDate(ad.endDate ? new Date(ad.endDate).toISOString().slice(0, 10) : "");
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        placement, client, imageUrl, htmlCode, targetUrl, status, priority,
        startDate: startDate || undefined, endDate: endDate || undefined,
      };
      if (editingId) {
        await updateAd(editingId, payload);
        toast.success("Ad updated.");
      } else {
        await createAd(payload);
        toast.success("Ad created.");
      }
      resetForm(); setIsFormOpen(false); await reload();
    } catch (err: any) { toast.error(err.message || "Failed."); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this advertisement?")) return;
    try { await deleteAd(id); toast.success("Ad deleted."); await reload(); }
    catch (err: any) { toast.error("Failed to delete."); }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-800">Advertisements</h2>
        </div>
        {canCreate && (
          <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Create Ad
          </Button>
        )}
      </div>

      {ads.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-xl text-gray-500">No advertisements configured.</div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placement</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Target URL</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                {canMutate && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map((ad) => (
                <TableRow key={ad._id.toString()} className="bg-white">
                  <TableCell>
                    <Badge variant="outline" className="uppercase text-xs">{ad.placement}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{ad.client || "—"}</TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">{ad.targetUrl || "—"}</TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {ad.startDate ? new Date(ad.startDate).toLocaleDateString() : "—"} → {ad.endDate ? new Date(ad.endDate).toLocaleDateString() : "∞"}
                  </TableCell>
                  <TableCell>
                    <Badge className={ad.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>{ad.status}</Badge>
                  </TableCell>
                  {canMutate && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(ad)}><Edit2 className="w-4 h-4" /></Button>
                        )}
                        {canDelete && (
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(ad._id.toString())}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Ad" : "Create Advertisement"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Placement *</Label>
                <Select value={placement} onValueChange={setPlacement}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Client / Advertiser Name</Label>
              <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Grameenphone" />
            </div>
            <div className="space-y-1.5">
              <Label>Banner Image</Label>
              <div className="flex gap-2">
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="flex-1" />
                <Button type="button" variant="secondary" onClick={() => setIsMediaOpen(true)}>Browse</Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Custom HTML/Script (optional)</Label>
              <Textarea rows={3} value={htmlCode} onChange={(e) => setHtmlCode(e.target.value)} placeholder="<script>...</script> or embed code" />
            </div>
            <div className="space-y-1.5">
              <Label>Target URL (click destination)</Label>
              <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Input type="number" value={priority} onChange={(e) => setPriority(parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : editingId ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaLibraryModal open={isMediaOpen} onOpenChange={setIsMediaOpen} onSelect={(url) => setImageUrl(url)} />
    </div>
  );
}
