"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  Star,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowUpDown,
  Eye,
  Check,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StockAdjustmentModal } from "@/components/admin/StockAdjustmentModal";
import { formatCurrency } from "@/lib/constants";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [status, setStatus] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  // Categories & Brands for dropdown filters
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);

  // Modals state
  const [selectedVariantForStock, setSelectedVariantForStock] = useState<any>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [quickEditProduct, setQuickEditProduct] = useState<any>(null);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [quickEditSaving, setQuickEditSaving] = useState(false);

  // Fetch Categories & Brands once
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => d.success && setCategoriesList(d.data))
      .catch(() => {});

    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((d) => d.success && setBrandsList(d.data))
      .catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        search,
        category,
        brand,
        status,
        stockStatus,
      });
      const res = await fetch(`/api/admin/products?${query}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
        if (json.stats) setStats(json.stats);
        if (json.pagination) {
          setTotal(json.pagination.total);
          setTotalPages(json.pagination.totalPages);
        }
      }
    } catch (e) {
      console.error("Products fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, category, brand, status, stockStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Sync Store Products
  const handleSyncStoreProducts = async () => {
    setIsSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/admin/products/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncMessage("Store products synchronized!");
        setTimeout(() => setSyncMessage(""), 3500);
        fetchProducts();
      } else {
        alert(data.error || "Failed to sync store products");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Quick Toggle Active Status
  const handleToggleActive = async (productId: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/admin/products/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, field: "isActive", value: !currentVal }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === productId ? { ...p, isActive: !currentVal } : p))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Toggle Featured
  const handleToggleFeatured = async (productId: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/admin/products/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, field: "isFeatured", value: !currentVal }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === productId ? { ...p, isFeatured: !currentVal } : p))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Stock Modal
  const handleOpenRestock = (product: any) => {
    const primaryVariant = product.variants?.[0] || {
      _id: product._id,
      name: "Standard Pack",
      stockQuantity: product.totalStock,
    };

    setSelectedVariantForStock({
      _id: primaryVariant._id,
      productName: product.name,
      variantName: primaryVariant.name || "Default Variant",
      stockQuantity: primaryVariant.stockQuantity ?? product.totalStock,
    });
    setIsStockModalOpen(true);
  };

  // Open Quick Edit Modal
  const handleOpenQuickEdit = (product: any) => {
    const primaryVariant = product.variants?.[0] || {
      _id: product._id,
      price: product.minPrice,
      stockQuantity: product.totalStock,
      bottleSize: "500 ml",
      unitsPerPack: 15,
    };

    setQuickEditProduct({
      _id: product._id,
      name: product.name,
      variantId: primaryVariant._id,
      price: primaryVariant.price,
      stockQuantity: primaryVariant.stockQuantity,
      bottleSize: primaryVariant.bottleSize,
      unitsPerPack: primaryVariant.unitsPerPack,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      description: product.description,
    });
    setIsQuickEditOpen(true);
  };

  // Save Quick Edit
  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditProduct) return;
    setQuickEditSaving(true);

    try {
      const res = await fetch(`/api/admin/products/${quickEditProduct._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickEditProduct.name,
          isActive: quickEditProduct.isActive,
          isFeatured: quickEditProduct.isFeatured,
          description: quickEditProduct.description,
          variants: [
            {
              _id: quickEditProduct.variantId,
              price: parseFloat(quickEditProduct.price),
              stockQuantity: parseInt(quickEditProduct.stockQuantity, 10),
              bottleSize: quickEditProduct.bottleSize,
              unitsPerPack: parseInt(quickEditProduct.unitsPerPack, 10),
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsQuickEditOpen(false);
        fetchProducts();
      } else {
        alert(data.error || "Failed to update product");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setQuickEditSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete product "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchProducts();
      } else {
        alert(json.error || "Failed to delete product");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Page Header with Actions ────────────────────────────────────────── */}
      <PageHeader
        title="Product Catalog & Inventory"
        subtitle="Manage all water brands, bottle packaging variants, stock levels, pricing, and live availability"
        breadcrumbs={[{ label: "Products" }]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Sync Store Products Button */}
            <button
              onClick={handleSyncStoreProducts}
              disabled={isSyncing}
              title="Populate and synchronize all standard storefront water products into the database"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                syncMessage
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-600" : ""}`} />
              <span>{syncMessage || (isSyncing ? "Syncing..." : "Sync Store Products")}</span>
            </button>

            {/* Refresh Table Button */}
            <button
              onClick={fetchProducts}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-xs cursor-pointer"
              title="Refresh Product List"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>

            {/* Add New Product Button */}
            <Link
              href="/admin/products/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Water Product</span>
            </Link>
          </div>
        }
      />

      {/* ─── Top 4 KPI Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setStatus("all");
            setStockStatus("all");
          }}
          className="cursor-pointer"
        >
          <StatCard
            title="Total Catalog Products"
            value={stats.totalProducts}
            icon={<Package className="w-4 h-4" />}
            note="All water pack listings"
          />
        </div>
        <div
          onClick={() => {
            setStatus("active");
            setStockStatus("all");
          }}
          className="cursor-pointer"
        >
          <StatCard
            title="Active for Sale"
            value={stats.activeProducts}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            note="Available in customer store"
          />
        </div>
        <div
          onClick={() => {
            setStockStatus("low_stock");
          }}
          className="cursor-pointer"
        >
          <StatCard
            title="Low Stock Alerts"
            value={stats.lowStockCount}
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
            note="Below 15 packs threshold"
          />
        </div>
        <div
          onClick={() => {
            setStockStatus("out_of_stock");
          }}
          className="cursor-pointer"
        >
          <StatCard
            title="Out of Stock"
            value={stats.outOfStockCount}
            icon={<XCircle className="w-4 h-4 text-rose-500" />}
            note="Requires urgent restock"
          />
        </div>
      </div>

      {/* ─── Filters & Search Toolbar ────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, slug, SKU..."
              className="w-full pl-10 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            {/* Category Select */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat._id} value={cat.slug || cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Brand Select */}
            <select
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Brands</option>
              {brandsList.map((b) => (
                <option key={b._id} value={b.slug || b._id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Stock Status Select */}
            <select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock (≤ 15)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>

            {/* Active Status Select */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Reset Filters */}
            {(category !== "all" || brand !== "all" || status !== "all" || stockStatus !== "all" || search) && (
              <button
                onClick={() => {
                  setCategory("all");
                  setBrand("all");
                  setStatus("all");
                  setStockStatus("all");
                  setSearch("");
                  setPage(1);
                }}
                className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Reset Filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Products Data Table ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-3">Brand & Category</th>
                <th className="py-3.5 px-3">Packaging & Variants</th>
                <th className="py-3.5 px-3">Price</th>
                <th className="py-3.5 px-3">Stock Level</th>
                <th className="py-3.5 px-3 text-center">Active</th>
                <th className="py-3.5 px-3 text-center">Featured</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-semibold text-xs text-slate-500">Loading catalog items...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <Package className="w-6 h-6" />
                      </div>
                      <h4 className="font-black text-sm text-slate-800">No products found</h4>
                      <p className="text-xs text-slate-400">
                        {search || category !== "all" || brand !== "all"
                          ? "No products match the selected filters. Try broadening your search criteria."
                          : "Your catalog is empty. Click below to load all store products instantly."}
                      </p>
                      <button
                        onClick={handleSyncStoreProducts}
                        disabled={isSyncing}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        {isSyncing ? "Initializing..." : "Load Store Products"}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((item) => {
                  const primaryImage =
                    item.images?.[0] || "/images/products/newvoltic15x500ml.jpg";
                  const isLow = item.totalStock <= 15 && item.totalStock > 0;
                  const isOut = item.totalStock === 0;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Product Image + Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
                            <img
                              src={primaryImage}
                              alt={item.name}
                              className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as any).src = "/images/logo.png";
                              }}
                            />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <Link
                              href={`/admin/products/${item._id}/edit`}
                              className="font-extrabold text-slate-900 hover:text-blue-600 block truncate text-xs transition-colors"
                              title={item.name}
                            >
                              {item.name}
                            </Link>
                            <span className="text-[10px] text-slate-400 font-medium block truncate">
                              {item.variants?.[0]?.name || "Standard Water Pack"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Brand & Category */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <span className="inline-block font-extrabold text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/60">
                            {item.brand?.name || "General Brand"}
                          </span>
                          <span className="block text-[11px] text-slate-500 font-medium">
                            {item.category?.name || "Bottled Water"}
                          </span>
                        </div>
                      </td>

                      {/* Packaging & Variants */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          {item.variants && item.variants.length > 0 ? (
                            item.variants.map((v: any, idx: number) => (
                              <span
                                key={idx}
                                className="text-[11px] font-semibold text-slate-700 block truncate"
                              >
                                {v.name || `${v.bottleSize} × ${v.unitsPerPack}`}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400">1 standard pack</span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {item.variants?.length || 1} variant(s) configured
                          </span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3">
                        <span className="font-black text-slate-900 text-xs">
                          {item.minPrice === item.maxPrice
                            ? formatCurrency(item.minPrice)
                            : `${formatCurrency(item.minPrice)} – ${formatCurrency(item.maxPrice)}`}
                        </span>
                      </td>

                      {/* Stock Level with Quick Restock Button */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isOut
                                    ? "bg-rose-500 ring-2 ring-rose-200"
                                    : isLow
                                    ? "bg-amber-500 ring-2 ring-amber-200"
                                    : "bg-emerald-500"
                                }`}
                              ></span>
                              <span
                                className={`font-black text-xs ${
                                  isOut
                                    ? "text-rose-600"
                                    : isLow
                                    ? "text-amber-600"
                                    : "text-slate-900"
                                }`}
                              >
                                {item.totalStock} packs
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {isOut ? "Out of stock" : isLow ? "Low stock alert" : "In stock"}
                            </span>
                          </div>

                          {/* Quick Restock Button */}
                          <button
                            onClick={() => handleOpenRestock(item)}
                            title="Adjust inventory stock count"
                            className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-extrabold transition-colors cursor-pointer shrink-0"
                          >
                            + Stock
                          </button>
                        </div>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleActive(item._id, item.isActive)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            item.isActive ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                          title={item.isActive ? "Active in Storefront" : "Hidden from Storefront"}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              item.isActive ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Featured on Homepage */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleFeatured(item._id, item.isFeatured)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.isFeatured
                              ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                              : "text-slate-300 hover:text-slate-400 hover:bg-slate-100"
                          }`}
                          title={item.isFeatured ? "Featured on Home" : "Not featured on Home"}
                        >
                          <Star className={`w-4 h-4 ${item.isFeatured ? "fill-current" : ""}`} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Edit */}
                          <button
                            onClick={() => handleOpenQuickEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Quick Edit Product"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {/* Full Edit Page */}
                          <Link
                            href={`/admin/products/${item._id}/edit`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Full Product Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(item._id, item.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {products.length} of {total} products
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-slate-800">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Stock Adjustment Modal ─────────────────────────────────────────── */}
      <StockAdjustmentModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        variant={selectedVariantForStock}
        onSuccess={() => {
          fetchProducts();
        }}
      />

      {/* ─── Quick Edit Modal ────────────────────────────────────────────────── */}
      {isQuickEditOpen && quickEditProduct && (
        <>
          <div
            onClick={() => setIsQuickEditOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Quick Edit Product</h3>
                <p className="text-xs text-slate-400">Update name, price, stock, and status</p>
              </div>
              <button
                onClick={() => setIsQuickEditOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="p-5 space-y-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Product Name *</label>
                <input
                  type="text"
                  required
                  value={quickEditProduct.name}
                  onChange={(e) =>
                    setQuickEditProduct({ ...quickEditProduct, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>

              {/* Price & Stock Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Price (GH₵) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={quickEditProduct.price}
                    onChange={(e) =>
                      setQuickEditProduct({ ...quickEditProduct, price: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quickEditProduct.stockQuantity}
                    onChange={(e) =>
                      setQuickEditProduct({ ...quickEditProduct, stockQuantity: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>
              </div>

              {/* Bottle Size & Units Per Pack */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Bottle Size</label>
                  <input
                    type="text"
                    value={quickEditProduct.bottleSize || "500 ml"}
                    onChange={(e) =>
                      setQuickEditProduct({ ...quickEditProduct, bottleSize: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Bottles / Pack</label>
                  <input
                    type="number"
                    min="1"
                    value={quickEditProduct.unitsPerPack || 15}
                    onChange={(e) =>
                      setQuickEditProduct({ ...quickEditProduct, unitsPerPack: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quickEditProduct.isActive}
                    onChange={(e) =>
                      setQuickEditProduct({ ...quickEditProduct, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <span>Active for Purchase</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quickEditProduct.isFeatured}
                    onChange={(e) =>
                      setQuickEditProduct({ ...quickEditProduct, isFeatured: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <span>Feature on Homepage</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/admin/products/${quickEditProduct._id}/edit`}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Go to Full Edit Page →
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickEditOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quickEditSaving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {quickEditSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
