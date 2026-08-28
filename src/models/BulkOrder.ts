import mongoose, { Schema, Document, Model } from "mongoose";
import type { BulkOrderStatus } from "@/types";

export interface IBulkOrderRequest extends Document {
  name: string;
  phone: string;
  email: string;
  preferredBrand?: string;
  packType?: string;
  quantity: number;
  deliveryDate: Date;
  region: string;
  city: string;
  area?: string;
  address: string;
  notes?: string;
  status: BulkOrderStatus;
  assignedTo?: mongoose.Types.ObjectId;  // admin handling the request
  quoteId?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;     // created after acceptance
  createdAt: Date;
  updatedAt: Date;
}

export interface IBulkQuote extends Document {
  requestId: mongoose.Types.ObjectId;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  validUntil: Date;
  notes?: string;
  isAccepted: boolean;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BulkOrderRequestSchema = new Schema<IBulkOrderRequest>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    preferredBrand: String,
    packType: String,
    quantity: { type: Number, required: true, min: 50 },
    deliveryDate: { type: Date, required: true },
    region: { type: String, required: true },
    city: { type: String, required: true },
    area: String,
    address: { type: String, required: true },
    notes: String,
    status: {
      type: String,
      enum: [
        "PENDING_REVIEW", "QUOTE_SENT", "ACCEPTED",
        "REJECTED", "PAID", "PROCESSING", "DELIVERED", "CANCELLED",
      ],
      default: "PENDING_REVIEW",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    quoteId: { type: Schema.Types.ObjectId, ref: "BulkQuote" },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true }
);

const BulkQuoteSchema = new Schema<IBulkQuote>(
  {
    requestId: { type: Schema.Types.ObjectId, ref: "BulkOrderRequest", required: true },
    items: [
      {
        productName: String,
        variantName: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
        _id: false,
      },
    ],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    validUntil: { type: Date, required: true },
    notes: String,
    isAccepted: { type: Boolean, default: false },
    acceptedAt: Date,
  },
  { timestamps: true }
);

BulkOrderRequestSchema.index({ status: 1, createdAt: -1 });
BulkQuoteSchema.index({ requestId: 1 });

export const BulkOrderRequest: Model<IBulkOrderRequest> =
  mongoose.models.BulkOrderRequest ??
  mongoose.model<IBulkOrderRequest>("BulkOrderRequest", BulkOrderRequestSchema);

export const BulkQuote: Model<IBulkQuote> =
  mongoose.models.BulkQuote ??
  mongoose.model<IBulkQuote>("BulkQuote", BulkQuoteSchema);
