import type { OrderStatus, PaymentStatus, DeliveryStatus } from "@/types";
export { formatCurrency } from "@/lib/utils";

// ─── User Roles ───────────────────────────────────────────────────────────────
export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  DELIVERY: "DELIVERY",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

// ─── Order Statuses ───────────────────────────────────────────────────────────
export const ORDER_STATUSES: Record<OrderStatus, OrderStatus> = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAID: "PAID",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  READY_FOR_DELIVERY: "READY_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  FAILED_DELIVERY: "FAILED_DELIVERY",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
};

/** Statuses from which a customer CAN cancel their order */
export const CANCELLABLE_ORDER_STATUSES: OrderStatus[] = [
  "PAID",
  "CONFIRMED",
  "PROCESSING",
];

// ─── Payment Statuses ─────────────────────────────────────────────────────────
export const PAYMENT_STATUSES: Record<PaymentStatus, PaymentStatus> = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
};

// ─── Delivery Statuses ────────────────────────────────────────────────────────
export const DELIVERY_STATUSES: Record<DeliveryStatus, DeliveryStatus> = {
  PENDING: "PENDING",
  AWAITING_COURIER: "AWAITING_COURIER",
  COURIER_ASSIGNED: "COURIER_ASSIGNED",
  CREATED: "CREATED",
  DRIVER_ASSIGNED: "DRIVER_ASSIGNED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  AT_STATION: "AT_STATION",
  PICKUP_PENDING: "PICKUP_PENDING",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  RETURNED: "RETURNED",
};

// ─── Ghana Regions ────────────────────────────────────────────────────────────
export const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Brong-Ahafo",
  "Bono East",
  "Ahafo",
  "Western North",
  "Oti",
  "North East",
  "Savannah",
] as const;

export type GhanaRegion = (typeof GHANA_REGIONS)[number];

// ─── Currency ─────────────────────────────────────────────────────────────────
export const CURRENCY = {
  code: "GHS",
  symbol: "GH₵",
  locale: "en-GH",
} as const;

// ─── Order Number Prefix ──────────────────────────────────────────────────────
export const ORDER_NUMBER_PREFIX = "ORD";

// ─── Inventory ────────────────────────────────────────────────────────────────
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Stock reservation TTL (minutes) ─────────────────────────────────────────
/** If payment isn't completed within this time, reservation is auto-released */
export const STOCK_RESERVATION_TTL_MINUTES = 30;

// ─── Bulk order thresholds ────────────────────────────────────────────────────
export const BULK_ORDER_MIN_PACKS = 50;
export const WHOLESALE_MIN_PACKS = 100;
export const CUSTOM_QUOTE_MIN_PACKS = 500;

// ─── Cloudinary ───────────────────────────────────────────────────────────────
export const CLOUDINARY_PRODUCT_FOLDER = "khadys-water/products";
export const CLOUDINARY_BRAND_FOLDER = "khadys-water/brands";

// ─── Address Labels ───────────────────────────────────────────────────────────
export const ADDRESS_LABELS = ["HOME", "OFFICE", "OTHER"] as const;
export type AddressLabel = (typeof ADDRESS_LABELS)[number];

// ─── Water Brands & Packaging Reference (from bottle-packs.md) ─────────────────
export interface BottlePackConfig {
  size: string;
  bottlesPerPack: string;
  packagingType: string;
}

export interface BrandConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  packs: BottlePackConfig[];
}

export const WATER_BRANDS: BrandConfig[] = [
  {
    id: "voltic",
    name: "Voltic",
    slug: "voltic",
    description: "Ghana's premier natural mineral water, naturally filtered and bottled at source.",
    tagline: "Naturally refreshing natural mineral water",
    packs: [
      { size: "350 ml (Pocket)", bottlesPerPack: "15 bottles", packagingType: "Shrink wrap" },
      { size: "500 ml", bottlesPerPack: "15 bottles (retail) or 24 bottles (carton)", packagingType: "Shrink wrap / Carton" },
      { size: "750 ml (Premium)", bottlesPerPack: "12 bottles", packagingType: "Carton box" },
      { size: "1.5 L", bottlesPerPack: "6 or 12 bottles", packagingType: "Shrink wrap / Carton" },
    ],
  },
  {
    id: "bel-aqua",
    name: "Bel-Aqua",
    slug: "bel-aqua",
    description: "Pure natural mineral water rich in essential minerals for optimal hydration.",
    tagline: "Pure hydration with essential minerals",
    packs: [
      { size: "330 ml", bottlesPerPack: "15 bottles", packagingType: "Shrink wrap" },
      { size: "500 ml", bottlesPerPack: "15 bottles", packagingType: "Shrink wrap" },
      { size: "750 ml", bottlesPerPack: "15 bottles", packagingType: "Shrink wrap" },
      { size: "1.5 L", bottlesPerPack: "12 bottles", packagingType: "Shrink wrap / Carton" },
    ],
  },
  {
    id: "verna",
    name: "Verna",
    slug: "verna",
    description: "Naturally purified water certified by Ghana Standards Authority for family health.",
    tagline: "Pure, healthy and refreshing mineral water",
    packs: [
      { size: "330 ml", bottlesPerPack: "15 bottles", packagingType: "Shrink wrap" },
      { size: "500 ml", bottlesPerPack: "15 or 16 bottles (also 24s/36s)", packagingType: "Shrink wrap / Box carton" },
      { size: "750 ml", bottlesPerPack: "16 bottles", packagingType: "Shrink wrap" },
      { size: "1.5 L", bottlesPerPack: "6 or 12 bottles", packagingType: "Shrink wrap / Carton" },
    ],
  },
  {
    id: "awake",
    name: "Awake",
    slug: "awake",
    description: "Purified drinking water supporting national charity and healthcare foundations.",
    tagline: "One4Life — Purified water that gives back",
    packs: [
      { size: "330 ml", bottlesPerPack: "15 bottles", packagingType: "Shrink wrap" },
      { size: "500 ml", bottlesPerPack: "16 bottles", packagingType: "Shrink wrap" },
      { size: "750 ml", bottlesPerPack: "16 bottles", packagingType: "Shrink wrap" },
      { size: "1.5 L", bottlesPerPack: "12 bottles (or 6-pack)", packagingType: "Carton / Shrink wrap" },
    ],
  },
  {
    id: "slem-fit",
    name: "Slem Fit",
    slug: "slem-fit",
    description: "Balanced pH water specially engineered for sports, fitness and active wellness.",
    tagline: "Hydration tailored for healthy living",
    packs: [
      { size: "500 ml", bottlesPerPack: "15 or 16 bottles (also 12s/24s)", packagingType: "Shrink wrap / Carton box" },
      { size: "750 ml", bottlesPerPack: "12, 15, or 16 bottles", packagingType: "Shrink wrap" },
    ],
  },
];

export const SEED_BRANDS = WATER_BRANDS.map((b) => ({ name: b.name, slug: b.slug }));

// ─── Store Catalog Products ───────────────────────────────────────────────────
export interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  brandSlug: string;
  category: "Bottled Water" | "Sachet Water" | "Large Bottles" | "Dispensers";
  packSize: string;
  bottleSize: string;
  bottlesPerPack: number;
  packagingType: string;
  price: number;
  originalPrice?: number;
  stock: number;
  inStock: boolean;
  isPopular?: boolean;
  isBestSeller?: boolean;
  rating: number;
  reviewCount: number;
  description: string;
  images: string[];
}

// ─── Store Contact & WhatsApp ───────────────────────────────────────────────
export const STORE_PHONE_RAW = "0504903022";
export const STORE_PHONE_INTL = "233504903022";
export const STORE_PHONE_DISPLAY = "+233 50 490 3022";
export const STORE_WHATSAPP_LINK = "https://wa.me/233504903022?text=Hello%2C%20I%20would%20like%20to%20order%20water%20from%20Kay%27s%20Packs";

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: "prod-voltic-500-15",
    name: "Voltic Natural Mineral Water 500ml x 15",
    slug: "voltic-natural-mineral-water-500ml-x-15",
    brand: "Voltic",
    brandSlug: "voltic",
    category: "Bottled Water",
    packSize: "500ml x 15 Bottles",
    bottleSize: "500 ml",
    bottlesPerPack: 15,
    packagingType: "Shrink wrap / Case",
    price: 45.0,
    originalPrice: 48.0,
    stock: 120,
    inStock: true,
    isPopular: true,
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 342,
    description: "Pure, refreshing and naturally mineralized water from the hills of Ghana. Packaged in a shrink wrap of 15 convenient 500ml bottles.",
    images: ["/images/products/newvoltic15x500ml.jpg", "/images/products/voltic-15x500ml.jpg"],
  },
  {
    id: "prod-bel-aqua-750-15",
    name: "Bel Aqua Mineral Water 750ml x 15",
    slug: "bel-aqua-mineral-water-750ml-x-15",
    brand: "Bel-Aqua",
    brandSlug: "bel-aqua",
    category: "Bottled Water",
    packSize: "750ml x 15 Bottles",
    bottleSize: "750 ml",
    bottlesPerPack: 15,
    packagingType: "Shrink wrap",
    price: 42.0,
    originalPrice: 46.0,
    stock: 95,
    inStock: true,
    isPopular: true,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 256,
    description: "Mineral-rich premium drinking water that keeps you energized and hydrated throughout your day. 15 bottles of 750ml per pack.",
    images: ["/images/products/bel-aqua-15x750ml.jpg"],
  },
  {
    id: "prod-verna-500-15",
    name: "Verna Mineral Water 500ml x 15",
    slug: "verna-mineral-water-500ml-x-15",
    brand: "Verna",
    brandSlug: "verna",
    category: "Bottled Water",
    packSize: "500ml x 15 Bottles",
    bottleSize: "500 ml",
    bottlesPerPack: 15,
    packagingType: "Shrink wrap",
    price: 40.0,
    stock: 80,
    inStock: true,
    isPopular: true,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 145,
    description: "Naturally purified water with balanced minerals, suitable for infants, adults, and wellness-focused lifestyles.",
    images: ["/images/products/verna-15x500ml.jpg"],
  },
  {
    id: "prod-verna-750-16",
    name: "Verna Mineral Water 750ml x 16",
    slug: "verna-mineral-water-750ml-x-16",
    brand: "Verna",
    brandSlug: "verna",
    category: "Bottled Water",
    packSize: "750ml x 16 Bottles",
    bottleSize: "750 ml",
    bottlesPerPack: 16,
    packagingType: "Shrink wrap",
    price: 44.0,
    originalPrice: 48.0,
    stock: 60,
    inStock: true,
    isPopular: true,
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 160,
    description: "Full case of 16 premium 750ml Verna mineral water bottles for optimal daily hydration.",
    images: ["/images/products/verna-16x750ml.jpg"],
  },
  {
    id: "prod-awake-750-16",
    name: "Awake Purified Drinking Water 750ml x 16",
    slug: "awake-purified-drinking-water-750ml-x-16",
    brand: "Awake",
    brandSlug: "awake",
    category: "Bottled Water",
    packSize: "750ml x 16 Bottles",
    bottleSize: "750 ml",
    bottlesPerPack: 16,
    packagingType: "Shrink wrap",
    price: 42.0,
    originalPrice: 45.0,
    stock: 110,
    inStock: true,
    isPopular: true,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 178,
    description: "Clean, ultra-pure water supporting charity and community cardiac healthcare across Ghana. Case of 16 bottles of 750ml.",
    images: ["/images/products/awake-16x750ml.jpg", "/images/products/awake-12x750ml.jpg"],
  },
  {
    id: "prod-slem-fit-500-16",
    name: "Slem Fit Mineral Water 500ml x 16",
    slug: "slem-fit-mineral-water-500ml-x-16",
    brand: "Slem Fit",
    brandSlug: "slem-fit",
    category: "Bottled Water",
    packSize: "500ml x 16 Bottles",
    bottleSize: "500 ml",
    bottlesPerPack: 16,
    packagingType: "Shrink wrap",
    price: 38.0,
    stock: 45,
    inStock: true,
    isPopular: true,
    isBestSeller: false,
    rating: 4.7,
    reviewCount: 64,
    description: "Special alkaline balanced pH water formulated for fitness routines and active daily lifestyles.",
    images: ["/images/products/slemfit-16x500ml.jpg"],
  },
  {
    id: "prod-verna-jar-15l",
    name: "Verna Jar Dispenser Water 15L",
    slug: "verna-jar-dispenser-water-15l",
    brand: "Verna",
    brandSlug: "verna",
    category: "Dispensers",
    packSize: "15 Litre Heavy-Duty Jar",
    bottleSize: "15 L",
    bottlesPerPack: 1,
    packagingType: "Heavy duty reusable jar",
    price: 30.0,
    stock: 35,
    inStock: true,
    isPopular: true,
    isBestSeller: false,
    rating: 4.9,
    reviewCount: 78,
    description: "Standard 15-litre water cooler jar refill, thoroughly sanitized and bottled under strict laboratory conditions.",
    images: ["/images/products/verna-jar-15ltr.jpeg"],
  },
  {
    id: "prod-voltic-350-15",
    name: "Voltic Pocket Natural Mineral Water 350ml x 15",
    slug: "voltic-pocket-natural-mineral-water-350ml-x-15",
    brand: "Voltic",
    brandSlug: "voltic",
    category: "Bottled Water",
    packSize: "350ml x 15 Bottles",
    bottleSize: "350 ml (Pocket)",
    bottlesPerPack: 15,
    packagingType: "Shrink wrap",
    price: 32.0,
    stock: 75,
    inStock: true,
    isPopular: false,
    isBestSeller: false,
    rating: 4.8,
    reviewCount: 88,
    description: "Pocket-sized Voltic bottles designed for events, schools, meetings, and quick on-the-go hydration.",
    images: ["/images/products/voltic.jpg"],
  },
];


