"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Save,
  Image as ImageIcon,
  Plus,
  Trash2,
  Share2,
  RotateCcw,
  Copy,
  Eye,
  Globe,
  X,
  Check,
} from "lucide-react";
import { updateSetting } from "@/lib/actions/setting.actions";
import { ISetting } from "@/lib/database/models/setting.model";
import { SEO_DEFAULTS } from "@/constants/seo";
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

  // SEO fields with robust fallback to SEO_DEFAULTS
  const [siteTitle, setSiteTitle] = useState(
    initialSetting?.seo?.siteTitle || SEO_DEFAULTS.siteTitle
  );
  const [siteMetaDescription, setSiteMetaDescription] = useState(
    initialSetting?.seo?.siteMetaDescription || SEO_DEFAULTS.siteDescription
  );
  const [siteKeywordsStr, setSiteKeywordsStr] = useState(
    initialSetting?.seo?.siteKeywords && initialSetting.seo.siteKeywords.length > 0
      ? initialSetting.seo.siteKeywords.join(", ")
      : SEO_DEFAULTS.siteKeywords.join(", ")
  );
  const [ogTitle, setOgTitle] = useState(
    initialSetting?.seo?.ogTitle || initialSetting?.seo?.siteTitle || SEO_DEFAULTS.siteTitle
  );
  const [ogDescription, setOgDescription] = useState(
    initialSetting?.seo?.ogDescription || initialSetting?.seo?.siteMetaDescription || SEO_DEFAULTS.siteDescription
  );
  const [ogImage, setOgImage] = useState(
    initialSetting?.seo?.ogImage || SEO_DEFAULTS.ogImage
  );
  const [twitterCardTitle, setTwitterCardTitle] = useState(
    initialSetting?.seo?.twitterCardTitle || initialSetting?.seo?.ogTitle || initialSetting?.seo?.siteTitle || SEO_DEFAULTS.siteTitle
  );
  const [twitterCardDescription, setTwitterCardDescription] = useState(
    initialSetting?.seo?.twitterCardDescription || initialSetting?.seo?.ogDescription || initialSetting?.seo?.siteMetaDescription || SEO_DEFAULTS.siteDescription
  );
  const [twitterCardImage, setTwitterCardImage] = useState(
    initialSetting?.seo?.twitterCardImage || SEO_DEFAULTS.twitterImage
  );
  const [canonicalUrlBase, setCanonicalUrlBase] = useState(
    initialSetting?.seo?.canonicalUrlBase || SEO_DEFAULTS.canonicalUrlBase
  );
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(
    initialSetting?.seo?.googleAnalyticsId || ""
  );
  const [googleSearchConsoleVerification, setGoogleSearchConsoleVerification] = useState(
    initialSetting?.seo?.googleSearchConsoleVerification || ""
  );

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

  // Reset/Load Default SEO Content
  const handleLoadSeoDefaults = () => {
    setSiteTitle(SEO_DEFAULTS.siteTitle);
    setSiteMetaDescription(SEO_DEFAULTS.siteDescription);
    setSiteKeywordsStr(SEO_DEFAULTS.siteKeywords.join(", "));
    setOgTitle(SEO_DEFAULTS.siteTitle);
    setOgDescription(SEO_DEFAULTS.siteDescription);
    setOgImage(SEO_DEFAULTS.ogImage);
    setTwitterCardTitle(SEO_DEFAULTS.siteTitle);
    setTwitterCardDescription(SEO_DEFAULTS.siteDescription);
    setTwitterCardImage(SEO_DEFAULTS.twitterImage);
    setCanonicalUrlBase(SEO_DEFAULTS.canonicalUrlBase);
    toast.success("Loaded default SEO contents and image paths.");
  };

  // Sync OG details to Twitter Card
  const handleSyncOgToTwitter = () => {
    setTwitterCardTitle(ogTitle || siteTitle || SEO_DEFAULTS.siteTitle);
    setTwitterCardDescription(ogDescription || siteMetaDescription || SEO_DEFAULTS.siteDescription);
    setTwitterCardImage(ogImage || SEO_DEFAULTS.ogImage);
    toast.success("Synced OG contents and image to Twitter Card.");
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
          siteTitle: siteTitle.trim() || SEO_DEFAULTS.siteTitle,
          siteMetaDescription: siteMetaDescription.trim() || SEO_DEFAULTS.siteDescription,
          siteKeywords: siteKeywords.length > 0 ? siteKeywords : [...SEO_DEFAULTS.siteKeywords],
          ogTitle: ogTitle.trim() || siteTitle.trim() || SEO_DEFAULTS.siteTitle,
          ogDescription: ogDescription.trim() || siteMetaDescription.trim() || SEO_DEFAULTS.siteDescription,
          ogImage: ogImage.trim() || SEO_DEFAULTS.ogImage,
          twitterCardTitle: twitterCardTitle.trim() || ogTitle.trim() || SEO_DEFAULTS.siteTitle,
          twitterCardDescription: twitterCardDescription.trim() || ogDescription.trim() || SEO_DEFAULTS.siteDescription,
          twitterCardImage: twitterCardImage.trim() || SEO_DEFAULTS.twitterImage,
          canonicalUrlBase: canonicalUrlBase.trim() || SEO_DEFAULTS.canonicalUrlBase,
          googleAnalyticsId: googleAnalyticsId.trim() || undefined,
          googleSearchConsoleVerification: googleSearchConsoleVerification.trim() || undefined,
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-800">Site Settings</h2>
        </div>
        {canUpdate && (
          <Button onClick={handleSave} disabled={isSubmitting} size="sm" className="gap-2">
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Save All Settings"}
          </Button>
        )}
      </div>

      {/* Contact Info */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                Add, manage, or remove social media handles for the site footer and header.
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

      {/* SEO Settings & Media */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" /> SEO & Meta Contents
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Configure meta titles, descriptions, keywords, Open Graph, and Twitter share images.
              </p>
            </div>
            {canUpdate && (
              <Button
                type="button"
                onClick={handleLoadSeoDefaults}
                variant="outline"
                size="sm"
                className="gap-1.5 text-gray-600 hover:text-gray-900 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Fill Default SEO Contents
              </Button>
            )}
          </div>

          {/* Primary Meta Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Site Meta Title</Label>
              <Input
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="দৈনিক মুক্তিমার্গ। ন্যায়ের পথে মুক্তির আলো"
                disabled={!canUpdate}
              />
              <p className="text-xs text-gray-400">
                Recommended length: 50-60 characters. Appears in browser tabs and search engine results.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Site Meta Description</Label>
              <Textarea
                value={siteMetaDescription}
                onChange={(e) => setSiteMetaDescription(e.target.value)}
                rows={3}
                placeholder="বাংলাদেশের অন্যতম প্রতিনিধিত্বশীল অনলাইন সংবাদ মাধ্যম দৈনিক মুক্তিমার্গ।..."
                disabled={!canUpdate}
              />
              <p className="text-xs text-gray-400">
                Recommended length: 150-160 characters. Displayed below title in search results.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Meta Keywords (comma separated)</Label>
              <Input
                value={siteKeywordsStr}
                onChange={(e) => setSiteKeywordsStr(e.target.value)}
                placeholder="দৈনিক মুক্তিমার্গ, অনলাইন খবর, বাংলাদেশ খবর, সংবাদ"
                disabled={!canUpdate}
              />
            </div>
          </div>

          {/* Open Graph Section */}
          <div className="pt-5 border-t border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" /> Open Graph (Facebook / LinkedIn)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">OG Title</Label>
                  <Input
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    placeholder="দৈনিক মুক্তিমার্গ। ন্যায়ের পথে মুক্তির আলো"
                    disabled={!canUpdate}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">OG Description</Label>
                  <Textarea
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    rows={3}
                    placeholder="বাংলাদেশের অন্যতম প্রতিনিধিত্বশীল অনলাইন সংবাদ মাধ্যম..."
                    disabled={!canUpdate}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">OG Image</Label>
                  <div className="flex gap-2">
                    <Input
                      value={ogImage}
                      onChange={(e) => setOgImage(e.target.value)}
                      placeholder="/assets/images/og-default.webp or https://..."
                      disabled={!canUpdate}
                      className="text-xs flex-1"
                    />
                    {canUpdate && (
                      <>
                        <Button
                          type="button"
                          onClick={() => {
                            setCurrentMediaField("ogImage");
                            setIsMediaOpen(true);
                          }}
                          variant="secondary"
                          size="sm"
                          title="Select image from Media Library"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </Button>
                        {ogImage && (
                          <Button
                            type="button"
                            onClick={() => setOgImage("")}
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            title="Remove OG Image"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* OG Live Preview Card */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Social Card Preview
                </Label>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="relative aspect-[1200/630] bg-gray-100 flex items-center justify-center overflow-hidden">
                    {ogImage ? (
                      <img
                        src={ogImage}
                        alt="OG Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="text-center p-4 text-gray-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-xs">No OG Image Set</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 border-t border-gray-100 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider truncate">
                      {canonicalUrlBase || "DAILYMUKTIMARG.COM"}
                    </p>
                    <p className="text-xs font-bold text-gray-800 line-clamp-1">
                      {ogTitle || siteTitle || "Page Title"}
                    </p>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight">
                      {ogDescription || siteMetaDescription || "Page description..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Twitter Card Section */}
          <div className="pt-5 border-t border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-sky-500" /> Twitter Card (X)
              </h4>
              {canUpdate && (
                <Button
                  type="button"
                  onClick={handleSyncOgToTwitter}
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50"
                >
                  <Copy className="w-3.5 h-3.5" /> Sync from OG
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Twitter Card Title</Label>
                  <Input
                    value={twitterCardTitle}
                    onChange={(e) => setTwitterCardTitle(e.target.value)}
                    placeholder="দৈনিক মুক্তিমার্গ। ন্যায়ের পথে মুক্তির আলো"
                    disabled={!canUpdate}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Twitter Card Description</Label>
                  <Textarea
                    value={twitterCardDescription}
                    onChange={(e) => setTwitterCardDescription(e.target.value)}
                    rows={3}
                    placeholder="বাংলাদেশের অন্যতম প্রতিনিধিত্বশীল অনলাইন সংবাদ মাধ্যম..."
                    disabled={!canUpdate}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Twitter Card Image</Label>
                  <div className="flex gap-2">
                    <Input
                      value={twitterCardImage}
                      onChange={(e) => setTwitterCardImage(e.target.value)}
                      placeholder="/assets/images/og-default.webp or https://..."
                      disabled={!canUpdate}
                      className="text-xs flex-1"
                    />
                    {canUpdate && (
                      <>
                        <Button
                          type="button"
                          onClick={() => {
                            setCurrentMediaField("twitterCardImage");
                            setIsMediaOpen(true);
                          }}
                          variant="secondary"
                          size="sm"
                          title="Select image from Media Library"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </Button>
                        {twitterCardImage && (
                          <Button
                            type="button"
                            onClick={() => setTwitterCardImage("")}
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            title="Remove Twitter Image"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Twitter Card Preview */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Twitter Card Preview
                </Label>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="relative aspect-[1200/630] bg-gray-100 flex items-center justify-center overflow-hidden">
                    {twitterCardImage ? (
                      <img
                        src={twitterCardImage}
                        alt="Twitter Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="text-center p-4 text-gray-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-xs">No Twitter Image Set</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100 bg-white space-y-1">
                    <p className="text-[11px] text-gray-400 truncate">
                      {canonicalUrlBase ? new URL(canonicalUrlBase.startsWith("http") ? canonicalUrlBase : `https://${canonicalUrlBase}`).hostname : "dailymuktimarg.com"}
                    </p>
                    <p className="text-xs font-bold text-gray-900 line-clamp-1">
                      {twitterCardTitle || siteTitle || "Card Title"}
                    </p>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight">
                      {twitterCardDescription || siteMetaDescription || "Card description..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical & Verification URLs */}
          <div className="pt-5 border-t border-gray-200 space-y-4">
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Canonical URL Base</Label>
              <Input
                value={canonicalUrlBase}
                onChange={(e) => setCanonicalUrlBase(e.target.value)}
                placeholder="https://dailymuktimarg.com"
                disabled={!canUpdate}
              />
              <p className="text-xs text-gray-400">
                Base URL for canonical meta tags, sitemap, and open graph absolute image URLs.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Google Analytics Measurement ID</Label>
                <Input
                  value={googleAnalyticsId}
                  onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  disabled={!canUpdate}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Google Search Console Verification</Label>
                <Input
                  value={googleSearchConsoleVerification}
                  onChange={(e) => setGoogleSearchConsoleVerification(e.target.value)}
                  placeholder="googleXXXXXXXXXXXXXXXX.html or code"
                  disabled={!canUpdate}
                  className="text-xs"
                />
              </div>
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
        <Button onClick={handleSave} disabled={isSubmitting} size="lg" className="w-full gap-2 py-6 text-base font-semibold">
          <Save className="w-5 h-5" />
          {isSubmitting ? "Saving All Settings..." : "Save All Settings"}
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
