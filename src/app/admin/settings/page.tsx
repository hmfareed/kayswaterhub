"use client";

import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Save,
  Building,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Key,
  ExternalLink,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";

export default function AdminSettingsPage() {
  // Password Lock State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState("");

  // Settings State
  const [storeName, setStoreName] = useState("Khady's Water");
  const [phone, setPhone] = useState("+233 20 987 8744");
  const [email, setEmail] = useState("orders@khadyswater.com");
  const [address, setAddress] = useState("Boundary Road, East Legon, Accra");
  const [currency, setCurrency] = useState("GHS");

  // Ordering
  const [orderingEnabled, setOrderingEnabled] = useState(true);
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(30);

  // Paystack & Mobile Money Gateway
  const [paystackPublicKey, setPaystackPublicKey] = useState("");
  const [paystackSecretKey, setPaystackSecretKey] = useState("");
  const [paystackTestMode, setPaystackTestMode] = useState(true);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Check if session was already unlocked
  useEffect(() => {
    if (typeof window !== "undefined") {
      const unlocked = sessionStorage.getItem("admin_settings_unlocked");
      if (unlocked === "true") {
        setIsUnlocked(true);
      }
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const s = d.data;
          setStoreName(s.businessName || s.storeName || "Khady's Water");
          setPhone(s.phone || s.contactPhone || "+233 20 987 8744");
          setEmail(s.email || s.contactEmail || "orders@khadyswater.com");
          setAddress(s.address || "Boundary Road, East Legon, Accra");
          setCurrency(s.currency || "GHS");
          setOrderingEnabled(s.orderingEnabled !== false);
          setMinimumOrderAmount(s.minimumOrderAmount ?? 30);
          setPaystackPublicKey(s.paystack?.publicKey || "");
          setPaystackSecretKey(s.paystack?.secretKey || "");
          setPaystackTestMode(s.paystack?.testMode !== false);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Handle Verify Password
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setAuthError("");

    try {
      const res = await fetch("/api/admin/settings/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (data.success) {
        setIsUnlocked(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("admin_settings_unlocked", "true");
        }
      } else {
        setAuthError(data.error || "Incorrect admin password");
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to verify password");
    } finally {
      setVerifying(false);
    }
  };

  const handleLockSettings = () => {
    setIsUnlocked(false);
    setPasswordInput("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("admin_settings_unlocked");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: storeName,
          storeName,
          phone,
          email,
          address,
          currency,
          orderingEnabled,
          minimumOrderAmount,
          paystack: {
            publicKey: paystackPublicKey.trim(),
            secretKey: paystackSecretKey.trim(),
            testMode: paystackTestMode,
            channels: ["card", "mobile_money", "bank"],
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);

        // Notify sidebar of updated store name
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("settings-updated", { detail: { businessName: storeName } })
          );
        }
      } else {
        alert(json.error || "Failed to update settings");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // If locked, render the secure authentication gate
  if (!isUnlocked) {
    return (
      <div className="space-y-6 max-w-lg mx-auto py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Settings Protected
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
              Please enter your administrator password to unlock store and system configuration.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2 text-left animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin password..."
                className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Store Settings</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Administrator Session</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Store & Brand Settings"
        subtitle="Manage business brand name, support contacts, warehouse address, and ordering parameters"
        breadcrumbs={[{ label: "Settings" }]}
        actions={
          <button
            onClick={handleLockSettings}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="Lock Settings"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Lock Settings</span>
          </button>
        }
      />

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2 font-bold shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>System settings updated! Brand name on sidebar and ordering parameters saved.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Store Information */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <h3 className="font-black text-sm text-slate-900">Brand Profile & Sidebar Identity</h3>
            </div>
            <span className="text-[11px] font-bold text-blue-600">Syncs to Sidebar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700 block">
                Brand & Business Name * <span className="text-slate-400 font-normal">(Updates sidebar title)</span>
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Khady's Water"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-black text-sm text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Support Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Support Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700 block">Physical Business Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ordering Limits */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-purple-600" />
            <h3 className="font-black text-sm text-slate-900">Store Ordering Rules</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Minimum Order Amount (GH₵)</label>
              <input
                type="number"
                min="0"
                value={minimumOrderAmount}
                onChange={(e) => setMinimumOrderAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderingEnabled}
                  onChange={(e) => setOrderingEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                />
                <span>Allow New Customer Orders (Store Open)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Paystack Payment Gateway & Mobile Money */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <h3 className="font-black text-sm text-slate-900">
                Paystack Payment Gateway &amp; MoMo Setup
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  paystackSecretKey
                    ? paystackTestMode
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {paystackSecretKey
                  ? paystackTestMode
                    ? "⚡ Test / Sandbox Mode"
                    : "🟢 Live Production"
                  : "⚪ Not Configured"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700 block flex items-center justify-between">
                <span>Paystack Public Key</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (e.g. pk_live_... or pk_test_...)
                </span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={paystackPublicKey}
                  onChange={(e) => setPaystackPublicKey(e.target.value)}
                  placeholder="pk_live_... or pk_test_..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden focus:bg-white text-xs"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700 block flex items-center justify-between">
                <span>Paystack Secret Key *</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (e.g. sk_live_... or sk_test_...)
                </span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type={showSecretKey ? "text" : "password"}
                  value={paystackSecretKey}
                  onChange={(e) => setPaystackSecretKey(e.target.value)}
                  placeholder="sk_live_... or sk_test_..."
                  className="w-full pl-9 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden focus:bg-white text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-medium pt-0.5">
                Used to securely initialize MoMo and card checkout sessions directly with Paystack.
              </p>
            </div>

            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="font-bold text-slate-800 block text-xs">Environment Mode</span>
                <span className="text-[11px] text-slate-500 block">
                  Toggle between Paystack Test mode (free testing) and Live mode (real payments).
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={paystackTestMode}
                  onChange={(e) => setPaystackTestMode(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                />
                <span>{paystackTestMode ? "Test Sandbox Enabled" : "Live Production"}</span>
              </label>
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/70 text-[11px] text-blue-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Paystack Webhook Configuration</span>
              </div>
              <p className="text-slate-600 leading-normal">
                In your Paystack Dashboard (<strong>Settings &rarr; API Keys &amp; Webhooks</strong>), set your Live and Test Webhook URL to:
              </p>
              <code className="block p-2 rounded-lg bg-white border border-blue-200 font-mono text-[11px] text-blue-950 font-bold select-all">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/payments/webhook`
                  : "https://yourdomain.com/api/payments/webhook"}
              </code>
            </div>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving Settings..." : "Save All Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
