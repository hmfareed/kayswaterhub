"use client";

import React from "react";
import Link from "next/link";
import { Droplets, ShieldCheck, Truck, Clock, HeartHandshake, Phone, ArrowRight, MessageCircle } from "lucide-react";
import { StoreNavbar } from "@/components/store/navbar";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { STORE_PHONE_DISPLAY, STORE_WHATSAPP_LINK } from "@/lib/constants";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-500 selection:text-white">
      <StoreNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-blue-50/50 via-white to-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide">
              <Droplets className="w-3.5 h-3.5 fill-current" />
              <span>Pure Hydration For Ghana</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Pure Water. Reliable Delivery. <br className="hidden sm:inline" />
              <span className="text-blue-600">Zero Hassle.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              Kay&apos;s Packs connects Ghanaian households, corporate offices, and event organizers with Ghana&apos;s most trusted natural mineral and purified water brands.
            </p>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">100% Authentic Quality</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Direct partnership with certified manufacturers including Voltic, Bel-Aqua, Verna, Awake, and Slem Fit to ensure sealed purity and genuine products.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Fast Doorstep Delivery</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Same-day and scheduled dispatch across Accra and surrounding regions. We carry the heavy lifting right into your kitchen or office dispenser.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Retail & Wholesale Solutions</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Whether you need 2 packs for your apartment or 200 cases for a wedding or corporate conference, we offer transparent volume pricing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-16 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to stay refreshed?</h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Explore our wide variety of 500ml, 750ml, 1.5L and dispenser jars with convenient online payment or WhatsApp orders.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-full transition-all"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={STORE_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold px-8 py-3.5 rounded-full transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
}
