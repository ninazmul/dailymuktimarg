"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Save,
  Image as ImageIcon,
  Plus,
  Trash2,
  Share2,
} from "lucide-react";
import { updateSetting } from "@/lib/actions/setting.actions";
import { ISetting } from "@/lib/database/models/setting.model";
import { toast } from "react-hot-toast";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";
import MediaLibraryModal from "@/components/shared/MediaLibrary/MediaLibraryModal";

interface SocialLinkItem {
  platform: string;
  url: string;
}

const PRESET_PLATFORMS = [
  "facebook",
  "twitter",
  "youtube",
  "instagram",
  "linkedin",
  "whatsapp",
  "telegram",
  "tiktok",
  "pinterest",
  "threads",
];

function getInitialSocialLinks(initialSetting: ISetting | null): SocialLinkItem[] {
  if (!initialSetting?.socialLinks) {
    return [
      { platform: "facebook", url: "" },
      { platform: "twitter", url: "" },
      { platform: "youtube", url: "" },
    ];
  }

  const linksObj =
    initialSetting.socialLinks instanceof Map
      ? Object.fromEntries(initialSetting.socialLinks)
      : (initialSetting.socialLinks as Record<string, string>);

  const items: SocialLinkItem[] = Object.entries(linksObj).map(([platform, url]) => ({
    platform,
    url: url || "",
  }));

  return items.length > 0
    ? items
    : [
        { platform: "facebook", url: "" },
        { platform: "twitter", url: "" },
        { platform: "youtube", url: "" },
      ];
}

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

  // Dynamic Social Links State
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>(
    getInitialSocialLinks(initialSetting)
  );

  const [maintenanceMode, setMaintenanceMode] = useState(initialSetting?.maintenanceMode || false);

  // SEO fields
  const [siteTitle, setSiteTitle] = useState(initialSetting?.seo?.siteTitle || "");
  const [siteMetaDescription, setSiteMetaDescription] = useState(initialSetting?.seo?.siteMetaDescription || "");
  const [siteKeywordsStr, setSiteKeywordsStr] = useState(initialSetting?.seo?.siteKeywords?.join(", ") || "");
  const [ogTitle, setOgTitle] = useState(initialSetting?.seo?.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(initialSetting?.seo?.ogDescription || "");
  const [ogImage, setOgImage] = useState(initialSetting?.seo?.ogImage || "");
  const [twitterCardTitle, setTwitterCardTitle] = useState(initialSetting?.seo?.twitterCardTitle || "");
  const [twitterCardDescription, setTwitterCardDescription] = useState(initialSetting?.seo?.twitterCardDescription || "");
  const [twitterCardImage, setTwitterCardImage] = useState(initialSetting?.seo?.twitterCardImage || "");
  const [canonicalUrlBase, setCanonicalUrlBase] = useState(initialSetting?.seo?.canonicalUrlBase || "");
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(initialSetting?.seo?.googleAnalyticsId || "");
  const [googleSearchConsoleVerification, setGoogleSearchConsoleVerification] = useState(initialSetting?.seo?.googleSearchConsoleVerification || "");

  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [currentMediaField, setCurrentMediaField] = useState<"ogImage" | "twitterCardImage" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canUpdate = hasPermission(access, "settings", "update");

  // Dynamic Social Links Operations
  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: "", url: "" }]);
  };

  const updateSocialLink = (index: number, key: "platform" | "url", value: string) => {
    const updated = [...socialLinks];
    updated[index][key] = value;
    setSocialLinks(updated);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const siteKeywords = siteKeywordsStr.split(",").map((k) => k.trim()).filter(Boolean);

      // Build socialLinks dictionary from dynamic array
      const socialLinksRecord: Record<string, string> = {};
      socialLinks.forEach((item) => {
        const platformKey = item.platform.trim().toLowerCase();
        const urlVal = item.url.trim();
        if (platformKey && urlVal) {
          socialLinksRecord[platformKey] = urlVal;
        }
      });

      await updateSetting({
        contactEmail,
        phoneNumber,
        address,
        socialLinks: socialLinksRecord,
        maintenanceMode,
        seo: {
          siteTitle,
          siteMetaDescription,
          siteKeywords,
          ogTitle,
          ogDescription,
          ogImage,
          twitterCardTitle,
          twitterCardDescription,
          twitterCardImage,
          canonicalUrlBase,
          googleAnalyticsId,
          googleSearchConsoleVerification,
        },
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

      {/* Contact Info */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Contact Email</Label>
              <Input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="info@dailymuktimarg.com"
                disabled={!canUpdate}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+880..."
                disabled={!canUpdate}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dhaka, Bangladesh"
              disabled={!canUpdate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Social Links Section */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">
                Dynamic Social Media Links
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Add, manage, or remove as many social media handles as you need.
              </p>
            </div>
            {canUpdate && (
              <Button
                type="button"
                onClick={addSocialLink}
                variant="outline"
                size="sm"
                className="gap-1 text-primary border-primary hover:bg-primary/5"
              >
                <Plus className="w-4 h-4" /> Add Social Link
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {socialLinks.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg text-sm text-gray-400">
                No social links added. Click &quot;Add Social Link&quot; above to create one.
              </div>
            ) : (
              socialLinks.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200"
                >
                  <div className="w-full sm:w-48 space-y-1">
                    <Label className="text-xs font-semibold text-gray-600">Platform Name</Label>
                    <div className="flex gap-1">
                      <Input
                        placeholder="e.g. facebook, instagram..."
                        value={item.platform}
                        onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                        disabled={!canUpdate}
                        className="bg-white capitalize text-xs"
                      />
                    </div>
                  </div>

                  <div className="w-full flex-1 space-y-1">
                    <Label className="text-xs font-semibold text-gray-600">Profile / Channel URL</Label>
                    <Input
                      placeholder="https://..."
                      value={item.url}
                      onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                      disabled={!canUpdate}
                      className="bg-white text-xs"
                    />
                  </div>

                  {canUpdate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocialLink(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 self-end sm:self-center mt-2 sm:mt-5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">SEO Settings</h3>

          <div className="space-y-1.5">
            <Label>Site Title</Label>
            <Input
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="Daily Muktimarg | অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম"
              disabled={!canUpdate}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Site Meta Description</Label>
            <Textarea
              value={siteMetaDescription}
              onChange={(e) => setSiteMetaDescription(e.target.value)}
              placeholder="বাংলাদেশের অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম। সর্বশেষ খবর, বিশ্লেষণ এবং মতামত।"
              disabled={!canUpdate}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Meta Keywords (comma separated)</Label>
            <Input
              value={siteKeywordsStr}
              onChange={(e) => setSiteKeywordsStr(e.target.value)}
              placeholder="অনলাইন খবর, বাংলাদেশ খবর, Daily Muktimarg, সংবাদ"
              disabled={!canUpdate}
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 mb-4">Open Graph (Facebook/LinkedIn)</h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>OG Title</Label>
                <Input
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder="Daily Muktimarg | অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম"
                  disabled={!canUpdate}
                />
              </div>
              <div className="space-y-1.5">
                <Label>OG Description</Label>
                <Textarea
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                  placeholder="বাংলাদেশের অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম।"
                  disabled={!canUpdate}
                />
              </div>
              <div className="space-y-1.5">
                <Label>OG Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="https://..."
                    disabled={!canUpdate}
                  />
                  {canUpdate && (
                    <Button
                      type="button"
                      onClick={() => {
                        setCurrentMediaField("ogImage");
                        setIsMediaOpen(true);
                      }}
                      variant="secondary"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {ogImage && (
                  <img src={ogImage} alt="OG Preview" className="mt-2 h-24 w-auto rounded object-cover" />
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 mb-4">Twitter Card</h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Twitter Card Title</Label>
                <Input
                  value={twitterCardTitle}
                  onChange={(e) => setTwitterCardTitle(e.target.value)}
                  placeholder="Daily Muktimarg | অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম"
                  disabled={!canUpdate}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Twitter Card Description</Label>
                <Textarea
                  value={twitterCardDescription}
                  onChange={(e) => setTwitterCardDescription(e.target.value)}
                  placeholder="বাংলাদেশের অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম।"
                  disabled={!canUpdate}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Twitter Card Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={twitterCardImage}
                    onChange={(e) => setTwitterCardImage(e.target.value)}
                    placeholder="https://..."
                    disabled={!canUpdate}
                  />
                  {canUpdate && (
                    <Button
                      type="button"
                      onClick={() => {
                        setCurrentMediaField("twitterCardImage");
                        setIsMediaOpen(true);
                      }}
                      variant="secondary"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {twitterCardImage && (
                  <img
                    src={twitterCardImage}
                    alt="Twitter Card Preview"
                    className="mt-2 h-24 w-auto rounded object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-4">
            <div className="space-y-1.5">
              <Label>Canonical URL Base</Label>
              <Input
                value={canonicalUrlBase}
                onChange={(e) => setCanonicalUrlBase(e.target.value)}
                placeholder="https://dailymuktimarg.com"
                disabled={!canUpdate}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Google Analytics ID</Label>
              <Input
                value={googleAnalyticsId}
                onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                disabled={!canUpdate}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Google Search Console Verification</Label>
              <Input
                value={googleSearchConsoleVerification}
                onChange={(e) => setGoogleSearchConsoleVerification(e.target.value)}
                placeholder="googleXXXXXXXXXXXXXXXX.html"
                disabled={!canUpdate}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Advanced</h3>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="maintenance"
              checked={maintenanceMode}
              onCheckedChange={(v) => setMaintenanceMode(!!v)}
              disabled={!canUpdate}
            />
            <Label htmlFor="maintenance" className="cursor-pointer">
              Enable Maintenance Mode
            </Label>
          </div>
          <p className="text-xs text-gray-400">
            When enabled, the public site shows a maintenance page to all visitors.
          </p>
        </CardContent>
      </Card>

      {canUpdate && (
        <Button onClick={handleSave} disabled={isSubmitting} size="lg" className="w-full gap-2">
          <Save className="w-4 h-4" />
          {isSubmitting ? "Saving..." : "Save All Settings"}
        </Button>
      )}

      <MediaLibraryModal
        open={isMediaOpen}
        onOpenChange={setIsMediaOpen}
        onSelect={(url) => {
          if (currentMediaField === "ogImage") setOgImage(url);
          if (currentMediaField === "twitterCardImage") setTwitterCardImage(url);
        }}
      />
    </div>
  );
}
