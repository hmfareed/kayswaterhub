"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Filter,
  ArrowUpRight,
  Download,
  RefreshCw,
  Calendar,
  Eye,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";
import { formatCurrency } from "@/lib/constants";

const ORDER_STATUS_OPTIONS = [
  { value: "PENDING_PAYMENT", label: "Pending Payment" },
  { value: "PAID", label: "Paid (Confirmed)" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing & Packing" },
  { value: "READY_FOR_DELIVERY", label: "Ready for Delivery" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered (Completed)" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/orders?${query}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
        setTotal(json.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleInlineStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        // Update local state instantly
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
        setSuccessMsg(`Order status updated to ${newStatus.replace(/_/g, " ")}`);
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(json.error || "Failed to update status");
      }
    } catch (e: any) {
      alert(e.message || "Status update error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const tabs = [
    { label: "All Orders", value: "all" },
    { label: "Pending Payment", value: "pending_payment" },
    { label: "Paid / Confirmed", value: "paid" },
    { label: "Processing", value: "processing" },
    { label: "Ready for Dispatch", value: "ready_for_delivery" },
    { label: "Out for Delivery", value: "out_for_delivery" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Refunded", value: "refunded" },
  ];

  const columns: Column<any>[] = [
    {
      header: "Order ID",
      accessorKey: "orderNumber",
      cell: (item) => (
        <Link
          href={`/admin/orders/${item._id}`}
          className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
        >
          {item.orderNumber}
        </Link>
      ),
    },
    {
      header: "Customer",
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-900 block">
            {item.guestInformation?.name || item.customerId?.name || "Customer"}
          </span>
          <span className="text-[11px] text-slate-400">
            {item.guestInformation?.phone || item.customerId?.phone || "N/A"}
          </span>
        </div>
      ),
    },
    {
      header: "Items",
      cell: (item) => {
        const count = item.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;
        const firstItem = item.items?.[0]?.productName || "Water packs";
        return (
          <span className="text-slate-700 font-medium">
            {count} packs <span className="text-slate-400 text-[11px]">({firstItem})</span>
          </span>
        );
      },
    },
    {
      header: "Location",
      cell: (item) => (
        <div>
          <span className="font-semibold text-slate-800 block">
            {item.deliveryAddress?.area || item.deliveryAddress?.city || "Accra"}
          </span>
          <span className="text-[10px] text-slate-400">{item.deliveryAddress?.region}</span>
        </div>
      ),
    },
    {
      header: "Total",
      cell: (item) => (
        <span className="font-black text-slate-900">{formatCurrency(item.total)}</span>
      ),
    },
    {
      header: "Status",
      cell: (item) => {
        const isUpdating = updatingOrderId === item._id;
        const norm = item.status?.toUpperCase() || "";

        let colorStyles = "bg-slate-100 text-slate-700 border-slate-300";
        if (norm === "DELIVERED" || norm === "CONFIRMED" || norm === "PAID") {
          colorStyles = "bg-emerald-50 text-emerald-700 border-emerald-300/80 hover:bg-emerald-100/60";
        } else if (norm === "PROCESSING" || norm === "READY_FOR_DELIVERY") {
          colorStyles = "bg-blue-50 text-blue-700 border-blue-300/80 hover:bg-blue-100/60";
        } else if (norm === "OUT_FOR_DELIVERY" || norm === "IN_TRANSIT") {
          colorStyles = "bg-purple-50 text-purple-700 border-purple-300/80 hover:bg-purple-100/60";
        } else if (norm === "PENDING_PAYMENT" || norm === "PENDING") {
          colorStyles = "bg-amber-50 text-amber-700 border-amber-300/80 hover:bg-amber-100/60";
        } else if (norm === "CANCELLED" || norm === "FAILED_DELIVERY" || norm === "FAILED") {
          colorStyles = "bg-rose-50 text-rose-700 border-rose-300/80 hover:bg-rose-100/60";
        } else if (norm === "REFUNDED" || norm === "REFUND_PENDING") {
          colorStyles = "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200/60";
        }

        return (
          <div className="relative inline-flex items-center">
            {isUpdating ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 border border-slate-200">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="relative inline-block">
                <select
                  value={item.status}
                  onChange={(e) => handleInlineStatusChange(item._id, e.target.value)}
                  className={`appearance-none font-bold text-xs rounded-full pl-3 pr-6 py-1 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all border shadow-2xs ${colorStyles}`}
                >
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-slate-900 font-medium">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 opacity-60 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Date",
      cell: (item) => (
        <span className="text-slate-500 font-medium">
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      header: "Action",
      align: "right",
      cell: (item) => (
        <Link
          href={`/admin/orders/${item._id}`}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 inline-flex transition-colors"
          title="Open Order Workspace"
        >
          <Eye className="w-4 h-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders Management"
        subtitle="Live dispatch queue, fulfillment tracking, customer details, and 1-click status controls"
        breadcrumbs={[{ label: "Orders" }]}
      />

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2 font-bold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs / Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/80 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === tab.value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Table Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order #, Customer, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </form>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={fetchOrders}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={orders}
        columns={columns}
        isLoading={isLoading}
        emptyTitle="No customer orders found"
        emptyDescription="Orders placed by customers in the store will appear here."
      />
    </div>
  );
}
