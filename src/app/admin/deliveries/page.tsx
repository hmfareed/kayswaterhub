"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  Plus,
  Save,
  Navigation,
  Loader2,
  CheckCircle2,
  Clock,
  Layers,
  Settings as SettingsIcon,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { formatCurrency, GHANA_REGIONS } from "@/lib/constants";

interface StoreLocationConfig {
  businessName: string;
  address: string;
  region: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  defaultDeliveryFee: number;
  pricePerKm: number;
  freeDeliveryThreshold: number;
  maxDeliveryRadiusKm: number;
}

interface DeliveryZoneItem {
  _id?: string;
  name: string;
  region: string;
  areas: string[];
  pricingType: "FLAT" | "DISTANCE_BASED" | "ZONE_BASED";
  deliveryFee: number;
  pricePerKm?: number;
  includedDistanceKm?: number;
  radiusKm?: number;
  maxDistanceKm?: number;
  priority?: number;
  estimatedDeliveryTime: string;
  isActive: boolean;
  minimumOrder?: number;
  freeDeliveryThreshold?: number;
}

export default function AdminDeliveriesPage() {
  const [activeTab, setActiveTab] = useState<"ZONES" | "STORE" | "ORDERS">("ZONES");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Store Location State
  const [storeLocation, setStoreLocation] = useState<StoreLocationConfig>({
    businessName: "Khady's Water Hub & Warehouse",
    address: "East Legon, Boundary Road, Accra",
    region: "Greater Accra",
    city: "Accra",
    coordinates: { lat: 5.6356, lng: -0.1601 },
    defaultDeliveryFee: 20,
    pricePerKm: 2.5,
    freeDeliveryThreshold: 350,
    maxDeliveryRadiusKm: 60,
  });

  // Zones State
  const [zones, setZones] = useState<DeliveryZoneItem[]>([]);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [newZone, setNewZone] = useState<DeliveryZoneItem>({
    name: "",
    region: "Greater Accra",
    areas: [],
    pricingType: "DISTANCE_BASED",
    deliveryFee: 20,
    pricePerKm: 2.5,
    includedDistanceKm: 3,
    radiusKm: 10,
    maxDistanceKm: 60,
    priority: 15,
    estimatedDeliveryTime: "1–2 hours",
    isActive: true,
    minimumOrder: 40,
    freeDeliveryThreshold: 350,
  });
  const [areaInput, setAreaInput] = useState("");

  // Fetch Delivery Data on mount
  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const fetchDeliveryData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/delivery/zones");
      const json = await res.json();
      if (json.success && json.data) {
        setZones(json.data.zones || []);
        if (json.data.storeLocation) {
          setStoreLocation(json.data.storeLocation);
        }
      }
    } catch (e) {
      console.error("Failed to load delivery settings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Detect Admin Store GPS
  const handleDetectStoreGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStoreLocation((prev) => ({
          ...prev,
          coordinates: {
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
          },
        }));
        setSuccessMessage("GPS coordinates updated from your device.");
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      (err) => {
        alert("Failed to get current GPS location: " + err.message);
      }
    );
  };

  // Save Store Location Settings
  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/delivery/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeLocation),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Store delivery settings saved successfully.");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Create new delivery zone
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/delivery/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newZone),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddZoneModal(false);
        setNewZone({
          name: "",
          region: "Greater Accra",
          areas: [],
          pricingType: "DISTANCE_BASED",
          deliveryFee: 20,
          pricePerKm: 2.5,
          includedDistanceKm: 3,
          radiusKm: 10,
          maxDistanceKm: 60,
          priority: 15,
          estimatedDeliveryTime: "1–2 hours",
          isActive: true,
          minimumOrder: 40,
          freeDeliveryThreshold: 350,
        });
        setAreaInput("");
        fetchDeliveryData();
      }
    } catch (err) {
      console.error("Error creating zone:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAreaTag = () => {
    if (areaInput.trim() && !newZone.areas.includes(areaInput.trim())) {
      setNewZone({ ...newZone, areas: [...newZone.areas, areaInput.trim()] });
      setAreaInput("");
    }
  };

  const handleRemoveAreaTag = (tag: string) => {
    setNewZone({ ...newZone, areas: newZone.areas.filter((a) => a !== tag) });
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Delivery & Logistics Hub</h2>
          <p className="text-xs text-slate-400">
            Configure GPS warehouse coordinates, zone radius rules, distance pricing & coverage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("ZONES")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ZONES"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Delivery Zones ({zones.length})
          </button>
          <button
            onClick={() => setActiveTab("STORE")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "STORE"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Store GPS & Pricing
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ─── TAB 1: DELIVERY ZONES ────────────────────────────────────────── */}
      {activeTab === "ZONES" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Active geographical delivery zones with automatic priority resolution
            </div>
            <button
              onClick={() => setShowAddZoneModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Zone</span>
            </button>
          </div>

          {/* Zones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {zones.map((zone, idx) => (
              <div
                key={zone._id || idx}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 block">
                        {zone.region}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">{zone.name}</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                      {zone.pricingType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Base Fee</span>
                      <span className="font-black text-slate-900">{formatCurrency(zone.deliveryFee)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Rate / Km</span>
                      <span className="font-black text-slate-900">{zone.pricePerKm ? `${formatCurrency(zone.pricePerKm)}/km` : "Fixed"}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Radius:</span>
                      <span className="font-bold text-slate-800">{zone.radiusKm ? `${zone.radiusKm} km` : "Whole Region"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Est. Time:</span>
                      <span className="font-bold text-slate-800">{zone.estimatedDeliveryTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Min. Order:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(zone.minimumOrder || 0)}</span>
                    </div>
                  </div>

                  {zone.areas && zone.areas.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">Covered Areas</span>
                      <div className="flex flex-wrap gap-1">
                        {zone.areas.slice(0, 5).map((a, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-700">
                            {a}
                          </span>
                        ))}
                        {zone.areas.length > 5 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-bold">
                            +{zone.areas.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Priority: {zone.priority || 10}</span>
                  <span className="font-bold text-emerald-600">● Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: STORE LOCATION & PRICING SETTINGS ─────────────────────── */}
      {activeTab === "STORE" && (
        <form onSubmit={handleSaveStoreSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 max-w-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-black text-base text-slate-900">Warehouse Origin & Distance Pricing Engine</h3>
              <p className="text-xs text-slate-400">All customer delivery distances are calculated from this GPS origin point</p>
            </div>

            <button
              type="button"
              onClick={handleDetectStoreGps}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Use Current GPS</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Warehouse / Hub Name</label>
                <input
                  type="text"
                  required
                  value={storeLocation.businessName}
                  onChange={(e) => setStoreLocation({ ...storeLocation, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={storeLocation.address}
                  onChange={(e) => setStoreLocation({ ...storeLocation, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Latitude Coordinate</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={storeLocation.coordinates.lat}
                  onChange={(e) =>
                    setStoreLocation({
                      ...storeLocation,
                      coordinates: { ...storeLocation.coordinates, lat: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Longitude Coordinate</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={storeLocation.coordinates.lng}
                  onChange={(e) =>
                    setStoreLocation({
                      ...storeLocation,
                      coordinates: { ...storeLocation.coordinates, lng: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Base Delivery Fee (GH₵)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={storeLocation.defaultDeliveryFee}
                  onChange={(e) => setStoreLocation({ ...storeLocation, defaultDeliveryFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rate Per Extra Kilometer (GH₵/km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={storeLocation.pricePerKm}
                  onChange={(e) => setStoreLocation({ ...storeLocation, pricePerKm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Free Delivery Threshold (GH₵)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={storeLocation.freeDeliveryThreshold}
                  onChange={(e) => setStoreLocation({ ...storeLocation, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Maximum Delivery Radius (km)</label>
                <input
                  type="number"
                  min="5"
                  required
                  value={storeLocation.maxDeliveryRadiusKm}
                  onChange={(e) => setStoreLocation({ ...storeLocation, maxDeliveryRadiusKm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Delivery Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Modal: Create Zone */}
      {showAddZoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Create New Delivery Zone</h3>
              <button
                onClick={() => setShowAddZoneModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateZone} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accra Central Zone (0–5 km)"
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Region *</label>
                  <select
                    value={newZone.region}
                    onChange={(e) => setNewZone({ ...newZone, region: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-hidden"
                  >
                    {GHANA_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pricing Model *</label>
                  <select
                    value={newZone.pricingType}
                    onChange={(e) => setNewZone({ ...newZone, pricingType: e.target.value as "FLAT" | "DISTANCE_BASED" | "ZONE_BASED" })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-hidden"
                  >
                    <option value="DISTANCE_BASED">Distance Based</option>
                    <option value="FLAT">Flat Fee</option>
                    <option value="ZONE_BASED">Zone Based</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Fee (GH₵)</label>
                  <input
                    type="number"
                    required
                    value={newZone.deliveryFee}
                    onChange={(e) => setNewZone({ ...newZone, deliveryFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rate / Km (GH₵)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newZone.pricePerKm || 0}
                    onChange={(e) => setNewZone({ ...newZone, pricePerKm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Radius (km)</label>
                  <input
                    type="number"
                    value={newZone.radiusKm || ""}
                    onChange={(e) => setNewZone({ ...newZone, radiusKm: parseFloat(e.target.value) || undefined })}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Estimated Delivery Time</label>
                <input
                  type="text"
                  value={newZone.estimatedDeliveryTime}
                  onChange={(e) => setNewZone({ ...newZone, estimatedDeliveryTime: e.target.value })}
                  placeholder="e.g. 45–90 mins"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Covered Sub-Areas (Tag input)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={areaInput}
                    onChange={(e) => setAreaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAreaTag();
                      }
                    }}
                    placeholder="e.g. East Legon (press Add)"
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAreaTag}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {newZone.areas.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                      {a}
                      <button type="button" onClick={() => handleRemoveAreaTag(a)} className="text-blue-400 hover:text-rose-600">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddZoneModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30"
                >
                  {isSaving ? "Saving..." : "Create Zone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
