import React, { useState } from "react";
import { 
  Download, 
  X, 
  CheckCircle2, 
  Smartphone, 
  Laptop, 
  Sparkles, 
  Share, 
  PlusSquare, 
  ExternalLink,
  ShieldCheck,
  Zap,
  BellRing,
  MoreVertical
} from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: "en" | "hi";
  isDarkMode?: boolean;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({
  isOpen,
  onClose,
  language = "en",
  isDarkMode = false
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<"chrome" | "android" | "ios">("chrome");
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const isHindi = language === "hi";

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200" 
      onClick={onClose}
      id="pwa-install-modal-overlay"
    >
      <div 
        className={`w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col text-left transition-all animate-in zoom-in-95 duration-200 ${isDarkMode ? "dark" : ""}`}
        onClick={(e) => e.stopPropagation()}
        id="pwa-install-modal-content"
      >
        {/* Modal Header Banner */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 p-6 text-white overflow-hidden">
          {/* Subtle decorative shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />

          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* App Branding Badge */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-lg flex items-center justify-center">
              <img src="/icon.svg" alt="Hospyn Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-blue-50">
                  {isHindi ? "प्रोग्रेसिव वेब ऐप" : "Official PWA"}
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight leading-tight mt-0.5">
                {isHindi ? "Hospyn ऐप इंस्टॉल करें" : "Install Hospyn as App"}
              </h3>
            </div>
          </div>

          <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
            {isHindi 
              ? "Chrome ब्राउज़र मेनू से सीधे अपने डिवाइस पर Hospyn इंस्टॉल करें। बिना ऐप स्टोर, 100% तेज़ और सुरक्षित!" 
              : "Install Hospyn directly from your Chrome menu or browser bar for instantaneous access, offline records, and real-time reminders."}
          </p>
        </div>

        {/* Success Banner if Installed */}
        {installSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              {isHindi ? "सफलतापूर्वक इंस्टॉल हो गया!" : "Successfully Installed!"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isHindi ? "अब आप अपने होम स्क्रीन से Hospyn खोल सकते हैं।" : "You can now launch Hospyn directly from your Home Screen or App Launcher."}
            </p>
          </div>
        ) : (
          <div className="p-5 flex flex-col space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Direct 1-Click Install Button (if browser prompt is ready) */}
            {isInstallable && (
              <button
                onClick={handleDirectInstall}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm py-3.5 px-4 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                id="btn-direct-install-pwa"
              >
                <Download className="w-4.5 h-4.5 stroke-[2.5]" />
                <span>{isHindi ? "⚡ एक क्लिक में इंस्टॉल करें" : "⚡ One-Click Direct Install"}</span>
              </button>
            )}

            {/* Platform Selector Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("chrome")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "chrome" 
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>{isHindi ? "Chrome डेस्कटॉप" : "Chrome Desktop"}</span>
              </button>

              <button
                onClick={() => setActiveTab("android")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "android" 
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isHindi ? "Chrome एंड्रॉयड" : "Chrome Android"}</span>
              </button>

              <button
                onClick={() => setActiveTab("ios")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "ios" 
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                <Share className="w-3.5 h-3.5" />
                <span>iOS / Safari</span>
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-xs">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>
                  {activeTab === "chrome" && (isHindi ? "Chrome मेनू से कैसे इंस्टॉल करें:" : "How to install from Chrome Menu:")}
                  {activeTab === "android" && (isHindi ? "Chrome Android मेनू से कैसे इंस्टॉल करें:" : "How to install on Android Chrome:")}
                  {activeTab === "ios" && (isHindi ? "iPhone / iPad पर Safari से कैसे इंस्टॉल करें:" : "How to install on iOS Safari:")}
                </span>
              </div>

              {/* Tab 1: Chrome Desktop */}
              {activeTab === "chrome" && (
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center shrink-0 text-[11px] mt-0.5">1</span>
                    <p className="leading-snug">
                      {isHindi ? (
                        <>Chrome के ऊपर दाईं ओर <strong>तीन बिंदु मेनू (<MoreVertical className="w-3.5 h-3.5 inline mx-0.5 text-slate-700 dark:text-slate-200" />)</strong> पर क्लिक करें।</>
                      ) : (
                        <>Click the <strong>Chrome Three-Dots Menu (<MoreVertical className="w-3.5 h-3.5 inline mx-0.5 text-slate-700 dark:text-slate-200" />)</strong> in the top-right corner of Google Chrome.</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center shrink-0 text-[11px] mt-0.5">2</span>
                    <p className="leading-snug">
                      {isHindi ? (
                        <><strong>"Save and share"</strong> ➔ <strong>"Install Hospyn..."</strong> या <strong>"Install app"</strong> चुनें।</>
                      ) : (
                        <>Select <strong>"Save and share"</strong> ➔ <strong>"Install Hospyn..."</strong> or click <strong>"Install app"</strong>.</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center shrink-0 text-[11px] mt-0.5">3</span>
                    <p className="leading-snug">
                      {isHindi ? (
                        <>या Chrome एड्रेस बार में <strong>डाउनलोड/इंस्टॉल आइकन (⊕)</strong> पर सीधे क्लिक करें।</>
                      ) : (
                        <>Alternatively, click the <strong>Install Icon (⊕)</strong> directly inside the Chrome URL address bar.</>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Chrome Android */}
              {activeTab === "android" && (
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center shrink-0 text-[11px] mt-0.5">1</span>
                    <p className="leading-snug">
                      {isHindi ? (
                        <>Chrome ब्राउज़र में ऊपर दाईं ओर <strong>तीन डॉट्स (<MoreVertical className="w-3.5 h-3.5 inline mx-0.5 text-slate-700 dark:text-slate-200" />)</strong> पर टैप करें।</>
                      ) : (
                        <>Tap the <strong>three-dots menu (<MoreVertical className="w-3.5 h-3.5 inline mx-0.5 text-slate-700 dark:text-slate-200" />)</strong> at the top right of Chrome.</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center shrink-0 text-[11px] mt-0.5">2</span>
                    <p className="leading-snug">
                      {isHindi ? (
                        <>मेनू में <strong>"Install app"</strong> या <strong>"Add to Home screen"</strong> पर टैप करें।</>
                      ) : (
                        <>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center shrink-0 text-[11px] mt-0.5">3</span>
                    <p className="leading-snug">
                      {isHindi ? (
                        <><strong>"Install"</strong> की पुष्टि करें। ऐप तुरंत आपके फोन के ऐप ड्रॉअर में जुड़ जाएगा।</>
                      ) : (
                        <>Confirm <strong>"Install"</strong> to add Hospyn directly to your Android launcher and home screen.</>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: iOS Safari */}
              {activeTab === "ios" && (
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center shrink-0 text-[11px] mt-0.5">1</span>
                    <p className="leading-snug">
                      {isHindi ? (
                        <>Safari के नीचे टूलबार में <strong>शेयर बटन (<Share className="w-3.5 h-3.5 inline mx-0.5 text-slate-700 dark:text-slate-200" />)</strong> पर टैप करें।</>
                      ) : (
                        <>Tap the <strong>Share button (<Share className="w-3.5 h-3.5 inline mx-0.5 text-slate-700 dark:text-slate-200" />)</strong> in the Safari bottom toolbar.</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center shrink-0 text-[11px] mt-0.5">2</span>
                    <p className="leading-snug">
                      {isHindi ? (
                        <>नीचे स्क्रॉल करें और <strong>"Add to Home Screen" (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-slate-700 dark:text-slate-200" />)</strong> चुनें।</>
                      ) : (
                        <>Scroll down and tap <strong>"Add to Home Screen" (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-slate-700 dark:text-slate-200" />)</strong>.</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center shrink-0 text-[11px] mt-0.5">3</span>
                    <p className="leading-snug">
                      {isHindi ? (
                        <>ऊपर दाईं ओर <strong>"Add"</strong> पर टैप करें।</>
                      ) : (
                        <>Tap <strong>"Add"</strong> in the top-right corner.</>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* App Features / Why Install Checklist */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100/60 dark:border-blue-900/40 text-center">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block leading-tight">
                  {isHindi ? "सुपर फास्ट" : "Instant Launch"}
                </span>
                <span className="text-[8.5px] text-slate-500 dark:text-slate-400 mt-0.5 block">0s loading</span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100/60 dark:border-emerald-900/40 text-center">
                <BellRing className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block leading-tight">
                  {isHindi ? "दवा रिमाइंडर" : "Dose Alerts"}
                </span>
                <span className="text-[8.5px] text-slate-500 dark:text-slate-400 mt-0.5 block">Push alerts</span>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100/60 dark:border-indigo-900/40 text-center">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block leading-tight">
                  {isHindi ? "ऑफ़लाइन मोड" : "Offline Safe"}
                </span>
                <span className="text-[8.5px] text-slate-500 dark:text-slate-400 mt-0.5 block">Cached data</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs py-3 rounded-xl transition-colors cursor-pointer"
              >
                {isHindi ? "समझ गया / बंद करें" : "Got it, Close"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
