import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBusinessHours {
  day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  open: string;   // "08:00"
  close: string;  // "18:00"
  isOpen: boolean;
}

export interface IStoreLocation {
  businessName: string;
  address: string;
  region: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  defaultDeliveryFee: number;
  pricePerKm: number;
  freeDeliveryThreshold?: number | null;
  freeDeliveryEnabled?: boolean;
  maxDeliveryRadiusKm: number;
}

export interface IDeliverySettings {
  greaterAccraEnabled: boolean;
  nationwideEnabled: boolean;
  greaterAccraMethod: "ZONE" | "DISTANCE"; // ZONE = named area zones, DISTANCE = radius tiers
  allowGPS: boolean;
  allowManualAddress: boolean;
  allowSearch: boolean;
  minimumDeliveryFee: number;
  maximumDeliveryFee: number;
  gpsAccuracyThresholdMeters: number; // warn customer if GPS accuracy worse than this
}

export interface ISettings extends Document {
  // Business
  businessName: string;
  logo?: string;
  phone: string;
  email: string;
  whatsapp?: string;
  address?: string;

  // Store Pickup / Warehouse Base Location for distance calculations
  storeLocation: IStoreLocation;

  // Delivery behaviour settings
  deliverySettings: IDeliverySettings;

  // Payments (Paystack)
  paystack?: {
    publicKey?: string;
    secretKey?: string;
    testMode: boolean;
    channels: string[];
  };

  // Inventory & Stock Rules
  inventory?: {
    defaultLowStockThreshold: number;
    allowBackorders: boolean;
    reservationTtlMinutes: number;
  };

  // Delivery Provider Integration (Yango ready)
  deliveryProvider?: {
    defaultProvider: "INTERNAL" | "YANGO";
    yangoApiKey?: string;
    yangoEnabled: boolean;
    maxDistanceKm: number;
  };

  // Ordering
  orderingEnabled: boolean;
  minimumOrderAmount: number;
  maximumOrderAmount?: number;
  businessHours: IBusinessHours[];

  // Notifications
  notifications?: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    inAppEnabled: boolean;
    newOrderAlert: boolean;
    lowStockAlert: boolean;
    failedDeliveryAlert: boolean;
  };

  adminNotificationEmail?: string;
  adminNotificationPhone?: string;

  updatedAt: Date;
}

const BusinessHoursSchema = new Schema<IBusinessHours>(
  {
    day: {
      type: String,
      enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      required: true,
    },
    open: { type: String, default: "08:00" },
    close: { type: String, default: "18:00" },
    isOpen: { type: Boolean, default: true },
  },
  { _id: false }
);

const StoreLocationSchema = new Schema<IStoreLocation>(
  {
    businessName: { type: String, default: "Khady's Water Hub & Warehouse" },
    address: { type: String, default: "East Legon, Boundary Road, Accra" },
    region: { type: String, default: "Greater Accra" },
    city: { type: String, default: "Accra" },
    coordinates: {
      lat: { type: Number, default: 5.6356 },
      lng: { type: Number, default: -0.1601 },
    },
    defaultDeliveryFee: { type: Number, default: 20 },
    pricePerKm: { type: Number, default: 2.5 },
    freeDeliveryThreshold: { type: Number, default: 350, required: false },
    freeDeliveryEnabled: { type: Boolean, default: true },
    maxDeliveryRadiusKm: { type: Number, default: 60 },
  },
  { _id: false }
);

const SettingsSchema = new Schema<ISettings>(
  {
    businessName: { type: String, default: "Khady's Water" },
    logo: String,
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    whatsapp: String,
    address: String,
    storeLocation: {
      type: StoreLocationSchema,
      default: () => ({
        businessName: "Khady's Water Hub & Warehouse",
        address: "East Legon, Boundary Road, Accra",
        region: "Greater Accra",
        city: "Accra",
        coordinates: { lat: 5.6356, lng: -0.1601 },
        defaultDeliveryFee: 20,
        pricePerKm: 2.5,
        freeDeliveryThreshold: 350,
        freeDeliveryEnabled: true,
        maxDeliveryRadiusKm: 60,
      }),
    },
    deliverySettings: {
      greaterAccraEnabled: { type: Boolean, default: true },
      nationwideEnabled: { type: Boolean, default: true },
      greaterAccraMethod: { type: String, enum: ["ZONE", "DISTANCE"], default: "ZONE" },
      allowGPS: { type: Boolean, default: true },
      allowManualAddress: { type: Boolean, default: true },
      allowSearch: { type: Boolean, default: true },
      minimumDeliveryFee: { type: Number, default: 0 },
      maximumDeliveryFee: { type: Number, default: 1000 },
      gpsAccuracyThresholdMeters: { type: Number, default: 500 },
    },
    paystack: {
      publicKey: { type: String, default: "" },
      secretKey: { type: String, default: "" },
      testMode: { type: Boolean, default: true },
      channels: { type: [String], default: ["card", "mobile_money", "bank"] },
    },
    inventory: {
      defaultLowStockThreshold: { type: Number, default: 10 },
      allowBackorders: { type: Boolean, default: false },
      reservationTtlMinutes: { type: Number, default: 30 },
    },
    deliveryProvider: {
      defaultProvider: { type: String, enum: ["INTERNAL", "YANGO"], default: "INTERNAL" },
      yangoApiKey: { type: String, default: "" },
      yangoEnabled: { type: Boolean, default: false },
      maxDistanceKm: { type: Number, default: 60 },
    },
    orderingEnabled: { type: Boolean, default: true },
    minimumOrderAmount: { type: Number, default: 0 },
    maximumOrderAmount: Number,
    businessHours: {
      type: [BusinessHoursSchema],
      default: [
        { day: "MON", open: "08:00", close: "18:00", isOpen: true },
        { day: "TUE", open: "08:00", close: "18:00", isOpen: true },
        { day: "WED", open: "08:00", close: "18:00", isOpen: true },
        { day: "THU", open: "08:00", close: "18:00", isOpen: true },
        { day: "FRI", open: "08:00", close: "18:00", isOpen: true },
        { day: "SAT", open: "09:00", close: "16:00", isOpen: true },
        { day: "SUN", open: "00:00", close: "00:00", isOpen: false },
      ],
    },
    notifications: {
      emailEnabled: { type: Boolean, default: true },
      smsEnabled: { type: Boolean, default: false },
      inAppEnabled: { type: Boolean, default: true },
      newOrderAlert: { type: Boolean, default: true },
      lowStockAlert: { type: Boolean, default: true },
      failedDeliveryAlert: { type: Boolean, default: true },
    },
    adminNotificationEmail: String,
    adminNotificationPhone: String,
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings ??
  mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;
