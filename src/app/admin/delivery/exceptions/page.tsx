"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { formatCurrency } from "@/lib/constants";

interface DeliveryException {
  _id: string;
  name: string;
  areas: string[];
  fee: number;
  priority: number;
  isActive: boolean;
  notes?: string;
}

const emptyForm = {
  name: "",
  areas: "",
  fee: "",
  priority: "50",
  isActive: true,
  notes: "",
};

export default function AdminDeliveryExceptionsPage() {
  const [exceptions, setExceptions] = useState<DeliveryException[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExceptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/delivery/exceptions");
      const json = await res.json();
      if (json.success) setExceptions(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  };

  const openEdit = (exc: DeliveryException) => {
    setForm({
      name: exc.name,
      areas: exc.areas.join(", "),
      fee: String(exc.fee),
      priority: String(exc.priority),
      isActive: exc.isActive,
      notes: exc.notes || "",
    });
    setEditingId(exc._id);
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.fee) {
      setError("Name and fee are required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      areas: form.areas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      fee: parseFloat(form.fee),
      priority: parseInt(form.priority) || 50,
      isActive: form.isActive,
      notes: form.notes,
    };

    try {
      const url = editingId
        ? `/api/admin/delivery/exceptions/${editingId}`
        : "/api/admin/delivery/exceptions";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      await fetchExceptions();
      closeForm();
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exception?")) return;
    try {
      await fetch(`/api/admin/delivery/exceptions/${id}`, { method: "DELETE" });
      setExceptions((prev) => prev.filter((e) => e._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (exc: DeliveryException) => {
    try {
      await fetch(`/api/admin/delivery/exceptions/${exc._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !exc.isActive }),
      });
      setExceptions((prev) =>
        prev.map((e) => (e._id === exc._id ? { ...e, isActive: !e.isActive } : e))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Exceptions"
        subtitle="Override delivery fees for specific areas — checked before zones and regions"
        breadcrumbs={[
          { label: "Delivery", href: "/admin/delivery" },
          { label: "Exceptions" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchExceptions}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Exception
            </button>
          </div>
        }
      />

      {/* Priority explanation */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <strong>Exceptions are checked first</strong> — before zones and regional pricing. If a
          customer's area matches an exception, its fee is used regardless of their zone. Higher
          priority exceptions are evaluated first.
        </div>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900">
              {editingId ? "Edit Exception" : "New Exception"}
            </h3>
            <button onClick={closeForm} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                Exception Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Airport Residential VIP"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                Areas (comma-separated) *
              </label>
              <input
                type="text"
                value={form.areas}
                onChange={(e) => setForm({ ...form, areas: e.target.value })}
                placeholder="e.g. Airport Residential, Airport Hills, Aviation Social Club"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Customer area must match one of these names (case-insensitive, partial match).
              </p>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                Override Fee (₵) *
              </label>
              <input
                type="number"
                min={0}
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: e.target.value })}
                placeholder="20"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                Priority (higher = checked first)
              </label>
              <input
                type="number"
                min={1}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                Notes (internal)
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Why this exception exists"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="exc-active"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="exc-active" className="text-xs text-slate-700 font-semibold cursor-pointer">
                Active (exception is applied during checkout)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={closeForm}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-sm text-slate-900">
            Exceptions
            <span className="ml-2 text-xs font-medium text-slate-400">
              ({exceptions.filter((e) => e.isActive).length} active)
            </span>
          </h2>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
            <ArrowUpDown className="w-3 h-3" /> sorted by priority
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading…</div>
        ) : exceptions.length === 0 ? (
          <div className="p-8 text-center">
            <Zap className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No exceptions configured</p>
            <p className="text-xs text-slate-300 mt-1">
              Add an exception to override pricing for specific areas
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {exceptions.map((exc) => (
              <div key={exc._id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900">{exc.name}</span>
                      {exc.isActive ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                          <XCircle className="w-2.5 h-2.5" /> Disabled
                        </span>
                      )}
                      <span className="text-[10px] font-mono bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                        priority: {exc.priority}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {exc.areas.map((area) => (
                        <span
                          key={area}
                          className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md"
                        >
                          {area}
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-slate-500">
                      Fee:{" "}
                      <strong className="text-slate-900">{formatCurrency(exc.fee)}</strong>
                      {exc.notes && (
                        <>
                          {" "}· <span className="italic text-slate-400">{exc.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(exc)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                        exc.isActive
                          ? "border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {exc.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => openEdit(exc)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(exc._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
