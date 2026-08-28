"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Droplets, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok && res.status !== 200) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 flex flex-col justify-center py-12 px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white shadow-xl group-hover:scale-105 transition-transform duration-300">
              <Droplets className="w-7 h-7 fill-current" />
            </div>
            <span className="font-black text-2xl tracking-tight text-white">
              Kay&apos;s <span className="text-sky-400">Packs</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {submitted ? (
            /* ── Success state ────────────────────────────────────────────── */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Check your email</h2>
                <p className="text-sky-200/70 text-sm mt-2 leading-relaxed">
                  If an account exists for{" "}
                  <span className="text-sky-300 font-semibold">{email}</span>,
                  you&apos;ll receive a password reset link within a few minutes.
                </p>
              </div>
              <div className="pt-2 space-y-2">
                <p className="text-sky-200/50 text-xs">
                  Didn&apos;t receive it? Check your spam folder.
                </p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setEmail(""); }}
                  className="text-sky-400 text-xs font-semibold hover:text-sky-300 transition-colors"
                >
                  Try a different email →
                </button>
              </div>
              <Link
                href="/login"
                className="block mt-4 text-center py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-bold rounded-xl transition-all"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form state ───────────────────────────────────────────────── */
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-black text-white">Forgot password?</h1>
                <p className="text-sky-200/70 text-sm mt-2 leading-relaxed">
                  No worries — enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-bold text-sky-200 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/60 pointer-events-none" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-sky-200/30 focus:border-sky-500 focus:ring-3 focus:ring-sky-500/10 outline-none transition-all"
                    />
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
                  id="forgot-password-submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-white/10 text-center">
                <Link
                  href="/login"
                  className="text-xs text-sky-400 font-semibold hover:text-sky-300 transition-colors"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
