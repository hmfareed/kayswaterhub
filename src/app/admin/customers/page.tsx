"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Eye,
  RefreshCw,
  ShoppingBag,
  DollarSign,
  Phone,
  Mail,
  UserCheck,
  UserX,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, Column } from "@/components/admin/DataTable";
import { formatCurrency } from "@/lib/constants";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        search,
        status,
      });
      const res = await fetch(`/api/admin/customers?${query}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
        setTotal(json.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, status]);

  const handleToggleActive = async (id: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? "disable" : "restore";
    if (!confirm(`Are you sure you want to ${action} account for "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const json = await res.json();
      if (json.success) fetchCustomers();
    } catch (e) {
      console.error(e);
    }
  };

  const columns: Column<any>[] = [
    {
      header: "Customer",
      cell: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
            {item.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <Link
              href={`/admin/customers/${item._id}`}
              className="font-bold text-slate-900 hover:text-blue-600 block text-xs"
            >
              {item.name}
            </Link>
            <span className="text-[11px] text-slate-400 font-medium">
              {item.email || "No email"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Phone",
      cell: (item) => (
        <span className="font-semibold text-slate-700 text-xs">{item.phone || "N/A"}</span>
      ),
    },
    {
      header: "Orders Placed",
      cell: (item) => (
        <span className="font-bold text-slate-800 text-xs">{item.ordersCount} orders</span>
      ),
    },
    {
      header: "Total Spend",
      cell: (item) => (
        <span className="font-black text-slate-900">{formatCurrency(item.totalSpent)}</span>
      ),
    },
    {
      header: "Account Status",
      cell: (item) => (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            item.isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {item.isActive ? "Active" : "Disabled"}
        </span>
      ),
    },
    {
      header: "Joined Date",
      cell: (item) => (
        <span className="text-slate-400 text-xs">
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/admin/customers/${item._id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="View Profile"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => handleToggleActive(item._id, item.isActive, item.name)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              item.isActive
                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
            title={item.isActive ? "Disable Account" : "Restore Account"}
          >
            {item.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        subtitle="Manage customer profiles, saved delivery addresses, order histories, and account statuses"
        breadcrumbs={[{ label: "Customers" }]}
        actions={
          <button
            onClick={fetchCustomers}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      <DataTable
        data={customers}
        columns={columns}
        total={total}
        page={page}
        limit={15}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer by name, email or phone..."
        isLoading={isLoading}
        emptyTitle="No customers found"
        emptyDescription="Customer accounts will appear here as orders are placed and accounts are registered."
        actions={
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Accounts</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        }
      />
    </div>
  );
}
