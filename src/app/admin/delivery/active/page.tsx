"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  RefreshCw,
  MapPin,
  Clock,
  Phone,
  User,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCurrency } from "@/lib/constants";

export default function ActiveDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveDeliveries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/delivery/active");
      const json = await res.json();
      if (json.success) setDeliveries(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDeliveries();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/delivery/active", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) fetchActiveDeliveries();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Deliveries & Dispatch"
        subtitle="Live GPS tracking, assigned courier drivers, transit updates, and drop-off confirmations"
        breadcrumbs={[
          { label: "Delivery", href: "/admin/delivery" },
          { label: "Active Deliveries" },
        ]}
        actions={
          <button
            onClick={fetchActiveDeliveries}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      {deliveries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-900">No active dispatches currently in transit</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Orders marked as &ldquo;Ready for Delivery&rdquo; or &ldquo;Out for Delivery&rdquo; will automatically stream here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deliveries.map((d) => (
            <div
              key={d._id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 relative"
            >
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/admin/orders/${d.orderId?._id}`}
                    className="font-bold text-xs text-blue-600 hover:underline block"
                  >
                    Order #{d.orderId?.orderNumber || "ORD-XXXX"}
                  </Link>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Assigned: {new Date(d.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <StatusBadge status={d.status} size="sm" />
              </div>

              {/* Destination */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>Destination: {d.deliveryAddress?.area || d.deliveryAddress?.city}</span>
                </div>
                <p className="text-slate-800 font-semibold pl-5">
                  {d.deliveryAddress?.streetAddress || d.deliveryAddress?.city}, {d.deliveryAddress?.region}
                </p>
                {d.deliveryAddress?.digitalAddress && (
                  <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-5 inline-block">
                    {d.deliveryAddress.digitalAddress}
                  </span>
                )}
              </div>

              {/* Driver & Customer Contacts */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Assigned Driver</span>
                  <span className="font-bold text-slate-800">{d.driverName || "In-house Courier"}</span>
                  <span className="text-[11px] text-blue-600 block">{d.driverPhone || "+233 24 000 0000"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Customer</span>
                  <span className="font-bold text-slate-800">
                    {d.orderId?.guestInformation?.name || "Customer"}
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    {d.orderId?.guestInformation?.phone || "N/A"}
                  </span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Link
                  href={`/admin/orders/${d.orderId?._id}`}
                  className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Order</span>
                </Link>

                <div className="flex items-center gap-1.5">
                  {d.status !== "IN_TRANSIT" && (
                    <button
                      onClick={() => handleUpdateStatus(d._id, "IN_TRANSIT")}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                    >
                      In Transit
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(d._id, "DELIVERED")}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                  >
                    ✓ Mark Delivered
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
