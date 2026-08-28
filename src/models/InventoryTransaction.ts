import mongoose, { Schema, Document, Model } from "mongoose";
import type { InventoryTransactionType } from "@/types";

export interface IInventoryTransaction extends Document {
  variantId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  type: InventoryTransactionType;
  quantity: number;       // positive = in, negative = out
  balanceBefore: number;
  balanceAfter: number;
  reason?: string;
  performedBy?: mongoose.Types.ObjectId; // admin userId
  createdAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    type: {
      type: String,
      enum: [
        "INITIAL_STOCK",
        "RESTOCK",
        "SALE",
        "RESERVATION",
        "RELEASE",
        "ADJUSTMENT",
        "DAMAGED",
        "RETURN",
        "CANCELLED_ORDER",
      ],
      required: true,
    },
    quantity: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

InventoryTransactionSchema.index({ variantId: 1, createdAt: -1 });
InventoryTransactionSchema.index({ orderId: 1 });
InventoryTransactionSchema.index({ type: 1 });

const InventoryTransaction: Model<IInventoryTransaction> =
  mongoose.models.InventoryTransaction ??
  mongoose.model<IInventoryTransaction>(
    "InventoryTransaction",
    InventoryTransactionSchema
  );

export default InventoryTransaction;
