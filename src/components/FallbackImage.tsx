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
        <img 
          src="/logo-mark-transparent.png" 
          alt="Hospyn Logo" 
          className={`shrink-0 object-contain ${className}`} 
        />
      );
    }

    if (type === "header-logo") {
      return (
        <div className={`flex items-center gap-2.5 ${className}`} id="header-logo">
          <img 
            src="/logo-mark-transparent.png" 
            alt="Hospyn" 
            className="w-8 h-8 object-contain shrink-0 drop-shadow-xs" 
          />
          <span className="text-xl font-black text-[#0c2340] tracking-tight font-sans select-none">Hospyn</span>
        </div>
      );
    }

    if (type === "app-icon") {
      return (
        <img 
          src="/logo.png" 
          alt="Hospyn App" 
          className={`shrink-0 object-contain rounded-2xl ${className}`} 
          id="app-icon-logo" 
        />
      );
    }

    if (type === "splash-logo") {
      return (
        <div className={`flex flex-col items-center justify-center ${className}`} id="splash-logo">
          <img 
            src="/logo.png" 
            alt="Hospyn Logo" 
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-2xl drop-shadow-md" 
          />
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
