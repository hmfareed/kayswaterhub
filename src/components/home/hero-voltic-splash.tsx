"use client";

import React from "react";

export function HeroVolticSplash() {
  return (
    <div className="w-full flex flex-col items-center justify-center select-none relative py-2 sm:py-4">
      {/* ── Main Stage with Splash Bottle (Well Centered & Fully Visible) ──────────── */}
      <div className="relative w-full max-w-[320px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[540px] xl:max-w-[600px] h-[340px] sm:h-[440px] md:h-[500px] lg:h-[560px] xl:h-[620px] flex items-center justify-center">
        
        {/* Dynamic Water Ripple & Sky-Blue Ambient Glow Backdrop */}
        <div
          className="absolute inset-2 sm:inset-6 rounded-full blur-3xl transition-all duration-700 pointer-events-none -z-10 animate-pulse-soft opacity-70"
          style={{
            background:
              "radial-gradient(circle, rgba(0, 102, 255, 0.22) 0%, rgba(56, 189, 248, 0.14) 50%, rgba(255, 255, 255, 0) 75%)",
          }}
        />

        {/* Ambient subtle floating bubbles & water droplets */}
        <div className="absolute top-4 left-6 w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-300/40 blur-[1px] animate-droplet-float pointer-events-none" />
        <div className="absolute bottom-8 right-2 w-3.5 h-3.5 sm:w-6 sm:h-6 rounded-full bg-cyan-300/40 blur-[1px] animate-droplet-float [animation-delay:1.8s] pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-sky-300/50 animate-droplet-float [animation-delay:0.9s] pointer-events-none" />
        <div className="absolute bottom-6 left-8 w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full bg-blue-200/40 animate-droplet-float [animation-delay:2.5s] pointer-events-none" />

        {/* The Clean Trimmed Voltic Bottle perfectly centered and fully visible */}
        <div className="relative w-full h-full flex items-center justify-center p-2 z-10">
          <img
            src="/images/voltic-splash-trimmed.png"
            alt="Voltic Natural Mineral Water Bottle with Water Splashes"
            className="w-auto h-full max-h-[320px] sm:max-h-[420px] md:max-h-[480px] lg:max-h-[540px] xl:max-h-[600px] object-contain object-center filter drop-shadow-[0_15px_30px_rgba(0,102,255,0.18)]"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
