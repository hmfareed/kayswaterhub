import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Header */}
      <section className="bg-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Data Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            How we protect your personal information and transactions
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-8 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              To fulfill water orders and facilitate delivery, we collect your name, phone number, delivery address (including GPS and GhanaPost digital address), and email address.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. How Your Data is Used</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>To route and assign delivery drivers to your drop-off location.</li>
              <li>To send order confirmation SMS and live tracking status updates.</li>
              <li>To process secure transactions via Paystack.</li>
              <li>We never sell or rent your personal contact information to third-party marketing companies.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Payment Information Security</h2>
            <p>
              Payment data is encrypted and handled exclusively by Paystack under PCI-DSS Level 1 certification. We do not store credit card numbers, CVVs, or MoMo PINs on our servers.
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
              <Link href="/refund-policy" className="hover:text-blue-600">Refund Policy</Link>
              <span>·</span>
              <Link href="/faq" className="hover:text-blue-600">FAQ</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
