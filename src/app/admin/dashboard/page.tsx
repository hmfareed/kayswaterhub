"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  Package,
  Radio,
  Truck,
  ArrowUpRight,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageHeader } from "@/components/admin/PageHeader";
import { StockAdjustmentModal } from "@/components/admin/StockAdjustmentModal";
import { formatCurrency } from "@/lib/constants";
import { getRandomAdminGreeting } from "@/lib/admin/greetings";
import { useSession } from "next-auth/react";

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [greeting, setGreeting] = useState("Welcome, Khadijah");
  const [timeframe, setTimeframe] = useState("7days");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  useEffect(() => {
    const adminName = session?.user?.name || "Khadijah";
    setGreeting(getRandomAdminGreeting(adminName));
  }, [session]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?timeframe=${timeframe}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const handleOpenRestock = (variant: any) => {
    setSelectedVariant({
      _id: variant.id,
      productName: variant.name,
      variantName: variant.variant,
      stockQuantity: variant.stock,
    });
    setIsStockModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ─── Page Header with Timeframe Select ──────────────────────────────── */}
      <PageHeader
        title={greeting}
        subtitle="Live sales metrics, active deliveries, inventory status, and order processing"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="appearance-none bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold py-2 pl-3.5 pr-8 rounded-xl border border-slate-200 shadow-xs focus:outline-hidden cursor-pointer"
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="3months">Last 3 Months</option>
                <option value="12months">Last 12 Months</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={fetchDashboardData}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        }
      />

      {/* ─── Top 4 KPI Stat Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Today's Sales"
          value={data?.stats?.todaySales ?? 0}
          change={data?.stats?.todaySalesChange ?? 0}
          note="vs yesterday"
          icon={<DollarSign className="w-4 h-4" />}
          isCurrency
        />
        <StatCard
          title="Total Orders"
          value={data?.stats?.totalOrders ?? 0}
          change={data?.stats?.totalOrdersChange ?? 0}
          note="this period"
          icon={<ShoppingBag className="w-4 h-4" />}
        />
        <StatCard
          title="Total Customers"
          value={data?.stats?.totalCustomers ?? 0}
          change={data?.stats?.totalCustomersChange ?? 0}
          note="registered"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          title="Product Catalog"
          value={data?.stats?.totalProducts ?? 0}
          icon={<Package className="w-4 h-4" />}
          note={`${data?.stats?.lowStockCount ?? 0} low in stock`}
        />
      </div>

      {/* ─── Center Section: Interactive Revenue Chart & Low Stock Alerts ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sales Overview Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-black text-base text-slate-900">Revenue & Sales Trends</h2>
              <p className="text-xs text-slate-400 font-medium">
                Aggregated earnings for the selected period
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="font-bold text-slate-700">
                  Total: {formatCurrency(data?.salesOverview?.totalRevenue ?? 0)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Avg Order:</span>
                <span className="font-bold text-slate-700">
                  {formatCurrency(data?.salesOverview?.averageOrderValue ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* SVG Line Graph */}
          <div className="w-full h-56 pt-2">
            {data?.salesOverview?.chartData && data.salesOverview.chartData.length > 1 ? (
              <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                <line x1="30" y1="20" x2="590" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="65" x2="590" y2="65" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="110" x2="590" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="155" x2="590" y2="155" stroke="#f1f5f9" strokeWidth="1" />

                {/* Calculate Dynamic Path */}
                {(() => {
                  const chartData = data.salesOverview.chartData;
                  const maxRevenue = Math.max(...chartData.map((d: any) => d.revenue), 100);
                  const xStep = 540 / Math.max(1, chartData.length - 1);

                  const points = chartData.map((d: any, idx: number) => {
                    const x = 30 + idx * xStep;
                    const y = 160 - (d.revenue / maxRevenue) * 135;
                    return { x, y, ...d };
                  });

                  const pathD = points.reduce((acc: string, pt: any, idx: number) => {
                    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                  }, "");

                  const areaD = `${pathD} L ${points[points.length - 1].x} 175 L ${points[0].x} 175 Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#chartGradient)" />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {points.map((pt: any, idx: number) => (
                        <circle
                          key={idx}
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill="#ffffff"
                          stroke="#2563eb"
                          strokeWidth="2.5"
                          className="hover:r-6 transition-all cursor-pointer"
                        >
                          <title>{`${pt.date}: GH₵${pt.revenue} (${pt.orders} orders)`}</title>
                        </circle>
                      ))}

                      {/* X Axis Labels */}
                      {points.map((pt: any, idx: number) => {
                        if (idx % Math.ceil(points.length / 7) === 0 || idx === points.length - 1) {
                          return (
                            <text
                              key={`t-${idx}`}
                              x={pt.x}
                              y="190"
                              textAnchor="middle"
                              fill="#94a3b8"
                              fontSize="9"
                              fontWeight="600"
                            >
                              {pt.date}
                            </text>
                          );
                        }
                        return null;
                      })}
                    </>
                  );
                })()}
              </svg>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                No revenue trends to display for this timeframe
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Warning Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="font-black text-sm text-slate-900">Low Stock Alerts</h2>
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
              data.lowStockProducts.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-slate-900 truncate leading-tight">
                      {item.name}
                    </h3>
                    <span className="text-[11px] font-semibold text-rose-500 block">
                      {item.stock} left (Threshold: {item.threshold})
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenRestock(item)}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    + Restock
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                All water inventory items are well-stocked!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Recent Orders Table & Recent Operations Activity ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Orders */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-black text-base text-slate-900">Recent Customer Orders</h2>
              <p className="text-xs text-slate-400 font-medium">
                Live order queue ready for packaging and dispatch
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="py-3 px-3.5 first:pl-4 last:pr-4 whitespace-nowrap">Order #</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Customer</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Total</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Date</th>
                  <th className="py-3 px-3.5 text-right first:pl-4 last:pr-4 whitespace-nowrap">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentOrders && data.recentOrders.length > 0 ? (
                  data.recentOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3.5 first:pl-4 font-bold text-blue-600 whitespace-nowrap">
                        <Link href={`/admin/orders/${ord.id}`} className="hover:underline">
                          {ord.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-3.5 min-w-[140px]">
                        <span className="font-bold text-slate-900 block truncate">{ord.customer}</span>
                        <span className="text-[10px] text-slate-400 block">{ord.phone}</span>
                      </td>
                      <td className="py-3.5 px-3.5 font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(ord.amount)}
                      </td>
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <StatusBadge status={ord.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-3.5 text-slate-500 font-medium whitespace-nowrap">{ord.date}</td>
                      <td className="py-3.5 px-3.5 last:pr-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 inline-flex transition-colors"
                          title="View Order Details"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No recent orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Operations Activity Log */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-black text-sm text-slate-900">Operations Activity</h2>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Logs
            </Link>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1 space-y-2">
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.map((act: any) => (
                <div key={act.id} className="pt-2 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {act.action}
                    </span>
                    <span className="text-[10px] text-slate-400">{act.date}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-tight">
                    {act.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                No recent activity recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        variant={selectedVariant}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
}
