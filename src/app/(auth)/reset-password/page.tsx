"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Droplets, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const userId = searchParams.get("userId") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const isInvalidLink = !token || !userId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password. The link may have expired.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex flex-col justify-center py-12 px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white shadow-xl group-hover:scale-105 transition-transform duration-300">
              <Droplets className="w-7 h-7 fill-current" />
            </div>
            <span className="font-black text-2xl tracking-tight text-white">
              Kay&apos;s <span className="text-violet-400">Packs</span>
            </span>
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {isInvalidLink ? (
            /* ── Invalid link ─────────────────────────────────────────────── */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Invalid reset link</h2>
                <p className="text-violet-200/70 text-sm mt-2 leading-relaxed">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="block mt-4 text-center py-3 bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold rounded-xl transition-all"
              >
                Request New Link
              </Link>
            </div>
          ) : success ? (
            /* ── Success ──────────────────────────────────────────────────── */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Password updated!</h2>
                <p className="text-violet-200/70 text-sm mt-2 leading-relaxed">
                  Your password has been changed successfully. You can now sign in with your new password.
                </p>
              </div>
              <Link
                href="/login"
                className="block mt-4 text-center py-3.5 bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* ── Form ─────────────────────────────────────────────────────── */
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-black text-white">Set new password</h1>
                <p className="text-violet-200/70 text-sm mt-2">
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-password" className="block text-xs font-bold text-violet-200 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400/60 pointer-events-none" />
                    <input
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="Min. 8 chars, 1 uppercase, 1 number"
                      className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-violet-200/30 focus:border-violet-500 focus:ring-3 focus:ring-violet-500/10 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-violet-400/60 hover:text-violet-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{ backgroundColor: i <= passwordStrength.score ? passwordStrength.color : "rgba(255,255,255,0.1)" }} />
                        ))}
                      </div>
                      <p className="text-[11px] font-semibold" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="reset-confirm" className="block text-xs font-bold text-violet-200 mb-1.5">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400/60 pointer-events-none" />
                    <input
                      id="reset-confirm"
                      type={showConfirm ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-xl text-sm text-white placeholder:text-violet-200/30 outline-none transition-all focus:ring-3 focus:ring-violet-500/10 ${
                        confirmPassword && confirmPassword === password
                          ? "border-green-500/50"
                          : "border-white/10 focus:border-violet-500"
                      }`}
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {confirmPassword && confirmPassword === password && (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      )}
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="text-violet-400/60 hover:text-violet-300 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300 font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  id="reset-password-submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-violet-500 hover:bg-violet-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
