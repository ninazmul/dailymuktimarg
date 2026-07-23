import { Document, Schema, Types, model, models } from "mongoose";

export interface ISecondaryPhoto {
  _id?: Types.ObjectId | string;
  url: string;
  caption?: string;
}

export interface IGallery extends Document {
  _id: Types.ObjectId;
  title: string;
  subtitle?: string;
  slug: string;
  mainImage: string;
  secondaryPhotos: ISecondaryPhoto[];
  status: "published" | "draft";
  createdAt?: Date;
  updatedAt?: Date;
}

const SecondaryPhotoSchema = new Schema({
  url: { type: String, required: true },
  caption: { type: String, default: "" },
});

const GallerySchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    mainImage: { type: String, required: true },
    secondaryPhotos: [SecondaryPhotoSchema],
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
      required: true,
    },
  },
  { timestamps: true }
);

GallerySchema.index({ status: 1, createdAt: -1 });

const Gallery = models.Gallery || model("Gallery", GallerySchema);

export default Gallery;
