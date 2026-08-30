"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PackageCheck,
  Truck,
  ShieldCheck,
  Calendar,
  Send,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import { GHANA_REGIONS, WATER_BRANDS } from "@/lib/constants";
import { StoreNavbar } from "@/components/store/navbar";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";

export default function BulkOrdersPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    eventType: "Wedding / Reception",
    brand: "Voltic",
    packSize: "500ml x 24",
    quantity: 100,
    deliveryDate: "",
    region: "Greater Accra",
    address: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-neutral-100 selection:bg-blue-500 selection:text-white">
      <StoreNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24 lg:pb-16">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Wholesale, Events & Corporate Quotes</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-neutral-50 tracking-tight">
            Order Bulk Water For Your Event
          </h1>
          <p className="text-sm text-slate-600 dark:text-neutral-400">
            Need 50+ packs of water for a wedding, funeral, conference, party, or church program? We provide special discounted wholesale rates and scheduled truck delivery.
          </p>
        </div>

        {submitted ? (
          <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-10 text-center border border-slate-200/80 dark:border-neutral-800 shadow-xs max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-neutral-100">Quote Request Received!</h2>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              Thank you, <strong className="text-slate-900 dark:text-neutral-100">{formData.name}</strong>. Our bulk sales team will call you at <strong className="text-slate-900 dark:text-neutral-100">{formData.phone}</strong> within 15 minutes with wholesale pricing and delivery arrangement.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-neutral-900/90 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-neutral-800 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-neutral-100 pb-2 border-b border-slate-100 dark:border-neutral-800">
                1. Your Contact Info
              </h3>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kwame Mensah"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">Phone Number (Ghana)</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="024 123 4567"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="kwame@example.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">Event Type</label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden"
                >
                  <option>Wedding / Reception</option>
                  <option>Funeral / Memorial</option>
                  <option>Corporate Conference / Meeting</option>
                  <option>Church / Religious Event</option>
                  <option>School / Sporting Event</option>
                  <option>Retail Store Restock</option>
                </select>
              </div>
            </div>

            {/* Water Requirements */}
            <div className="space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-neutral-100 pb-2 border-b border-slate-100 dark:border-neutral-800">
                2. Water Quantity & Delivery
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">Preferred Brand</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden"
                  >
                    {WATER_BRANDS.map((b) => (
                      <option key={b.slug} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">Pack Size</label>
                  <select
                    value={formData.packSize}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden"
                  >
                    <option>500ml x 24 Bottles</option>
                    <option>330ml / 350ml Pocket x 15</option>
                    <option>750ml Premium x 12/16</option>
                    <option>1.5L Large x 12</option>
                    <option>Sachet Water (50+ Bags)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">Packs Required</label>
                  <input
                    type="number"
                    min="20"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-black text-blue-600 dark:text-blue-400 focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">Delivery Region & Location</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-100 focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden mb-2"
                >
                  {GHANA_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r} Region
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Venue address or area landmark"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block mb-1">Special Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Chilled delivery required, delivery stairs access..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs text-slate-800 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Request Wholesale Quote</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
