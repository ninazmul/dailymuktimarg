import { Document, Schema, Types, model, models } from "mongoose";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  parentId?: Types.ObjectId; // References Category
  path?: string; // Materialized path (e.g. ",politics,bangladesh,")
  priority: number;
  isNavbar: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    path: { type: String, default: "" },
    priority: { type: Number, default: 0 },
    isNavbar: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Indexes
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ path: 1 });
CategorySchema.index({ parentId: 1, priority: 1 });
CategorySchema.index({ isNavbar: 1, priority: 1, name: 1 });

const Category = models.Category || model("Category", CategorySchema);

export default Category;
