import mongoose, { Schema, Document, Model } from "mongoose";
import type { AddressLabel } from "@/lib/constants";

export interface IAddress extends Document {
  userId?: mongoose.Types.ObjectId; // null for guest addresses embedded in orders
  label?: AddressLabel;
  fullName?: string;
  phone?: string;
  region: string;
  city: string;
  area?: string;
  digitalAddress?: string; // e.g. GA-183-9022
  houseOrBuilding?: string;
  landmark?: string;
  deliveryInstructions?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    label: { type: String, enum: ["HOME", "OFFICE", "OTHER"], default: "HOME" },
    fullName: { type: String },
    phone: { type: String },
    region: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String },
    digitalAddress: { type: String },
    houseOrBuilding: { type: String },
    landmark: { type: String },
    deliveryInstructions: { type: String, maxlength: 500 },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AddressSchema.index({ userId: 1 });

const Address: Model<IAddress> =
  mongoose.models.Address ?? mongoose.model<IAddress>("Address", AddressSchema);

export default Address;
