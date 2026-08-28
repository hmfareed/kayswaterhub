"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Percent,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatCurrency } from "@/lib/constants";

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT" | "FREE_DELIVERY">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState(10);
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(100);
  const [maximumDiscountAmount, setMaximumDiscountAmount] = useState(50);
  const [usageLimit, setUsageLimit] = useState(500);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [isActive, setIsActive] = useState(true);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/promotions");
      const json = await res.json();
      if (json.success) setPromotions(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setCode("");
    setDescription("");
    setDiscountType("PERCENTAGE");
    setDiscountValue(10);
    setMinimumOrderAmount(100);
    setMaximumDiscountAmount(50);
    setUsageLimit(500);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingPromo(p);
    setCode(p.code);
    setDescription(p.description || "");
    setDiscountType(p.discountType);
    setDiscountValue(p.discountValue);
    setMinimumOrderAmount(p.minimumOrderAmount || 0);
    setMaximumDiscountAmount(p.maximumDiscountAmount || 0);
    setUsageLimit(p.usageLimit || 500);
    setEndDate(new Date(p.endDate).toISOString().split("T")[0]);
    setIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/admin/promotions";
      const method = editingPromo ? "PATCH" : "POST";
      const body: any = {
        code,
        description,
        discountType,
        discountValue,
        minimumOrderAmount,
        maximumDiscountAmount: discountType === "PERCENTAGE" ? maximumDiscountAmount : undefined,
        usageLimit,
        endDate: new Date(endDate),
        isActive,
      };
      if (editingPromo) body.id = editingPromo._id;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchPromotions();
      } else {
        alert(json.error || "Failed to save coupon");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/promotions?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) fetchPromotions();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons & Discount Promotions"
        subtitle="Create discount voucher codes, minimum purchase requirements, and free delivery thresholds"
        breadcrumbs={[{ label: "Promotions" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPromotions}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions.map((p) => {
          const isExpired = new Date(p.endDate) < new Date();
          return (
            <div
              key={p._id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg tracking-wider">
                  {p.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    !p.isActive
                      ? "bg-slate-100 text-slate-500 border-slate-200"
                      : isExpired
                      ? "bg-rose-50 text-rose-600 border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {!p.isActive ? "Disabled" : isExpired ? "Expired" : "Active"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xl font-black text-slate-900">
                  {p.discountType === "PERCENTAGE"
                    ? `${p.discountValue}% OFF`
                    : p.discountType === "FIXED_AMOUNT"
                    ? `GH₵${p.discountValue} OFF`
                    : "FREE DELIVERY"}
                </div>
                <p className="text-xs text-slate-500 font-medium">{p.description || "No description."}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                <div>
                  <span className="text-[10px] text-slate-400 block">Min. Order</span>
                  <span className="text-slate-800">{formatCurrency(p.minimumOrderAmount || 0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Redemptions</span>
                  <span className="text-slate-800">
                    {p.usageCount} / {p.usageLimit || "∞"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>Expires {new Date(p.endDate).toLocaleDateString()}</span>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1 text-slate-400 hover:text-blue-600"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id, p.code)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingPromo ? "Edit Coupon" : "Create New Coupon"}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER20"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (GH₵)</option>
                    <option value="FREE_DELIVERY">Free Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min. Order Amount (GH₵)</label>
                  <input
                    type="number"
                    min="0"
                    value={minimumOrderAmount}
                    onChange={(e) => setMinimumOrderAmount(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Tagline</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 10% discount on all bottled water packs"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Active & Valid for Customers</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-600/30"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
