/**
 * Shared Type Definitions for CareGrid Healthcare Platform
 */

export interface Patient {
  id: string;
  name: string;
  email: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  bloodGroup: string;
  aadhaar: string;
  pregnancyStatus?: 'Pregnant' | 'Not Pregnant' | 'Prefer Not To Say' | '';
  chronicConditions: string[];
  allergies: string[];
  photo?: string; // base64 face photo
  linkedHospitals?: string[];
  address?: string;
  flatHouseNo?: string;
  streetArea?: string;
  city?: string;
  state?: string;
  pincode?: string;
  password?: string;
  uploadedFiles?: MedicalRecord[];
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  hospitalName: string;
  department: string;
  phone: string;
  avatar: string;
  degree?: string;
  rating?: number;
  reviewsCount?: number;
  experience?: string;
  timing?: string;
  fee?: number;
  gender?: "Male" | "Female";
}

export interface Hospital {
  name: string;
  address: string;
  departments: string[];
  doctors: Doctor[];
  image?: string;
  rating?: number;
  reviewsCount?: number;
  city?: string;
  doctorBadge?: string;
  about?: string;
  phone?: string;
  website?: string;
  accredited?: string;
  emergencyService?: string;
  bedsCount?: string;
  icuCount?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  month: string;
  dayNum: string;
  dayName: string;
  time: string;
  type: string; // e.g. "OPD Consultation", "Follow-up Checkup"
  status: 'Confirmed' | 'Upcoming' | 'Completed' | 'Cancelled';
  notes?: string;
  symptoms?: string;
  diagnosis?: string;
  prescriptionId?: string;
  reviewed?: boolean;
  reviewRating?: number;
  reviewComment?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  name: string;
  category: 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'Radiology Report' | 'Vaccination Record' | 'Other Document';
  size: string;
  date: string;
  summary?: string; // AI generated explanation
  fileBase64?: string; // stored base64 contents
}

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor' | 'ai';
  text: string;
  timestamp: string;
  mediaBase64?: string;
  mimeType?: string;
}

export interface PrescriptionDoseTime {
  enabled: boolean;
  time: string; // HH:mm format e.g. "08:30", "20:30"
  label: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  mealInstruction: 'Before Food' | 'After Food' | 'With Food' | 'Empty Stomach' | 'At Bedtime';
  dosage: string; // e.g. "1 Tablet (40mg)", "5ml Syrup", "2 Drops"
  takenToday?: boolean;
  takenAt?: string; // ISO string or formatted time
}

export interface PrescriptionReminder {
  id: string;
  patientId: string;
  medicineName: string;
  dosage: string; // e.g. "40mg"
  type: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Drops' | 'Ointment';
  prescribedBy: string; // e.g. "Dr. Priya Mehta"
  condition: string; // e.g. "Acidity & GERD Care"
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  durationDays?: number;
  active: boolean;
  morningTime: string; // "08:30"
  morningEnabled: boolean;
  morningMeal: 'Before Food' | 'After Food' | 'Empty Stomach';
  morningDosage: string;
  morningTakenToday: boolean;
  morningTakenAt?: string;
  
  eveningTime: string; // "20:30"
  eveningEnabled: boolean;
  eveningMeal: 'Before Food' | 'After Food' | 'At Bedtime';
  eveningDosage: string;
  eveningTakenToday: boolean;
  eveningTakenAt?: string;

  soundAlert: boolean;
  pushNotification: boolean;
  notes?: string;
}

