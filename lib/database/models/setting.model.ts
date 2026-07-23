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
  seo?: {
    siteTitle?: string;
    siteMetaDescription?: string;
    siteKeywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCardTitle?: string;
    twitterCardDescription?: string;
    twitterCardImage?: string;
    canonicalUrlBase?: string;
    googleAnalyticsId?: string;
    googleSearchConsoleVerification?: string;
  };
  todaysNewsLayout?: {
    title?: string;
    subtitle?: string;
    layoutStyle?: "grid" | "list" | "leadGrid";
    postsPerPage?: number;
    showLeadHero?: boolean;
    sortBy?: "publishDate" | "views";
    showCategoryFilter?: boolean;
    adPlacement?: "top" | "bottom" | "inline";
  };
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
    seo: {
      type: {
        siteTitle: { type: String },
        siteMetaDescription: { type: String },
        siteKeywords: { type: [String], default: [] },
        ogTitle: { type: String },
        ogDescription: { type: String },
        ogImage: { type: String },
        twitterCardTitle: { type: String },
        twitterCardDescription: { type: String },
        twitterCardImage: { type: String },
        canonicalUrlBase: { type: String },
        googleAnalyticsId: { type: String },
        googleSearchConsoleVerification: { type: String },
      },
      default: {},
    },
    todaysNewsLayout: {
      type: {
        title: { type: String, default: "আজকের পত্রিকা" },
        subtitle: { type: String, default: "আজকের প্রকাশিত সকল প্রধান সংবাদ এবং আপডেট" },
        layoutStyle: { type: String, enum: ["grid", "list", "leadGrid"], default: "leadGrid" },
        postsPerPage: { type: Number, default: 24 },
        showLeadHero: { type: Boolean, default: true },
        sortBy: { type: String, enum: ["publishDate", "views"], default: "publishDate" },
        showCategoryFilter: { type: Boolean, default: true },
        adPlacement: { type: String, enum: ["top", "bottom", "inline", null], default: "inline" },
      },
      default: {},
    },
  },
  { timestamps: true },
);

const Setting = models.Setting || model("Setting", SettingSchema);

export default Setting;
