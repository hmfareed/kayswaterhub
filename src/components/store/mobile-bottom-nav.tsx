"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, ShoppingBag, Package, Store, User } from "lucide-react";
import { useCart } from "@/context/cart-context";

function MobileBottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { itemCount } = useCart();
  const tab = searchParams?.get("tab");

  const isAuthenticated = status === "authenticated" && !!session?.user;

  // New unauthenticated users clicking Account or Orders go to Sign Up / Sign In
  const accountHref = isAuthenticated ? "/account" : "/register?callbackUrl=/account";
  const ordersHref = isAuthenticated ? "/account?tab=orders" : "/login?callbackUrl=/account?tab=orders";

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Shop", href: "/shop", icon: Store },
    { label: "Cart", href: "/cart", icon: ShoppingBag, badge: itemCount },
    { label: "Orders", href: ordersHref, icon: Package },
    { label: "Account", href: accountHref, icon: User },
  ];

  return (
    /* md:hidden → only visible on mobile (< 768 px) */
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          let isActive = false;
          if (item.label === "Home") {
            isActive = pathname === "/";
          } else if (item.label === "Orders") {
            isActive = (pathname === "/account" && tab === "orders") || pathname.startsWith("/orders");
          } else if (item.label === "Account") {
            isActive = (pathname === "/account" && tab !== "orders") || pathname.startsWith("/register") || pathname.startsWith("/login");
          } else {
            isActive = pathname.startsWith(item.href);
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-3 min-w-[56px] rounded-xl transition-all ${
                isActive
                  ? "text-blue-600 font-bold scale-105"
                  : "text-slate-400 hover:text-slate-700 font-medium"
              }`}
            >
              <div className="relative">
                {item.label === "Account" && isActive ? (
                  <div className="w-6 h-6 rounded-full border-2 border-blue-600 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                )}

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? "font-bold text-blue-600" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavInner />
    </Suspense>
  );
}
