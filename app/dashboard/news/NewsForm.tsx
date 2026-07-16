"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Sparkles } from "lucide-react";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import MediaLibraryModal from "@/components/shared/MediaLibrary/MediaLibraryModal";
import {
  createNewsArticle,
  updateNewsArticle,
} from "@/lib/actions/news.actions";
import { ICategory } from "@/lib/database/models/category.model";
import { ITag } from "@/lib/database/models/tag.model";
import { IReporter } from "@/lib/database/models/reporter.model";
import { IAuthor } from "@/lib/database/models/author.model";
import { INews } from "@/lib/database/models/news.model";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { generateSlug } from "@/lib/utils";

// Schema validation with Zod
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  subtitle: z.string().optional(),
  slug: z.string().min(1, "Slug is required"),
  summary: z.string().optional(),
  content: z.string().optional(),
  featuredImage: z.string().min(1, "Featured Image is required"),
  gallery: z.array(z.string()).default([]),
  video: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  nestedCategoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  reporterId: z.string().optional(),
  authorId: z.string().optional(),
  source: z.string().optional(),
  location: z.string().optional(),
  publishDate: z.string().optional(),
  schedulePublish: z.string().optional(),
  status: z.enum(["draft", "review", "published", "archived"]),
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywordsString: z.string().optional(), // Temp comma-separated field
  canonicalUrl: z.string().optional(),
  featured: z.boolean().default(false),
  trending: z.boolean().default(false),
  breaking: z.boolean().default(false),
  headline: z.string().optional(),
  lead: z.boolean().default(false),
  leadPosition: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewsFormProps {
  initialData?: INews;
  categories: ICategory[];
  tags: ITag[];
  reporters: IReporter[];
  authors: IAuthor[];
}

export default function NewsForm({
  initialData,
  categories,
  tags,
  reporters,
  authors,
}: NewsFormProps) {
  const router = useRouter();
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sub-categories list computed from active parent Category selection
  const [subCategories, setSubCategories] = useState<ICategory[]>([]);

  // Format initial values for date selectors
  const formatDateValue = (d?: Date | string) => {
    if (!d) return "";
    const date = new Date(d);
    // Format to YYYY-MM-DDThh:mm
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzoffset)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: initialData?.title || "",
      subtitle: initialData?.subtitle || "",
      slug: initialData?.slug || "",
      summary: initialData?.summary || "",
      content: initialData?.content || "",
      featuredImage: initialData?.featuredImage || "",
      gallery: initialData?.gallery || [],
      video: initialData?.video || "",
      categoryId: initialData?.categoryId?.toString() || "",
      nestedCategoryId: initialData?.nestedCategoryId?.toString() || "",
      tags:
        initialData?.tags?.map((t: any) => t._id?.toString() || t.toString()) ||
        [],
      reporterId: initialData?.reporterId?.toString() || "",
      authorId: initialData?.authorId?.toString() || "",
      source: initialData?.source || "",
      location: initialData?.location || "",
      publishDate: formatDateValue(initialData?.publishDate),
      schedulePublish: formatDateValue(initialData?.schedulePublish),
      status: initialData?.status || "draft",
      seoTitle: initialData?.seoTitle || "",
      metaDescription: initialData?.metaDescription || "",
      keywordsString: initialData?.keywords?.join(", ") || "",
      canonicalUrl: initialData?.canonicalUrl || "",
      featured: initialData?.featured || false,
      trending: initialData?.trending || false,
      breaking: initialData?.breaking || false,
      headline: initialData?.headline || "",
      lead: initialData?.lead || false,
      leadPosition: initialData?.leadPosition || undefined,
    },
  });

  const selectedCategory = watch("categoryId");
  const watchTitle = watch("title");
  const watchLead = watch("lead");
  const selectedTags = watch("tags");

  // Dynamic filter for subcategories
  useEffect(() => {
    if (selectedCategory) {
      const filtered = categories.filter(
        (c) =>
          c.parentId &&
          ((c.parentId as any)._id?.toString() || c.parentId.toString()) ===
            selectedCategory,
      );
      setSubCategories(filtered);
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory, categories]);

  // Autofill slug helper
  const handleAutoSlug = () => {
    if (watchTitle) {
      setValue("slug", generateSlug(watchTitle));
      toast.success("Slug generated from title.");
    } else {
      toast.error("Please enter a title first.");
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Process comma keywords string to array
      const keywords = values.keywordsString
        ? values.keywordsString
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : [];

      // Cast date inputs back to actual ISO date formats
      const payload: any = {
        ...values,
        keywords,
        publishDate: values.publishDate
          ? new Date(values.publishDate).toISOString()
          : undefined,
        schedulePublish: values.schedulePublish
          ? new Date(values.schedulePublish).toISOString()
          : undefined,
        nestedCategoryId: values.nestedCategoryId || undefined,
        reporterId: values.reporterId || undefined,
        authorId: values.authorId || undefined,
      };

      if (initialData) {
        await updateNewsArticle(initialData._id.toString(), payload);
        toast.success("Article updated successfully.");
      } else {
        await createNewsArticle(payload);
        toast.success("Article published successfully.");
      }
      router.push("/dashboard/news");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save article.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const featuredImage = watch("featuredImage");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Writing & Details */}
        <div className="flex-1 space-y-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 p-1">
              <TabsTrigger value="content">Write Content</TabsTrigger>
              <TabsTrigger value="seo">SEO Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="news-title">Article Headline *</Label>
                    <Input
                      id="news-title"
                      placeholder="Enter a compelling main title"
                      {...register("title")}
                    />
                    {errors.title && (
                      <p className="text-xs text-destructive">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1.5">
                    <Label htmlFor="news-subtitle">
                      Sub-headline (Optional)
                    </Label>
                    <Input
                      id="news-subtitle"
                      placeholder="Add secondary sub-title details"
                      {...register("subtitle")}
                    />
                  </div>

                  {/* Slug Generator */}
                  <div className="space-y-1.5">
                    <Label htmlFor="news-slug">URL Slug *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="news-slug"
                        placeholder="friendly-url-structure"
                        {...register("slug")}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAutoSlug}
                        className="gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate
                      </Button>
                    </div>
                    {errors.slug && (
                      <p className="text-xs text-destructive">
                        {errors.slug.message}
                      </p>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="space-y-1.5">
                    <Label htmlFor="news-summary">
                      Summary Introduction (Optional)
                    </Label>
                    <Textarea
                      id="news-summary"
                      rows={3}
                      placeholder="Write a brief teaser summary for front pages..."
                      {...register("summary")}
                    />
                  </div>

                  {/* Rich Text Editor */}
                  <div className="space-y-1.5">
                    <Label>Article Main Body</Label>
                    <Controller
                      name="content"
                      control={control}
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Media selection */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">
                    Media Attachments
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Featured Image */}
                    <div className="space-y-2">
                      <Label>Featured Cover Image *</Label>
                      {featuredImage ? (
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-gray-50">
                          <img
                            src={featuredImage}
                            alt="Featured preview"
                            className="object-contain w-full h-full"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => setValue("featuredImage", "")}
                          >
                            X
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setIsMediaOpen(true)}
                          className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg aspect-video cursor-pointer bg-gray-50 hover:bg-gray-100/50 transition text-gray-500"
                        >
                          <ImageIcon className="w-10 h-10 mb-2 text-gray-400" />
                          <span className="text-xs font-semibold">
                            Choose Cover Image
                          </span>
                        </div>
                      )}
                      {errors.featuredImage && (
                        <p className="text-xs text-destructive">
                          {errors.featuredImage.message}
                        </p>
                      )}
                    </div>

                    {/* Video Embed URL */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="news-video">
                          YouTube Video URL (Optional)
                        </Label>
                        <Input
                          id="news-video"
                          placeholder="https://www.youtube.com/watch?v=..."
                          {...register("video")}
                        />
                      </div>
                      <div className="text-xs text-gray-400">
                        Provide a valid video share link. If present, video
                        player features will overlay on homepage layout spots.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="seo-title">SEO Meta Title</Label>
                    <Input
                      id="seo-title"
                      placeholder="Title tag displayed on search engines"
                      {...register("seoTitle")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="seo-description">
                      SEO Meta Description
                    </Label>
                    <Textarea
                      id="seo-description"
                      rows={4}
                      placeholder="Summary snippet displayed on search engines"
                      {...register("metaDescription")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="seo-keywords">
                      Keywords (comma-separated)
                    </Label>
                    <Input
                      id="seo-keywords"
                      placeholder="politics, election, city, news"
                      {...register("keywordsString")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="seo-canonical">Canonical URL</Label>
                    <Input
                      id="seo-canonical"
                      placeholder="https://dailymuktimarg.com/news/canonical-slug"
                      {...register("canonicalUrl")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side: Categorization & Settings Panels */}
        <div className="w-full lg:w-80 space-y-6 shrink-0">
          {/* Publishing details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">
                Publishing Details
              </h3>

              <div className="space-y-1.5">
                <Label htmlFor="news-status">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="review">
                          Submit for Review
                        </SelectItem>
                        <SelectItem value="published">Publish Now</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="news-publish-date">Publish Date Override</Label>
                <Input
                  id="news-publish-date"
                  type="datetime-local"
                  {...register("publishDate")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="news-schedule">Schedule Release Publish</Label>
                <Input
                  id="news-schedule"
                  type="datetime-local"
                  {...register("schedulePublish")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Classification details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">
                Classification
              </h3>

              {/* Main Category */}
              <div className="space-y-1.5">
                <Label>Primary Category *</Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c) => !c.parentId)
                          .map((cat) => (
                            <SelectItem
                              key={cat._id.toString()}
                              value={cat._id.toString()}
                            >
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-xs text-destructive">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              {/* Sub-category */}
              {subCategories.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Sub-category</Label>
                  <Controller
                    name="nestedCategoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Sub-category" />
                        </SelectTrigger>
                        <SelectContent>
                          {subCategories.map((sub) => (
                            <SelectItem
                              key={sub._id.toString()}
                              value={sub._id.toString()}
                            >
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Tags</Label>
                {tags.length > 0 ? (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                    {tags.map((tag) => {
                      const tagId = tag._id.toString();
                      const isChecked = selectedTags.includes(tagId);

                      return (
                        <div
                          key={tagId}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`tag-${tagId}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const nextTags = checked
                                ? [...selectedTags, tagId]
                                : selectedTags.filter(
                                    (value) => value !== tagId,
                                  );

                              setValue("tags", nextTags, {
                                shouldDirty: true,
                                shouldTouch: true,
                              });
                            }}
                          />
                          <Label
                            htmlFor={`tag-${tagId}`}
                            className="cursor-pointer text-sm font-normal"
                          >
                            {tag.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No tags found. Create tags first from the tags section.
                  </p>
                )}
              </div>

              {/* Attribution options */}
              <div className="space-y-1.5">
                <Label>Assigned Reporter</Label>
                <Controller
                  name="reporterId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Internal Staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {reporters.map((rep) => (
                          <SelectItem
                            key={rep._id.toString()}
                            value={rep._id.toString()}
                          >
                            {rep.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Custom Author (Opinion/Guesthouses)</Label>
                <Controller
                  name="authorId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="External Writer" />
                      </SelectTrigger>
                      <SelectContent>
                        {authors.map((aut) => (
                          <SelectItem
                            key={aut._id.toString()}
                            value={aut._id.toString()}
                          >
                            {aut.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="news-location">Location / Dateline</Label>
                <Input
                  id="news-location"
                  placeholder="e.g. Dhaka, Bangladesh"
                  {...register("location")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="news-source">Source Credit</Label>
                <Input
                  id="news-source"
                  placeholder="e.g. Reuters, Staff"
                  {...register("source")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display & Layout Priority */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">
                Homepage Placements
              </h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="check-breaking"
                  checked={watch("breaking")}
                  onCheckedChange={(val) => setValue("breaking", !!val)}
                />
                <Label htmlFor="check-breaking" className="cursor-pointer">
                  Breaking News Ticker
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="check-trending"
                  checked={watch("trending")}
                  onCheckedChange={(val) => setValue("trending", !!val)}
                />
                <Label htmlFor="check-trending" className="cursor-pointer">
                  Trending Articles Panel
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="check-featured"
                  checked={watch("featured")}
                  onCheckedChange={(val) => setValue("featured", !!val)}
                />
                <Label htmlFor="check-featured" className="cursor-pointer">
                  Editor's Featured Pick
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="select-headline-group">Headline Group</Label>
                <Controller
                  name="headline"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Top Headlines">
                          Top Headlines
                        </SelectItem>
                        <SelectItem value="Editor's Pick">
                          Editor's Pick
                        </SelectItem>
                        <SelectItem value="Important News">
                          Important News
                        </SelectItem>
                        <SelectItem value="Latest Headlines">
                          Latest Headlines
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Lead Placement Pos */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="check-lead"
                    checked={watchLead}
                    onCheckedChange={(val) => setValue("lead", !!val)}
                  />
                  <Label
                    htmlFor="check-lead"
                    className="cursor-pointer font-semibold"
                  >
                    Pin as Homepage Lead
                  </Label>
                </div>

                {watchLead && (
                  <div className="space-y-1.5 pt-2">
                    <Label>Lead Grid Position</Label>
                    <Controller
                      name="leadPosition"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={(val) =>
                            setValue("leadPosition", parseInt(val) || undefined)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">
                              Position 1 (Hero Lead)
                            </SelectItem>
                            <SelectItem value="2">
                              Position 2 (Secondary Grid)
                            </SelectItem>
                            <SelectItem value="3">
                              Position 3 (Secondary Grid)
                            </SelectItem>
                            <SelectItem value="4">
                              Position 4 (Secondary Grid)
                            </SelectItem>
                            <SelectItem value="5">
                              Position 5 (Secondary Grid)
                            </SelectItem>
                            <SelectItem value="6">
                              Position 6 (Secondary Grid)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving Article..."
              : initialData
                ? "Save Changes"
                : "Publish Article"}
          </Button>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaLibraryModal
        open={isMediaOpen}
        onOpenChange={setIsMediaOpen}
        onSelect={(url) => setValue("featuredImage", url)}
      />
    </form>
  );
}
