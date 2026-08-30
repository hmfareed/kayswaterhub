"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  X,
  Bell,
  Package,
  CreditCard,
  Truck,
  Tag,
  ShieldCheck,
  CheckCheck,
  ChevronRight,
  Sparkles,
  Info,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "@/context/theme-context";

export interface CustomerNotificationItem {
  _id: string;
  id?: string;
  category?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  read?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  entityType?: string;
  entityId?: string;
}

type NotifFilter = "all" | "orders" | "payments" | "delivery" | "promotions";

interface CustomerNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: CustomerNotificationItem[];
  unreadCount: number;
  loading: boolean;
  onRefresh: () => void;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMarkAllRead?: () => void;
}

function formatRelativeTime(dateInput?: string | Date): string {
  if (!dateInput) return "Recently";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "Recently";
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function CustomerNotificationsDrawer({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  onRefresh,
}: CustomerNotificationsDrawerProps) {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [activeFilter, setActiveFilter] = useState<NotifFilter>("all");
  const [localNotifs, setLocalNotifs] = useState<CustomerNotificationItem[]>(notifications);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    setLocalNotifs(notifications);
  }, [notifications]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications = localNotifs.filter((n) => {
    if (activeFilter === "all") return true;
    const cat = (n.category || "").toLowerCase();
    if (activeFilter === "orders") return cat.includes("order");
    if (activeFilter === "payments") return cat.includes("pay") || cat.includes("refund");
    if (activeFilter === "delivery") return cat.includes("deliver") || cat.includes("truck");
    if (activeFilter === "promotions") return cat.includes("promo") || cat.includes("discount");
    return true;
  });

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLocalNotifs((prev) =>
      prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true, read: true } : n))
    );
    try {
      await fetch(`/api/customer/notifications/${id}/read`, { method: "PATCH" });
      onRefresh();
    } catch (err) {
      console.warn("Failed to mark notification as read:", err);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLocalNotifs((prev) => prev.filter((n) => n._id !== id && n.id !== id));
    try {
      await fetch(`/api/customer/notifications/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.warn("Failed to delete notification:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setIsMarkingAll(true);
      setLocalNotifs((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
      await fetch("/api/customer/notifications/read-all", { method: "PATCH" });
      onRefresh();
    } catch (err) {
      console.warn("Failed to mark all as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleItemClick = async (n: CustomerNotificationItem) => {
    const isAlreadyRead = n.isRead || n.read;
    if (!isAlreadyRead) {
      await handleMarkRead(n._id || n.id || "");
    }
    onClose();

    if (
      n.actionUrl?.includes("tab=orders") ||
      n.entityType === "ORDER" ||
      n.category?.toLowerCase() === "orders" ||
      n.category?.toLowerCase() === "delivery"
    ) {
      router.push("/account?tab=orders");
    } else if (n.actionUrl) {
      router.push(n.actionUrl);
    } else {
      router.push("/account?tab=notifications");
    }
  };

  const getNotifIcon = (category?: string) => {
    const c = (category || "").toLowerCase();
    if (c.includes("order")) return <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    if (c.includes("pay") || c.includes("refund")) return <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    if (c.includes("deliver") || c.includes("truck")) return <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    if (c.includes("promo") || c.includes("discount")) return <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    if (c.includes("secur") || c.includes("auth")) return <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    return <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  };

  const getNotifIconBg = (category?: string) => {
    const c = (category || "").toLowerCase();
    if (c.includes("order")) return isDarkMode ? "bg-blue-950/60 text-blue-400" : "bg-blue-50 text-blue-600";
    if (c.includes("pay") || c.includes("refund")) return isDarkMode ? "bg-emerald-950/60 text-emerald-400" : "bg-emerald-50 text-emerald-600";
    if (c.includes("deliver") || c.includes("truck")) return isDarkMode ? "bg-amber-950/60 text-amber-400" : "bg-amber-50 text-amber-600";
    if (c.includes("promo") || c.includes("discount")) return isDarkMode ? "bg-purple-950/60 text-purple-400" : "bg-purple-50 text-purple-600";
    if (c.includes("secur") || c.includes("auth")) return isDarkMode ? "bg-rose-950/60 text-rose-400" : "bg-rose-50 text-rose-600";
    return isDarkMode ? "bg-blue-950/60 text-blue-400" : "bg-blue-50 text-blue-600";
  };

  const filterTabs: Array<{ key: NotifFilter; label: string }> = [
    { key: "all", label: "All" },
    { key: "orders", label: "Orders" },
    { key: "payments", label: "Payments" },
    { key: "delivery", label: "Delivery" },
    { key: "promotions", label: "Promos" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-in View (Full Screen on mobile, Elegant Slide Drawer on Desktop) */}
      <div
        className={`relative z-50 w-full sm:max-w-md h-full flex flex-col transition-colors duration-200 ${
          isDarkMode ? "bg-black text-neutral-100 border-l border-neutral-800" : "bg-[#F8FAFC] text-slate-900 border-l border-slate-200"
        } shadow-2xl animate-in slide-in-from-right duration-250`}
      >
        {/* Sticky Header with Back Button (Matches Account Header UX) */}
        <header
          className={`shrink-0 sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b ${
            isDarkMode
              ? "bg-black/95 border-neutral-800 text-white"
              : "bg-white/95 border-slate-100 shadow-2xs text-slate-900"
          } backdrop-blur-md`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`p-2 -ml-2 rounded-xl transition-colors cursor-pointer ${
                isDarkMode
                  ? "text-neutral-300 hover:text-white hover:bg-neutral-900"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
              aria-label="Close"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h2 className="font-serif font-black text-lg tracking-tight leading-none">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isMarkingAll ? "Marking..." : "Mark all read"}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Category Filter Tabs */}
        <div
          className={`shrink-0 flex gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-none border-b ${
            isDarkMode ? "border-neutral-850 bg-black/60" : "border-slate-100 bg-white/60"
          } backdrop-blur-xs`}
        >
          {filterTabs.map((tab) => {
            const active = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-blue-600 text-white shadow-xs"
                    : isDarkMode
                    ? "bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Notification List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading && localNotifs.length === 0 ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl border animate-pulse flex items-start gap-3 ${
                    isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-100"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-neutral-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-neutral-800 rounded w-1/3" />
                    <div className="h-2.5 bg-slate-200 dark:bg-neutral-800 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-neutral-500 space-y-3 px-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-neutral-900 border border-blue-100 dark:border-neutral-800 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 shadow-inner">
                <Bell className="w-6 h-6 stroke-[1.8]" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-neutral-200">You&apos;re all caught up!</p>
              <p className="text-xs text-slate-400 dark:text-neutral-500 max-w-xs mx-auto leading-relaxed">
                No notifications in this category. Live updates for order placements, delivery tracking, and payment receipts will appear here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isRead = n.isRead || n.read;
              return (
                <div
                  key={n._id || n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] ${
                    isRead
                      ? isDarkMode
                        ? "bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 shadow-2xs"
                      : isDarkMode
                      ? "bg-blue-950/40 border-blue-900/50 text-neutral-100 hover:border-blue-800"
                      : "bg-blue-50/70 border-blue-100 text-slate-900 hover:border-blue-200 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${getNotifIconBg(
                        n.category
                      )}`}
                    >
                      {getNotifIcon(n.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4
                          className={`text-xs leading-snug ${
                            isRead ? "font-medium" : "font-bold text-blue-950 dark:text-blue-100"
                          }`}
                        >
                          {n.title}
                        </h4>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1 shadow-xs" />
                        )}
                      </div>
                      <p className="text-[11px] mt-1 text-slate-500 dark:text-neutral-400 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-100/60 dark:border-neutral-800/80">
                        <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isRead && (
                            <button
                              onClick={(e) => handleMarkRead(n._id || n.id || "", e)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md hover:bg-blue-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(n._id || n.id || "", e)}
                            className="p-1 rounded-md text-slate-400 dark:text-neutral-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            title="Remove notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Quick Links (Matches Account style) */}
        <div
          className={`shrink-0 p-3.5 border-t ${
            isDarkMode ? "border-neutral-800 bg-neutral-950" : "border-slate-100 bg-white"
          } flex items-center justify-between text-xs`}
        >
          <Link
            href="/account?tab=orders"
            onClick={onClose}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Track My Orders</span>
          </Link>
          <Link
            href="/shop"
            onClick={onClose}
            className="font-semibold text-slate-600 dark:text-neutral-400 hover:text-blue-600 flex items-center gap-0.5"
          >
            <span>Store Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
