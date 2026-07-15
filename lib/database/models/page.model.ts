import { Document, Schema, Types, model, models } from "mongoose";

export interface IPage extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
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
    seo: {
      title: { type: String },
      description: { type: String },
    },
  },
  { timestamps: true },
);

const Page = models.Page || model("Page", PageSchema);

export default Page;
