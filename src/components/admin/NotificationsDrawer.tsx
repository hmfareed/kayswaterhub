"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Bell,
  ShoppingBag,
  CreditCard,
  Radio,
  Truck,
  ShieldAlert,
  AlertTriangle,
  CheckCheck,
  Package,
  Info,
  Loader2,
} from "lucide-react";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AdminNotificationItem {
  _id: string;
  id?: string;
  category: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  entityType?: string;
  entityId?: string;
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

export function NotificationsDrawer({ isOpen, onClose }: NotificationsDrawerProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notifications?limit=15");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch admin notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch("/api/admin/notifications/read-all", { method: "PATCH" });
    } catch (err) {
      console.warn("Failed to mark all read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = async (n: AdminNotificationItem) => {
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
      );
      fetch(`/api/admin/notifications/${n._id}/read`, { method: "PATCH" }).catch(() => {});
    }
    onClose();
    if (n.actionUrl) {
      router.push(n.actionUrl);
    }
  };

  const getIcon = (category: string, priority: string) => {
    const c = category?.toUpperCase() || "";
    if (priority === "CRITICAL") return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    if (c === "ORDERS") return <ShoppingBag className="w-4 h-4 text-blue-600" />;
    if (c === "PAYMENTS") return <CreditCard className="w-4 h-4 text-emerald-600" />;
    if (c === "PRODUCTS") return <Radio className="w-4 h-4 text-amber-600" />;
    if (c === "DELIVERY") return <Truck className="w-4 h-4 text-purple-600" />;
    if (c === "SECURITY") return <ShieldAlert className="w-4 h-4 text-rose-600" />;
    return <Bell className="w-4 h-4 text-blue-600" />;
  };

  const getIconBg = (category: string, priority: string) => {
    const c = category?.toUpperCase() || "";
    if (priority === "CRITICAL") return "bg-rose-100 text-rose-700";
    if (c === "ORDERS") return "bg-blue-50 text-blue-600";
    if (c === "PAYMENTS") return "bg-emerald-50 text-emerald-600";
    if (c === "PRODUCTS") return "bg-amber-50 text-amber-600";
    if (c === "DELIVERY") return "bg-purple-50 text-purple-600";
    if (c === "SECURITY") return "bg-rose-50 text-rose-600";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Real-time operations alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="p-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse p-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-2.5 bg-slate-100 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
                <Bell className="w-5 h-5" />
              </div>
              <p className="font-bold text-xs text-slate-700">No recent alerts</p>
              <p className="text-[11px] text-slate-400">
                You will be notified when orders arrive, payments complete, or stock runs low.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              return (
                <div
                  key={n._id}
                  onClick={() => handleItemClick(n)}
                  className={`block pt-3 first:pt-0 p-2.5 rounded-xl transition-all cursor-pointer ${
                    !n.isRead
                      ? "bg-blue-50/50 hover:bg-blue-50/80 border border-blue-100/60"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${getIconBg(
                        n.category,
                        n.priority
                      )}`}
                    >
                      {getIcon(n.category, n.priority)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs truncate block ${
                            !n.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700"
                          }`}
                        >
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                        {n.actionLabel && (
                          <span className="text-[10px] font-bold text-blue-600 hover:underline">
                            {n.actionLabel} &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
          <Link
            href="/admin/notifications"
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center shadow-xs transition-colors"
          >
            View Full Notifications Center
          </Link>
        </div>
      </div>
    </>
  );
}
