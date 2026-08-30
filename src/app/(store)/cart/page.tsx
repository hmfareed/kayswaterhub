"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Lock,
  Sparkles,
  Store,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatCurrency, STORE_WHATSAPP_LINK } from "@/lib/constants";
import { StoreNavbar } from "@/components/store/navbar";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { RealProductImage } from "@/components/products/real-product-image";

function WhatsAppBrandIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, subtotal, itemCount } = useCart();

  const freeDeliveryThreshold = 350;
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));
  const diffForFree = freeDeliveryThreshold - subtotal;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-neutral-100 selection:bg-blue-500 selection:text-white">
      <StoreNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-16">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-neutral-500 mb-6">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-neutral-300">Shopping Cart</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-neutral-100 tracking-tight flex items-center gap-3">
              <span>Shopping Cart</span>
              {itemCount > 0 && (
                <span className="text-xs font-bold px-3 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 rounded-full">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
              Review your water pack items and proceed to checkout
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-10 sm:p-16 text-center border border-slate-200/80 dark:border-neutral-800 shadow-xs max-w-lg mx-auto space-y-5 my-8">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-neutral-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-neutral-100 tracking-tight">
                Your cart is empty
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 max-w-sm mx-auto">
                Looks like you haven&apos;t added any water packs yet. Explore our bottled water, cases, and dispenser options.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all"
              >
                <Store className="w-4 h-4" />
                <span>Start Shopping</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Active Cart Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items Table */}
            <div className="lg:col-span-7 space-y-4">
              {/* Free Delivery Bar */}
              <div className="bg-white dark:bg-neutral-900/90 rounded-2xl p-4 border border-blue-100 dark:border-neutral-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {diffForFree > 0 ? (
                      <span>
                        Add <strong className="text-blue-600 dark:text-blue-400">{formatCurrency(diffForFree)}</strong> more for <strong>Free Delivery</strong>
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        🎉 You have unlocked Free Greater Accra Delivery!
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 dark:text-neutral-500 font-mono text-[11px]">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      diffForFree <= 0 ? "bg-emerald-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-neutral-800 shadow-xs divide-y divide-slate-100 dark:divide-neutral-800">
                {items.map((item) => {
                  const lineTotal = item.product.price * item.quantity;
                  return (
                    <div
                      key={item.product.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-18 h-18 bg-slate-50 dark:bg-neutral-800 rounded-2xl p-1.5 flex items-center justify-center shrink-0 border border-slate-100 dark:border-neutral-750 shadow-2xs">
                          <RealProductImage item={item.product} />
                        </div>

                        {/* Details */}
                        <div className="min-w-0 space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold uppercase tracking-wide border border-blue-100/50 dark:border-blue-800/40">
                            {item.product.brand}
                          </span>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-neutral-100 line-clamp-1">
                            {item.product.name}
                          </h3>
                          <p className="text-xs text-slate-400 dark:text-neutral-400 font-medium">
                            {item.product.packSize} •{" "}
                            <span className="text-slate-700 dark:text-neutral-200 font-bold">
                              {formatCurrency(item.product.price)}
                            </span>{" "}
                            each
                          </p>
                        </div>
                      </div>

                      {/* Controls & Price */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 pl-22 sm:pl-0">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-slate-200 dark:border-neutral-750 rounded-xl bg-slate-50 dark:bg-neutral-800 p-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-600 text-slate-700 dark:text-neutral-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-9 text-center text-xs font-black text-slate-900 dark:text-neutral-100">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-600 text-slate-700 dark:text-neutral-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Total Line Price */}
                        <div className="text-right min-w-[70px]">
                          <span className="font-black text-sm text-slate-900 dark:text-neutral-100 block">
                            {formatCurrency(lineTotal)}
                          </span>
                        </div>

                        {/* Remove item button */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="p-2 rounded-xl text-slate-400 dark:text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Back to Shop Link */}
              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
              <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-5">
                <h2 className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-neutral-100 pb-3 border-b border-slate-100 dark:border-neutral-800">
                  Order Summary
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-neutral-400">
                    <span>Subtotal ({itemCount} items)</span>
                    <span className="font-bold text-slate-900 dark:text-neutral-200">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-neutral-400">
                    <span>Delivery</span>
                    <span className="text-slate-400 dark:text-neutral-500 font-medium">Calculated at checkout</span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex justify-between items-baseline">
                    <div>
                      <span className="font-black text-base text-slate-900 dark:text-neutral-100 block">Estimated Total</span>
                      <span className="text-[10px] text-slate-400 dark:text-neutral-500">Excludes shipping &amp; taxes</span>
                    </div>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                </div>

                {/* Primary Proceed to Checkout CTA */}
                <Link
                  href="/checkout"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>

                {/* WhatsApp Quick Order Link */}
                <a
                  href={STORE_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 active:scale-98 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <WhatsAppBrandIcon className="w-4 h-4 fill-emerald-700 dark:fill-emerald-400" />
                  <span>Order via WhatsApp instead</span>
                </a>

                {/* Trust Badges */}
                <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 space-y-2 text-[11px] text-slate-500 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Same-day doorstep delivery or self pickup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Secure payments powered by Paystack</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
