"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
}

export function AdminHeader({
  onToggleSidebar,
  onOpenSearch,
  onOpenNotifications,
}: AdminHeaderProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/admin/notifications/unread-count");
      const json = await res.json();
      if (json.success && typeof json.count === "number") {
        setUnreadCount(json.count);
      }
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-3 sm:px-6 lg:px-8 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Left: Mobile Toggle & Quick Search Button */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer shrink-0"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl text-xs text-slate-500 font-medium transition-all w-36 xs:w-44 sm:w-64 cursor-pointer truncate"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate text-left">Quick search...</span>
          <kbd className="hidden sm:inline-block ml-auto text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Storefront Link, Notifications, Admin Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Storefront Link */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          <span>Live Store</span>
        </Link>

        {/* Notifications Bell with dynamic unread badge */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title={unreadCount > 0 ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}` : "Notifications"}
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Admin User Info */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
            KA
          </div>
          <div className="hidden md:block text-left">
            <span className="font-extrabold text-xs text-slate-900 block leading-tight">
              Khadijah Abass
            </span>
            <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" />
              Business Owner & Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
