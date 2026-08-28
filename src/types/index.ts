// ─── User Roles ───────────────────────────────────────────────────────────────
export type UserRole = "CUSTOMER" | "ADMIN" | "DELIVERY" | "SUPER_ADMIN";

// ─── Order Statuses ───────────────────────────────────────────────────────────
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_DELIVERY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED_DELIVERY"
  | "REFUND_PENDING"
  | "REFUNDED";

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "REFUND_PENDING"
  | "REFUNDED";

export type PaymentMethod = "MOBILE_MONEY" | "BANK";

// ─── Delivery ─────────────────────────────────────────────────────────────────
export type DeliveryStatus =
  | "PENDING"
  | "CREATED"
  | "DRIVER_ASSIGNED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export type DeliveryProvider = "YANGO" | "INTERNAL";

// ─── Inventory ────────────────────────────────────────────────────────────────
export type InventoryTransactionType =
  | "INITIAL_STOCK"
  | "RESTOCK"
  | "SALE"
  | "RESERVATION"
  | "RELEASE"
  | "ADJUSTMENT"
  | "DAMAGED"
  | "RETURN"
  | "CANCELLED_ORDER";

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationChannel = "EMAIL" | "SMS" | "IN_APP" | "PUSH";

export type RecipientRole = "CUSTOMER" | "ADMIN" | "ALL";

export type NotificationCategory =
  | "ORDERS"
  | "PAYMENTS"
  | "DELIVERY"
  | "PRODUCTS"
  | "CUSTOMERS"
  | "SECURITY"
  | "PROMOTIONS"
  | "SYSTEM";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type NotificationEvent =
  // Customer events
  | "ORDER_PLACED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "ORDER_CONFIRMED"
  | "ORDER_PROCESSING"
  | "DELIVERY_ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "ORDER_CANCELLED"
  | "REFUND_INITIATED"
  | "REFUND_PROCESSED"
  | "ACCOUNT_WELCOME"
  | "SECURITY_ALERT"
  | "PROMOTION"
  | "ANNOUNCEMENT"
  | "BULK_QUOTE_READY"
  // Admin events
  | "NEW_ORDER"
  | "PAYMENT_RECEIVED"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "BULK_REQUEST"
  | "FAILED_PAYMENT"
  | "FAILED_DELIVERY"
  | "REFUND_REQUESTED"
  | "SYSTEM_ALERT";

// ─── Refund ───────────────────────────────────────────────────────────────────
export type RefundStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

// ─── Bulk Order ───────────────────────────────────────────────────────────────
export type BulkOrderStatus =
  | "PENDING_REVIEW"
  | "QUOTE_SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "PAID"
  | "PROCESSING"
  | "DELIVERED"
  | "CANCELLED";

// ─── Pricing ──────────────────────────────────────────────────────────────────
export interface PricingTier {
  minQty: number;
  maxQty: number | null; // null = unlimited
  unitPrice: number;
}

export interface PriceResult {
  unitPrice: number;
  totalPrice: number;
  tier: PricingTier;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItemPayload {
  variantId: string;
  quantity: number;
}

// ─── Address ──────────────────────────────────────────────────────────────────
export interface AddressPayload {
  label?: "HOME" | "OFFICE" | "OTHER";
  region: string;
  city: string;
  area?: string;
  houseOrBuilding?: string;
  landmark?: string;
  deliveryInstructions?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// ─── Promotion & Coupon ───────────────────────────────────────────────────────
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_DELIVERY";

export interface ICoupon {
  _id?: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number; // e.g. 10 for 10% or 20 for 20 GHS
  minimumOrderAmount: number;
  maximumDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export type ReviewStatus = "PENDING" | "PUBLISHED" | "HIDDEN" | "REPORTED";

export interface IProductReview {
  _id?: string;
  productId: string;
  productName?: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  rating: number; // 1-5
  comment: string;
  status: ReviewStatus;
  orderNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── Admin Dashboard & KPI Types ──────────────────────────────────────────────
export interface DashboardKpiStats {
  todaySales: number;
  todaySalesChange: number;
  totalOrders: number;
  totalOrdersChange: number;
  totalCustomers: number;
  totalCustomersChange: number;
  totalProducts: number;
  lowStockCount: number;
  pendingDeliveriesCount: number;
  revenueByTimeframe: {
    label: string;
    revenue: number;
    orders: number;
  }[];
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

