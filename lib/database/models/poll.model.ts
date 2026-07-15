import { Document, Schema, Types, model, models } from "mongoose";

export interface IPollOption {
  text: string;
  votes: number;
}

export interface IPoll extends Document {
  _id: Types.ObjectId;
  question: string;
  options: IPollOption[];
  startDate?: Date;
  endDate?: Date;
  status: "active" | "closed";
  createdAt?: Date;
  updatedAt?: Date;
}

const PollSchema = new Schema(
  {
    question: { type: String, required: true },
    options: [
      {
        text: { type: String, required: true },
        votes: { type: Number, default: 0 },
      },
    ],
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      required: true,
    },
  },
  { timestamps: true },
);

PollSchema.index({ status: 1, createdAt: -1 });

const Poll = models.Poll || model("Poll", PollSchema);

export default Poll;
