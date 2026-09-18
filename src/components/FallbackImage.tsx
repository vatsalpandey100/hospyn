import React, { useState } from "react";

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  type: "patient" | "doctor" | "hospital" | "doctor-pfp" | "splash-logo" | "header-logo" | "logo-mark" | "app-icon";
  className?: string;
  alt?: string;
}

export const FallbackImage: React.FC<FallbackImageProps> = ({ type, className, alt, ...props }) => {
  const [error, setError] = useState(false);

  const handleImageError = () => {
    setError(true);
  };

  if (error || !props.src) {
    if (type === "patient") {
      return (
        <div className={`flex flex-col items-center justify-center bg-blue-50 text-blue-600 rounded-2xl ${className}`} id="fallback-patient-ill">
          <svg className="w-20 h-20 motion-safe:animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-500 mt-2">Active Care Patient</span>
        </div>
      );
    }

    if (type === "doctor") {
      return (
        <div className={`flex flex-col items-center justify-center bg-purple-50 text-purple-600 rounded-2xl ${className}`} id="fallback-doctor-ill">
          <svg className="w-20 h-20 motion-safe:animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.745 0 013.296-1.043A3.746 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.745 0 013.296 1.043 3.746 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-500 mt-2">Hospyn Medical Professional</span>
        </div>
      );
    }

    if (type === "doctor-pfp") {
      return (
        <div className={`flex items-center justify-center bg-blue-100 text-blue-700 font-extrabold rounded-full border-2 border-white shadow ${className}`} id="fallback-doc-pfp">
          <span className="text-sm">DR</span>
        </div>
      );
    }

    if (type === "hospital") {
      return (
        <div className={`flex flex-col items-center justify-center bg-slate-50 text-blue-600 rounded-2xl p-4 border border-dashed border-slate-200 ${className}`} id="fallback-hospital-ill">
          <svg className="w-16 h-16 text-blue-500 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.053.194-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
          </svg>
          <span className="text-xs font-semibold text-slate-500">Clinical Center</span>
        </div>
      );
    }

    if (type === "logo-mark") {
      return (
        <svg className={`shrink-0 ${className}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="24" rx="14" ry="19" fill="url(#grad-top)" />
          <ellipse cx="50" cy="76" rx="14" ry="19" fill="url(#grad-bottom)" />
          <ellipse cx="24" cy="50" rx="19" ry="14" fill="url(#grad-left)" />
          <ellipse cx="76" cy="50" rx="19" ry="14" fill="url(#grad-right)" />
          <defs>
            <linearGradient id="grad-top" x1="50" y1="5" x2="50" y2="43" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="grad-bottom" x1="50" y1="57" x2="50" y2="95" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="grad-left" x1="5" y1="50" x2="43" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60a5fa" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="grad-right" x1="57" y1="50" x2="95" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
      );
    }

    if (type === "header-logo") {
      return (
        <div className={`flex items-center gap-2.5 ${className}`} id="header-logo">
          <svg className="w-8 h-8 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="24" rx="14" ry="19" fill="url(#hdr-grad-top)" />
            <ellipse cx="50" cy="76" rx="14" ry="19" fill="url(#hdr-grad-bottom)" />
            <ellipse cx="24" cy="50" rx="19" ry="14" fill="url(#hdr-grad-left)" />
            <ellipse cx="76" cy="50" rx="19" ry="14" fill="url(#hdr-grad-right)" />
            <defs>
              <linearGradient id="hdr-grad-top" x1="50" y1="5" x2="50" y2="43" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="hdr-grad-bottom" x1="50" y1="57" x2="50" y2="95" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="hdr-grad-left" x1="5" y1="50" x2="43" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60a5fa" />
                <stop offset="1" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="hdr-grad-right" x1="57" y1="50" x2="95" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#2563eb" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-xl font-black text-[#0c2340] tracking-tight font-sans select-none">Hospyn</span>
        </div>
      );
    }

    if (type === "app-icon") {
      return (
        <div className={`relative shrink-0 select-none ${className}`} id="app-icon-logo">
          <svg className="w-full h-full" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="fiBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f8fafc" />
              </linearGradient>
              <linearGradient id="fiPetalTop" x1="256" y1="84" x2="256" y2="204" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="50%" stopColor="#0084ff" />
                <stop offset="100%" stopColor="#0052d4" />
              </linearGradient>
              <linearGradient id="fiPetalBottom" x1="256" y1="216" x2="256" y2="336" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="50%" stopColor="#0078ff" />
                <stop offset="100%" stopColor="#004bcc" />
              </linearGradient>
              <linearGradient id="fiPetalLeft" x1="130" y1="170" x2="250" y2="250" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="50%" stopColor="#0080ff" />
                <stop offset="100%" stopColor="#0052d4" />
              </linearGradient>
              <linearGradient id="fiPetalRight" x1="262" y1="170" x2="382" y2="250" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="50%" stopColor="#0080ff" />
                <stop offset="100%" stopColor="#0052d4" />
              </linearGradient>
              <filter id="fiPetalShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0052d4" floodOpacity="0.22" />
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#071732" floodOpacity="0.12" />
              </filter>
              <linearGradient id="fiBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
            </defs>
            <rect x="12" y="12" width="488" height="488" rx="114" fill="url(#fiBgGrad)" stroke="url(#fiBorderGrad)" strokeWidth="2.5" />
            <g filter="url(#fiPetalShadow)">
              <ellipse cx="256" cy="144" rx="40" ry="58" fill="url(#fiPetalTop)" />
              <ellipse cx="256" cy="276" rx="40" ry="58" fill="url(#fiPetalBottom)" />
              <ellipse cx="190" cy="210" rx="58" ry="40" fill="url(#fiPetalLeft)" />
              <ellipse cx="322" cy="210" rx="58" ry="40" fill="url(#fiPetalRight)" />
            </g>
            <text x="256" y="394" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" fontWeight="900" fontSize="82" fill="#071732" letterSpacing="-1.5">Hospyn</text>
          </svg>
        </div>
      );
    }

    if (type === "splash-logo") {
      return (
        <div className={`flex flex-col items-center justify-center ${className}`} id="splash-logo">
          <svg className="w-full h-full min-w-[3rem] min-h-[3rem] max-w-[12rem] max-h-[12rem]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="24" rx="14" ry="19" fill="url(#splash-grad-top)" />
            <ellipse cx="50" cy="76" rx="14" ry="19" fill="url(#splash-grad-bottom)" />
            <ellipse cx="24" cy="50" rx="19" ry="14" fill="url(#splash-grad-left)" />
            <ellipse cx="76" cy="50" rx="19" ry="14" fill="url(#splash-grad-right)" />
            <defs>
              <linearGradient id="splash-grad-top" x1="50" y1="5" x2="50" y2="43" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="splash-grad-bottom" x1="50" y1="57" x2="50" y2="95" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="splash-grad-left" x1="5" y1="50" x2="43" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60a5fa" />
                <stop offset="1" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="splash-grad-right" x1="57" y1="50" x2="95" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#2563eb" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );
    }
  }

  return (
    <img
      className={className}
      alt={alt || "Illustration"}
      onError={handleImageError}
      {...props}
    />
  );
};
