"use client";

import React, { useState, useEffect } from "react";
import {
  Map,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCurrency } from "@/lib/constants";
import { GoogleMapsLocationPickerModal } from "@/components/admin/GoogleMapsLocationPickerModal";

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [zoneLat, setZoneLat] = useState(5.6356);
  const [zoneLng, setZoneLng] = useState(-0.1601);

  const [name, setName] = useState("");
  const [zoneType, setZoneType] = useState<"RADIUS" | "POLYGON" | "REGION">("RADIUS");
  const [radiusKm, setRadiusKm] = useState(10);
  const [baseFee, setBaseFee] = useState(25);
  const [pricePerKm, setPricePerKm] = useState(2.0);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState("1–2 hours");
  const [priority, setPriority] = useState(1);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);

  const fetchZones = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/delivery/zones");
      const json = await res.json();
      if (json.success) setZones(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleOpenCreate = () => {
    setEditingZone(null);
    setName("");
    setZoneType("RADIUS");
    setRadiusKm(10);
    setBaseFee(25);
    setPricePerKm(2.0);
    setEstimatedDeliveryTime("1–2 hours");
    setPriority(zones.length + 1);
    setFreeDeliveryThreshold(undefined);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (z: any) => {
    setEditingZone(z);
    setName(z.name);
    setZoneType(z.zoneType || "RADIUS");
    setRadiusKm(z.radiusKm || 10);
    setBaseFee(z.baseFee || 25);
    setPricePerKm(z.pricePerKm || 0);
    setEstimatedDeliveryTime(z.estimatedDeliveryTime || "1–2 hours");
    setPriority(z.priority || 1);
    setFreeDeliveryThreshold(z.freeDeliveryThreshold);
    setIsActive(z.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/admin/delivery/zones";
      const method = editingZone ? "PATCH" : "POST";
      const body: any = {
        name,
        zoneType,
        radiusKm: zoneType === "RADIUS" ? radiusKm : undefined,
        baseFee,
        pricePerKm,
        estimatedDeliveryTime,
        priority,
        freeDeliveryThreshold: freeDeliveryThreshold || undefined,
        isActive,
      };
      if (editingZone) body.id = editingZone._id;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchZones();
      } else {
        alert(json.error || "Failed to save zone");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete delivery zone "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/delivery/zones?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) fetchZones();
      else alert(json.error || "Failed to delete zone");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Zones Management"
        subtitle="Configure geo-fenced zones across Accra with custom delivery rates, priority ordering, and turnaround ETAs"
        breadcrumbs={[
          { label: "Delivery", href: "/admin/delivery" },
          { label: "Zones" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchZones}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Zone</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone) => (
          <div
            key={zone._id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 relative group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                  #{zone.priority || 1}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{zone.name}</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {zone.zoneType || "RADIUS"} ZONE
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  zone.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {zone.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Base Rate</span>
                <span className="font-black text-slate-900 text-base">
                  {formatCurrency(zone.baseFee)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Estimated ETA</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  {zone.estimatedDeliveryTime}
                </span>
              </div>
              {zone.radiusKm && (
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Radius Coverage</span>
                  <span className="font-bold text-slate-800">{zone.radiusKm} km</span>
                </div>
              )}
              {zone.freeDeliveryThreshold && (
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Free Delivery Over</span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(zone.freeDeliveryThreshold)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleOpenEdit(zone)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(zone._id, zone.name)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Zone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingZone ? "Edit Delivery Zone" : "New Delivery Zone"}
            </h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Zone Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Zone 1 - East Legon & Airport"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">Zone Center & GPS Point</label>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="text-purple-600 hover:text-purple-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Pick Center on Google Maps</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-mono font-bold">
                    Lat: {zoneLat.toFixed(4)}, Lng: {zoneLng.toFixed(4)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Delivery Fee (GH₵) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={baseFee}
                    onChange={(e) => setBaseFee(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Radius (km)</label>
                  <input
                    type="number"
                    min="1"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Delivery Time *</label>
                  <input
                    type="text"
                    required
                    value={estimatedDeliveryTime}
                    onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
                    placeholder="e.g. 1–2 hours"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority Rank</label>
                  <input
                    type="number"
                    min="1"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Free Delivery Threshold (Optional)</label>
                <input
                  type="number"
                  min="0"
                  value={freeDeliveryThreshold || ""}
                  onChange={(e) => setFreeDeliveryThreshold(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="e.g. 300"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
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
                  <span>Zone is active & selectable for deliveries</span>
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
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Maps Location Picker for Zone */}
      <GoogleMapsLocationPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={zoneLat}
        initialLng={zoneLng}
        initialAddress={name}
        onSelectLocation={(coords, resolvedAddr) => {
          setZoneLat(coords.lat);
          setZoneLng(coords.lng);
          if (resolvedAddr && !name) {
            setName(resolvedAddr);
          }
        }}
        title="Select Delivery Zone Center on Google Maps"
      />
    </div>
  );
}
