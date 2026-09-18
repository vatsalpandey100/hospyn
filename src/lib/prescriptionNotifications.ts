import { PrescriptionReminder } from "../types";

const STORAGE_KEY = "caregrid_prescription_reminders";
const LAST_NOTIFIED_KEY = "caregrid_last_notified_reminders";

// Initial default active prescriptions
export const DEFAULT_PRESCRIPTION_REMINDERS: PrescriptionReminder[] = [
  {
    id: "rx-rem-1",
    patientId: "pat-1",
    medicineName: "Pantocid 40mg",
    dosage: "40mg",
    type: "Tablet",
    prescribedBy: "Dr. Priya Mehta",
    condition: "Acidity & GERD Care",
    startDate: new Date().toISOString().split("T")[0],
    durationDays: 14,
    active: true,
    morningTime: "08:30",
    morningEnabled: true,
    morningMeal: "After Food",
    morningDosage: "1 Tablet (40mg)",
    morningTakenToday: false,
    eveningTime: "20:30",
    eveningEnabled: true,
    eveningMeal: "After Food",
    eveningDosage: "1 Tablet (40mg)",
    eveningTakenToday: false,
    soundAlert: true,
    pushNotification: true,
    notes: "Take with a glass of lukewarm water after meals."
  },
  {
    id: "rx-rem-2",
    patientId: "pat-1",
    medicineName: "Amoxicillin 500mg",
    dosage: "500mg",
    type: "Capsule",
    prescribedBy: "Dr. Sarah Wilson",
    condition: "Post-consultation Antibiotic Course",
    startDate: new Date().toISOString().split("T")[0],
    durationDays: 7,
    active: true,
    morningTime: "09:00",
    morningEnabled: true,
    morningMeal: "After Food",
    morningDosage: "1 Capsule (500mg)",
    morningTakenToday: false,
    eveningTime: "21:00",
    eveningEnabled: true,
    eveningMeal: "After Food",
    eveningDosage: "1 Capsule (500mg)",
    eveningTakenToday: false,
    soundAlert: true,
    pushNotification: true,
    notes: "Complete full 7-day course. Do not skip doses."
  }
];

/**
 * Load reminders for a given patient with date-reset check for today's dosage status.
 */
export function getSavedPrescriptionReminders(patientId?: string): PrescriptionReminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const todayStr = new Date().toISOString().split("T")[0];
    const lastDateKey = localStorage.getItem("caregrid_reminders_date_track");

    let list: PrescriptionReminder[] = raw ? JSON.parse(raw) : DEFAULT_PRESCRIPTION_REMINDERS;

    // If day has changed, reset today's taken flags
    if (lastDateKey !== todayStr) {
      list = list.map(item => ({
        ...item,
        morningTakenToday: false,
        eveningTakenToday: false,
        morningTakenAt: undefined,
        eveningTakenAt: undefined
      }));
      localStorage.setItem("caregrid_reminders_date_track", todayStr);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    if (patientId) {
      return list.filter(item => !item.patientId || item.patientId === patientId || item.patientId === "pat-1");
    }
    return list;
  } catch (err) {
    console.error("Error loading prescription reminders:", err);
    return DEFAULT_PRESCRIPTION_REMINDERS;
  }
}

/**
 * Save updated prescription reminders list to localStorage.
 */
export function savePrescriptionReminders(reminders: PrescriptionReminder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (err) {
    console.error("Error saving prescription reminders:", err);
  }
}

/**
 * Checks Notification API support and current permission status.
 */
export function getNotificationPermissionStatus(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Requests browser permission for Push Notifications.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (err) {
    console.error("Notification permission request error:", err);
    return false;
  }
}

/**
 * Play a soothing, professional 2-tone medical chime using the Web Audio API.
 */
export function playNotificationChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Tone 1: E5 (659.25 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tone 2: G#5 (830.61 Hz)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(830.61, now + 0.15);
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.20);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.85);

    // Tone 3: B5 (987.77 Hz)
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(987.77, now + 0.35);
    gain3.gain.setValueAtTime(0, now + 0.35);
    gain3.gain.linearRampToValueAtTime(0.25, now + 0.40);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    osc3.connect(gain3);
    gain3.connect(audioCtx.destination);
    osc3.start(now + 0.35);
    osc3.stop(now + 1.2);
  } catch (err) {
    console.warn("Web Audio chime could not play:", err);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  data?: any;
}

/**
 * Dispatches a native browser push notification if permitted and plays sound.
 */
export function sendPrescriptionPushNotification(payload: PushNotificationPayload, playSound: boolean = true): boolean {
  if (playSound) {
    playNotificationChime();
  }

  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || "https://img.icons8.com/color/96/pill.png",
        tag: payload.tag || "rx-reminder",
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (err) {
      console.warn("Browser Notification constructor failed:", err);
      return false;
    }
  }

  return false;
}

/**
 * Format HH:mm string (e.g. "08:30" or "20:30") to readable 12-hour format ("08:30 AM", "08:30 PM").
 */
export function formatTimeTo12Hour(timeStr: string): string {
  if (!timeStr) return "08:00 AM";
  const [hoursStr, minsStr] = timeStr.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = minsStr ? minsStr.padStart(2, "0") : "00";
  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = hours.toString().padStart(2, "0");
  return `${formattedHours}:${minutes} ${ampm}`;
}

export interface NextDoseInfo {
  reminderId: string;
  medicineName: string;
  dosage: string;
  slot: "Morning" | "Evening";
  timeStr: string; // 12-hour format e.g. "08:30 AM"
  rawTime: string; // 24-hour e.g. "08:30"
  mealInstruction: string;
  isToday: boolean;
  timeRemainingText: string;
}

/**
 * Calculates the next upcoming prescription reminder dose from all active reminders.
 */
export function getNextUpcomingDose(reminders: PrescriptionReminder[]): NextDoseInfo | null {
  const activeList = reminders.filter(r => r.active);
  if (activeList.length === 0) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let closestDiff = Infinity;
  let nextDose: NextDoseInfo | null = null;

  for (const r of activeList) {
    // Check morning dose
    if (r.morningEnabled) {
      const [mH, mM] = r.morningTime.split(":").map(Number);
      const mMinutes = (mH || 8) * 60 + (mM || 30);
      let diff = mMinutes - currentMinutes;
      const isToday = diff >= 0;
      if (diff < 0) {
        diff += 24 * 60; // next day morning
      }

      if (diff < closestDiff && (!r.morningTakenToday || !isToday)) {
        closestDiff = diff;
        const hoursLeft = Math.floor(diff / 60);
        const minsLeft = diff % 60;
        const timeRemainingText =
          hoursLeft > 0
            ? `in ${hoursLeft} hr ${minsLeft > 0 ? `${minsLeft} min` : ""}`
            : `in ${minsLeft} min`;

        nextDose = {
          reminderId: r.id,
          medicineName: r.medicineName,
          dosage: r.morningDosage || r.dosage,
          slot: "Morning",
          timeStr: formatTimeTo12Hour(r.morningTime),
          rawTime: r.morningTime,
          mealInstruction: r.morningMeal,
          isToday,
          timeRemainingText
        };
      }
    }

    // Check evening dose
    if (r.eveningEnabled) {
      const [eH, eM] = r.eveningTime.split(":").map(Number);
      const eMinutes = (eH || 20) * 60 + (eM || 30);
      let diff = eMinutes - currentMinutes;
      const isToday = diff >= 0;
      if (diff < 0) {
        diff += 24 * 60; // next day evening
      }

      if (diff < closestDiff && (!r.eveningTakenToday || !isToday)) {
        closestDiff = diff;
        const hoursLeft = Math.floor(diff / 60);
        const minsLeft = diff % 60;
        const timeRemainingText =
          hoursLeft > 0
            ? `in ${hoursLeft} hr ${minsLeft > 0 ? `${minsLeft} min` : ""}`
            : `in ${minsLeft} min`;

        nextDose = {
          reminderId: r.id,
          medicineName: r.medicineName,
          dosage: r.eveningDosage || r.dosage,
          slot: "Evening",
          timeStr: formatTimeTo12Hour(r.eveningTime),
          rawTime: r.eveningTime,
          mealInstruction: r.eveningMeal,
          isToday,
          timeRemainingText
        };
      }
    }
  }

  return nextDose;
}

/**
 * Checks all active reminders against the current system time and triggers push notifications if it's time.
 * Returns any reminders that were triggered during this check so in-app alerts can be displayed.
 */
export function checkAndTriggerDueReminders(
  reminders: PrescriptionReminder[],
  onTriggered?: (triggered: { reminder: PrescriptionReminder; slot: "Morning" | "Evening" }) => void
): { reminder: PrescriptionReminder; slot: "Morning" | "Evening" }[] {
  const now = new Date();
  const currentHours = now.getHours().toString().padStart(2, "0");
  const currentMins = now.getMinutes().toString().padStart(2, "0");
  const currentTimeStr = `${currentHours}:${currentMins}`;
  const todayStr = now.toISOString().split("T")[0];

  // Get log of notifications sent today to avoid spamming the same minute
  let sentMap: Record<string, boolean> = {};
  try {
    const raw = localStorage.getItem(LAST_NOTIFIED_KEY);
    if (raw) sentMap = JSON.parse(raw);
  } catch (e) {
    sentMap = {};
  }

  const triggeredList: { reminder: PrescriptionReminder; slot: "Morning" | "Evening" }[] = [];

  for (const r of reminders) {
    if (!r.active) continue;

    // Check Morning Dose
    if (r.morningEnabled && r.morningTime === currentTimeStr && !r.morningTakenToday) {
      const logKey = `${todayStr}_${r.id}_morning_${currentTimeStr}`;
      if (!sentMap[logKey]) {
        sentMap[logKey] = true;
        triggeredList.push({ reminder: r, slot: "Morning" });

        if (r.pushNotification) {
          sendPrescriptionPushNotification(
            {
              title: `☀️ Morning Dose: ${r.medicineName}`,
              body: `Time for your morning dose (${r.morningDosage}). ${r.morningMeal}. Prescribed by ${r.prescribedBy}.`,
              tag: `rx-morning-${r.id}`
            },
            r.soundAlert
          );
        }

        if (onTriggered) {
          onTriggered({ reminder: r, slot: "Morning" });
        }
      }
    }

    // Check Evening Dose
    if (r.eveningEnabled && r.eveningTime === currentTimeStr && !r.eveningTakenToday) {
      const logKey = `${todayStr}_${r.id}_evening_${currentTimeStr}`;
      if (!sentMap[logKey]) {
        sentMap[logKey] = true;
        triggeredList.push({ reminder: r, slot: "Evening" });

        if (r.pushNotification) {
          sendPrescriptionPushNotification(
            {
              title: `🌙 Evening Dose: ${r.medicineName}`,
              body: `Time for your evening dose (${r.eveningDosage}). ${r.eveningMeal}. Prescribed by ${r.prescribedBy}.`,
              tag: `rx-evening-${r.id}`
            },
            r.soundAlert
          );
        }

        if (onTriggered) {
          onTriggered({ reminder: r, slot: "Evening" });
        }
      }
    }
  }

  if (triggeredList.length > 0) {
    try {
      localStorage.setItem(LAST_NOTIFIED_KEY, JSON.stringify(sentMap));
    } catch (e) {
      // ignore
    }
  }

  return triggeredList;
}
