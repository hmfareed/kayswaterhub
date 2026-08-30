"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  Clock,
  RefreshCw,
  CheckCircle2,
  Map,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";

export default function DeliveryAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeliveryAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/analytics/delivery");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery & Fulfillment Logistics Analytics"
        subtitle="Turnaround times, delivery success rates, and high-demand geographic areas in Accra"
        breadcrumbs={[
          { label: "Analytics" },
          { label: "Delivery" },
        ]}
        actions={
          <button
            onClick={fetchDeliveryAnalytics}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Dispatches"
          value={data?.totalDeliveries ?? 0}
          icon={<Truck className="w-4 h-4" />}
          note="all time dispatches"
        />
        <StatCard
          title="Completion Rate"
          value={`${data?.completionRate ?? 100}%`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          note="successful drops"
        />
        <StatCard
          title="Average Delivery Distance"
          value={`${data?.averageDistanceKm ?? 3.5} km`}
          icon={<MapPin className="w-4 h-4 text-purple-600" />}
          note="from East Legon Hub"
        />
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-black text-base text-slate-900">High-Demand Delivery Areas</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[460px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                <th className="py-3 px-3 first:pl-0 last:pr-0 whitespace-nowrap">Area / Zone</th>
                <th className="py-3 px-3 whitespace-nowrap">Region</th>
                <th className="py-3 px-3 text-right first:pl-0 last:pr-0 whitespace-nowrap">Orders Fulfilled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data?.topAreas && data.topAreas.length > 0 ? (
                data.topAreas.map((a: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 first:pl-0 font-bold text-slate-900 whitespace-nowrap">{a.area || "East Legon"}</td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{a.region || "Greater Accra"}</td>
                    <td className="py-3 px-3 last:pr-0 font-black text-blue-600 text-right whitespace-nowrap">{a.count} deliveries</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    No zone dispatch history recorded.
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
