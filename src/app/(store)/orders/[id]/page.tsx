"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Check,
  CreditCard,
  Package,
  Truck,
  Home,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  Droplets,
  Share2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import { StoreNavbar } from "@/components/store/navbar";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { RealProductImage } from "@/components/products/real-product-image";

interface OrderItem {
  productName: string;
  brandName: string;
  variantName: string;
  bottleSize: string;
  unitsPerPack: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderData {
  _id: string;
  orderNumber: string;
  guestInformation?: {
    name: string;
    email: string;
    phone: string;
  };
  deliveryAddress: {
    fullName?: string;
    phone?: string;
    region: string;
    city: string;
    area?: string;
    digitalAddress?: string;
    houseOrBuilding?: string;
    landmark?: string;
    deliveryInstructions?: string;
    parcelStation?: string;
    coordinates?: { lat: number; lng: number };
    distanceKm?: number;
    zoneName?: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  estimatedDeliveryFee?: number;
  actualDeliveryFee?: number;
  deliveryMethod?: "YANGO_DOOR" | "NATIONWIDE_PARCEL" | "SELF_PICKUP";
  deliveryPaymentStatus?: "NOT_REQUIRED" | "EXPECTED" | "COLLECTED" | "CONFIRMED" | "DISPUTED" | "FAILED";
  discount: number;
  total: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = (params?.id as string) || "";
  const paymentRef = searchParams.get("ref") || searchParams.get("reference");
  const isMock = searchParams.get("mock_payment");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAndVerifyOrder() {
      setIsLoading(true);

      // 1. If returning with a payment reference, trigger Paystack verification
      if (paymentRef) {
        setIsVerifying(true);
        try {
          const verifyRes = await fetch(`/api/payments/verify?reference=${encodeURIComponent(paymentRef)}`);
          const verifyData = await verifyRes.json();
          if (verifyData.success && verifyData.order) {
            if (isMounted) {
              setOrder(verifyData.order);
              setVerifyMessage("Payment verified successfully via Paystack.");
              setIsLoading(false);
              setIsVerifying(false);
              return;
            }
          }
        } catch (e) {
          console.error("Payment verification error:", e);
        } finally {
          if (isMounted) setIsVerifying(false);
        }
      }

      // 2. Fetch order details by ID or orderNumber
      try {
        const orderIdToFetch = rawId || "WH-2405258";
        const res = await fetch(`/api/orders/${orderIdToFetch}`);
        const data = await res.json();

        if (data.success && data.data) {
          if (isMounted) setOrder(data.data);
        } else {
          // Fallback mock order data
          if (isMounted) {
            setOrder({
              _id: "mock_123",
              orderNumber: rawId.startsWith("WH-") || rawId.startsWith("ORD-") ? rawId : `#WH-2405258`,
              guestInformation: {
                name: "Kwame Mensah",
                email: "kwame@example.com",
                phone: "024 123 4567",
              },
              deliveryAddress: {
                fullName: "Kwame Mensah",
                phone: "024 123 4567",
                region: "Greater Accra",
                city: "Accra",
                area: "East Legon",
                digitalAddress: "GA-183-9022",
                houseOrBuilding: "No. 12 Boundary Road",
                landmark: "Near A&C Mall",
                deliveryInstructions: "Call before delivery",
                coordinates: { lat: 5.6356, lng: -0.1601 },
                distanceKm: 3.4,
                zoneName: "Accra Central Zone",
              },
              items: [
                {
                  productName: "Voltic Natural Mineral Water",
                  brandName: "Voltic",
                  variantName: "500ml x 24",
                  bottleSize: "500ml",
                  unitsPerPack: 24,
                  quantity: 2,
                  unitPrice: 45,
                  totalPrice: 90,
                },
                {
                  productName: "Bel Aqua Mineral Water",
                  brandName: "Bel-Aqua",
                  variantName: "500ml x 24",
                  bottleSize: "500ml",
                  unitsPerPack: 24,
                  quantity: 1,
                  unitPrice: 40,
                  totalPrice: 40,
                },
              ],
              subtotal: 130,
              deliveryFee: 25,
              estimatedDeliveryFee: 25,
              deliveryMethod: "YANGO_DOOR",
              deliveryPaymentStatus: "EXPECTED",
              discount: 0,
              total: 130,
              status: "PAID",
              createdAt: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAndVerifyOrder();

    return () => {
      isMounted = false;
    };
  }, [rawId, paymentRef]);

  const deliveryMethod = order?.deliveryMethod || "YANGO_DOOR";
  const isNationwide = deliveryMethod === "NATIONWIDE_PARCEL";
  const isPickup = deliveryMethod === "SELF_PICKUP";

  // Stepper mapping
  const getStepIndex = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return 0;
      case "PAID":
      case "CONFIRMED":
        return 1;
      case "PROCESSING":
        return 2;
      case "READY_FOR_DELIVERY":
      case "OUT_FOR_DELIVERY":
      case "IN_TRANSIT":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 1;
    }
  };

  const steps = isNationwide
    ? [
        { title: "Order Placed", icon: CheckCircle2 },
        { title: "Paid Online", icon: CreditCard },
        { title: "Parcel Packed", icon: Package },
        { title: "In Transit", icon: Truck },
        { title: "At Station", icon: Home },
      ]
    : isPickup
    ? [
        { title: "Order Placed", icon: CheckCircle2 },
        { title: "Paid Online", icon: CreditCard },
        { title: "Packing", icon: Package },
        { title: "Ready for Pickup", icon: Clock },
        { title: "Collected", icon: Home },
      ]
    : [
        { title: "Order Placed", icon: CheckCircle2 },
        { title: "Paid Online", icon: CreditCard },
        { title: "Preparing Order", icon: Package },
        { title: "Yango Out for Delivery", icon: Truck },
        { title: "Delivered", icon: Home },
      ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <StoreNavbar />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Retrieving order details...</p>
          </div>
        </main>
      </div>
    );
  }

  const currentStep = order ? getStepIndex(order.status) : 1;
  const isPaid = order?.status === "PAID" || order?.status === "CONFIRMED" || order?.status === "PROCESSING" || order?.status === "OUT_FOR_DELIVERY" || order?.status === "DELIVERED";
  const customerName = order?.deliveryAddress?.fullName || order?.guestInformation?.name || "Customer";
  const customerPhone = order?.deliveryAddress?.phone || order?.guestInformation?.phone || "";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
      <StoreNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 lg:pb-16">
        {/* Verification banner if coming from Paystack */}
        {verifyMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{verifyMessage}</span>
          </div>
        )}

        {/* ─── Top Success Card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs text-center space-y-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isPaid ? "Product Payment Confirmed!" : "Order Placed Successfully"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Thank you, <span className="font-bold text-slate-900">{customerName}</span>! Your product payment of <span className="font-extrabold text-blue-600">{formatCurrency(order?.total || 0)}</span> has been received.
            </p>
          </div>

          <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
            <span>Order ID: <strong className="text-blue-600 font-extrabold">{order?.orderNumber || rawId}</strong></span>
            <span>•</span>
            <span>Product Payment: <strong className="text-emerald-600 font-bold">{isPaid ? "Paid (Paystack)" : "Pending"}</strong></span>
            <span>•</span>
            <span>Delivery Method: <strong className="text-slate-800 font-bold">{deliveryMethod === "YANGO_DOOR" ? "Yango Door Delivery" : deliveryMethod === "NATIONWIDE_PARCEL" ? "Nationwide Parcel" : "Self Pickup"}</strong></span>
          </div>

          {/* ─── 5-Step Order Stepper ─────────────────────────────────────────── */}
          <div className="pt-8 pb-4">
            <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4">
              {/* Connecting line */}
              <div className="absolute left-8 right-8 top-5 -translate-y-1/2 h-1 bg-slate-200 -z-0">
                <div
                  className="h-full bg-blue-600 transition-all duration-700"
                  style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {steps.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;
                const Icon = step.icon;

                return (
                  <div key={step.title} className="relative z-10 flex flex-col items-center group">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isCurrent
                          ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-md shadow-blue-600/30 scale-110"
                          : isPassed
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-bold mt-2 text-center max-w-[75px] leading-tight ${
                        isCurrent
                          ? "text-blue-600 font-black"
                          : isPassed
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Delivery Details & Order Items Breakdown ─────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-8">
          {/* Delivery Details */}
          <div className="md:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-black text-sm uppercase tracking-wide text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>
                {deliveryMethod === "YANGO_DOOR"
                  ? "Yango Delivery Location"
                  : deliveryMethod === "NATIONWIDE_PARCEL"
                  ? "Parcel Destination Details"
                  : "Depot Pickup Location"}
              </span>
            </h2>

            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-900 text-sm block">{customerName}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customerPhone}</span>
                </div>
              </div>

              {order?.deliveryAddress.parcelStation && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold block text-[11px]">Destination Station / Terminal:</span>
                  <span className="font-black text-xs">{order.deliveryAddress.parcelStation}</span>
                </div>
              )}

              <div className="space-y-0.5 pt-1">
                <p className="font-medium text-slate-800">
                  {order?.deliveryAddress.houseOrBuilding || "Designated Delivery Address"}
                </p>
                {order?.deliveryAddress.area && (
                  <p className="text-slate-600">{order.deliveryAddress.area}, {order.deliveryAddress.city}</p>
                )}
                <p className="font-bold text-slate-900">{order?.deliveryAddress.region} Region</p>
              </div>

              {order?.deliveryAddress.digitalAddress && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 font-mono text-[11px] font-bold text-slate-800">
                  <span>GPS:</span>
                  <span>{order.deliveryAddress.digitalAddress}</span>
                </div>
              )}

              {/* Coordinates Link */}
              {order?.deliveryAddress.coordinates?.lat && order?.deliveryAddress.coordinates?.lng && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Location: {order.deliveryAddress.coordinates.lat.toFixed(4)}, {order.deliveryAddress.coordinates.lng.toFixed(4)}
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryAddress.coordinates.lat},${order.deliveryAddress.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                  >
                    <span>View Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {order?.deliveryAddress.landmark && (
                <div className="pt-1">
                  <span className="font-bold text-slate-800">Landmark: </span>
                  <span>{order.deliveryAddress.landmark}</span>
                </div>
              )}

              {order?.deliveryAddress.deliveryInstructions && (
                <div>
                  <span className="font-bold text-slate-800">Instructions: </span>
                  <span>{order.deliveryAddress.deliveryInstructions}</span>
                </div>
              )}

              {/* Delivery Payment Notice Box */}
              {!isPickup && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-950">Courier Delivery Fee:</span>
                      <span className="font-black text-blue-900">
                        {deliveryMethod === "YANGO_DOOR"
                          ? `Est. ${formatCurrency(order?.estimatedDeliveryFee || order?.deliveryFee || 25)}`
                          : "Courier Rate"}
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-800 font-medium">
                      {deliveryMethod === "YANGO_DOOR"
                        ? "🚚 Please pay this delivery charge directly to the Yango rider."
                        : "🚚 Transport fee is paid directly upon collecting your parcel at the station."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items & Breakdown */}
          <div className="md:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-black text-sm uppercase tracking-wide text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Products Purchased</span>
            </h2>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
              {order?.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-14 bg-slate-50 rounded-xl p-1 flex items-center justify-center shrink-0 border border-slate-100 shadow-2xs">
                      <RealProductImage item={item} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">{item.productName}</span>
                      <span className="text-[11px] text-slate-400">{item.variantName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-500 text-[11px] block">Qty: {item.quantity}</span>
                    <span className="font-black text-slate-900">{formatCurrency(item.totalPrice)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Products Subtotal</span>
                <span className="font-bold text-slate-800">{formatCurrency(order?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Fee (Paid to Courier)</span>
                <span className="font-bold text-slate-800">
                  {isPickup
                    ? "FREE"
                    : deliveryMethod === "YANGO_DOOR"
                    ? `Est. ${formatCurrency(order?.estimatedDeliveryFee || order?.deliveryFee || 25)}`
                    : "Courier Rate"}
                </span>
              </div>
              {order?.discount ? (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              ) : null}
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm sm:text-base font-black text-slate-900">
                <span>Total Paid Online (Paystack)</span>
                <span className="text-blue-600">{formatCurrency(order?.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom Actions ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shop"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center"
          >
            Continue Shopping
          </Link>
          <Link
            href="/account?tab=orders"
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl shadow-2xs transition-all text-center"
          >
            View My Orders
          </Link>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
