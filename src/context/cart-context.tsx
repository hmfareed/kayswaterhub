"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { STORE_PRODUCTS, StoreProduct } from "@/lib/constants";

export interface CartItem {
  product: StoreProduct;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: StoreProduct, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => void;
  clearRecentlyViewed: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const REGION_DELIVERY_RATES: Record<string, number> = {
  "Greater Accra": 15,
  "Ashanti": 20,
  "Northern": 25,
  "Western": 20,
  "Eastern": 18,
  "Central": 18,
  "Volta": 22,
  "Upper East": 30,
  "Upper West": 30,
  "Bono East": 22,
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Initial state with 3 popular items like in the UI design mockups!
    const defaultItems: CartItem[] = [
      { product: STORE_PRODUCTS[0], quantity: 2 }, // Voltic 500ml x 24 (2) = 90
      { product: STORE_PRODUCTS[1], quantity: 1 }, // Bel Aqua 500ml x 24 (1) = 40
      { product: STORE_PRODUCTS[2], quantity: 2 }, // Aqua Splash 500ml x 24 (2) = 76
    ];
    return defaultItems;
  });

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => [
    STORE_PRODUCTS[0].id,
    STORE_PRODUCTS[1].id,
    STORE_PRODUCTS[2].id,
  ]);
  const [selectedRegion, setSelectedRegion] = useState<string>("Greater Accra");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load cart, wishlist and recently viewed from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("kays_packs_cart") || localStorage.getItem("kays_waterhub_cart");
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
      const savedWishlist = localStorage.getItem("kays_packs_wishlist") || localStorage.getItem("kays_waterhub_wishlist");
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
      const savedRecent = localStorage.getItem("kays_packs_recent");
      if (savedRecent) {
        setRecentlyViewed(JSON.parse(savedRecent));
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("kays_packs_cart", JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("kays_packs_wishlist", JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("kays_packs_recent", JSON.stringify(recentlyViewed));
    } catch {
      // ignore
    }
  }, [recentlyViewed, isLoaded]);

  const addItem = (product: StoreProduct, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const addRecentlyViewed = (productId: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 10);
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = items.length > 0 ? (REGION_DELIVERY_RATES[selectedRegion] || 15) : 0;
  const total = subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotal,
        deliveryFee,
        total,
        selectedRegion,
        setSelectedRegion,
        wishlist,
        toggleWishlist,
        isInWishlist,
        recentlyViewed,
        addRecentlyViewed,
        clearRecentlyViewed,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
