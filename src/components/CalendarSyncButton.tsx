import React, { useState } from "react";
import { 
  Calendar, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { 
  CalendarEventDetails, 
  generateGoogleCalendarWebUrl, 
  downloadIcsCalendarFile, 
  syncAppointmentToGoogleCalendarOAuth 
} from "../lib/calendarSync";

interface CalendarSyncButtonProps {
  eventDetails: CalendarEventDetails;
  language?: string;
  variant?: "primary" | "secondary" | "outline" | "compact";
  className?: string;
}

export const CalendarSyncButton: React.FC<CalendarSyncButtonProps> = ({
  eventDetails,
  language = "en",
  variant = "primary",
  className = ""
}) => {
  const isHindi = language === "hi";
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedUrl, setSyncedUrl] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Direct Google Calendar Web Link
  const handleOpenGoogleCalendarWeb = () => {
    const url = generateGoogleCalendarWebUrl(eventDetails);
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  // iCal Download
  const handleDownloadIcs = () => {
    downloadIcsCalendarFile(eventDetails);
    setIsOpen(false);
  };

  // OAuth Google Calendar API Direct Sync
  const handleOAuthSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const result = await syncAppointmentToGoogleCalendarOAuth(eventDetails);
      if (result.success && result.eventUrl) {
        setSyncedUrl(result.eventUrl);
      } else {
        // Fallback to web URL if popup was blocked or permissions needed
        setSyncError(result.error || (isHindi ? "गूगल कैलेंडर सिंक विफल रहा। वेब वर्ज़न खोल रहे हैं..." : "Direct sync error. Opening Web Calendar..."));
        setTimeout(() => {
          handleOpenGoogleCalendarWeb();
        }, 1200);
      }
    } catch (err: any) {
      setSyncError(err.message || "Failed to sync to Google Calendar.");
      setTimeout(() => {
        handleOpenGoogleCalendarWeb();
      }, 1200);
    } finally {
      setIsSyncing(false);
    }
  };

  // Styles based on variant
  let buttonStyle = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm";
  if (variant === "secondary") {
    buttonStyle = "bg-blue-600 hover:bg-blue-700 text-white shadow-sm";
  } else if (variant === "outline") {
    buttonStyle = "bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs";
  } else if (variant === "compact") {
    buttonStyle = "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] py-1.5 px-3";
  }

  return (
    <div className={`relative inline-block w-full ${className}`} id="calendar-sync-container">
      {/* Main Trigger Button */}
      <div className="flex flex-col gap-2">
        {syncedUrl ? (
          <a
            href={syncedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3.5 flex items-center justify-between text-xs font-bold shadow-xs hover:bg-emerald-100/80 transition-colors group"
            id="calendar-synced-link"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isHindi ? "गूगल कैलेंडर में जोड़ा गया ✓" : "Synced to Google Calendar ✓"}</span>
            </div>
            <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 group-hover:scale-105 transition-transform">
              {isHindi ? "देखें" : "View"} <ExternalLink className="w-3 h-3" />
            </span>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isSyncing}
            className={`w-full font-extrabold rounded-2xl py-3 px-4 flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer ${buttonStyle}`}
            id="btn-calendar-sync-trigger"
          >
            <div className="flex items-center gap-2.5">
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin text-current" />
              ) : (
                <Calendar className="w-4 h-4 text-current" />
              )}
              <span className="text-xs">
                {isSyncing 
                  ? (isHindi ? "सिंक किया जा रहा है..." : "Syncing to Calendar...") 
                  : (isHindi ? "कैलेंडर में जोड़ें (Google Calendar Sync)" : "Add to Google Calendar")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                {isHindi ? "सिंक" : "Sync"}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
        )}

        {syncError && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}
      </div>

      {/* Dropdown Options Modal/Menu */}
      {isOpen && !syncedUrl && (
        <div 
          className="absolute left-0 right-0 bottom-full mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150 text-left"
          id="calendar-options-dropdown"
        >
          <div className="px-2 py-1 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[11px] font-black text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              {isHindi ? "अपॉइंटमेंट सिंक विकल्प" : "Calendar Sync Options"}
            </p>
            <span className="text-[9.5px] font-bold text-slate-400">Never miss consultation</span>
          </div>

          {/* Option 1: Direct Google Calendar Web Link */}
          <button
            type="button"
            onClick={handleOpenGoogleCalendarWeb}
            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group border border-transparent hover:border-slate-100"
            id="opt-google-calendar-web"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {isHindi ? "गूगल कैलेंडर वेब में खोलें" : "Open in Google Calendar Web"}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {isHindi ? "1-क्लिक में गूगल कैलेंडर में जोड़ें" : "1-click prefilled template setup"}
                </p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
          </button>

          {/* Option 2: OAuth API Sync */}
          <button
            type="button"
            onClick={handleOAuthSync}
            className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50/60 transition-colors flex items-center justify-between group border border-transparent hover:border-emerald-100"
            id="opt-google-oauth-sync"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                  {isHindi ? "गूगल खाते से ऑटो-सिंक करें" : "Auto-Sync with Google Account"}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {isHindi ? "स्वचालित रिमाइंडर (2 घंटे और 30 मिनट पहले)" : "Includes auto 2-hr & 30-min reminders"}
                </p>
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          </button>

          {/* Option 3: iCal (.ics) File Download */}
          <button
            type="button"
            onClick={handleDownloadIcs}
            className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group border border-transparent hover:border-slate-100"
            id="opt-ical-download"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                  {isHindi ? "iCal (.ics) फ़ाइल डाउनलोड करें" : "Download iCal (.ics) Calendar File"}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {isHindi ? "Apple Calendar, Outlook एवं फ़ोन के लिए" : "For Apple Calendar, Outlook & mobile apps"}
                </p>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
          </button>
        </div>
      )}
    </div>
  );
};
