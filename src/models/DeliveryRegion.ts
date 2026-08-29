import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuantityRule {
  minPacks: number;
  maxPacks: number | null; // null = unlimited (11+ packs)
  fee: number;
  label?: string; // e.g. "1–3 packs"
}

export interface IDeliveryRegion extends Document {
  name: string; // "Ashanti", "Eastern", etc.
  code: string; // "ASH", "EAS", "GTR", etc.
  isEnabled: boolean;
  baseFee: number; // flat fee when no quantity rules match
  estimatedDeliveryTime: string; // e.g. "1–3 business days"
  quantityRules: IQuantityRule[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuantityRuleSchema = new Schema<IQuantityRule>(
  {
    minPacks: { type: Number, required: true, min: 1 },
    maxPacks: { type: Number, default: null }, // null = open-ended
    fee: { type: Number, required: true, min: 0 },
    label: { type: String },
  },
  { _id: false }
);

const DeliveryRegionSchema = new Schema<IDeliveryRegion>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    isEnabled: { type: Boolean, default: true },
    baseFee: { type: Number, required: true, min: 0, default: 0 },
    estimatedDeliveryTime: { type: String, default: "1–3 business days" },
    quantityRules: { type: [QuantityRuleSchema], default: [] },
    notes: { type: String },
  },
  { timestamps: true }
);

DeliveryRegionSchema.index({ isEnabled: 1 });
DeliveryRegionSchema.index({ name: 1 });

const DeliveryRegion: Model<IDeliveryRegion> =
  mongoose.models.DeliveryRegion ??
  mongoose.model<IDeliveryRegion>("DeliveryRegion", DeliveryRegionSchema);

export default DeliveryRegion;

// ── Ghana Regions seed data ────────────────────────────────────────────────────
export const GHANA_REGIONS_SEED = [
  { name: "Greater Accra", code: "GTR", isEnabled: true, baseFee: 0, estimatedDeliveryTime: "1–3 hours", notes: "Zone-based pricing applies" },
  { name: "Ashanti", code: "ASH", isEnabled: true, baseFee: 120, estimatedDeliveryTime: "1–2 business days" },
  { name: "Eastern", code: "EAS", isEnabled: true, baseFee: 100, estimatedDeliveryTime: "1–2 business days" },
  { name: "Central", code: "CEN", isEnabled: true, baseFee: 90, estimatedDeliveryTime: "1–2 business days" },
  { name: "Western", code: "WES", isEnabled: true, baseFee: 150, estimatedDeliveryTime: "1–2 business days" },
  { name: "Western North", code: "WEN", isEnabled: false, baseFee: 180, estimatedDeliveryTime: "2–3 business days" },
  { name: "Volta", code: "VOL", isEnabled: true, baseFee: 130, estimatedDeliveryTime: "1–2 business days" },
  { name: "Oti", code: "OTI", isEnabled: false, baseFee: 150, estimatedDeliveryTime: "2–3 business days" },
  { name: "Bono", code: "BON", isEnabled: false, baseFee: 160, estimatedDeliveryTime: "2–3 business days" },
  { name: "Bono East", code: "BOE", isEnabled: false, baseFee: 170, estimatedDeliveryTime: "2–3 business days" },
  { name: "Ahafo", code: "AHF", isEnabled: false, baseFee: 170, estimatedDeliveryTime: "2–3 business days" },
  { name: "Northern", code: "NOR", isEnabled: false, baseFee: 200, estimatedDeliveryTime: "2–4 business days" },
  { name: "Savannah", code: "SAV", isEnabled: false, baseFee: 220, estimatedDeliveryTime: "3–5 business days" },
  { name: "North East", code: "NEA", isEnabled: false, baseFee: 220, estimatedDeliveryTime: "3–5 business days" },
  { name: "Upper East", code: "UEA", isEnabled: false, baseFee: 240, estimatedDeliveryTime: "3–5 business days" },
  { name: "Upper West", code: "UWE", isEnabled: false, baseFee: 240, estimatedDeliveryTime: "3–5 business days" },
] as const;
