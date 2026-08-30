"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
  ExternalLink,
} from "lucide-react";

export interface CustomerNotificationItem {
  _id: string;
  id?: string;
  category?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
}

interface CustomerNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: CustomerNotificationItem[];
  unreadCount: number;
  loading: boolean;
  onRefresh: () => void;
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
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

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

  const displayedNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      onRefresh();
    } catch (err) {
      console.warn("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = async (n: CustomerNotificationItem) => {
    if (!n.isRead) {
      fetch(`/api/notifications/${n._id}/read`, { method: "PATCH" }).catch(() => {});
    }
    onClose();
    if (n.actionUrl) {
      router.push(n.actionUrl);
    }
  };

  const getCategoryIcon = (category?: string) => {
    const c = (category || "").toUpperCase();
    if (c === "ORDERS") return <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    if (c === "PAYMENTS") return <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    if (c === "DELIVERY") return <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    if (c === "PROMOTIONS") return <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    if (c === "SECURITY") return <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    return <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  };

  const getCategoryBg = (category?: string) => {
    const c = (category || "").toUpperCase();
    if (c === "ORDERS") return "bg-blue-50 dark:bg-blue-950/60 border-blue-200/50 dark:border-blue-800/50";
    if (c === "PAYMENTS") return "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/50 dark:border-emerald-800/50";
    if (c === "DELIVERY") return "bg-amber-50 dark:bg-amber-950/60 border-amber-200/50 dark:border-amber-800/50";
    if (c === "PROMOTIONS") return "bg-purple-50 dark:bg-purple-950/60 border-purple-200/50 dark:border-purple-800/50";
    if (c === "SECURITY") return "bg-rose-50 dark:bg-rose-950/60 border-rose-200/50 dark:border-rose-800/50";
    return "bg-slate-100 dark:bg-neutral-800 border-slate-200/50 dark:border-neutral-700/50";
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-neutral-950 shadow-2xl border-l border-slate-200/90 dark:border-neutral-800 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-neutral-850 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-neutral-100">
                      Notifications
                    </h2>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Live updates on your water deliveries &amp; offers
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Pills & Mark All Read */}
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-neutral-850 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    filter === "all"
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                      : "text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-850"
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    filter === "unread"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-850"
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {markingAll ? "Marking..." : "Mark all as read"}
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50 dark:bg-black/30">
            {loading && notifications.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 dark:text-neutral-400">Loading notifications...</p>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="py-16 text-center space-y-3 px-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center mx-auto text-slate-400 dark:text-neutral-600">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-200">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-xs mx-auto">
                  When you place an order, get live delivery status, or receive hydration rewards, they&apos;ll appear here!
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleItemClick(notif)}
                  className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    notif.isRead
                      ? "bg-white dark:bg-neutral-900/80 border-slate-200/70 dark:border-neutral-800/80 hover:border-blue-300 dark:hover:border-blue-700/60 shadow-2xs"
                      : "bg-white dark:bg-neutral-900 border-blue-200 dark:border-blue-800/60 shadow-xs hover:border-blue-400"
                  }`}
                >
                  {/* Unread highlight bar */}
                  {!notif.isRead && (
                    <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getCategoryBg(
                        notif.category
                      )}`}
                    >
                      {getCategoryIcon(notif.category)}
                    </div>

                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4
                          className={`text-xs truncate ${
                            notif.isRead
                              ? "font-semibold text-slate-800 dark:text-neutral-200"
                              : "font-bold text-slate-900 dark:text-white"
                          }`}
                        >
                          {notif.title}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed mt-1 line-clamp-2">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-neutral-850 text-[11px]">
                        <span className="text-slate-400 dark:text-neutral-500 font-medium">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                        {notif.actionUrl && (
                          <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:underline">
                            View details <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Quick Links */}
          <div className="p-4 border-t border-slate-100 dark:border-neutral-850 bg-slate-50 dark:bg-neutral-950 flex items-center justify-between text-xs">
            <Link
              href="/account?tab=orders"
              onClick={onClose}
              className="font-semibold text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5"
            >
              <Package className="w-4 h-4 text-slate-400" />
              <span>Track Orders</span>
            </Link>
            <Link
              href="/shop"
              onClick={onClose}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Order Water</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
