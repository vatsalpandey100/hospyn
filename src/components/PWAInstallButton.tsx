import React, { useState } from "react";
import { Download, Laptop, Smartphone, Sparkles, Check } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { PWAInstallGuideModal } from "./PWAInstallGuideModal";
import { AppIcon } from "./AppIcon";

interface PWAInstallButtonProps {
  variant?: "header" | "menu-item" | "banner" | "button";
  language?: "en" | "hi";
  isDarkMode?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = "header",
  language = "en",
  isDarkMode = false,
  className = ""
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const isHindi = language === "hi";

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // If already installed in standalone mode
  if (isInstalled) {
    if (variant === "menu-item") {
      return (
        <div className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/40 text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-[12.5px] leading-tight">
                {isHindi ? "Hospyn ऐप सक्रिय है" : "Hospyn App Active"}
              </h4>
              <p className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                {isHindi ? "स्टैंडअलोन मोड में सफलतापूर्वक इंस्टॉल किया गया" : "Installed and running as standalone app"}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            {isHindi ? "इंस्टॉल्ड" : "Installed"}
          </span>
        </div>
      );
    }
    return null;
  }

  // Header compact pill / icon button
  if (variant === "header") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[11px] shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer ${className}`}
          title={isHindi ? "Chrome मेनू से ऐप इंस्टॉल करें" : "Install App via Chrome"}
          id="btn-pwa-install-header"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5] animate-pulse" />
          <span className="hidden sm:inline">{isHindi ? "ऐप इंस्टॉल करें" : "Install App"}</span>
          <span className="sm:hidden">{isHindi ? "इंस्टॉल" : "Install"}</span>
        </button>

        <PWAInstallGuideModal
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
          language={language}
          isDarkMode={isDarkMode}
        />
      </>
    );
  }

  // Menu item in Settings / Profile
  if (variant === "menu-item") {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border border-blue-100/80 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 hover:from-blue-100/80 hover:to-indigo-100/60 transition-all text-left group shadow-xs cursor-pointer ${className}`}
          id="btn-pwa-install-profile-menu"
        >
          <div className="flex items-center gap-3.5">
            <AppIcon size={38} className="rounded-xl overflow-hidden group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-[12.5px] leading-tight">
                  {isHindi ? "Hospyn ऐप इंस्टॉल करें (Chrome)" : "Install Hospyn App (Chrome)"}
                </h4>
                <span className="bg-blue-600 text-[9px] font-black text-white px-1.5 py-0.2 rounded-md uppercase">
                  PWA
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold block mt-0.5">
                {isHindi ? "Chrome मेनू या 1-क्लिक से अपने डिवाइस पर जोड़ें" : "Add to home screen or desktop via Chrome menu"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-blue-600 font-extrabold text-xs">
            <span>{isHindi ? "इंस्टॉल" : "Install"}</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </button>

        <PWAInstallGuideModal
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
          language={language}
          isDarkMode={isDarkMode}
        />
      </>
    );
  }

  // Banner variant
  if (variant === "banner") {
    return (
      <>
        <div className={`bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs leading-tight truncate">
                {isHindi ? "Hospyn को Chrome में ऐप के रूप में इंस्टॉल करें" : "Install Hospyn as App in Chrome"}
              </div>
              <div className="text-[10px] text-blue-100 font-medium truncate">
                {isHindi ? "तेज़ एक्सेस, ऑफ़लाइन रिकॉर्ड और लाइव अलर्ट" : "Faster launch, offline access & reminders"}
              </div>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="px-3 py-1.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-black text-xs shrink-0 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {isHindi ? "इंस्टॉल करें" : "Install Now"}
          </button>
        </div>

        <PWAInstallGuideModal
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
          language={language}
          isDarkMode={isDarkMode}
        />
      </>
    );
  }

  // Default Standard Button
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4" />
        {isHindi ? "Chrome में ऐप इंस्टॉल करें" : "Install App in Chrome"}
      </button>

      <PWAInstallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        language={language}
        isDarkMode={isDarkMode}
      />
    </>
  );
};
