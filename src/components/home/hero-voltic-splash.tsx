"use client";

import React from "react";

export function HeroVolticSplash() {
  return (
    <div className="w-full flex flex-col items-center justify-center select-none relative py-2 sm:py-4">
      {/* ── Main Stage with Splash Bottle (Well Centered & Fully Visible) ──────────── */}
      <div className="relative w-full max-w-[320px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[540px] xl:max-w-[600px] h-[340px] sm:h-[440px] md:h-[500px] lg:h-[560px] xl:h-[620px] flex items-center justify-center">
        
        {/* ── Light Mode Ambient Glow Backdrop ── */}
        <div
          className="absolute inset-2 sm:inset-6 rounded-full blur-3xl transition-all duration-700 pointer-events-none -z-10 animate-pulse-soft opacity-70 dark:opacity-0"
          style={{
            background:
              "radial-gradient(circle, rgba(0, 102, 255, 0.22) 0%, rgba(56, 189, 248, 0.14) 50%, rgba(255, 255, 255, 0) 75%)",
          }}
        />

        {/* ── Dark Mode Dynamic Cobalt Glow Backdrop ── */}
        <div
          className="absolute inset-0 sm:-inset-4 rounded-full blur-3xl transition-all duration-700 pointer-events-none -z-10 opacity-0 dark:opacity-90 animate-pulse-soft"
          style={{
            background:
              "radial-gradient(circle, rgba(0, 102, 255, 0.42) 0%, rgba(14, 165, 233, 0.22) 45%, rgba(0, 0, 0, 0) 75%)",
          }}
        />

        {/* ── Light Mode Droplets & Bubbles ── */}
        <div className="dark:hidden">
          <div className="absolute top-4 left-6 w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-blue-300/40 blur-[1px] animate-droplet-float pointer-events-none" />
          <div className="absolute bottom-8 right-2 w-3.5 h-3.5 sm:w-6 sm:h-6 rounded-full bg-cyan-300/40 blur-[1px] animate-droplet-float [animation-delay:1.8s] pointer-events-none" />
          <div className="absolute top-1/4 right-0 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-sky-300/50 animate-droplet-float [animation-delay:0.9s] pointer-events-none" />
          <div className="absolute bottom-6 left-8 w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full bg-blue-200/40 animate-droplet-float [animation-delay:2.5s] pointer-events-none" />
        </div>

        {/* ── Dark Mode Ambient Glowing Bokeh Orbs (Matching Reference Image) ── */}
        <div className="hidden dark:block">
          {/* Top-left soft glowing blue bokeh orb */}
          <div className="absolute -top-3 left-3 sm:-top-4 sm:left-4 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-blue-500/45 blur-md animate-pulse-soft pointer-events-none" />
          <div className="absolute top-1 left-7 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-sky-400/50 blur-[2px] pointer-events-none" />
          
          {/* Mid-right vibrant blue bokeh orb */}
          <div className="absolute top-1/3 -right-2 sm:-right-4 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500/50 blur-md animate-pulse-soft [animation-delay:1.2s] pointer-events-none" />
          
          {/* Bottom-right luminous deep-blue bokeh orb */}
          <div className="absolute bottom-6 -right-1 sm:bottom-10 sm:-right-3 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-600/60 blur-lg animate-pulse-soft [animation-delay:2s] pointer-events-none" />
          <div className="absolute bottom-10 right-4 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-sky-300/60 blur-[2px] pointer-events-none" />
          
          {/* Bottom-left subtle ambient orb */}
          <div className="absolute bottom-8 left-4 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-blue-500/40 blur-md animate-pulse-soft [animation-delay:0.7s] pointer-events-none" />
        </div>

        {/* ── Light Mode Voltic Splash Bottle ── */}
        <div className="absolute inset-0 flex items-center justify-center p-2 z-10 transition-opacity duration-700 ease-in-out opacity-100 dark:opacity-0 dark:pointer-events-none">
          <img
            src="/images/voltic-splash-trimmed.png"
            alt="Voltic Natural Mineral Water Bottle with Water Splashes"
            className="w-auto h-full max-h-[320px] sm:max-h-[420px] md:max-h-[480px] lg:max-h-[540px] xl:max-h-[600px] object-contain object-center filter drop-shadow-[0_15px_30px_rgba(0,102,255,0.18)] select-none"
            draggable={false}
          />
        </div>

        {/* ── Dark Mode Voltic Splash Bottle (User Reference Style) ── */}
        <div className="absolute inset-0 flex items-center justify-center p-2 z-10 transition-opacity duration-700 ease-in-out opacity-0 pointer-events-none dark:opacity-100 dark:pointer-events-auto">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src="/images/voltic-splash-dark-transparent.png"
              alt="Voltic Natural Mineral Water Bottle with Dark Mode Water Splashes"
              className="w-auto h-full max-h-[320px] sm:max-h-[420px] md:max-h-[480px] lg:max-h-[540px] xl:max-h-[600px] object-contain object-center filter drop-shadow-[0_20px_45px_rgba(0,102,255,0.38)] select-none"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

