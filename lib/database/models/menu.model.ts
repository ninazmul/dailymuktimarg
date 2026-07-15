import { Document, Schema, Types, model, models } from "mongoose";

export interface IMenuItem {
  label: string;
  url: string;
  parentId?: string; // Optional parent item ID (for sub-menu nesting)
  order: number;
  megaMenuEnabled: boolean;
}

export interface IMenu extends Document {
  _id: Types.ObjectId;
  title: string; // e.g., "Main Header Menu", "Footer Information"
  items: IMenuItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

const MenuItemSchema = new Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  parentId: { type: String, default: null },
  order: { type: Number, default: 0 },
  megaMenuEnabled: { type: Boolean, default: false },
});

const MenuSchema = new Schema(
  {
    title: { type: String, required: true, unique: true },
    items: [MenuItemSchema],
  },
  { timestamps: true },
);

const Menu = models.Menu || model("Menu", MenuSchema);

export default Menu;
