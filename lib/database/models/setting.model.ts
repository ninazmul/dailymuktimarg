import { Document, Schema, Types, model, models } from "mongoose";

export interface ISetting extends Document {
  _id: Types.ObjectId;
  contactEmail?: string;
  phoneNumber?: string;
  address?: string;
  socialLinks?: Map<string, string>;
  headerScript?: string;
  footerScript?: string;
  maintenanceMode: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const SettingSchema = new Schema(
  {
    contactEmail: { type: String },
    phoneNumber: { type: String },
    address: { type: String },
    socialLinks: { type: Map, of: String },
    headerScript: { type: String },
    footerScript: { type: String },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Setting = models.Setting || model("Setting", SettingSchema);

export default Setting;
