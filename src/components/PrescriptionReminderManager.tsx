import React, { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  Clock,
  Pill,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Play,
  RotateCcw
} from "lucide-react";
import { PrescriptionReminder } from "../types";
import {
  getSavedPrescriptionReminders,
  savePrescriptionReminders,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  sendPrescriptionPushNotification,
  playNotificationChime,
  formatTimeTo12Hour,
  getNextUpcomingDose,
  NextDoseInfo
} from "../lib/prescriptionNotifications";

interface PrescriptionReminderManagerProps {
  language?: string;
  patientId?: string;
  patientName?: string;
  compactView?: boolean;
  onShowToast?: (msg: string) => void;
}

export const PrescriptionReminderManager: React.FC<PrescriptionReminderManagerProps> = ({
  language = "en",
  patientId = "pat-1",
  patientName = "Gunjan Sharma",
  compactView = false,
  onShowToast
}) => {
  const isHindi = language === "hi";

  const [reminders, setReminders] = useState<PrescriptionReminder[]>(() =>
    getSavedPrescriptionReminders(patientId)
  );
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">(() =>
    getNotificationPermissionStatus()
  );
  const [selectedReminderId, setSelectedReminderId] = useState<string>(() =>
    reminders.length > 0 ? reminders[0].id : ""
  );
  const [nextDose, setNextDose] = useState<NextDoseInfo | null>(() =>
    getNextUpcomingDose(reminders)
  );

  // Editing state for new or existing prescription
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingReminder, setEditingReminder] = useState<PrescriptionReminder | null>(null);

  // Form fields for new/edit
  const [formName, setFormName] = useState("");
  const [formDosage, setFormDosage] = useState("1 Tablet (40mg)");
  const [formType, setFormType] = useState<PrescriptionReminder["type"]>("Tablet");
  const [formCondition, setFormCondition] = useState("");
  const [formDoctor, setFormDoctor] = useState("Dr. Priya Mehta");
  const [formMorningTime, setFormMorningTime] = useState("08:30");
  const [formMorningMeal, setFormMorningMeal] = useState<PrescriptionReminder["morningMeal"]>("After Food");
  const [formEveningTime, setFormEveningTime] = useState("20:30");
  const [formEveningMeal, setFormEveningMeal] = useState<PrescriptionReminder["eveningMeal"]>("After Food");
  const [formSoundAlert, setFormSoundAlert] = useState(true);
  const [formPushEnabled, setFormPushEnabled] = useState(true);

  // Refresh next upcoming dose calculation whenever reminders change
  useEffect(() => {
    setNextDose(getNextUpcomingDose(reminders));
    savePrescriptionReminders(reminders);
  }, [reminders]);

  // Request browser notification permission
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionStatus(getNotificationPermissionStatus());
    if (granted) {
      if (onShowToast) {
        onShowToast(
          isHindi
            ? "पुश सूचनाएं सफलतापूर्वक सक्षम की गईं! ✓"
            : "Push notifications enabled successfully! ✓"
        );
      }
      // Send welcome test notification
      sendPrescriptionPushNotification(
        {
          title: "CareGrid Prescription Reminders Active",
          body: "You will receive timely push alerts for your morning and evening medication doses.",
          tag: "caregrid-welcome"
        },
        true
      );
    } else {
      if (onShowToast) {
        onShowToast(
          isHindi
            ? "सूचना अनुमति अस्वीकृत। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।"
            : "Notification permission was blocked or denied in browser."
        );
      }
    }
  };

  // Trigger immediate test push notification
  const handleTestNotification = (r: PrescriptionReminder) => {
    playNotificationChime();
    const sent = sendPrescriptionPushNotification(
      {
        title: `☀️ Morning Dose Reminder: ${r.medicineName}`,
        body: `Time for your morning dose (${r.morningDosage}). ${r.morningMeal}. Prescribed by ${r.prescribedBy}.`,
        tag: `test-reminder-${r.id}`
      },
      false
    );

    if (onShowToast) {
      if (sent) {
        onShowToast(
          isHindi
            ? "टेस्ट पुश सूचना भेजी गई! अपनी स्क्रीन जांचें।"
            : `Test push reminder sent for ${r.medicineName}! Check your screen.`
        );
      } else {
        onShowToast(
          isHindi
            ? "ऑडियो टोन बजाया गया। पुश नोटिफिकेशन के लिए कृपया अनुमति सक्षम करें।"
            : "Audio chime played! Please allow notification permission for full popups."
        );
      }
    }
  };

  // Toggle dose taken today
  const handleToggleDoseTaken = (
    reminderId: string,
    slot: "Morning" | "Evening"
  ) => {
    const updated = reminders.map(r => {
      if (r.id !== reminderId) return r;
      if (slot === "Morning") {
        const isNowTaken = !r.morningTakenToday;
        return {
          ...r,
          morningTakenToday: isNowTaken,
          morningTakenAt: isNowTaken ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined
        };
      } else {
        const isNowTaken = !r.eveningTakenToday;
        return {
          ...r,
          eveningTakenToday: isNowTaken,
          eveningTakenAt: isNowTaken ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined
        };
      }
    });

    setReminders(updated);
    if (onShowToast) {
      onShowToast(
        isHindi
          ? `${slot === "Morning" ? "सुबह" : "शाम"} की खुराक ली गई दर्ज की गई ✓`
          : `${slot} dose logged as taken! ✓`
      );
    }
  };

  // Quick update morning/evening times for a reminder
  const handleUpdateReminderTimes = (
    reminderId: string,
    field: "morningTime" | "eveningTime" | "morningMeal" | "eveningMeal" | "soundAlert" | "pushNotification",
    value: any
  ) => {
    const updated = reminders.map(r => {
      if (r.id !== reminderId) return r;
      return { ...r, [field]: value };
    });
    setReminders(updated);
    if (onShowToast) {
      onShowToast(
        isHindi
          ? "दवा रिमाइंडर समय अपडेट किया गया ✓"
          : "Medication reminder time updated! ✓"
      );
    }
  };

  // Save new or edited reminder
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingReminder) {
      const updated = reminders.map(r => {
        if (r.id !== editingReminder.id) return r;
        return {
          ...r,
          medicineName: formName.trim(),
          dosage: formDosage.trim(),
          type: formType,
          condition: formCondition.trim() || "General Prescription",
          prescribedBy: formDoctor.trim() || "Attending Physician",
          morningTime: formMorningTime,
          morningMeal: formMorningMeal,
          morningDosage: formDosage,
          eveningTime: formEveningTime,
          eveningMeal: formEveningMeal,
          eveningDosage: formDosage,
          soundAlert: formSoundAlert,
          pushNotification: formPushEnabled
        };
      });
      setReminders(updated);
      setEditingReminder(null);
      if (onShowToast) onShowToast(isHindi ? "प्रिस्क्रिप्शन अपडेट किया गया ✓" : "Prescription updated successfully! ✓");
    } else {
      const newRem: PrescriptionReminder = {
        id: `rx-rem-${Date.now()}`,
        patientId,
        medicineName: formName.trim(),
        dosage: formDosage.trim(),
        type: formType,
        prescribedBy: formDoctor.trim() || "Dr. Sarah Wilson",
        condition: formCondition.trim() || "Active Therapy",
        startDate: new Date().toISOString().split("T")[0],
        durationDays: 14,
        active: true,
        morningTime: formMorningTime,
        morningEnabled: true,
        morningMeal: formMorningMeal,
        morningDosage: formDosage,
        morningTakenToday: false,
        eveningTime: formEveningTime,
        eveningEnabled: true,
        eveningMeal: formEveningMeal,
        eveningDosage: formDosage,
        eveningTakenToday: false,
        soundAlert: formSoundAlert,
        pushNotification: formPushEnabled,
        notes: "Take according to the specified schedule."
      };
      setReminders([...reminders, newRem]);
      setSelectedReminderId(newRem.id);
      setIsAddingNew(false);
      if (onShowToast) onShowToast(isHindi ? "नया प्रिस्क्रिप्शन रिमाइंडर जोड़ा गया ✓" : "New prescription reminder added! ✓");
    }
  };

  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    if (selectedReminderId === id && updated.length > 0) {
      setSelectedReminderId(updated[0].id);
    }
    if (onShowToast) onShowToast(isHindi ? "रिमाइंडर हटाया गया" : "Reminder deleted");
  };

  const activeReminder = reminders.find(r => r.id === selectedReminderId) || reminders[0];

  return (
    <div className="space-y-4 text-left font-sans" id="prescription-reminder-system">
      {/* 1. Header / Next Upcoming Dose Banner */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-blue-500/10 border border-amber-200/80 rounded-3xl p-4.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider bg-amber-100/80 px-2 py-0.5 rounded-full">
                  {isHindi ? "स्मार्ट दवा रिमाइंडर" : "Active Prescription Reminders"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">
                {isHindi ? "सुबह एवं शाम पुश सूचना प्रणाली" : "Morning & Evening Push Notifications"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAddingNew(true);
              setEditingReminder(null);
              setFormName("");
              setFormDosage("1 Tablet (500mg)");
              setFormCondition("");
              setFormMorningTime("08:30");
              setFormEveningTime("20:30");
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-all active:scale-95"
            id="btn-add-prescription"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isHindi ? "नई दवा जोड़ें" : "Add Medicine"}</span>
          </button>
        </div>

        {/* Next Dose Alert Bar */}
        {nextDose && (
          <div className="bg-white border border-amber-200/60 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                nextDose.slot === "Morning" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
              }`}>
                {nextDose.slot === "Morning" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-[10.5px] font-black text-slate-800 flex items-center gap-1">
                  <span>{nextDose.slot === "Morning" ? (isHindi ? "अगली सुबह की खुराक:" : "Next Morning Dose:") : (isHindi ? "अगली शाम की खुराक:" : "Next Evening Dose:")}</span>
                  <span className="text-amber-700 font-extrabold">{nextDose.medicineName}</span>
                </p>
                <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{nextDose.timeStr}</span>
                  <span className="text-amber-600 font-bold">({nextDose.timeRemainingText})</span>
                  <span>• {nextDose.mealInstruction}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleDoseTaken(nextDose.reminderId, nextDose.slot)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-[10.5px] font-black transition-all active:scale-95 flex items-center gap-1"
              title={isHindi ? "अभी ली गई दर्ज करें" : "Mark dose taken now"}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isHindi ? "ली गई" : "Take Now"}</span>
            </button>
          </div>
        )}

        {/* Permission Banner */}
        {permissionStatus !== "granted" && (
          <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-3 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-900">
                  {isHindi ? "ब्राउज़र पुश सूचनाएं सक्रिय करें" : "Enable Push Notifications on this Device"}
                </p>
                <p className="text-[10px] text-blue-700">
                  {isHindi ? "सुबह और शाम के निर्धारित समय पर स्क्रीन पर पॉपअप और रिंगटोन अलर्ट प्राप्त करें।" : "Receive lock-screen alerts and audio reminders at your exact morning & evening times."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRequestPermission}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black px-3.5 py-2 rounded-xl shrink-0 shadow-sm transition-all active:scale-95"
              id="btn-enable-push-permission"
            >
              {isHindi ? "सक्षम करें" : "Enable Push"}
            </button>
          </div>
        )}
      </div>

      {/* 2. Prescription Tabs / List */}
      {reminders.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {reminders.map(r => {
            const isSelected = r.id === (activeReminder?.id || "");
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedReminderId(r.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <Pill className={`w-3.5 h-3.5 ${isSelected ? "text-amber-400" : "text-amber-600"}`} />
                <span>{r.medicineName}</span>
                {r.morningTakenToday && r.eveningTakenToday && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Active Prescription Detailed Reminder Card */}
      {activeReminder && (
        <div className="bg-white border border-slate-200 rounded-3xl p-4.5 shadow-sm space-y-4 text-left">
          {/* Top Info Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 leading-tight flex items-center gap-1.5">
                  <span>{activeReminder.medicineName}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-extrabold">
                    {activeReminder.dosage}
                  </span>
                </h4>
                <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                  {activeReminder.condition} • {activeReminder.prescribedBy}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleTestNotification(activeReminder)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10.5px] font-black px-2.5 py-1.5 rounded-xl border border-amber-200/80 flex items-center gap-1 transition-all active:scale-95"
                title={isHindi ? "परीक्षण सूचना भेजें" : "Send Test Push Reminder"}
                id="btn-test-notification"
              >
                <Play className="w-3 h-3 fill-amber-700" />
                <span>{isHindi ? "टेस्ट अलर्ट" : "Test Alert"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingReminder(activeReminder);
                  setFormName(activeReminder.medicineName);
                  setFormDosage(activeReminder.dosage);
                  setFormCondition(activeReminder.condition);
                  setFormDoctor(activeReminder.prescribedBy);
                  setFormMorningTime(activeReminder.morningTime);
                  setFormMorningMeal(activeReminder.morningMeal);
                  setFormEveningTime(activeReminder.eveningTime);
                  setFormEveningMeal(activeReminder.eveningMeal);
                  setFormSoundAlert(activeReminder.soundAlert);
                  setFormPushEnabled(activeReminder.pushNotification);
                  setIsAddingNew(false);
                }}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit prescription"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {reminders.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteReminder(activeReminder.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete reminder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Morning & Evening Dose Setting Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Morning Dose Box */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                activeReminder.morningTakenToday
                  ? "bg-emerald-50/50 border-emerald-200"
                  : "bg-amber-50/40 border-amber-200/70"
              }`}
              id="morning-dose-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-800">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    {isHindi ? "सुबह की खुराक" : "Morning Dose"}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-slate-500">
                  {formatTimeTo12Hour(activeReminder.morningTime)}
                </span>
              </div>

              {/* Time Configuration Input */}
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{isHindi ? "समय सेट करें:" : "Alert Time:"}</span>
                  </label>
                  <input
                    type="time"
                    value={activeReminder.morningTime}
                    onChange={(e) =>
                      handleUpdateReminderTimes(activeReminder.id, "morningTime", e.target.value)
                    }
                    className="text-xs font-black text-slate-800 focus:outline-none bg-transparent cursor-pointer"
                    id="input-morning-time"
                  />
                </div>

                {/* Meal Instruction Dropdown */}
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <label className="text-[10px] font-bold text-slate-600">
                    {isHindi ? "निर्देश:" : "Meal Timing:"}
                  </label>
                  <select
                    value={activeReminder.morningMeal}
                    onChange={(e) =>
                      handleUpdateReminderTimes(
                        activeReminder.id,
                        "morningMeal",
                        e.target.value as any
                      )
                    }
                    className="text-[10.5px] font-black text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                    id="select-morning-meal"
                  >
                    <option value="After Food">{isHindi ? "खाना खाने के बाद" : "After Food"}</option>
                    <option value="Before Food">{isHindi ? "खाना खाने से पहले" : "Before Food"}</option>
                    <option value="Empty Stomach">{isHindi ? "खाली पेट" : "Empty Stomach"}</option>
                  </select>
                </div>
              </div>

              {/* Mark Taken Button */}
              <button
                type="button"
                onClick={() => handleToggleDoseTaken(activeReminder.id, "Morning")}
                className={`w-full mt-3 py-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                  activeReminder.morningTakenToday
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                }`}
                id="btn-toggle-morning-taken"
              >
                {activeReminder.morningTakenToday ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isHindi ? "✓ सुबह की खुराक ली गई" : `✓ Taken today ${activeReminder.morningTakenAt ? `(${activeReminder.morningTakenAt})` : ""}`}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isHindi ? "सुबह की खुराक ली गई दर्ज करें" : "Mark Morning Dose Taken"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Evening Dose Box */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                activeReminder.eveningTakenToday
                  ? "bg-emerald-50/50 border-emerald-200"
                  : "bg-indigo-50/40 border-indigo-200/70"
              }`}
              id="evening-dose-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-900">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    {isHindi ? "शाम की खुराक" : "Evening Dose"}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-slate-500">
                  {formatTimeTo12Hour(activeReminder.eveningTime)}
                </span>
              </div>

              {/* Time Configuration Input */}
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{isHindi ? "समय सेट करें:" : "Alert Time:"}</span>
                  </label>
                  <input
                    type="time"
                    value={activeReminder.eveningTime}
                    onChange={(e) =>
                      handleUpdateReminderTimes(activeReminder.id, "eveningTime", e.target.value)
                    }
                    className="text-xs font-black text-slate-800 focus:outline-none bg-transparent cursor-pointer"
                    id="input-evening-time"
                  />
                </div>

                {/* Meal Instruction Dropdown */}
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <label className="text-[10px] font-bold text-slate-600">
                    {isHindi ? "निर्देश:" : "Meal Timing:"}
                  </label>
                  <select
                    value={activeReminder.eveningMeal}
                    onChange={(e) =>
                      handleUpdateReminderTimes(
                        activeReminder.id,
                        "eveningMeal",
                        e.target.value as any
                      )
                    }
                    className="text-[10.5px] font-black text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                    id="select-evening-meal"
                  >
                    <option value="After Food">{isHindi ? "खाना खाने के बाद" : "After Food"}</option>
                    <option value="Before Food">{isHindi ? "खाना खाने से पहले" : "Before Food"}</option>
                    <option value="At Bedtime">{isHindi ? "सोते समय" : "At Bedtime"}</option>
                  </select>
                </div>
              </div>

              {/* Mark Taken Button */}
              <button
                type="button"
                onClick={() => handleToggleDoseTaken(activeReminder.id, "Evening")}
                className={`w-full mt-3 py-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                  activeReminder.eveningTakenToday
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
                id="btn-toggle-evening-taken"
              >
                {activeReminder.eveningTakenToday ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isHindi ? "✓ शाम की खुराक ली गई" : `✓ Taken today ${activeReminder.eveningTakenAt ? `(${activeReminder.eveningTakenAt})` : ""}`}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isHindi ? "शाम की खुराक ली गई दर्ज करें" : "Mark Evening Dose Taken"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sound Alert & Push Notification Toggles */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeReminder.pushNotification}
                  onChange={(e) =>
                    handleUpdateReminderTimes(
                      activeReminder.id,
                      "pushNotification",
                      e.target.checked
                    )
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isHindi ? "पुश नोटिफिकेशन" : "Push Popups"}</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeReminder.soundAlert}
                  onChange={(e) =>
                    handleUpdateReminderTimes(
                      activeReminder.id,
                      "soundAlert",
                      e.target.checked
                    )
                  }
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isHindi ? "ऑडियो चाइम" : "Audio Chime"}</span>
                </span>
              </label>
            </div>

            <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
              {isHindi ? "समय पर स्वचालित अलर्ट" : "Automated scheduled alerts"}
            </span>
          </div>
        </div>
      )}

      {/* 4. Add / Edit Prescription Modal */}
      {(isAddingNew || editingReminder) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-slate-900">
                  {editingReminder
                    ? (isHindi ? "प्रिस्क्रिप्शन रिमाइंडर संपादित करें" : "Edit Prescription Reminder")
                    : (isHindi ? "नया प्रिस्क्रिप्शन रिमाइंडर जोड़ें" : "Add New Prescription Reminder")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingReminder(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">
                  {isHindi ? "दवा का नाम *" : "Medicine Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metformin 500mg or Amoxicillin"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    {isHindi ? "खुराक" : "Dosage (per dose)"}
                  </label>
                  <input
                    type="text"
                    value={formDosage}
                    onChange={(e) => setFormDosage(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    {isHindi ? "प्रकार" : "Form Type"}
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Drops">Drops</option>
                    <option value="Injection">Injection</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    {isHindi ? "बीमारी / स्थिति" : "Condition"}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Diabetes, Infection"
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-700 block mb-1">
                    {isHindi ? "डॉक्टर" : "Prescribed By"}
                  </label>
                  <input
                    type="text"
                    value={formDoctor}
                    onChange={(e) => setFormDoctor(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Schedule Morning & Evening Times */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
                  {isHindi ? "दैनिक रिमाइंडर समय सेटिंग" : "Daily Push Reminder Schedule"}
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isHindi ? "सुबह का समय:" : "Morning Time:"}</span>
                    </label>
                    <input
                      type="time"
                      value={formMorningTime}
                      onChange={(e) => setFormMorningTime(e.target.value)}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{isHindi ? "शाम का समय:" : "Evening Time:"}</span>
                    </label>
                    <input
                      type="time"
                      value={formEveningTime}
                      onChange={(e) => setFormEveningTime(e.target.value)}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      {isHindi ? "सुबह भोजन:" : "Morning Meal:"}
                    </label>
                    <select
                      value={formMorningMeal}
                      onChange={(e) => setFormMorningMeal(e.target.value as any)}
                      className="w-full text-[11px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white"
                    >
                      <option value="After Food">After Food</option>
                      <option value="Before Food">Before Food</option>
                      <option value="Empty Stomach">Empty Stomach</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      {isHindi ? "शाम भोजन:" : "Evening Meal:"}
                    </label>
                    <select
                      value={formEveningMeal}
                      onChange={(e) => setFormEveningMeal(e.target.value as any)}
                      className="w-full text-[11px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white"
                    >
                      <option value="After Food">After Food</option>
                      <option value="Before Food">Before Food</option>
                      <option value="At Bedtime">At Bedtime</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingReminder(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-2.5 rounded-xl text-xs"
                >
                  {isHindi ? "रद्द करें" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-sm"
                >
                  {isHindi ? "सेव करें" : "Save Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
