import mongoose, { Schema, Document, Model } from "mongoose";
import type { ReviewStatus } from "@/types";

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail?: string;
  orderId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  rating: number; // 1 to 5
  comment: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, lowercase: true, trim: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    orderNumber: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["PENDING", "PUBLISHED", "HIDDEN", "REPORTED"],
      default: "PUBLISHED",
    },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReviewSchema.index({ productId: 1, status: 1 });
ReviewSchema.index({ createdAt: -1 });

const Review: Model<IReview> =
  mongoose.models.Review ??
  mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
