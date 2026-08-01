import { Document, Schema, Types, model, models } from "mongoose";

export interface IPageFounder {
  name: string;
  role: string;
  image?: string;
  bio?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  email?: string;
}

export interface IPageFeatureCard {
  title: string;
  description: string;
  icon?: string;
  image?: string;
  linkUrl?: string;
  linkText?: string;
}

export interface IPageSection {
  id: string;
  type: "richText" | "founders" | "imageBanner" | "featureCards" | "cta" | "faq" | "embed";
  enabled: boolean;
  order: number;
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  content?: string;
  founders?: IPageFounder[];
  imageBanner?: {
    imageUrl: string;
    alt?: string;
    caption?: string;
    layout?: "full" | "contained" | "split-left" | "split-right";
    linkUrl?: string;
    linkText?: string;
  };
  featureCards?: IPageFeatureCard[];
  cta?: {
    heading: string;
    subheading?: string;
    buttonText: string;
    buttonUrl: string;
    style?: "primary" | "secondary" | "dark";
  };
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  embed?: {
    code: string;
    caption?: string;
  };
}

export interface IPage extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  priority: number;
  parentId?: Types.ObjectId | null;
  sections?: IPageSection[];
  seo?: {
    title?: string;
    description?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const PageSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
    },
    priority: { type: Number, default: 0 },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Page",
      default: null,
    },
    sections: { type: Array, default: [] },
    seo: {
      title: { type: String },
      description: { type: String },
    },
  },
  { timestamps: true },
);

const Page = models.Page || model("Page", PageSchema);

export default Page;

