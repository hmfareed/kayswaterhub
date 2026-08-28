import React from "react";

interface BrandLogoProps {
  brand: string;
  className?: string;
}

export function BrandLogo({ brand, className = "h-8 w-auto" }: BrandLogoProps) {
  const normalized = brand.toLowerCase().replace(/[\s-_]/g, "");

  if (normalized.includes("voltic")) {
    return (
      <div className={`inline-flex items-center justify-center font-bold tracking-tight ${className}`}>
        <span className="text-[#E11D48] text-2xl font-black italic tracking-tighter">Voltic</span>
      </div>
    );
  }

  if (normalized.includes("belaqua") || normalized.includes("bel-aqua")) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className="bg-[#E11D48] text-white px-2.5 py-1 rounded font-bold text-xs tracking-wider uppercase">
          BEL-AQUA
        </div>
      </div>
    );
  }

  if (normalized.includes("aquasplash") || normalized.includes("aqua")) {
    return (
      <div className={`inline-flex flex-col items-center justify-center leading-none ${className}`}>
        <span className="text-[#0284C7] font-black text-sm tracking-wider uppercase">AQUA</span>
        <span className="text-[#0284C7] font-serif italic text-base -mt-1 font-bold">Splash</span>
      </div>
    );
  }

  if (normalized.includes("awake")) {
    return (
      <div className={`inline-flex items-center justify-center font-bold ${className}`}>
        <span className="text-[#0F172A] text-lg font-black tracking-wider uppercase font-sans">AWAKE</span>
      </div>
    );
  }

  if (normalized.includes("verna")) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <span className="text-[#C026D3] font-bold italic text-xl tracking-tight font-serif">Verna</span>
      </div>
    );
  }

  if (normalized.includes("perla")) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className="bg-[#0B1E48] text-white px-3 py-1 rounded-full font-bold text-xs tracking-wider uppercase">
          PERLA
        </div>
      </div>
    );
  }

  if (normalized.includes("slem") || normalized.includes("slim")) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <div className="bg-[#059669] text-white px-2.5 py-0.5 rounded font-bold text-xs tracking-wider uppercase">
          SLEM FIT
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center font-bold text-slate-800 text-sm ${className}`}>
      {brand}
    </div>
  );
}

// ─── Payment Provider Logos ──────────────────────────────────────────────────
export function PaymentMethodBadge({ method }: { method: "MTN" | "TELECEL" | "AIRTELTIGO" | "VISA" | "MASTERCARD" }) {
  if (method === "MTN") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ffcc00] text-slate-950 font-black text-[11px] rounded-lg shadow-xs">
        <span className="w-2 h-2 rounded-full bg-slate-950"></span>
        <span>MTN MoMo</span>
      </div>
    );
  }

  if (method === "TELECEL") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#e60000] text-white font-black text-[11px] rounded-lg shadow-xs">
        <span>Telecel Cash</span>
      </div>
    );
  }

  if (method === "AIRTELTIGO") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#003399] text-white font-black text-[11px] rounded-lg shadow-xs">
        <span>AT Money</span>
      </div>
    );
  }

  if (method === "VISA") {
    return (
      <div className="px-2 py-0.5 border border-slate-200 rounded font-black text-[#1a1f71] text-xs italic tracking-wider bg-white">
        VISA
      </div>
    );
  }

  if (method === "MASTERCARD") {
    return (
      <div className="flex items-center px-1.5 py-0.5 border border-slate-200 rounded bg-white">
        <div className="w-3.5 h-3.5 rounded-full bg-[#eb001b] -mr-1.5 opacity-90"></div>
        <div className="w-3.5 h-3.5 rounded-full bg-[#f79e1b] opacity-90"></div>
      </div>
    );
  }

  return null;
}
