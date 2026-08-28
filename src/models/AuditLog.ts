import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  performedBy: mongoose.Types.ObjectId;
  action: string;           // e.g. "PRICE_CHANGED", "PRODUCT_DELETED"
  resource: string;         // e.g. "ProductVariant"
  resourceId?: string;
  description: string;      // human-readable summary
  changes?: {
    field: string;
    before: unknown;
    after: unknown;
  }[];
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: String,
    description: { type: String, required: true },
    changes: [
      {
        field: String,
        before: Schema.Types.Mixed,
        after: Schema.Types.Mixed,
        _id: false,
      },
    ],
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ createdAt: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ??
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
