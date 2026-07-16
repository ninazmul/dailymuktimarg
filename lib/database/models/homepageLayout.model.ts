import { Document, Schema, Types, model, models } from "mongoose";

export interface IHomepageLayout extends Document {
  _id: Types.ObjectId;
  sectionName: string;
  sectionType: "hero" | "lead" | "categoryGrid" | "trending" | "widgets" | "videoGallery" | "photoGallery" | "breaking" | "featured";
  categoryId?: Types.ObjectId; // References Category
  postsCount: number;
  layoutType: "grid" | "list" | "slider" | "sidebarLayout";
  enabled: boolean;
  isPinned: boolean;
  order: number;
  // New fields for advanced builder
  customTitle?: string;
  backgroundColor?: string;
  filters?: {
    featured?: boolean;
    trending?: boolean;
    breaking?: boolean;
    hasVideo?: boolean;
  };
  adPlacement?: "top" | "bottom" | "inline";
  createdAt?: Date;
  updatedAt?: Date;
}

const HomepageLayoutSchema = new Schema(
  {
    sectionName: { type: String, required: true },
    sectionType: {
      type: String,
      enum: ["hero", "lead", "categoryGrid", "trending", "widgets", "videoGallery", "photoGallery", "breaking", "featured"],
      required: true,
    },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    postsCount: { type: Number, default: 5 },
    layoutType: {
      type: String,
      enum: ["grid", "list", "slider", "sidebarLayout"],
      default: "grid",
      required: true,
    },
    enabled: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    // New fields
    customTitle: { type: String, default: null },
    backgroundColor: { type: String, default: null },
    filters: {
      type: {
        featured: Boolean,
        trending: Boolean,
        breaking: Boolean,
        hasVideo: Boolean,
      },
      default: {},
    },
    adPlacement: {
      type: String,
      enum: ["top", "bottom", "inline", null],
      default: null,
    },
  },
  { timestamps: true },
);

HomepageLayoutSchema.index({ order: 1 });

const HomepageLayout = models.HomepageLayout || model("HomepageLayout", HomepageLayoutSchema);

export default HomepageLayout;
