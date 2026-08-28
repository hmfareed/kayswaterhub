"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Save,
  Compass,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LocateFixed,
  Map,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { GoogleMapsLocationPickerModal } from "@/components/admin/GoogleMapsLocationPickerModal";

export default function StoreLocationPage() {
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [businessName, setBusinessName] = useState("Khady's Water Hub & Warehouse");
  const [address, setAddress] = useState("East Legon, Boundary Road, Accra");
  const [region, setRegion] = useState("Greater Accra");
  const [city, setCity] = useState("Accra");
  const [lat, setLat] = useState(5.6356);
  const [lng, setLng] = useState(-0.1601);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(20);
  const [pricePerKm, setPricePerKm] = useState(2.5);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(350);
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState(60);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/delivery/store-location")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const loc = d.data;
          setBusinessName(loc.businessName || "Khady's Water Hub & Warehouse");
          setAddress(loc.address || "East Legon, Boundary Road, Accra");
          setRegion(loc.region || "Greater Accra");
          setCity(loc.city || "Accra");
          if (loc.coordinates) {
            setLat(loc.coordinates.lat || 5.6356);
            setLng(loc.coordinates.lng || -0.1601);
          }
          setDefaultDeliveryFee(loc.defaultDeliveryFee ?? 20);
          setPricePerKm(loc.pricePerKm ?? 2.5);
          setFreeDeliveryThreshold(loc.freeDeliveryThreshold ?? 350);
          setMaxDeliveryRadiusKm(loc.maxDeliveryRadiusKm ?? 60);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        (err) => {
          alert("Could not detect browser location: " + err.message);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/delivery/store-location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          address,
          region,
          city,
          coordinates: { lat: parseFloat(lat.toString()), lng: parseFloat(lng.toString()) },
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
        alert(json.error || "Failed to update location");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Store Origin & GPS Coordinates"
        subtitle="The central warehouse location from which all customer delivery distances and fees are calculated"
        breadcrumbs={[
          { label: "Delivery", href: "/admin/delivery" },
          { label: "Store Location" },
        ]}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2 font-bold shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Store GPS origin location and pricing parameters updated successfully!</span>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
            <h3 className="font-black text-sm text-slate-900">Warehouse Origin Location</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMapPickerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Open Google Maps Picker</span>
              </button>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>Use Device GPS</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700 block">Warehouse / Hub Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700 block">Physical Street Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Region *</label>
              <input
                type="text"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">GPS Latitude *</label>
              <input
                type="number"
                step="0.000001"
                required
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">GPS Longitude *</label>
              <input
                type="number"
                step="0.000001"
                required
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Global Distance Pricing Controls */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-black text-sm text-slate-900">Default Distance Pricing Engine</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Base Delivery Fee (GH₵)</label>
              <input
                type="number"
                min="0"
                value={defaultDeliveryFee}
                onChange={(e) => setDefaultDeliveryFee(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Additional Fee per Kilometer (GH₵/km)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={pricePerKm}
                onChange={(e) => setPricePerKm(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Free Delivery Order Threshold (GH₵)</label>
              <input
                type="number"
                min="0"
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Maximum Delivery Radius (km)</label>
              <input
                type="number"
                min="1"
                value={maxDeliveryRadiusKm}
                onChange={(e) => setMaxDeliveryRadiusKm(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving Origin..." : "Save Store GPS Location"}</span>
          </button>
        </div>
      </form>

      {/* Google Maps Location Picker Modal */}
      <GoogleMapsLocationPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={lat}
        initialLng={lng}
        initialAddress={address}
        onSelectLocation={(coords, resolvedAddr) => {
          setLat(coords.lat);
          setLng(coords.lng);
          if (resolvedAddr && resolvedAddr !== "Current Browser GPS Location") {
            setAddress(resolvedAddr);
          }
        }}
        title="Select Warehouse Origin on Google Maps"
      />
    </div>
  );
}
