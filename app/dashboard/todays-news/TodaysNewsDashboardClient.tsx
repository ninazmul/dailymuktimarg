"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Newspaper, Save, LayoutGrid, List, Sparkles, SlidersHorizontal, Eye } from "lucide-react";
import { updateSetting } from "@/lib/actions/setting.actions";
import { ISetting } from "@/lib/database/models/setting.model";
import { toast } from "react-hot-toast";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";
import Link from "next/link";

export default function TodaysNewsDashboardClient({
  initialSetting,
  access,
}: {
  initialSetting: ISetting | null;
  access: DashboardAccess;
}) {
  const currentLayout = initialSetting?.todaysNewsLayout || {};

  const [title, setTitle] = useState(currentLayout.title || "আজকের পত্রিকা");
  const [subtitle, setSubtitle] = useState(
    currentLayout.subtitle || "আজকের প্রকাশিত সকল প্রধান সংবাদ এবং আপডেট"
  );
  const [layoutStyle, setLayoutStyle] = useState<"grid" | "list" | "leadGrid">(
    currentLayout.layoutStyle || "leadGrid"
  );
  const [postsPerPage, setPostsPerPage] = useState<number>(
    currentLayout.postsPerPage || 24
  );
  const [showLeadHero, setShowLeadHero] = useState<boolean>(
    currentLayout.showLeadHero !== undefined ? currentLayout.showLeadHero : true
  );
  const [sortBy, setSortBy] = useState<"publishDate" | "views">(
    currentLayout.sortBy || "publishDate"
  );
  const [showCategoryFilter, setShowCategoryFilter] = useState<boolean>(
    currentLayout.showCategoryFilter !== undefined
      ? currentLayout.showCategoryFilter
      : true
  );
  const [adPlacement, setAdPlacement] = useState<string>(
    currentLayout.adPlacement || "inline"
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const canUpdate = hasPermission(access, "todays-news", "update");

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateSetting({
        todaysNewsLayout: {
          title,
          subtitle,
          layoutStyle,
          postsPerPage,
          showLeadHero,
          sortBy,
          showCategoryFilter,
          adPlacement: (adPlacement as any) || "inline",
        },
      });
      toast.success("Today's News layout saved successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save layout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-800">
              Today&apos;s News Page Layout Manager
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Customize the header, post limits, hero highlights, and display style of the public Today&apos;s News section.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/todays-news" target="_blank">
            <Button variant="outline" className="gap-2">
              <Eye className="w-4 h-4" /> Live Preview
            </Button>
          </Link>
          {canUpdate && (
            <Button onClick={handleSave} disabled={isSubmitting} className="gap-2">
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : "Save Layout"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Customization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                Page Header & Branding
              </CardTitle>
              <CardDescription>Set the main title and subtitle displayed at the top of Today&apos;s News page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Page Title (বাংলা)</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="আজকের পত্রিকা"
                  disabled={!canUpdate}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Page Subtitle</Label>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="আজকের প্রকাশিত সকল প্রধান সংবাদ এবং আপডেট"
                  disabled={!canUpdate}
                />
              </div>
            </CardContent>
          </Card>

          {/* Layout & Presentation Style */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" />
                Layout & Display Style
              </CardTitle>
              <CardDescription>Choose how today&apos;s news articles are arranged on screen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Select Layout Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => canUpdate && setLayoutStyle("leadGrid")}
                    className={`p-4 rounded-xl border-2 text-left transition flex flex-col items-center justify-center text-center gap-2 ${
                      layoutStyle === "leadGrid"
                        ? "border-primary bg-primary/5 text-primary font-semibold"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <Sparkles className="w-6 h-6" />
                    <span className="text-xs">Lead Story + Grid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => canUpdate && setLayoutStyle("grid")}
                    className={`p-4 rounded-xl border-2 text-left transition flex flex-col items-center justify-center text-center gap-2 ${
                      layoutStyle === "grid"
                        ? "border-primary bg-primary/5 text-primary font-semibold"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <LayoutGrid className="w-6 h-6" />
                    <span className="text-xs">Standard Grid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => canUpdate && setLayoutStyle("list")}
                    className={`p-4 rounded-xl border-2 text-left transition flex flex-col items-center justify-center text-center gap-2 ${
                      layoutStyle === "list"
                        ? "border-primary bg-primary/5 text-primary font-semibold"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <List className="w-6 h-6" />
                    <span className="text-xs">List View</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Articles Per Page</Label>
                  <Select
                    value={postsPerPage.toString()}
                    onValueChange={(val) => setPostsPerPage(parseInt(val, 10))}
                    disabled={!canUpdate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 Articles</SelectItem>
                      <SelectItem value="24">24 Articles</SelectItem>
                      <SelectItem value="36">36 Articles</SelectItem>
                      <SelectItem value="48">48 Articles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Sort Default Order</Label>
                  <Select
                    value={sortBy}
                    onValueChange={(val: any) => setSortBy(val)}
                    disabled={!canUpdate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publishDate">Latest First (Time)</SelectItem>
                      <SelectItem value="views">Most Viewed Today</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Advertisement Placement</Label>
                <Select
                  value={adPlacement}
                  onValueChange={(val) => setAdPlacement(val)}
                  disabled={!canUpdate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ad placement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Ads</SelectItem>
                    <SelectItem value="top">Top Banner Ad</SelectItem>
                    <SelectItem value="inline">Inline Banner Ad (Between Grid)</SelectItem>
                    <SelectItem value="bottom">Bottom Ad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Feature Toggles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Toggles & Filtering</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <Checkbox
                  id="leadHero"
                  checked={showLeadHero}
                  onCheckedChange={(v) => canUpdate && setShowLeadHero(!!v)}
                />
                <div>
                  <Label htmlFor="leadHero" className="cursor-pointer font-semibold text-sm">
                    Highlight Top Breaking / Lead Article
                  </Label>
                  <p className="text-xs text-gray-500">
                    Displays today&apos;s primary lead news story as a prominent hero banner at the top of the page.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <Checkbox
                  id="catFilter"
                  checked={showCategoryFilter}
                  onCheckedChange={(v) => canUpdate && setShowCategoryFilter(!!v)}
                />
                <div>
                  <Label htmlFor="catFilter" className="cursor-pointer font-semibold text-sm">
                    Enable Category Filter Bar
                  </Label>
                  <p className="text-xs text-gray-500">
                    Allows readers to filter today&apos;s news by category tabs (e.g. জাতীয়, রাজনীতি, খেলা, বিনোদন).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout Summary Card */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/5 via-white to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base font-bold text-gray-800">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Page Title:</span>
                <span className="font-semibold text-gray-800">{title}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Layout Style:</span>
                <span className="font-semibold text-primary capitalize">{layoutStyle}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Articles Limit:</span>
                <span className="font-semibold text-gray-800">{postsPerPage} articles</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Hero Highlight:</span>
                <span className="font-semibold text-gray-800">
                  {showLeadHero ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Category Filter:</span>
                <span className="font-semibold text-gray-800">
                  {showCategoryFilter ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className="flex justify-between pb-1">
                <span className="text-gray-500">Ad Placement:</span>
                <span className="font-semibold text-gray-800 capitalize">{adPlacement}</span>
              </div>

              {canUpdate && (
                <Button onClick={handleSave} disabled={isSubmitting} className="w-full mt-4 gap-2">
                  <Save className="w-4 h-4" />
                  {isSubmitting ? "Saving..." : "Save Settings"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
