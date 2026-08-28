import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY, ORDER_NUMBER_PREFIX } from "@/lib/constants";

// ─── Tailwind class merger ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency formatter ───────────────────────────────────────────────────────
/**
 * Format a number as Ghana Cedis.
 * @example formatCurrency(30) → "GH₵ 30.00"
 */
export function formatCurrency(amount: number): string {
  return `${CURRENCY.symbol} ${amount.toFixed(2)}`;
}

// ─── Order number generator ───────────────────────────────────────────────────
/**
 * Generates a human-readable order number.
 * @example generateOrderNumber() → "ORD-A1B2C3"
 */
export function generateOrderNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const random = Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
  return `${ORDER_NUMBER_PREFIX}-${random}`;
}

// ─── Slug helper ─────────────────────────────────────────────────────────────
/**
 * Converts a string to a URL-safe slug.
 * @example slugify("Voltic 500ml × 24") → "voltic-500ml-24"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/×/g, "x")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Pagination helper ────────────────────────────────────────────────────────
export function getPaginationSkip(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * limit;
}

// ─── Safe JSON parse ──────────────────────────────────────────────────────────
export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// ─── Phone number normalizer (Ghana) ─────────────────────────────────────────
/**
 * Normalizes a Ghanaian phone number to +233 format.
 * @example normalizeGhanaPhone("0244123456") → "+233244123456"
 */
export function normalizeGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233")) return `+${digits}`;
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`;
  return `+233${digits}`;
}

// ─── Truncate ─────────────────────────────────────────────────────────────────
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

// ─── Available stock ─────────────────────────────────────────────────────────
export function getAvailableStock(
  stockQuantity: number,
  reservedQuantity: number
): number {
  return Math.max(0, stockQuantity - reservedQuantity);
}
