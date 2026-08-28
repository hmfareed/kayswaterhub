import React from "react";

interface WaterBottleGraphicProps {
  brand: string;
  size?: "330ml" | "350ml" | "500ml" | "750ml" | "1.5L" | "19L" | "sachet";
  isPack?: boolean;
  className?: string;
}

export function WaterBottleGraphic({
  brand,
  size = "500ml",
  isPack = false,
  className = "w-32 h-44",
}: WaterBottleGraphicProps) {
  const normalized = brand.toLowerCase();

  // Determine cap color & label color
  let capColor = "#0284c7"; // default blue
  let labelBg = "#0284c7";
  let labelText = "WATER";
  let textColor = "#ffffff";
  let badgeAccent = "#38bdf8";

  if (normalized.includes("voltic")) {
    capColor = "#1e40af"; // dark blue
    labelBg = "#e11d48"; // vibrant red
    labelText = "Voltic";
    textColor = "#ffffff";
    badgeAccent = "#1e3a8a";
  } else if (normalized.includes("bel-aqua") || normalized.includes("belaqua")) {
    capColor = "#dc2626"; // red cap
    labelBg = "#dc2626"; // red label
    labelText = "BEL-AQUA";
    textColor = "#ffffff";
    badgeAccent = "#f87171";
  } else if (normalized.includes("aqua-splash") || normalized.includes("splash")) {
    capColor = "#0284c7"; // cyan blue
    labelBg = "#0284c7";
    labelText = "Aqua Splash";
    textColor = "#ffffff";
    badgeAccent = "#38bdf8";
  } else if (normalized.includes("verna")) {
    capColor = "#c026d3"; // magenta/purple cap
    labelBg = "#c026d3";
    labelText = "Verna";
    textColor = "#ffffff";
    badgeAccent = "#f472b6";
  } else if (normalized.includes("awake")) {
    capColor = "#0284c7";
    labelBg = "#0369a1";
    labelText = "AWAKE";
    textColor = "#ffffff";
    badgeAccent = "#38bdf8";
  } else if (normalized.includes("perla")) {
    capColor = "#1e3a8a";
    labelBg = "#1e3a8a";
    labelText = "PERLA";
    textColor = "#ffffff";
    badgeAccent = "#60a5fa";
  } else if (normalized.includes("slem") || normalized.includes("slim")) {
    capColor = "#059669";
    labelBg = "#059669";
    labelText = "SLEM FIT";
    textColor = "#ffffff";
    badgeAccent = "#34d399";
  }

  // Sachet rendering
  if (size === "sachet" || normalized.includes("sachet")) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="sachetGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          <rect x="25" y="30" width="110" height="100" rx="8" fill="url(#sachetGrad)" stroke="#0284c7" strokeWidth="2" />
          <path d="M 25 30 Q 80 45 135 30 L 135 130 Q 80 115 25 130 Z" fill="#38bdf8" fillOpacity="0.2" />
          <rect x="35" y="60" width="90" height="40" rx="4" fill="#0284c7" fillOpacity="0.9" />
          <text x="80" y="80" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
            PURE WATER
          </text>
          <text x="80" y="93" textAnchor="middle" fill="#e0f2fe" fontSize="9" fontWeight="600" fontFamily="sans-serif">
            500ml • 30 Bags
          </text>
        </svg>
      </div>
    );
  }

  // Dispenser 19L rendering
  if (size === "19L" || normalized.includes("dispenser")) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 160 200" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="dispenserGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="30%" stopColor="#e0f2fe" />
              <stop offset="70%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#7dd3fc" />
            </linearGradient>
          </defs>
          {/* Cap */}
          <rect x="70" y="10" width="20" height="15" rx="3" fill="#0284c7" />
          {/* Neck */}
          <rect x="65" y="25" width="30" height="20" rx="4" fill="#7dd3fc" />
          {/* Shoulder */}
          <path d="M 65 45 C 50 55, 30 75, 30 95 L 30 180 C 30 190, 40 195, 80 195 C 120 195, 130 190, 130 180 L 130 95 C 130 75, 110 55, 95 45 Z" fill="url(#dispenserGrad)" stroke="#38bdf8" strokeWidth="1.5" />
          {/* Rings on bottle */}
          <line x1="32" y1="120" x2="128" y2="120" stroke="#0284c7" strokeWidth="1.5" strokeOpacity="0.4" />
          <line x1="32" y1="150" x2="128" y2="150" stroke="#0284c7" strokeWidth="1.5" strokeOpacity="0.4" />
          {/* Label */}
          <rect x="45" y="95" width="70" height="45" rx="4" fill={labelBg} />
          <text x="80" y="122" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
            {labelText}
          </text>
        </svg>
      </div>
    );
  }

  // Pack Bundle Rendering (multiple bottles with packaging wrap)
  if (isPack) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id={`waterGrad-${normalized}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#f0f9ff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="shrinkWrap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Back row bottles */}
          <g opacity="0.85" transform="scale(0.85) translate(8, 0)">
            <rect x="35" y="20" width="10" height="8" rx="2" fill={capColor} />
            <path d="M 33 28 L 47 28 L 52 45 L 52 140 L 28 140 L 28 45 Z" fill={`url(#waterGrad-${normalized})`} stroke="#38bdf8" strokeWidth="0.8" />
            <rect x="28" y="70" width="24" height="28" fill={labelBg} opacity="0.9" />

            <rect x="75" y="20" width="10" height="8" rx="2" fill={capColor} />
            <path d="M 73 28 L 87 28 L 92 45 L 92 140 L 68 140 L 68 45 Z" fill={`url(#waterGrad-${normalized})`} stroke="#38bdf8" strokeWidth="0.8" />
            <rect x="68" y="70" width="24" height="28" fill={labelBg} opacity="0.9" />

            <rect x="115" y="20" width="10" height="8" rx="2" fill={capColor} />
            <path d="M 113 28 L 127 28 L 132 45 L 132 140 L 108 140 L 108 45 Z" fill={`url(#waterGrad-${normalized})`} stroke="#38bdf8" strokeWidth="0.8" />
            <rect x="108" y="70" width="24" height="28" fill={labelBg} opacity="0.9" />

            <rect x="155" y="20" width="10" height="8" rx="2" fill={capColor} />
            <path d="M 153 28 L 167 28 L 172 45 L 172 140 L 148 140 L 148 45 Z" fill={`url(#waterGrad-${normalized})`} stroke="#38bdf8" strokeWidth="0.8" />
            <rect x="148" y="70" width="24" height="28" fill={labelBg} opacity="0.9" />
          </g>

          {/* Front row bottles */}
          <g transform="translate(0, 15)">
            {/* Bottle 1 */}
            <rect x="30" y="20" width="12" height="10" rx="2.5" fill={capColor} />
            <path d="M 28 30 L 44 30 L 50 50 L 50 155 C 50 158, 48 160, 44 160 L 28 160 C 24 160, 22 158, 22 155 L 22 50 Z" fill={`url(#waterGrad-${normalized})`} stroke="#0284c7" strokeWidth="1" />
            <rect x="22" y="80" width="28" height="35" rx="2" fill={labelBg} />
            <text x="36" y="102" textAnchor="middle" fill={textColor} fontSize="7" fontWeight="bold" fontFamily="sans-serif">
              {labelText.slice(0, 5)}
            </text>

            {/* Bottle 2 */}
            <rect x="74" y="20" width="12" height="10" rx="2.5" fill={capColor} />
            <path d="M 72 30 L 88 30 L 94 50 L 94 155 C 94 158, 92 160, 88 160 L 72 160 C 68 160, 66 158, 66 155 L 66 50 Z" fill={`url(#waterGrad-${normalized})`} stroke="#0284c7" strokeWidth="1" />
            <rect x="66" y="80" width="28" height="35" rx="2" fill={labelBg} />
            <text x="80" y="102" textAnchor="middle" fill={textColor} fontSize="7" fontWeight="bold" fontFamily="sans-serif">
              {labelText.slice(0, 5)}
            </text>

            {/* Bottle 3 */}
            <rect x="118" y="20" width="12" height="10" rx="2.5" fill={capColor} />
            <path d="M 116 30 L 132 30 L 138 50 L 138 155 C 138 158, 136 160, 132 160 L 116 160 C 112 160, 110 158, 110 155 L 110 50 Z" fill={`url(#waterGrad-${normalized})`} stroke="#0284c7" strokeWidth="1" />
            <rect x="110" y="80" width="28" height="35" rx="2" fill={labelBg} />
            <text x="124" y="102" textAnchor="middle" fill={textColor} fontSize="7" fontWeight="bold" fontFamily="sans-serif">
              {labelText.slice(0, 5)}
            </text>

            {/* Bottle 4 */}
            <rect x="162" y="20" width="12" height="10" rx="2.5" fill={capColor} />
            <path d="M 160 30 L 176 30 L 182 50 L 182 155 C 182 158, 180 160, 176 160 L 160 160 C 156 160, 154 158, 154 155 L 154 50 Z" fill={`url(#waterGrad-${normalized})`} stroke="#0284c7" strokeWidth="1" />
            <rect x="154" y="80" width="28" height="35" rx="2" fill={labelBg} />
            <text x="168" y="102" textAnchor="middle" fill={textColor} fontSize="7" fontWeight="bold" fontFamily="sans-serif">
              {labelText.slice(0, 5)}
            </text>

            {/* Transparent Shrink Wrap Band */}
            <rect x="18" y="65" width="168" height="90" rx="6" fill="url(#shrinkWrap)" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
          </g>

          {/* Pack size indicator badge */}
          <g transform="translate(145, 25)">
            <rect width="48" height="18" rx="9" fill="#1e293b" fillOpacity="0.9" />
            <text x="24" y="12" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
              24 Pack
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // Single Bottle View
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 180" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id={`singleBottle-${normalized}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#f0f9ff" stopOpacity="0.98" />
            <stop offset="65%" stopColor="#e0f2fe" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="reflection" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Bottle Cap */}
        <rect x="42" y="8" width="16" height="14" rx="3" fill={capColor} stroke="#ffffff" strokeWidth="0.5" />
        <line x1="42" y1="13" x2="58" y2="13" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.6" />

        {/* Neck */}
        <path d="M 44 22 L 56 22 L 58 35 L 42 35 Z" fill={`url(#singleBottle-${normalized})`} stroke="#0284c7" strokeWidth="0.5" />

        {/* Body */}
        <path
          d="M 42 35 C 32 45, 24 60, 24 85 L 24 160 C 24 168, 30 172, 50 172 C 70 172, 76 168, 76 160 L 76 85 C 76 60, 68 45, 58 35 Z"
          fill={`url(#singleBottle-${normalized})`}
          stroke="#0284c7"
          strokeWidth="1.2"
        />

        {/* Grip grooves */}
        <path d="M 25 118 Q 50 122 75 118" stroke="#38bdf8" strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M 25 128 Q 50 132 75 128" stroke="#38bdf8" strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M 25 138 Q 50 142 75 138" stroke="#38bdf8" strokeWidth="1" fill="none" opacity="0.6" />

        {/* Brand Label */}
        <rect x="24.5" y="70" width="51" height="42" rx="3" fill={labelBg} />
        <rect x="25" y="71" width="50" height="3" fill={badgeAccent} />
        <text x="50" y="96" textAnchor="middle" fill={textColor} fontSize="9" fontWeight="900" fontFamily="sans-serif">
          {labelText}
        </text>
        <text x="50" y="106" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold" opacity="0.9" fontFamily="sans-serif">
          {size}
        </text>

        {/* Glass vertical light shine */}
        <path d="M 28 50 L 32 50 L 32 160 L 28 160 Z" fill="url(#reflection)" opacity="0.7" />
      </svg>
    </div>
  );
}

// ─── Hero Splash Visual ──────────────────────────────────────────────────────
export function HeroSplashVisual({ className = "w-full max-w-lg h-auto" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Dynamic Water Splash and Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 via-cyan-300/30 to-blue-600/20 rounded-full blur-3xl scale-110 pointer-events-none"></div>

      {/* SVG Water Splash Ripples and Droplets */}
      <svg viewBox="0 0 400 320" className="w-full h-full relative z-10 drop-shadow-xl">
        <defs>
          <linearGradient id="splashGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Water Splash Curves at the Base */}
        <ellipse cx="200" cy="275" rx="170" ry="25" fill="#38bdf8" fillOpacity="0.2" />
        <ellipse cx="200" cy="275" rx="130" ry="16" fill="#0284c7" fillOpacity="0.3" />

        {/* Water Splashes Shooting Upward */}
        <path d="M 60 270 Q 75 190 90 220 Q 105 160 120 270 Z" fill="url(#splashGrad)" />
        <path d="M 280 270 Q 295 150 315 200 Q 330 180 345 270 Z" fill="url(#splashGrad)" />

        {/* Floating Water Droplets */}
        <circle cx="75" cy="140" r="6" fill="#38bdf8" fillOpacity="0.8" />
        <circle cx="105" cy="110" r="4" fill="#0284c7" fillOpacity="0.7" />
        <circle cx="310" cy="120" r="7" fill="#38bdf8" fillOpacity="0.8" />
        <circle cx="340" cy="155" r="5" fill="#7dd3fc" fillOpacity="0.9" />
        <circle cx="190" cy="50" r="4.5" fill="#38bdf8" fillOpacity="0.6" />

        {/* Left Bottle: Bel-Aqua */}
        <g transform="translate(70, 70) rotate(-6 45 100) scale(0.9)">
          <rect x="38" y="10" width="14" height="12" rx="2" fill="#dc2626" />
          <path d="M 36 22 L 54 22 L 60 45 L 60 170 C 60 176, 55 180, 45 180 C 35 180, 30 176, 30 170 L 30 45 Z" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" fillOpacity="0.9" />
          <rect x="30" y="80" width="30" height="40" rx="2" fill="#dc2626" />
          <text x="45" y="104" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="sans-serif">BEL-AQUA</text>
        </g>

        {/* Center Main Bottle: Voltic */}
        <g transform="translate(150, 40) scale(1.15)">
          <rect x="38" y="6" width="16" height="14" rx="3" fill="#1e40af" />
          <path d="M 36 20 L 56 20 L 64 45 L 64 185 C 64 192, 57 196, 46 196 C 35 196, 28 192, 28 185 L 28 45 Z" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
          <rect x="28" y="82" width="36" height="46" rx="3" fill="#e11d48" />
          <text x="46" y="108" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontStyle="italic" fontFamily="sans-serif">Voltic</text>
          <text x="46" y="120" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif">MINERAL WATER</text>
        </g>

        {/* Right Bottle: Aqua Splash */}
        <g transform="translate(235, 65) rotate(6 45 100) scale(0.95)">
          <rect x="38" y="10" width="14" height="12" rx="2" fill="#0284c7" />
          <path d="M 36 22 L 54 22 L 60 45 L 60 170 C 60 176, 55 180, 45 180 C 35 180, 30 176, 30 170 L 30 45 Z" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" fillOpacity="0.9" />
          <rect x="30" y="80" width="30" height="40" rx="2" fill="#0284c7" />
          <text x="45" y="98" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="sans-serif">AQUA</text>
          <text x="45" y="110" textAnchor="middle" fill="#ffffff" fontSize="7" fontStyle="italic" fontFamily="sans-serif">Splash</text>
        </g>
      </svg>
    </div>
  );
}
