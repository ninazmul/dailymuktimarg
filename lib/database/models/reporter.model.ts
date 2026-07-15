import { Document, Schema, Types, model, models } from "mongoose";

export interface IReporter extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  bio?: string;
  image?: string;
  socialLinks?: Map<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReporterSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    bio: { type: String },
    image: { type: String },
    socialLinks: { type: Map, of: String },
  },
  { timestamps: true },
);

ReporterSchema.index({ name: "text", email: "text" });

const Reporter = models.Reporter || model("Reporter", ReporterSchema);

export default Reporter;
