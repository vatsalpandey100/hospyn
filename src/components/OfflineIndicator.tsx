import React, { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC<{ language?: "en" | "hi" }> = ({ language = "en" }) => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) return null;

  const isHindi = language === "hi";

  if (!isOnline) {
    return (
      <div 
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-2 rounded-full bg-slate-900/90 text-white border border-slate-700/80 px-4 py-2 text-xs font-bold shadow-xl backdrop-blur-md animate-in slide-in-from-top duration-300"
        id="offline-status-banner"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          {isHindi ? "ऑफ़लाइन मोड — कैश्ड डेटा और रिकॉर्ड्स उपलब्ध हैं" : "Offline Mode — Cached data and medical records active"}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-2 rounded-full bg-emerald-700/90 text-white border border-emerald-500/80 px-4 py-2 text-xs font-bold shadow-xl backdrop-blur-md animate-in slide-in-from-top duration-300"
      id="online-reconnected-banner"
    >
      <Wifi className="w-3.5 h-3.5 text-white shrink-0" />
      <span>
        {isHindi ? "इंटरनेट पुनः कनेक्ट हो गया" : "Back Online — Live sync re-established"}
      </span>
    </div>
  );
};
