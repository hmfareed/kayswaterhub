import mongoose, { Schema, Document, Model } from "mongoose";

interface PricingTier {
  minQty: number;
  maxQty: number | null; // null = unlimited (50+, 100+, etc.)
  unitPrice: number;
}

export interface IPricingRule extends Document {
  variantId: mongoose.Types.ObjectId;
  tiers: PricingTier[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PricingTierSchema = new Schema<PricingTier>(
  {
    minQty: { type: Number, required: true, min: 1 },
    maxQty: { type: Number, default: null }, // null = no upper limit
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PricingRuleSchema = new Schema<IPricingRule>(
  {
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
      unique: true,
    },
    tiers: {
      type: [PricingTierSchema],
      required: true,
      validate: {
        validator: (tiers: PricingTier[]) => tiers.length > 0,
        message: "At least one pricing tier is required",
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PricingRule: Model<IPricingRule> =
  mongoose.models.PricingRule ??
  mongoose.model<IPricingRule>("PricingRule", PricingRuleSchema);

export default PricingRule;
