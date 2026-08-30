"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Save,
  CheckCircle2,
  AlertCircle,
  Calculator,
  RefreshCw,
  Sparkles,
  Truck,
  Trash2,
  Check,
  Info,
  ShieldCheck,
  Sliders,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatCurrency } from "@/lib/constants";

export default function DeliveryPricingRulesPage() {
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(20);
  const [pricePerKm, setPricePerKm] = useState(2.5);
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(true);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | string>(350);
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState(60);

  // Test Calculator
  const [testDistance, setTestDistance] = useState(8.5);
  const [testOrderSubtotal, setTestOrderSubtotal] = useState(200);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/delivery/store-location")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setDefaultDeliveryFee(d.data.defaultDeliveryFee ?? 20);
          setPricePerKm(d.data.pricePerKm ?? 2.5);

          const hasActiveThreshold =
            d.data.freeDeliveryEnabled !== false &&
            d.data.freeDeliveryThreshold != null &&
            Number(d.data.freeDeliveryThreshold) > 0;

          setFreeDeliveryEnabled(hasActiveThreshold);
          setFreeDeliveryThreshold(
            d.data.freeDeliveryThreshold != null && Number(d.data.freeDeliveryThreshold) > 0
              ? d.data.freeDeliveryThreshold
              : 350
          );
          setMaxDeliveryRadiusKm(d.data.maxDeliveryRadiusKm ?? 60);
        }
      })
      .catch((err) => {
        console.error("Failed to load store location settings:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const parsedThreshold =
      freeDeliveryEnabled && freeDeliveryThreshold !== "" && Number(freeDeliveryThreshold) > 0
        ? Number(freeDeliveryThreshold)
        : null;

    try {
      const res = await fetch("/api/admin/delivery/store-location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultDeliveryFee: Number(defaultDeliveryFee),
          pricePerKm: Number(pricePerKm),
          freeDeliveryEnabled,
          freeDeliveryThreshold: parsedThreshold,
          maxDeliveryRadiusKm: Number(maxDeliveryRadiusKm),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSavedSuccess(true);
        window.dispatchEvent(
          new CustomEvent("delivery-settings-updated", {
            detail: {
              freeDeliveryEnabled,
              freeDeliveryThreshold: parsedThreshold,
            },
          })
        );
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        setErrorMessage(json.error || "Failed to update delivery pricing rules");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "An error occurred while saving rules.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveThreshold = () => {
    setFreeDeliveryEnabled(false);
  };

  const handleEnableFreeDelivery = () => {
    setFreeDeliveryEnabled(true);
    if (!freeDeliveryThreshold || Number(freeDeliveryThreshold) <= 0) {
      setFreeDeliveryThreshold(350);
    }
  };

  // Calculated Preview
  const numericThreshold = Number(freeDeliveryThreshold) || 0;
  const isFree =
    freeDeliveryEnabled && numericThreshold > 0 && testOrderSubtotal >= numericThreshold;

  const baseCalculatedFee = defaultDeliveryFee + Math.max(0, testDistance - 3) * pricePerKm;
  const calculatedFee = isFree ? 0 : baseCalculatedFee;

  const quickPresets = [150, 250, 350, 500];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Delivery Pricing & Distance Rules"
        subtitle="Configure base dispatch fees, per-km distance rates, and free delivery thresholds that sync across the store"
        breadcrumbs={[
          { label: "Delivery", href: "/admin/delivery" },
          { label: "Pricing Rules" },
        ]}
      />

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center justify-between font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Delivery pricing rules &amp; free delivery configuration saved and synced storewide!
            </span>
          </div>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Live in DB</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-2xl flex items-center gap-2.5 font-bold shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Pricing Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-neutral-800 shadow-xs space-y-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-neutral-100">
                  Pricing Engine Parameters
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 font-medium">
                  Define dispatch parameters and distance surge calculations
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Base Fee */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-neutral-300 block">
                Base Delivery Fee (GH₵)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  GH₵
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={defaultDeliveryFee}
                  onChange={(e) => setDefaultDeliveryFee(parseFloat(e.target.value) || 0)}
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 rounded-xl font-bold text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 dark:text-neutral-500 block">
                Base flat dispatch fee applied to all deliveries within the first 3km radius
              </span>
            </div>

            {/* Distance Rate */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-neutral-300 block">
                Distance Rate (GH₵ per km)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  GH₵
                </span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(parseFloat(e.target.value) || 0)}
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 rounded-xl font-bold text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 dark:text-neutral-500 block">
                Additional cost added per kilometer beyond the initial 3km threshold
              </span>
            </div>

            {/* ─── Free Delivery Feature Configuration Card ──────────── */}
            <div className="pt-2">
              <div
                className={`rounded-2xl p-5 border transition-all space-y-4 ${
                  freeDeliveryEnabled
                    ? "bg-gradient-to-br from-blue-50/60 to-emerald-50/40 dark:from-blue-950/20 dark:to-emerald-950/20 border-blue-200/80 dark:border-blue-800/60 shadow-2xs"
                    : "bg-slate-50/80 dark:bg-neutral-800/40 border-slate-200 dark:border-neutral-800 opacity-90"
                }`}
              >
                {/* Header with Switch */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        freeDeliveryEnabled
                          ? "bg-blue-600 text-white shadow-xs shadow-blue-600/30"
                          : "bg-slate-200 dark:bg-neutral-700 text-slate-500 dark:text-neutral-400"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-xs text-slate-900 dark:text-neutral-100">
                          Free Delivery Feature
                        </h4>
                        {freeDeliveryEnabled ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                            Active (≥ {formatCurrency(numericThreshold)})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                            Threshold Removed / Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                        {freeDeliveryEnabled
                          ? "Waive customer delivery fees when cart subtotal meets or exceeds threshold"
                          : "Free delivery is currently turned off. Standard delivery fees apply to all orders."}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={freeDeliveryEnabled}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleEnableFreeDelivery();
                        } else {
                          handleRemoveThreshold();
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Body: Active Input vs Disabled Notice */}
                {freeDeliveryEnabled ? (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 dark:text-neutral-300">
                          Free Delivery Order Threshold (GH₵)
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveThreshold}
                          className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove Threshold</span>
                        </button>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          GH₵
                        </span>
                        <input
                          type="number"
                          min="1"
                          step="5"
                          value={freeDeliveryThreshold}
                          onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                          placeholder="e.g. 350"
                          className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-800/80 rounded-xl font-black text-slate-900 dark:text-neutral-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                        Quick Preset Amounts:
                      </span>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {quickPresets.map((preset) => {
                          const isSelected = numericThreshold === preset;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setFreeDeliveryThreshold(preset)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-neutral-750 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700"
                              }`}
                            >
                              GH₵ {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800/90 border border-slate-200 dark:border-neutral-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-300 text-xs">
                      <Info className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        Threshold is disabled. Customers will pay full delivery fees regardless of order amount.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleEnableFreeDelivery}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shrink-0 transition-colors cursor-pointer"
                    >
                      Enable Threshold
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Max Radius */}
            <div className="space-y-1.5 pt-2">
              <label className="font-bold text-slate-700 dark:text-neutral-300 block">
                Max Delivery Service Radius (km)
              </label>
              <input
                type="number"
                min="1"
                value={maxDeliveryRadiusKm}
                onChange={(e) => setMaxDeliveryRadiusKm(parseFloat(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700 rounded-xl font-bold text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:bg-white dark:focus:bg-neutral-800 focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-400 dark:text-neutral-500 block">
                Furthest straight-line distance serviced from the warehouse hub in East Legon
              </span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-neutral-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Syncs in real-time with Cart, Checkout, and AI Chatbot</span>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Rules...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Pricing Rules</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Live Rate Simulator */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-400" />
              <h3 className="font-black text-sm text-white">Live Delivery Rate Simulator</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60">
              Interactive Test
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400 font-bold">Simulated Distance</label>
                <span className="font-mono font-black text-blue-400 text-sm">
                  {testDistance} km
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={Math.max(50, maxDeliveryRadiusKm)}
                step="0.5"
                value={testDistance}
                onChange={(e) => setTestDistance(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5 font-mono">
                <span>1 km</span>
                <span>{Math.max(50, maxDeliveryRadiusKm)} km</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Simulated Cart Subtotal (GH₵)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                  GH₵
                </span>
                <input
                  type="number"
                  min="0"
                  value={testOrderSubtotal}
                  onChange={(e) => setTestOrderSubtotal(parseFloat(e.target.value) || 0)}
                  className="w-full pl-12 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white font-bold focus:outline-hidden focus:border-blue-400"
                />
              </div>
            </div>

            {/* Calculated Breakdown Card */}
            <div className="p-4.5 bg-slate-800/70 rounded-2xl border border-slate-700/80 space-y-3 mt-4">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Base Dispatch (first 3km):</span>
                <span className="text-white font-bold">{formatCurrency(defaultDeliveryFee)}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  Distance Surge ({Math.max(0, testDistance - 3).toFixed(1)}km @ {formatCurrency(pricePerKm)}/km):
                </span>
                <span className="text-white font-bold">
                  +{formatCurrency(Math.max(0, testDistance - 3) * pricePerKm)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-400">
                <span>Free Delivery Promotion:</span>
                {freeDeliveryEnabled ? (
                  isFree ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Qualified (≥ {formatCurrency(numericThreshold)})
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium">
                      Need +{formatCurrency(Math.max(0, numericThreshold - testOrderSubtotal))} more
                    </span>
                  )
                ) : (
                  <span className="text-slate-500 italic">Threshold Disabled</span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-700 flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-xs text-slate-300 block">Calculated Delivery Fee</span>
                  <span className="text-[10px] text-slate-500">Charged to customer at checkout</span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-lg font-black block ${
                      isFree ? "text-emerald-400" : "text-blue-400"
                    }`}
                  >
                    {isFree ? "FREE (GH₵ 0.00)" : formatCurrency(calculatedFee)}
                  </span>
                  {isFree && (
                    <span className="text-[10px] text-emerald-400 font-semibold block">
                      100% Discount Applied
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

