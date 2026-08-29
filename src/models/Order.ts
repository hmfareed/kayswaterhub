import mongoose, { Schema, Document, Model } from "mongoose";
import type {
  OrderStatus,
  RefundStatus,
  PaymentMethod,
  DeliveryMethod,
  DeliveryPaymentStatus,
  DeliveryPaymentMethod,
} from "@/types";

// ─── Embedded sub-documents ───────────────────────────────────────────────────

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  // Price snapshot — never recalculate from current product price
  productName: string;
  brandName: string;
  variantName: string;
  bottleSize: string;
  unitsPerPack: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  pricingTier?: string; // e.g. "5–9 packs"
}

export interface IGuestInformation {
  name: string;
  email: string;
  phone: string;
}

export interface IDeliverySnapshot {
  fee: number;
  originalFee: number; // before free-delivery discount
  region: string;
  zone?: string;
  calculationMethod: "ZONE" | "DISTANCE" | "REGIONAL" | "EXCEPTION" | "FREE" | "PICKUP";
  pricingRule?: string; // e.g. "4-6_PACKS"
  isFreeDelivery: boolean;
  packQuantity: number;
}

export interface IDeliveryAddress {
  fullName?: string;
  phone?: string;
  region: string;
  city: string;
  area?: string;
  digitalAddress?: string;
  houseOrBuilding?: string;
  landmark?: string;
  deliveryInstructions?: string;
  parcelStation?: string; // For nationwide parcel delivery
  coordinates?: { lat: number; lng: number };
  gpsAccuracy?: number; // metres
  addressSource?: "GPS" | "SEARCH" | "MANUAL"; // how the address was entered
  distanceKm?: number;
  zoneName?: string;
  deliverySnapshot?: IDeliverySnapshot; // locked fee at order time
}

export interface ICancellation {
  reason?: string;
  cancelledBy: "CUSTOMER" | "ADMIN";
  cancelledAt: Date;
}

export interface IRefund {
  status: RefundStatus;
  amount: number;
  reason?: string;
  reference?: string;
  processedAt?: Date;
}

export interface IOrderTimelineEvent {
  status: string;
  title: string;
  description?: string;
  actor?: string; // "CUSTOMER" | "ADMIN" | "SYSTEM" | "PAYSTACK" | "YANGO"
  timestamp: Date;
}

// ─── Main Order Document ──────────────────────────────────────────────────────

export interface IOrder extends Document {
  orderNumber: string;
  customerId?: mongoose.Types.ObjectId;
  guestInformation?: IGuestInformation;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  // Product payment fields (Online Paystack amount = subtotal - discount)
  total: number; // Online product payment amount
  amountPaidOnline?: number;
  // Delivery fee fields (Paid separately to courier)
  deliveryFee: number; // Estimated delivery fee (kept for backwards compatibility)
  estimatedDeliveryFee: number;
  actualDeliveryFee?: number;
  deliveryMethod: DeliveryMethod;
  deliveryPaymentStatus: DeliveryPaymentStatus;
  deliveryPaymentMethod?: DeliveryPaymentMethod;
  deliveryPaymentReference?: string;
  // Courier assignment fields
  courierProvider?: string; // "YANGO" | "MANUAL_RIDER" | "VIP_PARCEL" | etc.
  courierName?: string;
  courierPhone?: string;
  trackingReference?: string;
  paymentId?: mongoose.Types.ObjectId;
  paymentMethod?: string;
  deliveryId?: mongoose.Types.ObjectId;
  deliveryAddress: IDeliveryAddress;
  status: OrderStatus;
  timeline: IOrderTimelineEvent[];
  cancellation?: ICancellation;
  refund?: IRefund;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    productName: { type: String, required: true },
    brandName: { type: String, required: true },
    variantName: { type: String, required: true },
    bottleSize: { type: String, required: true },
    unitsPerPack: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    pricingTier: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    guestInformation: {
      name: String,
      email: String,
      phone: String,
    },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, uppercase: true, trim: true },
    total: { type: Number, required: true }, // Online product amount
    amountPaidOnline: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 }, // Estimated fee
    estimatedDeliveryFee: { type: Number, default: 0 },
    actualDeliveryFee: { type: Number },
    deliveryMethod: {
      type: String,
      enum: ["YANGO_DOOR", "NATIONWIDE_PARCEL", "SELF_PICKUP"],
      default: "YANGO_DOOR",
    },
    deliveryPaymentStatus: {
      type: String,
      enum: ["NOT_REQUIRED", "EXPECTED", "COLLECTED", "CONFIRMED", "DISPUTED", "FAILED"],
      default: "EXPECTED",
    },
    deliveryPaymentMethod: {
      type: String,
      enum: ["CASH_TO_COURIER", "MOMO_TO_COURIER", "NOT_APPLICABLE"],
      default: "CASH_TO_COURIER",
    },
    deliveryPaymentReference: String,
    courierProvider: { type: String, default: "YANGO" },
    courierName: String,
    courierPhone: String,
    trackingReference: String,
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    paymentMethod: { type: String, default: "PAYSTACK" },
    deliveryId: { type: Schema.Types.ObjectId, ref: "DeliveryOrder" },
    deliveryAddress: {
      fullName: String,
      phone: String,
      region: { type: String, required: true },
      city: { type: String, required: true },
      area: String,
      digitalAddress: String,
      houseOrBuilding: String,
      landmark: String,
      deliveryInstructions: String,
      parcelStation: String,
      coordinates: { lat: Number, lng: Number },
      gpsAccuracy: Number,
      addressSource: { type: String, enum: ["GPS", "SEARCH", "MANUAL"] },
      distanceKm: Number,
      zoneName: String,
      deliverySnapshot: {
        fee: Number,
        originalFee: Number,
        region: String,
        zone: String,
        calculationMethod: { type: String, enum: ["ZONE", "DISTANCE", "REGIONAL", "EXCEPTION", "FREE", "PICKUP"] },
        pricingRule: String,
        isFreeDelivery: Boolean,
        packQuantity: Number,
      },
    },
    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "PAID",
        "CONFIRMED",
        "PROCESSING",
        "READY_FOR_DELIVERY",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "FAILED_DELIVERY",
        "REFUND_PENDING",
        "REFUNDED",
      ],
      default: "PENDING_PAYMENT",
    },
    timeline: [
      {
        status: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String },
        actor: { type: String, default: "SYSTEM" },
        timestamp: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    cancellation: {
      reason: String,
      cancelledBy: { type: String, enum: ["CUSTOMER", "ADMIN"] },
      cancelledAt: Date,
    },
    refund: {
      status: {
        type: String,
        enum: ["NOT_REQUIRED", "PENDING", "PROCESSING", "COMPLETED", "FAILED"],
        default: "NOT_REQUIRED",
      },
      amount: Number,
      reason: String,
      reference: String,
      processedAt: Date,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
