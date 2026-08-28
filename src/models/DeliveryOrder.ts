import mongoose, { Schema, Document, Model } from "mongoose";
import type { DeliveryStatus, DeliveryProvider } from "@/types";

export interface IDeliveryOrder extends Document {
  orderId: mongoose.Types.ObjectId;
  provider: DeliveryProvider;
  providerOrderId?: string;
  pickupAddress: string;
  destinationAddress: string;
  destinationCoordinates?: { lat: number; lng: number };
  driverName?: string;
  driverPhone?: string;
  trackingUrl?: string;
  deliveryFee: number;    // fee charged to customer
  providerCost?: number;  // actual cost paid to Yango
  distanceKm?: number;    // calculated route distance in km
  status: DeliveryStatus;
  assignedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryOrderSchema = new Schema<IDeliveryOrder>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    provider: { type: String, enum: ["YANGO", "INTERNAL"], required: true },
    providerOrderId: { type: String },
    pickupAddress: { type: String, required: true },
    destinationAddress: { type: String, required: true },
    destinationCoordinates: { lat: Number, lng: Number },
    driverName: { type: String },
    driverPhone: { type: String },
    trackingUrl: { type: String },
    deliveryFee: { type: Number, required: true },
    providerCost: { type: Number },
    distanceKm: { type: Number },
    status: {
      type: String,
      enum: [
        "PENDING", "CREATED", "DRIVER_ASSIGNED", "PICKED_UP",
        "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED",
      ],
      default: "PENDING",
    },
    assignedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    failedAt: Date,
    failureReason: String,
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

DeliveryOrderSchema.index({ orderId: 1 });
DeliveryOrderSchema.index({ status: 1 });
DeliveryOrderSchema.index({ provider: 1 });

const DeliveryOrder: Model<IDeliveryOrder> =
  mongoose.models.DeliveryOrder ??
  mongoose.model<IDeliveryOrder>("DeliveryOrder", DeliveryOrderSchema);

export default DeliveryOrder;
