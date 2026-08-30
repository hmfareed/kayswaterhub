"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCheck,
  Users,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { formatCurrency } from "@/lib/constants";

export default function CustomersAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomerAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/analytics/customers");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Insights & Cohorts"
        subtitle="Customer lifetime values, top repeat buyers, and acquisition metrics"
        breadcrumbs={[
          { label: "Analytics" },
          { label: "Customers" },
        ]}
        actions={
          <button
            onClick={fetchCustomerAnalytics}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Registered Customers"
          value={data?.totalRegistered ?? 0}
          icon={<Users className="w-4 h-4" />}
          note="accounts created"
        />
        <StatCard
          title="Total Active Buyers"
          value={data?.totalWithOrders ?? 0}
          icon={<UserCheck className="w-4 h-4 text-emerald-600" />}
          note="placed at least 1 order"
        />
        <StatCard
          title="Repeat Buyer Rate"
          value={`${data?.repeatCustomerRate ?? 0}%`}
          icon={<ShoppingBag className="w-4 h-4 text-blue-600" />}
          note="multi-order customers"
        />
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-black text-base text-slate-900">VIP Top Spenders</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                <th className="py-3 px-3 first:pl-0 last:pr-0 whitespace-nowrap">Customer Name</th>
                <th className="py-3 px-3 whitespace-nowrap">Phone</th>
                <th className="py-3 px-3 whitespace-nowrap">Orders</th>
                <th className="py-3 px-3 text-right first:pl-0 last:pr-0 whitespace-nowrap">Lifetime Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data?.topCustomers && data.topCustomers.length > 0 ? (
                data.topCustomers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 first:pl-0 font-bold text-slate-900 whitespace-nowrap">{c.name}</td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{c.phone}</td>
                    <td className="py-3 px-3 text-slate-700 font-bold whitespace-nowrap">{c.ordersCount} orders</td>
                    <td className="py-3 px-3 last:pr-0 font-black text-blue-600 text-right whitespace-nowrap">
                      {formatCurrency(c.totalSpent)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No customer spend records found.
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
