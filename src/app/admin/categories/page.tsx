"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Tag,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "brands">("categories");

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catOrder, setCatOrder] = useState(1);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Brand Modal State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [brandTagline, setBrandTagline] = useState("");
  const [brandDesc, setBrandDesc] = useState("");
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch("/api/admin/categories").then((r) => r.json()),
        fetch("/api/admin/brands").then((r) => r.json()),
      ]);
      if (catRes.success) setCategories(catRes.data);
      if (brandRes.success) setBrands(brandRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/admin/categories";
      const method = editingCatId ? "PATCH" : "POST";
      const body = editingCatId
        ? { id: editingCatId, name: catName, description: catDesc, displayOrder: catOrder }
        : { name: catName, description: catDesc, displayOrder: catOrder };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        setIsCategoryModalOpen(false);
        setCatName("");
        setCatDesc("");
        setEditingCatId(null);
        fetchData();
      } else {
        alert(json.error || "Failed to save category");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/admin/brands";
      const method = editingBrandId ? "PATCH" : "POST";
      const body = editingBrandId
        ? { id: editingBrandId, name: brandName, tagline: brandTagline, description: brandDesc }
        : { name: brandName, tagline: brandTagline, description: brandDesc };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        setIsBrandModalOpen(false);
        setBrandName("");
        setBrandTagline("");
        setBrandDesc("");
        setEditingBrandId(null);
        fetchData();
      } else {
        alert(json.error || "Failed to save brand");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) fetchData();
      else alert(json.error || "Failed to delete category");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (!confirm(`Delete brand "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/brands?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) fetchData();
      else alert(json.error || "Failed to delete brand");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories & Water Brands"
        subtitle="Organize product catalog hierarchy, bottle brand descriptions, and storefront display order"
        breadcrumbs={[{ label: "Categories & Brands" }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>
            <button
              onClick={() => {
                if (activeTab === "categories") {
                  setEditingCatId(null);
                  setCatName("");
                  setCatDesc("");
                  setCatOrder(categories.length + 1);
                  setIsCategoryModalOpen(true);
                } else {
                  setEditingBrandId(null);
                  setBrandName("");
                  setBrandTagline("");
                  setBrandDesc("");
                  setIsBrandModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === "categories" ? "Add Category" : "Add Brand"}</span>
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "categories"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-600 hover:bg-white"
          }`}
        >
          Product Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("brands")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "brands"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-600 hover:bg-white"
          }`}
        >
          Water Brands ({brands.length})
        </button>
      </div>

      {/* Categories View */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                    {cat.displayOrder || 1}
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900">{cat.name}</h3>
                </div>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingCatId(cat._id);
                      setCatName(cat.name);
                      setCatDesc(cat.description || "");
                      setCatOrder(cat.displayOrder || 1);
                      setIsCategoryModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat._id, cat.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium min-h-[32px]">
                {cat.description || "No description provided."}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-slate-400">
                <span>{cat.productCount} active products</span>
                <span className="text-[11px] font-bold text-blue-600">Category</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Brands View */}
      {activeTab === "brands" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <div
              key={brand._id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                    {brand.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{brand.name}</h3>
                    {brand.tagline && (
                      <span className="text-[10px] text-blue-600 font-bold block">
                        {brand.tagline}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingBrandId(brand._id);
                      setBrandName(brand.name);
                      setBrandTagline(brand.tagline || "");
                      setBrandDesc(brand.description || "");
                      setIsBrandModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBrand(brand._id, brand.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium min-h-[32px]">
                {brand.description || "Leading mineral water producer in Ghana."}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-slate-400">
                <span>{brand.productCount} pack variants</span>
                <span className="text-[11px] font-bold text-blue-600">Brand</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingCatId ? "Edit Category" : "New Category"}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Display Order</label>
                <input
                  type="number"
                  min="1"
                  value={catOrder}
                  onChange={(e) => setCatOrder(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-600/30"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingBrandId ? "Edit Brand" : "New Water Brand"}
            </h3>
            <form onSubmit={handleSaveBrand} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tagline</label>
                <input
                  type="text"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  placeholder="e.g. Naturally refreshing natural mineral water"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={brandDesc}
                  onChange={(e) => setBrandDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-600/30"
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
