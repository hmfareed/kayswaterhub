"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart,
  Package,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatCurrency } from "@/lib/constants";

export default function ProductsAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProductsAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/analytics/products");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product & Catalog Performance"
        subtitle="Identify best-selling bottled water packs, highest-grossing brands, and product sales volume"
        breadcrumbs={[
          { label: "Analytics" },
          { label: "Products" },
        ]}
        actions={
          <button
            onClick={fetchProductsAnalytics}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-black text-base text-slate-900">Top-Selling Water Packs by Revenue</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                <th className="pb-3">Rank</th>
                <th className="pb-3">Product Name</th>
                <th className="pb-3">Packs Sold</th>
                <th className="pb-3 text-right">Total Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data?.topProducts && data.topProducts.length > 0 ? (
                data.topProducts.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="py-3 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 text-slate-700">{p.quantity} packs</td>
                    <td className="py-3 font-black text-blue-600 text-right">
                      {formatCurrency(p.revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No product performance data available yet.
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
