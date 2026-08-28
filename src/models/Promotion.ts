import mongoose, { Schema, Document, Model } from "mongoose";
import type { DiscountType } from "@/types";

export interface IPromotion extends Document {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  applicableCategories: mongoose.Types.ObjectId[];
  applicableProducts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED_AMOUNT", "FREE_DELIVERY"],
      required: true,
      default: "PERCENTAGE",
    },
    discountValue: { type: Number, required: true, min: 0 },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    maximumDiscountAmount: { type: Number, min: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

PromotionSchema.index({ code: 1 });
PromotionSchema.index({ isActive: 1, endDate: 1 });

const Promotion: Model<IPromotion> =
  mongoose.models.Promotion ??
  mongoose.model<IPromotion>("Promotion", PromotionSchema);

export default Promotion;
