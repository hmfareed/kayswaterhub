"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  RefreshCw,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";
import { formatCurrency } from "@/lib/constants";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status,
        search,
      });
      const res = await fetch(`/api/admin/payments?${query}`);
      const json = await res.json();
      if (json.success) {
        setPayments(json.data);
        setStats(json.stats);
        setTotal(json.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, status]);

  const columns: Column<any>[] = [
    {
      header: "Reference",
      cell: (item) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-xs block">
            {item.reference}
          </span>
          <span className="text-[10px] text-slate-400">{item.provider}</span>
        </div>
      ),
    },
    {
      header: "Order ID",
      cell: (item) => (
        <Link
          href={`/admin/orders/${item.orderId?._id}`}
          className="font-bold text-blue-600 hover:underline text-xs"
        >
          {item.orderId?.orderNumber || "View Order"}
        </Link>
      ),
    },
    {
      header: "Customer",
      cell: (item) => (
        <span className="text-slate-800 font-semibold text-xs">
          {item.orderId?.guestInformation?.name || "Customer"}
        </span>
      ),
    },
    {
      header: "Amount",
      cell: (item) => (
        <span className="font-black text-slate-900">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      header: "Channel",
      cell: (item) => (
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {item.method?.replace(/_/g, " ") || "MOBILE MONEY"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      header: "Date",
      cell: (item) => (
        <span className="text-slate-500 font-medium text-xs">
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paystack Payments & Transactions"
        subtitle="Live payment verification, mobile money transaction records, and settlement tracking"
        breadcrumbs={[{ label: "Payments" }]}
        actions={
          <button
            onClick={fetchPayments}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Successful Payments"
          value={stats?.successfulTotal ?? 0}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          isCurrency
          note="verified earnings"
        />
        <StatCard
          title="Pending Payments"
          value={stats?.pendingTotal ?? 0}
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          isCurrency
          note="awaiting customer completion"
        />
        <StatCard
          title="Failed Transactions"
          value={stats?.failedTotal ?? 0}
          icon={<XCircle className="w-4 h-4 text-rose-500" />}
          isCurrency
          note="declined or timed out"
        />
        <StatCard
          title="Total Refunded"
          value={stats?.refundedTotal ?? 0}
          icon={<RotateCcw className="w-4 h-4 text-slate-600" />}
          isCurrency
          note="customer returns processed"
        />
      </div>

      <DataTable
        data={payments}
        columns={columns}
        total={total}
        page={page}
        limit={15}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payment reference..."
        isLoading={isLoading}
        emptyTitle="No payment transactions found"
        emptyDescription="Transactions will appear here as customers make payments via Paystack."
        actions={
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="success">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        }
      />
    </div>
  );
}
