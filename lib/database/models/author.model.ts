import { Document, Schema, Types, model, models } from "mongoose";

export interface IAuthor extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  bio?: string;
  image?: string;
  socialLinks?: Map<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

const AuthorSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    bio: { type: String },
    image: { type: String },
    socialLinks: { type: Map, of: String },
  },
  { timestamps: true },
);

AuthorSchema.index({ name: "text", email: "text" });

const Author = models.Author || model("Author", AuthorSchema);

export default Author;
