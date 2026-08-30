"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Lock,
  Loader2,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PaymentMethodBadge } from "@/components/ui/brand-logos";

interface PaymentLoadingOverlayProps {
  isOpen: boolean;
  amount?: number;
  orderNumber?: string;
  customerName?: string;
  itemCount?: number;
  onCancel?: () => void;
}

export function PaymentLoadingOverlay({
  isOpen,
  amount,
  orderNumber,
  customerName,
  itemCount,
  onCancel,
}: PaymentLoadingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showTimeoutFallback, setShowTimeoutFallback] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setShowTimeoutFallback(false);
      return;
    }

    // Step 1 -> Step 2 after 700ms
    const timer1 = setTimeout(() => {
      setCurrentStep(2);
    }, 700);

    // Step 2 -> Step 3 after 1600ms
    const timer2 = setTimeout(() => {
      setCurrentStep(3);
    }, 1600);

    // If redirected takes longer than 12s, show emergency reload/cancel
    const timeoutTimer = setTimeout(() => {
      setShowTimeoutFallback(true);
    }, 12000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timeoutTimer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-redirect-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 dark:bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 select-none"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/50 text-center overflow-hidden animate-in zoom-in-95 duration-250">
        {/* Top Decorative Banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400 animate-pulse" />

        {/* Pulsing Animated Gateway Shield */}
        <div className="relative mx-auto w-20 h-20 sm:w-22 sm:h-22 mb-6 flex items-center justify-center">
          {/* Animated concentric ripples */}
          <span className="absolute inset-0 rounded-3xl bg-blue-500/20 animate-ping [animation-duration:2.5s]" />
          <span className="absolute -inset-2 rounded-3xl bg-blue-600/10 animate-pulse" />

          {/* Center Card */}
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 border border-blue-400/30">
            <Lock className="w-8 h-8 text-white stroke-[2.2] animate-bounce [animation-duration:2s]" />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </span>
          </div>
        </div>

        {/* Title and Subtitle */}
        <h3
          id="payment-redirect-title"
          className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight"
        >
          Connecting to Paystack Gateway
        </h3>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1.5 max-w-xs mx-auto">
          Securing your transaction with 256-bit bank-grade encryption...
        </p>

        {/* Order & Amount Snapshot Card */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-850/80 border border-slate-200/80 dark:border-neutral-800/80 flex items-center justify-between text-left shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">
              {orderNumber ? `Order #${orderNumber}` : "Online Payment Total"}
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
              {itemCount ? `${itemCount} ${itemCount === 1 ? "pack" : "packs"} of water` : "Express Order"}
            </span>
          </div>

          {typeof amount === "number" && (
            <div className="text-right">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Amount to Pay
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                GH₵{amount.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Step Progression Indicators */}
        <div className="mt-5 space-y-2 text-left text-xs">
          {/* Step 1 */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition-all duration-300 ${
              currentStep >= 1
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-slate-400 dark:text-neutral-600"
            }`}
          >
            {currentStep > 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            )}
            <span className="text-[11px] sm:text-xs">Order details verified</span>
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition-all duration-300 ${
              currentStep >= 2
                ? currentStep > 2
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/30"
                : "text-slate-400 dark:text-neutral-600"
            }`}
          >
            {currentStep > 2 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : currentStep === 2 ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-neutral-700 shrink-0" />
            )}
            <span className="text-[11px] sm:text-xs">
              Initializing Paystack SSL session...
            </span>
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl transition-all duration-300 ${
              currentStep >= 3
                ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50/80 dark:bg-blue-950/40"
                : "text-slate-400 dark:text-neutral-600"
            }`}
          >
            {currentStep >= 3 ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-neutral-700 shrink-0" />
            )}
            <span className="text-[11px] sm:text-xs">
              Redirecting to MoMo &amp; Card checkout...
            </span>
          </div>
        </div>

        {/* Supported Ghana Payment Gateways */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-neutral-800">
          <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-2.5">
            Accepted Payments
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <PaymentMethodBadge method="MTN" />
            <PaymentMethodBadge method="TELECEL" />
            <PaymentMethodBadge method="AIRTELTIGO" />
            <PaymentMethodBadge method="VISA" />
            <PaymentMethodBadge method="MASTERCARD" />
          </div>
        </div>

        {/* Security Reassurance Note */}
        <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-4 leading-relaxed">
          🔒 Please do not refresh or close this tab. You will be redirected to Paystack in a moment.
        </p>

        {/* Timeout / Slow Connection Fallback */}
        {showTimeoutFallback && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800 animate-in fade-in">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2">
              Taking longer than usual? Check your internet connection.
            </p>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 text-slate-700 dark:text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Return to Checkout
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
