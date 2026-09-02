import React from "react";
import Link from "next/link";
import { FileText, Shield, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Header */}
      <section className="bg-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Last updated: August 2026 · Applicable across Ghana operations
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-8 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Kay&apos;s Packs (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), placing an order for water packs, or creating an account, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Products &amp; Availability</h2>
            <p>
              We distribute sealed mineral, purified, and sparkling water products sourced from licensed manufacturers in Ghana (including Voltic, Bel-Aqua, Verna, Awake, Perla, and Slem Fit). While we endeavor to keep inventory accurate in real time, product availability may occasionally fluctuate during high demand.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Orders, Pricing &amp; Delivery</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>All prices are quoted in Ghana Cedis (GH₵) and include applicable statutory taxes.</li>
              <li>Delivery fees are calculated dynamically based on distance from our distribution hubs or fixed zone tariffs.</li>
              <li>Door delivery requires an accurate digital address, landmark, and accessible contact number for our dispatch riders.</li>
              <li>Self-pickup orders must be collected within 48 hours of order confirmation at our East Legon Depot Hub.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. Payments &amp; Security</h2>
            <p>
              Payments on Kay&apos;s Packs are processed exclusively via Paystack, utilizing 256-bit encryption for Ghana Mobile Money (MTN, Telecel, AT) and credit/debit cards (Visa, Mastercard). We do not collect or store full card details or MoMo PINs on our servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">5. Cancellations &amp; Modifications</h2>
            <p>
              Orders may be cancelled or modified prior to dispatch by contacting support at <a href="tel:+233504903022" className="text-blue-600 font-bold underline">+233 50 490 3022</a>. Once an order is with the rider for delivery, cancellation may be subject to a nominal dispatch fee.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">6. Limitation of Liability</h2>
            <p>
              Kay&apos;s Packs shall not be liable for indirect, incidental, or consequential damages arising from delays caused by extreme weather, severe traffic disruptions, or inaccurate customer delivery coordinates.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">7. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of Ghana.
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
              <Link href="/refund-policy" className="hover:text-blue-600">Refund Policy</Link>
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
