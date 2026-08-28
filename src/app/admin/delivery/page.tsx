"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  MapPin,
  Map,
  Compass,
  Tag,
  History,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCurrency } from "@/lib/constants";

export default function AdminDeliveryOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/delivery");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const store = data?.storeLocation;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery & Logistics Hub"
        subtitle="GPS distance-based delivery fee calculations, zone boundaries, store warehouse origin, and live dispatching"
        breadcrumbs={[{ label: "Delivery" }]}
        actions={
          <button
            onClick={fetchOverview}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Deliveries"
          value={data?.stats?.activeCount ?? 0}
          icon={<Truck className="w-4 h-4 text-purple-600" />}
          note="in transit across Accra"
        />
        <StatCard
          title="Active Delivery Zones"
          value={data?.stats?.zonesCount ?? 0}
          icon={<Map className="w-4 h-4 text-blue-600" />}
          note="Greater Accra coverage"
        />
        <StatCard
          title="Completed Deliveries"
          value={data?.stats?.completedCount ?? 0}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          note="successful drop-offs"
        />
        <StatCard
          title="Base Delivery Fee"
          value={formatCurrency(store?.defaultDeliveryFee || 20)}
          icon={<Tag className="w-4 h-4 text-slate-700" />}
          note={`+ ${formatCurrency(store?.pricePerKm || 2.5)}/km`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Store Location Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h2 className="font-black text-sm text-slate-900">Store Origin & Warehouse Location</h2>
            </div>
            <Link
              href="/admin/delivery/store-location"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Edit GPS Origin</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block text-[11px]">Warehouse Hub Name</span>
              <span className="font-bold text-slate-800 text-sm">{store?.businessName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[11px]">Physical Address</span>
              <span className="font-bold text-slate-800">{store?.address}, {store?.city}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">GPS Coordinates</span>
                <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {store?.coordinates?.lat}, {store?.coordinates?.lng}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Max Radius Cutoff</span>
                <span className="font-bold text-slate-800">{store?.maxDeliveryRadiusKm} km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Engine Sub-modules */}
        <div className="lg:col-span-6 space-y-3">
          <Link
            href="/admin/delivery/zones"
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all flex items-center justify-between group block"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors block">
                  Delivery Zones Configuration
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Define radius and polygon areas with custom pricing
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/admin/delivery/pricing"
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all flex items-center justify-between group block"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors block">
                  Delivery Pricing & Distance Rules
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Base fees, per-km rates, and free delivery thresholds
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/admin/delivery/active"
            className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all flex items-center justify-between group block"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors block">
                  Active Dispatch & Driver Monitoring
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Live dispatch status, assigned drivers, and ETAs (Yango ready)
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
