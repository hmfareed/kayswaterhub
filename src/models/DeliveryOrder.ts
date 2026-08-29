import mongoose, { Schema, Document, Model } from "mongoose";
import type { DeliveryStatus, DeliveryProvider, DeliveryMethod, DeliveryPaymentStatus } from "@/types";

export interface IDeliveryOrder extends Document {
  orderId: mongoose.Types.ObjectId;
  method: DeliveryMethod;
  provider: DeliveryProvider;
  providerOrderId?: string;
  pickupAddress: string;
  destinationAddress: string;
  destinationCoordinates?: { lat: number; lng: number };
  parcelStation?: string;
  driverName?: string;
  driverPhone?: string;
  trackingUrl?: string;
  trackingReference?: string;
  deliveryFee: number; // fee charged / estimated
  estimatedFee?: number;
  actualFee?: number;
  deliveryPaymentStatus: DeliveryPaymentStatus;
  providerCost?: number; // actual cost paid to Yango
  distanceKm?: number; // calculated route distance in km
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
    method: {
      type: String,
      enum: ["YANGO_DOOR", "NATIONWIDE_PARCEL", "SELF_PICKUP"],
      default: "YANGO_DOOR",
    },
    provider: {
      type: String,
      enum: ["YANGO", "MANUAL_RIDER", "STATION_COURIER", "INTERNAL"],
      default: "YANGO",
    },
    providerOrderId: { type: String },
    pickupAddress: { type: String, required: true },
    destinationAddress: { type: String, required: true },
    destinationCoordinates: { lat: Number, lng: Number },
    parcelStation: { type: String },
    driverName: { type: String },
    driverPhone: { type: String },
    trackingUrl: { type: String },
    trackingReference: { type: String },
    deliveryFee: { type: Number, default: 0 },
    estimatedFee: { type: Number, default: 0 },
    actualFee: { type: Number },
    deliveryPaymentStatus: {
      type: String,
      enum: ["NOT_REQUIRED", "EXPECTED", "COLLECTED", "CONFIRMED", "DISPUTED", "FAILED"],
      default: "EXPECTED",
    },
    providerCost: { type: Number },
    distanceKm: { type: Number },
    status: {
      type: String,
      enum: [
        "PENDING",
        "AWAITING_COURIER",
        "COURIER_ASSIGNED",
        "PICKUP_PENDING",
        "PICKED_UP",
        "IN_TRANSIT",
        "AT_STATION",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
        "RETURNED",
        "CANCELLED",
        "CREATED",
        "DRIVER_ASSIGNED",
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
