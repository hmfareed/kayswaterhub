"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heart, Plus, Minus, Check } from "lucide-react";
import { StoreProduct, formatCurrency } from "@/lib/constants";
import { useCart } from "@/context/cart-context";
import { WaterBottleGraphic } from "@/components/ui/water-bottle-graphics";

interface ProductCardProps {
  product: StoreProduct;
  variant?: "grid" | "horizontal" | "simple";
}

export function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const { addItem, toggleWishlist, isInWishlist } = useCart();
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);
  const isWishlisted = isInWishlist(product.id);

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity((prev) => prev + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const productImage = product.images?.[0];

  // Horizontal Card Variant (Mobile Shop layout)
  if (variant === "horizontal") {
    return (
      <div className="group bg-white dark:bg-neutral-900/90 rounded-2xl p-3.5 border border-slate-100 dark:border-neutral-800 shadow-xs hover:shadow-md hover:border-blue-100 dark:hover:border-neutral-700 transition-all flex gap-3.5 relative">
        {/* Left: Bottle Image */}
        <Link
          href={`/products/${product.slug}`}
          className="w-24 h-28 bg-slate-50/70 dark:bg-neutral-800/80 rounded-xl flex items-center justify-center shrink-0 p-1.5 group-hover:scale-105 transition-transform overflow-hidden relative"
        >
          {productImage ? (
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-contain dark:mix-blend-normal select-none"
            />
          ) : (
            <WaterBottleGraphic
              brand={product.brand}
              size={product.bottleSize.includes("1.5") ? "1.5L" : product.category === "Dispensers" ? "19L" : product.category === "Sachet Water" ? "sachet" : "500ml"}
              isPack={product.bottlesPerPack > 1 && product.category === "Bottled Water"}
              className="w-full h-full"
            />
          )}
        </Link>

        {/* Right: Details */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-1">
              <Link href={`/products/${product.slug}`}>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-neutral-100 leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {product.name}
                </h3>
              </Link>
              <button
                onClick={handleWishlistToggle}
                className="p-1 text-slate-300 dark:text-neutral-500 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                aria-label="Save to wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-slate-900 dark:text-neutral-100 text-sm">
                GHC{product.price.toFixed(2)}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-transparent dark:border-emerald-800/40 px-1.5 py-0.5 rounded">
                In Stock
              </span>
            </div>
          </div>

          {/* Stepper + Add to Cart */}
          <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-50 dark:border-neutral-800">
            <div className="flex items-center border border-slate-200 dark:border-neutral-700 rounded-lg bg-slate-50 dark:bg-neutral-800 px-1 py-0.5">
              <button
                onClick={handleDecrement}
                className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-5 text-center text-xs font-bold text-slate-800 dark:text-neutral-100">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className={`flex-1 flex items-center justify-center gap-1 text-xs font-bold py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                added
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs shadow-blue-600/20"
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <span>Add to Cart</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default Grid Card Variant (Desktop & 2-column Mobile Grid)
  return (
    <div className="group bg-white dark:bg-neutral-900/90 rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-neutral-800 shadow-2xs hover:shadow-md dark:hover:border-neutral-700 transition-all flex flex-col justify-between relative">
      {/* Top Wishlist Heart */}
      <button
        onClick={handleWishlistToggle}
        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xs flex items-center justify-center text-slate-300 dark:text-neutral-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-neutral-700 transition-all shadow-2xs cursor-pointer"
        aria-label="Add to wishlist"
      >
        <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
      </button>

      {/* Product Image Showcase (Clean white/subtle dark background for crisp transparent bottle view) */}
      <Link
        href={`/products/${product.slug}`}
        className="w-full h-36 sm:h-48 bg-slate-50/50 dark:bg-neutral-800/60 rounded-xl flex items-center justify-center p-1.5 sm:p-2 mb-2 sm:mb-3 group-hover:scale-102 transition-transform relative overflow-hidden"
      >
        {productImage ? (
          <img
            src={productImage}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal select-none"
          />
        ) : (
          <WaterBottleGraphic
            brand={product.brand}
            size={product.bottleSize.includes("1.5") ? "1.5L" : product.category === "Dispensers" ? "19L" : product.category === "Sachet Water" ? "sachet" : "500ml"}
            isPack={product.bottlesPerPack > 1 && product.category === "Bottled Water"}
            className="w-full h-full"
          />
        )}
      </Link>

      {/* Title & Info */}
      <div className="space-y-1 sm:space-y-1.5 flex-1">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-neutral-100 leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="pt-0.5 sm:pt-1">
          <span className="font-black text-slate-900 dark:text-neutral-100 text-sm sm:text-base">
            GHC{product.price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="mt-3 sm:mt-4 pt-1 sm:pt-2">
        <button
          onClick={handleAddToCart}
          className={`w-full flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            added
              ? "bg-emerald-600 text-white"
              : "bg-[#0066FF] hover:bg-[#0052cc] active:scale-95 text-white shadow-xs shadow-blue-600/20"
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Added</span>
            </>
          ) : (
            <span>Add to Cart</span>
          )}
        </button>
      </div>
    </div>
  );
}
