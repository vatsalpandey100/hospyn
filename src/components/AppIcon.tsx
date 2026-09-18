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
      <img 
        src="/logo-mark-transparent.png" 
        alt="Hospyn Logo" 
        className={`shrink-0 object-contain ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
      />
    );
  }

  return (
    <img 
      src="/logo.png" 
      alt="Hospyn" 
      className={`shrink-0 object-contain rounded-2xl ${showShadow ? "shadow-lg shadow-slate-300/40" : ""} ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    />
  );
};
