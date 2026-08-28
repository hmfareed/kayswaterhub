"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Save,
  CheckCircle2,
  AlertCircle,
  Calculator,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatCurrency } from "@/lib/constants";

export default function DeliveryPricingRulesPage() {
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(20);
  const [pricePerKm, setPricePerKm] = useState(2.5);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(350);
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState(60);

  // Test Calculator
  const [testDistance, setTestDistance] = useState(8.5);
  const [testOrderSubtotal, setTestOrderSubtotal] = useState(200);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/delivery/store-location")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setDefaultDeliveryFee(d.data.defaultDeliveryFee ?? 20);
          setPricePerKm(d.data.pricePerKm ?? 2.5);
          setFreeDeliveryThreshold(d.data.freeDeliveryThreshold ?? 350);
          setMaxDeliveryRadiusKm(d.data.maxDeliveryRadiusKm ?? 60);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/delivery/store-location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultDeliveryFee,
          pricePerKm,
          freeDeliveryThreshold,
          maxDeliveryRadiusKm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert(json.error || "Failed to update pricing");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculated Preview
  const isFree = testOrderSubtotal >= freeDeliveryThreshold;
  const calculatedFee = isFree
    ? 0
    : defaultDeliveryFee + Math.max(0, testDistance - 3) * pricePerKm;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Delivery Pricing & Distance Rules"
        subtitle="Configure the mathematical pricing rules for base dispatch fees, per-km rates, and free shipping triggers"
        breadcrumbs={[
          { label: "Delivery", href: "/admin/delivery" },
          { label: "Pricing Rules" },
        ]}
      />

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2 font-bold shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Delivery pricing rules updated successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pricing Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-sm text-slate-900">Pricing Engine Parameters</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Base Delivery Fee (GH₵)</label>
              <input
                type="number"
                min="0"
                value={defaultDeliveryFee}
                onChange={(e) => setDefaultDeliveryFee(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
              <span className="text-[11px] text-slate-400">Base fee applied to all deliveries within first 3km</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Distance Rate (GH₵ per km)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={pricePerKm}
                onChange={(e) => setPricePerKm(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
              <span className="text-[11px] text-slate-400">Added to base fee for every kilometer beyond 3km</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Free Delivery Cart Threshold (GH₵)</label>
              <input
                type="number"
                min="0"
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
              <span className="text-[11px] text-slate-400">Orders with total equal to or above this get 100% free delivery</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Max Delivery Service Radius (km)</label>
              <input
                type="number"
                min="1"
                value={maxDeliveryRadiusKm}
                onChange={(e) => setMaxDeliveryRadiusKm(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving Rules..." : "Save Pricing Rules"}</span>
            </button>
          </div>
        </form>

        {/* Live Simulator Calculator */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Calculator className="w-4 h-4 text-blue-400" />
            <h3 className="font-black text-sm text-white">Live Delivery Rate Simulator</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Simulated Distance (km)</label>
              <input
                type="range"
                min="1"
                max="50"
                step="0.5"
                value={testDistance}
                onChange={(e) => setTestDistance(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                <span>1 km</span>
                <span className="font-bold text-blue-400">{testDistance} km</span>
                <span>50 km</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Cart Subtotal (GH₵)</label>
              <input
                type="number"
                value={testOrderSubtotal}
                onChange={(e) => setTestOrderSubtotal(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2 mt-4">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Base Fee:</span>
                <span className="text-white font-bold">{formatCurrency(defaultDeliveryFee)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Distance Surge:</span>
                <span className="text-white font-bold">
                  +{formatCurrency(Math.max(0, testDistance - 3) * pricePerKm)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-700">
                <span>Customer Delivery Fee:</span>
                <span className={isFree ? "text-emerald-400" : "text-blue-400"}>
                  {isFree ? "FREE (Threshold met)" : formatCurrency(calculatedFee)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
