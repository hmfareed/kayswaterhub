"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Package,
  Users,
  CreditCard,
  Truck,
  Map,
  Radio,
  X,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { title: "Orders Management", href: "/admin/orders", icon: ShoppingBag, category: "Operations" },
    { title: "Product Inventory", href: "/admin/products", icon: Package, category: "Catalog" },
    { title: "Stock & Adjustments", href: "/admin/inventory", icon: Radio, category: "Inventory" },
    { title: "Customer Accounts", href: "/admin/customers", icon: Users, category: "Customers" },
    { title: "Delivery Zones & Pricing", href: "/admin/delivery/zones", icon: Map, category: "Logistics" },
    { title: "Active Deliveries Dispatch", href: "/admin/delivery/active", icon: Truck, category: "Logistics" },
    { title: "Payments & Paystack", href: "/admin/payments", icon: CreditCard, category: "Finance" },
    { title: "Sales Analytics", href: "/admin/analytics/sales", icon: TrendingUp, category: "Analytics" },
  ];

  const filteredLinks = query.trim()
    ? quickLinks.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
    : quickLinks;

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
      />

      <div className="fixed inset-x-4 top-20 max-w-xl mx-auto z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a module, order ID, product name or action..."
            className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results / Suggestions */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-1">
          <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
            Navigation Shortcuts
          </span>

          {filteredLinks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              No matching modules found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredLinks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors block">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press ESC to exit</span>
          <span>Khady&apos;s Water Operations</span>
        </div>
      </div>
    </>
  );
}
