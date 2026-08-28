import mongoose, { Schema, Document, Model } from "mongoose";

export type DeliveryPricingType = "FLAT" | "DISTANCE_BASED" | "ZONE_BASED";

export interface IDeliveryZone extends Document {
  name: string;           // e.g. "Accra Central", "Greater Accra Extended"
  region: string;
  areas: string[];        // sub-areas within the zone
  pricingType: DeliveryPricingType;
  deliveryFee: number;    // Flat fee or base fee in GHS
  pricePerKm?: number;    // Additional fee per km (for DISTANCE_BASED)
  includedDistanceKm?: number; // Base distance included in base fee
  radiusKm?: number;      // Max radius from center for zone matching
  maxDistanceKm?: number; // Cutoff distance (unavailable beyond this)
  priority?: number;      // Higher priority wins when zones overlap (default: 10)
  centerCoordinates?: {
    lat: number;
    lng: number;
  };
  polygonCoordinates?: {
    lat: number;
    lng: number;
  }[];
  estimatedDeliveryTime: string; // e.g. "1–2 hours", "Same day"
  isActive: boolean;
  minimumOrder?: number;  // optional minimum order for this zone
  freeDeliveryThreshold?: number; // order amount above which delivery is free
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryZoneSchema = new Schema<IDeliveryZone>(
  {
    name: { type: String, required: true, trim: true },
    region: { type: String, required: true },
    areas: [{ type: String }],
    pricingType: {
      type: String,
      enum: ["FLAT", "DISTANCE_BASED", "ZONE_BASED"],
      default: "FLAT",
    },
    deliveryFee: { type: Number, required: true, min: 0 },
    pricePerKm: { type: Number, default: 0 },
    includedDistanceKm: { type: Number, default: 0 },
    radiusKm: { type: Number },
    maxDistanceKm: { type: Number, default: 50 },
    priority: { type: Number, default: 10 },
    centerCoordinates: {
      lat: Number,
      lng: Number,
    },
    polygonCoordinates: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        _id: false,
      },
    ],
    estimatedDeliveryTime: { type: String, required: true, default: "2–4 hours" },
    isActive: { type: Boolean, default: true },
    minimumOrder: { type: Number, default: 0 },
    freeDeliveryThreshold: { type: Number },
  },
  { timestamps: true }
);

DeliveryZoneSchema.index({ region: 1 });
DeliveryZoneSchema.index({ isActive: 1 });
DeliveryZoneSchema.index({ priority: -1 });

const DeliveryZone: Model<IDeliveryZone> =
  mongoose.models.DeliveryZone ??
  mongoose.model<IDeliveryZone>("DeliveryZone", DeliveryZoneSchema);

export default DeliveryZone;
