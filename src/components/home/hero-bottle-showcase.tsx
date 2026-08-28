"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag, Check, Sparkles, Droplets } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { STORE_PRODUCTS, StoreProduct } from "@/lib/constants";
import { BrandLogo } from "@/components/ui/brand-logos";

interface HeroShowcaseItem {
  id: string;
  brand: string;
  brandSlug: string;
  name: string;
  packSize: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge: string;
  tagline: string;
  themeColor: string;
  bgGlow: string;
}

const SHOWCASE_ITEMS: HeroShowcaseItem[] = [
  {
    id: "prod-voltic-500-15",
    brand: "Voltic",
    brandSlug: "voltic",
    name: "Voltic Natural Mineral Water",
    packSize: "500ml × 15 Bottles",
    price: 45.0,
    originalPrice: 48.0,
    image: "/images/products-clean/voltic-pack.png",
    badge: "Most Popular",
    tagline: "Ghana's Premier Natural Mineral Water",
    themeColor: "#0066FF",
    bgGlow: "rgba(0, 102, 255, 0.20)",
  },
  {
    id: "prod-bel-aqua-750-15",
    brand: "Bel-Aqua",
    brandSlug: "bel-aqua",
    name: "Bel-Aqua Mineral Water",
    packSize: "750ml × 15 Bottles",
    price: 42.0,
    originalPrice: 46.0,
    image: "/images/products-clean/bel-aqua-pack.png",
    badge: "Mineral Rich",
    tagline: "Pure Hydration with Essential Natural Minerals",
    themeColor: "#E11D48",
    bgGlow: "rgba(225, 29, 72, 0.20)",
  },
  {
    id: "prod-verna-500-15",
    brand: "Verna",
    brandSlug: "verna",
    name: "Verna Natural Mineral Water",
    packSize: "500ml × 15 Bottles",
    price: 40.0,
    image: "/images/products-clean/verna-500-pack.png",
    badge: "Family Choice",
    tagline: "Naturally Purified Water for Pure Family Health",
    themeColor: "#C026D3",
    bgGlow: "rgba(192, 38, 211, 0.18)",
  },
  {
    id: "prod-awake-750-16",
    brand: "Awake",
    brandSlug: "awake",
    name: "Awake Purified Drinking Water",
    packSize: "750ml × 16 Bottles",
    price: 42.0,
    originalPrice: 45.0,
    image: "/images/products-clean/awake-pack.png",
    badge: "One4Life Charity",
    tagline: "Pure Drinking Water That Gives Back to Charity",
    themeColor: "#0284C7",
    bgGlow: "rgba(2, 132, 199, 0.20)",
  },
  {
    id: "prod-slem-fit-500-16",
    brand: "Slem Fit",
    brandSlug: "slem-fit",
    name: "Slem Fit Alkaline Mineral Water",
    packSize: "500ml × 16 Bottles",
    price: 38.0,
    image: "/images/products-clean/slemfit-pack.png",
    badge: "Active Fitness",
    tagline: "Balanced pH Hydration Tailored for Active Fitness",
    themeColor: "#059669",
    bgGlow: "rgba(5, 150, 105, 0.20)",
  },
  {
    id: "prod-verna-750-16",
    brand: "Verna 750ml",
    brandSlug: "verna",
    name: "Verna Mineral Water 750ml",
    packSize: "750ml × 16 Bottles",
    price: 44.0,
    originalPrice: 48.0,
    image: "/images/products-clean/verna-750-pack.png",
    badge: "Case Pack",
    tagline: "Premium Case of 16 Pure 750ml Bottles",
    themeColor: "#E11D48",
    bgGlow: "rgba(225, 29, 72, 0.18)",
  },
];

const AUTOPLAY_INTERVAL = 4500; // 4.5 seconds

export function HeroBottleShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const { addItem } = useCart();

  const currentItem = SHOWCASE_ITEMS[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SHOWCASE_ITEMS.length) % SHOWCASE_ITEMS.length);
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(handleNext, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, handleNext]);

  const handleQuickAdd = (item: HeroShowcaseItem) => {
    const storeProd = STORE_PRODUCTS.find((p) => p.id === item.id) || {
      id: item.id,
      name: item.name,
      slug: item.brandSlug,
      brand: item.brand,
      brandSlug: item.brandSlug,
      category: "Bottled Water",
      packSize: item.packSize,
      bottleSize: item.packSize.split("×")[0].trim(),
      bottlesPerPack: 15,
      packagingType: "Shrink wrap",
      price: item.price,
      stock: 50,
      inStock: true,
      rating: 4.9,
      reviewCount: 150,
      description: item.tagline,
      images: [item.image],
    } as StoreProduct;

    addItem(storeProd, 1);
    setAddedItem(item.id);
    setTimeout(() => {
      setAddedItem(null);
    }, 1800);
  };

  return (
    <div
      className="w-full flex flex-col items-center select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ─── Main Bottle Stage with Water Splashes ────────────────────────────── */}
      <div className="relative w-full max-w-[340px] sm:max-w-[440px] md:max-w-[480px] lg:max-w-[540px] xl:max-w-[620px] aspect-square flex items-center justify-center">
        
        {/* Dynamic Water Ripple Glow Backdrop */}
        <div
          className="absolute inset-4 rounded-full blur-2xl transition-all duration-700 animate-water-ripple pointer-events-none -z-10"
          style={{
            background: `radial-gradient(circle, ${currentItem.bgGlow} 0%, rgba(255,255,255,0) 70%)`,
          }}
        />

        {/* Ambient floating water bubbles & droplets */}
        <div className="absolute top-8 left-4 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-blue-300/60 blur-[1px] animate-droplet-float pointer-events-none" />
        <div className="absolute bottom-16 -right-2 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-cyan-300/50 blur-[1px] animate-droplet-float [animation-delay:1.5s] pointer-events-none" />
        <div className="absolute top-1/3 -right-4 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-sky-200/70 animate-droplet-float [animation-delay:0.7s] pointer-events-none" />
        <div className="absolute bottom-6 left-8 w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-200/50 animate-droplet-float [animation-delay:2.2s] pointer-events-none" />

        {/* Subtle Water Splash Particles Accent */}
        <div className="absolute -top-2 right-8 flex items-center gap-1 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full shadow-xs border border-blue-100/80 text-[11px] font-bold text-blue-700 pointer-events-none animate-pulse-soft">
          <Sparkles className="w-3 h-3 text-blue-500 fill-blue-400" />
          <span>{currentItem.badge}</span>
        </div>

        {/* The Splashed Bottle Image Stack */}
        <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
          {SHOWCASE_ITEMS.map((item, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={item.id}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${
                  isActive
                    ? "opacity-100 scale-100 rotate-0 z-10 pointer-events-auto"
                    : "opacity-0 scale-95 -rotate-2 z-0 pointer-events-none"
                }`}
              >
                <div className="w-full h-full flex items-center justify-center animate-float-gentle">
                  <img
                    src={item.image}
                    alt={`${item.name} - ${item.packSize}`}
                    className="w-full h-full object-contain filter drop-shadow-[0_15px_25px_rgba(0,102,255,0.18)]"
                    draggable={false}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Left & Right Arrow Navigation Controls */}
        <button
          onClick={handlePrev}
          aria-label="Previous water bottle pack"
          className="absolute left-0 sm:-left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 shadow-md hover:shadow-lg border border-slate-200/80 flex items-center justify-center transition-all active:scale-90 z-20 backdrop-blur-xs"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next water bottle pack"
          className="absolute right-0 sm:-right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 shadow-md hover:shadow-lg border border-slate-200/80 flex items-center justify-center transition-all active:scale-90 z-20 backdrop-blur-xs"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Floating Quick Action Pack Badge */}
        <div className="absolute -bottom-2 sm:bottom-0 left-1/2 -translate-x-1/2 w-[92%] sm:w-auto min-w-[290px] sm:min-w-[340px] bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-xl shadow-blue-900/10 border border-blue-100/90 z-20 transition-all duration-300">
          <div className="flex items-center justify-between gap-3">
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-blue-600">
                  {currentItem.brand}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-semibold truncate">
                  {currentItem.packSize}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-base sm:text-lg font-black text-slate-900">
                  GH₵{currentItem.price.toFixed(2)}
                </span>
                {currentItem.originalPrice && (
                  <span className="text-xs text-slate-400 line-through font-semibold">
                    GH₵{currentItem.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleQuickAdd(currentItem)}
                className={`inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs active:scale-95 ${
                  addedItem === currentItem.id
                    ? "bg-emerald-600 text-white shadow-emerald-500/30"
                    : "bg-[#0066FF] hover:bg-[#0052cc] text-white shadow-blue-600/25 hover:shadow-md"
                }`}
              >
                {addedItem === currentItem.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Interactive Brand Pill Switcher Bar (Desktop Only) ──────────────── */}
      <div className="mt-8 sm:mt-10 w-full max-w-xl px-2 hidden md:block">
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-2.5">
          {SHOWCASE_ITEMS.map((item, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                    : "bg-white/80 hover:bg-white text-slate-700 border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-xs"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full transition-colors"
                  style={{
                    backgroundColor: isSelected ? "#38BDF8" : item.themeColor,
                  }}
                />
                <span>{item.brand}</span>
              </button>
            );
          })}
        </div>

        {/* Progress Bar for Auto-play */}
        <div className="w-48 mx-auto mt-4 h-1 bg-slate-200/70 rounded-full overflow-hidden">
          <div
            key={currentIndex}
            className={`h-full bg-[#0066FF] rounded-full ${
              !isPaused ? "animate-[shimmer_4.5s_linear]" : ""
            }`}
            style={{
              width: "100%",
              transformOrigin: "left",
              animation: !isPaused ? `expandProgress ${AUTOPLAY_INTERVAL}ms linear` : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
