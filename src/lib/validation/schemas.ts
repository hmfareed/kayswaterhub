import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const phoneRegex = /^[+\d\s().-]{9,15}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Detects whether a string looks like a phone number or an email */
export function isPhone(value: string) {
  return phoneRegex.test(value.replace(/\s/g, ""));
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Login schema — identifier can be email OR phone number, plus a password.
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or phone number is required")
    .refine(
      (v) => emailRegex.test(v) || phoneRegex.test(v.replace(/\s/g, "")),
      "Please enter a valid email or phone number"
    ),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.union([z.boolean(), z.string()]).optional(),
});

/**
 * Registration schema — user chooses email or phone, never forced to provide both.
 */
export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(60, "Name is too long").trim(),
    identifierType: z.enum(["email", "phone"]),
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the terms" }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.identifierType === "email") {
      if (!data.email) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Email is required", path: ["email"] });
      } else if (!emailRegex.test(data.email)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid email address", path: ["email"] });
      }
    }
    if (data.identifierType === "phone") {
      if (!data.phone) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Phone number is required", path: ["phone"] });
      } else if (!phoneRegex.test(data.phone.replace(/\s/g, ""))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid phone number", path: ["phone"] });
      }
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Guest Checkout ───────────────────────────────────────────────────────────
export const guestInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(9, "Phone number too short")
    .max(15, "Phone number too long"),
});

// ─── Address ──────────────────────────────────────────────────────────────────
export const addressSchema = z.object({
  label: z.enum(["HOME", "OFFICE", "OTHER"]).optional(),
  region: z.string().min(1, "Region is required"),
  city: z.string().min(1, "City/Town is required"),
  area: z.string().optional(),
  houseOrBuilding: z.string().optional(),
  landmark: z.string().optional(),
  deliveryInstructions: z.string().max(500).optional(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

// ─── Product / Admin ──────────────────────────────────────────────────────────
export const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
});

export const productVariantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().optional(),
  bottleSize: z.string().min(1, "Bottle size is required"), // e.g. "500ml"
  unitsPerPack: z.number().int().min(1, "Units per pack must be at least 1"),
  price: z.number().min(0, "Price must be non-negative"),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  isAvailable: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().optional(),
  brandId: z.string().min(1, "Brand is required"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  variants: z.array(productVariantSchema).min(1, "At least one variant required"),
});

// ─── Pricing Rules ────────────────────────────────────────────────────────────
export const pricingTierSchema = z.object({
  minQty: z.number().int().min(1),
  maxQty: z.number().int().min(1).nullable(),
  unitPrice: z.number().min(0),
});

export const pricingRuleSchema = z.object({
  variantId: z.string().min(1),
  tiers: z.array(pricingTierSchema).min(1, "At least one pricing tier required"),
});

// ─── Bulk Order Request ───────────────────────────────────────────────────────
export const bulkOrderRequestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(9, "Phone is required"),
  email: z.string().email("Invalid email"),
  preferredBrand: z.string().optional(),
  packType: z.string().optional(),
  quantity: z.number().int().min(50, "Minimum 50 packs for bulk orders"),
  deliveryDate: z.string().min(1, "Preferred delivery date is required"),
  region: z.string().min(1, "Region is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  notes: z.string().max(1000).optional(),
});

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const addToCartSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
});

// ─── Inventory Adjustment ─────────────────────────────────────────────────────
export const inventoryAdjustmentSchema = z.object({
  variantId: z.string().min(1),
  type: z.enum(["RESTOCK", "ADJUSTMENT", "DAMAGED", "RETURN"]),
  quantity: z.number().int(),
  reason: z.string().optional(),
});

// ─── Types inferred from schemas ──────────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type GuestInfoInput = z.infer<typeof guestInfoSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type BrandInput = z.infer<typeof brandSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type PricingRuleInput = z.infer<typeof pricingRuleSchema>;
export type BulkOrderRequestInput = z.infer<typeof bulkOrderRequestSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
