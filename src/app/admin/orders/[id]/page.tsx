"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Compass,
  CreditCard,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Printer,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCurrency } from "@/lib/constants";

export default function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [error, setError] = useState("");

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
      } else {
        setError(json.error || "Order not found");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
        setStatusNote("");
      } else {
        alert(json.error || "Failed to update order status");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">Loading order workspace...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">{error || "Order not found"}</h2>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </Link>
      </div>
    );
  }

  const customerName =
    order.guestInformation?.name || order.customerId?.name || "Customer";
  const customerPhone =
    order.guestInformation?.phone || order.customerId?.phone || "N/A";
  const customerEmail =
    order.guestInformation?.email || order.customerId?.email || "N/A";

  const mapLink =
    order.deliveryAddress?.coordinates?.lat && order.deliveryAddress?.coordinates?.lng
      ? `https://www.google.com/maps?q=${order.deliveryAddress.coordinates.lat},${order.deliveryAddress.coordinates.lng}`
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`Order #${order.orderNumber}`}
        subtitle={`Placed on ${new Date(order.createdAt).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })}`}
        breadcrumbs={[
          { label: "Orders", href: "/admin/orders" },
          { label: order.orderNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <StatusBadge status={order.status} />
          </div>
        }
      />

      {/* ─── Status Workflow Action Bar ──────────────────────────────────────── */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-black text-slate-900 block">
              Order Workflow Status Transition
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Update status to trigger automatic inventory & dispatch notifications
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Status change note..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:bg-white w-48 sm:w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {order.status === "PENDING_PAYMENT" && (
            <button
              onClick={() => handleUpdateStatus("PAID")}
              disabled={isUpdating}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              ✓ Mark Paid (Payment Received)
            </button>
          )}

          {(order.status === "PAID" || order.status === "CONFIRMED") && (
            <button
              onClick={() => handleUpdateStatus("PROCESSING")}
              disabled={isUpdating}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              📦 Start Packaging Order
            </button>
          )}

          {order.status === "PROCESSING" && (
            <button
              onClick={() => handleUpdateStatus("READY_FOR_DELIVERY")}
              disabled={isUpdating}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              🚚 Ready for Dispatch / Pickup
            </button>
          )}

          {order.status === "READY_FOR_DELIVERY" && (
            <button
              onClick={() => handleUpdateStatus("OUT_FOR_DELIVERY")}
              disabled={isUpdating}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              🚗 Dispatch & Out for Delivery
            </button>
          )}

          {order.status === "OUT_FOR_DELIVERY" && (
            <button
              onClick={() => handleUpdateStatus("DELIVERED")}
              disabled={isUpdating}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              ✓ Mark as Delivered
            </button>
          )}

          {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to cancel this order?")) {
                  handleUpdateStatus("CANCELLED");
                }
              }}
              disabled={isUpdating}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer ml-auto"
            >
              Cancel Order
            </button>
          )}

          {order.status === "DELIVERED" && (
            <button
              onClick={() => {
                const amt = prompt("Enter refund amount in GH₵:", order.total.toString());
                if (amt) {
                  fetch("/api/admin/refunds", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: order._id, amount: amt, reason: "Admin initiated refund" }),
                  }).then(() => fetchOrder());
                }
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
              Process Refund
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Items & Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Items Purchased Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-black text-base text-slate-900">Ordered Water Packs</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                    <th className="pb-3">Pack Item</th>
                    <th className="pb-3">Size & Units</th>
                    <th className="pb-3">Unit Price</th>
                    <th className="pb-3">Qty</th>
                    <th className="pb-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {order.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-900">{item.productName}</td>
                      <td className="py-3 text-slate-500">
                        {item.bottleSize} × {item.unitsPerPack}
                      </td>
                      <td className="py-3 font-semibold text-slate-700">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 font-bold text-slate-900">{item.quantity}</td>
                      <td className="py-3 font-black text-slate-900 text-right">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-slate-100 space-y-2 max-w-xs ml-auto text-xs">
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-medium">
                  <span>Discount ({order.couponCode || "Promo"}):</span>
                  <span className="font-bold">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span>Delivery Fee:</span>
                <span className="font-bold text-slate-800">
                  {order.deliveryFee === 0 ? "FREE" : formatCurrency(order.deliveryFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Grand Total:</span>
                <span className="text-blue-600 font-black">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Chronological Lifecycle Timeline */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-black text-base text-slate-900">Order Audit & Lifecycle Timeline</h3>

            <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {order.timeline && order.timeline.length > 0 ? (
                order.timeline.map((event: any, idx: number) => (
                  <div key={idx} className="relative space-y-0.5">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-50"></div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{event.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(event.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-slate-500 font-medium">{event.description}</p>
                    )}
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">
                      Actor: {event.actor || "System"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">No timeline entries yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Details, Delivery & GPS Map, Payment */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Customer Details</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Full Name</span>
                <span className="font-bold text-slate-800 text-sm">{customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Phone Number</span>
                <a href={`tel:${customerPhone}`} className="font-bold text-blue-600 hover:underline">
                  {customerPhone}
                </a>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Email Address</span>
                <span className="font-medium text-slate-700">{customerEmail}</span>
              </div>
            </div>
          </div>

          {/* Delivery & GPS Location */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900">Delivery & GPS</h3>
              </div>
              {mapLink && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  <span>View Map</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Area / Street</span>
                <span className="font-bold text-slate-800">
                  {order.deliveryAddress?.area || "East Legon"}, {order.deliveryAddress?.city}
                </span>
              </div>
              {order.deliveryAddress?.digitalAddress && (
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Ghana Digital Address</span>
                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {order.deliveryAddress.digitalAddress}
                  </span>
                </div>
              )}
              {order.deliveryAddress?.coordinates && (
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">GPS Coordinates</span>
                  <span className="font-mono text-[11px] text-slate-600">
                    {order.deliveryAddress.coordinates.lat?.toFixed(4)},{" "}
                    {order.deliveryAddress.coordinates.lng?.toFixed(4)}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Calculated Distance</span>
                  <span className="font-bold text-slate-700">
                    {order.deliveryAddress?.distanceKm ?? 3.2} km
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Zone</span>
                  <span className="font-bold text-slate-700">
                    {order.deliveryAddress?.zoneName || "Zone 1"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Payment Summary</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Method</span>
                <span className="font-bold text-slate-800">{order.paymentMethod || "Paystack (MoMo/Card)"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Payment Status</span>
                <StatusBadge status={order.paymentId?.status || (order.status !== "PENDING_PAYMENT" ? "SUCCESS" : "PENDING")} size="sm" />
              </div>
              {order.paymentId?.reference && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Reference</span>
                  <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    {order.paymentId.reference}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
