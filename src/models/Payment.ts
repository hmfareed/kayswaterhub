import mongoose, { Schema, Document, Model } from "mongoose";
import type { PaymentStatus, PaymentMethod } from "@/types";

export interface IPaymentTransaction {
  event: string;
  data: Record<string, unknown>;
  receivedAt: Date;
}

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  provider: string;          // e.g. "PAYSTACK" | "HUBTEL"
  reference: string;         // unique reference sent to provider
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;    // provider's transaction ID
  paidAt?: Date;
  metadata?: Record<string, unknown>;
  transactions: IPaymentTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    event: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    receivedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    provider: { type: String, required: true },
    reference: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "GHS" },
    method: {
      type: String,
      enum: ["MOBILE_MONEY", "BANK"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SUCCESS", "FAILED", "REFUND_PENDING", "REFUNDED"],
      default: "PENDING",
    },
    transactionId: { type: String },
    paidAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
    transactions: [PaymentTransactionSchema],
  },
  { timestamps: true }
);

PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ reference: 1 });
PaymentSchema.index({ status: 1 });

const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
