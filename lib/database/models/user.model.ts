import { Document, Schema, Types, model, models } from "mongoose";

export interface IUserPermission {
  module: string;
  actions: string[];
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  clerkId: string;
  email: string;
  name: string;
  imageUrl?: string;
  status: "active" | "suspended";
  permissions: IUserPermission[];
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    imageUrl: { type: String },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      required: true,
    },
    permissions: [
      {
        module: { type: String, required: true },
        actions: [{ type: String }],
      },
    ],
  },
  { timestamps: true },
);

UserSchema.index({ name: "text", email: "text" });
UserSchema.index({ status: 1 });

const User = models.User || model("User", UserSchema);

export default User;
