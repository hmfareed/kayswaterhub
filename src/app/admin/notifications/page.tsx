"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  ShoppingBag,
  CreditCard,
  Radio,
  Truck,
  ShieldAlert,
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  Trash2,
  Archive,
  Search,
  Plus,
  Send,
  X,
  ExternalLink,
  RefreshCw,
  Eye,
  Filter,
  Layers,
  Sparkles,
  ArrowRight,
  Flame,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";

interface AdminNotification {
  _id: string;
  recipientRole: "CUSTOMER" | "ADMIN" | "ALL";
  event: string;
  category: "ORDERS" | "PAYMENTS" | "DELIVERY" | "PRODUCTS" | "CUSTOMERS" | "SECURITY" | "PROMOTIONS" | "SYSTEM";
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  body?: string;
  entityType?: "ORDER" | "PAYMENT" | "PRODUCT" | "DELIVERY" | "USER" | "PROMOTION" | "SYSTEM";
  entityId?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  isArchived: boolean;
  archivedAt?: string;
  createdAt: string;
}

interface StatsData {
  total: number;
  unread: number;
  critical: number;
  todayTotal: number;
  categories: {
    orders: number;
    payments: number;
    products: number;
    delivery: number;
    security: number;
    system: number;
  };
}

function formatDateTime(dateInput?: string | Date): string {
  if (!dateInput) return "Recently";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

export default function NotificationsCenterPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Selection & Details
  const [selectedNotif, setSelectedNotif] = useState<AdminNotification | null>(null);

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    targetRole: "ALL",
    category: "PROMOTIONS",
    priority: "NORMAL",
    actionUrl: "",
    actionLabel: "View Details",
  });
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // ── Fetch Notifications & Stats ───────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/notifications/stats");
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch stats:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab === "unread") {
        params.set("status", "unread");
      } else if (activeTab === "archived") {
        params.set("status", "archived");
      } else if (activeTab !== "all") {
        params.set("category", activeTab);
      }

      if (priorityFilter !== "all") {
        params.set("priority", priorityFilter);
      }

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      params.set("limit", "50");

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab, priorityFilter, searchQuery]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    if (selectedNotif?._id === id) {
      setSelectedNotif((prev) => (prev ? { ...prev, isRead: true } : null));
    }
    await fetch(`/api/admin/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
    fetchStats();
  };

  const handleMarkAsUnread = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: false } : n))
    );
    if (selectedNotif?._id === id) {
      setSelectedNotif((prev) => (prev ? { ...prev, isRead: false } : null));
    }
    await fetch(`/api/admin/notifications/${id}/unread`, { method: "PATCH" }).catch(() => {});
    fetchStats();
  };

  const handleToggleArchive = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (selectedNotif?._id === id) setSelectedNotif(null);
    await fetch(`/api/admin/notifications/${id}/archive`, { method: "PATCH" }).catch(() => {});
    fetchStats();
  };

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (selectedNotif?._id === id) setSelectedNotif(null);
    await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" }).catch(() => {});
    fetchStats();
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/admin/notifications/read-all", { method: "PATCH" }).catch(() => {});
    fetchStats();
  };

  const handleClearRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    await fetch("/api/admin/notifications?scope=read", { method: "DELETE" }).catch(() => {});
    fetchStats();
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) return;

    try {
      setBroadcasting(true);
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastForm),
      });
      const json = await res.json();
      if (json.success) {
        setBroadcastSuccess(true);
        setTimeout(() => {
          setBroadcastSuccess(false);
          setShowBroadcastModal(false);
          setBroadcastForm({
            title: "",
            message: "",
            targetRole: "ALL",
            category: "PROMOTIONS",
            priority: "NORMAL",
            actionUrl: "",
            actionLabel: "View Details",
          });
        }, 1200);
        fetchNotifications();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to broadcast:", err);
    } finally {
      setBroadcasting(false);
    }
  };

  // ── Icon & Color Helpers ──────────────────────────────────────────────────
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ORDERS":
        return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case "PAYMENTS":
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case "PRODUCTS":
        return <Radio className="w-4 h-4 text-amber-600" />;
      case "DELIVERY":
        return <Truck className="w-4 h-4 text-purple-600" />;
      case "SECURITY":
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "ORDERS":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "PAYMENTS":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "PRODUCTS":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "DELIVERY":
        return "bg-purple-50 text-purple-700 border-purple-200/80";
      case "SECURITY":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
            <Flame className="w-3 h-3 text-rose-600 animate-pulse" />
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            HIGH
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            INFO
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Notifications & Operations Alert Center"
        subtitle="Live event-driven operations feed for orders, stock thresholds, payments, dispatch, and system broadcasts"
        breadcrumbs={[{ label: "Notifications" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Announcement</span>
            </button>
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Mark all read
            </button>
            <button
              onClick={handleClearRead}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Clear read
            </button>
          </div>
        }
      />

      {/* ── Stats Summary Bar ────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Alerts</p>
              <p className="text-xl font-black text-slate-900 leading-tight">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unread Alerts</p>
              <p className="text-xl font-black text-amber-600 leading-tight">{stats.unread}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Critical Alerts</p>
              <p className="text-xl font-black text-rose-600 leading-tight">{stats.critical}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Events Today</p>
              <p className="text-xl font-black text-emerald-600 leading-tight">{stats.todayTotal}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order #, product, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High & Above</option>
            <option value="normal">Normal</option>
            <option value="low">Info</option>
          </select>
        </div>
      </div>

      {/* ── Filter Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: "All Alerts", value: "all" },
          { label: "Unread", value: "unread" },
          { label: "Orders", value: "orders" },
          { label: "Payments", value: "payments" },
          { label: "Stock Warnings", value: "products" },
          { label: "Delivery", value: "delivery" },
          { label: "Security & System", value: "security" },
          { label: "Archived", value: "archived" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.value
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Notifications Feed ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
            <p className="font-bold text-xs text-slate-600">Loading operational alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="font-bold text-sm text-slate-800">No notifications found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are currently no alerts matching your selected criteria. Notifications will appear here in real-time as customer orders and inventory transactions occur.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            return (
              <div
                key={n._id}
                onClick={() => setSelectedNotif(n)}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all cursor-pointer ${
                  !n.isRead
                    ? "bg-blue-50/40 hover:bg-blue-50/70 border-l-4 border-l-blue-600"
                    : "hover:bg-slate-50 border-l-4 border-l-transparent"
                }`}
              >
                {/* Left: Icon & Content */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border shadow-2xs ${getCategoryBadgeClass(
                      n.category
                    )}`}
                  >
                    {getCategoryIcon(n.category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4
                        className={`text-xs truncate ${
                          !n.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700"
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 shadow-xs" />
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getCategoryBadgeClass(
                          n.category
                        )}`}
                      >
                        {n.category}
                      </span>
                      {getPriorityBadge(n.priority)}
                    </div>
                    <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
                      {n.message || n.body}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {formatDateTime(n.createdAt)}
                      </span>
                      {n.entityId && (
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          #{n.entityId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div
                  className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {n.actionUrl && (
                    <Link
                      href={n.actionUrl}
                      onClick={() => handleMarkAsRead(n._id)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                    >
                      <span>{n.actionLabel || "View"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}

                  {!n.isRead ? (
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkAsUnread(n._id)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Mark as unread"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleArchive(n._id)}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                    title={n.isArchived ? "Unarchive" : "Archive"}
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(n._id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Contextual Notification Detail Drawer / Modal ────────────────────── */}
      {selectedNotif && (
        <>
          <div
            onClick={() => setSelectedNotif(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${getCategoryBadgeClass(
                    selectedNotif.category
                  )}`}
                >
                  {getCategoryIcon(selectedNotif.category)}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    Notification Details
                  </h3>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {formatDateTime(selectedNotif.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getCategoryBadgeClass(
                      selectedNotif.category
                    )}`}
                  >
                    {selectedNotif.category}
                  </span>
                  {getPriorityBadge(selectedNotif.priority)}
                </div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {selectedNotif.title}
                </h2>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 font-medium leading-relaxed">
                {selectedNotif.message || selectedNotif.body}
              </div>

              {/* Entity metadata */}
              {selectedNotif.entityId && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Associated Entity
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">
                        {selectedNotif.entityType || "RECORD"}:
                      </span>{" "}
                      <span className="font-mono text-blue-600 font-bold">
                        #{selectedNotif.entityId}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery info */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Event Status
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="block text-slate-400 font-medium">Read Status</span>
                    <span className="font-bold text-slate-800">
                      {selectedNotif.isRead ? "Read" : "Unread"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="block text-slate-400 font-medium">Audience</span>
                    <span className="font-bold text-slate-800">
                      {selectedNotif.recipientRole}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center gap-2">
              {selectedNotif.actionUrl ? (
                <Link
                  href={selectedNotif.actionUrl}
                  onClick={() => {
                    handleMarkAsRead(selectedNotif._id);
                    setSelectedNotif(null);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>{selectedNotif.actionLabel || "View Details"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  onClick={() => handleMarkAsRead(selectedNotif._id)}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Mark as Read
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Broadcast Announcement Modal ─────────────────────────────────────── */}
      {showBroadcastModal && (
        <>
          <div
            onClick={() => !broadcasting && setShowBroadcastModal(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                      Broadcast Announcement
                    </h3>
                    <p className="text-xs text-slate-400">
                      Send a real-time notification to customers or operations staff
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {broadcastSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Announcement Broadcasted!</h4>
                  <p className="text-xs text-slate-500">
                    The notification has been sent and will appear in user notification feeds immediately.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendBroadcast} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Audience Target
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "All Customers", value: "CUSTOMER" },
                        { label: "All Staff/Admin", value: "ADMIN" },
                        { label: "Everyone", value: "ALL" },
                      ].map((aud) => (
                        <button
                          key={aud.value}
                          type="button"
                          onClick={() =>
                            setBroadcastForm((f) => ({ ...f, targetRole: aud.value }))
                          }
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                            broadcastForm.targetRole === aud.value
                              ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {aud.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Category &amp; Priority
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={broadcastForm.category}
                        onChange={(e) =>
                          setBroadcastForm((f) => ({ ...f, category: e.target.value }))
                        }
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      >
                        <option value="PROMOTIONS">Promotion / Sale</option>
                        <option value="SYSTEM">System Announcement</option>
                        <option value="ORDERS">Operations Update</option>
                      </select>

                      <select
                        value={broadcastForm.priority}
                        onChange={(e) =>
                          setBroadcastForm((f) => ({ ...f, priority: e.target.value }))
                        }
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      >
                        <option value="NORMAL">Normal Priority</option>
                        <option value="HIGH">High Priority</option>
                        <option value="CRITICAL">Critical Alert</option>
                        <option value="LOW">Low (Info)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Notification Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 🎉 Weekend Water Hydration Special"
                      value={broadcastForm.title}
                      onChange={(e) =>
                        setBroadcastForm((f) => ({ ...f, title: e.target.value }))
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Message Content *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Write the notification message here..."
                      value={broadcastForm.message}
                      onChange={(e) =>
                        setBroadcastForm((f) => ({ ...f, message: e.target.value }))
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Action URL (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /"
                        value={broadcastForm.actionUrl}
                        onChange={(e) =>
                          setBroadcastForm((f) => ({ ...f, actionUrl: e.target.value }))
                        }
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Shop Now"
                        value={broadcastForm.actionLabel}
                        onChange={(e) =>
                          setBroadcastForm((f) => ({ ...f, actionLabel: e.target.value }))
                        }
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBroadcastModal(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={broadcasting}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {broadcasting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Broadcast</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
