// Calendar synchronization helper functions for Google Calendar API, Web Links, and iCal (.ics) exports

export interface CalendarEventDetails {
  title: string;
  doctorName: string;
  specialty?: string;
  hospitalName: string;
  location?: string;
  dateStr: string; // e.g. "2026-08-28" or "28 Aug 2026"
  timeStr: string; // e.g. "09:30 AM"
  notes?: string;
  symptoms?: string;
  appointmentId?: string;
}

/**
 * Parses appointment date and time strings into Start and End Date objects.
 */
export function parseAppointmentStartEndDates(dateStr: string, timeStr: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();

  // Try parsing ISO date e.g. "2026-08-28"
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      year = parseInt(parts[0], 10) || year;
      month = (parseInt(parts[1], 10) - 1) || month;
      day = parseInt(parts[2], 10) || day;
    }
  } else if (dateStr.includes(" ")) {
    // Try parsing e.g. "28 Aug 2026" or "28 Aug"
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      year = parsed.getFullYear();
      month = parsed.getMonth();
      day = parsed.getDate();
    }
  }

  // Parse time e.g. "09:30 AM" or "14:00"
  let hours = 10;
  let minutes = 0;
  
  const timeUpper = timeStr.toUpperCase().trim();
  const isPm = timeUpper.includes("PM");
  const isAm = timeUpper.includes("AM");
  const cleanTime = timeUpper.replace(/(AM|PM)/g, "").trim();
  const timeParts = cleanTime.split(":");

  if (timeParts.length >= 2) {
    let parsedHours = parseInt(timeParts[0], 10);
    minutes = parseInt(timeParts[1], 10) || 0;

    if (isPm && parsedHours < 12) {
      parsedHours += 12;
    } else if (isAm && parsedHours === 12) {
      parsedHours = 0;
    }
    hours = parsedHours;
  }

  const startDate = new Date(year, month, day, hours, minutes, 0);
  // Default appointment duration: 30 minutes
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  return { startDate, endDate };
}

/**
 * Formats Date to UTC Compact string for Google Calendar Web Template URLs (e.g. YYYYMMDDTHHmmssZ)
 */
function toCompactUtcString(d: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Formats Date to ISO string with timezone offset e.g. "2026-08-28T09:30:00+05:30"
 */
function toIsoTimezoneString(d: Date): string {
  return d.toISOString();
}

/**
 * Generates direct Google Calendar Web link prefilled with appointment details
 */
export function generateGoogleCalendarWebUrl(evt: CalendarEventDetails): string {
  const { startDate, endDate } = parseAppointmentStartEndDates(evt.dateStr, evt.timeStr);
  const startCompact = toCompactUtcString(startDate);
  const endCompact = toCompactUtcString(endDate);

  const title = `Consultation: ${evt.doctorName} (${evt.specialty || "Medical Specialist"})`;
  const location = `${evt.hospitalName}${evt.location ? `, ${evt.location}` : ""}`;
  const details = [
    `🏥 Hospital/Clinic: ${evt.hospitalName}`,
    `👨‍⚕️ Doctor: ${evt.doctorName} (${evt.specialty || "Specialist"})`,
    `🕒 Time: ${evt.timeStr} (${evt.dateStr})`,
    evt.symptoms ? `🩺 Reason/Symptoms: ${evt.symptoms}` : "",
    evt.notes ? `📋 Instructions: ${evt.notes}` : "",
    evt.appointmentId ? `🔢 Appointment ID: ${evt.appointmentId}` : "",
    `\nBooked via Hospyn CareGrid Portal.`
  ].filter(Boolean).join("\n");

  const baseUrl = "https://calendar.google.com/calendar/render";
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startCompact}/${endCompact}`,
    details: details,
    location: location,
  });

  return `${baseUrl}?${query.toString()}`;
}

/**
 * Generates and triggers browser download for standard .ics calendar invite
 */
export function downloadIcsCalendarFile(evt: CalendarEventDetails): void {
  const { startDate, endDate } = parseAppointmentStartEndDates(evt.dateStr, evt.timeStr);
  const startCompact = toCompactUtcString(startDate);
  const endCompact = toCompactUtcString(endDate);

  const summary = `Doctor Consultation - ${evt.doctorName}`;
  const location = `${evt.hospitalName}${evt.location ? `, ${evt.location}` : ""}`;
  const description = `Appointment with ${evt.doctorName} (${evt.specialty || 'Specialist'}) at ${evt.hospitalName}. ID: ${evt.appointmentId || 'APT-CONFIRMED'}`;

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hospyn Healthcare Portal//Appointment Sync//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:appt-${evt.appointmentId || Date.now()}@hospyn.com`,
    `DTSTAMP:${toCompactUtcString(new Date())}`,
    `DTSTART:${startCompact}`,
    `DTEND:${endCompact}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Medical appointment in 1 hour",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  const icsContent = icsLines.join("\r\n");
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `appointment-${evt.appointmentId || "confirmed"}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Client-side OAuth token handler for Google Calendar API
 */
export async function syncAppointmentToGoogleCalendarOAuth(
  evt: CalendarEventDetails,
  accessToken?: string
): Promise<{ success: boolean; eventUrl?: string; error?: string }> {
  try {
    let token = accessToken;

    // If no access token provided, request using Google Identity Services (GSI)
    if (!token) {
      token = await requestGoogleAccessToken();
    }

    if (!token) {
      throw new Error("Google Calendar authentication token was not obtained.");
    }

    const { startDate, endDate } = parseAppointmentStartEndDates(evt.dateStr, evt.timeStr);

    const eventPayload = {
      summary: `Medical Consultation: ${evt.doctorName}`,
      location: `${evt.hospitalName}${evt.location ? `, ${evt.location}` : ""}`,
      description: `Appointment with ${evt.doctorName} (${evt.specialty || "Specialist"}).\nHospital: ${evt.hospitalName}\nAppointment ID: ${evt.appointmentId || 'N/A'}\nSymptoms: ${evt.symptoms || 'General OPD'}`,
      start: {
        dateTime: toIsoTimezoneString(startDate),
      },
      end: {
        dateTime: toIsoTimezoneString(endDate),
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 120 }, // 2 hours before
          { method: "popup", minutes: 30 }   // 30 mins before
        ]
      }
    };

    // Send to server API endpoint proxy or direct Google API
    const response = await fetch("/api/calendar/add-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(eventPayload)
    });

    const data = await response.json();

    if (response.ok && data.htmlLink) {
      return { success: true, eventUrl: data.htmlLink };
    } else {
      throw new Error(data.error || "Failed to create Google Calendar event.");
    }
  } catch (err: any) {
    console.error("Google Calendar OAuth Sync Error:", err);
    return { success: false, error: err.message || "Failed to sync with Google Calendar." };
  }
}

/**
 * Helper to dynamically load Google Identity Services GSI script if missing and request OAuth token
 */
function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if gsi script is already loaded
    if ((window as any).google?.accounts?.oauth2) {
      initTokenClient(resolve, reject);
      return;
    }

    // Dynamically load gsi script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initTokenClient(resolve, reject);
    };
    script.onerror = () => {
      reject(new Error("Failed to load Google Identity Services library."));
    };
    document.head.appendChild(script);
  });
}

function initTokenClient(resolve: (token: string) => void, reject: (err: Error) => void) {
  try {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: "622693321698-applet.apps.googleusercontent.com", // standard AI Studio client
      scope: "https://www.googleapis.com/auth/calendar.events",
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
        } else if (response.access_token) {
          resolve(response.access_token);
        } else {
          reject(new Error("No access token returned from Google authentication."));
        }
      },
    });
    client.requestAccessToken();
  } catch (err: any) {
    reject(new Error("Could not initialize Google OAuth client: " + err.message));
  }
}
