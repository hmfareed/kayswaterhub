"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RotateCcw,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";
import { formatCurrency } from "@/lib/constants";

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRefunds = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/refunds");
      const json = await res.json();
      if (json.success) setRefunds(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleApproveRefund = async (orderId: string, amount: number) => {
    const reason = prompt("Enter approval note / reason:", "Admin approved customer refund");
    if (!reason) return;

    try {
      const res = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount, reason }),
      });
      const json = await res.json();
      if (json.success) fetchRefunds();
      else alert(json.error || "Failed to process refund");
    } catch (e) {
      console.error(e);
    }
  };

  const columns: Column<any>[] = [
    {
      header: "Order Number",
      cell: (item) => (
        <Link
          href={`/admin/orders/${item._id}`}
          className="font-bold text-blue-600 hover:underline text-xs"
        >
          {item.orderNumber}
        </Link>
      ),
    },
    {
      header: "Customer",
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {item.guestInformation?.name || item.customerId?.name || "Customer"}
          </span>
          <span className="text-[11px] text-slate-400">
            {item.guestInformation?.phone || item.customerId?.phone || ""}
          </span>
        </div>
      ),
    },
    {
      header: "Order Total",
      cell: (item) => <span className="font-bold text-slate-800">{formatCurrency(item.total)}</span>,
    },
    {
      header: "Refund Amount",
      cell: (item) => (
        <span className="font-black text-rose-600">
          {formatCurrency(item.refund?.amount || item.total)}
        </span>
      ),
    },
    {
      header: "Refund Status",
      cell: (item) => (
        <StatusBadge
          status={item.refund?.status === "COMPLETED" ? "REFUNDED" : "REFUND_PENDING"}
          size="sm"
        />
      ),
    },
    {
      header: "Reason / Note",
      cell: (item) => (
        <span className="text-slate-600 text-xs font-medium">
          {item.refund?.reason || "Customer requested cancellation & refund"}
        </span>
      ),
    },
    {
      header: "Action",
      align: "right",
      cell: (item) => {
        if (item.status === "REFUND_PENDING") {
          return (
            <button
              onClick={() => handleApproveRefund(item._id, item.refund?.amount || item.total)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Approve Refund
            </button>
          );
        }
        return (
          <Link
            href={`/admin/orders/${item._id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
          >
            <Eye className="w-4 h-4 inline" />
          </Link>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refunds & Returns Management"
        subtitle="Review cancellation refund requests, verify return eligibility, and process Paystack reimbursements"
        breadcrumbs={[{ label: "Refunds" }]}
        actions={
          <button
            onClick={fetchRefunds}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      <DataTable
        data={refunds}
        columns={columns}
        isLoading={isLoading}
        emptyTitle="No refund requests found"
        emptyDescription="All customer orders are fulfilled without pending refund requests."
      />
    </div>
  );
}
