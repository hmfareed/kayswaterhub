"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2, Clock } from "lucide-react";
import { StoreNavbar } from "@/components/store/navbar";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { STORE_PHONE_DISPLAY, STORE_WHATSAPP_LINK } from "@/lib/constants";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-slate-900 dark:text-neutral-100 selection:bg-blue-500 selection:text-white">
      <StoreNavbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-neutral-50 tracking-tight">
              Get in Touch
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-neutral-400 mt-3">
              Have questions about your water delivery, bulk orders, or subscription? We&apos;re here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Contact Details Cards */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/60 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-neutral-100 text-base">Phone & WhatsApp</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Direct hotline for fast orders & queries</p>
                  <div className="mt-2 space-y-1">
                    <a href="tel:+233209878744" className="block text-sm font-extrabold text-blue-600 dark:text-blue-400 hover:underline">
                      {STORE_PHONE_DISPLAY} (020 987 8744)
                    </a>
                    <a
                      href={STORE_WHATSAPP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1 rounded-full mt-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-neutral-900/90 border border-slate-100 dark:border-neutral-800 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 dark:bg-neutral-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-neutral-100 text-base">Email Support</h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">For corporate inquiries and partnerships</p>
                  <a href="mailto:support@kayspacks.com" className="block text-sm font-semibold text-slate-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 mt-1">
                    support@kayspacks.com
                  </a>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-neutral-900/90 border border-slate-100 dark:border-neutral-800 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 dark:bg-neutral-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-neutral-100 text-base">Working Hours</h3>
                  <p className="text-xs text-slate-600 dark:text-neutral-300 mt-1">Monday – Saturday: 6:30 AM – 8:00 PM</p>
                  <p className="text-xs text-slate-600 dark:text-neutral-300">Sunday: 8:00 AM – 6:00 PM</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-neutral-900/90 border border-slate-100 dark:border-neutral-800 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 dark:bg-neutral-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-neutral-100 text-base">Delivery Coverage</h3>
                  <p className="text-xs text-slate-600 dark:text-neutral-300 mt-1">
                    Accra Central, East Legon, Spintex, Tema, Kumasi & Nationwide dispatch across Ghana.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Message Form */}
            <div className="lg:col-span-7 bg-slate-50 dark:bg-neutral-900/90 p-8 rounded-3xl border border-slate-100 dark:border-neutral-800">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-neutral-100">Message Received!</h3>
                  <p className="text-sm text-slate-600 dark:text-neutral-300 max-w-md mx-auto">
                    Thank you, <strong>{form.name}</strong>. Our customer support team will contact you at <strong>{form.phone || form.email}</strong> shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-100 mb-2">Send us a Message</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Kwame Mensah"
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="e.g. 024 123 4567"
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="e.g. kwame@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Bulk Delivery Inquiry / Order Status"
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">Your Message *</label>
                    <textarea
                      rows={4}
                      required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us what you need..."
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
