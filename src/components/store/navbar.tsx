"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ShoppingCart,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Phone,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Truck,
  Package,
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useTheme } from "@/context/theme-context";
import { STORE_PHONE_DISPLAY } from "@/lib/constants";
import {
  CustomerNotificationsDrawer,
  CustomerNotificationItem,
} from "./CustomerNotificationsDrawer";

export function StoreNavbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { itemCount } = useCart();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CustomerNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const isHome = pathname === "/";
  const user = session?.user;
  const isAuthenticated = status === "authenticated" && !!user;

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const res = await fetch("/api/customer/notifications?limit=50");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
        setUnreadCount(typeof json.unreadCount === "number" ? json.unreadCount : 0);
      }
    } catch (err) {
      console.warn("Failed to fetch customer notifications:", err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdowns on pathname change
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Brands", href: "/#brands" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const headerBgClass = isHome
    ? isScrolled
      ? "bg-white/95 dark:bg-black/90 backdrop-blur-md border-b border-slate-200/80 dark:border-neutral-800 shadow-xs"
      : "bg-transparent border-b border-transparent shadow-none"
    : "bg-white/95 dark:bg-black/90 backdrop-blur-md border-b border-slate-200/80 dark:border-neutral-800 shadow-xs";

  const firstName = user?.name ? user.name.split(" ")[0] : "Account";
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${headerBgClass}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 lg:h-20 flex items-center justify-between gap-4">
          {/* Left: Hamburger Button + Kay's Packs Logo */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200/90 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 shadow-2xs flex items-center justify-center text-slate-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all active:scale-95 cursor-pointer"
              aria-label="Open menu"
              title="Menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Brand Logo Text */}
            <Link href="/" className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white font-sans hover:opacity-90 transition-opacity ml-1">
              Kay&apos;s <span className="text-blue-600 dark:text-blue-400">Packs</span>
            </Link>
          </div>

          {/* Center: Desktop Clean Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-slate-600 dark:text-neutral-400">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : link.href.startsWith("/#")
                  ? false
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`transition-colors py-2 relative hover:text-blue-600 dark:hover:text-blue-400 ${
                    isActive ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-700 dark:text-neutral-300"
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Desktop: Notifications Bell + Theme Toggle + User Account + Cart */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Desktop Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="relative w-10 h-10 rounded-full border border-slate-200/90 dark:border-neutral-800 hover:border-blue-600 dark:hover:border-blue-500 bg-white/80 dark:bg-neutral-900/80 hover:bg-blue-50/60 dark:hover:bg-neutral-800 text-slate-700 dark:text-amber-400 hover:text-blue-600 dark:hover:text-amber-300 shadow-2xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="w-4.5 h-4.5 stroke-[2]" />
              ) : (
                <Moon className="w-4.5 h-4.5 stroke-[2] text-slate-700" />
              )}
            </button>

            {/* Desktop Notification Bell Button */}
            <button
              id="top-nav-desktop-notifications-btn"
              onClick={() => setNotificationsOpen(true)}
              className="relative w-10 h-10 rounded-full border border-slate-200/90 dark:border-neutral-800 hover:border-blue-600 dark:hover:border-blue-500 bg-white/80 dark:bg-neutral-900/80 hover:bg-blue-50/60 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              aria-label="View Notifications"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5 stroke-[1.8]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full border border-slate-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-500 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all shadow-2xs group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-sky-600 text-white font-bold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    {initial}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-neutral-200 max-w-[110px] truncate">
                    {firstName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      userMenuOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-slate-100 dark:border-neutral-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-neutral-800">
                      <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                        Signed in as
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-neutral-100 truncate mt-0.5">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">
                        {user.email || user.phone}
                      </p>
                      {user.role && user.role !== "CUSTOMER" && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full border border-blue-200/50 dark:border-blue-800/50">
                          {user.role}
                        </span>
                      )}
                    </div>

                    <div className="py-1.5 space-y-0.5">
                      <Link
                        href="/account"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400 dark:text-neutral-500" />
                        <span>My Account</span>
                      </Link>

                      <Link
                        href="/account?tab=orders"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Package className="w-4 h-4 text-slate-400 dark:text-neutral-500" />
                        <span>My Orders</span>
                      </Link>

                      <button
                        type="button"
                        onClick={toggleDarkMode}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
                          <span>{isDarkMode ? "Light Theme" : "Dark Theme"}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase">{isDarkMode ? "Dark" : "Light"}</span>
                      </button>

                      {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-500" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      {user.role === "DELIVERY" && (
                        <Link
                          href="/delivery"
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Truck className="w-4 h-4 text-orange-500" />
                          <span>Delivery Portal</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all"
              >
                Sign in
              </Link>
            )}

            {/* Desktop Cart Button */}
            <Link
              href="/cart"
              className="relative w-10 h-10 rounded-full border border-slate-300/80 dark:border-neutral-800 hover:border-blue-600 dark:hover:border-blue-500 text-slate-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-all hover:bg-blue-50/50 dark:hover:bg-neutral-850 active:scale-95 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xs"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4 stroke-[1.8]" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Right Mobile: Theme Toggle + Notifications Bell */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200/90 dark:border-neutral-800 hover:border-blue-600 dark:hover:border-blue-500 bg-white/90 dark:bg-neutral-900/90 hover:bg-blue-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-amber-400 hover:text-blue-600 dark:hover:text-amber-300 shadow-2xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2]" />
              ) : (
                <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2] text-slate-700" />
              )}
            </button>

            <button
              id="top-nav-mobile-notifications-btn"
              onClick={() => setNotificationsOpen(true)}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200/90 dark:border-neutral-800 hover:border-blue-600 dark:hover:border-blue-500 bg-white/90 dark:bg-neutral-900/90 hover:bg-blue-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              aria-label="View Notifications"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[1.8]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
      {!isHome && <div className="h-16 sm:h-18 lg:h-20 shrink-0" aria-hidden="true" />}

      {/* Customer Notifications Drawer */}
      <CustomerNotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={notificationsLoading}
        onRefresh={fetchNotifications}
      />

      {/* Slide-in Drawer on Mobile & Tablet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content (Left-aligned to match the Hamburger icon) */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white dark:bg-neutral-950 shadow-2xl z-50 flex flex-col justify-between p-6 animate-slide-in-left overflow-y-auto border-r border-slate-200/80 dark:border-neutral-850">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-850">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-bold text-lg text-slate-900 dark:text-white tracking-tight"
                >
                  Kay&apos;s <span className="text-blue-600 dark:text-blue-400">Packs</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Auth Header if Logged In */}
              {isAuthenticated && (
                <div className="p-3.5 bg-blue-50/60 dark:bg-neutral-900 border border-blue-100/80 dark:border-neutral-800 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                      {user.email || user.phone}
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation links */}
              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <span>{link.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-600" />
                  </Link>
                ))}
                <Link
                  href="/bulk-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-neutral-900 transition-colors"
                >
                  <span>Bulk &amp; Events</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-600" />
                </Link>
                <Link
                  href="/account?tab=orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-neutral-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>My Orders</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-600" />
                </Link>

                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-neutral-900 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
                    <span>Theme: {isDarkMode ? "Dark Mode" : "Light Mode"}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 uppercase">
                    {isDarkMode ? "Dark" : "Light"}
                  </span>
                </button>

                {isAuthenticated && (
                  <>
                    <div className="pt-2 pb-1 px-3">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                        My Profile
                      </p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Manage Account</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-600" />
                    </Link>

                    {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-neutral-900 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span>Admin Dashboard</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-purple-400" />
                      </Link>
                    )}

                    {user.role === "DELIVERY" && (
                      <Link
                        href="/delivery"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-neutral-900 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-orange-500" />
                          <span>Delivery Portal</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-orange-400" />
                      </Link>
                    )}
                  </>
                )}
              </nav>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-neutral-850 space-y-3">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold py-3 rounded-xl shadow-xs text-sm transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md text-sm transition-colors"
                >
                  <span>Sign in / Register</span>
                </Link>
              )}

              <div className="text-center text-xs text-slate-500 dark:text-neutral-400 flex items-center justify-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Need assistance? {STORE_PHONE_DISPLAY}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
