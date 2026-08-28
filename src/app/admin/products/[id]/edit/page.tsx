"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Image as ImageIcon,
  Check,
  X,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  Camera,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { MediaGalleryModal } from "@/components/admin/MediaGalleryModal";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Single Product Image
  const [image, setImage] = useState<string>("");

  // Media Gallery Modal State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const [variants, setVariants] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/brands").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch(`/api/admin/products/${productId}`).then((r) => r.json()),
    ])
      .then(([brandsRes, categoriesRes, productRes]) => {
        if (brandsRes.success) setBrands(brandsRes.data);
        if (categoriesRes.success) setCategories(categoriesRes.data);

        if (productRes.success && productRes.data) {
          const p = productRes.data;
          setName(p.name || "");
          setSlug(p.slug || "");
          setBrandId(p.brandId?._id || p.brandId || "");
          setCategoryId(p.categoryId?._id || p.categoryId || "");
          setDescription(p.description || "");
          setIsFeatured(p.isFeatured || false);
          setIsActive(p.isActive !== false);
          setImage(p.images && p.images.length > 0 ? p.images[0] : "");
          setVariants(
            p.variants && p.variants.length > 0
              ? p.variants
              : [
                  {
                    name: "500ml × 15 Bottles",
                    bottleSize: "500 ml",
                    unitsPerPack: 15,
                    price: 45.0,
                    stockQuantity: 100,
                    lowStockThreshold: 15,
                    sku: "",
                  },
                ]
          );
        } else {
          setError(productRes.error || "Product not found");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [productId]);

  const handleSelectImage = (urlToAdd: string) => {
    setImage(urlToAdd.trim());
  };

  const handleRemoveImage = () => {
    setImage("");
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        name: "750ml × 15 Bottles",
        bottleSize: "750 ml",
        unitsPerPack: 15,
        price: 42.0,
        stockQuantity: 80,
        lowStockThreshold: 15,
        sku: "",
      },
    ]);
  };

  const handleRemoveVariant = (idx: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (idx: number, field: string, value: any) => {
    const updated = [...variants];
    updated[idx][field] = value;
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const finalSlug =
      slug.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: finalSlug,
          brandId,
          categoryId,
          description: description || "",
          images: image ? [image] : [],
          isFeatured,
          isActive,
          variants,
        }),
      });

      const json = await res.json();
      if (json.success) {
        router.push("/admin/products");
      } else {
        alert(json.error || "Failed to update product");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <span className="text-xs font-bold text-slate-500 mt-2 block">Loading product details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Edit "${name}"`}
        subtitle="Manage product branding, packaging specifications, pricing, and live inventory"
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: "Edit Product" },
        ]}
      />

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Basic Product Info */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">Product Identification</h3>
              <span className="text-[11px] font-bold text-slate-400">General Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Product Display Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  URL Slug <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Auto-generated if left blank"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-hidden focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Brand *</label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white cursor-pointer"
                >
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Water mineral properties, source, packaging convenience, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>

              {/* Visibility & Merchandising switches */}
              <div className="sm:col-span-2 flex items-center gap-8 pt-2">
                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <span>Active for Purchase in Storefront</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <span>Featured Product on Homepage</span>
                </label>
              </div>
            </div>
          </div>

          {/* 2. Single Product Image Management */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm text-slate-900">Product Image</h3>
                <p className="text-xs text-slate-400">Upload or snap a product photo from your phone or gallery</p>
              </div>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{image ? "Change Image" : "Add Image"}</span>
              </button>
            </div>

            {/* Single Image Box */}
            {image ? (
              <div className="flex items-center gap-4">
                <div className="relative group w-36 h-36 rounded-2xl bg-slate-50 border-2 border-blue-500 p-2 overflow-hidden shadow-xs flex items-center justify-center">
                  <img
                    src={image}
                    alt="Product preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as any).src = "/images/logo.png";
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-md cursor-pointer transition-transform hover:scale-110"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsGalleryOpen(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Replace with Another Photo
                  </button>
                  <p className="text-[11px] text-slate-400">
                    This photo is displayed on the storefront and product catalog.
                  </p>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsGalleryOpen(true)}
                className="w-full py-10 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-800 block group-hover:text-blue-600">
                    Click to add a product image
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Upload from phone gallery, snap a photo, or choose a clean pack image
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Packaging Variants, Pricing & Stock */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm text-slate-900">Packaging Variants & Inventory</h3>
                <p className="text-xs text-slate-400">Configure pack sizes, bottle counts, unit prices, and stock counts</p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      Variant #{idx + 1}: {v.name || "Pack Specification"}
                    </span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Variant</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Variant Name *</label>
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => handleVariantChange(idx, "name", e.target.value)}
                        placeholder="e.g. 500ml x 15 Bottles"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Bottle Size *</label>
                      <input
                        type="text"
                        value={v.bottleSize}
                        onChange={(e) => handleVariantChange(idx, "bottleSize", e.target.value)}
                        placeholder="500 ml"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Bottles per Pack *</label>
                      <input
                        type="number"
                        min="1"
                        value={v.unitsPerPack}
                        onChange={(e) => handleVariantChange(idx, "unitsPerPack", parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Price (GH₵) *</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={v.price}
                        onChange={(e) => handleVariantChange(idx, "price", parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Current Stock Qty *</label>
                      <input
                        type="number"
                        min="0"
                        value={v.stockQuantity}
                        onChange={(e) => handleVariantChange(idx, "stockQuantity", parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">Low Stock Alert Threshold</label>
                      <input
                        type="number"
                        min="1"
                        value={v.lowStockThreshold || 15}
                        onChange={(e) => handleVariantChange(idx, "lowStockThreshold", parseInt(e.target.value, 10) || 15)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        SKU / Barcode <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={v.sku || ""}
                        onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                        placeholder="e.g. VOLTIC-500ML-15"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/admin/products"
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving Product..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      )}

      {/* In-system Media Gallery Modal */}
      <MediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectImage={handleSelectImage}
        alreadySelectedUrls={image ? [image] : []}
      />
    </div>
  );
}
