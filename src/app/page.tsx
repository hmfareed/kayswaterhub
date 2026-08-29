"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { STORE_PRODUCTS, WATER_BRANDS, STORE_WHATSAPP_LINK } from "@/lib/constants";
import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { ProductCard } from "@/components/products/product-card";
import { BrandLogo } from "@/components/ui/brand-logos";
import { HeroVolticSplash } from "@/components/home/hero-voltic-splash";

function WhatsAppBrandIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export default function HomePage() {
  const bestSellers = STORE_PRODUCTS.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-slate-900 dark:text-neutral-100 selection:bg-blue-500 selection:text-white relative font-sans">
      {/* ─── Top Hero Section with Sea-Blue Gradient ──────────────────────── */}
      <div className="bg-[radial-gradient(ellipse_120%_90%_at_25%_0%,#cce7fe_0%,#dff0ff_30%,#edf7ff_55%,#f7fbff_80%,#ffffff_100%)] dark:bg-[radial-gradient(ellipse_120%_90%_at_25%_0%,#0c1a30_0%,#08101e_40%,#000000_80%)] border-b border-blue-100/50 dark:border-neutral-800">
        {/* Main Clean Seamless Navbar */}
        <StoreNavbar />

        <section className="relative overflow-hidden pt-20 pb-14 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-10 items-center min-h-[520px]">
              
              {/* Text / CTAs Column: Order 2 on Mobile, Order 1 on Desktop */}
              <div className="lg:col-span-6 space-y-5 sm:space-y-7 text-center lg:text-left order-2 lg:order-1 pt-0 sm:pt-2 lg:pt-0">
                <h1 className="text-4xl sm:text-5xl md:text-[54px] lg:text-[60px] xl:text-[68px] font-black text-slate-900 dark:text-neutral-50 tracking-tight leading-[1.07]">
                  Hydration <br />
                  <span className="whitespace-nowrap">delivered to your</span> <br />
                  <span className="text-[#0066FF] dark:text-blue-400">door.</span>
                </h1>

                <p className="text-sm sm:text-base lg:text-[17px] text-slate-500 dark:text-neutral-400 font-normal leading-relaxed max-w-lg mx-auto lg:mx-0">
                  Purified bottled water, fresh from Kay&apos;s Packs to your home. Fastest water delivery to keep you hydrated.
                </p>

                {/* Hero Dual Pill Action Buttons */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 sm:gap-4 pt-1 sm:pt-2">
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center gap-2.5 bg-[#172554] dark:bg-blue-600 hover:bg-[#0f172a] dark:hover:bg-blue-700 active:scale-98 text-white font-bold text-sm sm:text-base px-7 sm:px-9 py-3.5 sm:py-4 rounded-full shadow-lg shadow-slate-900/15 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Shop now</span>
                  </Link>

                  <a
                    href={STORE_WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 bg-[#22c55e] hover:bg-[#16a34a] active:scale-98 text-white font-bold text-sm sm:text-base px-6 sm:px-8 py-3.5 sm:py-4 rounded-full shadow-lg shadow-green-500/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  >
                    <WhatsAppBrandIcon className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                    <span>Order on WhatsApp</span>
                  </a>
                </div>

                {/* 3 Trust Stats Metrics */}
                <div className="pt-6 sm:pt-8 flex items-center justify-center lg:justify-start gap-8 sm:gap-12">
                  <div>
                    <div className="text-2xl sm:text-3xl lg:text-[38px] font-black text-slate-900 dark:text-neutral-50 tracking-tight leading-none">
                      200+
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 font-semibold mt-1.5">
                      Happy customers
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl lg:text-[38px] font-black text-slate-900 dark:text-neutral-50 tracking-tight leading-none">
                      3+
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 font-semibold mt-1.5">
                      Best products
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl sm:text-3xl lg:text-[38px] font-black text-slate-900 dark:text-neutral-50 tracking-tight leading-none">
                      Fastest
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 font-semibold mt-1.5">
                      Keep hydrated
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottle Column: Order 1 on Mobile (First), Order 2 on Desktop (Right) */}
              <div className="lg:col-span-6 flex items-center justify-center relative order-1 lg:order-2 py-0 sm:py-2 lg:py-0">
                <HeroVolticSplash />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ─── The Rest of the Page (AMOLED Black Compatible) ─────────────────── */}
      <main className="flex-1 bg-white dark:bg-black pb-16 lg:pb-0">
        {/* ─── Shop By Brand Section ─────────────────────────────────────────── */}
        <section id="brands" className="py-14 lg:py-16 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">Shop By Brand</h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Explore authentic mineral water brands in Ghana</p>
              </div>
              <Link
                href="/shop"
                className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                View all
              </Link>
            </div>

            {/* Brand Logo Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {WATER_BRANDS.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/shop?brand=${brand.slug}`}
                  className="h-24 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-neutral-700 hover:shadow-xs flex items-center justify-center text-center transition-all group"
                >
                  <BrandLogo brand={brand.name} className="h-8 w-auto group-hover:scale-105 transition-transform" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Best Sellers Section ──────────────────────────────────────────── */}
        <section className="py-14 lg:py-16 bg-white dark:bg-black border-t border-slate-100 dark:border-neutral-850">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">Best Sellers</h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Most requested water bottle packs and cases</p>
              </div>
              <Link
                href="/shop"
                className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                View all
              </Link>
            </div>

            {/* 2-column Grid on Mobile, 4-column on Desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} variant="grid" />
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works Section ─────────────────────────────────────────── */}
        <section id="how-it-works" className="py-18 bg-[#0B1528] dark:bg-neutral-950 text-white border-y dark:border-neutral-850">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">How It Works</h2>
              <p className="text-sm text-slate-400 mt-2">Pure hydration delivered in 4 simple steps</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center space-y-3 relative">
                <div className="w-12 h-12 rounded-full bg-white text-slate-900 font-extrabold text-base flex items-center justify-center shadow-md">
                  1
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white">Choose Water</h3>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  Pick your favorite brand and pack quantity
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center space-y-3 relative">
                <div className="w-12 h-12 rounded-full bg-white text-slate-900 font-extrabold text-base flex items-center justify-center shadow-md">
                  2
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white">Enter Details</h3>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  Provide your delivery address and location
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center space-y-3 relative">
                <div className="w-12 h-12 rounded-full bg-white text-slate-900 font-extrabold text-base flex items-center justify-center shadow-md">
                  3
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white">Make Payment</h3>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  Pay securely online via MoMo or Card
                </p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center space-y-3 relative">
                <div className="w-12 h-12 rounded-full bg-white text-slate-900 font-extrabold text-base flex items-center justify-center shadow-md">
                  4
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white">We Deliver</h3>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  Fast doorstep delivery to keep you refreshed
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Need Bulk Water for an Event? Section ─────────────────────────── */}
        <section className="py-16 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-[#EAF3FD] dark:bg-neutral-900/90 p-8 sm:p-12 border border-blue-100 dark:border-neutral-800 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-xl space-y-4 text-left">
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-neutral-50 leading-tight">
                  Need Bulk Water <br className="hidden sm:inline" />for an Event?
                </h2>

                <p className="text-sm sm:text-base text-slate-600 dark:text-neutral-400 font-normal leading-relaxed">
                  We&apos;ve got you covered with customized prices for weddings, conferences, parties, and offices.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <Link
                    href="/bulk-orders"
                    className="inline-flex items-center justify-center bg-[#0066FF] hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm transition-all active:scale-98"
                  >
                    Request Bulk Quote
                  </Link>
                  <a
                    href={STORE_WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm transition-all active:scale-98"
                  >
                    <WhatsAppBrandIcon className="w-4 h-4 fill-white" />
                    <span>WhatsApp Us</span>
                  </a>
                </div>
              </div>

              <div className="w-full max-w-md flex items-center justify-center">
                <img
                  src="/images/bulk-water-cluster.png"
                  alt="Bulk water bottles and dispenser packs"
                  className="w-full h-auto object-contain max-h-64 select-none"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <StoreFooter />

      {/* Mobile Sticky Bottom Nav */}
      <MobileBottomNav />
    </div>
  );
}
