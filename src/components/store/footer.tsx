"use client";

import React from "react";
import Link from "next/link";
import { Droplets, Phone, Mail, MapPin, ShieldCheck, Truck, RefreshCw, Clock, MessageSquare } from "lucide-react";
import { PaymentMethodBadge } from "@/components/ui/brand-logos";
import { useChat } from "@/context/chat-context";

export function StoreFooter() {
  const { openChat } = useChat();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-24 lg:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top 4 Guarantees Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Free Delivery</h3>
              <p className="text-xs text-slate-400">On orders above GH₵100</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Safe & Secure</h3>
              <p className="text-xs text-slate-400">100% secure payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Quality Guaranteed</h3>
              <p className="text-xs text-slate-400">Original and sealed packs</p>
            </div>
          </div>
          <button
            onClick={() => openChat()}
            className="flex items-center gap-3 text-left hover:opacity-90 active:scale-98 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 flex items-center justify-center shrink-0 transition-colors">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors flex items-center gap-1">
                24/7 AI Support
              </h3>
              <p className="text-xs text-slate-400">Click to chat with us anytime</p>
            </div>
          </button>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
                <Droplets className="w-5 h-5 fill-current" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Kay&apos;s <span className="text-blue-400">Packs</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Ghana&apos;s premier multi-brand water delivery platform. Order packs and cases of Voltic, Bel-Aqua, Verna, Awake, Perla, Slem Fit &amp; more directly to your doorstep.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <PaymentMethodBadge method="MTN" />
              <PaymentMethodBadge method="TELECEL" />
              <PaymentMethodBadge method="AIRTELTIGO" />
              <PaymentMethodBadge method="VISA" />
              <PaymentMethodBadge method="MASTERCARD" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm tracking-wide uppercase">Shop Water</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/shop" className="hover:text-blue-400 transition-colors">All Products</Link></li>
              <li><Link href="/shop?category=Bottled+Water" className="hover:text-blue-400 transition-colors">Bottled Water</Link></li>
              <li><Link href="/shop?category=Large+Bottles" className="hover:text-blue-400 transition-colors">Large 1.5L Packs</Link></li>
              <li><Link href="/shop?category=Dispensers" className="hover:text-blue-400 transition-colors">19L Dispensers</Link></li>
              <li><Link href="/shop?category=Sachet+Water" className="hover:text-blue-400 transition-colors">Sachet Water Bags</Link></li>
              <li><Link href="/bulk-orders" className="hover:text-blue-400 transition-colors">Bulk &amp; Event Quotes</Link></li>
            </ul>
          </div>

          {/* Brands */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm tracking-wide uppercase">Water Brands</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/shop?brand=voltic" className="hover:text-blue-400 transition-colors">Voltic Natural Mineral</Link></li>
              <li><Link href="/shop?brand=bel-aqua" className="hover:text-blue-400 transition-colors">Bel-Aqua Mineral Water</Link></li>
              <li><Link href="/shop?brand=verna" className="hover:text-blue-400 transition-colors">Verna Mineral Water</Link></li>
              <li><Link href="/shop?brand=awake" className="hover:text-blue-400 transition-colors">Awake Purified Water</Link></li>
              <li><Link href="/shop?brand=perla" className="hover:text-blue-400 transition-colors">Perla Natural Mineral</Link></li>
              <li><Link href="/shop?brand=slem-fit" className="hover:text-blue-400 transition-colors">Slem Fit Water</Link></li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm tracking-wide uppercase">Customer Care</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => openChat()}
                  className="hover:text-blue-400 transition-colors flex items-center gap-1.5 text-left"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>AI Hydration Assistant</span>
                </button>
              </li>
              <li>
                <Link href="/faq" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>Help &amp; FAQ</span>
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-blue-400 transition-colors">
                  Refund &amp; Return Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li className="flex items-center gap-2.5 pt-2 border-t border-slate-800">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="tel:+233209878744" className="hover:text-white transition-colors">
                  +233 20 987 8744
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>support@kayspacks.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright, developer credits & legal */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Kay&apos;s Packs. All rights reserved.</p>
            <span className="hidden sm:inline text-slate-700">•</span>
            <p className="text-slate-400 font-medium">
              Built by <span className="text-blue-400 font-bold tracking-wider">FAREED CORE TECH</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/faq" className="hover:text-slate-400 transition-colors">FAQ</Link>
            <Link href="/refund-policy" className="hover:text-slate-400 transition-colors">Refund Policy</Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
