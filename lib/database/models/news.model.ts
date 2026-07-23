import { Document, Schema, Types, model, models } from "mongoose";

export type NewsStatus = "draft" | "review" | "published" | "archived";

export interface INews extends Document {
  _id: Types.ObjectId;
  title: string;
  subtitle?: string;
  slug: string;
  summary?: string;
  content?: string;
  featuredImage: string;
  gallery: string[];
  video?: string;
  categoryId: Types.ObjectId; // References Category
  nestedCategoryId?: Types.ObjectId; // References Category
  tags: Types.ObjectId[]; // References Tag
  reporterId?: Types.ObjectId; // References Reporter
  authorId?: Types.ObjectId; // References Author
  source?: string;
  location?: string;
  publishDate?: Date;
  schedulePublish?: Date;
  status: NewsStatus;
  seoTitle?: string;
  metaDescription?: string;
  keywords: string[];
  canonicalUrl?: string;
  views: number;
  featured: boolean;
  trending: boolean;
  breaking: boolean;
  headline?: string; // e.g. "Top Headlines"
  lead: boolean;
  leadPosition?: number; // 1 to 12
  relatedNews: Types.ObjectId[]; // References News
  createdAt?: Date;
  updatedAt?: Date;
}

const NewsSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    slug: { type: String, required: true, unique: true },
    summary: { type: String },
    content: { type: String },
    featuredImage: { type: String, required: true },
    gallery: [{ type: String }],
    video: { type: String },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    nestedCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    reporterId: { type: Schema.Types.ObjectId, ref: "Reporter", default: null },
    authorId: { type: Schema.Types.ObjectId, ref: "Author", default: null },
    source: { type: String },
    location: { type: String },
    publishDate: { type: Date, default: Date.now },
    schedulePublish: { type: Date, default: null },
    status: {
      type: String,
      enum: ["draft", "review", "published", "archived"],
      default: "draft",
      required: true,
    },
    seoTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],
    canonicalUrl: { type: String },
    views: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    breaking: { type: Boolean, default: false },
    headline: { type: String, default: null },
    lead: { type: Boolean, default: false },
    leadPosition: { type: Number, default: null },
    relatedNews: [{ type: Schema.Types.ObjectId, ref: "News" }],
  },
  { timestamps: true },
);

// Indexes for high performance queries
NewsSchema.index({ status: 1, publishDate: -1 });
NewsSchema.index({ categoryId: 1, status: 1, publishDate: -1 });
NewsSchema.index({ tags: 1, status: 1 });
NewsSchema.index({ views: -1, status: 1 });
NewsSchema.index({ breaking: 1, status: 1, publishDate: -1 });
NewsSchema.index({ lead: 1, leadPosition: 1, status: 1 });
NewsSchema.index({ headline: 1, status: 1, publishDate: -1 });
NewsSchema.index({ status: 1, updatedAt: -1 });
NewsSchema.index({ lead: 1, leadPosition: 1 });
NewsSchema.index({ featured: 1, status: 1 });
NewsSchema.index({ trending: 1, status: 1 });
NewsSchema.index({ schedulePublish: 1 });

// Full text search index
NewsSchema.index(
  { title: "text", subtitle: "text", summary: "text", content: "text" },
  { weights: { title: 10, subtitle: 5, summary: 3, content: 1 } },
);

const News = models.News || model("News", NewsSchema);

export default News;
