"use client";

import React, { useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Droplets,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

type IdentifierMode = "email" | "phone";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [mode, setMode] = useState<IdentifierMode>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleModeSwitch = useCallback((newMode: IdentifierMode) => {
    setMode(newMode);
    setIdentifier("");
    setError("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        identifier: identifier.trim(),
        password,
        rememberMe,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("locked")) {
          setError(result.error);
        } else {
          setError("Incorrect email/phone or password. Please try again.");
        }
        setLoading(false);
        return;
      }

      const targetUrl =
        callbackUrl && callbackUrl !== "/"
          ? callbackUrl
          : identifier.toLowerCase().trim() === "khadijahabass273@gmail.com"
          ? "/admin/dashboard"
          : "/";

      router.push(targetUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* ── Top Left Back Button ─────────────────────────────────────────── */}
      <Link
        href="/"
        aria-label="Back to Store"
        className="absolute top-4 left-4 z-30 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-xs backdrop-blur-md transition-all text-xs font-bold hover:bg-white active:scale-95 group"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Store</span>
      </Link>
      {/* ── Left decorative panel (hidden on mobile) ─────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #0c4a6e 50%, #0369a1 100%)",
        }}
      >
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
            style={{
              background: "radial-gradient(circle, #38bdf8, transparent)",
              top: "-100px",
              left: "-100px",
              animation: "float 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
            style={{
              background: "radial-gradient(circle, #7c3aed, transparent)",
              bottom: "0",
              right: "-50px",
              animation: "float 10s ease-in-out infinite reverse",
            }}
          />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white shadow-xl group-hover:scale-105 transition-transform duration-300">
              <Droplets className="w-7 h-7 fill-current" />
            </div>
            <span className="font-black text-2xl tracking-tight text-white">
              Kay&apos;s <span className="text-sky-400">Packs</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-white leading-tight">
              Pure water,<br />
              <span className="text-sky-400">delivered fast.</span>
            </h2>
            <p className="text-sky-100/70 text-base leading-relaxed max-w-sm">
              Sign in to manage your orders, track deliveries, and enjoy
              exclusive member discounts.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: "🛡️", title: "Secured with JWT", desc: "Your session is encrypted end-to-end" },
              { icon: "⚡", title: "Fast Delivery", desc: "Real-time order tracking across Ghana" },
              { icon: "💧", title: "Top Water Brands", desc: "Voltic, Bel-Aqua, Verna & more" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 backdrop-blur border border-white/10"
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{item.title}</p>
                  <p className="text-sky-200/60 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sky-200/40 text-xs">
          © 2026 Kay&apos;s Packs. All rights reserved.
        </div>
      </div>

      {/* ── Right: Login form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-10 lg:px-16 bg-slate-50">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Droplets className="w-6 h-6 fill-current" />
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-900">
              Kay&apos;s <span className="text-blue-600">Packs</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* Centered Welcome Title */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-2">
              Sign in to your Kay&apos;s Packs account
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-slate-200/60 rounded-xl mb-6">
            {(["email", "phone"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeSwitch(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  mode === m
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "email" ? (
                  <Mail className="w-3.5 h-3.5" />
                ) : (
                  <Phone className="w-3.5 h-3.5" />
                )}
                {m === "email" ? "Email" : "Phone number"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier field */}
            <div>
              <label
                htmlFor="login-identifier"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                {mode === "email" ? "Email address" : "Phone number"}
              </label>
              <div className="relative">
                {mode === "email" ? (
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                ) : (
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                )}
                <input
                  id="login-identifier"
                  type={mode === "email" ? "email" : "tel"}
                  required
                  autoComplete={mode === "email" ? "email" : "tel"}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError("");
                  }}
                  placeholder={
                    mode === "email" ? "name@example.com" : "024 123 4567"
                  }
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="text-xs font-bold text-slate-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                id="login-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="login-remember"
                className="text-xs text-slate-600 cursor-pointer"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Don't have an account under Sign In button */}
            <p className="text-center text-xs text-slate-500 pt-2">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
              >
                Create one for free →
              </Link>
            </p>
          </form>

          {/* Trust badges */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[11px]">
                256-bit SSL encrypted · Your data is always safe
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
