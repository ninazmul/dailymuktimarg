import { Document, Schema, Types, model, models } from "mongoose";

export type AdPlacement = "header" | "sidebar" | "footer" | "popup" | "sticky" | "inline" | "mobile";

export interface IAd extends Document {
  _id: Types.ObjectId;
  placement: AdPlacement;
  client?: string;
  imageUrl?: string;
  htmlCode?: string;
  targetUrl?: string;
  startDate?: Date;
  endDate?: Date;
  status: "active" | "inactive";
  priority: number;
  clicks: number;
  views: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const AdSchema = new Schema(
  {
    placement: {
      type: String,
      enum: ["header", "sidebar", "footer", "popup", "sticky", "inline", "mobile"],
      required: true,
    },
    client: { type: String },
    imageUrl: { type: String },
    htmlCode: { type: String },
    targetUrl: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ["active", "inactive"], default: "inactive", required: true },
    priority: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);

AdSchema.index({ placement: 1, status: 1 });
AdSchema.index({ status: 1, startDate: 1, endDate: 1 });

const Ad = models.Ad || model("Ad", AdSchema);

export default Ad;
