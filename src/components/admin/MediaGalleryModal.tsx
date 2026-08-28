"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Search,
  Image as ImageIcon,
  Camera,
  Upload,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Check,
  Plus,
  Smartphone,
  FolderOpen,
} from "lucide-react";

export interface GalleryImage {
  id: string;
  name: string;
  url: string;
  category: "packs" | "bottles" | "jars" | "brands" | "uploads";
  tag: string;
}

export const SYSTEM_GALLERY_IMAGES: GalleryImage[] = [
  {
    id: "pack-voltic-500",
    name: "Voltic 500ml x 15 Pack",
    url: "/images/products-clean/voltic-pack.png",
    category: "packs",
    tag: "Voltic 500ml",
  },
  {
    id: "pack-bel-aqua-750",
    name: "Bel-Aqua 750ml x 15 Pack",
    url: "/images/products-clean/bel-aqua-pack.png",
    category: "packs",
    tag: "Bel-Aqua 750ml",
  },
  {
    id: "pack-verna-500",
    name: "Verna 500ml x 15 Pack",
    url: "/images/products-clean/verna-500-pack.png",
    category: "packs",
    tag: "Verna 500ml",
  },
  {
    id: "pack-verna-750",
    name: "Verna 750ml x 16 Pack",
    url: "/images/products-clean/verna-750-pack.png",
    category: "packs",
    tag: "Verna 750ml",
  },
  {
    id: "pack-awake-750",
    name: "Awake 750ml x 16 Pack",
    url: "/images/products-clean/awake-pack.png",
    category: "packs",
    tag: "Awake 750ml",
  },
  {
    id: "pack-slemfit-500",
    name: "Slem Fit 500ml x 16 Pack",
    url: "/images/products-clean/slemfit-pack.png",
    category: "packs",
    tag: "Slem Fit 500ml",
  },
  {
    id: "pack-voltic-pocket-350",
    name: "Voltic Pocket 350ml x 15 Pack",
    url: "/images/products-clean/voltic-pocket-pack.png",
    category: "packs",
    tag: "Voltic Pocket 350ml",
  },
  {
    id: "jar-verna-15l",
    name: "Verna Dispenser Jar 15L",
    url: "/images/products-clean/verna-jar-pack.png",
    category: "jars",
    tag: "15L Jar Refill",
  },
];

interface MediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  alreadySelectedUrls?: string[];
}

export function MediaGalleryModal({
  isOpen,
  onClose,
  onSelectImage,
  alreadySelectedUrls = [],
}: MediaGalleryModalProps) {
  const [activeTab, setActiveTab] = useState<
    "phone" | "all" | "packs" | "jars" | "brands" | "custom"
  >("phone");
  const [searchQuery, setSearchQuery] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [userUploadedImages, setUserUploadedImages] = useState<GalleryImage[]>([]);

  // Hidden File Inputs for Phone Gallery and Camera
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        let finalUrl = "";
        if (data.success && data.url) {
          finalUrl = data.url;
        } else {
          // Fallback to Data URL if server upload returns error
          finalUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.readAsDataURL(file);
          });
        }

        const newImage: GalleryImage = {
          id: `upload-${Date.now()}-${i}`,
          name: file.name.replace(/\.[^/.]+$/, "") || "Phone Upload",
          url: finalUrl,
          category: "uploads",
          tag: "Device Upload",
        };

        setUserUploadedImages((prev) => [newImage, ...prev]);
        onSelectImage(finalUrl);
      } catch (err) {
        // Read as base64 on error
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          onSelectImage(url);
        };
        reader.readAsDataURL(file);
      }
    }

    setIsUploading(false);
    onClose();
  };

  const allImages = [...userUploadedImages, ...SYSTEM_GALLERY_IMAGES];

  const filteredImages = allImages.filter((item) => {
    if (activeTab === "phone") return true;
    if (activeTab !== "all" && item.category !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    onSelectImage(customUrl.trim());
    setCustomUrl("");
    onClose();
  };

  const handleSelect = (url: string) => {
    onSelectImage(url);
    onClose();
  };

  return (
    <>
      {/* Hidden file input for Phone Gallery */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Hidden file input for Live Camera Snap */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 transition-opacity"
      />

      {/* Gemini-Style Mobile Bottom Sheet / Centered Modal */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 max-w-2xl w-full bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-50 flex flex-col max-h-[88vh] overflow-hidden border border-slate-200 animate-in slide-in-from-bottom duration-300">
        {/* Gemini-Style Drag Pill on Mobile */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 leading-tight">
                Add Product Image
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Snap a photo, choose from phone gallery, or select system assets
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

        {/* Main Gemini-Style Quick Action Bar */}
        <div className="p-4 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50 border-b border-slate-100 grid grid-cols-2 gap-3 shrink-0">
          {/* 1. Phone Gallery Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-3.5 bg-white hover:bg-blue-50/80 border border-blue-200/80 rounded-2xl shadow-xs flex items-center gap-3 text-left transition-all hover:scale-[1.02] cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25 group-hover:scale-110 transition-transform">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-xs text-slate-900 block group-hover:text-blue-600">
                Phone Gallery
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block">
                Upload from device
              </span>
            </div>
          </button>

          {/* 2. Snap Photo with Camera */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className="p-3.5 bg-white hover:bg-purple-50/80 border border-purple-200/80 rounded-2xl shadow-xs flex items-center gap-3 text-left transition-all hover:scale-[1.02] cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/25 group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-xs text-slate-900 block group-hover:text-purple-600">
                Snap Photo
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block">
                Use phone camera
              </span>
            </div>
          </button>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3 shrink-0 bg-white">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "phone", label: "Phone & System Gallery" },
              { id: "packs", label: "Bottle Packs (Cases)" },
              { id: "jars", label: "15L Jars & Dispensers" },
              { id: "brands", label: "Brand Logos" },
              { id: "custom", label: "+ Custom Web URL" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          {activeTab !== "custom" && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search gallery photos (Voltic, Bel-Aqua, Verna, Awake...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          )}
        </div>

        {/* Modal Body / Image Grid */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {isUploading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-bold text-xs text-slate-700">Uploading photo from phone gallery...</p>
            </div>
          ) : activeTab === "custom" ? (
            <form onSubmit={handleApplyCustomUrl} className="space-y-4 max-w-md mx-auto py-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Enter Image Web Address / URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="https://... or /images/products/photo.jpg"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>
              </div>

              {customUrl && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">Preview</span>
                  <div className="w-24 h-24 mx-auto rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={customUrl}
                      alt="Custom preview"
                      className="max-h-full object-contain"
                      onError={(e) => {
                        (e.target as any).src = "/images/logo.png";
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                Apply Image to Product
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {/* Quick Upload from Phone Tile in Grid */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50 p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-blue-700 block">Upload from Phone</span>
                <span className="text-[9px] text-slate-400">Tap to pick gallery photos</span>
              </div>

              {/* Photos List */}
              {filteredImages.map((img) => {
                const isSelected = alreadySelectedUrls.includes(img.url);

                return (
                  <div
                    key={img.id}
                    onClick={() => handleSelect(img.url)}
                    className={`group relative rounded-2xl border-2 p-2.5 flex flex-col items-center justify-between text-center transition-all cursor-pointer hover:border-blue-500 hover:shadow-md ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/30"
                        : "border-slate-200/80 bg-slate-50/50 hover:bg-white"
                    }`}
                  >
                    <div className="w-full h-24 flex items-center justify-center overflow-hidden rounded-xl bg-white p-2 border border-slate-100 shadow-2xs group-hover:scale-105 transition-transform">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as any).src = "/images/logo.png";
                        }}
                      />
                    </div>

                    <div className="w-full pt-2">
                      <span className="font-black text-[11px] text-slate-800 block truncate leading-tight">
                        {img.name}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                        {img.tag}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-0.5 shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 text-xs">
          <span className="text-slate-400 font-medium">
            {filteredImages.length} photo(s) available
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
