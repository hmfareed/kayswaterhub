"use client";

import React, { useState } from "react";
import { X, Radio, ArrowUpRight, Check, AlertCircle } from "lucide-react";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: {
    _id: string;
    productName: string;
    variantName: string;
    stockQuantity: number;
  } | null;
  onSuccess: () => void;
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  variant,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [adjustment, setAdjustment] = useState<number>(10);
  const [reasonType, setReasonType] = useState<"RESTOCK" | "ADJUSTMENT" | "DAMAGED" | "RETURN">("RESTOCK");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !variant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: variant._id,
          adjustment: reasonType === "DAMAGED" ? -Math.abs(adjustment) : adjustment,
          reasonType,
          note,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to adjust stock");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedNewStock = Math.max(
    0,
    variant.stockQuantity + (reasonType === "DAMAGED" ? -Math.abs(adjustment) : adjustment)
  );

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
      />

      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Adjust Product Stock</h3>
              <p className="text-xs text-slate-400 font-medium">{variant.productName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Stock vs New Stock Preview */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">Current Units</span>
              <span className="text-xl font-black text-slate-700">{variant.stockQuantity}</span>
            </div>
            <div className="border-l border-slate-200">
              <span className="text-[11px] font-bold text-blue-600 block">New Units</span>
              <span className="text-xl font-black text-blue-600">{calculatedNewStock}</span>
            </div>
          </div>

          {/* Adjustment Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Reason for Adjustment</label>
            <select
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:bg-white"
            >
              <option value="RESTOCK">Restock (Received warehouse shipment)</option>
              <option value="ADJUSTMENT">Manual Stock Count Correction</option>
              <option value="DAMAGED">Damaged / Expired Packs Removal</option>
              <option value="RETURN">Customer Return / Restock</option>
            </select>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {reasonType === "DAMAGED" ? "Quantity to Deduct" : "Quantity to Add / Adjust"}
            </label>
            <input
              type="number"
              min="1"
              value={adjustment}
              onChange={(e) => setAdjustment(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:bg-white"
              required
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Audit Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Received batch #48 from factory distributor"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:bg-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Confirm Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
