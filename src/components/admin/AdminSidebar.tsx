"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  CreditCard,
  RotateCcw,
  Tag,
  Star,
  Truck,
  MapPin,
  Map,
  Compass,
  History,
  Radio,
  BarChart3,
  TrendingUp,
  PieChart,
  UserCheck,
  FileSpreadsheet,
  Bell,
  Activity,
  HeartPulse,
  Settings,
  LogOut,
  ExternalLink,
  Droplets,
  ChevronDown,
  ChevronRight,
  X,
  Globe,
  Zap,
} from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname() || "";
  const [businessName, setBusinessName] = useState("Khady's Water");
  const [deliveryExpanded, setDeliveryExpanded] = useState(
    pathname?.startsWith("/admin/delivery") ?? false
  );
  const [analyticsExpanded, setAnalyticsExpanded] = useState(
    pathname?.startsWith("/admin/analytics") ?? false
  );

  useEffect(() => {
    // 1. Initial fetch from settings
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setBusinessName(d.data.businessName || d.data.storeName || "Khady's Water");
        }
      })
      .catch(() => {});

    // 2. Real-time event listener when admin updates settings
    const handleSettingsUpdated = (e: any) => {
      if (e.detail?.businessName) {
        setBusinessName(e.detail.businessName);
      }
    };

    window.addEventListener("settings-updated", handleSettingsUpdated);
    return () => {
      window.removeEventListener("settings-updated", handleSettingsUpdated);
    };
  }, []);

  const sections = [
    {
      title: "MAIN",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
        { name: "Products", href: "/admin/products", icon: Package },
        { name: "Categories & Brands", href: "/admin/categories", icon: Layers },
        { name: "Inventory", href: "/admin/inventory", icon: Radio },
        { name: "Customers", href: "/admin/customers", icon: Users },
      ],
    },
    {
      title: "COMMERCE",
      items: [
        { name: "Payments", href: "/admin/payments", icon: CreditCard },
        { name: "Refunds", href: "/admin/refunds", icon: RotateCcw },
        { name: "Promotions", href: "/admin/promotions", icon: Tag },
        { name: "Reviews", href: "/admin/reviews", icon: Star },
      ],
    },
    {
      title: "DELIVERY & GPS",
      isGroup: true,
      expanded: deliveryExpanded,
      toggle: () => setDeliveryExpanded(!deliveryExpanded),
      icon: Truck,
      items: [
        { name: "Overview", href: "/admin/delivery", icon: Compass },
        { name: "Store Location", href: "/admin/delivery/store-location", icon: MapPin },
        { name: "Delivery Zones", href: "/admin/delivery/zones", icon: Map },
        { name: "Regions", href: "/admin/delivery/regions", icon: Globe },
        { name: "Exceptions", href: "/admin/delivery/exceptions", icon: Zap },
        { name: "Pricing Rules", href: "/admin/delivery/pricing", icon: Tag },
        { name: "Active Deliveries", href: "/admin/delivery/active", icon: Truck },
        { name: "Delivery History", href: "/admin/delivery/history", icon: History },
      ],
    },
    {
      title: "ANALYTICS & REPORTS",
      isGroup: true,
      expanded: analyticsExpanded,
      toggle: () => setAnalyticsExpanded(!analyticsExpanded),
      icon: BarChart3,
      items: [
        { name: "Sales", href: "/admin/analytics/sales", icon: TrendingUp },
        { name: "Products", href: "/admin/analytics/products", icon: PieChart },
        { name: "Customers", href: "/admin/analytics/customers", icon: UserCheck },
        { name: "Delivery", href: "/admin/analytics/delivery", icon: Truck },
        { name: "Export Reports", href: "/admin/reports", icon: FileSpreadsheet },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        { name: "Notifications", href: "/admin/notifications", icon: Bell },
      ],
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Audit Logs", href: "/admin/audit-logs", icon: Activity },
        { name: "System Health", href: "/admin/system-health", icon: HeartPulse },
        { name: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/40 group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5 fill-current" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-base text-white tracking-tight leading-tight truncate" title={businessName}>
                {businessName}
              </span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                Operations Hub
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar">
          {sections.map((section, idx) => {
            if (section.isGroup) {
              const GroupIcon = section.icon;
              const hasActiveChild = section.items.some((item) => pathname === item.href);

              return (
                <div key={idx} className="space-y-1">
                  <button
                    onClick={section.toggle}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      hasActiveChild
                        ? "text-white bg-slate-800/90 font-black"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <GroupIcon className="w-4 h-4 text-blue-400" />
                      <span className="tracking-wide uppercase text-[11px] font-black">
                        {section.title}
                      </span>
                    </div>
                    {section.expanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {section.expanded && (
                    <div className="pl-3.5 pr-1 py-1 space-y-0.5 border-l-2 border-slate-800 ml-3.5">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        const ItemIcon = item.icon;

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                              isActive
                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            }`}
                          >
                            <ItemIcon className="w-3.5 h-3.5" />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={idx} className="space-y-1">
                <span className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                  {section.title}
                </span>

                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"));
                  const ItemIcon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ItemIcon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer info & links */}
        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/40 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between text-xs text-slate-400 hover:text-white font-bold px-3 py-2 rounded-xl hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Customer Storefront</span>
            </div>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Live</span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 font-bold px-3 py-2 rounded-xl hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
