"use client";

import React, { useState, useEffect } from "react";
import {
  Radio,
  RefreshCw,
  Plus,
  ArrowUpRight,
  AlertTriangle,
  Package,
  History,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";
import { StockAdjustmentModal } from "@/components/admin/StockAdjustmentModal";
import { formatCurrency } from "@/lib/constants";

export default function AdminInventoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/inventory?${query}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setStats(json.stats);
        setTotal(json.pagination.total);
        setTransactions(json.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, statusFilter]);

  const handleAdjustClick = (item: any) => {
    setSelectedVariant({
      _id: item._id,
      productName: item.productName,
      variantName: item.variantName,
      stockQuantity: item.stockQuantity,
    });
    setIsModalOpen(true);
  };

  const columns: Column<any>[] = [
    {
      header: "Product & Variant",
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{item.productName}</span>
          <span className="text-[11px] text-blue-600 font-semibold">{item.variantName}</span>
        </div>
      ),
    },
    {
      header: "SKU",
      cell: (item) => (
        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
          {item.sku}
        </span>
      ),
    },
    {
      header: "Unit Price",
      cell: (item) => <span className="font-bold text-slate-900">{formatCurrency(item.price)}</span>,
    },
    {
      header: "Warehouse Units",
      cell: (item) => {
        const isLow = item.availableQuantity <= item.lowStockThreshold;
        const isOut = item.availableQuantity <= 0;
        return (
          <div>
            <span
              className={`font-black text-sm block ${
                isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-900"
              }`}
            >
              {item.stockQuantity} packs
            </span>
            <span className="text-[10px] text-slate-400">
              Threshold: {item.lowStockThreshold}
            </span>
          </div>
        );
      },
    },
    {
      header: "Status",
      cell: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      header: "Action",
      align: "right",
      cell: (item) => (
        <button
          onClick={() => handleAdjustClick(item)}
          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Adjust Stock
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Engine"
        subtitle="Automatic stock tracking, manual adjustments with reasons, and stock transaction logs"
        breadcrumbs={[{ label: "Inventory" }]}
        actions={
          <button
            onClick={fetchInventory}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Products"
          value={stats?.totalProducts ?? 0}
          icon={<Package className="w-4 h-4" />}
          note="in active catalog"
        />
        <StatCard
          title="Total Units in Stock"
          value={stats?.totalUnits ?? 0}
          icon={<Radio className="w-4 h-4" />}
          note="across all packs"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockCount ?? 0}
          icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          note="at or below threshold"
        />
        <StatCard
          title="Out of Stock"
          value={stats?.outOfStockCount ?? 0}
          icon={<XCircle className="w-4 h-4 text-rose-500" />}
          note="needs urgent restock"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {[
          { label: "All Products", value: "all" },
          { label: "In Stock", value: "in_stock" },
          { label: "Low Stock (Alerts)", value: "low_stock" },
          { label: "Out of Stock", value: "out_of_stock" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === tab.value
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Stock Table */}
        <div className="lg:col-span-8">
          <DataTable
            data={data}
            columns={columns}
            total={total}
            page={page}
            limit={15}
            onPageChange={setPage}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search water pack variant or SKU..."
            isLoading={isLoading}
            emptyTitle="No inventory items found"
            emptyDescription="Try adjusting your status filter or search keywords."
          />
        </div>

        {/* Transactions History Stream */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="font-black text-sm text-slate-900">Recent Stock Activity</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Audit Trail</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1 space-y-2">
            {transactions && transactions.length > 0 ? (
              transactions.map((tx: any) => (
                <div key={tx._id} className="pt-2.5 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        tx.quantityChange > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {tx.type}: {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {tx.productId?.name || "Water Pack"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">{tx.reason}</p>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    Stock transition: {tx.previousStock} → {tx.newStock}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No inventory transactions logged yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        variant={selectedVariant}
        onSuccess={() => {
          fetchInventory();
        }}
      />
    </div>
  );
}
