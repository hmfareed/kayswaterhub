"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  Ban,
} from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import { StoreNavbar } from "@/components/store/navbar";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { RealProductImage } from "@/components/products/real-product-image";
import { PaymentLoadingOverlay } from "@/components/checkout/PaymentLoadingOverlay";

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

function OrderConfirmationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = (params?.id as string) || "";
  const paymentRef = searchParams.get("ref") || searchParams.get("reference");
  const isMock = searchParams.get("mock_payment");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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

  // Re-initiate payment with Paystack
  const handlePayOrder = async () => {
    if (!order) return;
    setIsPaying(true);
    setPayError(null);

    try {
      const res = await fetch(`/api/orders/${order._id || rawId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.isAlreadyPaid) {
          const refreshRes = await fetch(`/api/orders/${order._id || rawId}`);
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data) setOrder(refreshData.data);
          throw new Error("This order has already been paid.");
        }
        if (data.isCancelled) {
          const refreshRes = await fetch(`/api/orders/${order._id || rawId}`);
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data) setOrder(refreshData.data);
          throw new Error("This order was cancelled and cannot be paid.");
        }
        throw new Error(data.error || "Failed to initialize payment.");
      }

      if (data.data?.authorizationUrl) {
        window.location.href = data.data.authorizationUrl;
      }
    } catch (err) {
      setPayError((err as Error).message || "Could not connect to payment gateway.");
      setIsPaying(false);
    }
  };

  // Check / Verify payment status
  const handleCheckPayment = async () => {
    setIsVerifying(true);
    setPayError(null);
    try {
      const orderIdToFetch = order?._id || rawId || "WH-2405258";
      const res = await fetch(`/api/orders/${orderIdToFetch}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
        if (data.data.status !== "PENDING_PAYMENT" && data.data.status !== "PENDING") {
          setVerifyMessage("Payment status updated: Order confirmed!");
        } else {
          setPayError("Payment is still pending. If you just authorized the MoMo prompt, please wait 5-10 seconds and check again.");
        }
      }
    } catch (e) {
      setPayError("Could not check payment status.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Cancel unpaid order
  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/orders/${order._id || rawId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED", reason: "Customer cancelled from order confirmation page" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel order.");
      }
      setOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
      setShowCancelModal(false);
    } catch (err) {
      setCancelError((err as Error).message || "Could not cancel order.");
    } finally {
      setIsCancelling(false);
    }
  };

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
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-neutral-100">
        <StoreNavbar />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-neutral-400">Retrieving order details...</p>
          </div>
        </main>
      </div>
    );
  }

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status === "CANCELLED" || order?.status === "FAILED_DELIVERY";
  const isPaid = !isCancelled && (order?.status === "PAID" || order?.status === "CONFIRMED" || order?.status === "PROCESSING" || order?.status === "READY_FOR_DELIVERY" || order?.status === "OUT_FOR_DELIVERY" || order?.status === "IN_TRANSIT" || order?.status === "DELIVERED");
  const isPendingPayment = !isCancelled && !isPaid;
  const customerName = order?.deliveryAddress?.fullName || order?.guestInformation?.name || "Customer";
  const customerPhone = order?.deliveryAddress?.phone || order?.guestInformation?.phone || "";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-neutral-100 selection:bg-blue-500 selection:text-white">
      <StoreNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 lg:pb-16">
        {/* Verification banner if coming from Paystack */}
        {verifyMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{verifyMessage}</span>
            </div>
            <button onClick={() => setVerifyMessage(null)} className="text-emerald-700 dark:text-emerald-300 font-bold text-xs">✕</button>
          </div>
        )}

        {/* ─── Top Status Card ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-neutral-800 shadow-xs text-center space-y-5 mb-8">
          {isCancelled ? (
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-md shadow-rose-500/20">
              <Ban className="w-8 h-8 stroke-[2.5]" />
            </div>
          ) : isPaid ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md shadow-amber-500/20 animate-pulse">
              <Clock className="w-8 h-8 stroke-[2.5]" />
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-neutral-100 tracking-tight">
              {isCancelled
                ? "Order Cancelled"
                : isPaid
                ? "Product Payment Confirmed!"
                : "Payment Pending"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 max-w-xl mx-auto">
              {isCancelled ? (
                <>Order <span className="font-bold text-slate-900 dark:text-neutral-200">#{order?.orderNumber || rawId}</span> has been cancelled and will not be processed.</>
              ) : isPaid ? (
                <>Thank you, <span className="font-bold text-slate-900 dark:text-neutral-200">{customerName}</span>! Your product payment of <span className="font-extrabold text-blue-600 dark:text-blue-400">{formatCurrency(order?.total || 0)}</span> has been received.</>
              ) : (
                <>Thank you, <span className="font-bold text-slate-900 dark:text-neutral-200">{customerName}</span>! Your order has been placed. Please complete your product payment of <span className="font-extrabold text-blue-600 dark:text-blue-400">{formatCurrency(order?.total || 0)}</span> to confirm your order.</>
              )}
            </p>
          </div>

          {/* ─── Pending Payment Action Box ──────────────────────────────────── */}
          {isPendingPayment && (
            <div className="max-w-md mx-auto p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-left space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Action Required: Complete Payment</span>
                </span>
                <span className="text-sm font-black text-amber-950 dark:text-amber-100">
                  {formatCurrency(order?.total || 0)}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Pay securely online with MTN MoMo, Telecel Cash, AT Money, or Visa/Mastercard.
              </p>
              {payError && (
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center justify-between">
                  <span>{payError}</span>
                  <button onClick={() => setPayError(null)} className="text-rose-600 font-bold ml-2">✕</button>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={handlePayOrder}
                  disabled={isPaying || isCancelling}
                  className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting to Paystack...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay Now ({formatCurrency(order?.total || 0)})</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCheckPayment}
                  disabled={isVerifying}
                  className="py-3 px-3.5 bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-750 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Check if payment went through"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
                  <span>Verify Status</span>
                </button>
              </div>
            </div>
          )}

          <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-600 dark:text-neutral-300">
            <span>Order ID: <strong className="text-blue-600 dark:text-blue-400 font-extrabold">{order?.orderNumber || rawId}</strong></span>
            <span>•</span>
            <span>
              Product Payment:{" "}
              <strong className={isPaid ? "text-emerald-600 dark:text-emerald-400 font-bold" : isCancelled ? "text-rose-600 dark:text-rose-400 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"}>
                {isPaid ? "Paid (Paystack)" : isCancelled ? "Cancelled" : "Pending Payment"}
              </strong>
            </span>
            <span>•</span>
            <span>Delivery Method: <strong className="text-slate-800 dark:text-neutral-200 font-bold">{deliveryMethod === "YANGO_DOOR" ? "Yango Door Delivery" : deliveryMethod === "NATIONWIDE_PARCEL" ? "Nationwide Parcel" : "Self Pickup"}</strong></span>
          </div>

          {/* ─── 5-Step Order Stepper ─────────────────────────────────────────── */}
          {!isCancelled && (
            <div className="pt-6 sm:pt-8 pb-4">
              <div className="relative flex items-center justify-between max-w-2xl mx-auto px-2 sm:px-4">
                {/* Connecting line */}
                <div className="absolute left-6 right-6 sm:left-8 sm:right-8 top-4 sm:top-5 -translate-y-1/2 h-1 bg-slate-200 dark:bg-neutral-800 -z-0">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-700"
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
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isCurrent
                            ? "bg-blue-600 text-white ring-2 sm:ring-4 ring-blue-100 dark:ring-blue-900/50 shadow-md shadow-blue-600/30 scale-110"
                            : isPassed
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-200 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500"
                        }`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span
                        className={`text-[9px] sm:text-xs font-bold mt-1.5 sm:mt-2 text-center max-w-[58px] sm:max-w-[75px] leading-tight ${
                          isCurrent
                            ? "text-blue-600 dark:text-blue-400 font-black"
                            : isPassed
                            ? "text-slate-800 dark:text-neutral-200"
                            : "text-slate-400 dark:text-neutral-500"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── Delivery Details & Order Items Breakdown ─────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-8">
          {/* Delivery Details */}
          <div className="md:col-span-6 bg-white dark:bg-neutral-900/90 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-4">
            <h2 className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-neutral-100 pb-2 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>
                {deliveryMethod === "YANGO_DOOR"
                  ? "Yango Delivery Location"
                  : deliveryMethod === "NATIONWIDE_PARCEL"
                  ? "Parcel Destination Details"
                  : "Depot Pickup Location"}
              </span>
            </h2>

            <div className="space-y-3 text-xs text-slate-600 dark:text-neutral-400">
              <div>
                <span className="font-bold text-slate-900 dark:text-neutral-100 text-sm block">{customerName}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500" />
                  <span>{customerPhone}</span>
                </div>
              </div>

              {order?.deliveryAddress?.parcelStation && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300">
                  <span className="font-bold block text-[11px]">Destination Station / Terminal:</span>
                  <span className="font-black text-xs">{order.deliveryAddress.parcelStation}</span>
                </div>
              )}

              <div className="space-y-0.5 pt-1">
                <p className="font-medium text-slate-800 dark:text-neutral-200">
                  {order?.deliveryAddress?.houseOrBuilding || "Designated Delivery Address"}
                </p>
                {order?.deliveryAddress?.area && (
                  <p className="text-slate-600 dark:text-neutral-400">{order.deliveryAddress.area}, {order.deliveryAddress.city}</p>
                )}
                <p className="font-bold text-slate-900 dark:text-neutral-100">{order?.deliveryAddress?.region} Region</p>
              </div>

              {order?.deliveryAddress?.digitalAddress && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 font-mono text-[11px] font-bold text-slate-800 dark:text-neutral-200">
                  <span>GPS:</span>
                  <span>{order.deliveryAddress.digitalAddress}</span>
                </div>
              )}

              {/* Coordinates Link */}
              {order?.deliveryAddress?.coordinates?.lat && order?.deliveryAddress?.coordinates?.lng && (
                <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                    Location: {order.deliveryAddress.coordinates.lat.toFixed(4)}, {order.deliveryAddress.coordinates.lng.toFixed(4)}
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryAddress.coordinates.lat},${order.deliveryAddress.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>View Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {order?.deliveryAddress?.landmark && (
                <div className="pt-1">
                  <span className="font-bold text-slate-800 dark:text-neutral-200">Landmark: </span>
                  <span>{order.deliveryAddress.landmark}</span>
                </div>
              )}

              {order?.deliveryAddress?.deliveryInstructions && (
                <div>
                  <span className="font-bold text-slate-800 dark:text-neutral-200">Instructions: </span>
                  <span>{order.deliveryAddress.deliveryInstructions}</span>
                </div>
              )}

              {/* Delivery Payment Notice Box */}
              {!isPickup && (
                <div className="pt-2 border-t border-slate-100 dark:border-neutral-800">
                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-950 dark:text-blue-200">Courier Delivery Fee:</span>
                      <span className="font-black text-blue-900 dark:text-blue-300">
                        {deliveryMethod === "YANGO_DOOR"
                          ? `Est. ${formatCurrency(order?.estimatedDeliveryFee || order?.deliveryFee || 25)}`
                          : "Courier Rate"}
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-800 dark:text-blue-300 font-medium">
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
          <div className="md:col-span-6 bg-white dark:bg-neutral-900/90 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-4">
            <h2 className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-neutral-100 pb-2 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Products Purchased</span>
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-neutral-800 max-h-60 overflow-y-auto pr-1">
              {order?.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-14 bg-slate-50 dark:bg-neutral-800 rounded-xl p-1 flex items-center justify-center shrink-0 border border-slate-100 dark:border-neutral-750 shadow-2xs">
                      <RealProductImage item={item} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-neutral-100 block leading-tight">{item.productName}</span>
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500">{item.variantName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-500 dark:text-neutral-400 text-[11px] block">Qty: {item.quantity}</span>
                    <span className="font-black text-slate-900 dark:text-neutral-100">{formatCurrency(item.totalPrice)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-neutral-400">
                <span>Products Subtotal</span>
                <span className="font-bold text-slate-800 dark:text-neutral-200">{formatCurrency(order?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-neutral-400">
                <span>Delivery Fee (Paid to Courier)</span>
                <span className="font-bold text-slate-800 dark:text-neutral-200">
                  {isPickup
                    ? "FREE"
                    : deliveryMethod === "YANGO_DOOR"
                    ? `Est. ${formatCurrency(order?.estimatedDeliveryFee || order?.deliveryFee || 25)}`
                    : "Courier Rate"}
                </span>
              </div>
              {order?.discount ? (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              ) : null}
              <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex justify-between text-sm sm:text-base font-black text-slate-900 dark:text-neutral-100">
                <span>{isPaid ? "Total Paid Online (Paystack)" : "Total Due Online (Paystack)"}</span>
                <span className="text-blue-600 dark:text-blue-400">{formatCurrency(order?.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Cancel Modal ──────────────────────────────────────────────────── */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-neutral-800 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                <Ban className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-black text-base text-slate-900 dark:text-neutral-100">Cancel this Order?</h3>
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  Are you sure you want to cancel order #{order?.orderNumber || rawId}? This will release the reserved items.
                </p>
              </div>
              {cancelError && (
                <p className="text-xs text-rose-600 font-bold text-center">{cancelError}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 font-bold text-xs text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  <span>{isCancelling ? "Cancelling..." : "Yes, Cancel"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
            className="w-full sm:w-auto px-7 py-3.5 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-750 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 font-bold text-xs rounded-xl shadow-2xs transition-all text-center"
          >
            View My Orders
          </Link>
          {isPendingPayment && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full sm:w-auto px-6 py-3.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900/60 transition-all text-center cursor-pointer"
            >
              Cancel Order
            </button>
          )}
        </div>
      </main>

      {/* Payment Gateway Loading Screen */}
      <PaymentLoadingOverlay
        isOpen={isPaying}
        amount={order?.total}
        orderNumber={order?.orderNumber}
        customerName={order?.deliveryAddress?.fullName || order?.guestInformation?.name}
        onCancel={() => setIsPaying(false)}
      />

      <MobileBottomNav />
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}

