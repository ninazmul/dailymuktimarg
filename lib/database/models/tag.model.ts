import { Document, Schema, Types, model, models } from "mongoose";

export interface ITag extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TagSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

TagSchema.index({ name: "text" });

const Tag = models.Tag || model("Tag", TagSchema);

export default Tag;
