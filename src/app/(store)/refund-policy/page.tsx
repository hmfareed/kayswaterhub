import React from "react";
import Link from "next/link";
import { RefreshCw, CheckCircle2, AlertCircle, ArrowLeft, Phone } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Header */}
      <section className="bg-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Customer Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white">
            Refund &amp; Return Policy
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            100% Quality &amp; Satisfaction Guarantee on all Water Deliveries
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-8 text-sm text-slate-700 leading-relaxed">
          {/* Guarantee Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-950 space-y-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1" />
              <p className="font-bold text-xs uppercase tracking-wide">Defective Bottles</p>
              <p className="text-xs text-emerald-800">Immediate replacement or full refund if seals are compromised.</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-950 space-y-1">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mb-1" />
              <p className="font-bold text-xs uppercase tracking-wide">Wrong Item Sent</p>
              <p className="text-xs text-blue-800">Free swap within 2 hours or same-day dispatch guarantee.</p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-purple-950 space-y-1">
              <CheckCircle2 className="w-5 h-5 text-purple-600 mb-1" />
              <p className="font-bold text-xs uppercase tracking-wide">Fast Paystack Reversal</p>
              <p className="text-xs text-purple-800">Direct refunds back to your MoMo or Card account in 24–48 hours.</p>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Eligibility for Refunds &amp; Replacements</h2>
            <p>
              At Kay&apos;s Packs, we pride ourselves on providing factory-fresh, properly sealed mineral and purified water. You are eligible for a complete refund or immediate replacement in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>The water pack or bottle seal was broken, punctured, or damaged during transit.</li>
              <li>You received a brand or bottle size different from what you ordered (e.g. ordered 750ml but received 500ml).</li>
              <li>Your delivery failed to arrive or was cancelled prior to dispatch.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. How to Request a Refund</h2>
            <p>
              To initiate a return or refund request:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
              <li><strong>Upon Delivery:</strong> Inspect the packs while the delivery rider is present. You may reject damaged packs directly with the rider.</li>
              <li><strong>After Delivery:</strong> Contact our support desk within <strong>24 hours</strong> of receipt via phone or WhatsApp at <a href="tel:+233504903022" className="text-blue-600 font-bold underline">+233 50 490 3022</a> with your Order ID.</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Refund Processing Timeline</h2>
            <p>
              Approved refunds are credited back to the original payment channel (MTN Mobile Money, Telecel Cash, or Visa/Mastercard) through Paystack.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Mobile Money:</strong> Usually processed within 2 to 6 hours.</li>
              <li><strong>Card Payments:</strong> 24 to 48 business hours depending on the issuing bank.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. Non-Refundable Items</h2>
            <p>
              Water packs that have been opened, partially consumed, or stored improperly after receipt cannot be returned for hygiene and food safety regulations.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </Link>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <Link href="/terms" className="hover:text-blue-600">Terms of Service</Link>
              <span>·</span>
              <Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
              <span>·</span>
              <Link href="/faq" className="hover:text-blue-600">FAQ</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
