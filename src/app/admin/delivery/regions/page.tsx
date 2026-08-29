"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCurrency } from "@/lib/constants";

interface QuantityRule {
  minPacks: number;
  maxPacks: number | null;
  fee: number;
  label?: string;
}

interface Region {
  _id: string;
  name: string;
  code: string;
  isEnabled: boolean;
  baseFee: number;
  estimatedDeliveryTime: string;
  quantityRules: QuantityRule[];
  notes?: string;
}

interface EditingState {
  baseFee: number;
  estimatedDeliveryTime: string;
  isEnabled: boolean;
  notes: string;
  quantityRules: QuantityRule[];
}

function RuleRow({
  rule,
  index,
  onChange,
  onDelete,
}: {
  rule: QuantityRule;
  index: number;
  onChange: (i: number, r: QuantityRule) => void;
  onDelete: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
      <div>
        <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Min Packs</label>
        <input
          type="number"
          min={1}
          value={rule.minPacks}
          onChange={(e) => onChange(index, { ...rule, minPacks: parseInt(e.target.value) || 1 })}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
      <div>
        <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Max Packs (blank = ∞)</label>
        <input
          type="number"
          min={1}
          value={rule.maxPacks ?? ""}
          placeholder="∞"
          onChange={(e) =>
            onChange(index, { ...rule, maxPacks: e.target.value ? parseInt(e.target.value) : null })
          }
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
      <div>
        <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Fee (₵)</label>
        <input
          type="number"
          min={0}
          value={rule.fee}
          onChange={(e) => onChange(index, { ...rule, fee: parseFloat(e.target.value) || 0 })}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>
      <button
        onClick={() => onDelete(index)}
        className="mt-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function AdminDeliveryRegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/delivery/regions");
      const json = await res.json();
      if (json.success) setRegions(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const startEdit = (region: Region) => {
    setEditingId(region._id);
    setEditState({
      baseFee: region.baseFee,
      estimatedDeliveryTime: region.estimatedDeliveryTime,
      isEnabled: region.isEnabled,
      notes: region.notes || "",
      quantityRules: region.quantityRules.map((r) => ({ ...r })),
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState(null);
    setError(null);
  };

  const saveEdit = async (region: Region) => {
    if (!editState) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/delivery/regions/${region._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editState),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setRegions((prev) =>
        prev.map((r) => (r._id === region._id ? { ...r, ...editState } : r))
      );
      cancelEdit();
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (region: Region) => {
    try {
      await fetch(`/api/admin/delivery/regions/${region._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !region.isEnabled }),
      });
      setRegions((prev) =>
        prev.map((r) => (r._id === region._id ? { ...r, isEnabled: !r.isEnabled } : r))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const addRule = () => {
    if (!editState) return;
    setEditState({
      ...editState,
      quantityRules: [...editState.quantityRules, { minPacks: 1, maxPacks: null, fee: 0 }],
    });
  };

  const updateRule = (index: number, rule: QuantityRule) => {
    if (!editState) return;
    const rules = [...editState.quantityRules];
    rules[index] = rule;
    setEditState({ ...editState, quantityRules: rules });
  };

  const deleteRule = (index: number) => {
    if (!editState) return;
    const rules = [...editState.quantityRules];
    rules.splice(index, 1);
    setEditState({ ...editState, quantityRules: rules });
  };

  const greaterAccra = regions.find((r) => r.name === "Greater Accra");
  const otherRegions = regions.filter((r) => r.name !== "Greater Accra");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Regions"
        subtitle="Manage delivery fees and availability for each Ghana region"
        breadcrumbs={[
          { label: "Delivery", href: "/admin/delivery" },
          { label: "Regions" },
        ]}
        actions={
          <button
            onClick={fetchRegions}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Greater Accra — special note */}
      {greaterAccra && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-sm text-blue-900">Greater Accra</span>
            <StatusBadge status="ACTIVE" />
          </div>
          <p className="text-xs text-blue-700">
            Greater Accra uses <strong>zone-based pricing</strong>. Configure zones and their fees in{" "}
            <a href="/admin/delivery/zones" className="underline font-semibold">
              Delivery Zones
            </a>
            . The region fee here does not apply.
          </p>
        </div>
      )}

      {/* Other regions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-sm text-slate-900">All Ghana Regions</h2>
          <span className="text-xs text-slate-400">
            {regions.filter((r) => r.isEnabled).length} / {regions.length} enabled
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading regions…</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {otherRegions.map((region) => {
              const isEditing = editingId === region._id;

              return (
                <div key={region._id} className="p-4 sm:p-5">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{region.name}</span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                        {region.code}
                      </span>
                      {region.isEnabled ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                          <XCircle className="w-2.5 h-2.5" /> Disabled
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <>
                          <button
                            onClick={() => quickToggle(region)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                              region.isEnabled
                                ? "border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {region.isEnabled ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => startEdit(region)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {isEditing && (
                        <>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => saveEdit(region)}
                            disabled={saving}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            <Save className="w-3 h-3" />
                            {saving ? "Saving…" : "Save"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Display mode */}
                  {!isEditing && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>
                        Base fee:{" "}
                        <strong className="text-slate-800">{formatCurrency(region.baseFee)}</strong>
                      </span>
                      <span>•</span>
                      <span>{region.estimatedDeliveryTime}</span>
                      {region.quantityRules.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-purple-600 font-semibold">
                            {region.quantityRules.length} quantity tier{region.quantityRules.length !== 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Edit mode */}
                  {isEditing && editState && (
                    <div className="mt-3 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                            Base Fee (₵)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={editState.baseFee}
                            onChange={(e) =>
                              setEditState({ ...editState, baseFee: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                            Estimated Delivery Time
                          </label>
                          <input
                            type="text"
                            value={editState.estimatedDeliveryTime}
                            onChange={(e) =>
                              setEditState({ ...editState, estimatedDeliveryTime: e.target.value })
                            }
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                            placeholder="e.g. 1–2 business days"
                          />
                        </div>
                      </div>

                      {/* Quantity rules */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] text-slate-400 font-semibold">
                            QUANTITY TIER PRICING (optional — overrides base fee)
                          </label>
                          <button
                            onClick={addRule}
                            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Tier
                          </button>
                        </div>
                        {editState.quantityRules.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            No tiers — base fee applies to all pack quantities.
                          </p>
                        ) : (
                          <div className="space-y-2 bg-slate-50 rounded-xl p-3">
                            {editState.quantityRules.map((rule, i) => (
                              <RuleRow
                                key={i}
                                rule={rule}
                                index={i}
                                onChange={updateRule}
                                onDelete={deleteRule}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                          Notes (internal)
                        </label>
                        <input
                          type="text"
                          value={editState.notes}
                          onChange={(e) => setEditState({ ...editState, notes: e.target.value })}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                          placeholder="Optional notes"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
