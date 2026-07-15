import { Document, Schema, Types, model, models } from "mongoose";

export interface IMedia extends Document {
  _id: Types.ObjectId;
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  folder: string; // e.g. "Root", "Politics", "Sports"
  altText?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MediaSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number },
    mimeType: { type: String },
    folder: { type: String, default: "Root" },
    altText: { type: String, default: "" },
  },
  { timestamps: true },
);

MediaSchema.index({ folder: 1 });
MediaSchema.index({ name: "text" });

const Media = models.Media || model("Media", MediaSchema);

export default Media;
