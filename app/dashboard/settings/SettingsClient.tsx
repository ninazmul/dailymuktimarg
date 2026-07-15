"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Save } from "lucide-react";
import { updateSetting } from "@/lib/actions/setting.actions";
import { ISetting } from "@/lib/database/models/setting.model";
import { toast } from "react-hot-toast";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";

export default function SettingsClient({
  initialSetting,
  access,
}: {
  initialSetting: ISetting | null;
  access: DashboardAccess;
}) {
  const [contactEmail, setContactEmail] = useState(initialSetting?.contactEmail || "");
  const [phoneNumber, setPhoneNumber] = useState(initialSetting?.phoneNumber || "");
  const [address, setAddress] = useState(initialSetting?.address || "");
  const [facebook, setFacebook] = useState(initialSetting?.socialLinks?.get?.("facebook") || (initialSetting?.socialLinks as any)?.facebook || "");
  const [twitter, setTwitter] = useState(initialSetting?.socialLinks?.get?.("twitter") || (initialSetting?.socialLinks as any)?.twitter || "");
  const [youtube, setYoutube] = useState(initialSetting?.socialLinks?.get?.("youtube") || (initialSetting?.socialLinks as any)?.youtube || "");
  const [maintenanceMode, setMaintenanceMode] = useState(initialSetting?.maintenanceMode || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canUpdate = hasPermission(access, "settings", "update");

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateSetting({
        contactEmail, phoneNumber, address,
        socialLinks: { facebook, twitter, youtube },
        maintenanceMode,
      });
      toast.success("Settings saved successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Settings className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-gray-800">Site Settings</h2>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Contact Email</Label>
              <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="info@dailymuktimarg.com" disabled={!canUpdate} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+880..." disabled={!canUpdate} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dhaka, Bangladesh" disabled={!canUpdate} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Social Links</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Facebook</Label>
              <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." disabled={!canUpdate} />
            </div>
            <div className="space-y-1.5">
              <Label>Twitter / X</Label>
              <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/..." disabled={!canUpdate} />
            </div>
            <div className="space-y-1.5">
              <Label>YouTube</Label>
              <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/..." disabled={!canUpdate} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Advanced</h3>
          <div className="flex items-center space-x-2">
            <Checkbox id="maintenance" checked={maintenanceMode} onCheckedChange={(v) => setMaintenanceMode(!!v)} disabled={!canUpdate} />
            <Label htmlFor="maintenance" className="cursor-pointer">Enable Maintenance Mode</Label>
          </div>
          <p className="text-xs text-gray-400">When enabled, the public site shows a maintenance page to all visitors.</p>
        </CardContent>
      </Card>

      {canUpdate && (
        <Button onClick={handleSave} disabled={isSubmitting} size="lg" className="w-full gap-2">
          <Save className="w-4 h-4" />
          {isSubmitting ? "Saving..." : "Save All Settings"}
        </Button>
      )}
    </div>
  );
}
