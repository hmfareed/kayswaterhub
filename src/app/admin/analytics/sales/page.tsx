"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { formatCurrency } from "@/lib/constants";

export default function SalesAnalyticsPage() {
  const [timeframe, setTimeframe] = useState("30days");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/sales?timeframe=${timeframe}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [timeframe]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Revenue Analytics"
        subtitle="Detailed revenue analysis, daily turnover trends, average order metrics, and payment distributions"
        breadcrumbs={[
          { label: "Analytics" },
          { label: "Sales" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last 3 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
            <button
              onClick={fetchSalesData}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Gross Revenue"
          value={data?.totalRevenue ?? 0}
          isCurrency
          icon={<DollarSign className="w-4 h-4" />}
          note="total sales earned"
        />
        <StatCard
          title="Total Orders"
          value={data?.totalOrders ?? 0}
          icon={<ShoppingBag className="w-4 h-4" />}
          note="fulfilled & paid"
        />
        <StatCard
          title="Average Order Value"
          value={data?.averageOrderValue ?? 0}
          isCurrency
          icon={<TrendingUp className="w-4 h-4" />}
          note="spend per transaction"
        />
        <StatCard
          title="Delivery Fees Collected"
          value={data?.totalDeliveryFees ?? 0}
          isCurrency
          icon={<CreditCard className="w-4 h-4" />}
          note="logistics recovery"
        />
      </div>

      {/* Daily Turnover Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-black text-base text-slate-900">Period Revenue Breakdown</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                <th className="pb-3">Date</th>
                <th className="pb-3">Completed Orders</th>
                <th className="pb-3">Avg Order Value</th>
                <th className="pb-3 text-right">Daily Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data?.dailySales && data.dailySales.length > 0 ? (
                data.dailySales.map((d: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-900">{d.date}</td>
                    <td className="py-3 text-slate-700">{d.orders} orders</td>
                    <td className="py-3 text-slate-500">
                      {formatCurrency(d.orders > 0 ? d.revenue / d.orders : 0)}
                    </td>
                    <td className="py-3 font-black text-slate-900 text-right">
                      {formatCurrency(d.revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No sales data recorded for this timeframe.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
