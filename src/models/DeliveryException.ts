import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * DeliveryException — overrides zone/region pricing for specific areas.
 * Checked first in the pricing priority hierarchy (Module 27).
 * Example use case: Airport Residential negotiated at ₵20.
 */
export interface IDeliveryException extends Document {
  name: string; // e.g. "Airport Residential VIP"
  areas: string[]; // area names to match against customer address
  fee: number; // override delivery fee
  priority: number; // higher = evaluated first when multiple exceptions match
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryExceptionSchema = new Schema<IDeliveryException>(
  {
    name: { type: String, required: true, trim: true },
    areas: [{ type: String, trim: true }],
    fee: { type: Number, required: true, min: 0 },
    priority: { type: Number, default: 50 }, // higher than zone default of 10
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true }
);

DeliveryExceptionSchema.index({ isActive: 1, priority: -1 });

const DeliveryException: Model<IDeliveryException> =
  mongoose.models.DeliveryException ??
  mongoose.model<IDeliveryException>("DeliveryException", DeliveryExceptionSchema);

export default DeliveryException;
