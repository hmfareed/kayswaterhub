"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Truck,
  CreditCard,
  Package,
  RefreshCw,
  ChevronDown,
  Phone,
  Mail,
  Search,
  ArrowRight,
} from "lucide-react";

import { StoreNavbar } from "@/components/store/navbar";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";

interface FAQItem {
  question: string;
  answer: string;
  category: "delivery" | "payment" | "orders" | "quality";
}

const FAQ_DATA: FAQItem[] = [
  // Delivery
  {
    category: "delivery",
    question: "Where do you deliver in Ghana?",
    answer:
      "We deliver across the entire Greater Accra region (East Legon, Airport, Spintex, Osu, Cantonments, Tema, Madina, Adenta, Achimota, and more) as well as selected routes in Kumasi and nationwide for bulk commercial orders.",
  },
  {
    category: "delivery",
    question: "How fast is delivery?",
    answer:
      "Standard doorstep delivery takes between 45 to 90 minutes within Accra. For scheduled bulk deliveries or office supplies, you can select your preferred delivery time slot during checkout.",
  },
  {
    category: "delivery",
    question: "Can I choose self-pickup instead of delivery?",
    answer:
      "Yes! At checkout, simply select 'Self Pickup'. Pickup is 100% free with no delivery fee at our East Legon Depot Hub (Boundary Road). You will receive an SMS when your order is packed and ready.",
  },
  {
    category: "delivery",
    question: "How much is delivery?",
    answer:
      "Delivery starts at GH₵15.00 based on your exact location distance from our hub. Orders exceeding GH₵100 or special bulk promotions qualify for discounted or free delivery.",
  },
  // Orders
  {
    category: "orders",
    question: "How do I track my water order?",
    answer:
      "Once you place an order, you receive a real-time tracking link via SMS. You can also view live delivery progress and rider contact info directly in your Account -> Order History section.",
  },
  {
    category: "orders",
    question: "Can I place bulk orders for events or offices?",
    answer:
      "Absolutely! Visit our Bulk Orders page or contact our dedicated corporate desk at +233 20 987 8744 for wholesale case pricing, scheduled weekly replenishment, and custom delivery pallets.",
  },
  {
    category: "orders",
    question: "Can I change or cancel my order after placing it?",
    answer:
      "If your order has not yet been dispatched, you can contact our support team immediately at +233 20 987 8744 to update items or delivery address.",
  },
  // Payment
  {
    category: "payment",
    question: "What payment methods are supported?",
    answer:
      "We accept all secure Ghana Mobile Money networks (MTN MoMo, Telecel Cash, AT Money) and debit/credit cards (Visa and Mastercard) processed securely via Paystack.",
  },
  {
    category: "payment",
    question: "Is online payment safe?",
    answer:
      "Yes. All payments are encrypted end-to-end with 256-bit SSL via Paystack, a certified PCI-DSS Level 1 payment gateway provider. We never store your card PIN or Mobile Money OTP.",
  },
  // Quality
  {
    category: "quality",
    question: "Are all water packs genuine and sealed?",
    answer:
      "Yes, 100%. We source all water directly from certified manufacturers including Voltic (Ghana) Limited, Blow Chem Industries (Bel-Aqua), Kasapreko (Awake), and Twellium (Verna). Every pack is tamper-proof and factory sealed.",
  },
  {
    category: "quality",
    question: "What if a bottle or pack is damaged upon arrival?",
    answer:
      "If any bottle or seal is defective upon delivery, hand it back to our rider for an instant replacement or full refund under our 100% Quality Guarantee.",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Questions", icon: HelpCircle },
  { id: "delivery", label: "Delivery & Pickup", icon: Truck },
  { id: "orders", label: "Orders & Tracking", icon: Package },
  { id: "payment", label: "Payments & Paystack", icon: CreditCard },
  { id: "quality", label: "Quality & Assurance", icon: RefreshCw },
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = FAQ_DATA.filter((faq) => {
    const matchesCat =
      activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-neutral-100 pb-24 selection:bg-blue-500 selection:text-white">
      <StoreNavbar />

      <main className="flex-1">
        {/* ── Hero Section ────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 dark:border-neutral-850">
          <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>Help Center &amp; Support</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-serif">
              Frequently Asked <span className="text-blue-400">Questions</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Everything you need to know about ordering water packs, delivery rates, Paystack payments, and wholesale delivery in Ghana.
            </p>

            {/* Search bar */}
            <div className="max-w-md mx-auto relative pt-4">
              <Search className="absolute left-4 top-7 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search questions (e.g. delivery fee, MoMo, pickup)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 dark:bg-neutral-900/60 border border-white/20 dark:border-neutral-700 text-white placeholder:text-slate-400 text-sm font-medium outline-hidden focus:ring-2 focus:ring-blue-500 backdrop-blur-md transition-all shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* ── Category Filters ────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-102"
                      : "bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── FAQ Accordion List ────────────────────────────────────────────── */}
          <div className="mt-6 space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900/90 rounded-2xl p-12 text-center border border-slate-200 dark:border-neutral-800 space-y-3">
                <HelpCircle className="w-12 h-12 text-slate-300 dark:text-neutral-600 mx-auto" />
                <p className="text-base font-bold text-slate-700 dark:text-neutral-200">No matching questions found</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400">Try adjusting your search terms or view all categories.</p>
                <button
                  onClick={() => { setSearch(""); setActiveCategory("all"); }}
                  className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={index}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isOpen
                        ? "bg-white dark:bg-neutral-900/90 border-blue-200 dark:border-blue-800 shadow-md ring-1 ring-blue-500/10"
                        : "bg-white dark:bg-neutral-900/90 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 shadow-2xs"
                    }`}
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-neutral-100 cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                          isOpen
                            ? "bg-blue-600 text-white rotate-180"
                            : "bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400"
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-slate-600 dark:text-neutral-300 text-sm leading-relaxed border-t border-slate-100 dark:border-neutral-800">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ── Contact Support Box ───────────────────────────────────────────── */}
          <div className="mt-12 rounded-3xl bg-linear-to-r from-blue-600 to-sky-700 text-white p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-bold font-serif">Still have questions?</h3>
              <p className="text-sky-100 text-sm max-w-md">
                Our customer happiness desk is available 24/7 via phone call and WhatsApp.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="tel:+233209878744"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-slate-100 active:scale-95 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>+233 20 987 8744</span>
              </a>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-900/60 text-white font-bold text-xs border border-white/20 hover:bg-blue-900 active:scale-95 transition-all"
              >
                <span>Order Water Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
