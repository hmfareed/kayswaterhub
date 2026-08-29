"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Droplets,
  Mail,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

type IdentifierMode = "email" | "phone";

/** Password strength check */
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score === 2) return { score, label: "Fair", color: "#f97316" };
  if (score === 3) return { score, label: "Good", color: "#eab308" };
  return { score, label: "Strong", color: "#22c55e" };
}

export default function RegisterPage() {
  const router = useRouter();

  const [mode, setMode] = useState<IdentifierMode>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const passwordStrength = getPasswordStrength(password);

  const handleModeSwitch = useCallback((newMode: IdentifierMode) => {
    setMode(newMode);
    setEmail("");
    setPhone("");
    setError("");
    setFieldErrors({});
  }, []);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!agreeToTerms) {
      setFieldErrors({ agreeToTerms: "You must agree to the terms to continue." });
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        identifierType: mode,
        email: mode === "email" ? email.trim() : undefined,
        phone: mode === "phone" ? phone.trim() : undefined,
        password,
        confirmPassword,
        agreeToTerms,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fields) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(data.fields as Record<string, string[]>).map(([k, v]) => [k, v[0]])
            )
          );
        }
        setError(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Auto sign-in after successful registration
      const signInResult = await signIn("credentials", {
        identifier: mode === "email" ? email.trim() : phone.trim(),
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but auto-login failed — redirect to login
        router.push("/login?registered=1");
        return;
      }

      router.push("/account");
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
      {/* ── Left decorative panel (Blue theme matching login) ─────────────── */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #0c4a6e 50%, #0369a1 100%)",
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
            style={{
              background: "radial-gradient(circle, #38bdf8, transparent)",
              top: "-100px",
              right: "-100px",
              animation: "float 9s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-[300px] h-[300px] rounded-full opacity-15 blur-3xl"
            style={{
              background: "radial-gradient(circle, #7c3aed, transparent)",
              bottom: "80px",
              left: "0",
              animation: "float 7s ease-in-out infinite reverse",
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
              Join thousands of<br />
              <span className="text-sky-400">happy customers.</span>
            </h2>
            <p className="text-sky-100/70 text-base leading-relaxed max-w-sm">
              Create your free account and get your favourite water brands delivered to your door in Ghana.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: "✅", text: "Free account, no subscription needed" },
              { icon: "📦", text: "Track all your orders in real-time" },
              { icon: "💰", text: "Member-only discounts on bulk orders" },
              { icon: "🚚", text: "Nationwide delivery across Ghana" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sky-100/80 text-sm">
                <span className="text-base">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sky-200/40 text-xs">
          © 2026 Kay&apos;s Packs. All rights reserved.
        </div>
      </div>

      {/* ── Right: Registration form ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-10 lg:px-16 bg-slate-50 min-h-screen">
        {/* Mobile logo */}
        <div className="lg:hidden mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Droplets className="w-6 h-6 fill-current" />
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-900">
              Kay&apos;s <span className="text-blue-600">Packs</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto my-auto">
          {/* Centered Title */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-black text-slate-900">Create account</h1>
            <p className="text-slate-500 text-sm mt-1.5">
              Join Kay&apos;s Packs for pure water delivery
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-slate-200/60 rounded-xl mb-5">
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
                {m === "email" ? <Mail className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                {m === "email" ? "Use email" : "Use phone"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full name */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-bold text-slate-700 mb-1">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
                  placeholder="e.g. Kwame Mensah"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-3 focus:ring-blue-500/10 outline-none transition-all ${fieldErrors.name ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-blue-500"}`}
                />
              </div>
              {fieldErrors.name && <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.name}</p>}
            </div>

            {/* Email or Phone */}
            {mode === "email" ? (
              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold text-slate-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                    placeholder="name@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-3 focus:ring-blue-500/10 outline-none transition-all ${fieldErrors.email ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-blue-500"}`}
                  />
                </div>
                {fieldErrors.email && <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.email}</p>}
              </div>
            ) : (
              <div>
                <label htmlFor="reg-phone" className="block text-xs font-bold text-slate-700 mb-1">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="reg-phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); clearFieldError("phone"); }}
                    placeholder="024 123 4567"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-3 focus:ring-blue-500/10 outline-none transition-all ${fieldErrors.phone ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-blue-500"}`}
                  />
                </div>
                {fieldErrors.phone && <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.phone}</p>}
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  className={`w-full pl-10 pr-12 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-3 focus:ring-blue-500/10 outline-none transition-all ${fieldErrors.password ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-blue-500"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength meter */}
              {password && (
                <div className="mt-1.5">
                  <div className="flex gap-1 mb-0.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: i <= passwordStrength.score ? passwordStrength.color : "#e2e8f0",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] font-semibold" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
              {fieldErrors.password && <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-bold text-slate-700 mb-1">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword"); }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-2.5 bg-white border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-3 focus:ring-blue-500/10 outline-none transition-all ${fieldErrors.confirmPassword ? "border-red-400" : confirmPassword && confirmPassword === password ? "border-green-400" : "border-slate-200 focus:border-blue-500"}`}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {confirmPassword && confirmPassword === password && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-[11px] mt-1 font-medium">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5 pt-0.5">
              <input
                id="reg-terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => { setAgreeToTerms(e.target.checked); clearFieldError("agreeToTerms"); }}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
              />
              <label htmlFor="reg-terms" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 font-semibold hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-blue-600 font-semibold hover:underline">Privacy Policy</Link>
              </label>
            </div>
            {fieldErrors.agreeToTerms && (
              <p className="text-red-500 text-[11px] font-medium">{fieldErrors.agreeToTerms}</p>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="register-submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Already registered link under Create Account button */}
            <p className="text-center text-xs text-slate-500 pt-1.5 pb-1">
              Already registered?{" "}
              <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                Sign in here →
              </Link>
            </p>
          </form>

          {/* Trust badges */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[11px]">256-bit SSL encrypted · We never sell your data</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
