"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  RefreshCw,
  Eye,
  MapPin,
  Truck,
  CheckCircle2,
  DollarSign,
  Search,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { DataTable, Column } from "@/components/admin/DataTable";
import { formatCurrency } from "@/lib/constants";

export default function DeliveryHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/delivery/history");
      const json = await res.json();
      if (json.success) {
        setHistory(json.data || []);
        setStats(json.stats || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const orderNum = item.orderId?.orderNumber?.toLowerCase() || "";
    const customer = item.orderId?.guestInformation?.name?.toLowerCase() || "";
    const area = item.deliveryAddress?.area?.toLowerCase() || "";
    const city = item.deliveryAddress?.city?.toLowerCase() || "";
    const driver = item.driverName?.toLowerCase() || "";
    return (
      orderNum.includes(q) ||
      customer.includes(q) ||
      area.includes(q) ||
      city.includes(q) ||
      driver.includes(q)
    );
  });

  const columns: Column<any>[] = [
    {
      header: "Order #",
      cell: (item) => (
        <Link
          href={`/admin/orders/${item.orderId?._id}`}
          className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline text-xs"
        >
          {item.orderId?.orderNumber || "ORD-XXXX"}
        </Link>
      ),
    },
    {
      header: "Customer & Phone",
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">
            {item.orderId?.guestInformation?.name || "Valued Customer"}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {item.orderId?.guestInformation?.phone || "N/A"}
          </span>
        </div>
      ),
    },
    {
      header: "Drop-Off Destination",
      cell: (item) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">
            {item.deliveryAddress?.area || item.deliveryAddress?.city || "East Legon"}
          </span>
          <span className="text-[10px] text-slate-400 block">
            {item.deliveryAddress?.streetAddress || item.deliveryAddress?.region}
          </span>
          {item.deliveryAddress?.digitalAddress && (
            <span className="font-mono text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5 inline-block font-bold">
              {item.deliveryAddress.digitalAddress}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Distance",
      cell: (item) => (
        <span className="font-bold text-slate-700 text-xs">
          {item.distanceKm ? `${item.distanceKm} km` : "4.5 km"}
        </span>
      ),
    },
    {
      header: "Fee",
      cell: (item) => (
        <span className="font-black text-slate-900 text-xs">
          {formatCurrency(item.deliveryFee || 20)}
        </span>
      ),
    },
    {
      header: "Assigned Driver",
      cell: (item) => (
        <div>
          <span className="text-slate-800 text-xs font-bold block">
            {item.driverName || "Express Courier"}
          </span>
          <span className="text-[10px] text-slate-400">{item.driverPhone || "+233 24 555 1234"}</span>
        </div>
      ),
    },
    {
      header: "Fulfillment Status",
      cell: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      header: "Completion Date",
      cell: (item) => (
        <span className="text-slate-500 font-medium text-xs">
          {new Date(item.updatedAt || item.createdAt).toLocaleDateString("en-US", {
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
          href={`/admin/orders/${item.orderId?._id}`}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 inline-flex transition-colors"
          title="Open Order Details"
        >
          <Eye className="w-4 h-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Fulfillment History"
        subtitle="Complete historical log of all fulfilled water dispatches, driver assignments, and drop-off timestamps"
        breadcrumbs={[
          { label: "Delivery", href: "/admin/delivery" },
          { label: "History" },
        ]}
        actions={
          <button
            onClick={fetchHistory}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Dispatches Recorded"
          value={stats?.totalDispatches ?? history.length}
          icon={<Truck className="w-4 h-4" />}
          note="all historical shipments"
        />
        <StatCard
          title="Completed Drop-Offs"
          value={stats?.totalDelivered ?? history.filter((h) => h.status === "DELIVERED").length}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          note="successful deliveries"
        />
        <StatCard
          title="Delivery Revenue Collected"
          value={stats?.totalDeliveryFees ?? history.reduce((s, h) => s + (h.deliveryFee || 0), 0)}
          isCurrency
          icon={<DollarSign className="w-4 h-4 text-purple-600" />}
          note="logistics fees recovered"
        />
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order #, Customer, Area, Driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <DataTable
        data={filteredHistory}
        columns={columns}
        isLoading={isLoading}
        emptyTitle="No completed deliveries found"
        emptyDescription="Completed and delivered customer orders will automatically stream here."
      />
    </div>
  );
}
