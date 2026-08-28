import mongoose, { Schema, Document, Model } from "mongoose";
import type {
  NotificationChannel,
  NotificationEvent,
  NotificationCategory,
  NotificationPriority,
  RecipientRole,
} from "@/types";

export interface INotification extends Document {
  recipientRole: RecipientRole;
  userId?: mongoose.Types.ObjectId;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  type?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  body: string;
  icon?: string;
  entityType?: "ORDER" | "PAYMENT" | "PRODUCT" | "DELIVERY" | "USER" | "PROMOTION" | "SYSTEM";
  entityId?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  isArchived: boolean;
  archivedAt?: Date;
  isSent: boolean;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientRole: {
      type: String,
      enum: ["CUSTOMER", "ADMIN", "ALL"],
      default: "CUSTOMER",
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    recipientEmail: { type: String, trim: true, lowercase: true },
    recipientPhone: { type: String, trim: true },
    channel: {
      type: String,
      enum: ["EMAIL", "SMS", "IN_APP", "PUSH"],
      default: "IN_APP",
      required: true,
    },
    event: { type: String, required: true, index: true },
    type: { type: String },
    category: {
      type: String,
      enum: [
        "ORDERS",
        "PAYMENTS",
        "DELIVERY",
        "PRODUCTS",
        "CUSTOMERS",
        "SECURITY",
        "PROMOTIONS",
        "SYSTEM",
      ],
      default: "ORDERS",
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH", "CRITICAL"],
      default: "NORMAL",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    body: { type: String, trim: true },
    icon: { type: String },
    entityType: {
      type: String,
      enum: ["ORDER", "PAYMENT", "PRODUCT", "DELIVERY", "USER", "PROMOTION", "SYSTEM"],
    },
    entityId: { type: String, trim: true, index: true },
    actionUrl: { type: String, trim: true },
    actionLabel: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
    isSent: { type: Boolean, default: true },
    sentAt: { type: Date, default: Date.now },
    error: { type: String },
  },
  { timestamps: true }
);

// Compound indexes for optimal performance
NotificationSchema.index({ recipientRole: 1, userId: 1, isRead: 1, isArchived: 1, createdAt: -1 });
NotificationSchema.index({ recipientRole: 1, category: 1, createdAt: -1 });
NotificationSchema.index({ entityType: 1, entityId: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
