"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Heart,
  Plus,
  Minus,
  Check,
  ArrowLeft,
  Package,
  Sparkles,
} from "lucide-react";
import { STORE_PRODUCTS, formatCurrency } from "@/lib/constants";
import { useCart } from "@/context/cart-context";
import { StoreNavbar } from "@/components/store/navbar";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { WaterBottleGraphic } from "@/components/ui/water-bottle-graphics";
import { ProductCard } from "@/components/products/product-card";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { addItem, toggleWishlist, isInWishlist } = useCart();

  const product =
    STORE_PRODUCTS.find((p) => p.slug === slug) || STORE_PRODUCTS[0];
  const [selectedPackSize, setSelectedPackSize] = useState<string>(product.packSize);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedThumbnail, setSelectedThumbnail] = useState<number>(0);
  const [added, setAdded] = useState<boolean>(false);

  const isWishlisted = isInWishlist(product.id);
  const totalPrice = product.price * quantity;

  // Other products from same brand or category
  const relatedProducts = STORE_PRODUCTS.filter(
    (p) => p.id !== product.id && (p.brand === product.brand || p.category === product.category)
  ).slice(0, 4);

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-neutral-100 selection:bg-blue-500 selection:text-white">
      <StoreNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-neutral-500 mb-6">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-neutral-300 truncate max-w-xs">{product.name}</span>
        </div>

        {/* Back Button on Mobile */}
        <div className="lg:hidden mb-4">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shop</span>
          </Link>
        </div>

        {/* ─── Product Showcase & Buy Section ─────────────────────────────────── */}
        <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-neutral-800 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12">
          {/* Left: Thumbnail Selector + Main Image Preview */}
          <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4 items-center sm:items-start">
            {/* Thumbnails */}
            <div className="flex sm:flex-col gap-3">
              {(product.images && product.images.length > 0 ? product.images : [null]).map((imgSrc, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedThumbnail(idx)}
                  className={`w-16 h-20 rounded-xl bg-slate-50 dark:bg-neutral-800 p-2 flex items-center justify-center border transition-all overflow-hidden cursor-pointer ${
                    selectedThumbnail === idx
                      ? "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/50 dark:bg-blue-950/40"
                      : "border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600"
                  }`}
                >
                  {imgSrc ? (
                    <img src={imgSrc} alt={product.name} className="w-full h-full object-contain" />
                  ) : (
                    <WaterBottleGraphic
                      brand={product.brand}
                      size={product.bottleSize.includes("1.5") ? "1.5L" : product.category === "Dispensers" ? "19L" : "500ml"}
                      isPack={idx === 1}
                      className="w-full h-full"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Featured Image Large Display */}
            <div className="flex-1 w-full h-80 sm:h-96 bg-white dark:bg-neutral-950 rounded-2xl flex items-center justify-center p-6 border border-slate-100 dark:border-neutral-800 relative overflow-hidden">
              {product.images && product.images[selectedThumbnail] ? (
                <img
                  src={product.images[selectedThumbnail]}
                  alt={product.name}
                  className="w-full max-w-[280px] h-full object-contain select-none"
                />
              ) : (
                <WaterBottleGraphic
                  brand={product.brand}
                  size={product.bottleSize.includes("1.5") ? "1.5L" : product.category === "Dispensers" ? "19L" : product.category === "Sachet Water" ? "sachet" : "500ml"}
                  isPack={selectedThumbnail === 1 || product.bottlesPerPack > 1}
                  className="w-full max-w-[220px] h-full"
                />
              )}

              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white dark:bg-neutral-900 shadow-xs border border-slate-100 dark:border-neutral-800 flex items-center justify-center text-slate-400 dark:text-neutral-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Right: Product Details & Controls */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100/50 dark:border-blue-800/40 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{product.brand} Original</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-neutral-100 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mt-3">
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                  {formatCurrency(product.price)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1 rounded-full">
                  • In Stock
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              {product.description}
            </p>

            {/* Pack Size Box Info */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200/80 dark:border-neutral-750 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-neutral-200 uppercase tracking-wider">
                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Pack Size</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPackSize(product.packSize)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    selectedPackSize === product.packSize
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600"
                  }`}
                >
                  {product.packSize}
                </button>
              </div>
            </div>

            {/* Quantity Stepper & Total Calculation */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-900 dark:text-neutral-100 uppercase tracking-wider block">
                Quantity (Packs)
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-slate-200 dark:border-neutral-700 rounded-xl bg-slate-50 dark:bg-neutral-800 px-2 py-1.5">
                  <button
                    onClick={() => setQuantity((q) => (q > 1 ? q - 1 : 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition-colors font-bold cursor-pointer"
                    aria-label="Decrease"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-black text-slate-900 dark:text-neutral-100 text-base">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition-colors font-bold cursor-pointer"
                    aria-label="Increase"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm font-bold text-slate-600 dark:text-neutral-400">
                  Total: <span className="text-blue-600 dark:text-blue-400 font-black text-base">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAddToCart}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  added
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-98 text-white shadow-lg shadow-blue-600/30"
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <span>Add to Cart</span>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500 transition-all text-center cursor-pointer"
              >
                Buy Now
              </button>
            </div>

            {/* Trust Badges Row */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-neutral-800 text-center">
              <div className="p-2 space-y-1">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto" />
                <h3 className="font-bold text-[11px] text-slate-900 dark:text-neutral-200">100% Original</h3>
                <p className="text-[10px] text-slate-500 dark:text-neutral-400">Authentic & sealed</p>
              </div>

              <div className="p-2 space-y-1">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h3 className="font-bold text-[11px] text-slate-900 dark:text-neutral-200">Secure Payment</h3>
                <p className="text-[10px] text-slate-500 dark:text-neutral-400">100% safe payments</p>
              </div>

              <div className="p-2 space-y-1">
                <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto" />
                <h3 className="font-bold text-[11px] text-slate-900 dark:text-neutral-200">Fast Delivery</h3>
                <p className="text-[10px] text-slate-500 dark:text-neutral-400">To your doorstep</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Related Products ─────────────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-neutral-100">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} variant="grid" />
              ))}
            </div>
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
