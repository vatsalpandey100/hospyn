import React from "react";

interface AppIconProps {
  size?: number | string;
  className?: string;
  showShadow?: boolean;
  variant?: "squircle" | "mark-only";
}

export const AppIcon: React.FC<AppIconProps> = ({ 
  size = 48, 
  className = "",
  showShadow = true,
  variant = "squircle"
}) => {
  const pixelSize = typeof size === "number" ? `${size}px` : size;

  if (variant === "mark-only") {
    return (
      <div 
        className={`relative shrink-0 select-none ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <svg 
          className="w-full h-full" 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="aiMarkTop" x1="50" y1="7" x2="50" y2="43" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="aiMarkBottom" x1="50" y1="57" x2="50" y2="93" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="aiMarkLeft" x1="7" y1="50" x2="43" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60a5fa" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="aiMarkRight" x1="57" y1="50" x2="93" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="25" rx="13" ry="18" fill="url(#aiMarkTop)" />
          <ellipse cx="50" cy="75" rx="13" ry="18" fill="url(#aiMarkBottom)" />
          <ellipse cx="25" cy="50" rx="18" ry="13" fill="url(#aiMarkLeft)" />
          <ellipse cx="75" cy="50" rx="18" ry="13" fill="url(#aiMarkRight)" />
        </svg>
      </div>
    );
  }

  return (
    <div 
      className={`relative shrink-0 select-none ${showShadow ? "shadow-lg shadow-slate-300/40" : ""} ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <svg 
        className="w-full h-full" 
        viewBox="0 0 512 512" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Background Squircle Gradient */}
          <linearGradient id="aiBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>

          {/* Logo Petal Gradients */}
          <linearGradient id="aiPetalTop" x1="256" y1="84" x2="256" y2="204" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="50%" stopColor="#0084ff" />
            <stop offset="100%" stopColor="#0052d4" />
          </linearGradient>

          <linearGradient id="aiPetalBottom" x1="256" y1="216" x2="256" y2="336" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="50%" stopColor="#0078ff" />
            <stop offset="100%" stopColor="#004bcc" />
          </linearGradient>

          <linearGradient id="aiPetalLeft" x1="130" y1="170" x2="250" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="50%" stopColor="#0080ff" />
            <stop offset="100%" stopColor="#0052d4" />
          </linearGradient>

          <linearGradient id="aiPetalRight" x1="262" y1="170" x2="382" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00d2ff" />
            <stop offset="50%" stopColor="#0080ff" />
            <stop offset="100%" stopColor="#0052d4" />
          </linearGradient>

          {/* Shadow Filter */}
          <filter id="aiPetalShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0052d4" floodOpacity="0.22" />
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#071732" floodOpacity="0.12" />
          </filter>

          {/* Optical Border */}
          <linearGradient id="aiBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>

        {/* Squircle Base */}
        <rect x="12" y="12" width="488" height="488" rx="114" fill="url(#aiBgGrad)" stroke="url(#aiBorderGrad)" strokeWidth="2.5" />

        {/* Hospyn Logo Petals */}
        <g filter="url(#aiPetalShadow)">
          <ellipse cx="256" cy="144" rx="40" ry="58" fill="url(#aiPetalTop)" />
          <ellipse cx="256" cy="276" rx="40" ry="58" fill="url(#aiPetalBottom)" />
          <ellipse cx="190" cy="210" rx="58" ry="40" fill="url(#aiPetalLeft)" />
          <ellipse cx="322" cy="210" rx="58" ry="40" fill="url(#aiPetalRight)" />
        </g>

        {/* Hospyn Navy Wordmark */}
        <text x="256" y="394" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" fontWeight="900" fontSize="82" fill="#071732" letterSpacing="-1.5">Hospyn</text>
      </svg>
    </div>
  );
};
