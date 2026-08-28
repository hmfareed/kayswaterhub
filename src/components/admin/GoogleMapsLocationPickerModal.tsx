"use client";

import React, { useState } from "react";
import {
  X,
  MapPin,
  Search,
  ExternalLink,
  LocateFixed,
  Compass,
  Check,
  Navigation,
  Globe,
} from "lucide-react";

export interface Coordinates {
  lat: number;
  lng: number;
}

interface GoogleMapsLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat: number;
  initialLng: number;
  initialAddress?: string;
  onSelectLocation: (coords: Coordinates, resolvedAddress?: string) => void;
  title?: string;
}

// Major Accra & Ghana landmarks for quick searching
const GHANA_LANDMARKS = [
  { name: "East Legon (ANC Mall & Boundary Rd)", area: "East Legon", lat: 5.6356, lng: -0.1601 },
  { name: "Airport Residential (Kotoka Int'l)", area: "Airport", lat: 5.6052, lng: -0.1668 },
  { name: "Cantonments (US Embassy & Prime)", area: "Cantonments", lat: 5.5789, lng: -0.1689 },
  { name: "Spintex Road (Batsonaa & Manet)", area: "Spintex", lat: 5.6300, lng: -0.0980 },
  { name: "Osu (Oxford Street & Danquah Circle)", area: "Osu", lat: 5.5560, lng: -0.1820 },
  { name: "Dzorwulu & Roman Ridge", area: "Dzorwulu", lat: 5.6100, lng: -0.1980 },
  { name: "Madina & Zongo Junction", area: "Madina", lat: 5.6680, lng: -0.1650 },
  { name: "Adenta & Barrier Corridor", area: "Adenta", lat: 5.7100, lng: -0.1600 },
  { name: "Tema Community 1–12 Central", area: "Tema", lat: 5.6698, lng: -0.0166 },
  { name: "Achimota & Dome Roundabout", area: "Achimota", lat: 5.6200, lng: -0.2300 },
  { name: "Dansoman & West Accra", area: "Dansoman", lat: 5.5350, lng: -0.2700 },
  { name: "Legon (University of Ghana Campus)", area: "Legon", lat: 5.6508, lng: -0.1870 },
];

export function GoogleMapsLocationPickerModal({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialAddress = "",
  onSelectLocation,
  title = "Select GPS Location on Map",
}: GoogleMapsLocationPickerModalProps) {
  const [selectedLat, setSelectedLat] = useState<number>(initialLat || 5.6356);
  const [selectedLng, setSelectedLng] = useState<number>(initialLng || -0.1601);
  const [searchQuery, setSearchQuery] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState(initialAddress);

  if (!isOpen) return null;

  const filteredLandmarks = GHANA_LANDMARKS.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLandmark = (l: typeof GHANA_LANDMARKS[0]) => {
    setSelectedLat(l.lat);
    setSelectedLng(l.lng);
    setResolvedAddress(l.name);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSelectedLat(parseFloat(pos.coords.latitude.toFixed(6)));
          setSelectedLng(parseFloat(pos.coords.longitude.toFixed(6)));
          setResolvedAddress("Current Browser GPS Location");
        },
        (err) => {
          alert("Could not detect browser location: " + err.message);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  const handleConfirm = () => {
    onSelectLocation({ lat: selectedLat, lng: selectedLng }, resolvedAddress);
    onClose();
  };

  const googleMapsExternalUrl = `https://www.google.com/maps?q=${selectedLat},${selectedLng}`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 transition-opacity"
      />

      {/* Modal Card */}
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 max-w-2xl w-full bg-white rounded-3xl shadow-2xl z-50 flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 leading-tight">{title}</h3>
              <p className="text-xs text-slate-400 font-medium">
                Set exact GPS coordinates & visual location for delivery calculations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Location Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search area, landmark or neighborhood in Accra..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
              title="Detect current device coordinates"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My GPS</span>
            </button>
          </div>

          {/* Quick presets pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {GHANA_LANDMARKS.slice(0, 6).map((l) => (
              <button
                key={l.name}
                type="button"
                onClick={() => handleSelectLandmark(l)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedLat === l.lat && selectedLng === l.lng
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {l.area}
              </button>
            ))}
          </div>
        </div>

        {/* Map Preview & Coordinate Controller */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Interactive Visual Map Preview Simulation */}
          <div className="relative w-full h-56 rounded-2xl bg-slate-900 overflow-hidden border border-slate-200 shadow-inner flex flex-col justify-between p-4">
            {/* Map Grid Pattern Graphic */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Top Badge: Current Target */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-xl text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 shadow-md">
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                <span>{resolvedAddress || "Selected GPS Point"}</span>
              </div>

              {/* External Google Maps Button */}
              <a
                href={googleMapsExternalUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-white/90 hover:bg-white text-slate-900 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open Google Maps</span>
                <ExternalLink className="w-3 h-3 text-purple-600" />
              </a>
            </div>

            {/* Centered Map Pin Graphic */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto">
              <div className="w-10 h-10 rounded-full bg-purple-600/30 animate-ping absolute"></div>
              <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xl border-2 border-white relative z-10">
                <MapPin className="w-5 h-5 fill-current" />
              </div>
              <div className="bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black text-slate-800 mt-2 shadow-md">
                {selectedLat.toFixed(4)}, {selectedLng.toFixed(4)}
              </div>
            </div>

            {/* Bottom info */}
            <div className="relative z-10 text-center">
              <span className="text-[10px] text-slate-400 font-semibold">
                Accra Metropolitan Area • Ghana Standard Grid
              </span>
            </div>
          </div>

          {/* Coordinates Inputs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Latitude (Lat)</label>
              <input
                type="number"
                step="0.000001"
                value={selectedLat}
                onChange={(e) => setSelectedLat(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Longitude (Lng)</label>
              <input
                type="number"
                step="0.000001"
                value={selectedLng}
                onChange={(e) => setSelectedLng(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>
          </div>

          {/* Matching Areas List */}
          {searchQuery && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Found Locations ({filteredLandmarks.length})
              </span>
              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto rounded-xl border border-slate-100">
                {filteredLandmarks.map((l) => (
                  <div
                    key={l.name}
                    onClick={() => handleSelectLandmark(l)}
                    className="p-2.5 hover:bg-purple-50 text-xs flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{l.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {l.lat}, {l.lng}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Check className="w-4 h-4" />
            <span>Apply Selected Coordinates</span>
          </button>
        </div>
      </div>
    </>
  );
}
