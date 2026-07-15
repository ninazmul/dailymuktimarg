import { Document, Schema, Types, model, models } from "mongoose";

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // References User
  action: string; // e.g. "create", "update", "delete", "publish"
  module: string; // e.g. "news", "categories", "settings"
  targetId?: string; // ID of the affected document
  details?: string; // Human-readable summary of the change
  ip?: string;
  createdAt?: Date;
}

const AuditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    targetId: { type: String },
    details: { type: String },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ module: 1, action: 1 });

const AuditLog = models.AuditLog || model("AuditLog", AuditLogSchema);

export default AuditLog;
