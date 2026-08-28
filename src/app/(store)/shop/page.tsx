"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ArrowLeft,
  X,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { STORE_PRODUCTS, WATER_BRANDS, StoreProduct } from "@/lib/constants";
import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { ProductCard } from "@/components/products/product-card";

function ShopContent() {
  const searchParams = useSearchParams();
  const initialBrand = searchParams.get("brand") || "all";
  const initialCategory = searchParams.get("category") || "all";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    initialBrand !== "all" ? [initialBrand] : []
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  const categories = [
    "All Products",
    "Bottled Water",
    "Sachet Water",
    "Large Bottles",
    "Dispensers",
  ];

  const handleBrandToggle = (brandSlug: string) => {
    if (brandSlug === "all") {
      setSelectedBrands([]);
      return;
    }
    setSelectedBrands((prev) =>
      prev.includes(brandSlug)
        ? prev.filter((b) => b !== brandSlug)
        : [...prev, brandSlug]
    );
  };

  const handleCategorySelect = (cat: string) => {
    if (cat === "All Products" || cat === "all") {
      setSelectedCategory("all");
    } else {
      setSelectedCategory(cat);
    }
  };

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedBrands([]);
    setMaxPrice(100);
    setSearchQuery("");
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return STORE_PRODUCTS.filter((prod) => {
      // Category filter
      if (selectedCategory !== "all" && prod.category !== selectedCategory) {
        return false;
      }
      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(prod.brandSlug)) {
        return false;
      }
      // Price filter
      if (prod.price > maxPrice) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesBrand = prod.brand.toLowerCase().includes(q);
        const matchesSize = prod.packSize.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesSize) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return (b.reviewCount || 0) - (a.reviewCount || 0); // popular default
    });
  }, [selectedCategory, selectedBrands, maxPrice, searchQuery, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* Store Navbar */}
      <StoreNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-4">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-700">Shop</span>
        </div>

        {/* Mobile Header Title + Back */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-black text-slate-900">Shop Water</h1>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {filteredProducts.length} items
          </span>
        </div>

        {/* Top Controls Bar: Search & Sort */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Search bar */}
          <div className="relative w-full sm:w-80 lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search water products, brands..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Filter button (Mobile) & Sort Dropdown */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {selectedBrands.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                  {selectedBrands.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-semibold text-slate-500">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all"
                >
                  <option value="popular">Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none sm:hidden">
          {categories.map((cat) => {
            const isSelected =
              (cat === "All Products" && selectedCategory === "all") ||
              selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs shadow-blue-600/25"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {cat === "All Products" ? "All" : cat}
              </button>
            );
          })}
        </div>

        {/* ─── Main Shop Layout (Sidebar + Products Grid) ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── Left Sidebar Filters (Desktop) ────────────────────────────────── */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-black text-sm uppercase tracking-wider text-slate-900">Filters</h2>
              {(selectedCategory !== "all" || selectedBrands.length > 0 || maxPrice < 100) && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Categories</h3>
              <div className="space-y-1">
                {categories.map((cat) => {
                  const isSelected =
                    (cat === "All Products" && selectedCategory === "all") ||
                    selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-blue-50 text-blue-600 font-extrabold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span>{cat}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Brands</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:text-blue-600">
                  <input
                    type="checkbox"
                    checked={selectedBrands.length === 0}
                    onChange={() => handleBrandToggle("all")}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>All Brands</span>
                </label>

                {WATER_BRANDS.map((brand) => (
                  <label
                    key={brand.slug}
                    className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:text-blue-600"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand.slug)}
                      onChange={() => handleBrandToggle(brand.slug)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Max Price</h3>
                <span className="font-black text-blue-600 text-xs">GH₵{maxPrice}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>GH₵10</span>
                <span>GH₵100+</span>
              </div>
            </div>
          </aside>

          {/* ─── Product Catalog Grid (Desktop & Mobile) ───────────────────────── */}
          <div className="lg:col-span-9 space-y-6">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No water packs found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn&apos;t find any products matching your selected filters. Try broadening your criteria.
                </p>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              <>
                {/* Product Catalog Grid (2-column on mobile, 2/3-column on tablet/desktop) */}
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} variant="grid" />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* ─── Mobile Filter Slide-out Modal ────────────────────────────────────── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl z-50 flex flex-col justify-between p-6">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-black text-base text-slate-900">Filter Products</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Brands */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Brands</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedBrands.length === 0}
                      onChange={() => handleBrandToggle("all")}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>All Brands</span>
                  </label>
                  {WATER_BRANDS.map((brand) => (
                    <label key={brand.slug} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand.slug)}
                        onChange={() => handleBrandToggle(brand.slug)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Max Price */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Max Price</h4>
                  <span className="font-black text-blue-600 text-xs">GH₵{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-2">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Apply Filters ({filteredProducts.length})
              </button>
              <button
                onClick={resetFilters}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <StoreFooter />

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading water packs...</div>}>
      <ShopContent />
    </Suspense>
  );
}
