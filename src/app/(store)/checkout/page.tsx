"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShieldCheck,
  Truck,
  CheckCircle2,
  CreditCard,
  Phone,
  MapPin,
  Building,
  Navigation,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  Bookmark,
  Check,
} from "lucide-react";
import { GHANA_REGIONS, formatCurrency } from "@/lib/constants";
import { useCart } from "@/context/cart-context";
import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { RealProductImage } from "@/components/products/real-product-image";
import { PaymentMethodBadge } from "@/components/ui/brand-logos";

interface SavedAddress {
  _id: string;
  label?: string;
  fullName?: string;
  phone?: string;
  region: string;
  city: string;
  area?: string;
  digitalAddress?: string;
  houseOrBuilding?: string;
  landmark?: string;
  deliveryInstructions?: string;
  coordinates?: { lat: number; lng: number };
  isDefault?: boolean;
}

interface DeliveryCalculationData {
  isDeliverable: boolean;
  deliveryFee: number;
  originalFee: number;
  distanceKm?: number;
  zoneName: string;
  pricingType: string;
  estimatedDeliveryTime: string;
  isFreeDelivery: boolean;
  freeDeliveryThreshold?: number;
  reason?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    selectedRegion,
    setSelectedRegion,
  } = useCart();

  // Saved addresses for logged-in user
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "NEW">("NEW");

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    region: selectedRegion || "Greater Accra",
    city: "Accra",
    area: "",
    digitalAddress: "",
    houseAddress: "",
    landmark: "",
    deliveryInstructions: "",
  });

  // Geolocation State
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Delivery Calculation State
  const [deliveryCalc, setDeliveryCalc] = useState<DeliveryCalculationData>({
    isDeliverable: true,
    deliveryFee: 20,
    originalFee: 20,
    distanceKm: undefined,
    zoneName: "Greater Accra Standard",
    pricingType: "FLAT",
    estimatedDeliveryTime: "1–3 hours",
    isFreeDelivery: false,
    freeDeliveryThreshold: 350,
  });
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);

  // Submission State
  const [paymentMethod, setPaymentMethod] = useState<"PAYSTACK" | "MOMO" | "CARD">("PAYSTACK");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Autofill user profile when session loads
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || session.user.name || "",
        email: prev.email || session.user.email || "",
        phone: prev.phone || (session.user as { phone?: string }).phone || "",
      }));

      // Fetch saved addresses
      fetch("/api/account/addresses")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            const defaultAddr = data.addresses.find((a: SavedAddress) => a.isDefault) || data.addresses[0];
            if (defaultAddr) {
              applySavedAddress(defaultAddr);
            }
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const applySavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr._id);
    setFormData((prev) => ({
      ...prev,
      fullName: addr.fullName || prev.fullName,
      phone: addr.phone || prev.phone,
      region: addr.region || prev.region,
      city: addr.city || prev.city,
      area: addr.area || "",
      digitalAddress: addr.digitalAddress || "",
      houseAddress: addr.houseOrBuilding || "",
      landmark: addr.landmark || "",
      deliveryInstructions: addr.deliveryInstructions || "",
    }));

    if (addr.coordinates?.lat && addr.coordinates?.lng) {
      setGpsCoordinates(addr.coordinates);
      setGpsAccuracy(15);
      setLocationStatus(`Saved location (${addr.coordinates.lat.toFixed(4)}, ${addr.coordinates.lng.toFixed(4)})`);
    } else {
      setGpsCoordinates(null);
      setGpsAccuracy(null);
      setLocationStatus(null);
    }
    setSelectedRegion(addr.region);
  };

  // Trigger GPS Geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationStatus("Accessing GPS satellite coordinates...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setGpsCoordinates(coords);
        setGpsAccuracy(Math.round(accuracy));
        setIsLocating(false);
        setLocationStatus(`GPS Locked (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
      },
      (error) => {
        setIsLocating(false);
        console.warn("GPS Geolocation error:", error.message);
        setLocationStatus("GPS access unavailable. You can enter your address details below.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  // Recalculate delivery fee when location, region or subtotal change
  const calculateDelivery = useCallback(async () => {
    if (items.length === 0) return;
    setIsCalculatingDelivery(true);

    try {
      const res = await fetch("/api/delivery/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coordinates: gpsCoordinates,
          region: formData.region,
          city: formData.city,
          area: formData.area,
          subtotal,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setDeliveryCalc(json.data);
      }
    } catch (err) {
      console.error("Delivery calculation failed:", err);
    } finally {
      setIsCalculatingDelivery(false);
    }
  }, [gpsCoordinates, formData.region, formData.city, formData.area, subtotal, items.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateDelivery();
    }, 300);
    return () => clearTimeout(timer);
  }, [calculateDelivery]);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setFormData((prev) => ({ ...prev, region }));
  };

  // Final Checkout Submission
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (items.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setCheckoutError("Please provide your full name and phone number.");
      return;
    }

    if (!formData.houseAddress.trim() && !formData.digitalAddress.trim()) {
      setCheckoutError("Please provide your building/street address or digital address.");
      return;
    }

    if (!deliveryCalc.isDeliverable) {
      setCheckoutError(deliveryCalc.reason || "Delivery is unavailable to the selected location.");
      return;
    }

    setIsSubmitting(true);

    try {
      const checkoutPayload = {
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          packSize: item.product.packSize,
          unitPrice: item.product.price,
          quantity: item.quantity,
        })),
        deliveryAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          region: formData.region,
          city: formData.city,
          area: formData.area,
          digitalAddress: formData.digitalAddress,
          houseOrBuilding: formData.houseAddress,
          landmark: formData.landmark,
          deliveryInstructions: formData.deliveryInstructions,
          coordinates: gpsCoordinates,
        },
        customerInfo: {
          name: formData.fullName,
          phone: formData.phone,
          email: formData.email || `${formData.phone.replace(/\s+/g, "")}@khadyswater.com`,
        },
        paymentMethod: "PAYSTACK",
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to process checkout.");
      }

      const { authorizationUrl, orderId, isSimulated, reference } = result.data;

      // Clear cart
      clearCart();

      // Redirect to Paystack or Order Confirmation
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
      } else {
        router.push(`/orders/${orderId}?ref=${reference}`);
      }
    } catch (err) {
      console.error("[Checkout] Error:", err);
      setCheckoutError((err as Error).message || "Checkout failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  const finalTotal = subtotal + (deliveryCalc.isDeliverable ? deliveryCalc.deliveryFee : 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
      <StoreNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-16">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-blue-600 transition-colors">Cart</Link>
          <span>/</span>
          <span className="text-slate-700">Checkout & Paystack</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Express Checkout
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Location-based delivery with secure Paystack payment
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs">
            <Lock className="w-3.5 h-3.5" />
            <span>256-Bit SSL Encrypted Paystack Gateway</span>
          </div>
        </div>

        {checkoutError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-rose-900">Checkout Notice</span>
              <span>{checkoutError}</span>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <Truck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Your cart is empty</h2>
            <p className="text-xs text-slate-500">
              Add some packs of fresh bottled or sachet water before proceeding to checkout.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <span>Browse Water Packs</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ─── Left Column: Delivery Details & Payment Method ─────────────── */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Delivery Address & GPS */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-600/30">
                      1
                    </div>
                    <div>
                      <h2 className="font-black text-sm uppercase tracking-wide text-slate-900">
                        Delivery Address & Location
                      </h2>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Used to calculate precise zone delivery fee
                      </span>
                    </div>
                  </div>

                  {/* GPS Button */}
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Detecting...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Use My Location</span>
                      </>
                    )}
                  </button>
                </div>

                {/* GPS Status Banner */}
                {locationStatus && (
                  <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border ${
                    gpsCoordinates
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{locationStatus}</span>
                    </div>
                    {gpsAccuracy && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-emerald-300 font-bold text-emerald-700">
                        ~{gpsAccuracy}m accuracy
                      </span>
                    )}
                  </div>
                )}

                {/* Saved Addresses Selector (if logged in and has addresses) */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                      <span>Saved Addresses</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr._id;
                        return (
                          <div
                            key={addr._id}
                            onClick={() => applySavedAddress(addr)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all text-left ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 shadow-2xs"
                                : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-xs text-slate-900">
                                {addr.label || "Saved Address"}
                              </span>
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-1">
                              {addr.houseOrBuilding || addr.area || addr.city}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {addr.city}, {addr.region}
                            </p>
                          </div>
                        );
                      })}

                      <div
                        onClick={() => {
                          setSelectedAddressId("NEW");
                          setFormData((prev) => ({
                            ...prev,
                            houseAddress: "",
                            area: "",
                            digitalAddress: "",
                            landmark: "",
                          }));
                          setGpsCoordinates(null);
                          setLocationStatus(null);
                        }}
                        className={`p-3 rounded-2xl border border-dashed cursor-pointer transition-all flex items-center justify-center text-center ${
                          selectedAddressId === "NEW"
                            ? "border-blue-600 bg-blue-50/30 text-blue-600 font-bold text-xs"
                            : "border-slate-300 hover:border-slate-400 text-slate-500 text-xs font-semibold"
                        }`}
                      >
                        <span>+ Enter Custom / New Address</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-3.5 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Kwame Mensah"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Phone Number (Mobile Money / Contact) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="024 123 4567"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Region *
                      </label>
                      <select
                        value={formData.region}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      >
                        {GHANA_REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r} Region
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        City / Town *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Accra, Kumasi, Tamale"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Area / Neighborhood
                      </label>
                      <input
                        type="text"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        placeholder="e.g. East Legon, Spintex, Adum"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        GhanaPost GPS Digital Address (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.digitalAddress}
                        onChange={(e) => setFormData({ ...formData, digitalAddress: e.target.value.toUpperCase() })}
                        placeholder="e.g. GA-183-9022"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:bg-white focus:border-blue-500 focus:outline-hidden uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Street / House / Building Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.houseAddress}
                      onChange={(e) => setFormData({ ...formData, houseAddress: e.target.value })}
                      placeholder="e.g. No. 14 Boundary Road, Near Shell"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.landmark}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        placeholder="e.g. Opposite A&C Mall"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Delivery Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.deliveryInstructions}
                        onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                        placeholder="e.g. Call before dispatch"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Live Location-Based Delivery Calculation */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-600/30">
                      2
                    </div>
                    <div>
                      <h2 className="font-black text-sm uppercase tracking-wide text-slate-900">
                        Delivery Calculation & Estimate
                      </h2>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Live distance calculation from East Legon Warehouse Hub
                      </span>
                    </div>
                  </div>

                  {isCalculatingDelivery && (
                    <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </span>
                  )}
                </div>

                {deliveryCalc.isDeliverable ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-black text-sm text-slate-900 block">
                          {deliveryCalc.zoneName}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          {deliveryCalc.distanceKm !== undefined ? (
                            <span>📍 {deliveryCalc.distanceKm} km from warehouse</span>
                          ) : (
                            <span>📍 Regional Delivery</span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-700 font-bold">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            {deliveryCalc.estimatedDeliveryTime}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        {deliveryCalc.isFreeDelivery ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>FREE DELIVERY</span>
                          </div>
                        ) : (
                          <div className="font-black text-base text-slate-900">
                            {formatCurrency(deliveryCalc.deliveryFee)}
                          </div>
                        )}
                      </div>
                    </div>

                    {deliveryCalc.isFreeDelivery && (
                      <p className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-emerald-200/60">
                        🎉 Free delivery unlocked! (Orders above {formatCurrency(deliveryCalc.freeDeliveryThreshold || 350)})
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                    <span className="font-bold block text-rose-900">Delivery Unavailable</span>
                    <p>{deliveryCalc.reason}</p>
                  </div>
                )}
              </div>

              {/* Step 3: Payment Method (Paystack Gateway) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-600/30">
                    3
                  </div>
                  <div>
                    <h2 className="font-black text-sm uppercase tracking-wide text-slate-900">
                      Payment Method
                    </h2>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Secure checkout powered by Paystack
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Paystack unified option */}
                  <label className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 cursor-pointer gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentGateway"
                        checked={paymentMethod === "PAYSTACK"}
                        onChange={() => setPaymentMethod("PAYSTACK")}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">Paystack Checkout</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-black">
                            Recommended
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          Mobile Money (MTN, Telecel, AirtelTigo), Cards (Visa, Mastercard), & Bank
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <PaymentMethodBadge method="MTN" />
                      <PaymentMethodBadge method="TELECEL" />
                      <PaymentMethodBadge method="VISA" />
                      <PaymentMethodBadge method="MASTERCARD" />
                    </div>
                  </label>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      After clicking <strong>Pay with Paystack</strong>, you will be securely redirected to Paystack to authorize your Mobile Money prompt or card payment. Stock is automatically reserved for you.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Right Column: Sticky Order Review & Action ──────────────────── */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-black text-sm uppercase tracking-wide text-slate-900">
                    Order Summary
                  </h3>
                  <span className="text-xs font-bold text-blue-600">
                    {items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </span>
                </div>

                {/* Items List */}
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
                  {items.map((item) => {
                    const itemTotal = item.product.price * item.quantity;
                    return (
                      <div key={item.product.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-11 h-13 bg-slate-50 rounded-xl p-1 flex items-center justify-center shrink-0 border border-slate-100 shadow-2xs">
                            <RealProductImage item={item.product} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 line-clamp-1">
                              {item.product.name}
                            </h4>
                            <span className="text-[11px] text-slate-400">{item.product.packSize}</span>
                          </div>
                        </div>

                        {/* Quantity Stepper & Total */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 px-1 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-900"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-900"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <span className="font-black text-slate-900 min-w-[55px] text-right">
                            {formatCurrency(itemTotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <div className="flex items-center gap-1">
                      <span>Delivery Fee</span>
                      {deliveryCalc.distanceKm !== undefined && (
                        <span className="text-[10px] text-slate-400">({deliveryCalc.distanceKm} km)</span>
                      )}
                    </div>
                    {deliveryCalc.isFreeDelivery ? (
                      <span className="font-bold text-emerald-600">FREE</span>
                    ) : (
                      <span className="font-bold text-slate-900">
                        {formatCurrency(deliveryCalc.deliveryFee)}
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
                    <span>Total</span>
                    <span className="text-blue-600 text-lg">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !deliveryCalc.isDeliverable}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-75 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting to Paystack...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay {formatCurrency(finalTotal)} with Paystack</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Guaranteed safe and secure checkout</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      <StoreFooter />
      <MobileBottomNav />
    </div>
  );
}
