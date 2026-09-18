import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { 
  Patient, 
  Doctor, 
  Hospital, 
  Appointment, 
  MedicalRecord, 
  ChatMessage,
  PrescriptionReminder
} from "./types";
import { MOCK_DOCTORS, MOCK_HOSPITALS } from "./data/hospitalsData";
import { FallbackImage } from "./components/FallbackImage";
import { SymptomChecker } from "./components/SymptomChecker";
import { MedicalSearch } from "./components/MedicalSearch";
import { AIReportReader } from "./components/AIReportReader";
import { PrescriptionSafety } from "./components/PrescriptionSafety";
import { FindSpecialist } from "./components/FindSpecialist";
import { MoreScreen } from "./components/MoreScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { CinematicOpening } from "./components/CinematicOpening";
import { AdminDashboard } from "./components/AdminDashboard";
import { CalendarSyncButton } from "./components/CalendarSyncButton";
import { PrescriptionReminderManager } from "./components/PrescriptionReminderManager";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { 
  getSavedPrescriptionReminders, 
  savePrescriptionReminders, 
  checkAndTriggerDueReminders,
  formatTimeTo12Hour,
  sendPrescriptionPushNotification
} from "./lib/prescriptionNotifications";
import { signInWithGoogle, signOutUser } from "./lib/firebase";

import { 
  Heart, 
  Activity, 
  Calendar, 
  FileText, 
  Clipboard, 
  Shield, 
  Clock, 
  User, 
  Lock, 
  ChevronRight, 
  Plus, 
  Phone, 
  Mail, 
  PlusCircle, 
  Search, 
  Upload, 
  Trash, 
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  UserCheck,
  CheckCircle,
  CheckCircle2,
  BellRing,
  Stethoscope,
  ArrowLeft,
  ChevronLeft,
  MoreHorizontal,
  Star,
  CalendarPlus,
  BriefcaseMedical,
  PlusSquare,
  ClipboardList,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Folder,
  ArrowRight,
  Fingerprint,
  ScanFace,
  Scan,
  KeyRound,
  ChevronDown,
  Smartphone,
  Users,
  MessageSquare,
  Home,
  Bell,
  SlidersHorizontal,
  MapPin,
  Pill,
  Building2,
  IndianRupee,
  Download,
  Copy,
  Check,
  Globe,
  FlaskConical,
  Image,
  Navigation,
  Share2,
  BedDouble,
  HeartPulse,
  Ambulance,
  X,
  BrainCircuit,
  FileSearch,
  Droplet,
  CalendarX,
  UserPlus,
  Send,
  Info,
  Moon,
  Sun,
  Loader2,
} from "lucide-react";

interface StoredPatient extends Patient {
  password?: string;
  uploadedFiles?: MedicalRecord[];
}

const DEFAULT_SAVED_PATIENTS: StoredPatient[] = [
  {
    id: "pat-vatsal",
    name: "Vatsal Pandey",
    email: "vatsal@example.com",
    dob: "2009-08-27",
    gender: "Male",
    phone: "9351721314",
    bloodGroup: "O+",
    aadhaar: "5112 4312 9012",
    pregnancyStatus: "",
    chronicConditions: ["Hypertension", "Diabetes"],
    allergies: ["Penicillin"],
    address: "Flat 402, Building B, Sector 45, Gurugram, Haryana - 122003",
    flatHouseNo: "Flat 402, Building B",
    streetArea: "Sector 45",
    city: "Gurugram",
    state: "Haryana",
    pincode: "122003",
    password: "Vatsal@123",
    uploadedFiles: [],
    linkedHospitals: [
      "Pink City Multispeciality Hospital",
      "Aravalli Hills Medical Research Centre",
      "Jaigarh Health & Trauma Centre"
    ]
  }
];

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const parseTimeMinutes = (timeStr: string): number => {
  const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
};

const isSlotWithinTiming = (slot: string, doctorTiming?: string): boolean => {
  if (!doctorTiming) return true;
  const parts = doctorTiming.split("-");
  if (parts.length !== 2) return true;
  const startMins = parseTimeMinutes(parts[0]);
  const endMins = parseTimeMinutes(parts[1]);
  const slotMins = parseTimeMinutes(slot);
  return slotMins >= startMins && slotMins <= endMins;
};

const recommendSpecialty = (symptoms: string[]) => {
  if (symptoms.length === 0) {
    return {
      dept: "General Medicine",
      priority: "MEDIUM",
      reason: "No symptoms selected yet. General medicine is recommended for general wellness and diagnostics."
    };
  }

  const lowerSyms = symptoms.map(s => s.toLowerCase());

  // 1. Cardiology
  if (lowerSyms.some(s => s.includes("chest pain") || s.includes("shortness of breath") || s.includes("chest tightness"))) {
    return {
      dept: "Cardiology",
      priority: "URGENT",
      reason: "Your symptoms (such as Chest Pain/Tightness or Shortness of Breath) are key cardiovascular indicators. A consult with a cardiologist is recommended to assess heart health."
    };
  }

  // 2. Neurology
  if (lowerSyms.some(s => s.includes("headache") || s.includes("dizziness") || s.includes("blurry vision"))) {
    return {
      dept: "Neurology",
      priority: "HIGH",
      reason: "Neurological symptoms like intense headache, dizziness, or blurry vision are best evaluated by a neurologist to rule out central nervous system conditions."
    };
  }

  // 3. Pediatrics
  if (lowerSyms.some(s => s.includes("loss of appetite") || (s.includes("cough") && lowerSyms.some(xs => xs.includes("fever"))))) {
    return {
      dept: "Pediatrics",
      priority: "MEDIUM",
      reason: "Symptoms like fever paired with cough or pediatric concerns are best addressed by a child health specialist (Pediatrician) for customized care."
    };
  }

  // 4. Dermatology
  if (lowerSyms.some(s => s.includes("rashes") || s.includes("itching"))) {
    return {
      dept: "Dermatology",
      priority: "MEDIUM",
      reason: "Skin irritations, rashes, and persistent itching are dermatological symptoms. A dermatologist can help diagnose specific skin barriers and allergy conditions."
    };
  }

  // 5. Orthopedics
  if (lowerSyms.some(s => s.includes("joint pain") || s.includes("muscle pain") || s.includes("back pain"))) {
    return {
      dept: "Orthopedics",
      priority: "MEDIUM",
      reason: "Musculoskeletal concerns such as joint pain, muscle stiffness, or backaches indicate structural fatigue. Consulting an orthopedist is recommended."
    };
  }

  // 6. ENT
  if (lowerSyms.some(s => s.includes("sore throat") || s.includes("earache") || s.includes("toothache"))) {
    return {
      dept: "ENT",
      priority: "MEDIUM",
      reason: "Ear, nose, and throat symptoms like sore throat or earache require evaluation by an Otolaryngologist (ENT Specialist) to check for infections."
    };
  }

  // 7. Psychiatry
  if (lowerSyms.some(s => s.includes("anxiety") || s.includes("depression") || s.includes("insomnia"))) {
    return {
      dept: "Psychiatry",
      priority: "MEDIUM",
      reason: "Mental wellness concerns such as clinical anxiety, depression, or severe sleep disruption are expertly managed by a psychiatrist."
    };
  }

  // 8. Default: General Medicine
  return {
    dept: "General Medicine",
    priority: "MEDIUM",
    reason: `Your symptoms (${symptoms.slice(0, 3).join(", ")}) indicate potential systemic or physiological fatigue. A general physician can run basic diagnostics and prescribe initial treatment.`
  };
};

type AppScreen = 
  | "SPLASH" 
  | "ONBOARDING" 
  | "LOGIN_OPTIONS" 
  | "PATIENT_LOGIN" 
  | "PATIENT_REGISTER" 
  | "PATIENT_DASHBOARD" 
  | "DOCTOR_LOGIN" 
  | "DOCTOR_DASHBOARD"
  | "FORGOT_PASSWORD"
  | "ADMIN_LOGIN"
  | "ADMIN_DASHBOARD";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("ONBOARDING");
  const [showCinematicIntro, setShowCinematicIntro] = useState<boolean>(true);
  const [loadingPercent, setLoadingPercent] = useState(0);

  const [language, setLanguage] = useState<"en" | "hi">(() => {
    const saved = localStorage.getItem("hospyn_app_language");
    return (saved === "hi" || saved === "en") ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem("hospyn_app_language", language);
  }, [language]);

  // Saved Patients Database State
  const [registeredPatients, setRegisteredPatients] = useState<StoredPatient[]>(() => {
    const stored = localStorage.getItem("hospyn_registered_patients");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const unrealIds = new Set(["pat-riya", "pat-3", "pat-4", "pat-5", "pat-6", "pat-7", "pat-8", "pat-9", "pat-10", "pat-11", "pat-12", "pat-13", "pat-14", "pat-15", "pat-16", "pat-17", "pat-18", "pat-19", "pat-20", "pat-21", "pat-22", "pat-23", "pat-24", "pat-25", "pat-26", "pat-27", "pat-28"]);
          const filtered = parsed.filter((p: StoredPatient) => !unrealIds.has(p.id));
          if (!filtered.some(p => p.id === "pat-vatsal")) {
            filtered.unshift(DEFAULT_SAVED_PATIENTS[0]);
          }
          return filtered;
        }
      } catch (e) {
        console.error("Error parsing saved patients:", e);
      }
    }
    return DEFAULT_SAVED_PATIENTS;
  });

  // Sync registered patients database to localStorage
  useEffect(() => {
    localStorage.setItem("hospyn_registered_patients", JSON.stringify(registeredPatients));
  }, [registeredPatients]);

  const [hospitalsList, setHospitalsList] = useState<Hospital[]>(() => {
    const saved = localStorage.getItem("hospyn_hospitals_list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse hospitals list:", e);
      }
    }
    return MOCK_HOSPITALS;
  });

  useEffect(() => {
    localStorage.setItem("hospyn_hospitals_list", JSON.stringify(hospitalsList));
  }, [hospitalsList]);

  // Admin Auth States
  const [adminEmailInput, setAdminEmailInput] = useState("admin@hospyn.com");
  const [adminPassInput, setAdminPassInput] = useState("admin123");
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Auth States
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

  // Ensure activePatient is always registered in registeredPatients for Admin Portal visibility
  useEffect(() => {
    if (activePatient) {
      setRegisteredPatients(prev => {
        const exists = prev.some(p => p.id === activePatient.id || p.phone === activePatient.phone || (p.email && activePatient.email && p.email === activePatient.email));
        if (!exists) {
          return [activePatient as StoredPatient, ...prev];
        }
        return prev;
      });
    }
  }, [activePatient]);

  const [appointmentTab, setAppointmentTab] = useState<"Upcoming" | "Completed" | "Cancelled" | "Lab Tests">("Upcoming");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null);
  const [doctorTab, setDoctorTab] = useState<"Home" | "Patients" | "Queue" | "Profile">("Home");
  const [activeDoctorProfileModal, setActiveDoctorProfileModal] = useState<"personal" | "timings" | "schedule" | "security" | null>(null);
  const [docPhoneInput, setDocPhoneInput] = useState("+91 98765 43210");
  const [docFeeInput, setDocFeeInput] = useState("800");
  const [docBioInput, setDocBioInput] = useState("Senior Interventional Cardiologist specializing in adult cardiac care, hypertension, and echocardiography.");
  const [doc2FAEnabled, setDoc2FAEnabled] = useState(true);
  const [docCurrentPass, setDocCurrentPass] = useState("");
  const [docNewPass, setDocNewPass] = useState("");
  const [docConfirmPass, setDocConfirmPass] = useState("");
  const [docMorningSlot, setDocMorningSlot] = useState("09:00 AM - 01:00 PM");
  const [docEveningSlot, setDocEveningSlot] = useState("04:00 PM - 07:00 PM");
  const [docWorkingDays, setDocWorkingDays] = useState<Record<string, boolean>>({ Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: false });
  const [docEmergencyOnCall, setDocEmergencyOnCall] = useState(true);
  // Portal-specific Dark Mode States (Strictly isolated to Patient Portal and Doctor Portal)
  const [isPatientDarkMode, setIsPatientDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("hospyn_patient_dark_mode") === "true";
  });

  const [isDoctorDarkMode, setIsDoctorDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("hospyn_doctor_dark_mode") === "true";
  });

  // Details Modal Interaction States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const togglePatientDarkMode = () => {
    setIsPatientDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("hospyn_patient_dark_mode", next ? "true" : "false");
      return next;
    });
  };

  const toggleDoctorDarkMode = () => {
    setIsDoctorDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("hospyn_doctor_dark_mode", next ? "true" : "false");
      return next;
    });
  };

  const toggleHospitalLink = (hospitalName: string) => {
    if (!activePatient) return;
    const currentlyLinked = activePatient.linkedHospitals || [];
    let updatedLinked: string[];
    if (currentlyLinked.includes(hospitalName)) {
      updatedLinked = currentlyLinked.filter(name => name !== hospitalName);
    } else {
      updatedLinked = [...currentlyLinked, hospitalName];
    }
    const updatedPatient = {
      ...activePatient,
      linkedHospitals: updatedLinked
    };
    setActivePatient(updatedPatient);
    setRegisteredPatients(prev => prev.map(p => p.id === activePatient.id ? updatedPatient : p));
  };

  // Active Navigation Tab for Patient Dashboard
  const [patientTab, setPatientTab] = useState<"HOME" | "APPOINTMENTS" | "RECORDS" | "CHAT" | "SEARCH" | "PROFILE" | "HOSPITALS">("HOME");
  const [selectedDashboardHospital, setSelectedDashboardHospital] = useState<any | null>(null);
  const [selectedHospitalForDetails, setSelectedHospitalForDetails] = useState<any | null>(null);

  // Active Medication Reminders State for Home Dashboard
  const [homePrescriptionReminders, setHomePrescriptionReminders] = useState<PrescriptionReminder[]>(() =>
    getSavedPrescriptionReminders(activePatient?.id || "pat-1")
  );

  useEffect(() => {
    setHomePrescriptionReminders(getSavedPrescriptionReminders(activePatient?.id || "pat-1"));
  }, [activePatient?.id, patientTab]);

  const handleToggleHomeDoseTaken = (reminderId: string, slot: "morning" | "evening") => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setHomePrescriptionReminders(prev => {
      const updated = prev.map(rem => {
        if (rem.id === reminderId) {
          if (slot === "morning") {
            const isTaken = !rem.morningTakenToday;
            if (isTaken) {
              triggerToast(language === "hi" ? `${rem.medicineName} की सुबह की खुराक ली गई! ✓` : `Marked morning dose for ${rem.medicineName} as taken! ✓`);
            }
            return {
              ...rem,
              morningTakenToday: isTaken,
              morningTakenAt: isTaken ? timeFormatted : undefined
            };
          } else {
            const isTaken = !rem.eveningTakenToday;
            if (isTaken) {
              triggerToast(language === "hi" ? `${rem.medicineName} की शाम की खुराक ली गई! ✓` : `Marked evening dose for ${rem.medicineName} as taken! ✓`);
            }
            return {
              ...rem,
              eveningTakenToday: isTaken,
              eveningTakenAt: isTaken ? timeFormatted : undefined
            };
          }
        }
        return rem;
      });
      savePrescriptionReminders(updated);
      return updated;
    });
  };
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState<string>("");
  const [mapViewMode, setMapViewMode] = useState<boolean>(false);
  const [favoriteHospitals, setFavoriteHospitals] = useState<string[]>(["Pink City Multispeciality Hospital"]);
  const [showHospitalsNetwork, setShowHospitalsNetwork] = useState(false);
  const [hospitalSortOrder, setHospitalSortOrder] = useState<"rating" | "reviews" | "name">("rating");
  const [showHospitalSortMenu, setShowHospitalSortMenu] = useState<boolean>(false);

  // Active pill tracking state
  const [morningPillTaken, setMorningPillTaken] = useState(false);
  const [eveningPillTaken, setEveningPillTaken] = useState(false);

  // AI Health Check States
  const [healthScore, setHealthScore] = useState<number>(94);
  const [healthStatusText, setHealthStatusText] = useState<string>("Optimal");
  const [isScanningHealth, setIsScanningHealth] = useState<boolean>(false);
  const [sysBP, setSysBP] = useState<number>(118);
  const [diaBP, setDiaBP] = useState<number>(76);
  const [heartRateValue, setHeartRateValue] = useState<number>(72);
  const [spo2Value, setSpo2Value] = useState<number>(99);

  const handleRunHealthCheck = () => {
    setIsScanningHealth(true);
    setTimeout(() => {
      const randomSys = Math.floor(Math.random() * (123 - 115 + 1)) + 115;
      const randomDia = Math.floor(Math.random() * (81 - 75 + 1)) + 75;
      const randomHR = Math.floor(Math.random() * (76 - 67 + 1)) + 67;
      const randomSpo2 = Math.floor(Math.random() * (100 - 98 + 1)) + 98;
      
      setSysBP(randomSys);
      setDiaBP(randomDia);
      setHeartRateValue(randomHR);
      setSpo2Value(randomSpo2);
      
      const baseScore = 91 + Math.floor(Math.random() * 8);
      setHealthScore(baseScore);
      if (baseScore >= 96) {
        setHealthStatusText("Excellent");
      } else {
        setHealthStatusText("Optimal");
      }
      setIsScanningHealth(false);
    }, 1500);
  };

  // Secondary interactive views inside Dashboard
  const [showSymptomChecker, setShowSymptomChecker] = useState(false);
  const [showMedicalSearch, setShowMedicalSearch] = useState(false);
  const [showFindSpecialist, setShowFindSpecialist] = useState(false);
  const [showReportReader, setShowReportReader] = useState(false);
  const [showMoreScreen, setShowMoreScreen] = useState(false);

  // AI Patient History Analysis States for Doctor
  const [showHistoryAnalysisModal, setShowHistoryAnalysisModal] = useState(false);
  const [historyAnalysisPatient, setHistoryAnalysisPatient] = useState<StoredPatient | null>(null);
  const [historyAnalysisResult, setHistoryAnalysisResult] = useState<string>("");
  const [isHistoryAnalyzing, setIsHistoryAnalyzing] = useState(false);

  // Booking Wizard state
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [symptomNotes, setSymptomNotes] = useState<string>("");
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<number>(new Date().getMonth());
  const [currentCalendarYear, setCurrentCalendarYear] = useState<number>(new Date().getFullYear());

  // Helper function to format any date to: "Wednesday, 22 July 2026"
  const getFormattedDateLabel = (date: Date) => {
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const day = date.getDate();
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  };

  // Helper function to robustly parse a custom-formatted date string
  const parseSelectedDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const cleanStr = dateStr.includes(",") ? dateStr.split(",")[1].trim() : dateStr;
    const parsed = new Date(cleanStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // New multi-step Booking Wizard states
  const [bookingStep, setBookingStep] = useState<number>(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSearch, setSymptomSearch] = useState<string>("");
  const [showAddCustomSymptom, setShowAddCustomSymptom] = useState<boolean>(false);
  const [customSymptomInput, setCustomSymptomInput] = useState<string>("");
  const [generatedApptId, setGeneratedApptId] = useState<string>("");
  const [copiedApptId, setCopiedApptId] = useState<boolean>(false);
  const [aiRecommendation, setAiRecommendation] = useState<{ dept: string; priority: string; reason: string }>({
    dept: "General Medicine",
    priority: "MEDIUM",
    reason: "No symptoms analyzed yet."
  });

  const [isFindingNearestDoctor, setIsFindingNearestDoctor] = useState<boolean>(false);

  const handleViewRecommendedDoctors = () => {
    setIsFindingNearestDoctor(true);
    setTimeout(() => {
      setIsFindingNearestDoctor(false);
      setBookingStep(3);
    }, 1400);
  };

  // Record library upload & filter
  const [recordFilter, setRecordFilter] = useState<string>("All");
  const [recordsList, setRecordsList] = useState<MedicalRecord[]>([
    // Lab Reports (8 items)
    { id: "rec-1", patientId: "pat-vatsal", name: "Complete Blood Count", category: "Lab Report", size: "2.4 MB", date: "12 Jul 2026", summary: "Hematology panel shows normal hemoglobin level of 14.2 g/dL. Cholesterols are slightly elevated at 210 mg/dL. Discuss dietary modifications." },
    { id: "rec-2", patientId: "pat-vatsal", name: "Lipid Profile Test", category: "Lab Report", size: "1.8 MB", date: "28 Jun 2026", summary: "Total Cholesterol: 220 mg/dL (High), HDL: 45 mg/dL, LDL: 145 mg/dL (Borderline High), Triglycerides: 150 mg/dL. Cardiovascular exercise recommended." },
    { id: "rec-3", patientId: "pat-vatsal", name: "Thyroid Function Test", category: "Lab Report", size: "1.2 MB", date: "14 Jun 2026", summary: "TSH: 2.1 uIU/mL, Free T4: 1.3 ng/dL. Both parameters are within optimal clinical reference ranges. No thyroid dysfunction noted." },
    { id: "rec-4", patientId: "pat-vatsal", name: "HbA1c Blood Glucose", category: "Lab Report", size: "1.5 MB", date: "22 May 2026", summary: "HbA1c is 5.6%, indicating normal blood glucose levels. Below pre-diabetic threshold of 5.7%. Maintain current balanced diet." },
    { id: "rec-5", patientId: "pat-vatsal", name: "Liver Function Test", category: "Lab Report", size: "1.9 MB", date: "10 May 2026", summary: "ALT, AST, Bilirubin, and Alkaline Phosphatase are all within normal reference ranges. Healthy hepatic profile." },
    { id: "rec-6", patientId: "pat-vatsal", name: "Kidney Function Test", category: "Lab Report", size: "1.6 MB", date: "03 May 2026", summary: "Blood Urea Nitrogen (BUN): 14 mg/dL, Serum Creatinine: 0.9 mg/dL. Estimated GFR: >90 mL/min. Excellent renal clearance." },
    { id: "rec-7", patientId: "pat-vatsal", name: "Vitamin D & B12 Panel", category: "Lab Report", size: "1.1 MB", date: "18 Apr 2026", summary: "Vitamin D: 18 ng/mL (Deficient). Vitamin B12: 320 pg/mL (Normal). Cholecalciferol 60K weekly supplementation recommended for 8 weeks." },
    { id: "rec-8", patientId: "pat-vatsal", name: "Urinalysis Report", category: "Lab Report", size: "1.0 MB", date: "05 Apr 2026", summary: "Physical and chemical analysis normal. No protein, glucose, or nitrites detected. Microscopic examination negative for bacteria." },

    // Imaging (5 items)
    { id: "rec-9", patientId: "pat-vatsal", name: "MRI Brain", category: "Radiology Report", size: "18.5 MB", date: "05 Jul 2026", summary: "3T MRI scan of brain shows normal ventricular system. No acute intracranial hemorrhage, mass effect, or midline shift. Minimal non-specific white matter lesions." },
    { id: "rec-10", patientId: "pat-vatsal", name: "X-Ray Chest", category: "Radiology Report", size: "4.2 MB", date: "01 Jun 2026", summary: "PA view of chest. Lungs are clear, no focal consolidation, pleural effusion, or pneumothorax. Cardiomediastinal contour is normal." },
    { id: "rec-11", patientId: "pat-vatsal", name: "Ultrasound Abdomen", category: "Radiology Report", size: "6.8 MB", date: "20 May 2026", summary: "Normal size and echotexture of liver, gallbladder, spleen, pancreas, and kidneys. No gallstones, biliary dilatation, or hydronephrosis." },
    { id: "rec-12", patientId: "pat-vatsal", name: "CT Paranasal Sinuses", category: "Radiology Report", size: "14.2 MB", date: "12 Apr 2026", summary: "Mild mucosal thickening in bilateral maxillary and ethmoid sinuses. Frontal and sphenoid sinuses are clear. No bony destruction." },
    { id: "rec-13", patientId: "pat-vatsal", name: "Lumbar Spine X-Ray", category: "Radiology Report", size: "3.8 MB", date: "02 Mar 2026", summary: "Minimal degenerative disc disease at L4-L5 level with mild osteophytes. Normal vertebral alignment and intact pedicles." },

    // Prescriptions (6 items)
    { id: "rec-14", patientId: "pat-vatsal", name: "Dr. Priya Mehta (Pantocid 40mg)", category: "Prescription", size: "850 KB", date: "24 Jun 2026", summary: "Pantocid 40mg - Eat 1 tablet in morning and 1 tablet in evening after eating meal." },
    { id: "rec-15", patientId: "pat-vatsal", name: "Dr. Rajesh Sharma", category: "Prescription", size: "720 KB", date: "18 Jun 2026", summary: "Montelukast 10mg + Levocetirizine 5mg at bedtime for seasonal allergic rhinitis. Avoid allergen exposure." },
    { id: "rec-16", patientId: "pat-vatsal", name: "Dr. Sarah Wilson", category: "Prescription", size: "910 KB", date: "10 Jun 2026", summary: "Atorvastatin 10mg once daily after dinner for cholesterol management. Lifestyle modifications advised." },
    { id: "rec-17", patientId: "pat-vatsal", name: "Dermatologist Prescription", category: "Prescription", size: "650 KB", date: "02 May 2026", summary: "Ketoconazole 2% shampoo and Hydrocortisone 1% cream for scalp dermatitis. Apply as directed for 2 weeks." },
    { id: "rec-18", patientId: "pat-vatsal", name: "General OPD Treatment Slip", category: "Prescription", size: "1.1 MB", date: "15 Apr 2026", summary: "Amoxicillin 500mg three times daily for 5 days to treat mild acute bronchitis. Stay hydrated." },
    { id: "rec-19", patientId: "pat-vatsal", name: "Dental Clinic Prescription", category: "Prescription", size: "520 KB", date: "28 Feb 2026", summary: "Ibuprofen 400mg as needed for dental pain following scaling procedure. Chlorhexidine mouthwash twice daily." },

    // Discharge Summaries (3 items)
    { id: "rec-20", patientId: "pat-vatsal", name: "Discharge Summary (Knee Surgery)", category: "Discharge Summary", size: "3.1 MB", date: "15 Jun 2026", summary: "Admitted for elective arthroscopic knee debridement. Procedure uneventful. Discharged in stable condition. Physical therapy advised." },
    { id: "rec-21", patientId: "pat-vatsal", name: "Discharge Summary (Gastroenteritis)", category: "Discharge Summary", size: "4.5 MB", date: "12 Apr 2026", summary: "Admitted with severe dehydration secondary to acute gastroenteritis. Managed with IV fluids, antiemetics. Discharged after complete recovery." },
    { id: "rec-22", patientId: "pat-vatsal", name: "Discharge Summary (Health Assessment)", category: "Discharge Summary", size: "2.9 MB", date: "15 Jan 2026", summary: "Completed a comprehensive 24-hour executive health evaluation. Cardiac, pulmonary, and metabolic scores optimal. Advised general wellness regimen." },

    // Others (2 items)
    { id: "rec-23", patientId: "pat-vatsal", name: "Vaccination Certificate (COVID-19)", category: "Vaccination Record", size: "920 KB", date: "10 May 2026", summary: "Certified administration of third dose (booster) of COVID-19 vaccination. No adverse reaction reported." },
    { id: "rec-24", patientId: "pat-vatsal", name: "Medical Fitness Certificate", category: "Other Document", size: "1.4 MB", date: "25 Feb 2026", summary: "Following physical and diagnostic examination, certified fit for active travel, high-altitude trekking, and physical sports." }
  ]);

  // Selected Record Preview modal
  const [previewRecord, setPreviewRecord] = useState<MedicalRecord | null>(null);
  const [showRecordsSearchInput, setShowRecordsSearchInput] = useState(false);
  const [recordsSearchQuery, setRecordsSearchQuery] = useState("");
  const [showRecordsSortMenu, setShowRecordsSortMenu] = useState(false);
  const [recordsSortOrder, setRecordsSortOrder] = useState<"newest" | "oldest" | "name">("newest");
  const [showRecordsSummaryModal, setShowRecordsSummaryModal] = useState(false);

  const [showUploadRecordModal, setShowUploadRecordModal] = useState(false);
  const [uploadRecordFile, setUploadRecordFile] = useState<File | null>(null);
  const [uploadRecordCategory, setUploadRecordCategory] = useState<MedicalRecord["category"]>("Lab Report");
  const [uploadRecordName, setUploadRecordName] = useState("");

  // Synchronize uploaded records from activePatient to recordsList automatically
  useEffect(() => {
    if (activePatient && (activePatient as StoredPatient).uploadedFiles && (activePatient as StoredPatient).uploadedFiles!.length > 0) {
      const userFiles = (activePatient as StoredPatient).uploadedFiles!;
      setRecordsList(prev => {
        const customIds = new Set(userFiles.map(f => f.id));
        const filteredPrev = prev.filter(r => !customIds.has(r.id));
        return [...userFiles, ...filteredPrev];
      });
    }
  }, [activePatient?.id]);

  // Doctor Consultation workflow state
  const [consultingPatient, setConsultingPatient] = useState<Patient | null>(null);
  const [showConsultationSheet, setShowConsultationSheet] = useState(false);
  const [prescribedMedicines, setPrescribedMedicines] = useState<string[]>([""]);
  const [consultationNotes, setConsultationNotes] = useState("");
  const [showDoctorSafetyEngine, setShowDoctorSafetyEngine] = useState(false);
  const [inlineSafetyChecking, setInlineSafetyChecking] = useState(false);
  const [inlineSafetyResult, setInlineSafetyResult] = useState<string | null>(null);
  const [followupSuggestions, setFollowupSuggestions] = useState<string | null>(null);
  const [generatingFollowup, setGeneratingFollowup] = useState(false);

  // Registration Form Steps State
  const [regStep, setRegStep] = useState(1);
  const [regName, setRegName] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regGender, setRegGender] = useState<"Male" | "Female" | "Other" | "">("");
  const [regPhone, setRegPhone] = useState("");
  const [regCountryCode, setRegCountryCode] = useState("+91");
  const [regEmail, setRegEmail] = useState("");
  const [regAadhaar, setRegAadhaar] = useState("");
  const [regBlood, setRegBlood] = useState("");
  const [regFlat, setRegFlat] = useState("");
  const [regStreet, setRegStreet] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regState, setRegState] = useState("");
  const [regPincode, setRegPincode] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regConditions, setRegConditions] = useState<string[]>([]);
  const [regAllergies, setRegAllergies] = useState<string[]>([]);
  const [customConditionInput, setCustomConditionInput] = useState("");
  const [customAllergyInput, setCustomAllergyInput] = useState("");
  const [regPregnancyStatus, setRegPregnancyStatus] = useState<string>("");
  const [regPhoto, setRegPhoto] = useState<string>("");
  const [regReportFile, setRegReportFile] = useState<File | null>(null);

  // OTP simulation states
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));

  // ─── NAVIGATION HISTORY & BACK-BUTTON STATE ENGINE ───
  interface AppNavSnapshot {
    screen: AppScreen;
    patientTab: "HOME" | "APPOINTMENTS" | "RECORDS" | "CHAT" | "SEARCH" | "PROFILE" | "HOSPITALS";
    doctorTab: "Home" | "Patients" | "Queue" | "Profile";
    showMoreScreen: boolean;
    showSymptomChecker: boolean;
    showMedicalSearch: boolean;
    showFindSpecialist: boolean;
    showReportReader: boolean;
    showBookingWizard: boolean;
    showAppointmentDetails: boolean;
    showHistoryAnalysisModal: boolean;
    showUploadRecordModal: boolean;
    showRecordsSummaryModal: boolean;
    selectedHospitalForDetailsId: string | null;
    selectedDashboardHospitalId: string | null;
    activeDoctorProfileModal: "personal" | "timings" | "schedule" | "security" | null;
  }

  const getCurrentNavSnapshot = (): AppNavSnapshot => ({
    screen,
    patientTab,
    doctorTab,
    showMoreScreen,
    showSymptomChecker,
    showMedicalSearch,
    showFindSpecialist,
    showReportReader,
    showBookingWizard,
    showAppointmentDetails,
    showHistoryAnalysisModal,
    showUploadRecordModal,
    showRecordsSummaryModal,
    selectedHospitalForDetailsId: selectedHospitalForDetails?.id || selectedHospitalForDetails?.name || null,
    selectedDashboardHospitalId: selectedDashboardHospital?.id || selectedDashboardHospital?.name || null,
    activeDoctorProfileModal,
  });

  const areNavSnapshotsEqual = (a: AppNavSnapshot, b: AppNavSnapshot): boolean => {
    return (
      a.screen === b.screen &&
      a.patientTab === b.patientTab &&
      a.doctorTab === b.doctorTab &&
      a.showMoreScreen === b.showMoreScreen &&
      a.showSymptomChecker === b.showSymptomChecker &&
      a.showMedicalSearch === b.showMedicalSearch &&
      a.showFindSpecialist === b.showFindSpecialist &&
      a.showReportReader === b.showReportReader &&
      a.showBookingWizard === b.showBookingWizard &&
      a.showAppointmentDetails === b.showAppointmentDetails &&
      a.showHistoryAnalysisModal === b.showHistoryAnalysisModal &&
      a.showUploadRecordModal === b.showUploadRecordModal &&
      a.showRecordsSummaryModal === b.showRecordsSummaryModal &&
      a.selectedHospitalForDetailsId === b.selectedHospitalForDetailsId &&
      a.selectedDashboardHospitalId === b.selectedDashboardHospitalId &&
      a.activeDoctorProfileModal === b.activeDoctorProfileModal
    );
  };

  const applyNavSnapshot = (target: AppNavSnapshot) => {
    setScreen(target.screen);
    setPatientTab(target.patientTab);
    setDoctorTab(target.doctorTab);
    setShowMoreScreen(target.showMoreScreen);
    setShowSymptomChecker(target.showSymptomChecker);
    setShowMedicalSearch(target.showMedicalSearch);
    setShowFindSpecialist(target.showFindSpecialist);
    setShowReportReader(target.showReportReader);
    setShowBookingWizard(target.showBookingWizard);
    setShowAppointmentDetails(target.showAppointmentDetails);
    setShowHistoryAnalysisModal(target.showHistoryAnalysisModal);
    setShowUploadRecordModal(target.showUploadRecordModal);
    setShowRecordsSummaryModal(target.showRecordsSummaryModal);
    setActiveDoctorProfileModal(target.activeDoctorProfileModal);

    if (!target.selectedHospitalForDetailsId) {
      setSelectedHospitalForDetails(null);
    }
    if (!target.selectedDashboardHospitalId) {
      setSelectedDashboardHospital(null);
    }
  };

  const historyStackRef = React.useRef<AppNavSnapshot[]>([]);
  const isPoppingRef = React.useRef<boolean>(false);

  // Initialize navigation history stack
  useEffect(() => {
    const initSnap = getCurrentNavSnapshot();
    historyStackRef.current = [initSnap];
    try {
      window.history.replaceState({ hospynNavIndex: 0 }, "");
    } catch (e) {
      // Intentionally ignore restricted history environment
    }
  }, []);

  // Track forward navigation changes
  useEffect(() => {
    if (isPoppingRef.current) {
      isPoppingRef.current = false;
      return;
    }

    const currentSnap = getCurrentNavSnapshot();
    const stack = historyStackRef.current;
    const lastSnap = stack[stack.length - 1];

    if (!lastSnap || !areNavSnapshotsEqual(lastSnap, currentSnap)) {
      stack.push(currentSnap);
      try {
        window.history.pushState({ hospynNavIndex: stack.length - 1 }, "");
      } catch (e) {
        // Intentionally ignore restricted history environment
      }
    }
  }, [
    screen,
    patientTab,
    doctorTab,
    showMoreScreen,
    showSymptomChecker,
    showMedicalSearch,
    showFindSpecialist,
    showReportReader,
    showBookingWizard,
    showAppointmentDetails,
    showHistoryAnalysisModal,
    showUploadRecordModal,
    showRecordsSummaryModal,
    selectedHospitalForDetails,
    selectedDashboardHospital,
    activeDoctorProfileModal,
  ]);

  // Handle browser & device back button (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const stack = historyStackRef.current;
      if (stack.length > 1) {
        stack.pop(); // Remove active state
        let prevSnap = stack[stack.length - 1];

        // Skip admin states if popping back when not in admin flow
        while (
          prevSnap &&
          (prevSnap.screen === "ADMIN_DASHBOARD" || prevSnap.screen === "ADMIN_LOGIN")
        ) {
          stack.pop();
          prevSnap = stack[stack.length - 1];
        }

        if (prevSnap) {
          isPoppingRef.current = true;
          applyNavSnapshot(prevSnap);
        } else {
          setScreen("LOGIN_OPTIONS");
        }
      } else {
        // Fallback root action when history stack is 1
        if (showMoreScreen) setShowMoreScreen(false);
        else if (showSymptomChecker) setShowSymptomChecker(false);
        else if (showMedicalSearch) setShowMedicalSearch(false);
        else if (showFindSpecialist) setShowFindSpecialist(false);
        else if (showReportReader) setShowReportReader(false);
        else if (showBookingWizard) setShowBookingWizard(false);
        else if (selectedHospitalForDetails) setSelectedHospitalForDetails(null);
        else if (selectedDashboardHospital) setSelectedDashboardHospital(null);
        else if (showAppointmentDetails) setShowAppointmentDetails(false);
        else if (patientTab !== "HOME" && screen === "PATIENT_DASHBOARD") setPatientTab("HOME");
        else if (doctorTab !== "Home" && screen === "DOCTOR_DASHBOARD") setDoctorTab("Home");
        else if (screen === "PATIENT_LOGIN" || screen === "DOCTOR_LOGIN" || screen === "PATIENT_REGISTER") setScreen("LOGIN_OPTIONS");
        else if (screen === "LOGIN_OPTIONS") setScreen("ONBOARDING");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    showMoreScreen,
    showSymptomChecker,
    showMedicalSearch,
    showFindSpecialist,
    showReportReader,
    showBookingWizard,
    selectedHospitalForDetails,
    selectedDashboardHospital,
    showAppointmentDetails,
    patientTab,
    doctorTab,
    screen,
  ]);

  // Universal Go-Back Helper for UI Buttons
  const handleGoBack = () => {
    if (screen === "LOGIN_OPTIONS") {
      historyStackRef.current = historyStackRef.current.filter(
        s => s.screen !== "ADMIN_DASHBOARD" && s.screen !== "ADMIN_LOGIN" && s.screen !== "LOGIN_OPTIONS"
      );
      isPoppingRef.current = true;
      setScreen("ONBOARDING");
      return;
    }

    if (screen === "ADMIN_LOGIN" || screen === "ADMIN_DASHBOARD") {
      historyStackRef.current = historyStackRef.current.filter(
        s => s.screen !== "ADMIN_DASHBOARD" && s.screen !== "ADMIN_LOGIN"
      );
      isPoppingRef.current = true;
      setScreen("LOGIN_OPTIONS");
      return;
    }

    const stack = historyStackRef.current;
    if (stack.length > 1) {
      stack.pop();
      let prevSnap = stack[stack.length - 1];
      while (
        prevSnap &&
        (prevSnap.screen === "ADMIN_DASHBOARD" || prevSnap.screen === "ADMIN_LOGIN")
      ) {
        stack.pop();
        prevSnap = stack[stack.length - 1];
      }
      if (prevSnap) {
        isPoppingRef.current = true;
        applyNavSnapshot(prevSnap);
        return;
      }
    }

    if (showMoreScreen) setShowMoreScreen(false);
    else if (showSymptomChecker) setShowSymptomChecker(false);
    else if (showMedicalSearch) setShowMedicalSearch(false);
    else if (showFindSpecialist) setShowFindSpecialist(false);
    else if (showReportReader) setShowReportReader(false);
    else if (showBookingWizard) setShowBookingWizard(false);
    else if (selectedHospitalForDetails) setSelectedHospitalForDetails(null);
    else if (selectedDashboardHospital) setSelectedDashboardHospital(null);
    else if (showAppointmentDetails) setShowAppointmentDetails(false);
    else if (patientTab !== "HOME" && screen === "PATIENT_DASHBOARD") setPatientTab("HOME");
    else if (doctorTab !== "Home" && screen === "DOCTOR_DASHBOARD") setDoctorTab("Home");
    else if (screen === "PATIENT_LOGIN" || screen === "DOCTOR_LOGIN" || screen === "PATIENT_REGISTER") setScreen("LOGIN_OPTIONS");
  };

  const handleGoogleAuth = async () => {
    try {
      const user = await signInWithGoogle();
      const googlePatient: Patient = {
        id: `pat-google-${user.uid.slice(0, 8)}`,
        name: user.displayName || "Google User",
        phone: user.phoneNumber || "+91 93517 21314",
        email: user.email || "",
        dob: "1994-06-12",
        gender: "Male",
        bloodGroup: "O+",
        aadhaar: "9876 5432 1098",
        allergies: ["None"],
        chronicConditions: ["None"],
      };

      setRegisteredPatients((prev: any[]) => {
        const exists = prev.some((p: any) => p.email === googlePatient.email || p.id === googlePatient.id);
        if (exists) return prev;
        return [googlePatient as StoredPatient, ...prev];
      });

      setActivePatient(googlePatient);
      setScreen("PATIENT_DASHBOARD");
      setPatientTab("HOME");
      triggerToast(`Signed in with Google as ${user.displayName || 'Patient'}!`);
    } catch (err: any) {
      console.error("Google Auth failed:", err);
      triggerToast("Google Auth process completed");
    }
  };

  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpPopup, setOtpPopup] = useState<{ code: string; phone: string; type: "login" | "register" } | null>(null);

  const handleAddCustomCondition = () => {
    const trimmed = customConditionInput.trim();
    if (!trimmed) return;
    setRegConditions(prev => {
      const filtered = prev.filter(x => x !== "None" && x.toLowerCase() !== trimmed.toLowerCase());
      return [...filtered, trimmed];
    });
    setCustomConditionInput("");
  };

  const handleAddCustomAllergy = () => {
    const trimmed = customAllergyInput.trim();
    if (!trimmed) return;
    setRegAllergies(prev => {
      const filtered = prev.filter(x => x !== "None" && x.toLowerCase() !== trimmed.toLowerCase());
      return [...filtered, trimmed];
    });
    setCustomAllergyInput("");
  };

  const autoFillOtpCode = (code: string, type: "login" | "register") => {
    const chars = code.slice(0, 6).split("");
    if (type === "login") {
      setLoginOtpCode(chars);
      triggerToast("OTP Auto-filled!");
      setTimeout(() => {
        const el = document.getElementById("login-otp-5");
        el?.focus();
      }, 100);
    } else {
      setOtpCode(chars);
      triggerToast("OTP Auto-filled!");
      setTimeout(() => {
        const el = document.getElementById("reg-otp-5");
        el?.focus();
      }, 100);
    }
  };

  // Check if phone number is already registered in our local database
  const isPhoneAlreadyRegistered = registeredPatients.some(p => {
    const cleanDb = p.phone.replace(/\D/g, "");
    const last10Db = cleanDb.length >= 10 ? cleanDb.slice(-10) : cleanDb;
    const cleanReg = regPhone.replace(/\D/g, "");
    const last10Reg = cleanReg.length >= 10 ? cleanReg.slice(-10) : cleanReg;
    return last10Db === last10Reg && last10Reg.length === 10;
  });

  // Login form inputs
  const [loginPhone, setPatientPhone] = useState("9351721314");
  const [loginPassword, setPatientPassword] = useState("");
  const [loginOtpPhone, setLoginOtpPhone] = useState("9351721314");
  const [isLoginOtpPanel, setIsLoginOtpPanel] = useState(false);
  const [loginOtpCode, setLoginOtpCode] = useState<string[]>(Array(6).fill(""));
  const [loginOtpTimer, setLoginOtpTimer] = useState(60);
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  
  const [showPatientLoginPwd, setShowPatientLoginPwd] = useState(false);
  const [showDocLoginPwd, setShowDocLoginPwd] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showRegConfirmPwd, setShowRegConfirmPwd] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");

  const [docUserId, setDocUserId] = useState("dr.sharma@hospyn.com");
  const [docPassword, setDocPassword] = useState("Vatsal@123");
  const [docRememberMe, setDocRememberMe] = useState(true);
  const [doctorLoginError, setDoctorLoginError] = useState("");
  
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // Sample Appointments State
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem("hospyn_appointments_list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 7) return parsed;
      } catch (e) {
        console.error("Error parsing saved appointments:", e);
      }
    }
    return [
      {
        id: "appt-1",
        patientId: "pat-vatsal",
        doctorId: "doc-5",
        date: "2026-07-23",
        month: "Jul",
        dayNum: "23",
        dayName: "Thu",
        time: "09:00 AM",
        type: "OPD Consultation",
        status: "Confirmed",
        symptoms: "Chest tightness during morning walks & elevated blood pressure."
      }
    ];
  });

  // Quick Info Modal & Reports Modal state for Doctor Portal
  const [selectedQuickPatient, setSelectedQuickPatient] = useState<{ patient: StoredPatient; appointment?: Appointment } | null>(null);
  const [viewPatientReportsModal, setViewPatientReportsModal] = useState<{ patient: StoredPatient; reports: MedicalRecord[] } | null>(null);
  const [docPatientSearchQuery, setDocPatientSearchQuery] = useState("");

  // Derive doctor appointments and queue dynamically for Doctor Dashboard (Today's OPD Queue: 7-8 booked patients)
  const doctorQueue = useMemo(() => {
    const targetDocId = activeDoctor?.id || "doc-5";
    const targetDocName = activeDoctor?.name || "Dr. Rajesh Sharma";

    // Filter appointments for active doctor or Dr. Rajesh Sharma (doc-5)
    const apptsForDoc = appointmentsList.filter(a => {
      if (a.doctorId === targetDocId || a.doctorId === "doc-5") return true;
      if (targetDocName.toLowerCase().includes("sharma") && (a.doctorId === "doc-5" || a.doctorId === "doc-1")) return true;
      return false;
    });

    const allPatients = [...registeredPatients];
    if (activePatient && !allPatients.some(p => p.id === activePatient.id || p.phone === activePatient.phone)) {
      allPatients.unshift(activePatient as StoredPatient);
    }

    const items: Array<{ patient: StoredPatient; appointment?: Appointment }> = [];
    const addedIds = new Set<string>();

    // Add patients with booked appointments for Dr. Rajesh Sharma
    apptsForDoc.forEach(appt => {
      let p = allPatients.find(item => item.id === appt.patientId);
      if (!p && appt.patientId === "pat-vatsal") {
        p = {
          id: "pat-vatsal",
          name: "Vatsal Pandey",
          email: "vatsal@example.com",
          dob: "2009-08-27",
          gender: "Male",
          phone: "9876543210",
          bloodGroup: "O+",
          aadhaar: "5112 4312 9012",
          pregnancyStatus: "",
          chronicConditions: ["Hypertension", "Diabetes"],
          allergies: ["Penicillin"]
        };
      }
      if (p && !addedIds.has(p.id)) {
        addedIds.add(p.id);
        items.push({ patient: p, appointment: appt });
      }
    });

    return items;
  }, [appointmentsList, registeredPatients, activePatient, activeDoctor]);

  // Complete Hospital Patient Directory
  const allPatientsDirectory = useMemo(() => {
    const targetDocId = activeDoctor?.id || "doc-5";
    const targetDocName = activeDoctor?.name || "Dr. Rajesh Sharma";

    const apptsForDoc = appointmentsList.filter(a => {
      if (a.doctorId === targetDocId || a.doctorId === "doc-5") return true;
      if (targetDocName.toLowerCase().includes("sharma") && (a.doctorId === "doc-5" || a.doctorId === "doc-1")) return true;
      return false;
    });

    const all = [...registeredPatients];
    if (activePatient && !all.some(p => p.id === activePatient.id || p.phone === activePatient.phone)) {
      all.unshift(activePatient as StoredPatient);
    }
    if (!all.some(p => p.id === "pat-vatsal")) {
      all.unshift({
        id: "pat-vatsal",
        name: "Vatsal Pandey",
        email: "vatsal@example.com",
        dob: "2009-08-27",
        gender: "Male",
        phone: "9876543210",
        bloodGroup: "O+",
        aadhaar: "5112 4312 9012",
        pregnancyStatus: "",
        chronicConditions: ["Hypertension", "Diabetes"],
        allergies: ["Penicillin"]
      });
    }

    return all.map(p => {
      const appt = apptsForDoc.find(a => a.patientId === p.id);
      return { patient: p, appointment: appt };
    });
  }, [registeredPatients, activePatient, appointmentsList, activeDoctor]);

  const filteredDoctorQueue = useMemo(() => {
    const sourceList = doctorTab === "Patients" ? allPatientsDirectory : doctorQueue;
    if (!docPatientSearchQuery.trim()) return sourceList;
    const q = docPatientSearchQuery.toLowerCase().trim();
    return sourceList.filter(item => 
      item.patient.name.toLowerCase().includes(q) ||
      item.patient.id.toLowerCase().includes(q) ||
      item.patient.phone.includes(q) ||
      (item.patient.bloodGroup && item.patient.bloodGroup.toLowerCase().includes(q)) ||
      (item.appointment?.symptoms && item.appointment.symptoms.toLowerCase().includes(q))
    );
  }, [doctorTab, allPatientsDirectory, doctorQueue, docPatientSearchQuery]);

  const [doctorsList, setDoctorsList] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem("hospyn_doctors_list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 50) {
          return parsed;
        }
      } catch (e) {
        // Fallback to MOCK_DOCTORS
      }
    }
    return MOCK_DOCTORS;
  });

  useEffect(() => {
    localStorage.setItem("hospyn_appointments_list", JSON.stringify(appointmentsList));
  }, [appointmentsList]);

  useEffect(() => {
    localStorage.setItem("hospyn_doctors_list", JSON.stringify(doctorsList));
  }, [doctorsList]);

  // Handle Splash Screen Tick
  useEffect(() => {
    if (screen === "SPLASH") {
      const interval = setInterval(() => {
        setLoadingPercent(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setScreen("ONBOARDING"), 300);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [screen]);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpTimer]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loginOtpSent && loginOtpTimer > 0) {
      timer = setInterval(() => {
        setLoginOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [loginOtpSent, loginOtpTimer]);

  // Active Prescription Push Reminder Scheduler State
  const [activeDueReminderAlert, setActiveDueReminderAlert] = useState<{
    reminder: any;
    slot: "Morning" | "Evening";
  } | null>(null);

  useEffect(() => {
    const checkReminders = () => {
      const list = getSavedPrescriptionReminders(activePatient?.id);
      checkAndTriggerDueReminders(list, ({ reminder, slot }) => {
        setActiveDueReminderAlert({ reminder, slot });
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 25000);
    return () => clearInterval(interval);
  }, [activePatient?.id]);

  // Mock patient registration age validator helper
  const getAge = (dobString: string) => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Real file downloader for medical records in real life
  const handleDownloadRecord = (rec: MedicalRecord) => {
    const patientName = activePatient?.name || "Vatsal Pandey";
    const patientDob = activePatient?.dob || "2009-08-27";
    const patientBlood = activePatient?.bloodGroup || "O+";
    
    const fileContent = `======================================================================
                   HOSPYN CLINICAL HEALTH NETWORK                       
======================================================================
               SECURE PATIENT PORTAL DIGITAL DOWNLOAD                 
                                                                      
Patient Name:        ${patientName}
Date of Birth:       ${patientDob}
Blood Group:         ${patientBlood}
Generated Date:      ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
======================================================================
                          RECORD METADATA                             
======================================================================
Document Title:      ${rec.name}
Category:            ${rec.category}
Uploaded On:         ${rec.date}
File Size:           ${rec.size || 'N/A'}
Security Verification: DIGITAL SIGNATURE VERIFIED (SHA-256 ENCRYPTED)
Registered Hospital: ${rec.id === "rec-10" || rec.id === "rec-13" || rec.id === "rec-24" ? "Metro Heart Institute" : "CityCare Hospital, Delhi"}
Reference ID:        ${rec.id}

======================================================================
                    AI INSIGHT & CLINICAL SUMMARY                     
======================================================================
${rec.summary || "No clinical insight available. Please utilize the Scanner tool inside the app to generate a smart diagnostic analysis."}

======================================================================
                                NOTICE                                
======================================================================
This document is an authentic clinical record securely retrieved from the 
Hospyn Patient Health Vault. It has been signed and validated 
digitally under Regional Clinical Governance guidelines.
For any clinical inquiries or medical discussions, please consult your 
primary care physician or access the secure doctor portal in the app.
======================================================================
[END OF SECURE REPORT]
`;

    // Create secure text blob & trigger standard browser download
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Create clean file name from report title
    const safeName = rec.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.href = url;
    link.download = `${safeName}_report.txt`;
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up memory
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download full AI summarized analytics report in real life
  const handleDownloadFullSummary = () => {
    const patientName = activePatient?.name || "Vatsal Pandey";
    const patientDob = activePatient?.dob || "2009-08-27";
    const patientBlood = activePatient?.bloodGroup || "O+";
    
    const fileContent = `======================================================================
                   HOSPYN CLINICAL HEALTH NETWORK                       
======================================================================
               AI-SYNTHESIZED CLINICAL SUMMARY REPORT                 
                                                                      
Patient Name:        ${patientName}
Date of Birth:       ${patientDob}
Blood Group:         ${patientBlood}
Analysis Generated:  ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
======================================================================
                        CLINICAL INSIGHT METRICS                      
======================================================================
Health Score Index:  Excellent (92%)
Overall Status:      Metabolic, cardiac, and renal indicators are clear.
Primary Focus Area:  Deficiency Control (Vitamin D & Lipid optimization)

======================================================================
                     SYNTHESIZED HEALTH INSIGHTS                      
======================================================================
1. Cardiovascular & Blood Pressure Management
   Your blood pressure management under Dr. Priya Mehta has been highly 
   successful. Your lipid profiles suggest mild borderline elevations, and 
   mild aerobic exercise (e.g. 30 mins walking) is recommended to optimize 
   HDL cholesterol levels.

2. Diagnostic Imaging Baselines Cleared
   Recent MRI Brain (Jul 2026) and Chest X-Ray (Jun 2026) show completely 
   normal physiological baselines, with no chronic pathology or 
   abnormalities detected.

3. Nutritional Supplementation Analysis
   Your vitamin levels show moderate Vitamin D deficiency (18 ng/mL). 
   Active supplementation of Cholecalciferol 60K weekly for 8 weeks is 
   underway and should show elevated results by next review.

======================================================================
                    CHRONOLOGICAL CARE TIMELINE                       
======================================================================
* JULY 2026:
  - Brain MRI scan & Hematology clear
  - Zero acute findings in intracranial analysis.

* JUNE 2026:
  - Hypertension Treatment Slip
  - Amlodipine 5mg daily prescribed with optimal outcome.

* MAY 2026:
  - Vaccination Booster Dose 3
  - Successfully administered; complete immune response certificate generated.

======================================================================
                                NOTICE                                
======================================================================
This report has been compiled and analyzed automatically by Hospyn AI. 
It represents an aggregated analysis across your secure clinical records.
Please share this report with your physician during your next consultation.
======================================================================
[END OF SECURE ANALYTICS SUMMARY]
`;

    // Create secure text blob & trigger standard browser download
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.download = `hospyn_ai_health_summary.txt`;
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up memory
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Direct Doctor Booking from Specialist Finder
  const handleBookDoctorDirectly = (doctor: Doctor) => {
    const matchedHospital = MOCK_HOSPITALS.find(h => h.name === doctor.hospitalName) || MOCK_HOSPITALS[0];
    setSelectedDoctor(doctor);
    setSelectedHospital(matchedHospital);
    setSelectedDept(doctor.department);
    setBookingStep(4); // transition to Select Date step
    setShowFindSpecialist(false);
    setShowBookingWizard(true);
  };

  // Live OTP Trigger handler for Registration
  const sendMockVerificationOtp = async () => {
    if (!regPhone || regPhone.replace(/\D/g, "").length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (isPhoneAlreadyRegistered) {
      alert("This mobile number is already registered. Please login instead.");
      return;
    }
    
    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: regPhone, countryCode: regCountryCode })
      });
      const data = await response.json();
      if (data.success) {
        setOtpSent(true);
        setOtpTimer(60);
        const codeToUse = data.otpCode || "712314";
        setOtpPopup({
          code: codeToUse,
          phone: `${regCountryCode} ${regPhone}`,
          type: "register"
        });
      } else {
        alert(data.error || "Failed to send OTP. Please try again.");
      }
    } catch (e: any) {
      console.error("Error sending register OTP:", e);
      setOtpSent(true);
      setOtpTimer(60);
      setOtpPopup({
        code: "712314",
        phone: `${regCountryCode} ${regPhone}`,
        type: "register"
      });
    }
  };

  const verifyOtpCode = async () => {
    const fullCode = otpCode.join("");
    if (!fullCode || fullCode.length < 6) {
      alert("Please enter a 6-digit verification code.");
      return;
    }

    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: regPhone, code: fullCode })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsPhoneVerified(true);
        setOtpSent(false);
        alert(data.message || "Mobile number verified successfully!");
      } else {
        alert(data.error || "Incorrect OTP. Please check the code and try again.");
      }
    } catch (e: any) {
      console.error("Error verifying register OTP:", e);
      if (fullCode === "712314") {
        setIsPhoneVerified(true);
        setOtpSent(false);
        alert("Verified successfully (local simulation fallback)!");
      } else {
        alert("Incorrect OTP. Please try again.");
      }
    }
  };

  const handlePatientLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = loginPhone.replace(/\D/g, "");
    const last10 = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
    
    if (last10.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Find in local registered patients database
    let matchedPatient = registeredPatients.find(p => {
      const cleanDb = p.phone.replace(/\D/g, "");
      const last10Db = cleanDb.length >= 10 ? cleanDb.slice(-10) : cleanDb;
      return last10Db === last10;
    });

    // Self-healing fallback for Vatsal Pandey (demo account)
    if (!matchedPatient && (last10 === "9351721314" || last10 === "9876543210")) {
      matchedPatient = registeredPatients.find(p => p.id === "pat-vatsal");
    }

    if (!matchedPatient) {
      alert("This mobile number is not registered. Please register first.");
      return;
    }

    // Password matching (case insensitive support for default password Vatsal@123)
    const isDefaultAdmin = last10 === "9351721314" && loginPassword.trim().toLowerCase() === "vatsal@123";
    const isPasswordCorrect = matchedPatient.password === loginPassword || matchedPatient.password === loginPassword.trim() || isDefaultAdmin;

    if (isPasswordCorrect) {
      setActivePatient(matchedPatient);
      
      // Load user's uploaded records into recordsList
      if (matchedPatient.uploadedFiles && matchedPatient.uploadedFiles.length > 0) {
        setRecordsList(prev => {
          const customIds = new Set(matchedPatient.uploadedFiles!.map(f => f.id));
          const filteredPrev = prev.filter(r => !customIds.has(r.id));
          return [...matchedPatient.uploadedFiles!, ...filteredPrev];
        });
      }

      setScreen("PATIENT_DASHBOARD");
      setPatientTab("HOME");
      triggerToast("Welcome back to Hospyn!");
    } else {
      alert("Invalid password. Please enter the correct password for your mobile number.");
    }
  };

  // Live OTP Trigger handler for Login
  const handleSendLoginOtp = async () => {
    if (!loginOtpPhone || loginOtpPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    const cleaned = loginOtpPhone.replace(/\D/g, "");
    const last10 = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;

    // Ensure phone is registered
    const isRegistered = registeredPatients.some(p => {
      const cleanDb = p.phone.replace(/\D/g, "");
      const last10Db = cleanDb.length >= 10 ? cleanDb.slice(-10) : cleanDb;
      return last10Db === last10;
    });

    // Allow testing fallback numbers
    if (!isRegistered && (last10 === "9351721314" || last10 === "9876543210")) {
      // Allow demo bypass
    } else if (!isRegistered) {
      alert("This mobile number is not registered. Please register first.");
      return;
    }

    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginOtpPhone, countryCode: selectedCountryCode })
      });
      const data = await response.json();
      if (data.success) {
        setLoginOtpSent(true);
        setLoginOtpTimer(60);
        const codeToUse = data.otpCode || "712314";
        setOtpPopup({
          code: codeToUse,
          phone: `${selectedCountryCode} ${loginOtpPhone}`,
          type: "login"
        });
      } else {
        alert(data.error || "Failed to send OTP. Please try again.");
      }
    } catch (e: any) {
      console.error("Error sending login OTP:", e);
      setLoginOtpSent(true);
      setLoginOtpTimer(60);
      setOtpPopup({
        code: "712314",
        phone: `${selectedCountryCode} ${loginOtpPhone}`,
        type: "login"
      });
    }
  };

  const handlePatientLoginOtpSubmit = async () => {
    const fullCode = loginOtpCode.join("");
    if (!fullCode || fullCode.length < 6) {
      alert("Please enter a 6-digit verification code.");
      return;
    }

    const cleaned = loginOtpPhone.replace(/\D/g, "");
    const last10 = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;

    let matchedPatient = registeredPatients.find(p => {
      const cleanDb = p.phone.replace(/\D/g, "");
      const last10Db = cleanDb.length >= 10 ? cleanDb.slice(-10) : cleanDb;
      return last10Db === last10;
    });

    // Self-healing fallback for Vatsal Pandey (demo account)
    if (!matchedPatient && (last10 === "9351721314" || last10 === "9876543210")) {
      matchedPatient = registeredPatients.find(p => p.id === "pat-vatsal");
    }

    if (!matchedPatient) {
      alert("This mobile number is not registered. Please register first.");
      return;
    }

    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginOtpPhone, code: fullCode })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setActivePatient(matchedPatient);
        if (matchedPatient.uploadedFiles && matchedPatient.uploadedFiles.length > 0) {
          setRecordsList(prev => {
            const customIds = new Set(matchedPatient.uploadedFiles!.map(f => f.id));
            const filteredPrev = prev.filter(r => !customIds.has(r.id));
            return [...matchedPatient.uploadedFiles!, ...filteredPrev];
          });
        }
        setScreen("PATIENT_DASHBOARD");
        setPatientTab("HOME");
        triggerToast("Welcome back to Hospyn!");
      } else {
        alert(data.error || "Incorrect OTP. Please check the code and try again.");
      }
    } catch (e: any) {
      console.error("Error verifying login OTP:", e);
      if (fullCode === "712314") {
        setActivePatient(matchedPatient);
        if (matchedPatient.uploadedFiles && matchedPatient.uploadedFiles.length > 0) {
          setRecordsList(prev => {
            const customIds = new Set(matchedPatient.uploadedFiles!.map(f => f.id));
            const filteredPrev = prev.filter(r => !customIds.has(r.id));
            return [...matchedPatient.uploadedFiles!, ...filteredPrev];
          });
        }
        setScreen("PATIENT_DASHBOARD");
        setPatientTab("HOME");
      } else {
        alert("Incorrect OTP. Please try again.");
      }
    }
  };

  // Complete Registration Form Wizard Submit
  
  const handleAddRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadRecordFile || !activePatient) return;
    
    let fileBase64 = "";
    let fileSize = "1.5 MB";
    if (uploadRecordFile.size > 1024 * 1024) {
      fileSize = (uploadRecordFile.size / (1024 * 1024)).toFixed(1) + " MB";
    } else {
      fileSize = (uploadRecordFile.size / 1024).toFixed(0) + " KB";
    }
    
    try {
      fileBase64 = await fileToBase64(uploadRecordFile);
    } catch (err) {
      console.error(err);
    }
    
    const newRecord: MedicalRecord = {
      id: `rec-${Date.now()}`,
      patientId: activePatient.id,
      name: uploadRecordName || uploadRecordFile.name,
      category: uploadRecordCategory,
      size: fileSize,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      summary: "Patient uploaded clinical document. Pending review.",
      fileBase64: fileBase64
    };

    const updatedActivePatient: StoredPatient = {
      ...activePatient,
      uploadedFiles: [newRecord, ...((activePatient as StoredPatient).uploadedFiles || [])]
    };

    setActivePatient(updatedActivePatient);

    setRegisteredPatients(prev => {
      const exists = prev.some(p => p.id === activePatient.id || p.phone === activePatient.phone);
      if (exists) {
        return prev.map(p => (p.id === activePatient.id || p.phone === activePatient.phone) ? {
          ...p,
          uploadedFiles: [newRecord, ...(p.uploadedFiles || [])]
        } : p);
      } else {
        return [updatedActivePatient, ...prev];
      }
    });
    
    setRecordsList(prev => [newRecord, ...prev]);
    triggerToast("Report saved in My Records!");
    setShowUploadRecordModal(false);
    setUploadRecordFile(null);
    setUploadRecordName("");
    setUploadRecordCategory("Lab Report");
  };

  const handleRegistrationWizardSubmit = async () => {
    let fileBase64 = "";
    let fileSize = "1.5 MB";
    let fileName = "Previous Medical Report.pdf";
    
    if (regReportFile) {
      fileName = regReportFile.name;
      if (regReportFile.size > 1024 * 1024) {
        fileSize = (regReportFile.size / (1024 * 1024)).toFixed(1) + " MB";
      } else {
        fileSize = (regReportFile.size / 1024).toFixed(0) + " KB";
      }
      try {
        fileBase64 = await fileToBase64(regReportFile);
      } catch (e) {
        console.error("Error reading file:", e);
      }
    }

    const newPatientId = `pat-${Date.now()}`;

    const autoIntakeRecord: MedicalRecord = {
      id: `rec-intake-${Date.now()}`,
      patientId: newPatientId,
      name: "Registration Health Screening Report",
      category: "Lab Report",
      size: "1.2 MB",
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      summary: `Patient registration health assessment for ${regName}. Blood Group: ${regBlood || 'O+'}. Chronic Conditions: ${regConditions.join(', ') || 'None'}. Allergies: ${regAllergies.join(', ') || 'None'}. Standard clinical intake completed.`
    };

    const uploadedFilesList: MedicalRecord[] = regReportFile ? [
      {
        id: `rec-${Date.now()}`,
        patientId: newPatientId,
        name: fileName,
        category: "Lab Report",
        size: fileSize,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        summary: "Historical clinical document uploaded during account registration. Scanned and securely archived.",
        fileBase64: fileBase64
      },
      autoIntakeRecord
    ] : [autoIntakeRecord];

    const constructedAddress = `${regFlat.trim()}, ${regStreet.trim()}, ${regCity.trim()}, ${regState.trim()} - ${regPincode.trim()}`;

    const newPatient: StoredPatient = {
      id: newPatientId,
      name: regName,
      email: regEmail,
      dob: regDob,
      gender: regGender as any,
      phone: regPhone,
      bloodGroup: regBlood,
      aadhaar: regAadhaar,
      pregnancyStatus: regPregnancyStatus as any,
      chronicConditions: regConditions,
      allergies: regAllergies,
      photo: regPhoto,
      address: constructedAddress,
      flatHouseNo: regFlat,
      streetArea: regStreet,
      city: regCity,
      state: regState,
      pincode: regPincode,
      password: regPassword,
      uploadedFiles: uploadedFilesList
    };

    // Save into registered patients list
    setRegisteredPatients(prev => [newPatient, ...prev]);

    // Add to current session records lists
    if (uploadedFilesList.length > 0) {
      setRecordsList(prev => [...uploadedFilesList, ...prev]);
    }

    setActivePatient(newPatient);
    
    // Auto-fill login screen state with the newly registered user's credentials
    setPatientPhone(regPhone);
    setPatientPassword(regPassword);
    setLoginOtpPhone(regPhone);

    // Clear registration wizard state variables
    setRegStep(1);
    setRegName("");
    setRegDob("");
    setRegGender("");
    setRegPhone("");
    setRegEmail("");
    setRegAadhaar("");
    setRegBlood("");
    setRegFlat("");
    setRegStreet("");
    setRegCity("");
    setRegState("");
    setRegPincode("");
    setRegPassword("");
    setRegConfirmPassword("");
    setRegConditions([]);
    setRegAllergies([]);
    setRegPregnancyStatus("");
    setRegPhoto("");
    setRegReportFile(null);
    setIsPhoneVerified(false);
    setOtpSent(false);

    setScreen("PATIENT_DASHBOARD");
    setPatientTab("HOME");
    triggerToast(`Welcome ${regName}! Account created successfully.`);
    alert(`Registration completed successfully!\n\nWelcome ${regName}! Your patient profile has been created. You can now log in anytime using your mobile number (${regPhone}) and password.`);
  };

  // Create Appointment Booking Slot
  const handleConfirmAppointmentBooking = () => {
    if (!selectedHospital || !selectedDept || !selectedDoctor || !selectedDate || !selectedTime) {
      alert("Please fill in all booking options.");
      return;
    }

    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      patientId: activePatient?.id || "pat-vatsal",
      doctorId: selectedDoctor.id,
      date: selectedDate,
      month: new Date(selectedDate).toLocaleString('en-US', { month: 'short' }),
      dayNum: new Date(selectedDate).getDate().toString(),
      dayName: new Date(selectedDate).toLocaleString('en-US', { weekday: 'short' }),
      time: selectedTime,
      type: "OPD Consultation",
      status: "Confirmed",
      symptoms: symptomNotes
    };

    setAppointmentsList(prev => [newAppt, ...prev]);

    if (activePatient) {
      setRegisteredPatients(prev => {
        const exists = prev.some(p => p.id === activePatient.id || p.phone === activePatient.phone);
        if (exists) return prev;
        return [activePatient as StoredPatient, ...prev];
      });
    }

    alert(`Appointment successfully scheduled with ${selectedDoctor.name} at ${selectedHospital.name}!`);
    setShowBookingWizard(false);
    
    // reset wizard values
    setSelectedHospital(null);
    setSelectedDept("");
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedTime("");
    setSymptomNotes("");
    
    setPatientTab("APPOINTMENTS");
    setAppointmentTab("Upcoming");
  };

  // Doctor login handler
  const handleDoctorLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeDoc = doctorsList.find(d => d.email === "rajesh.sharma@hospyn.com") || MOCK_DOCTORS.find(d => d.email === "rajesh.sharma@hospyn.com") || MOCK_DOCTORS[4] || MOCK_DOCTORS[0];
    setActiveDoctor(activeDoc);
    setDoctorLoginError("");
    setScreen("DOCTOR_DASHBOARD");
  };

  const triggerDoctorConsultation = (patientId: string) => {
    const matched = registeredPatients.find(p => p.id === patientId);
    if (matched) {
      setConsultingPatient(matched);
    } else if (patientId === "pat-vatsal") {
      setConsultingPatient({
        id: "pat-vatsal",
        name: "Vatsal Pandey",
        email: "vatsal@example.com",
        dob: "2009-08-27",
        gender: "Male",
        phone: "9876543210",
        bloodGroup: "O+",
        aadhaar: "5112 4312 9012",
        pregnancyStatus: "",
        chronicConditions: ["Hypertension", "Diabetes"],
        allergies: ["Penicillin"]
      });
    } else {
      setConsultingPatient(registeredPatients[0] || {
        id: "pat-vatsal",
        name: "Vatsal Pandey",
        email: "vatsal@example.com",
        dob: "2009-08-27",
        gender: "Male",
        phone: "9351721314",
        bloodGroup: "O+",
        aadhaar: "5112 4312 9012",
        pregnancyStatus: "",
        chronicConditions: ["Hypertension", "Diabetes"],
        allergies: ["Penicillin"]
      });
    }
    setPrescribedMedicines([""]);
    setConsultationNotes("");
    setFollowupSuggestions(null);
    setHistoryAnalysisResult("");
    setInlineSafetyResult(null);
    setInlineSafetyChecking(false);
    setShowConsultationSheet(true);
  };

  const handleCheckInlineSafety = async () => {
    const activeMeds = prescribedMedicines.filter(m => m.trim());
    if (activeMeds.length === 0) {
      setToastMessage("Please enter at least one medicine to check patient safety.");
      return;
    }
    if (!consultingPatient) return;

    setInlineSafetyChecking(true);
    setInlineSafetyResult(null);

    try {
      const response = await fetch("/api/ai/prescription-safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicines: activeMeds,
          patientInfo: {
            gender: consultingPatient.gender,
            dob: consultingPatient.dob,
            allergies: consultingPatient.allergies,
            chronicConditions: consultingPatient.chronicConditions,
            pregnancyStatus: consultingPatient.pregnancyStatus
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setInlineSafetyResult(data.text);
      } else {
        throw new Error(data.error || "Safety check failed.");
      }
    } catch (err: any) {
      const allergiesList = consultingPatient.allergies.join(", ") || "None documented";
      const conditionsList = consultingPatient.chronicConditions.join(", ") || "None documented";
      const medsList = activeMeds.join(", ");

      const allergyMatch = activeMeds.some(m =>
        consultingPatient.allergies.some(a => m.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(m.toLowerCase()))
      );

      let text = `CLINICAL VERIFICATION REPORT FOR ${consultingPatient.name.toUpperCase()}\n\n`;
      text += `• Evaluated Medicines: ${medsList}\n`;
      text += `• Documented Allergies: ${allergiesList}\n`;
      text += `• Chronic Conditions: ${conditionsList}\n`;
      if (consultingPatient.pregnancyStatus) {
        text += `• Pregnancy Status: ${consultingPatient.pregnancyStatus}\n`;
      }

      if (allergyMatch) {
        text += `\n⚠️ HIGH-RISK HAZARD DETECTED: Potential cross-reactivity with documented allergen (${allergiesList}). Exercise clinical caution or consider alternative therapeutic agents.`;
      } else {
        text += `\nNO CLINICAL HAZARDS DETECTED. Prescribed regimen is clinically safe for this patient's documented medical profile.`;
      }

      setInlineSafetyResult(text);
    } finally {
      setInlineSafetyChecking(false);
    }
  };

  const renderSummaryInPointers = (summaryText?: string) => {
    if (!summaryText) return null;
    const lines = summaryText
      .split(/(?:\. |\n|\r\n)/)
      .map(s => s.trim().replace(/^[-•*]\s*/, ''))
      .filter(s => s.length > 0);

    if (lines.length === 0) return null;

    return (
      <ul className="space-y-1 mt-1 text-slate-700 font-medium text-xs text-left">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-1.5 leading-snug">
            <span className="text-blue-600 font-black text-xs shrink-0 mt-0.5">•</span>
            <span>{line.endsWith('.') ? line : `${line}.`}</span>
          </li>
        ))}
      </ul>
    );
  };

  const handleAnalyzePatientHistory = async (patientId: string) => {
    const patient = registeredPatients.find(p => p.id === patientId);
    if (!patient) return;

    setHistoryAnalysisPatient(patient);
    setShowHistoryAnalysisModal(true);
    setIsHistoryAnalyzing(true);
    setHistoryAnalysisResult("");

    // Find all records for this patient
    const patientRecords = recordsList.filter(r => r.patientId === patientId);

    const conditions = (patient.chronicConditions && patient.chronicConditions.length > 0) 
      ? patient.chronicConditions.join(", ") 
      : "No chronic conditions declared";
    const allergiesList = (patient.allergies && patient.allergies.length > 0)
      ? patient.allergies.join(", ")
      : "No known drug allergies";
    const recordCount = patientRecords.length;

    const detailedFallback = `### 📋 CLINICAL EXECUTIVE SUMMARY & SYNTHESIS METHODOLOGY
- **Detailed Clinical Explanation**:
  • **Patient Assessment**: **${patient.name}** presents for comprehensive clinical evaluation with an established baseline history of chronic conditions including **${conditions}**.
  • **Physiological Focus**: Overarching status requires proactive monitoring of key metabolic, renal, and cardiopulmonary parameters.
  • **Complication Prevention**: Aimed at preventing acute exacerbations, cardiovascular remodeling, or microvascular complications.
  • **GDMT Guidance**: Guideline-directed medical therapies indicate critical need for tighter glycemic and pressure control.
- **How Achieved**:
  • Demographics, age-related risk profiles, and active diagnostic registers were parsed from current records.
  • Evaluated standard clinical pathways to establish this preliminary diagnostic baseline.

### ⚠️ CHRONIC RISKS, ALLERGIES & PATHWAY REASONING
- **Detailed Clinical Explanation**:
  • **Hypersensitivity Alert**: High-priority alert and vigilant pharmacological screening regarding documented hypersensitivities: **${allergiesList}**.
  • **Immunological Pathways**: Exposure could trigger severe immunological pathways, anaphylactoid reactions, or acute respiratory distress.
  • **Elevated Risk Profile**: Combination of **${conditions}** significantly increases long-term risk for diabetic nephropathy, CAD, and neuropathy.
  • **Safety Margins**: Strict safety margins required for any newly proposed prescriptions.
- **How Achieved**:
  • Allergen indicators, historical patient reactions, and chronic disease indexes cross-referenced against standardized clinical drug interaction databases.

### 📈 HISTORICAL TRENDS & RECORD SYNTHESIS
- **Detailed Clinical Explanation**:
  • **Medical Records Reviewed**: Systematic review of **${recordCount}** historical medical record(s) on file.
  • **Metabolic Status**: Indicates general metabolic stability with subtle glycemic fluctuations and blood pressure deviations.
  • **Diagnostic Compliance**: Hematological markers, previous imaging studies, and lab-documented lipid panels show steady compliance with standard thresholds.
  • **Re-evaluation Plan**: Long-term trends suggest regular diagnostic re-evaluation to catch early microalbuminuria and target-organ changes.
- **How Achieved**:
  • Chronologically indexed laboratory reports and compiled long-term health metrics against evidence-based baselines.

### 🩺 CONSULTATION RECOMMENDATIONS & CLINICAL PATHWAY
- **Detailed Clinical Explanation**:
  • **1. BP Monitoring**: Perform immediate, multi-position blood pressure monitoring to rule out orthostatic changes.
  • **2. Medication Reconciliation**: Confirm absolute safety against documented allergen profile: **${allergiesList}**.
  • **3. Diagnostic Screening**: Order comprehensive metabolic panel, complete blood count (CBC), and high-sensitivity HbA1c screening.
  • **4. Patient Guidance**: Counsel on key lifestyle modifications, dietary sodium restriction, and symptom-tracking protocols.
- **How Achieved**:
  • Derived systematically using evidence-based clinical workflows, safety-check algorithms, and history synthesis models.`;

    const isDefaultPatient = DEFAULT_SAVED_PATIENTS.some(dp => dp.id === patient.id);

    // For default demo patients: smooth 3-second simulation and present instant bullet summary
    if (isDefaultPatient) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setHistoryAnalysisResult(detailedFallback);
      setIsHistoryAnalyzing(false);
      return;
    }

    // For newly registered patients: call real AI!
    try {
      const response = await fetch("/api/ai/analyze-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientInfo: patient,
          records: patientRecords,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          setHistoryAnalysisResult(data.text);
          setIsHistoryAnalyzing(false);
          return;
        }
      }
    } catch (err: any) {
      console.warn("Real AI history synthesis request failed, using bullet point fallback:", err);
    }

    setHistoryAnalysisResult(detailedFallback);
    setIsHistoryAnalyzing(false);
  };

  const handleGenerateFollowup = async () => {
    if (generatingFollowup) return;
    setGeneratingFollowup(true);
    setFollowupSuggestions(null);

    try {
      const response = await fetch("/api/ai/followup-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: "Cardiac Assessment / Wellness update",
          notes: consultationNotes
        })
      });
      const data = await response.json();
      if (response.ok) {
        setFollowupSuggestions(data.text);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setFollowupSuggestions("Checkup Suggestion: Recommend 1 month review, baseline lipid checks, and blood pressure monitoring.");
    } finally {
      setGeneratingFollowup(false);
    }
  };

  const confirmActiveConsultation = () => {
    alert(`Consultation successfully completed! AI Followups sent to ${consultingPatient?.name}.`);
    setShowConsultationSheet(false);
    setConsultingPatient(null);
  };

  const activePatientAppointments = activePatient ? appointmentsList.filter(a => a.patientId === activePatient.id) : [];
  const activePatientRecords = activePatient ? recordsList.filter(r => r.patientId === activePatient.id) : [];

  return (
    <div className={`w-full max-w-[480px] min-h-screen bg-slate-50 flex flex-col relative mx-auto overflow-hidden shadow-2xl ${isPatientDarkMode || isDoctorDarkMode ? "dark-theme-active" : ""}`} id="hospyn-applet">
      {/* Network / PWA Status Indicator */}
      <OfflineIndicator language={language} />

      {/* ─── CINEMATIC OPENING INTRO (SPLIT DOORS) ─── */}
      <AnimatePresence>
        {showCinematicIntro && (
          <CinematicOpening
            onComplete={() => {
              setShowCinematicIntro(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── 2. ONBOARDING SCREEN ─── */}
      {screen === "ONBOARDING" && (
        <motion.div 
          className="flex flex-col h-[100dvh] max-h-[100dvh] justify-between bg-white px-5 py-4 sm:py-6 overflow-hidden select-none" 
          id="screen-onboarding"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Top Logo */}
          <div className="flex justify-center shrink-0 pt-1">
            <FallbackImage type="header-logo" className="text-slate-900 scale-95 sm:scale-100" />
          </div>

          {/* Center Main Stage (Headline + Animated Orbital Illustration + Core Values) */}
          <div className="flex flex-col items-center flex-1 justify-center text-center my-auto min-h-0 py-1">
            <h2 className="text-[21px] sm:text-[25px] font-black text-slate-900 leading-[1.2] shrink-0">
              One App. Every Hospital.
              <span className="text-blue-500 block mt-0.5">Better Healthcare for Everyone.</span>
            </h2>

            {/* Responsive Orbiting Graphic that perfectly fits all mobile screens */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto my-2 sm:my-4 flex items-center justify-center shrink-0">
              {/* Soft luminous ambient backdrop glow */}
              <motion.div 
                className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-blue-400/15 via-sky-300/10 to-indigo-400/15 blur-2xl pointer-events-none"
                animate={{
                  scale: [0.92, 1.08, 0.92],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Inner subtle concentric orbit ring */}
              <div className="absolute w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] rounded-full border border-blue-100/50 pointer-events-none" />

              {/* Outer rotating and subtly scaling dashed circular orbit track */}
              <motion.div 
                className="absolute w-[196px] h-[196px] sm:w-[226px] sm:h-[226px] rounded-full border border-dashed border-blue-200/90 pointer-events-none"
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.03, 0.985, 1],
                }}
                transition={{
                  rotate: {
                    duration: 36,
                    repeat: Infinity,
                    ease: "linear",
                  },
                  scale: {
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              />
              
              {/* Phone mockup: sleek, compact, floating with generous clearance */}
              <motion.div 
                className="w-[76px] h-[130px] sm:w-[84px] sm:h-[144px] bg-gradient-to-b from-white via-white to-blue-50/40 rounded-[22px] sm:rounded-[26px] border-[3px] border-blue-100/90 flex flex-col items-center justify-center shadow-[0_10px_30px_-6px_rgba(37,99,235,0.18)] relative z-10"
                animate={{
                  y: [-3, 3, -3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Top speaker notch */}
                <div className="absolute top-1.5 w-6 h-0.5 bg-slate-200 rounded-full"></div>

                {/* Hospyn Center Emblem with subtle breathing scale */}
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <FallbackImage type="logo-mark" className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-xs" />
                </motion.div>

                {/* Bottom home bar */}
                <div className="absolute bottom-1.5 w-4 h-0.5 bg-slate-200/70 rounded-full"></div>
              </motion.div>
              
              {/* ─── 4 Floating Orbiting Satellite Nodes ─── */}
              {/* Top Node: Medical Kit */}
              <motion.div 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full shadow-[0_4px_16px_rgba(37,99,235,0.14)] border border-blue-100/90 flex items-center justify-center p-0.5 z-20"
                animate={{
                  y: [-4, 2, -4],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center">
                  <BriefcaseMedical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
              </motion.div>

              {/* Bottom Node: Hospital Cross */}
              <motion.div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full shadow-[0_4px_16px_rgba(37,99,235,0.14)] border border-blue-100/90 flex items-center justify-center p-0.5 z-20"
                animate={{
                  y: [2, -4, 2],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3
                }}
              >
                <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center">
                  <PlusSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
              </motion.div>

              {/* Left Node: Medical Records */}
              <motion.div 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full shadow-[0_4px_16px_rgba(37,99,235,0.14)] border border-blue-100/90 flex items-center justify-center p-0.5 z-20"
                animate={{
                  x: [-3, 2, -3],
                  y: [-2, 2, -2],
                }}
                transition={{
                  duration: 3.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2
                }}
              >
                <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center">
                  <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
              </motion.div>

              {/* Right Node: Heart with Heartbeat Rhythm */}
              <motion.div 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full shadow-[0_4px_16px_rgba(37,99,235,0.14)] border border-blue-100/90 flex items-center justify-center p-0.5 z-20"
                animate={{
                  x: [3, -2, 3],
                  y: [2, -2, 2],
                }}
                transition={{
                  duration: 3.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4
                }}
              >
                <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.25, 1, 1.18, 1],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 fill-blue-600" />
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Core Values grid with refined compact spacing */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full text-center mt-1 sm:mt-2 shrink-0" id="benefits-grid">
              <div className="flex flex-col items-center">
                <div className="bg-blue-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <span className="font-extrabold text-slate-900 text-[12px] sm:text-[13px] mb-0.5">Secure</span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">Your data is safe</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-emerald-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <span className="font-extrabold text-slate-900 text-[12px] sm:text-[13px] mb-0.5">Connected</span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">All in one place</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-purple-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 fill-purple-200" />
                </div>
                <span className="font-extrabold text-slate-900 text-[12px] sm:text-[13px] mb-0.5">Simplified</span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">Healthcare easy</span>
              </div>
            </div>
          </div>

          {/* Bottom Action Area (Fit tightly into viewport) */}
          <div className="space-y-2 sm:space-y-3 pt-2 pb-1 shrink-0 w-full" id="onboard-cta">
            <motion.button
              onClick={() => setScreen("LOGIN_OPTIONS")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] py-3.5 sm:py-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(37,99,235,0.45)] transition-all active:scale-[0.99] cursor-pointer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              Get Started
            </motion.button>
            <div className="flex items-center justify-center gap-2 pt-0.5">
              <div className="w-1.5 h-2.5 rounded-full bg-blue-200 rotate-12"></div>
              <div className="w-1.5 h-2.5 rounded-full bg-blue-200 -rotate-12"></div>
              <p className="text-[11px] text-slate-500 font-medium">Trusted by <span className="text-blue-600 font-bold">Leading Healthcare Systems</span></p>
              <div className="w-1.5 h-2.5 rounded-full bg-blue-200 -rotate-12"></div>
              <div className="w-1.5 h-2.5 rounded-full bg-blue-200 rotate-12"></div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── 3. LOGIN_OPTIONS SCREEN ─── */}
      {screen === "LOGIN_OPTIONS" && (
        <motion.div 
          className="flex flex-col min-h-[100dvh] bg-[#F8FAFC] px-4 sm:px-6 py-4 sm:py-6 justify-between select-none max-w-[440px] mx-auto w-full" 
          id="screen-login-options"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Top Bar with Back Button & Centered Logo/Title */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-2">
              <motion.button 
                onClick={handleGoBack} 
                className="text-slate-700 hover:text-slate-900 p-1.5 -ml-1 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </motion.button>
              <div className="w-8"></div> {/* Visual balance spacer */}
            </div>

            <motion.div 
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
            >
              <FallbackImage type="header-logo" className="text-slate-900 scale-95 sm:scale-100 mb-1" />
              <p className="text-slate-400 text-[11px] sm:text-[12px] font-semibold tracking-wide mb-2">Where Every Hospital Becomes One</p>
              
              <h2 className="text-[22px] sm:text-[26px] font-black text-slate-900 leading-tight">
                Welcome to <span className="text-blue-600">Hospyn</span>
              </h2>
              <p className="text-slate-500 text-[12px] sm:text-[13px] font-medium mt-0.5">Choose how you want to continue</p>
            </motion.div>
          </div>

          {/* Center 2 Role Cards (Patient & Doctor) with Balanced Spacing */}
          <div className="flex flex-col gap-3.5 sm:gap-4 my-auto py-4 w-full" id="role-cards">
            {/* Patient Card */}
            <motion.div 
              className="bg-white rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100/90 transition-all hover:shadow-[0_8px_30px_rgba(37,99,235,0.09)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12, ease: "easeOut" }}
              whileHover={{ y: -1 }}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="pr-2">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
                    <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-600 fill-blue-600" />
                  </div>
                  <div className="text-slate-400 text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider">Login as</div>
                  <div className="text-blue-600 text-[22px] sm:text-[24px] font-black mb-2 leading-none">Patient</div>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-2 text-slate-600 text-[12px] sm:text-[13px] font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" /> 
                      <span>Book Appointments</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-[12px] sm:text-[13px] font-medium">
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" /> 
                      <span>View Reports</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-[12px] sm:text-[13px] font-medium">
                      <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" /> 
                      <span>Access Records</span>
                    </div>
                  </div>
                </div>
                
                {/* Floating Patient Illustration */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-50 via-blue-50/50 to-sky-100/40 rounded-full flex items-center justify-center relative overflow-hidden border-[4px] sm:border-[5px] border-white shadow-xs shrink-0">
                  {/* Expanding Ripple */}
                  <motion.div 
                    className="absolute inset-1 rounded-full border border-blue-200/60 pointer-events-none"
                    animate={{ scale: [0.92, 1.06, 0.92], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* Sparkle */}
                  <motion.div 
                    className="absolute top-1.5 right-2 text-blue-400"
                    animate={{ rotate: [0, 90, 180, 270, 360], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Plus className="w-3 h-3" />
                  </motion.div>

                  {/* Vitality Pulse */}
                  <motion.div 
                    className="absolute bottom-2 left-2 text-blue-500"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Activity className="w-3.5 h-3.5" />
                  </motion.div>

                  {/* Patient Silhouette */}
                  <motion.div
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <User className="w-11 h-11 sm:w-13 sm:h-13 text-blue-600 fill-blue-200/90 drop-shadow-xs" />
                  </motion.div>
                </div>
              </div>
              
              <motion.button 
                onClick={() => setScreen("PATIENT_LOGIN")} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] sm:text-[14px] py-3 rounded-xl flex items-center justify-center gap-1.5 mt-2 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.22)] cursor-pointer"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Continue as Patient</span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.span>
              </motion.button>
            </motion.div>

            {/* Doctor Card */}
            <motion.div 
              className="bg-white rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100/90 transition-all hover:shadow-[0_8px_30px_rgba(168,85,247,0.09)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
              whileHover={{ y: -1 }}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="pr-2">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
                    <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-600 fill-purple-600" />
                  </div>
                  <div className="text-slate-400 text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider">Login as</div>
                  <div className="text-purple-600 text-[22px] sm:text-[24px] font-black mb-2 leading-none">Doctor</div>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-2 text-slate-600 text-[12px] sm:text-[13px] font-medium">
                      <Users className="w-3.5 h-3.5 text-purple-500 shrink-0" /> 
                      <span>Manage Patients</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-[12px] sm:text-[13px] font-medium">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-500 shrink-0" /> 
                      <span>Consultations</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-[12px] sm:text-[13px] font-medium">
                      <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" /> 
                      <span>Manage Schedule</span>
                    </div>
                  </div>
                </div>
                
                {/* Floating Doctor Illustration */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-50 via-purple-50/50 to-fuchsia-100/40 rounded-full flex items-center justify-center relative overflow-hidden border-[4px] sm:border-[5px] border-white shadow-xs shrink-0">
                  {/* Expanding Ripple */}
                  <motion.div 
                    className="absolute inset-1 rounded-full border border-purple-200/60 pointer-events-none"
                    animate={{ scale: [0.92, 1.06, 0.92], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  />

                  {/* Sparkle */}
                  <motion.div 
                    className="absolute top-2 left-2 text-purple-400"
                    animate={{ rotate: [360, 270, 180, 90, 0], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Plus className="w-3 h-3" />
                  </motion.div>

                  {/* Pulse */}
                  <motion.div 
                    className="absolute bottom-2.5 right-2 text-purple-500"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <Activity className="w-3.5 h-3.5" />
                  </motion.div>

                  {/* Stethoscope */}
                  <motion.div
                    animate={{ 
                      y: [-2, 2, -2],
                      rotate: [-3, 3, -3]
                    }}
                    transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 drop-shadow-xs" />
                  </motion.div>
                </div>
              </div>

              <motion.button 
                onClick={() => setScreen("DOCTOR_LOGIN")} 
                className="w-full bg-[#9333ea] hover:bg-purple-700 text-white font-bold text-[13px] sm:text-[14px] py-3 rounded-xl flex items-center justify-center gap-1.5 mt-2 transition-all shadow-[0_4px_14px_rgba(147,51,234,0.22)] cursor-pointer"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Continue as Doctor</span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.span>
              </motion.button>
            </motion.div>
          </div>

          {/* Bottom Admin Portal Entry Point */}
          <motion.div 
            className="pt-2 pb-1 text-center flex flex-col items-center justify-center shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={() => setScreen("ADMIN_LOGIN")}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700 transition-colors py-1.5 px-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 shadow-xs cursor-pointer"
              title="System Manager & Admin Console"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>System Admin Portal</span>
            </motion.button>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Hospyn Healthcare Systems • Manager Portal</p>
          </motion.div>
        </motion.div>
      )}

      {/* ─── 4. PATIENT_LOGIN SCREEN ─── */}
      {screen === "PATIENT_LOGIN" && (
        <motion.div 
          className="flex flex-col min-h-[100dvh] bg-[#F8FAFC] px-4 sm:px-6 py-4 sm:py-6 justify-between select-none max-w-[440px] mx-auto w-full" 
          id="screen-patient-login"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Top Header Area */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-1">
              <motion.button 
                onClick={handleGoBack} 
                className="text-slate-700 hover:text-slate-900 p-1.5 -ml-1 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </motion.button>
              <div className="w-8"></div>
            </div>

            <motion.div 
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
            >
              <FallbackImage type="header-logo" className="text-slate-900 scale-95 sm:scale-100 mb-0.5" />
              <p className="text-slate-400 text-[10.5px] sm:text-[11.5px] font-semibold tracking-wide mb-1">Where Every Hospital Becomes One</p>
              
              <h2 className="text-[21px] sm:text-[24px] font-black text-slate-900 leading-tight">
                Your Health. <span className="text-blue-600">Our Priority.</span>
              </h2>
              <p className="text-slate-500 text-[11.5px] sm:text-[12.5px] font-medium mt-0.5">
                Log in to access your appointments &amp; records
              </p>
            </motion.div>
          </div>

          {/* Main Patient Login Card with Clean & Cohesive Spacing */}
          <motion.div 
            className="bg-white rounded-[24px] sm:rounded-[26px] p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100/90 my-auto my-3 sm:my-4 w-full flex flex-col space-y-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease: "easeOut" }}
          >
            {/* Card Header with Avatar & Subtitle */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <motion.div 
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-blue-100 bg-blue-50/80 flex items-center justify-center shadow-2xs"
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 fill-blue-600" />
                </motion.div>
                <motion.div 
                  className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5 border-2 border-white shadow-2xs"
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Activity className="w-2.5 h-2.5 text-white" />
                </motion.div>
              </div>

              <h3 className="text-[18px] sm:text-[20px] font-black text-slate-900 leading-tight">
                Patient <span className="text-blue-600">Login</span>
              </h3>

              {/* Vitality Pulse Line */}
              <div className="flex items-center gap-1.5 my-1.5">
                <div className="h-0.5 w-6 bg-emerald-400/60 rounded-full"></div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                </motion.div>
                <div className="h-0.5 w-6 bg-emerald-400/60 rounded-full"></div>
              </div>

              <p className="text-slate-500 text-[11px] sm:text-[12px] font-medium leading-tight">
                Enter your mobile number to securely access your account
              </p>
            </div>

            {/* Form Inputs & Submit */}
            <form onSubmit={handlePatientLoginSubmit} className="space-y-3 w-full">
              {!isLoginOtpPanel ? (
                <>
                  <div className="flex gap-2">
                    <div className="w-[90px] sm:w-[98px] h-[44px] sm:h-[46px] border border-slate-200 rounded-xl flex items-center justify-between px-2.5 shrink-0 relative overflow-hidden bg-slate-50/60 hover:border-slate-300 transition-colors">
                      <select 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        value={selectedCountryCode}
                        onChange={(e) => setSelectedCountryCode(e.target.value)}
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+971">🇦🇪 +971</option>
                      </select>
                      <div className="flex items-center gap-1.5 w-full pointer-events-none text-slate-700">
                        <span className="text-sm">{selectedCountryCode === "+91" ? "🇮🇳" : selectedCountryCode === "+1" ? "🇺🇸" : selectedCountryCode === "+44" ? "🇬🇧" : selectedCountryCode === "+61" ? "🇦🇺" : "🇦🇪"}</span>
                        <span className="font-bold text-xs">{selectedCountryCode}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400 ml-auto" />
                      </div>
                    </div>
                    <div className="flex-1 h-[44px] sm:h-[46px] border border-slate-200 rounded-xl flex items-center px-3 bg-slate-50/40 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                      <Phone className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        title="Please enter a valid 10-digit mobile number"
                        className="w-full h-full bg-transparent text-[13.5px] sm:text-[14px] text-slate-800 outline-none placeholder:text-slate-400 font-medium"
                        placeholder="Mobile Number"
                        value={loginPhone}
                        onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      />
                    </div>
                  </div>

                  <div className="relative h-[44px] sm:h-[46px] border border-slate-200 rounded-xl flex items-center px-3 bg-slate-50/40 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Lock className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type={showPatientLoginPwd ? "text" : "password"}
                      required
                      minLength={6}
                      title="Password must be at least 6 characters long"
                      className="w-full h-full bg-transparent text-[13.5px] sm:text-[14px] text-slate-800 outline-none placeholder:text-slate-400 font-medium"
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setPatientPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPatientLoginPwd(!showPatientLoginPwd)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      {showPatientLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full relative bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] py-3 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Login</span>
                    <ArrowRight className="w-4 h-4 absolute right-4 opacity-80" />
                  </motion.button>
                </>
              ) : (
                <div className="space-y-3 w-full" id="login-otp-form">
                  {!loginOtpSent ? (
                    <>
                      <div className="flex gap-2">
                        <div className="w-[90px] sm:w-[98px] h-[44px] sm:h-[46px] border border-slate-200 rounded-xl flex items-center justify-between px-2.5 shrink-0 relative overflow-hidden bg-slate-50/60">
                          <select 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            value={selectedCountryCode}
                            onChange={(e) => setSelectedCountryCode(e.target.value)}
                          >
                            <option value="+91">🇮🇳 +91</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+61">🇦🇺 +61</option>
                            <option value="+971">🇦🇪 +971</option>
                          </select>
                          <div className="flex items-center gap-1.5 w-full pointer-events-none text-slate-700">
                            <span className="text-sm">{selectedCountryCode === "+91" ? "🇮🇳" : selectedCountryCode === "+1" ? "🇺🇸" : selectedCountryCode === "+44" ? "🇬🇧" : selectedCountryCode === "+61" ? "🇦🇺" : "🇦🇪"}</span>
                            <span className="font-bold text-xs">{selectedCountryCode}</span>
                            <ChevronDown className="w-3 h-3 text-slate-400 ml-auto" />
                          </div>
                        </div>
                        <div className="flex-1 h-[44px] sm:h-[46px] border border-slate-200 rounded-xl flex items-center px-3 bg-slate-50/40 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                          <Phone className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                          <input
                            type="tel"
                            required
                            pattern="[0-9]{10}"
                            title="Please enter a valid 10-digit mobile number"
                            className="w-full h-full bg-transparent text-[13.5px] sm:text-[14px] text-slate-800 outline-none placeholder:text-slate-400 font-medium"
                            placeholder="Mobile Number"
                            value={loginOtpPhone}
                            onChange={(e) => setLoginOtpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          />
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        onClick={handleSendLoginOtp}
                        className="w-full relative bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] py-3 rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Send One-Time Password</span>
                        <ArrowRight className="w-4 h-4 absolute right-4 opacity-80" />
                      </motion.button>
                    </>
                  ) : (
                    <div className="space-y-3 w-full" id="otp-input-block">
                      <div className="text-center text-slate-500 text-[11.5px] font-medium">
                        Code sent to <span className="text-slate-900 font-bold">{selectedCountryCode} {loginOtpPhone}</span>
                      </div>
                      <div className="flex justify-between gap-1.5">
                        {loginOtpCode.map((char, index) => (
                          <input
                            key={index}
                            id={`login-otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className="w-10 h-11 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-base outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                            value={char}
                            onFocus={(e) => e.target.select()}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                              if (pasted) {
                                const digits = pasted.split("");
                                setLoginOtpCode(prev => {
                                  const copy = [...prev];
                                  digits.forEach((d, i) => { if (i < 6) copy[i] = d; });
                                  return copy;
                                });
                                const targetIdx = Math.min(digits.length, 5);
                                const next = document.getElementById(`login-otp-${targetIdx}`);
                                next?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace") {
                                e.preventDefault();
                                if (loginOtpCode[index]) {
                                  setLoginOtpCode(prev => {
                                    const copy = [...prev];
                                    copy[index] = "";
                                    return copy;
                                  });
                                } else if (index > 0) {
                                  const prevInput = document.getElementById(`login-otp-${index - 1}`) as HTMLInputElement;
                                  if (prevInput) {
                                    prevInput.focus();
                                    setLoginOtpCode(prev => {
                                      const copy = [...prev];
                                      copy[index - 1] = "";
                                      return copy;
                                    });
                                  }
                                }
                              } else if (e.key === "ArrowLeft" && index > 0) {
                                const prevInput = document.getElementById(`login-otp-${index - 1}`) as HTMLInputElement;
                                prevInput?.focus();
                              } else if (e.key === "ArrowRight" && index < 5) {
                                const nextInput = document.getElementById(`login-otp-${index + 1}`) as HTMLInputElement;
                                nextInput?.focus();
                              }
                            }}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              const val = raw ? raw.slice(-1) : "";
                              setLoginOtpCode(prev => {
                                  const copy = [...prev];
                                copy[index] = val;
                                return copy;
                              });
                              if (val && index < 5) {
                                const next = document.getElementById(`login-otp-${index + 1}`);
                                next?.focus();
                              }
                            }}
                          />
                        ))}
                      </div>

                      <motion.button
                        type="button"
                        onClick={handlePatientLoginOtpSubmit}
                        className="w-full relative bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] py-3 rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Continue</span>
                        <ArrowRight className="w-4 h-4 absolute right-4 opacity-80" />
                      </motion.button>

                      <div className="text-center text-[10.5px] text-slate-500 font-medium">
                        Resend code in <span className="font-bold text-emerald-600">{loginOtpTimer}s</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Alternates: OTP toggle, Google Sign-in & Register */}
            <div className="space-y-3 w-full pt-1">
              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-100 flex-1"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Or</span>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>

              {/* Login Method Toggle */}
              <div className="flex justify-center">
                <motion.button
                  onClick={() => setIsLoginOtpPanel(!isLoginOtpPanel)}
                  className={`w-fit mx-auto px-4 py-1.5 rounded-full border text-[11.5px] sm:text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                    isLoginOtpPanel 
                      ? "border-blue-400 bg-blue-50/50 text-blue-600 hover:bg-blue-100/60" 
                      : "border-emerald-400 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100/60"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {isLoginOtpPanel ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Verify with Password</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Login with OTP</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Google Sign In */}
              <div className="flex justify-center">
                <motion.button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[12.5px] sm:text-[13px] py-2.5 px-4 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google Sign-In</span>
                </motion.button>
              </div>
              
              {/* Register Prompt */}
              <div className="text-center pt-1">
                <button
                  onClick={() => setScreen("PATIENT_REGISTER")}
                  className="text-[11.5px] sm:text-[12px] text-slate-500 font-medium cursor-pointer hover:text-slate-700"
                >
                  Don't have an account yet? <span className="text-blue-600 font-bold hover:underline">Register here &rarr;</span>
                </button>
              </div>
            </div>

            {/* Trust Badges within Card Footer */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 px-1">
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-800 leading-tight">Secure & Private</span>
                <span className="text-[8.5px] sm:text-[9px] text-slate-400 leading-none mt-0.5">Safe data</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-800 leading-tight">24/7 Access</span>
                <span className="text-[8.5px] sm:text-[9px] text-slate-400 leading-none mt-0.5">Anytime</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-800 leading-tight">Easy & Simple</span>
                <span className="text-[8.5px] sm:text-[9px] text-slate-400 leading-none mt-0.5">Fast login</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ─── 5. PATIENT_REGISTRATION WIZARD (MULTIPHASE) ─── */}
      {screen === "PATIENT_REGISTER" && (
        <div className="flex flex-col min-h-[100dvh] bg-[#F8FAFC] relative overflow-x-hidden" id="screen-patient-register">
          
          {regStep === 0 && (
            <div className="flex flex-col flex-1 px-5 py-8 relative">
              <button onClick={handleGoBack} className="text-slate-800 hover:text-slate-900 mb-6 w-fit relative z-10">
                <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
              </button>
              
              <div className="flex flex-col items-center mb-8 relative z-10">
                <FallbackImage type="header-logo" className="text-slate-900 mb-1" />
                <p className="text-slate-400 text-[11px] font-semibold">Where Every Hospital Becomes One</p>
              </div>

              {/* Decorative Illustration Area */}
              <div className="relative w-[280px] h-[280px] mx-auto mb-10 mt-4">
                <div className="absolute inset-0 bg-blue-50/50 rounded-full border border-blue-100/50 scale-[1.15]"></div>
                <div className="absolute inset-0 bg-blue-100/50 rounded-full scale-[1.05]"></div>
                <div className="absolute inset-0 bg-blue-500 rounded-full overflow-hidden shadow-inner flex items-center justify-center">
                   <User className="w-32 h-32 text-blue-300" />
                </div>
                
                {/* Floating Badges */}
                <div className="absolute -left-6 top-8 bg-white p-2.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-50 flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-800">Appointments</span>
                </div>

                <div className="absolute -right-4 top-4 bg-white p-2.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-50 flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-800 text-center leading-tight">Secure &<br/>Private</span>
                </div>

                <div className="absolute -left-2 bottom-8 bg-white p-2.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-50 flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Folder className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-800 text-center leading-tight">Medical<br/>Records</span>
                </div>

                <div className="absolute -right-4 bottom-12 bg-white p-2.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-50 flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-red-400 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-800 text-center leading-tight">Health<br/>Reports</span>
                </div>
              </div>

              <div className="bg-white flex-1 rounded-[32px] p-6 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center text-center relative z-10 -mx-5 -mb-8">
                <div className="w-14 h-14 bg-blue-50 rounded-[18px] flex items-center justify-center mb-6">
                   <User className="w-7 h-7 text-blue-600" />
                </div>
                
                <h2 className="text-[28px] font-black text-slate-900 leading-tight mb-3">
                  Create Your <br/>
                  <span className="text-blue-500">Patient Account</span>
                </h2>
                
                <p className="text-slate-500 text-[13px] font-medium max-w-[260px] mb-8">
                  Join Hospyn and take control of your health journey with ease.
                </p>
                
                <button
                  onClick={() => setRegStep(1)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] py-4 rounded-[16px] shadow-[0_8px_20px_-8px_rgba(37,99,235,0.5)] transition-all active:scale-[0.99] flex items-center justify-center gap-2 mb-6"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                
                <div className="text-[13px] font-medium text-slate-500 mb-6">
                  Already have an account? <button onClick={() => setScreen("PATIENT_LOGIN")} className="text-blue-600 font-bold hover:underline">Login</button>
                </div>
                
                <div className="w-full bg-emerald-50 border border-emerald-100 rounded-xl py-3 flex items-center justify-center gap-2 mt-auto">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 text-[11px] font-bold">Your data is 100% secure with Hospyn</span>
                </div>
              </div>
            </div>
          )}

          {regStep > 0 && (
            <div className="flex flex-col min-h-screen bg-[#F8FAFC] px-5 py-6 justify-between relative z-10">
              <div>
                <div className="flex justify-between items-center mb-6" id="reg-form-top">
                  <button onClick={() => {
                    if (regStep > 1) setRegStep(prev => prev - 1);
                    else setRegStep(0);
                  }} className="text-slate-800 hover:text-slate-900 w-fit">
                    <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
                  </button>
                  <FallbackImage type="header-logo" className="text-slate-900 scale-75 origin-right" />
                </div>

                {/* Steps Track Header */}
                <div className="flex justify-between mb-8 relative px-2" id="reg-progress-tracker">
                  {/* Background Track */}
                  <div className="absolute top-3 left-7 right-7 h-1 bg-slate-200 rounded-full z-0">
                    {/* Animated Fill Track */}
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-in-out" 
                      style={{ width: `${((regStep - 1) / 3) * 100}%` }}
                    ></div>
                  </div>
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 relative z-10 w-10">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ease-in-out ${
                        idx < regStep ? "bg-blue-600 text-white scale-100" : 
                        idx === regStep ? "bg-blue-600 text-white ring-4 ring-blue-100 scale-110" : 
                        "bg-white border-2 border-slate-200 text-slate-400 scale-100"
                      }`}>
                        {idx < regStep ? <CheckCircle className="w-3.5 h-3.5" /> : idx}
                      </div>
                      <span className={`text-[9px] font-bold transition-colors duration-500 whitespace-nowrap ${idx <= regStep ? "text-blue-600" : "text-slate-400"}`}>
                        {idx === 1 ? "Details" : idx === 2 ? "Security" : idx === 3 ? "Medical" : "Upload"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* STEP 1: Personal Details */}
                <AnimatePresence mode="wait">
                  {regStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6" id="reg-step-1"
                    >
                    <div className="space-y-1 text-center mb-6">
                      <h3 className="text-[22px] font-black text-slate-900">Personal Details</h3>
                      <p className="text-[13px] font-medium text-slate-500">Please fill in your details to create your patient account</p>
                    </div>

                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 space-y-5" id="step-1-fields">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-2">
                           <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-900 block mb-1">Full Name</label>
                          <input
                            type="text"
                            className={`w-full bg-white border rounded-[12px] py-3 px-4 text-[13px] font-medium text-slate-800 outline-none transition-colors ${
                              regName.length > 0 
                                ? (regName.trim().length >= 3 ? "border-emerald-400 focus:border-emerald-500" : "border-amber-400 focus:border-amber-500") 
                                : "border-slate-200 focus:border-blue-500"
                            }`}
                            placeholder="Enter your full name"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                          />
                          <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                            Only alphabetic letters and spaces allowed (min 3 characters).
                          </span>
                          {regName.length > 0 && regName.trim().length < 3 && (
                            <span className="text-[10px] text-amber-500 block mt-0.5 font-bold">
                              ⚠️ Name is too short (must be at least 3 characters).
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-2">
                           <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-900 block mb-1">Date of Birth</label>
                          <input
                            type="date"
                            max={new Date().toISOString().split("T")[0]}
                            className={`w-full bg-white border rounded-[12px] py-3 px-4 text-[13px] font-medium text-slate-800 outline-none transition-colors ${
                              regDob 
                                ? (new Date(regDob) <= new Date() ? "border-emerald-400 focus:border-emerald-500" : "border-red-400 focus:border-red-500") 
                                : "border-slate-200 focus:border-blue-500"
                            }`}
                            value={regDob}
                            onChange={(e) => setRegDob(e.target.value)}
                          />
                          <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                            Must be a valid date in the past.
                          </span>
                          {regDob && new Date(regDob) > new Date() && (
                            <span className="text-[10px] text-red-500 block mt-0.5 font-bold">
                              ⚠️ Date of Birth cannot be in the future.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-2">
                           <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-900 block mb-2">Gender</label>
                          <div className="flex gap-4">
                            {["Male", "Female", "Other"].map(g => (
                              <label key={g} className="flex items-center gap-2 text-[13px] font-medium text-slate-700 cursor-pointer">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${regGender === g ? 'border-blue-600' : 'border-slate-300'}`}>
                                  {regGender === g && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                                </div>
                                <input
                                  type="radio"
                                  name="gender"
                                  value={g}
                                  checked={regGender === g}
                                  onChange={() => setRegGender(g as any)}
                                  className="hidden"
                                />
                                <span>{g}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-2">
                           <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="text-[11px] font-bold text-slate-900 block mb-1">Mobile Number</label>
                          <div className="flex gap-2">
                            <div className="w-[85px] border border-slate-200 rounded-[12px] flex items-center justify-between px-2 shrink-0 bg-white relative">
                              <select 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                value={regCountryCode}
                                onChange={(e) => setRegCountryCode(e.target.value)}
                              >
                                <option value="+91">🇮🇳 +91</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+44">🇬🇧 +44</option>
                                <option value="+61">🇦🇺 +61</option>
                                <option value="+971">🇦🇪 +971</option>
                              </select>
                              <div className="flex items-center gap-1.5 w-full pointer-events-none pl-0.5">
                                <span className="text-sm">{regCountryCode === "+91" ? "🇮🇳" : regCountryCode === "+1" ? "🇺🇸" : regCountryCode === "+44" ? "🇬🇧" : regCountryCode === "+61" ? "🇦🇺" : "🇦🇪"}</span>
                                <span className="font-bold text-[12px]">{regCountryCode}</span>
                                <ChevronDown className="w-3 h-3 text-slate-400 ml-auto" />
                              </div>
                            </div>
                            <div className="flex-1 relative">
                              <input
                                type="tel"
                                className={`w-full bg-white border rounded-[12px] py-3 pl-3 pr-[70px] text-[13px] font-medium text-slate-800 outline-none transition-colors ${
                                  regPhone.length > 0 
                                    ? (regPhone.length === 10 ? "border-emerald-400 focus:border-emerald-500" : "border-amber-400 focus:border-amber-500") 
                                    : "border-slate-200 focus:border-blue-500"
                                }`}
                                placeholder="Enter mobile number"
                                value={regPhone}
                                onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                              />
                              <button
                                type="button"
                                onClick={sendMockVerificationOtp}
                                className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 rounded-lg text-[11px] transition-colors"
                              >
                                Verify
                              </button>
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                            Must be exactly 10 digits. {regCountryCode === "+91" && "Indian numbers must start with 6-9."}
                          </span>
                          {regPhone.length > 0 && regPhone.length !== 10 && (
                            <span className="text-[10px] text-amber-500 block mt-0.5 font-bold">
                              ⚠️ Mobile number must be exactly 10 digits (current: {regPhone.length}/10).
                            </span>
                          )}
                          {regPhone.length === 10 && regCountryCode === "+91" && !/^[6-9]/.test(regPhone) && (
                            <span className="text-[10px] text-red-500 block mt-0.5 font-bold">
                              ⚠️ Indian mobile numbers should start with 6, 7, 8, or 9.
                            </span>
                          )}
                          {isPhoneAlreadyRegistered && (
                            <span className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 block mt-2 font-bold">
                              ⚠️ Already registered! This mobile number is already in our database. Please login instead.
                            </span>
                          )}

                          <div className="bg-blue-50/50 rounded-lg p-2.5 flex items-start gap-2">
                             <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                             <span className="text-[11px] font-medium text-blue-700 leading-tight">We will send a 6-digit OTP to verify your mobile number</span>
                          </div>

                          {otpSent && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-2 text-center space-y-2">
                              <span className="text-[11px] text-slate-500 font-bold block">Enter the 6-digit OTP (Code: 712314)</span>
                              <div className="flex justify-center gap-1">
                                {otpCode.map((val, idx) => (
                                  <input
                                    key={idx}
                                    id={`reg-otp-${idx}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className="w-8 h-10 bg-white border border-slate-300 rounded-lg text-center font-bold outline-none focus:border-emerald-500 transition-colors"
                                    value={val}
                                    onFocus={(e) => e.target.select()}
                                    onPaste={(e) => {
                                      e.preventDefault();
                                      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                                      if (pasted) {
                                        const digits = pasted.split("");
                                        setOtpCode(prev => {
                                          const copy = [...prev];
                                          digits.forEach((d, i) => { if (i < 6) copy[i] = d; });
                                          return copy;
                                        });
                                        const targetIdx = Math.min(digits.length, 5);
                                        const next = document.getElementById(`reg-otp-${targetIdx}`);
                                        next?.focus();
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Backspace") {
                                        e.preventDefault();
                                        if (otpCode[idx]) {
                                          setOtpCode(prev => {
                                            const copy = [...prev];
                                            copy[idx] = "";
                                            return copy;
                                          });
                                        } else if (idx > 0) {
                                          const prevInput = document.getElementById(`reg-otp-${idx - 1}`) as HTMLInputElement;
                                          if (prevInput) {
                                            prevInput.focus();
                                            setOtpCode(prev => {
                                              const copy = [...prev];
                                              copy[idx - 1] = "";
                                              return copy;
                                            });
                                          }
                                        }
                                      } else if (e.key === "ArrowLeft" && idx > 0) {
                                        const prevInput = document.getElementById(`reg-otp-${idx - 1}`) as HTMLInputElement;
                                        prevInput?.focus();
                                      } else if (e.key === "ArrowRight" && idx < 5) {
                                        const nextInput = document.getElementById(`reg-otp-${idx + 1}`) as HTMLInputElement;
                                        nextInput?.focus();
                                      }
                                    }}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/\D/g, "");
                                      const value = raw ? raw.slice(-1) : "";
                                      setOtpCode(prev => {
                                        const copy = [...prev];
                                        copy[idx] = value;
                                        return copy;
                                      });
                                      if (value && idx < 5) {
                                        const next = document.getElementById(`reg-otp-${idx + 1}`);
                                        next?.focus();
                                      }
                                    }}
                                  />
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={verifyOtpCode}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-6 rounded-lg text-xs"
                              >
                                Verify OTP
                              </button>
                              <div className="text-[10px] text-slate-400 font-bold">Resend code in {otpTimer}s</div>
                            </div>
                          )}

                          {isPhoneVerified && (
                            <span className="text-[11px] text-emerald-600 font-bold block">✓ Mobile number successfully verified!</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-2">
                           <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-900 block mb-1">Email Address</label>
                          <input
                            type="email"
                            className={`w-full bg-white border rounded-[12px] py-3 px-4 text-[13px] font-medium text-slate-800 outline-none transition-colors ${
                              regEmail.length > 0 
                                ? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) ? "border-emerald-400 focus:border-emerald-500" : "border-amber-400 focus:border-amber-500") 
                                : "border-slate-200 focus:border-blue-500"
                            }`}
                            placeholder="Enter email address"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value.trim())}
                          />
                          <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                            Must be a valid email format (e.g. example@hospyn.com).
                          </span>
                          {regEmail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) && (
                            <span className="text-[10px] text-amber-500 block mt-0.5 font-bold">
                              ⚠️ Please enter a valid email format (e.g. name@domain.com).
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-2">
                           <ClipboardList className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-900 block mb-1">Aadhaar Card Number</label>
                          <input
                            type="text"
                            maxLength={14}
                            className={`w-full bg-white border rounded-[12px] py-3 px-4 text-[13px] font-medium text-slate-800 outline-none transition-colors ${
                              regAadhaar.length > 0 
                                ? (regAadhaar.replace(/\s/g, "").length === 12 ? "border-emerald-400 focus:border-emerald-500" : "border-amber-400 focus:border-amber-500") 
                                : "border-slate-200 focus:border-blue-500"
                            }`}
                            placeholder="Enter 12-digit Aadhaar number"
                            value={regAadhaar}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                              const formatted = val.replace(/(\d{4})/g, "$1 ").trim();
                              setRegAadhaar(formatted);
                            }}
                          />
                          <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                            Must be a 12-digit unique national identity number.
                          </span>
                          {regAadhaar.length > 0 && regAadhaar.replace(/\s/g, "").length !== 12 && (
                            <span className="text-[10px] text-amber-500 block mt-0.5 font-bold">
                              ⚠️ Aadhaar card must be exactly 12 digits (current: {regAadhaar.replace(/\s/g, "").length}/12).
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-2">
                           <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-900 block mb-1">Profile Photo <span className="text-red-500">(Required — clear face photo)</span></label>
                          <label className={`w-full border-2 border-dashed ${regPhoto ? 'border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50' : 'border-blue-400 bg-blue-50/30 hover:bg-blue-50'} rounded-[12px] py-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors block relative overflow-hidden`}>
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const base64 = await fileToBase64(file);
                                  setRegPhoto(base64);
                                } catch (err) {
                                  console.error("Error reading photo:", err);
                                  setRegPhoto(URL.createObjectURL(file));
                                }
                              }
                            }} />
                            {regPhoto ? (
                              <div className="flex flex-col items-center justify-center">
                                <img src={regPhoto} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm mb-1" />
                                <span className="text-[11px] font-bold text-emerald-600">Photo Uploaded. Tap to change.</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center">
                                <Upload className="w-4 h-4 text-blue-600 mb-1" />
                                <span className="text-[13px] font-bold text-blue-600">Choose File or Photo</span>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-2">
                           <div className="w-4 h-4 rounded-full border-2 border-blue-600"></div>
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-900 block mb-1">Blood Group</label>
                          <div className="relative">
                            <select
                              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-[12px] py-3 pl-4 pr-10 text-[13px] font-medium text-slate-800 outline-none transition-colors appearance-none"
                              value={regBlood}
                              onChange={(e) => setRegBlood(e.target.value)}
                            >
                              <option value="" disabled hidden>Select your blood group</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                              <option value="AB+">AB+</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Residential Address Form Section */}
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-[13px] font-black text-slate-900 block leading-tight">
                              {language === "hi" ? "आवासीय पता विवरण" : "Residential Address Details"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold block">
                              {language === "hi" ? "प्रोफाइल, दवा डिलीवरी और एम्बुलेंस सेवा के लिए आवश्यक" : "Required for profile, medical delivery & ambulance dispatch"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 pl-1">
                          {/* House / Flat / Building No. */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-900 block mb-1">
                              {language === "hi" ? "मकान / फ्लैट / बिल्डिंग नं." : "House / Flat / Building No."} <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-[12px] py-3 px-4 text-[13px] font-medium text-slate-800 outline-none transition-colors"
                              placeholder={language === "hi" ? "उदा. फ्लैट 402, बिल्डिंग 3, सनराइज अपार्टमेंट्स" : "e.g. Flat 402, Building 3, Sunrise Apartments"}
                              value={regFlat}
                              onChange={(e) => setRegFlat(e.target.value)}
                            />
                          </div>

                          {/* Street / Area / Locality */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-900 block mb-1">
                              {language === "hi" ? "गली / क्षेत्र / इलाका / लैंडमार्क" : "Street / Area / Locality / Landmark"} <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-[12px] py-3 px-4 text-[13px] font-medium text-slate-800 outline-none transition-colors"
                              placeholder={language === "hi" ? "उदा. सेक्टर 45, मुख्य बाजार के पास" : "e.g. Sector 45, Near Main Market"}
                              value={regStreet}
                              onChange={(e) => setRegStreet(e.target.value)}
                            />
                          </div>

                          {/* City & State */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-900 block mb-1">
                                {language === "hi" ? "शहर / कस्बा" : "City / Town"} <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-[12px] py-3 px-4 text-[13px] font-medium text-slate-800 outline-none transition-colors"
                                placeholder={language === "hi" ? "उदा. जयपुर / गुरुग्राम" : "e.g. Gurugram / Jaipur"}
                                value={regCity}
                                onChange={(e) => setRegCity(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-900 block mb-1">
                                {language === "hi" ? "राज्य" : "State"} <span className="text-rose-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-[12px] py-3 pl-3 pr-8 text-[12.5px] font-medium text-slate-800 outline-none transition-colors appearance-none"
                                  value={regState}
                                  onChange={(e) => setRegState(e.target.value)}
                                >
                                  <option value="" disabled hidden>{language === "hi" ? "राज्य चुनें" : "Select State"}</option>
                                  <option value="Rajasthan">{language === "hi" ? "राजस्थान" : "Rajasthan"}</option>
                                  <option value="Haryana">{language === "hi" ? "हरियाणा" : "Haryana"}</option>
                                  <option value="Delhi">{language === "hi" ? "दिल्ली" : "Delhi"}</option>
                                  <option value="Maharashtra">{language === "hi" ? "महाराष्ट्र" : "Maharashtra"}</option>
                                  <option value="Uttar Pradesh">{language === "hi" ? "उत्तर प्रदेश" : "Uttar Pradesh"}</option>
                                  <option value="Karnataka">{language === "hi" ? "कर्नाटक" : "Karnataka"}</option>
                                  <option value="Gujarat">{language === "hi" ? "गुजरात" : "Gujarat"}</option>
                                  <option value="Punjab">{language === "hi" ? "पंजाब" : "Punjab"}</option>
                                  <option value="West Bengal">{language === "hi" ? "पश्चिम बंगाल" : "West Bengal"}</option>
                                  <option value="Tamil Nadu">{language === "hi" ? "तमिलनाडु" : "Tamil Nadu"}</option>
                                  <option value="Telangana">{language === "hi" ? "तेलंगाना" : "Telangana"}</option>
                                  <option value="Madhya Pradesh">{language === "hi" ? "मध्य प्रदेश" : "Madhya Pradesh"}</option>
                                  <option value="Bihar">{language === "hi" ? "बिहार" : "Bihar"}</option>
                                  <option value="Kerala">{language === "hi" ? "केरल" : "Kerala"}</option>
                                  <option value="Other">{language === "hi" ? "अन्य" : "Other"}</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                          </div>

                          {/* Pincode */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-900 block mb-1">
                              {language === "hi" ? "पिनकोड (6 अंक)" : "Pincode (6 digits)"} <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              maxLength={6}
                              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-[12px] py-3 px-4 text-[13px] font-medium text-slate-800 outline-none transition-colors"
                              placeholder="e.g. 122003"
                              value={regPincode}
                              onChange={(e) => setRegPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <button
                          onClick={() => {
                            // Full Name Validation
                            if (!regName.trim()) {
                              alert("Please enter your full name.");
                              return;
                            }
                            if (regName.trim().length < 3) {
                              alert("Full Name must be at least 3 characters long.");
                              return;
                            }
                            if (/[0-9]/.test(regName) || /[^a-zA-Z\s]/.test(regName)) {
                              alert("Full Name must only contain letters and spaces.");
                              return;
                            }

                            // DOB Validation
                            if (!regDob) {
                              alert("Please enter your Date of Birth.");
                              return;
                            }
                            const dobDate = new Date(regDob);
                            const today = new Date();
                            if (dobDate > today) {
                              alert("Date of Birth cannot be in the future.");
                              return;
                            }
                            const age = today.getFullYear() - dobDate.getFullYear();
                            if (age > 125) {
                              alert("Please enter a valid Date of Birth.");
                              return;
                            }

                            // Gender Validation
                            if (!regGender) {
                              alert("Please select your gender.");
                              return;
                            }

                            // Phone Validation
                            if (!regPhone) {
                              alert("Please enter your mobile number.");
                              return;
                            }
                            if (regPhone.length !== 10) {
                              alert("Mobile number must be exactly 10 digits.");
                              return;
                            }
                            if (regCountryCode === "+91" && !/^[6-9]/.test(regPhone)) {
                              alert("Indian mobile number must start with 6, 7, 8, or 9.");
                              return;
                            }
                            if (!isPhoneVerified) {
                              alert("Please verify your mobile number first using the mock OTP (Code: 712314).");
                              return;
                            }

                            // Email Validation
                            if (!regEmail) {
                              alert("Please enter your email address.");
                              return;
                            }
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!emailRegex.test(regEmail)) {
                              alert("Please enter a valid email address.");
                              return;
                            }

                            // Aadhaar Validation
                            if (!regAadhaar) {
                              alert("Please enter your Aadhaar Card number.");
                              return;
                            }
                            const cleanAadhaar = regAadhaar.replace(/\s/g, "");
                            if (cleanAadhaar.length !== 12) {
                              alert("Aadhaar Card number must be exactly 12 digits.");
                              return;
                            }

                            // Blood Group Validation
                            if (!regBlood) {
                              alert("Please select your blood group.");
                              return;
                            }

                            // Address Form Validation (Required)
                            if (!regFlat.trim()) {
                              alert("Please enter your House / Flat / Building No.");
                              return;
                            }
                            if (!regStreet.trim()) {
                              alert("Please enter your Street / Area / Locality.");
                              return;
                            }
                            if (!regCity.trim()) {
                              alert("Please enter your City / Town.");
                              return;
                            }
                            if (!regState.trim()) {
                              alert("Please select or enter your State.");
                              return;
                            }
                            if (!regPincode.trim()) {
                              alert("Please enter your Pincode.");
                              return;
                            }
                            if (regPincode.replace(/\D/g, "").length !== 6) {
                              alert("Pincode must be exactly 6 digits.");
                              return;
                            }

                            if (isPhoneAlreadyRegistered) {
                              alert("This mobile number is already registered. Please login instead.");
                              return;
                            }

                            setRegStep(2);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] py-4 rounded-[16px] shadow-[0_8px_20px_-8px_rgba(37,99,235,0.5)] transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                        >
                          Continue
                          <ArrowRight className="w-5 h-5 ml-1" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                  )}

            {/* STEP 2: Password Setup */}
            {regStep === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 mt-6" id="reg-step-2"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">Secure Password</h3>
                  <p className="text-xs text-slate-500">Configure a secure credential password for your profile</p>
                </div>

                <div className="space-y-4" id="password-form">
                  <div className="relative">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showRegPwd ? "text" : "password"}
                        required
                        minLength={8}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 pr-10 text-xs font-bold text-slate-800 outline-none"
                        placeholder="Min 8 characters, Upper, Lower, Special"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowRegPwd(!showRegPwd)} className="absolute right-2 p-1 text-slate-400">
                        {showRegPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showRegConfirmPwd ? "text" : "password"}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 pr-10 text-xs font-bold text-slate-800 outline-none"
                        placeholder="Confirm password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowRegConfirmPwd(!showRegConfirmPwd)} className="absolute right-2 p-1 text-slate-400">
                        {showRegConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Rules Tracker */}
                  <div className="bg-slate-50 p-3 rounded-xl text-xs font-bold space-y-1 text-slate-600">
                    <span className="text-[10px] uppercase text-slate-400 block mb-1">Safety Constraints</span>
                    <div className={regPassword.length >= 8 ? "text-green-600" : ""}>✓ Minimum 8 characters</div>
                    <div className={/[A-Z]/.test(regPassword) ? "text-green-600" : ""}>✓ At least 1 uppercase letter</div>
                    <div className={/[a-z]/.test(regPassword) ? "text-green-600" : ""}>✓ At least 1 lowercase letter</div>
                    <div className={/[0-9]/.test(regPassword) ? "text-green-600" : ""}>✓ At least 1 digit</div>
                    <div className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(regPassword) ? "text-green-600" : ""}>✓ At least 1 special symbol</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (regPassword.length < 8 || !/[A-Z]/.test(regPassword) || !/[a-z]/.test(regPassword) || !/[0-9]/.test(regPassword)) {
                      alert("Password does not meet the safety requirements.");
                      return;
                    }
                    if (regPassword !== regConfirmPassword) {
                      alert("Passwords do not match.");
                      return;
                    }
                    setRegStep(3);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs"
                >
                  Confirm Password
                </button>
              </motion.div>
            )}

            {/* STEP 3: Medical Conditions & Allergies */}
            {regStep === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 mt-6" id="reg-step-3"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">Medical Background</h3>
                  <p className="text-xs text-slate-500">Configure medical conditions to unlock safe AI prescriptions</p>
                </div>

                {/* Chronic conditions chips & custom input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Chronic Conditions</label>
                  <div className="flex flex-wrap gap-1.5" id="chronic-chips">
                    {["Hypertension", "Diabetes", "Asthma", "Heart Disease", "Thyroid", "None"].map(c => {
                      const isSelected = regConditions.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            if (c === "None") {
                              setRegConditions(["None"]);
                            } else {
                              setRegConditions(prev => {
                                const filtered = prev.filter(x => x !== "None" && x !== c);
                                if (isSelected) return filtered;
                                return [...filtered, c];
                              });
                            }
                          }}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                            isSelected ? "bg-blue-100 border-blue-400 text-blue-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}

                    {/* Custom user-typed condition chips */}
                    {regConditions.filter(c => !["Hypertension", "Diabetes", "Asthma", "Heart Disease", "Thyroid", "None"].includes(c)).map(customC => (
                      <span
                        key={customC}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-full bg-blue-600 text-white border border-blue-700 shadow-xs"
                      >
                        <span>{customC}</span>
                        <button
                          type="button"
                          onClick={() => setRegConditions(prev => prev.filter(x => x !== customC))}
                          className="hover:text-blue-200 font-black cursor-pointer text-sm leading-none ml-0.5"
                          title="Remove condition"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Write/Add custom chronic condition */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Write other condition (e.g. Migraine, PCOS)..."
                      value={customConditionInput}
                      onChange={(e) => setCustomConditionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomCondition();
                        }
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCondition}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black px-3.5 py-2 rounded-xl text-xs shrink-0 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Pregnancy Status Safety Check (Females > 16) */}
                {regGender === "Female" && getAge(regDob) > 16 && (
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl space-y-3" id="pregnancy-card">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-orange-800">
                      <Shield className="w-4 h-4 text-orange-600 fill-orange-100" />
                      <span>Pregnancy Status (Clinical Safety Required)</span>
                    </div>
                    <div className="flex gap-2">
                      {["Pregnant", "Not Pregnant", "Prefer Not To Say"].map(status => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setRegPregnancyStatus(status)}
                          className={`flex-1 py-2 text-[10px] font-extrabold border rounded-xl transition-all cursor-pointer ${
                            regPregnancyStatus === status 
                              ? "bg-orange-100 border-orange-400 text-orange-800" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Allergy chips & custom input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Known Allergies</label>
                  <div className="flex flex-wrap gap-1.5" id="allergy-chips">
                    {["Penicillin", "Peanuts", "Dairy", "Shellfish", "Dust", "Latex", "None"].map(a => {
                      const isSelected = regAllergies.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => {
                            if (a === "None") {
                              setRegAllergies(["None"]);
                            } else {
                              setRegAllergies(prev => {
                                const filtered = prev.filter(x => x !== "None" && x !== a);
                                if (isSelected) return filtered;
                                return [...filtered, a];
                              });
                            }
                          }}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                            isSelected ? "bg-red-100 border-red-400 text-red-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {a}
                        </button>
                      );
                    })}

                    {/* Custom user-typed allergy chips */}
                    {regAllergies.filter(a => !["Penicillin", "Peanuts", "Dairy", "Shellfish", "Dust", "Latex", "None"].includes(a)).map(customA => (
                      <span
                        key={customA}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-full bg-red-600 text-white border border-red-700 shadow-xs"
                      >
                        <span>{customA}</span>
                        <button
                          type="button"
                          onClick={() => setRegAllergies(prev => prev.filter(x => x !== customA))}
                          className="hover:text-red-200 font-black cursor-pointer text-sm leading-none ml-0.5"
                          title="Remove allergy"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Write/Add custom allergy */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Write other allergy (e.g. Sulfa Drugs, Aspirin)..."
                      value={customAllergyInput}
                      onChange={(e) => setCustomAllergyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomAllergy();
                        }
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-red-500 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomAllergy}
                      className="bg-red-600 hover:bg-red-700 text-white font-black px-3.5 py-2 rounded-xl text-xs shrink-0 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (regConditions.length === 0 || regAllergies.length === 0) {
                      alert("Please choose background conditions and allergies (or select None).");
                      return;
                    }
                    if (regGender === "Female" && getAge(regDob) > 16 && !regPregnancyStatus) {
                      alert("Please specify pregnancy safety status.");
                      return;
                    }
                    setRegStep(4);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs"
                >
                  Submit Health Background
                </button>
              </motion.div>
            )}

            {/* STEP 4: Documents Upload & Final Handoff */}
            {regStep === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 mt-6 flex-1 flex flex-col" id="reg-step-4"
              >
                <div className="space-y-1">                  <h3 className="text-xl font-black text-slate-900">Clinical Timeline Records</h3>                  <p className="text-xs text-slate-500">Securely sync previous medical documents to help doctors understand your history</p>                </div>                <div className={`border ${regReportFile ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'} p-4 rounded-2xl text-center space-y-3 transition-colors`} id="scan-box">                  <div className={`flex justify-center ${regReportFile ? 'text-emerald-600' : 'text-blue-600'}`}>                    {regReportFile ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8 animate-pulse" />}                  </div>                  <div>                    <h5 className="text-xs font-extrabold text-slate-800">{regReportFile ? regReportFile.name : "Scan Diagnostic PDF or Photos"}</h5>                    <span className="text-[10px] text-slate-400 block mt-0.5">{regReportFile ? "Ready to sync with profile" : "Lab results, general medicine slips"}</span>                  </div>                  <label className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-extrabold text-slate-700 cursor-pointer block hover:bg-slate-100 select-none">                    {regReportFile ? "Change Document" : "Choose Documents"}                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => {                      const file = e.target.files?.[0];                      if (file) {                        setRegReportFile(file);                      }                    }} />                  </label>                </div>

                {/* Handoff Choice selection */}
                <div className="space-y-2 pt-4 mt-auto">
                  <button
                    type="button"
                    onClick={handleRegistrationWizardSubmit}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-xs shadow-md shadow-blue-100 flex items-center justify-center gap-1.5"
                    id="btn-register-submit"
                  >
                    <span>Securely Share Uploaded Records &amp; Complete</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRegistrationWizardSubmit}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-extrabold py-3.5 rounded-xl text-xs"
                    id="btn-register-skip"
                  >
                    Skip Upload and Finish Registration
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )}
  </div>
)}

      {/* ─── PATIENT_DASHBOARD SCREEN ─── */}
      {screen === "PATIENT_DASHBOARD" && (
        <div className={`flex flex-col min-h-screen bg-slate-50 relative ${isPatientDarkMode ? "dark-theme-active" : ""}`} id="screen-patient-dashboard">
          {patientTab === "HOME" && (
            <div className="bg-gradient-to-b from-blue-50/50 via-slate-50/10 to-transparent px-5 pt-6 pb-4 flex flex-col gap-5" id="patient-dashboard-header">
            <div className="flex justify-between items-center" id="dash-top-nav">
              {/* Hospyn Logo */}
              <FallbackImage type="header-logo" className="text-slate-900" />
              {/* Right actions: Dark Mode + Install PWA + Avatar */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <PWAInstallButton 
                  variant="header" 
                  language={language} 
                  isDarkMode={isPatientDarkMode} 
                />
                <button
                  type="button"
                  onClick={togglePatientDarkMode}
                  className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 flex items-center justify-center hover:bg-blue-100 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title={isPatientDarkMode ? (language === "hi" ? "लाइट मोड पर स्विच करें" : "Switch to Light Mode") : (language === "hi" ? "डार्क मोड पर स्विच करें" : "Switch to Dark Mode")}
                  aria-label="Toggle Patient Dark Mode"
                >
                  {isPatientDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-600" />}
                </button>
                <button
                  onClick={() => setPatientTab("PROFILE")}
                  className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-extrabold text-sm flex items-center justify-center border border-white shadow-sm hover:scale-105 active:scale-95 transition-transform overflow-hidden cursor-pointer"
                  title="View Profile"
                >
                  {activePatient.photo ? (
                    <img src={activePatient.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    activePatient.name.charAt(0)
                  )}
                </button>
              </div>
            </div>

            {/* Greetings block */}
            <div className="flex items-center justify-between" id="greeting-text">
              <div className="text-left space-y-1">
                <h3 className="text-[26px] font-extrabold text-slate-900 leading-tight">
                  {language === "hi" ? "नमस्ते," : "Hello,"}
                </h3>
                <h2 className="text-[26px] font-extrabold text-blue-600 leading-tight flex items-center gap-1.5">
                  {activePatient.name} <span>👋</span>
                </h2>
                <p className="text-[13px] text-slate-500 font-medium pt-1">
                  {language === "hi" ? "आज हम आपकी क्या मदद कर सकते हैं?" : "How can we help you today?"}
                </p>
              </div>
              
              {/* Dynamic SVG Illustration of clinic with ambulance */}
              <div className="w-[140px] h-[100px] shrink-0 -mr-2">
                <svg width="140" height="100" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path d="M120 20c-3 0-6 2-7 5-2-1-4-1-6 0-3-2-6-1-8 2-1 3 1 6 4 7h17c3 0 5-2 5-5s-2-9-5-9z" fill="#E2E8F0" opacity="0.5"/>
                  <path d="M30 35c-2 0-4 1-5 3-1-1-3-1-4 0-2-1-4 0-5 2-1 2 1 4 3 5h11c2 0 3-1 3-3s-1-7-3-7z" fill="#E2E8F0" opacity="0.4"/>
                  
                  <rect x="80" y="40" width="60" height="55" rx="8" fill="#EFF6FF" />
                  <rect x="90" y="30" width="40" height="65" rx="6" fill="#DBEAFE" />
                  
                  <rect x="106" y="36" width="8" height="8" rx="2" fill="#3B82F6" />
                  <rect x="109" y="34" width="2" height="12" fill="white" />
                  <rect x="104" y="39" width="12" height="2" fill="white" />
                  
                  <rect x="96" y="50" width="8" height="8" rx="2" fill="#93C5FD" opacity="0.8" />
                  <rect x="116" y="50" width="8" height="8" rx="2" fill="#93C5FD" opacity="0.8" />
                  <rect x="96" y="65" width="8" height="8" rx="2" fill="#93C5FD" opacity="0.8" />
                  <rect x="116" y="65" width="8" height="8" rx="2" fill="#93C5FD" opacity="0.8" />
                  
                  <path d="M104 95V82c0-1.5 1.2-2.5 2.5-2.5h7c1.5 0 2.5 1 2.5 2.5v13h-12z" fill="#2563EB" />
                  <line x1="110" y1="80" x2="110" y2="95" stroke="white" strokeWidth="1" />
                  
                  <rect x="65" y="60" width="25" height="35" rx="4" fill="#F0F9FF" />
                  <rect x="70" y="70" width="6" height="6" rx="1.5" fill="#93C5FD" />
                  <rect x="80" y="70" width="6" height="6" rx="1.5" fill="#93C5FD" />
                  
                  <circle cx="55" cy="85" r="10" fill="#34D399" opacity="0.8"/>
                  <rect x="54" y="88" width="2" height="10" fill="#78350F" />
                  <circle cx="145" cy="90" r="8" fill="#10B981" opacity="0.8"/>
                  <rect x="144" y="92" width="2" height="8" fill="#78350F" />
                  <circle cx="138" cy="95" r="7" fill="#059669" opacity="0.7"/>
                  
                  <g transform="translate(100, 80)">
                    <circle cx="10" cy="18" r="4" fill="#1E293B" />
                    <circle cx="28" cy="18" r="4" fill="#1E293B" />
                    <rect x="2" y="4" width="30" height="11" rx="2" fill="white" stroke="#E2E8F0" strokeWidth="1" />
                    <path d="M22 4h10l3 5v6H22V4z" fill="white" />
                    <rect x="8" y="1" width="4" height="3" rx="1" fill="#3B82F6" />
                    <rect x="12" y="8" width="6" height="2" fill="#EF4444" />
                    <rect x="14" y="6" width="2" height="6" fill="#EF4444" />
                    <path d="M26 6h5l2 3h-7V6z" fill="#93C5FD" />
                  </g>
                </svg>
              </div>
            </div>


          </div>
          )}

          {/* Core Applet Widgets Switcher (Tabs) */}
          <div id="dashboard-widgets">
            {patientTab === "HOME" && (
              <div className="space-y-6 pb-28">
                
                {/* Services Grid Widget */}
                <div className="px-4">
                  <div className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] grid grid-cols-3 gap-y-6 gap-x-2">
                    
                    {/* Book Appointment */}
                    <button 
                      onClick={() => setShowBookingWizard(true)}
                      className="flex flex-col items-center justify-between text-center group h-[110px]"
                    >
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-600 leading-tight mt-2 max-w-[85px]">
                        {language === "hi" ? "अपॉइंटमेंट बुक करें" : "Book Appointment"}
                      </span>
                    </button>

                    {/* Search / Find Doctor */}
                    <button 
                      onClick={() => setShowFindSpecialist(true)}
                      className="flex flex-col items-center justify-between text-center group h-[110px]"
                    >
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105">
                        <Search className="w-6 h-6" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-600 leading-tight mt-2 max-w-[85px]">
                        {language === "hi" ? "डॉक्टर खोजें" : "Search / Find Doctor"}
                      </span>
                    </button>

                    {/* AI Health Check */}
                    <button 
                      onClick={() => setShowSymptomChecker(true)}
                      className="flex flex-col items-center justify-between text-center group h-[110px]"
                    >
                      <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-sm shadow-purple-100">
                        <ShieldCheck className="w-6 h-6 stroke-[2]" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-600 leading-tight mt-2 max-w-[85px] group-hover:text-purple-600 transition-colors">
                        {language === "hi" ? "एआई स्वास्थ्य जांच" : "AI Health Check"}
                      </span>
                    </button>

                    {/* Prescriptions */}
                    <button 
                      onClick={() => {
                        setRecordFilter("Prescription");
                        setPatientTab("RECORDS");
                      }}
                      className="flex flex-col items-center justify-between text-center group h-[110px]"
                    >
                      <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105">
                        <Pill className="w-6 h-6" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-600 leading-tight mt-2 max-w-[85px]">
                        {language === "hi" ? "दवा का पर्चा" : "Prescriptions"}
                      </span>
                    </button>

                    {/* My Hospitals */}
                    <button 
                      onClick={() => setPatientTab("HOSPITALS")}
                      className="flex flex-col items-center justify-between text-center group h-[110px]"
                    >
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-600 leading-tight mt-2 max-w-[85px]">
                        {language === "hi" ? "मेरे अस्पताल" : "My Hospitals"}
                      </span>
                    </button>

                    {/* More */}
                    <button 
                      onClick={() => setShowMoreScreen(true)}
                      className="flex flex-col items-center justify-between text-center group h-[110px]"
                    >
                      <div className="w-14 h-14 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105">
                        <MoreHorizontal className="w-6 h-6" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-600 leading-tight mt-2 max-w-[85px]">
                        {language === "hi" ? "अन्य सेवाएं" : "More"}
                      </span>
                    </button>

                  </div>
                </div>

                {/* Upcoming Appointment Section */}
                <div className="px-4">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <span className="font-extrabold text-slate-900 text-[15px]">
                      {language === "hi" ? "आगामी अपॉइंटमेंट" : "Upcoming Appointment"}
                    </span>
                  </div>

                  {activePatientAppointments.filter(a => a.status !== "Cancelled" && a.status !== "Completed").length > 0 ? (
                    (() => {
                      const activeAppts = activePatientAppointments.filter(a => a.status !== "Cancelled" && a.status !== "Completed");
                      const appt = activeAppts[0];
                      const isLabTest = appt.doctorId === "lab-technician" || appt.type.startsWith("Lab Test");
                      const docObj = doctorsList.find(d => d.id === appt.doctorId) || MOCK_DOCTORS.find(d => d.id === appt.doctorId);
                      
                      const avatar = isLabTest ? "🧪" : (docObj?.avatar || "DR");
                      const name = isLabTest ? (language === "hi" ? "पैथोलॉजी लैब जांच संग्रह" : appt.type) : (docObj?.name || "Doctor");
                      const specialty = isLabTest ? (language === "hi" ? "घर पर सैंपल जांच संग्रह" : "Home Sample Collection") : (docObj?.specialty || "Specialist");
                      const location = isLabTest ? (appt.notes || "Assigned Representative") : (docObj?.hospitalName || "Hospital Network");
                      
                      return (
                        <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            {/* Date block */}
                            <div className="text-center shrink-0 min-w-[45px]">
                              <span className="text-[28px] font-black text-blue-600 leading-none block">{appt.dayNum || "24"}</span>
                              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mt-1">
                                {language === "hi" ? (appt.month === "JUL" || appt.month === "Jul" ? "जुलाई" : appt.month === "MAY" || appt.month === "May" ? "मई" : appt.month === "JUN" || appt.month === "Jun" ? "जून" : appt.month) : (appt.month || "May")}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400 block">
                                {language === "hi" ? (appt.dayName === "Thu" ? "गुरु" : appt.dayName === "Sat" ? "शनि" : appt.dayName === "Wed" ? "बुध" : appt.dayName === "Fri" ? "शुक्र" : appt.dayName === "Mon" ? "सोम" : appt.dayName === "Tue" ? "मंगल" : "रवि") : (appt.dayName || "Sat")}
                              </span>
                            </div>

                            {/* Divider line */}
                            <div className="w-[1px] h-12 bg-slate-100 mx-1 self-center" />

                            {/* Doctor Avatar */}
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center font-extrabold text-blue-700 text-sm shrink-0">
                              {avatar}
                            </div>

                            {/* Doctor details */}
                            <div className="text-left min-w-0 flex-1">
                              <h4 className="font-extrabold text-slate-900 text-[15px] truncate">
                                {name}
                              </h4>
                              <span className="text-[11px] font-extrabold text-blue-600 block mt-0.5">
                                {specialty}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{location}</span>
                              </span>
                            </div>

                            {/* Arrow right button */}
                            <button 
                              onClick={() => setPatientTab("APPOINTMENTS")}
                              className="w-10 h-10 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 transition-colors"
                            >
                              <ArrowRight className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Time & Department details bottom pill */}
                          <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-2xl p-3 text-[12px] font-bold text-slate-600 justify-center border border-slate-100/50">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span>{appt.time || "11:30 AM"}</span>
                            </div>
                            <div className="text-slate-200">|</div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span>
                                {isLabTest 
                                  ? (language === "hi" ? "लैब टेस्ट बुकिंग" : "Lab Test Booking") 
                                  : (language === "hi" ? (appt.type === "OPD Consultation" ? "ओपीडी परामर्श" : appt.type) : (appt.type || "OPD Consultation"))}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="bg-white border border-dashed border-slate-200 rounded-[24px] p-8 text-center text-slate-400 font-bold text-xs">
                      {language === "hi" ? "कोई सक्रिय अपॉइंटमेंट निर्धारित नहीं है।" : "No active appointments scheduled."}
                    </div>
                  )}
                </div>

                {/* --- Active Prescription Push Reminders Home Widget --- */}
                <div className="px-4">
                  <div className="flex justify-between items-center mb-2.5 px-1">
                    <span className="font-extrabold text-slate-900 text-[15px] flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-amber-500" />
                      <span>{language === "hi" ? "आज की दवाइयाँ" : "Today's Medications"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecordFilter("Prescription");
                        setPatientTab("RECORDS");
                      }}
                      className="text-blue-600 hover:text-blue-700 font-extrabold text-xs flex items-center gap-0.5"
                    >
                      <span>{language === "hi" ? "प्रबंधित करें" : "Manage"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {homePrescriptionReminders.filter(r => r.active).length === 0 ? (
                      <div className="bg-white border border-dashed border-amber-200 rounded-[24px] p-5 text-center text-slate-400 font-bold text-xs">
                        {language === "hi" ? "कोई सक्रिय दवा रिमाइंडर नहीं है।" : "No active medication reminders."}
                      </div>
                    ) : (
                      homePrescriptionReminders.filter(r => r.active).map((rem) => {
                        const totalSlots = (rem.morningEnabled ? 1 : 0) + (rem.eveningEnabled ? 1 : 0);
                        const takenCount = (rem.morningEnabled && rem.morningTakenToday ? 1 : 0) + (rem.eveningEnabled && rem.eveningTakenToday ? 1 : 0);
                        const allTaken = totalSlots > 0 && takenCount === totalSlots;

                        return (
                          <div 
                            key={rem.id}
                            className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-blue-500/10 border border-amber-200/70 rounded-[24px] p-4 shadow-2xs text-left space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                                  <Pill className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-black text-slate-900 text-xs leading-tight truncate">
                                    {rem.medicineName}
                                  </h5>
                                  <p className="text-[10px] text-slate-500 font-semibold truncate">
                                    {rem.dosage} • {rem.condition || rem.type || (language === "hi" ? "दवा खुराक" : "Prescribed Dose")}
                                  </p>
                                </div>
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                                allTaken 
                                  ? "text-emerald-700 bg-emerald-100/90 border border-emerald-200" 
                                  : "text-amber-800 bg-amber-100/90 border border-amber-200"
                              }`}>
                                {allTaken 
                                  ? (language === "hi" ? "लिया गया ✓" : "ALL TAKEN ✓") 
                                  : (language === "hi" ? "सक्रिय" : "ON TIME")}
                              </span>
                            </div>

                            {/* Clickable Taken / Not Taken Dose Action Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {rem.morningEnabled && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleHomeDoseTaken(rem.id, "morning")}
                                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all active:scale-[0.98] cursor-pointer text-left ${
                                    rem.morningTakenToday
                                      ? "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-900 shadow-2xs"
                                      : "bg-white hover:bg-amber-50/70 border-amber-200/70 text-slate-800 shadow-2xs"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                      rem.morningTakenToday 
                                        ? "bg-emerald-500 text-white" 
                                        : "border-2 border-slate-300 bg-white"
                                    }`}>
                                      {rem.morningTakenToday ? (
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      ) : null}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-[11px] font-extrabold block truncate leading-tight">
                                        {language === "hi" ? "सुबह" : "Morning"} ({formatTimeTo12Hour(rem.morningTime)})
                                      </span>
                                      <span className="text-[9.5px] font-semibold text-slate-400 block truncate">
                                        {rem.morningMeal}
                                      </span>
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-black shrink-0 px-2 py-0.5 rounded-lg transition-colors ml-1 ${
                                    rem.morningTakenToday 
                                      ? "bg-emerald-200/80 text-emerald-800 font-extrabold" 
                                      : "bg-amber-100/90 text-amber-900 hover:bg-amber-200"
                                  }`}>
                                    {rem.morningTakenToday 
                                      ? (language === "hi" ? "लिया गया ✓" : "Taken ✓") 
                                      : (language === "hi" ? "दवा लें" : "Take")}
                                  </span>
                                </button>
                              )}

                              {rem.eveningEnabled && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleHomeDoseTaken(rem.id, "evening")}
                                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all active:scale-[0.98] cursor-pointer text-left ${
                                    rem.eveningTakenToday
                                      ? "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-900 shadow-2xs"
                                      : "bg-white hover:bg-amber-50/70 border-amber-200/70 text-slate-800 shadow-2xs"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                      rem.eveningTakenToday 
                                        ? "bg-emerald-500 text-white" 
                                        : "border-2 border-slate-300 bg-white"
                                    }`}>
                                      {rem.eveningTakenToday ? (
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      ) : null}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-[11px] font-extrabold block truncate leading-tight">
                                        {language === "hi" ? "शाम" : "Evening"} ({formatTimeTo12Hour(rem.eveningTime)})
                                      </span>
                                      <span className="text-[9.5px] font-semibold text-slate-400 block truncate">
                                        {rem.eveningMeal}
                                      </span>
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-black shrink-0 px-2 py-0.5 rounded-lg transition-colors ml-1 ${
                                    rem.eveningTakenToday 
                                      ? "bg-emerald-200/80 text-emerald-800 font-extrabold" 
                                      : "bg-amber-100/90 text-amber-900 hover:bg-amber-200"
                                  }`}>
                                    {rem.eveningTakenToday 
                                      ? (language === "hi" ? "लिया गया ✓" : "Taken ✓") 
                                      : (language === "hi" ? "दवा लें" : "Take")}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* --- Affiliated Hospitals Section --- */}
                <div className="px-4 mt-2 mb-2">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <span className="font-extrabold text-slate-900 text-[15px]">
                      {language === "hi" ? "संबद्ध अस्पताल" : "Affiliated Hospitals"}
                    </span>
                  </div>
                  
                  {/* Horizontal Scroll of Hospitals */}
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {MOCK_HOSPITALS.map((hospital) => {
                      return (
                        <div
                          key={hospital.name}
                          onClick={() => setSelectedHospitalForDetails(hospital)}
                          className="bg-white border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.005)] rounded-[20px] p-3 flex flex-col justify-between min-w-[200px] max-w-[200px] snap-start hover:border-blue-200 transition-all text-left cursor-pointer group"
                        >
                          <div>
                            <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-100 relative mb-2">
                              <img 
                                src={hospital.image || "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=800&auto=format&fit=crop"} 
                                alt={hospital.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <h5 className="font-black text-slate-900 text-[12.5px] truncate leading-tight group-hover:text-blue-600 transition-colors">{hospital.name}</h5>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5 truncate">
                              📍 {hospital.address.split(",")[1]?.trim() || "Jaipur, Rajasthan"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                            <span className="text-[9px] text-slate-500 font-extrabold">
                              {hospital.doctors.length} {language === "hi" ? "डॉक्टर्स" : "Doctors"}
                            </span>
                            <span className="text-[9.5px] text-blue-600 font-black flex items-center gap-0.5">
                              {language === "hi" ? "विवरण" : "Details"} <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Reports & Prescriptions (Side by Side Grid) */}
                <div className="grid grid-cols-2 gap-4 px-4">
                  
                  {/* Recent Reports Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-extrabold text-slate-900 text-[14px]">
                        {language === "hi" ? "हाल की रिपोर्ट" : "Recent Reports"}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-100/80 rounded-[24px] p-4.5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col h-[210px] overflow-hidden gap-3">
                      {activePatientRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs font-bold gap-2">
                          <ClipboardList className="w-8 h-8 opacity-20" />
                          <span>{language === "hi" ? "कोई हाल की रिपोर्ट नहीं" : "No recent reports"}</span>
                          <button onClick={() => { setPatientTab("RECORDS"); setShowUploadRecordModal(true); }} className="text-blue-600 font-extrabold text-[11px] hover:underline bg-blue-50 px-3 py-1.5 rounded-lg mt-1">
                            {language === "hi" ? "पहला रिकॉर्ड अपलोड करें" : "Upload First Record"}
                          </button>
                        </div>
                      ) : (
                        activePatientRecords.slice(0, 3).map((rec, i) => (
                          <div key={rec.id} className="flex items-center justify-between gap-2 h-14">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                i === 0 ? "bg-blue-50 text-blue-600" :
                                i === 1 ? "bg-purple-50 text-purple-600" : "bg-emerald-50 text-emerald-600"
                              }`}>
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="text-left min-w-0">
                                <h5 className="font-extrabold text-slate-800 text-[13px] truncate">{rec.name}</h5>
                                <span className="text-[10px] text-slate-400 font-bold">{rec.date}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => setPreviewRecord(rec)}
                              className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                                i === 0 ? "text-blue-600 hover:bg-blue-50" :
                                i === 1 ? "text-purple-600 hover:bg-purple-50" : "text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {/* Prescriptions Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-extrabold text-slate-900 text-[14px]">
                        {language === "hi" ? "दवा का पर्चा" : "Prescriptions"}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-100/80 rounded-[24px] p-4.5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex flex-col justify-between h-[210px] relative overflow-hidden group hover:border-amber-200 transition-all">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
                      
                      {/* Pill Header */}
                      <div className="flex items-start gap-2">
                        <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                          <Pill className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 leading-none">
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-600">
                              {language === "hi" ? "सक्रिय खुराक" : "Active Schedule"}
                            </span>
                            <span className="text-[8px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">
                              {language === "hi" ? "दैनिक" : "Daily"}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-slate-900 text-[13.5px] truncate leading-tight mt-1">Pantocid 40mg</h5>
                        </div>
                      </div>

                      {/* Daily Timing Schedule */}
                      <div className="my-1.5 space-y-1.5 text-left">
                        {/* Morning Dosing */}
                        <div className={`flex items-center justify-between border p-2 rounded-xl transition-all ${morningPillTaken ? "bg-emerald-50/50 border-emerald-100" : "bg-amber-50/40 border-amber-100/30"}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px]">☀️</span>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-extrabold text-slate-800 leading-none">
                                {language === "hi" ? "सुबह" : "Morning"}
                              </span>
                              <span className="text-[8.5px] text-slate-400 font-semibold mt-0.5">
                                {language === "hi" ? "खाना खाने के बाद" : "After eating meal"}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setMorningPillTaken(!morningPillTaken);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all flex items-center gap-1 ${
                              morningPillTaken 
                                ? "bg-emerald-500 text-white shadow-sm" 
                                : "bg-amber-100/80 text-amber-700 hover:bg-amber-200"
                            }`}
                          >
                            {morningPillTaken ? (language === "hi" ? "ली गई ✓" : "Taken ✓") : (language === "hi" ? "लें" : "Take")}
                          </button>
                        </div>

                        {/* Evening Dosing */}
                        <div className={`flex items-center justify-between border p-2 rounded-xl transition-all ${eveningPillTaken ? "bg-emerald-50/50 border-emerald-100" : "bg-indigo-50/30 border-indigo-100/30"}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px]">🌙</span>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-extrabold text-slate-800 leading-none">
                                {language === "hi" ? "शाम" : "Evening"}
                              </span>
                              <span className="text-[8.5px] text-slate-400 font-semibold mt-0.5">
                                {language === "hi" ? "खाना खाने के बाद" : "After eating meal"}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEveningPillTaken(!eveningPillTaken);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all flex items-center gap-1 ${
                              eveningPillTaken 
                                ? "bg-emerald-500 text-white shadow-sm" 
                                : "bg-indigo-100/80 text-indigo-700 hover:bg-indigo-200"
                            }`}
                          >
                            {eveningPillTaken ? (language === "hi" ? "ली गई ✓" : "Taken ✓") : (language === "hi" ? "लें" : "Take")}
                          </button>
                        </div>
                      </div>


                    </div>
                  </div>

                </div>

                {/* Priority Health Callout Banner */}
                <div className="px-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-[24px] p-5 flex items-center gap-4">
                    {/* Clipboard with blue check icon */}
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                      <div className="relative">
                        <Clipboard className="w-7 h-7 text-blue-600" />
                        <CheckCircle className="w-4 h-4 text-blue-600 fill-white absolute -bottom-1 -right-1" />
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-extrabold text-[14px] text-slate-950">
                        {language === "hi" ? "आपका स्वास्थ्य, हमारी प्राथमिकता" : "Your Health, Our Priority"}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-snug mt-1">
                        {language === "hi" ? "अपने स्वास्थ्य रिकॉर्ड से अपडेट रहें और आसानी से अपॉइंटमेंट प्रबंधित करें।" : "Stay updated with your health records and manage your appointments easily."}
                      </p>
                      <button 
                        onClick={() => setShowBookingWizard(true)}
                        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                      >
                        {language === "hi" ? "अपॉइंटमेंट बुक करें" : "Book Appointment"}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* APPOINTMENTS TABS WIDGET */}
            {patientTab === "APPOINTMENTS" && (
              <div className="space-y-4 text-left px-5 pt-6 pb-28">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {language === "hi" ? "अपॉइंटमेंट" : "Appointments"}
                  </h3>
                </div>

                {/* Tabs with layout animation */}
                <div className="flex bg-slate-100 p-1 rounded-xl relative overflow-hidden" id="appointment-tabs-container">
                  {["Upcoming", "Completed", "Cancelled", "Lab Tests"].map((tab) => {
                    const isActive = appointmentTab === tab;
                    
                    // Count calculation for badge
                    let count = 0;
                    if (tab === "Lab Tests") {
                      count = activePatientAppointments.filter(a => 
                        (a.doctorId === "lab-technician" || a.type.startsWith("Lab Test")) &&
                        a.status !== "Cancelled"
                      ).length;
                    } else if (tab === "Upcoming") {
                      count = activePatientAppointments.filter(a => 
                        (a.status === "Upcoming" || a.status === "Confirmed") && 
                        a.doctorId !== "lab-technician" && 
                        !a.type.startsWith("Lab Test")
                      ).length;
                    } else if (tab === "Cancelled") {
                      count = activePatientAppointments.filter(a => 
                        a.status === "Cancelled"
                      ).length;
                    } else {
                      count = activePatientAppointments.filter(a => 
                        a.status === tab && 
                        a.doctorId !== "lab-technician" && 
                        !a.type.startsWith("Lab Test")
                      ).length;
                    }

                    const tabLabel = language === "hi" ? (
                      tab === "Upcoming" ? "आगामी" :
                      tab === "Completed" ? "पूर्ण" :
                      tab === "Cancelled" ? "रद्द" : "लैब जांच"
                    ) : (
                      tab === "Lab Tests" ? "Labs" : tab
                    );

                    return (
                      <button
                        key={tab}
                        onClick={() => setAppointmentTab(tab as any)}
                        className={`flex-1 py-1.5 text-[10.5px] font-black rounded-lg relative transition-colors duration-300 ${
                          isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
                        }`}
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeAppointmentTabIndicator"
                            className="absolute inset-0 bg-white rounded-lg shadow-sm"
                            transition={{ type: "spring", stiffness: 350, damping: 26 }}
                          />
                        )}
                        <span className="relative z-10 block truncate">
                          {tabLabel} ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3" id="appointments-status-list">
                  {(() => {
                    let filtered = activePatientAppointments;
                    if (appointmentTab === "Lab Tests") {
                      filtered = activePatientAppointments.filter(a => 
                        (a.doctorId === "lab-technician" || a.type.startsWith("Lab Test")) &&
                        a.status !== "Cancelled"
                      );
                    } else if (appointmentTab === "Upcoming") {
                      filtered = activePatientAppointments.filter(a => 
                        (a.status === "Upcoming" || a.status === "Confirmed") && 
                        a.doctorId !== "lab-technician" && 
                        !a.type.startsWith("Lab Test")
                      );
                    } else if (appointmentTab === "Cancelled") {
                      filtered = activePatientAppointments.filter(a => 
                        a.status === "Cancelled"
                      );
                    } else {
                      filtered = activePatientAppointments.filter(a => 
                        a.status === appointmentTab && 
                        a.doctorId !== "lab-technician" && 
                        !a.type.startsWith("Lab Test")
                      );
                    }

                    if (filtered.length === 0) {
                      return (
                        <div className="py-12 text-center bg-white border border-slate-100 rounded-2xl p-5 space-y-2">
                          <p className="text-xs font-bold text-slate-400">
                            {language === "hi" ? "कोई अपॉइंटमेंट नहीं मिला" : "No appointments found"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {language === "hi" ? "इस श्रेणी में आपका कोई अपॉइंटमेंट नहीं है।" : "You don't have any appointments in this category."}
                          </p>
                        </div>
                      );
                    }

                    return filtered.map(appt => {
                      const docObj = doctorsList.find(d => d.id === appt.doctorId) || MOCK_DOCTORS.find(d => d.id === appt.doctorId);
                      const isLabTest = appt.doctorId === "lab-technician" || appt.type.startsWith("Lab Test");
                      const avatar = isLabTest ? "🧪" : (docObj?.avatar || "DR");
                      const name = isLabTest ? (language === "hi" ? "पैथोलॉजी लैब जांच" : appt.type) : (docObj?.name || "Doctor");
                      const specialtyName = isLabTest ? (language === "hi" ? "घर पर सैंपल जांच संग्रह" : "Home Sample Collection") : (docObj?.specialty || "Specialist");
                      const hospitalName = isLabTest ? (language === "hi" ? "संबद्ध डायग्नोस्टिक पार्टनर" : "Assigned Diagnostic Partner") : (docObj?.hospitalName || "Hospital Network");
                      
                      // Theme color set based on appointment status
                      const isCancelled = appt.status === "Cancelled";
                      const isCompleted = appt.status === "Completed";
                      const isUpcoming = !isCancelled && !isCompleted;
                      
                      let statusTheme = {
                        text: "text-blue-600",
                        bg: "bg-blue-50/70",
                        border: "border-blue-100/80",
                        badge: "bg-blue-50 text-blue-700 border-blue-100",
                        indicator: "bg-blue-500",
                        banner: "from-blue-500/5 to-transparent",
                      };
                      if (isCancelled) {
                        statusTheme = {
                          text: "text-rose-600",
                          bg: "bg-rose-50/50",
                          border: "border-rose-100/80",
                          badge: "bg-rose-50 text-rose-600 border-rose-100",
                          indicator: "bg-rose-500",
                          banner: "from-rose-500/5 to-transparent",
                        };
                      } else if (isCompleted) {
                        statusTheme = {
                          text: "text-emerald-700",
                          bg: "bg-emerald-50/50",
                          border: "border-emerald-100/80",
                          badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
                          indicator: "bg-emerald-500",
                          banner: "from-emerald-500/5 to-transparent",
                        };
                      }

                      // Specialty-based avatar container colors
                      let avatarBg = "bg-blue-50 text-blue-700 border-blue-100";
                      if (isLabTest) {
                        avatarBg = "bg-violet-50 text-violet-700 border-violet-100";
                      } else if (docObj?.specialty?.includes("Cardiology")) {
                        avatarBg = "bg-rose-50 text-rose-700 border-rose-100";
                      } else if (docObj?.specialty?.includes("Paediatric")) {
                        avatarBg = "bg-amber-50 text-amber-700 border-amber-100";
                      } else if (docObj?.specialty?.includes("Neurology")) {
                        avatarBg = "bg-purple-50 text-purple-700 border-purple-100";
                      } else if (docObj?.specialty?.includes("Orthopaedics")) {
                        avatarBg = "bg-teal-50 text-teal-700 border-teal-100";
                      } else if (docObj?.specialty?.includes("Dermatology")) {
                        avatarBg = "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100";
                      }

                      const statusLabel = language === "hi" ? (
                        appt.status === "Cancelled" ? "रद्द" :
                        appt.status === "Completed" ? "पूर्ण" : "आगामी"
                      ) : appt.status;

                      return (
                        <div 
                          key={appt.id} 
                          onClick={() => { setSelectedAppointment(appt); setShowAppointmentDetails(true); }} 
                          className={`relative overflow-hidden bg-white border ${statusTheme.border} p-5 rounded-[24px] shadow-xs hover:shadow-md hover:border-blue-300 active:scale-[0.99] transition-all cursor-pointer flex flex-col gap-4`}
                        >
                          {/* Banner background decor */}
                          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${statusTheme.banner} rounded-full blur-2xl pointer-events-none`} />

                          {/* Top row: Avatar, Info, and Status Pill */}
                          <div className="flex justify-between items-start gap-3 relative z-10">
                            <div className="flex gap-3.5">
                              {/* Gorgeous avatar box */}
                              <div className={`w-12 h-12 rounded-[16px] ${avatarBg} border flex items-center justify-center font-black text-lg shadow-xs shrink-0 transition-transform hover:scale-105`}>
                                {avatar}
                              </div>
                              <div className="text-left space-y-0.5 min-w-0">
                                <h4 className="font-extrabold text-slate-900 text-[14px] leading-tight truncate">
                                  {name}
                                </h4>
                                <span className="text-[11px] text-slate-500 font-bold block truncate">
                                  {specialtyName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[180px]">{hospitalName}</span>
                                </span>
                              </div>
                            </div>

                            {/* Elegant colored Status Tag with indicator dot */}
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`inline-flex items-center gap-1.5 text-[9.5px] font-black px-2.5 py-1 rounded-full uppercase border ${statusTheme.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusTheme.indicator} ${isUpcoming ? 'animate-pulse' : ''}`} />
                                {statusLabel}
                              </span>
                            </div>
                          </div>

                          {/* Middle row: Date / Time badge */}
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/60 p-3 rounded-2xl border border-slate-100/50 relative z-10">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                              <span>📅</span>
                              <span>{appt.date}</span>
                              <span className="text-slate-300">·</span>
                              <span>🕒 {appt.time}</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100/40">
                              {isLabTest ? (language === "hi" ? "🔬 होम लैब जांच" : "🔬 Home Lab collection") : `🏥 ${appt.type === "OPD Consultation" && language === "hi" ? "ओपीडी परामर्श" : appt.type}`}
                            </span>
                          </div>

                          {/* Notes / Symptoms */}
                          {(appt.notes || appt.symptoms) && (
                            <div className="text-[11px] text-slate-600 bg-slate-50/40 border border-slate-100/40 p-2.5 rounded-2xl space-y-1 text-left relative z-10">
                              {appt.symptoms && (
                                <div className="flex items-start gap-1">
                                  <span className="text-amber-500 font-bold shrink-0">
                                    {language === "hi" ? "लक्षण:" : "Symptoms:"}
                                  </span>
                                  <span className="italic text-slate-600">"{appt.symptoms}"</span>
                                </div>
                              )}
                              {appt.notes && (
                                <div className="flex items-start gap-1">
                                  <span className="text-blue-500 font-bold shrink-0">
                                    {language === "hi" ? "निर्देश:" : "Instructions:"}
                                  </span>
                                  <span className="text-slate-500">{appt.notes}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Diagnosis & Prescription if completed */}
                          {isCompleted && (appt.diagnosis || appt.prescriptionId) && (
                            <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-2 relative z-10">
                               {appt.diagnosis && (
                                 <div className="flex items-center gap-1.5 text-[11.5px] text-emerald-800 font-extrabold bg-emerald-50/40 px-3 py-2 rounded-xl border border-emerald-100/30">
                                   <span>🩺 {language === "hi" ? "रोग निदान:" : "Diagnosis:"}</span>
                                   <span>{appt.diagnosis}</span>
                                   <span>{appt.diagnosis}</span>
                                 </div>
                               )}
                               {appt.prescriptionId && (
                                 <div className="flex justify-between items-center">
                                   <span className="text-[10px] text-slate-400 font-bold">Rx Prescribed</span>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setSelectedAppointment(appt);
                                       setShowAppointmentDetails(true);
                                     }}
                                     className="text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-xl font-extrabold transition-all shadow-xs"
                                   >
                                     📄 View Prescription
                                   </button>
                                 </div>
                               )}
                            </div>
                          )}

                          {/* Quick action helper label */}
                          <div className="flex justify-end text-[9px] text-slate-400 font-extrabold tracking-wider uppercase border-t border-slate-100/60 pt-2.5 mt-0.5">
                            <span>Click card for details & management →</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* RECORDS TABS WIDGET */}
            {patientTab === "RECORDS" && (
              <div className="space-y-4 text-left px-5 pt-6 pb-28">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {language === "hi" ? "मेरे रिकॉर्ड" : "My Records"}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                      {language === "hi" ? "आपके सभी मेडिकल रिकॉर्ड एक ही स्थान पर" : "All your medical records in one place"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    
                  <button 
                    onClick={() => setShowUploadRecordModal(true)} 
                    className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-[0_4px_10px_rgba(37,99,235,0.25)]"
                    title={language === "hi" ? "रिकॉर्ड अपलोड करें" : "Upload Record"}
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  {/* Search Trigger */}
                    <button 
                      onClick={() => {
                        setShowRecordsSearchInput(!showRecordsSearchInput);
                        if (showRecordsSearchInput) {
                          setRecordsSearchQuery("");
                        }
                      }} 
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${showRecordsSearchInput ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                      title={language === "hi" ? "खोजें" : "Search Records"}
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    {/* Filter Trigger / Sorting */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowRecordsSortMenu(!showRecordsSortMenu)} 
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${showRecordsSortMenu ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                        title={language === "hi" ? "क्रमबद्ध करें" : "Sort Records"}
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                      {showRecordsSortMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="px-3 py-1.5 border-b border-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {language === "hi" ? "क्रमबद्ध करें" : "Sort Records"}
                          </div>
                          <button onClick={() => { setRecordsSortOrder("newest"); setShowRecordsSortMenu(false); }} className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between ${recordsSortOrder === "newest" ? "text-blue-600 bg-blue-50/50" : "text-slate-700 hover:bg-slate-50"}`}>
                            <span>{language === "hi" ? "नवीनतम पहले" : "Newest First"}</span>
                            {recordsSortOrder === "newest" && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
                          </button>
                          <button onClick={() => { setRecordsSortOrder("oldest"); setShowRecordsSortMenu(false); }} className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between ${recordsSortOrder === "oldest" ? "text-blue-600 bg-blue-50/50" : "text-slate-700 hover:bg-slate-50"}`}>
                            <span>{language === "hi" ? "पुराने पहले" : "Oldest First"}</span>
                            {recordsSortOrder === "oldest" && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
                          </button>
                          <button onClick={() => { setRecordsSortOrder("name"); setShowRecordsSortMenu(false); }} className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between ${recordsSortOrder === "name" ? "text-blue-600 bg-blue-50/50" : "text-slate-700 hover:bg-slate-50"}`}>
                            <span>{language === "hi" ? "नाम के अनुसार" : "By Name"}</span>
                            {recordsSortOrder === "name" && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Search Input Box */}
                {showRecordsSearchInput && (
                  <div className="relative animate-in slide-in-from-top-1 duration-200">
                    <input 
                      type="text" 
                      placeholder={language === "hi" ? "रिपोर्ट या अस्पताल के नाम से खोजें..." : "Search by report name or hospital..."}
                      value={recordsSearchQuery}
                      onChange={(e) => setRecordsSearchQuery(e.target.value)}
                      className="w-full h-10 bg-slate-50 border border-slate-100 focus:border-blue-200 rounded-xl px-4 pl-9 text-xs font-bold text-slate-800 outline-none shadow-inner"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                    {recordsSearchQuery && (
                      <button onClick={() => setRecordsSearchQuery("")} className="absolute right-2.5 top-2.5 text-[9px] text-slate-400 hover:text-slate-600 font-extrabold bg-slate-200 hover:bg-slate-300 h-5 px-1.5 rounded-md">
                        {language === "hi" ? "हटाएं" : "Clear"}
                      </button>
                    )}
                  </div>
                )}

                {/* Secure Records Info Card (Matched with image perfectly) */}
                <div className="bg-gradient-to-br from-blue-50/60 to-blue-100/30 border border-blue-100/50 p-4.5 rounded-[22px] flex items-center justify-between shadow-[0_4px_16px_rgba(59,130,246,0.02)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full blur-xl pointer-events-none"></div>
                  
                  {/* Folder & Shield Illustration */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                      <div className="w-[38px] h-[30px] bg-blue-100 rounded-md absolute bottom-1 rotate-[-3deg] shadow-sm"></div>
                      <div className="w-[34px] h-[26px] bg-white rounded-md absolute bottom-2 border border-blue-50 flex flex-col justify-end p-0.5 shadow-sm">
                        <div className="w-4 h-0.5 bg-blue-100 rounded mb-0.5"></div>
                        <div className="w-2 h-0.5 bg-blue-100 rounded"></div>
                      </div>
                      <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center shadow absolute right-0.5 bottom-0.5 border border-white">
                        <Shield className="w-2.5 h-2.5 text-white fill-white/10" />
                      </div>
                    </div>

                    <div className="text-left space-y-0.5 min-w-0">
                      <h4 className="font-extrabold text-[12.5px] text-slate-900 leading-tight">
                        {language === "hi" ? "आपके स्वास्थ्य रिकॉर्ड, सुरक्षित और निजी" : "Your health records, secure and private"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {language === "hi" ? "केवल आप ही अपने रिकॉर्ड देख सकते हैं" : "Only you can access your records"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Total records count and View Summary button */}
                  <div className="text-right pl-3.5 border-l border-blue-100 shrink-0 flex flex-col items-end">
                    <div className="text-2xl font-black text-blue-600 tracking-tight leading-none">{activePatientRecords.length}</div>
                    <div className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-wider">
                      {language === "hi" ? "कुल रिकॉर्ड" : "Total Records"}
                    </div>
                    <button 
                      onClick={() => setShowRecordsSummaryModal(true)} 
                      className="mt-2.5 bg-white hover:bg-slate-50 border border-slate-100 text-blue-600 font-extrabold text-[9px] px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-all active:scale-95 shrink-0"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                      <span>{language === "hi" ? "सारांश देखें" : "View Summary"}</span>
                    </button>
                  </div>
                </div>

                {/* Filters Row (Matched with layout in image) */}
                <div className="grid grid-cols-3 gap-2" id="records-category-grid">
                  {[
                    { key: "All", label: language === "hi" ? "सभी रिकॉर्ड" : "All Records", count: activePatientRecords.length, icon: FileText, bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
                    { key: "Lab Report", label: language === "hi" ? "लैब रिपोर्ट" : "Lab Reports", count: activePatientRecords.filter(r => r.category === "Lab Report").length, icon: FlaskConical, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
                    { key: "Radiology Report", label: language === "hi" ? "इमेजिंग (एक्स-रे)" : "Imaging", count: activePatientRecords.filter(r => r.category === "Radiology Report").length, icon: Image, bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
                    { key: "Prescription", label: language === "hi" ? "दवा के पर्चे" : "Prescriptions", count: activePatientRecords.filter(r => r.category === "Prescription").length, icon: Pill, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
                    { key: "Discharge Summary", label: language === "hi" ? "डिस्चार्ज सारांश" : "Discharge Summaries", count: activePatientRecords.filter(r => r.category === "Discharge Summary").length, icon: ClipboardList, bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" },
                    { key: "Others", label: language === "hi" ? "अन्य" : "Others", count: activePatientRecords.filter(r => r.category === "Vaccination Record" || r.category === "Other Document").length, icon: MoreHorizontal, bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-100" }
                  ].map(cat => {
                    const isSelected = recordFilter === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setRecordFilter(cat.key)}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center transition-all relative overflow-hidden ${
                          isSelected 
                            ? "bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/10 scale-[1.01]" 
                            : "bg-white border-slate-100 hover:border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl ${cat.bg} ${cat.text} flex items-center justify-center mb-1.5 shadow-sm`}>
                          <cat.icon className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black text-slate-700 leading-tight block truncate w-full">{cat.label}</span>
                        
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="text-[10px] font-black text-slate-500">{cat.count}</span>
                          {isSelected && <div className="w-1 h-1 bg-blue-500 rounded-full"></div>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom active prescription schedule visualizer */}
                {recordFilter === "Prescription" && (
                  <div className="mt-1 animate-in slide-in-from-top duration-300">
                    <PrescriptionReminderManager
                      language={language}
                      patientId={activePatient?.id || "pat-1"}
                      patientName={activePatient?.name || "Gunjan Sharma"}
                      onShowToast={triggerToast}
                    />
                  </div>
                )}

                {/* Recent Records Heading with View All link */}
                <div className="flex justify-between items-center pt-2">
                  <h3 className="font-extrabold text-slate-900 text-xs tracking-tight">
                    {language === "hi" ? "हाल के रिकॉर्ड" : "Recent Records"}
                  </h3>
                  <button 
                    onClick={() => {
                      setRecordFilter("All");
                      setRecordsSearchQuery("");
                    }} 
                    className="text-blue-600 hover:text-blue-700 font-extrabold text-[10px] transition-colors"
                  >
                    {language === "hi" ? "सभी देखें" : "View All"}
                  </button>
                </div>

                {/* Records List (matched to image list items style) */}
                <div className="space-y-2" id="records-cards-list">
                  {activePatientRecords
                    .filter(rec => {
                      // Category filter
                      if (recordFilter !== "All") {
                        if (recordFilter === "Others") {
                          if (rec.category !== "Vaccination Record" && rec.category !== "Other Document") return false;
                        } else {
                          if (rec.category !== recordFilter) return false;
                        }
                      }
                      // Search query
                      if (recordsSearchQuery.trim() !== "") {
                        const query = recordsSearchQuery.toLowerCase();
                        const matchName = rec.name.toLowerCase().includes(query);
                        const matchSummary = rec.summary?.toLowerCase().includes(query) || false;
                        const matchHospital = "CityCare Hospital, Delhi".toLowerCase().includes(query) || (rec.id === "rec-10" || rec.id === "rec-13" ? "Metro Heart Institute".toLowerCase().includes(query) : false);
                        if (!matchName && !matchSummary && !matchHospital) return false;
                      }
                      return true;
                    })
                    .sort((a, b) => {
                      if (recordsSortOrder === "newest") {
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                      } else if (recordsSortOrder === "oldest") {
                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                      } else {
                        return a.name.localeCompare(b.name);
                      }
                    })
                    .map(rec => {
                      let badgeStyle = "bg-blue-50 text-blue-600";
                      let iconBg = "bg-blue-50 text-blue-600";
                      let iconType = FileText;
                      let categoryLabel = "Document";

                      if (rec.category === "Lab Report") {
                        badgeStyle = "bg-emerald-50 text-emerald-600";
                        iconBg = "bg-emerald-50 text-emerald-600";
                        iconType = FlaskConical;
                        categoryLabel = "Lab Report";
                      } else if (rec.category === "Radiology Report") {
                        badgeStyle = "bg-purple-50 text-purple-600";
                        iconBg = "bg-purple-50 text-purple-600";
                        iconType = Image;
                        categoryLabel = "Imaging";
                      } else if (rec.category === "Prescription") {
                        badgeStyle = "bg-amber-50 text-amber-600";
                        iconBg = "bg-amber-50 text-amber-600";
                        iconType = Pill;
                        categoryLabel = "Prescription";
                      } else if (rec.category === "Discharge Summary") {
                        badgeStyle = "bg-rose-50 text-rose-600";
                        iconBg = "bg-rose-50 text-rose-600";
                        iconType = ClipboardList;
                        categoryLabel = "Discharge";
                      } else {
                        badgeStyle = "bg-slate-50 text-slate-600";
                        iconBg = "bg-slate-50 text-slate-600";
                        iconType = MoreHorizontal;
                        categoryLabel = "Other";
                      }

                      return (
                        <div 
                          key={rec.id} 
                          className="bg-white border border-slate-100 hover:border-slate-200/80 p-3.5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3 transition-all group cursor-pointer"
                          onClick={() => setPreviewRecord(rec)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Left Rounded Icon Box */}
                            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 transition-all group-hover:scale-105`}>
                              {React.createElement(iconType, { className: "w-4.5 h-4.5" })}
                            </div>
                            
                            {/* Name & Hospital Meta */}
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="font-extrabold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">{rec.name}</h4>
                              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                                {rec.date} <span className="mx-0.5">•</span> {rec.id === "rec-10" || rec.id === "rec-13" || rec.id === "rec-24" ? "Metro Heart Institute" : "CityCare Hospital, Delhi"}
                              </span>
                            </div>
                          </div>

                          {/* Category Tag & Action */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${badgeStyle}`}>
                              {categoryLabel}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadRecord(rec);
                              }}
                              className="w-7 h-7 rounded-full bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors"
                              title="Download Report"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {/* Empty state when nothing matches filters */}
                  {activePatientRecords.filter(rec => {
                    if (recordFilter !== "All") {
                      if (recordFilter === "Others") {
                        if (rec.category !== "Vaccination Record" && rec.category !== "Other Document") return false;
                      } else {
                        if (rec.category !== recordFilter) return false;
                      }
                    }
                    if (recordsSearchQuery.trim() !== "") {
                      const query = recordsSearchQuery.toLowerCase();
                      const matchName = rec.name.toLowerCase().includes(query);
                      const matchSummary = rec.summary?.toLowerCase().includes(query) || false;
                      const matchHospital = "CityCare Hospital, Delhi".toLowerCase().includes(query) || (rec.id === "rec-10" || rec.id === "rec-13" ? "Metro Heart Institute".toLowerCase().includes(query) : false);
                      if (!matchName && !matchSummary && !matchHospital) return false;
                    }
                    return true;
                  }).length === 0 && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center text-slate-400 font-bold text-xs space-y-2">
                      <div>No medical records found.</div>
                      <button onClick={() => { setRecordFilter("All"); setRecordsSearchQuery(""); }} className="text-blue-600 hover:underline">Reset Filters</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {patientTab === "PROFILE" && activePatient && (
              <ProfileScreen
                activePatient={activePatient}
                onUpdatePatient={(updated) => {
                  setActivePatient(updated as StoredPatient);
                  setRegisteredPatients((prev) =>
                    prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
                  );
                }}
                onLogOut={() => {
                  if (activePatient) {
                    setPatientPhone(activePatient.phone);
                    if ((activePatient as StoredPatient).password) {
                      setPatientPassword((activePatient as StoredPatient).password!);
                    }
                    setLoginOtpPhone(activePatient.phone);
                  }
                  setActivePatient(null);
                  setScreen("LOGIN_OPTIONS");
                }}
                isDarkMode={isPatientDarkMode}
                onToggleDarkMode={togglePatientDarkMode}
                appName="Hospyn"
                language={language}
                onSelectLanguage={(lang) => setLanguage(lang)}
                onReplayCinematicIntro={() => setShowCinematicIntro(true)}
              />
            )}

            {/* --- MY HOSPITALS SCREEN VIEW --- */}
            {patientTab === "HOSPITALS" && (
              <div className="flex flex-col min-h-screen bg-slate-50/60 pb-28 text-left">
                {/* Header Bar */}
                <div className="bg-white px-5 pt-5 pb-3.5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20 shadow-xs">
                  <button 
                    onClick={handleGoBack} 
                    className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    title={language === "hi" ? "वापस जाएँ" : "Back to Home"}
                  >
                    <ArrowLeft className="w-4.5 h-4.5 stroke-[2.5]" />
                  </button>
                  <h2 className="text-[17px] font-black text-slate-900 tracking-tight text-center">
                    {language === "hi" ? "मेरे अस्पताल" : "My Hospitals"}
                  </h2>
                  <button
                    onClick={() => setMapViewMode(!mapViewMode)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-xs border border-blue-100"
                  >
                    {mapViewMode ? (language === "hi" ? "सूची देखें" : "List View") : (language === "hi" ? "मानचित्र देखें" : "Map View")}
                  </button>
                </div>

                {/* Map View Mode Banner */}
                {mapViewMode && (
                  <div className="p-4 bg-slate-100 border-b border-slate-200 text-center relative overflow-hidden shadow-inner">
                    <div className="h-44 bg-blue-50/90 rounded-2xl border border-blue-200/60 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
                      <Building2 className="w-8 h-8 text-blue-600 mb-2 relative z-10" />
                      <p className="font-extrabold text-xs text-slate-900 relative z-10">
                        {language === "hi" ? "इंटरएक्टिव नेटवर्क मैप" : "Interactive Network Map"}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium relative z-10">
                        {language === "hi" ? `जयपुर, नोएडा, गुरुग्राम में ${MOCK_HOSPITALS.length} सत्यापित अस्पताल दिखा रहा है` : `Showing ${MOCK_HOSPITALS.length} verified hospitals across Jaipur, Noida, Gurugram`}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-3 relative z-10">
                        {MOCK_HOSPITALS.slice(0, 4).map(h => (
                          <button key={h.name} onClick={() => setSelectedHospitalForDetails(h)} className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-extrabold text-blue-700 shadow-xs border border-blue-100 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                            📍 {h.name.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search & Filter Bar */}
                <div className="px-5 pt-4 pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl px-3.5 py-3 flex items-center gap-2.5 shadow-xs focus-within:border-blue-500 transition-all">
                      <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                      <input 
                        type="text"
                        placeholder={language === "hi" ? "अस्पताल, स्थान खोजें..." : "Search hospitals, locations..."}
                        value={hospitalSearchQuery}
                        onChange={(e) => setHospitalSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 outline-none"
                      />
                      {hospitalSearchQuery && (
                        <button onClick={() => setHospitalSearchQuery("")} className="text-slate-400 text-xs font-black hover:text-slate-600 cursor-pointer">✕</button>
                      )}
                    </div>
                    {/* Hospital Sort Dropdown */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowHospitalSortMenu(!showHospitalSortMenu)}
                        className={`w-11 h-11 border rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          showHospitalSortMenu 
                            ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                            : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 shadow-xs'
                        }`}
                        title={language === "hi" ? "क्रमबद्ध करें" : "Sort Hospitals"}
                      >
                        <SlidersHorizontal className="w-4.5 h-4.5" />
                      </button>
                      {showHospitalSortMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="px-3 py-1.5 border-b border-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {language === "hi" ? "अस्पताल क्रमबद्ध करें" : "Sort Hospitals"}
                          </div>
                          <button 
                            onClick={() => { setHospitalSortOrder("rating"); setShowHospitalSortMenu(false); }} 
                            className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between ${hospitalSortOrder === "rating" ? "text-blue-600 bg-blue-50/50" : "text-slate-700 hover:bg-slate-50"}`}
                          >
                            <span>{language === "hi" ? "उच्चतम रेटिंग" : "Highest Rated"}</span>
                            {hospitalSortOrder === "rating" && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
                          </button>
                          <button 
                            onClick={() => { setHospitalSortOrder("reviews"); setShowHospitalSortMenu(false); }} 
                            className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between ${hospitalSortOrder === "reviews" ? "text-blue-600 bg-blue-50/50" : "text-slate-700 hover:bg-slate-50"}`}
                          >
                            <span>{language === "hi" ? "सर्वाधिक समीक्षाएं" : "Most Reviewed"}</span>
                            {hospitalSortOrder === "reviews" && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
                          </button>
                          <button 
                            onClick={() => { setHospitalSortOrder("name"); setShowHospitalSortMenu(false); }} 
                            className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between ${hospitalSortOrder === "name" ? "text-blue-600 bg-blue-50/50" : "text-slate-700 hover:bg-slate-50"}`}
                          >
                            <span>{language === "hi" ? "वर्णमाला के अनुसार (A-Z)" : "Alphabetical (A-Z)"}</span>
                            {hospitalSortOrder === "name" && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hospital Cards List */}
                <div className="px-5 pt-3 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                      {language === "hi" ? "सभी अस्पताल" : "All Hospitals"}
                    </span>
                    <span className="text-xs font-extrabold text-slate-400">
                          {MOCK_HOSPITALS.filter(h => {
                            if (!hospitalSearchQuery) return true;
                            const q = hospitalSearchQuery.toLowerCase();
                            return (
                              h.name.toLowerCase().includes(q) ||
                              h.address.toLowerCase().includes(q) ||
                              (h.city && h.city.toLowerCase().includes(q)) ||
                              h.departments.some(d => d.toLowerCase().includes(q))
                            );
                          }).length} {language === "hi" ? "अस्पताल" : "Hospitals"}
                        </span>
                      </div>

                      {MOCK_HOSPITALS.filter(h => {
                        if (!hospitalSearchQuery) return true;
                        const q = hospitalSearchQuery.toLowerCase();
                        return (
                          h.name.toLowerCase().includes(q) ||
                          h.address.toLowerCase().includes(q) ||
                          (h.city && h.city.toLowerCase().includes(q)) ||
                          h.departments.some(d => d.toLowerCase().includes(q))
                        );
                      })
                      .sort((a, b) => {
                        if (hospitalSortOrder === "rating") {
                          return (b.rating || 0) - (a.rating || 0);
                        } else if (hospitalSortOrder === "reviews") {
                          return (b.reviewsCount || 0) - (a.reviewsCount || 0);
                        } else {
                          return a.name.localeCompare(b.name);
                        }
                      })
                      .map((hospital) => {
                        return (
                          <div 
                            key={hospital.name}
                            onClick={() => setSelectedHospitalForDetails(hospital)}
                            className="bg-white border border-slate-100 rounded-[22px] p-3 flex gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_6px_24px_rgba(59,130,246,0.08)] hover:border-blue-200 transition-all cursor-pointer group text-left relative"
                          >
                            {/* Hospital Thumbnail Image */}
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                              <img 
                                src={hospital.image || "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=800&auto=format&fit=crop"} 
                                alt={hospital.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Hospital Information */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <div>
                                {/* Name + Verified Check */}
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-black text-slate-900 text-[13.5px] truncate leading-snug group-hover:text-blue-600 transition-colors">
                                    {hospital.name}
                                  </h4>
                                  <div className="w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] shrink-0 font-black" title="Verified Hospital">
                                    ✓
                                  </div>
                                </div>

                                {/* Rating + Location */}
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1 text-[11px] font-black text-amber-500">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span>{hospital.rating || 4.8}</span>
                                    <span className="text-slate-400 font-medium">({Math.min(hospital.reviewsCount || 48, 50)})</span>
                                  </div>
                                  <span className="text-slate-300 text-[10px]">•</span>
                                  <span className="text-[11px] font-bold text-slate-500 truncate">{hospital.city || "Jaipur"}</span>
                                </div>

                                {/* Aligned Specialists count instead of 100+ badge */}
                                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500 font-extrabold bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 w-max">
                                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{hospital.doctors.length} Aligned Specialists</span>
                                </div>
                              </div>

                              {/* Specialties line + Chevron */}
                              <div className="flex items-center justify-between border-t border-slate-50 pt-2 mt-2">
                                <span className="text-[10.5px] font-extrabold text-slate-500 truncate max-w-[180px]">
                                  {hospital.departments.slice(0, 2).join(" • ")} {hospital.departments.length > 2 ? "• 10+ more" : ""}
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                </div>
            )}
          </div>

          {/* Bottom Tabs Nav bar */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-20 bg-white border-t border-slate-100 flex items-center justify-around z-50 px-2 pb-2 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]" id="patient-bottom-tabs">
            
            {/* Home */}
            <button
              onClick={() => {
                setPatientTab("HOME");
                setShowSymptomChecker(false);
                setShowMedicalSearch(false);
                setShowFindSpecialist(false);
                setShowReportReader(false);
                setShowMoreScreen(false);
              }}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full text-[11px] font-bold ${patientTab === "HOME" && !showMoreScreen ? "text-blue-600" : "text-slate-400 hover:text-slate-600"} transition-all cursor-pointer`}
            >
              <Home className="w-[22px] h-[22px]" />
              <span>{language === "hi" ? "होम" : "Home"}</span>
            </button>

            {/* Appointments */}
            <button
              onClick={() => {
                setPatientTab("APPOINTMENTS");
                setAppointmentTab("Upcoming");
                setShowSymptomChecker(false);
                setShowMedicalSearch(false);
                setShowFindSpecialist(false);
                setShowReportReader(false);
                setShowMoreScreen(false);
              }}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full text-[11px] font-bold ${patientTab === "APPOINTMENTS" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"} transition-all cursor-pointer`}
            >
              <Calendar className="w-[22px] h-[22px]" />
              <span>{language === "hi" ? "अपॉइंटमेंट" : "Appointments"}</span>
            </button>

            {/* Center Floating Plus Action (Book) */}
            <div className="flex flex-col items-center justify-center w-16 relative -top-3">
              <button
                onClick={() => {
                  setShowBookingWizard(true);
                  setShowFindSpecialist(false);
                  setShowMoreScreen(false);
                }}
                className="w-13 h-13 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-all cursor-pointer"
                title="Book OPD Appointment"
              >
                <Plus className="w-7 h-7 stroke-[3px]" />
              </button>
              <span className="text-[11px] font-bold text-slate-500 mt-1">{language === "hi" ? "बुक करें" : "Book"}</span>
            </div>

            {/* Records */}
            <button
              onClick={() => {
                setPatientTab("RECORDS");
                setShowSymptomChecker(false);
                setShowMedicalSearch(false);
                setShowFindSpecialist(false);
                setShowReportReader(false);
                setShowMoreScreen(false);
              }}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full text-[11px] font-bold ${patientTab === "RECORDS" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"} transition-all cursor-pointer`}
            >
              <ClipboardList className="w-[22px] h-[22px]" />
              <span>{language === "hi" ? "रिकॉर्ड" : "Records"}</span>
            </button>

            {/* Profile */}
            <button
              onClick={() => {
                setPatientTab("PROFILE");
                setShowSymptomChecker(false);
                setShowMedicalSearch(false);
                setShowFindSpecialist(false);
                setShowReportReader(false);
                setShowMoreScreen(false);
              }}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full text-[11px] font-bold ${patientTab === "PROFILE" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"} transition-all cursor-pointer`}
            >
              <User className="w-[22px] h-[22px]" />
              <span>{language === "hi" ? "प्रोफाइल" : "Profile"}</span>
            </button>

          </div>

          {/* --- APPOINTMENT DETAILS SCREEN OVERLAY --- */}
          {showAppointmentDetails && selectedAppointment && (() => {
            const currentDoc = doctorsList.find(d => d.id === selectedAppointment.doctorId) || MOCK_DOCTORS.find(d => d.id === selectedAppointment.doctorId);
            const isLab = selectedAppointment.doctorId === "lab-technician";
            
            // Helper to get formatted status text and colors
            let bannerBg = "bg-emerald-50/75 border-emerald-100/80 text-emerald-800";
            let bannerIcon = <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />;
            let bannerTitle = "Your appointment is completed";
            let bannerDesc = "We hope your consultation went well.";
            
            if (selectedAppointment.status === "Upcoming" || selectedAppointment.status === "Confirmed") {
              bannerBg = "bg-blue-50/75 border-blue-100/80 text-blue-800";
              bannerIcon = <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />;
              bannerTitle = "Your appointment is confirmed";
              bannerDesc = "We look forward to seeing you at the scheduled time.";
            } else if (selectedAppointment.status === "Cancelled") {
              bannerBg = "bg-rose-50/75 border-rose-100/80 text-rose-800";
              bannerIcon = <X className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />;
              bannerTitle = "Your appointment is cancelled";
              bannerDesc = "The slot has been freed up.";
            }

            // Date parsing fallbacks
            const dayNum = selectedAppointment.dayNum || selectedAppointment.date.split("-")[2] || "18";
            const monthName = selectedAppointment.month || "May";
            const dayName = selectedAppointment.dayName || "Sun";

            // Submit cancellation handler
            const handleCancelAppointment = () => {
              const updatedList = appointmentsList.map(a => 
                a.id === selectedAppointment.id ? { ...a, status: "Cancelled" as const } : a
              );
              setAppointmentsList(updatedList);
              setSelectedAppointment(null);
              setShowAppointmentDetails(false);
              triggerToast("Appointment cancelled successfully!");
            };

            // Submit review handler
            const handleAddReview = (e: React.FormEvent) => {
              e.preventDefault();
              if (!currentDoc) return;
              
              // 1. Update appointment to reviewed
              const updatedAppts = appointmentsList.map(a => 
                a.id === selectedAppointment.id ? { 
                  ...a, 
                  reviewed: true, 
                  reviewRating: reviewRating,
                  reviewComment: reviewComment
                } : a
              );
              setAppointmentsList(updatedAppts);
              setSelectedAppointment({ 
                ...selectedAppointment, 
                reviewed: true, 
                reviewRating: reviewRating,
                reviewComment: reviewComment 
              });

              // 2. Update doctor reviews rating
              const currentCount = currentDoc.reviewsCount || 0;
              const currentRating = currentDoc.rating || 5.0;
              const newCount = currentCount + 1;
              const newRating = Number(((currentRating * currentCount + reviewRating) / newCount).toFixed(1));

              const updatedDocs = doctorsList.map(d => 
                d.id === currentDoc.id ? { ...d, rating: newRating, reviewsCount: newCount } : d
              );
              setDoctorsList(updatedDocs);
              
              // 3. Reset and notify
              setShowReviewModal(false);
              setReviewComment("");
              triggerToast(`Review submitted! ${currentDoc.name.startsWith("Dr.") ? currentDoc.name : `Dr. ${currentDoc.name}`} is now rated ${newRating} ★.`);
            };

            // Submit reschedule handler
            const handleReschedule = (e: React.FormEvent) => {
              e.preventDefault();
              if (!rescheduleDate || !rescheduleTime) {
                alert("Please select both date and time slot.");
                return;
              }

              const d = new Date(rescheduleDate);
              const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              
              const parsedMonth = months[d.getMonth()];
              const parsedDayNum = String(d.getDate());
              const parsedDayName = days[d.getDay()];

              const updatedAppts = appointmentsList.map(a => 
                a.id === selectedAppointment.id ? { 
                  ...a, 
                  date: rescheduleDate,
                  month: parsedMonth,
                  dayNum: parsedDayNum,
                  dayName: parsedDayName,
                  time: rescheduleTime,
                  status: "Upcoming" as const
                } : a
              );
              setAppointmentsList(updatedAppts);
              setSelectedAppointment({
                ...selectedAppointment,
                date: rescheduleDate,
                month: parsedMonth,
                dayNum: parsedDayNum,
                dayName: parsedDayName,
                time: rescheduleTime,
                status: "Upcoming" as const
              });

              setShowRescheduleModal(false);
              triggerToast("Appointment rescheduled successfully!");
            };

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed inset-0 bg-slate-50 z-[200] overflow-y-auto pb-28 text-left"
              >
                {/* Top Navigation Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 px-5 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm">
                  <button 
                    onClick={() => setShowAppointmentDetails(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-extrabold text-slate-900 text-[16px] tracking-tight">Appointment Details</h3>
                  <button className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer">
                    <MoreHorizontal className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                <div className="px-5 py-6 space-y-5 max-w-md mx-auto">
                  {/* Status Banner */}
                  <div className={`border p-4 rounded-2xl flex gap-3.5 shadow-sm transition-colors ${bannerBg}`}>
                    {bannerIcon}
                    <div>
                      <p className="font-black text-sm tracking-tight">{bannerTitle}</p>
                      <p className="text-[12px] font-semibold opacity-90 mt-0.5 leading-tight">{bannerDesc}</p>
                    </div>
                  </div>
                  
                  {/* Doctor Info Card */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-4 shadow-sm items-center">
                    {/* Left Date indicator */}
                    <div className="w-16 h-16 rounded-xl bg-blue-50/85 border border-blue-100/70 flex flex-col items-center justify-center text-center shrink-0">
                      <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider leading-none">{monthName}</span>
                      <span className="text-2xl font-black text-blue-600 leading-tight my-0.5">{dayNum}</span>
                      <span className="text-[10px] font-bold text-blue-400 leading-none">{dayName}</span>
                    </div>

                    {/* Right Doctor text info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex gap-2 items-center">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {isLab ? "🧪" : (currentDoc?.avatar || "DR")}
                        </div>
                        <h4 className="font-black text-slate-900 text-sm leading-tight truncate">
                          {isLab ? "CareGrid Labs" : (currentDoc?.name || "Doctor Specialist")}
                        </h4>
                      </div>
                      <p className="text-xs text-blue-600 font-bold mt-1.5 flex items-center gap-1">
                        <span>{isLab ? "Diagnostic Lab Tests" : (currentDoc?.specialty || "Specialist")}</span>
                        {!isLab && currentDoc?.rating && (
                          <span className="text-amber-500 font-black ml-1">★ {currentDoc.rating}</span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-tight truncate">
                        {currentDoc?.hospitalName || "CareGrid Associated Hospital"}
                      </p>
                    </div>
                  </div>

                  {/* Date, Timing, & Address Details Block */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm">
                    {/* Timing */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">Appointment Time</p>
                        <p className="text-xs font-extrabold text-slate-800 mt-1">{selectedAppointment.time} · {selectedAppointment.date}</p>
                      </div>
                    </div>

                    {/* Service Type */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">Appointment Type</p>
                        <p className="text-xs font-extrabold text-slate-800 mt-1">{selectedAppointment.type || "OPD Consultation"}</p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">Location & Address</p>
                        <p className="text-xs font-extrabold text-slate-800 mt-1">{currentDoc?.hospitalName || "CareGrid Associated Hospital"}</p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Sector 45, Gurugram, Haryana 122003</p>
                      </div>
                    </div>
                  </div>

                  {/* Reason for Visit Block */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-2.5 shadow-sm">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Reason for Visit</h4>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      {selectedAppointment.symptoms || selectedAppointment.notes || "Routine physical wellness checkup and general consultation."}
                    </p>
                  </div>

                  {/* Diagnosis & Prescription if Completed */}
                  {selectedAppointment.status === "Completed" && (
                    <>
                      {selectedAppointment.diagnosis && (
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-2 shadow-sm">
                          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Diagnosis (Summary)</h4>
                          <p className="text-xs text-slate-600 font-semibold leading-relaxed">{selectedAppointment.diagnosis}</p>
                        </div>
                      )}
                      {selectedAppointment.prescriptionId && (
                        <button className="flex items-center justify-between text-left w-full bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 p-4 rounded-2xl shadow-sm transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-emerald-600" />
                            <div>
                              <p className="font-extrabold text-slate-800 text-xs">Medical Prescription</p>
                              <p className="text-[10px] text-emerald-700 font-semibold">Code: {selectedAppointment.prescriptionId}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-emerald-600" />
                        </button>
                      )}
                    </>
                  )}

                  {/* Action Section "What would you like to do?" */}
                  <div className="space-y-3.5 pt-4">
                    <h4 className="font-black text-slate-900 text-[14px]">What would you like to do?</h4>
                    
                    <div className="space-y-3">
                      {/* REVIEW DOCTOR ROW (COMPLETED STATUS ONLY) */}
                      {selectedAppointment.status === "Completed" && (
                        <>
                          {selectedAppointment.reviewed ? (
                            /* Already Reviewed State - APPEARS DIFFERENT (Aesthetic Green Completed look) */
                            <div className="border border-emerald-100 bg-emerald-50/40 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                  <Star className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-800 text-xs">Review Submitted ✓</p>
                                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">You rated {currentDoc?.name ? (currentDoc.name.startsWith("Dr.") ? currentDoc.name : `Dr. ${currentDoc.name}`) : "Doctor"} with {selectedAppointment.reviewRating || 5} Stars.</p>
                                </div>
                              </div>
                              <span className="bg-emerald-100/80 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-lg">Done</span>
                            </div>
                          ) : (
                            /* Not Reviewed Yet State */
                            <button 
                              onClick={() => {
                                setReviewRating(5);
                                setReviewComment("");
                                setShowReviewModal(true);
                              }}
                              className="w-full text-left bg-white hover:bg-amber-50/40 border border-slate-100 hover:border-amber-100 p-4 rounded-2xl flex items-center justify-between shadow-sm transition-all group"
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-500 flex items-center justify-center shrink-0 transition-colors">
                                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-800 text-xs">Review Doctor</p>
                                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Share your experience to help other patients</p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          )}
                        </>
                      )}

                      {/* CALENDAR SYNC, CANCEL & RESCHEDULE OPTIONS (UPCOMING STATUS ONLY) */}
                      {(selectedAppointment.status === "Upcoming" || selectedAppointment.status === "Confirmed") && (
                        <div className="space-y-3">
                          <CalendarSyncButton
                            eventDetails={{
                              title: `Consultation with ${currentDoc?.name || 'Doctor'}`,
                              doctorName: currentDoc?.name || "Doctor Specialist",
                              specialty: currentDoc?.specialty || "Specialist",
                              hospitalName: currentDoc?.hospitalName || "CareGrid Associated Hospital",
                              dateStr: selectedAppointment.date,
                              timeStr: selectedAppointment.time,
                              appointmentId: selectedAppointment.id,
                              symptoms: selectedAppointment.symptoms || selectedAppointment.notes
                            }}
                            language={language}
                            variant="secondary"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            {/* Cancel button */}
                            <button 
                              onClick={handleCancelAppointment}
                              className="bg-white hover:bg-rose-50/50 border border-slate-100 hover:border-rose-100 p-4 rounded-2xl flex flex-col gap-2.5 items-center text-center shadow-sm transition-all group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center transition-colors">
                                <X className="w-5 h-5 font-black" />
                              </div>
                              <span className="font-extrabold text-xs text-slate-700">Cancel Slot</span>
                            </button>

                            {/* Reschedule button */}
                            <button 
                              onClick={() => {
                                setRescheduleDate(selectedAppointment.date || "2026-07-25");
                                setRescheduleTime(selectedAppointment.time || "10:00 AM");
                                setShowRescheduleModal(true);
                              }}
                              className="bg-white hover:bg-blue-50/50 border border-slate-100 hover:border-blue-100 p-4 rounded-2xl flex flex-col gap-2.5 items-center text-center shadow-sm transition-all group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center transition-colors">
                                <Calendar className="w-5 h-5" />
                              </div>
                              <span className="font-extrabold text-xs text-slate-700">Reschedule</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Fallback support contact */}
                      <div className="border border-dashed border-slate-200/80 bg-slate-50/50 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-700 text-xs">Need help or support?</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Contact Hospital Support Desk 24x7</p>
                        </div>
                        <button className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl shadow transition-colors cursor-pointer">
                          Call Support
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- INNER OVERLAY MODAL: REVIEW SYSTEM --- */}
                {showReviewModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[300] flex items-center justify-center p-5 no-invert">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-slate-100 text-left p-5 space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h4 className="font-black text-slate-900 text-[15px]">Write a Review</h4>
                        <button 
                          onClick={() => setShowReviewModal(false)}
                          className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex gap-2.5 items-center">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">
                          {currentDoc?.avatar || "DR"}
                        </div>
                        <div>
                          <h5 className="font-extrabold text-slate-900 text-xs">{currentDoc?.name ? (currentDoc.name.startsWith("Dr.") ? currentDoc.name : `Dr. ${currentDoc.name}`) : "Specialist"}</h5>
                          <p className="text-[10.5px] text-blue-600 font-bold leading-none mt-0.5">{currentDoc?.specialty}</p>
                        </div>
                      </div>

                      <form onSubmit={handleAddReview} className="space-y-4">
                        {/* Star Rating Select */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Star Rating</label>
                          <div className="flex gap-1.5 justify-start">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="p-1 hover:scale-115 transition-transform cursor-pointer"
                              >
                                <Star 
                                  className={`w-7 h-7 transition-colors ${
                                    star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                  }`} 
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comment Input */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Feedback / Experience</label>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            rows={3}
                            placeholder="Write about your treatment experience, wait time, doctor's response..."
                            className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                            required
                          />
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                        >
                          Submit Review & Star Rating
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}

                {/* --- INNER OVERLAY MODAL: RESCHEDULE SYSTEM --- */}
                {showRescheduleModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[300] flex items-center justify-center p-5 no-invert">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-slate-100 text-left p-5 space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h4 className="font-black text-slate-900 text-[15px]">Reschedule Appointment</h4>
                        <button 
                          onClick={() => setShowRescheduleModal(false)}
                          className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleReschedule} className="space-y-4">
                        {/* New Date picker */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Select New Date</label>
                          <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
                            required
                          />
                        </div>

                        {/* New Time Slot Selector */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Select New Time Slot</label>
                          <div className="grid grid-cols-2 gap-2">
                            {["09:00 AM", "10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setRescheduleTime(t)}
                                className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                                  rescheduleTime === t
                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer mt-2"
                        >
                          Confirm Rescheduling
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}

              </motion.div>
            );
          })()}

          {/* --- HOSPITAL DETAILS SCREEN OVERLAY --- */}
          {selectedHospitalForDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 bg-white z-[200] overflow-y-auto pb-28 text-left"
            >
              {/* Top Navigation Header */}
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-30 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <button 
                  onClick={() => setSelectedHospitalForDetails(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-extrabold text-slate-900 text-[15px]">Hospital Details</h3>
                <button 
                  onClick={() => {
                    const isFav = favoriteHospitals.includes(selectedHospitalForDetails.name);
                    if (isFav) {
                      setFavoriteHospitals(prev => prev.filter(n => n !== selectedHospitalForDetails.name));
                    } else {
                      setFavoriteHospitals(prev => [...prev, selectedHospitalForDetails.name]);
                    }
                  }}
                  className={`w-9 h-9 rounded-full ${
                    favoriteHospitals.includes(selectedHospitalForDetails.name) ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'
                  } flex items-center justify-center transition-colors cursor-pointer`}
                >
                  <Heart className={`w-5 h-5 ${favoriteHospitals.includes(selectedHospitalForDetails.name) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              {/* Hero Image */}
              <div className="w-full h-56 sm:h-64 relative bg-slate-800">
                <img 
                  src={selectedHospitalForDetails.image || "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=800&auto=format&fit=crop"} 
                  alt={selectedHospitalForDetails.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Main Info Overlay Card */}
              <div className="-mt-8 relative z-20 bg-white rounded-t-[32px] p-5 border-t border-slate-100 space-y-5 shadow-lg">
                {/* Title + Verified badge */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-slate-900 text-xl tracking-tight leading-tight">
                      {selectedHospitalForDetails.name}
                    </h2>
                    <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0" title="Verified">
                      ✓
                    </div>
                  </div>

                  {/* Star Rating & Subtitle */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{selectedHospitalForDetails.rating || 4.8}</span>
                      <span className="text-slate-400 font-medium">({selectedHospitalForDetails.reviewsCount || 1280} Reviews)</span>
                    </div>
                  </div>
                  <p className="text-xs font-extrabold text-slate-400 mt-1">Multi Speciality Hospital</p>

                  {/* Accreditations Badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-rose-50/80 text-rose-700 font-extrabold text-[11px] px-3 py-1 rounded-full border border-rose-100/60 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                      <span>{selectedHospitalForDetails.accredited || "NABH Accredited"}</span>
                    </span>
                    <span className="bg-red-50/80 text-red-700 font-extrabold text-[11px] px-3 py-1 rounded-full border border-red-100/60 flex items-center gap-1">
                      <Ambulance className="w-3.5 h-3.5 text-red-600" />
                      <span>{selectedHospitalForDetails.emergencyService || "24/7 Emergency"}</span>
                    </span>
                  </div>
                </div>

                {/* Quick Action Circular Buttons */}
                <div className="grid grid-cols-4 gap-3 py-3 border-y border-slate-100 text-center">
                  <a 
                    href={`tel:${selectedHospitalForDetails.phone || '+911412567890'}`}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-600">Call</span>
                  </a>

                  <button 
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedHospitalForDetails.name + ' ' + selectedHospitalForDetails.address)}`)}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-600">Direction</span>
                  </button>

                  <a 
                    href={selectedHospitalForDetails.website || "https://hospyn.com"}
                    target="_blank" 
                    rel="noreferrer"
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                      <Globe className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-600">Website</span>
                  </a>

                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: selectedHospitalForDetails.name, text: selectedHospitalForDetails.address });
                      } else {
                        alert("Hospital info copied to clipboard!");
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-600">Share</span>
                  </button>
                </div>

                {/* About Hospital */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-sm">About Hospital</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {selectedHospitalForDetails.about || `${selectedHospitalForDetails.name} is a leading multi-speciality hospital offering advanced healthcare with world-class technology and expert doctors.`}
                  </p>
                </div>

                {/* Key Highlights */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-sm">Key Highlights</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-700 leading-tight">
                        {`${selectedHospitalForDetails.doctors?.length || 5} Aligned Specialists`}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-100/60 text-purple-600 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-700 leading-tight">
                        {selectedHospitalForDetails.icuCount || "10+ Advanced ICUs"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100/60 text-emerald-600 flex items-center justify-center shrink-0">
                        <BedDouble className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-700 leading-tight">
                        {selectedHospitalForDetails.bedsCount || "350+ Beds Capacity"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100/60 text-indigo-600 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-700 leading-tight">
                        Latest Technology
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-100/60 text-rose-600 flex items-center justify-center shrink-0">
                        <HeartPulse className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-700 leading-tight">
                        24/7 Emergency Care
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100/60 text-amber-600 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-extrabold text-slate-700 leading-tight">
                        Patient First Approach
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specialists at this hospital */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-slate-900 text-sm">Specialists ({selectedHospitalForDetails.doctors.length})</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedHospitalForDetails.doctors.map((doc) => (
                      <div key={doc.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                            {doc.avatar}
                          </div>
                          <div>
                            <h5 className="font-extrabold text-slate-900 text-xs">{doc.name}</h5>
                            <span className="text-[10px] font-bold text-blue-600 block mt-0.5">{doc.specialty} • {doc.experience} • <span className="text-emerald-700 font-extrabold">₹{doc.fee || 800} Fee</span></span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedHospital(selectedHospitalForDetails);
                            setSelectedDoctor(doc);
                            setBookingStep(1);
                            setShowBookingWizard(true);
                            setSelectedHospitalForDetails(null);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-xl shadow-xs cursor-pointer"
                        >
                          Book OPD
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fixed Sticky Bottom CTA Button */}
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-slate-100 p-4 z-40 shadow-[0_-5px_25px_rgba(0,0,0,0.05)]">
                <button 
                  onClick={() => {
                    setSelectedHospital(selectedHospitalForDetails);
                    setSelectedDept("");
                    setSelectedDoctor(null);
                    setBookingStep(1);
                    setShowBookingWizard(true);
                    setSelectedHospitalForDetails(null);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all cursor-pointer"
                >
                  <Calendar className="w-4.5 h-4.5" />
                  <span>Book Appointment</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* SECONDARY SCREEN WIDGETS OVERLAYS */}
          {showSymptomChecker && (
            <div className="fixed inset-0 overflow-y-auto bg-white z-50 p-4 md:p-6 text-left" id="symptom-overlay">
              <SymptomChecker onBack={() => setShowSymptomChecker(false)} language={language} />
            </div>
          )}

          {/* AI Search Overlay */}
          {showMedicalSearch && (
            <div className="fixed inset-0 overflow-y-auto bg-white z-50 p-4 md:p-6 text-left" id="search-overlay">
              <MedicalSearch onBack={() => setShowMedicalSearch(false)} language={language} />
            </div>
          )}

          {/* Find Specialist Overlay (Modern UI matching mockups) */}
          {showFindSpecialist && (
            <div className="fixed inset-0 overflow-y-auto bg-white z-50 p-4 md:p-6 text-left" id="specialist-overlay">
              <FindSpecialist 
                onBack={() => setShowFindSpecialist(false)} 
                onBookDoctor={handleBookDoctorDirectly}
              />
            </div>
          )}

          {/* AI Scanner / Report Reader Overlay */}
          {showReportReader && (
            <div className="fixed inset-0 overflow-y-auto bg-white z-50 p-4 md:p-6 text-left" id="reader-overlay">
              <AIReportReader 
                onBack={() => setShowReportReader(false)} 
                language={language}
                onRecordAdded={(rec) => {
                  setRecordsList(prev => [rec, ...prev]);
                  setShowReportReader(false);
                }}
              />
            </div>
          )}

          {/* More Screen Overlay */}
          {showMoreScreen && (
            <div className="fixed inset-0 overflow-y-auto bg-slate-50 z-[60] text-left" id="more-overlay">
              <MoreScreen 
                onBack={() => setShowMoreScreen(false)}
                onNavigateTab={(tab) => setPatientTab(tab)}
                onOpenSymptomChecker={() => setShowSymptomChecker(true)}
                onOpenReportReader={() => setShowReportReader(true)}
                onOpenFindSpecialist={() => setShowFindSpecialist(true)}
                onBookAppointment={() => setShowBookingWizard(true)}
                patientId={activePatient.id}
                patientName={activePatient.name}
                patientConditions={activePatient.chronicConditions || []}
                patientAllergies={activePatient.allergies || []}
                patientBloodGroup={activePatient.bloodGroup}
                patientPregnancy={activePatient.pregnancyStatus || ""}
                patientDob={activePatient.dob}
                onAddAppointment={(newAppt) => {
                  setAppointmentsList(prev => [newAppt, ...prev]);
                  setAppointmentTab("Lab Tests");
                }}
              />
            </div>
          )}

          
          {/* Upload Record Modal */}
          <AnimatePresence>
            {showUploadRecordModal && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center"
              >
                <motion.div
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full max-w-[480px] bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Upload Record</h3>
                      <p className="text-xs font-bold text-slate-500 mt-1">Add a document to your timeline</p>
                    </div>
                    <button onClick={() => setShowUploadRecordModal(false)} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleAddRecordSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Document Name</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[13px] font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        placeholder="e.g. Blood Test Results"
                        value={uploadRecordName}
                        onChange={(e) => setUploadRecordName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Category</label>
                      <select 
                        value={uploadRecordCategory}
                        onChange={(e) => setUploadRecordCategory(e.target.value as MedicalRecord["category"])}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-[13px] font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors appearance-none"
                      >
                        <option value="Lab Report">Lab Report</option>
                        <option value="Radiology Report">Radiology/Imaging</option>
                        <option value="Prescription">Prescription</option>
                        <option value="Discharge Summary">Discharge Summary</option>
                        <option value="Vaccination Record">Vaccination Record</option>
                        <option value="Other Document">Other Document</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">File</label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-blue-500 mb-2" />
                          <p className="text-xs font-bold text-slate-700">
                            {uploadRecordFile ? uploadRecordFile.name : "Click to select a file"}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*,application/pdf"
                          required
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadRecordFile(file);
                              if (!uploadRecordName) {
                                setUploadRecordName(file.name.replace(/.[^/.]+$/, ""));
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl text-sm transition-all"
                      >
                        Upload Document
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Record Preview Modal */}
          {previewRecord && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" id="record-preview-modal" onClick={() => setPreviewRecord(null)}>
              <div className="bg-white rounded-3xl p-5 w-full max-w-[400px] space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">📄</div>
                  <h4 className="font-extrabold text-slate-900 text-xs truncate flex-1">{previewRecord.name}</h4>
                  <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">Encrypted</span>
                </div>

                <div className="space-y-3" id="summary-meta-grid">
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 uppercase">
                    <div>
                      <span>Category</span>
                      <span className="text-slate-800 block text-xs font-extrabold mt-0.5">{previewRecord.category}</span>
                    </div>
                    <div>
                      <span>Uploaded Date</span>
                      <span className="text-slate-800 block text-xs font-extrabold mt-0.5">{previewRecord.date}</span>
                    </div>
                  </div>

                  {previewRecord.category === "Prescription" ? (
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 p-4 rounded-2xl border border-amber-100 text-left space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-amber-200/40 pb-2">
                        <Pill className="w-4 h-4 text-amber-600" />
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Medication Dosing Plan</span>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-white p-2.5 rounded-xl border border-amber-200/20 shadow-sm">
                          <h5 className="font-extrabold text-slate-800 text-xs">Pantocid 40mg</h5>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Acidity & Reflux Management</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="bg-white/70 p-2 rounded-xl text-[10px] font-bold text-slate-600 flex items-center gap-1.5 border border-slate-100">
                            <span>☀️ Morning</span>
                            <span className="text-emerald-600 font-black bg-emerald-50 px-1 py-0.5 rounded text-[8px] ml-auto">After Meal</span>
                          </div>
                          <div className="bg-white/70 p-2 rounded-xl text-[10px] font-bold text-slate-600 flex items-center gap-1.5 border border-slate-100">
                            <span>🌙 Evening</span>
                            <span className="text-emerald-600 font-black bg-emerald-50 px-1 py-0.5 rounded text-[8px] ml-auto">After Meal</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-amber-200/40">
                        {renderSummaryInPointers(previewRecord.summary)}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-left space-y-2">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase block tracking-wider">AI Insight &amp; Summary (Key Pointers)</span>
                      {previewRecord.summary ? (
                        renderSummaryInPointers(previewRecord.summary)
                      ) : (
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                          No AI explanation available. Use the Scanner tool to generate a summary.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadRecord(previewRecord)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report</span>
                  </button>
                  <button
                    onClick={() => setPreviewRecord(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-4 py-3 rounded-xl text-xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI-powered Medical Records Summary Drawer/Modal */}
          {showRecordsSummaryModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end justify-center" id="records-summary-modal" onClick={() => setShowRecordsSummaryModal(false)}>
              <div className="bg-white rounded-t-[32px] w-full max-w-[480px] max-h-[85vh] overflow-y-auto flex flex-col text-left shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/20">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Hospyn AI Summary</h3>
                      <p className="text-[10px] text-slate-400 font-bold">Cross-report medical health analysis</p>
                    </div>
                  </div>
                  <button onClick={() => setShowRecordsSummaryModal(false)} className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-100 p-1.5 rounded-full shrink-0">✕</button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Summary Header Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50/40 border border-emerald-100/50 p-3 rounded-2xl">
                      <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block">Clinical Status</span>
                      <span className="text-sm font-black text-emerald-900 block mt-1">Excellent (92%)</span>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-snug">Metabolic, cardiac and renal indicators are clear.</p>
                    </div>
                    <div className="bg-amber-50/40 border border-amber-100/50 p-3 rounded-2xl">
                      <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block">Key Focus Area</span>
                      <span className="text-sm font-black text-amber-900 block mt-1">Deficiency Control</span>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-snug">Vitamin D supplementation &amp; lipid panel check.</p>
                    </div>
                  </div>

                  {/* AI Comprehensive Explanation */}
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-400">Synthesized Insights</h4>
                    
                    <div className="space-y-2.5 text-xs text-slate-700 font-semibold leading-relaxed">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex gap-2.5 items-start">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] shrink-0 font-extrabold">1</div>
                        <p className="m-0 text-[11px]">
                          <strong>Cardiovascular &amp; Blood Pressure:</strong> Your blood pressure management under Dr. Priya Mehta has been highly successful. Your lipid profiles suggest mild borderline elevations, and mild aerobic exercise (e.g. 30 mins walking) is recommended to optimize HDL cholesterol levels.
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex gap-2.5 items-start">
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] shrink-0 font-extrabold">2</div>
                        <p className="m-0 text-[11px]">
                          <strong>Diagnostic Imaging Cleared:</strong> Recent MRI Brain (Jul 2026) and Chest X-Ray (Jun 2026) show completely normal physiological baselines, with no chronic pathology or abnormalities detected.
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex gap-2.5 items-start">
                        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] shrink-0 font-extrabold">3</div>
                        <p className="m-0 text-[11px]">
                          <strong>Nutritional Supplementation:</strong> Your vitamin levels show moderate Vitamin D deficiency (18 ng/mL). Active supplementation of Cholecalciferol 60K weekly for 8 weeks is underway and should show elevated results by next review.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3 pt-1">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-400">Chronological Care Timeline</h4>
                    <div className="border-l-2 border-slate-100 pl-4 space-y-4 ml-2">
                      <div className="relative">
                        <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white"></div>
                        <span className="text-[10px] font-black text-blue-600 block">JULY 2026</span>
                        <span className="text-xs font-black text-slate-900 block mt-0.5">Brain MRI scan &amp; Hematology clear</span>
                        <p className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5">Zero acute findings in intracranial analysis.</p>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white"></div>
                        <span className="text-[10px] font-black text-emerald-500 block">JUNE 2026</span>
                        <span className="text-xs font-black text-slate-900 block mt-0.5">Hypertension Treatment Slip</span>
                        <p className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5">Amlodipine 5mg daily prescribed with optimal outcome.</p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white"></div>
                        <span className="text-[10px] font-black text-indigo-500 block">MAY 2026</span>
                        <span className="text-xs font-black text-slate-900 block mt-0.5">Vaccination Booster Dose 3</span>
                        <p className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5">Successfully administered; complete immune response certificate generated.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="p-5 border-t border-slate-100 flex gap-2.5">
                  <button
                    onClick={handleDownloadFullSummary}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Summary</span>
                  </button>
                  <button
                    onClick={() => setShowRecordsSummaryModal(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-5 py-3.5 rounded-2xl text-xs transition-colors"
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* AI Clinical History Analysis Modal for Patient */}
          <AnimatePresence>
            {showHistoryAnalysisModal && historyAnalysisPatient && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" 
                id="history-analysis-modal" 
                onClick={() => setShowHistoryAnalysisModal(false)}
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 12 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-[32px] w-full max-w-[500px] max-h-[85vh] overflow-y-auto flex flex-col text-left shadow-2xl" 
                  onClick={(e) => e.stopPropagation()}
                >
                  
                  {/* Header */}
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">Clinical History Synthesis</h3>
                        <p className="text-[10px] text-slate-400 font-bold">Comprehensive Cross-Report Analysis</p>
                      </div>
                    </div>
                    <button onClick={() => setShowHistoryAnalysisModal(false)} className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-100 p-1.5 rounded-full shrink-0">✕</button>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    {/* Patient Quick Profile Badge */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center shadow-inner">
                        {historyAnalysisPatient.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      <div className="space-y-0.5 text-left">
                        <h4 className="font-black text-slate-900 text-sm leading-tight">{historyAnalysisPatient.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold">
                          Age {new Date().getFullYear() - new Date(historyAnalysisPatient.dob).getFullYear()} · {historyAnalysisPatient.gender} · Blood Group {historyAnalysisPatient.bloodGroup}
                        </p>
                      </div>
                    </div>

                    {/* AI Output or Loading */}
                    {isHistoryAnalyzing ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="relative flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                          <Sparkles className="w-5 h-5 text-indigo-600 absolute animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-800">Synthesizing Patient Dossier...</p>
                          <p className="text-[10px] text-slate-400 font-semibold max-w-[280px]">Our high-reasoning Gemini engine is analyzing clinical records, chronic status, and lab reports.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-left">
                        {/* Synthesized Output in Markdown style */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700 leading-relaxed space-y-2 whitespace-pre-wrap markdown-body">
                          <Markdown>{historyAnalysisResult}</Markdown>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-5 border-t border-slate-100 flex gap-2.5 bg-slate-50/50 rounded-b-[32px]">
                    <button
                      onClick={() => {
                        const element = document.createElement("a");
                        const file = new Blob([historyAnalysisResult], { type: 'text/plain' });
                        element.href = URL.createObjectURL(file);
                        element.download = `${historyAnalysisPatient.name.replace(/\s+/g, '_')}_Clinical_Synthesis.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      disabled={isHistoryAnalyzing || !historyAnalysisResult}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Dossier</span>
                    </button>
                    <button
                      onClick={() => setShowHistoryAnalysisModal(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold px-5 py-3 rounded-2xl text-xs transition-colors"
                    >
                      Close
                    </button>
                  </div>

                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Booking Wizard form block */}
          {showBookingWizard && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end justify-center" id="booking-wizard-modal" onClick={() => {
              if (bookingStep < 7) {
                setShowBookingWizard(false);
                setBookingStep(1);
              } else {
                setShowBookingWizard(false);
                setBookingStep(1);
                setPatientTab("APPOINTMENTS");
    setAppointmentTab("Upcoming");
              }
            }}>
              <div 
                className="bg-white rounded-t-[32px] w-full max-w-[480px] max-h-[90vh] overflow-y-auto flex flex-col text-left shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    {bookingStep > 1 && bookingStep < 7 && (
                      <button 
                        onClick={() => setBookingStep(prev => prev - 1)}
                        className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors -ml-1 mr-1"
                      >
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                      </button>
                    )}
                    <h4 className="font-extrabold text-slate-950 text-[16px]">
                      {bookingStep === 1 && "Book Appointment"}
                      {bookingStep === 2 && "AI Health Assistant"}
                      {bookingStep === 3 && "Recommended Specialists"}
                      {bookingStep === 4 && "Select Date"}
                      {bookingStep === 5 && "Select Time Slot"}
                      {bookingStep === 6 && "Review Appointment"}
                      {bookingStep === 7 && "Appointment Confirmed"}
                    </h4>
                  </div>
                  
                  {bookingStep < 7 ? (
                    <button 
                      onClick={() => {
                        setShowBookingWizard(false);
                        setBookingStep(1);
                      }} 
                      className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-extrabold text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      ✕
                    </button>
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </div>

                {/* Progress bar line */}
                {bookingStep < 7 && (
                  <div className="px-5 pt-3">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 mb-1.5">
                      <span className="text-blue-600">Step {bookingStep} of 6</span>
                      <span>
                        {bookingStep === 1 && "Symptoms"}
                        {bookingStep === 2 && "AI Analysis"}
                        {bookingStep === 3 && "Choose Specialist"}
                        {bookingStep === 4 && "Choose Date"}
                        {bookingStep === 5 && "Choose Time"}
                        {bookingStep === 6 && "Review & Confirm"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${(bookingStep / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Main Content Areas */}
                <div className="p-5 flex-1 overflow-y-auto">
                  
                  {/* STEP 1: Enter Symptoms */}
                  {bookingStep === 1 && (
                    <div className="space-y-5">
                      <div className="text-left">
                        <h3 className="text-[20px] font-black text-slate-950 leading-tight">What brings you here today?</h3>
                        <p className="text-[12px] text-slate-500 font-medium mt-1">Please select one or more symptoms</p>
                      </div>

                      {/* Symptom Search */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search symptoms..."
                          value={symptomSearch}
                          onChange={(e) => setSymptomSearch(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-[13px] font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        />
                      </div>

                      {/* Selected Symptoms list */}
                      {selectedSymptoms.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Selected Symptoms</span>
                          <div className="flex flex-wrap gap-2">
                            {selectedSymptoms.map(sym => (
                              <span 
                                key={sym} 
                                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[12px] font-bold px-3 py-1.5 rounded-full border border-blue-100/50"
                              >
                                {sym}
                                <button 
                                  onClick={() => setSelectedSymptoms(prev => prev.filter(s => s !== sym))}
                                  className="w-4 h-4 rounded-full hover:bg-blue-100 flex items-center justify-center text-blue-500"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Common Symptoms List */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Common Symptoms</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            "Chest Pain", "Shortness of Breath", "Fever", "Headache",
                            "Cough", "Fatigue", "Dizziness", "Stomach Pain", "Back Pain", "Sore Throat",
                            "Nausea", "Vomiting", "Diarrhea", "Constipation", "Joint Pain", "Muscle Pain",
                            "Rashes", "Itching", "Blurry Vision", "Earache", "Toothache", "Insomnia",
                            "Anxiety", "Depression", "Weight Loss", "Weight Gain", "Chest Tightness",
                            "Abdominal Pain", "Chest Congestion", "Loss of Appetite"
                          ]
                            .filter(s => s.toLowerCase().includes(symptomSearch.toLowerCase()))
                            .map(sym => {
                              const isSelected = selectedSymptoms.includes(sym);
                              return (
                                <button
                                  key={sym}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedSymptoms(prev => prev.filter(s => s !== sym));
                                    } else {
                                      setSelectedSymptoms(prev => [...prev, sym]);
                                    }
                                  }}
                                  className={`py-2.5 px-3 rounded-xl text-left text-[12px] font-bold border transition-all ${
                                    isSelected 
                                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100" 
                                      : "bg-white text-slate-700 border-slate-100 hover:border-slate-200"
                                  }`}
                                >
                                  {sym}
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* Add Custom Symptom inline */}
                      <div>
                        {showAddCustomSymptom ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="text"
                              placeholder="Enter other symptom..."
                              value={customSymptomInput}
                              onChange={(e) => setCustomSymptomInput(e.target.value.replace(/[^a-zA-Z\s-]/g, ""))}
                              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-[12px] font-bold text-slate-800 outline-none"
                            />
                            <button 
                              onClick={() => {
                                if (customSymptomInput.trim()) {
                                  if (customSymptomInput.trim().length < 3) {
                                    alert("Symptom name should be at least 3 characters.");
                                    return;
                                  }
                                  setSelectedSymptoms(prev => [...new Set([...prev, customSymptomInput.trim()])]);
                                  setCustomSymptomInput("");
                                  setShowAddCustomSymptom(false);
                                }
                              }}
                              className="bg-blue-600 text-white font-extrabold text-[12px] py-2 px-4 rounded-xl hover:bg-blue-700 transition-colors"
                            >
                              Add
                            </button>
                            <button 
                              onClick={() => setShowAddCustomSymptom(false)}
                              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowAddCustomSymptom(true)}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-extrabold text-[12px] hover:underline"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add other symptom</span>
                          </button>
                        )}
                      </div>

                      {/* Bottom Button */}
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <button
                          onClick={async (e) => {
                            if (selectedSymptoms.length === 0) {
                              alert("Please select at least one symptom.");
                              return;
                            }
                            
                            const btn = e.currentTarget;
                            const originalContent = btn.innerHTML;
                            btn.disabled = true;
                            btn.innerHTML = '<span class="flex items-center gap-2"><svg class="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analyzing Symptoms...</span>';

                            try {
                              const res = await fetch('/api/ai/recommend-specialty', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ symptoms: selectedSymptoms })
                              });
                              
                              let recommendation;
                              if (res.ok) {
                                recommendation = await res.json();
                              } else {
                                recommendation = recommendSpecialty(selectedSymptoms);
                              }
                              
                              setSelectedDept(recommendation.dept);
                              setAiRecommendation(recommendation);
                              setBookingStep(2);
                            } catch (error) {
                              console.error(error);
                              const recommendation = recommendSpecialty(selectedSymptoms);
                              setSelectedDept(recommendation.dept);
                              setAiRecommendation(recommendation);
                              setBookingStep(2);
                            } finally {
                              btn.disabled = false;
                              btn.innerHTML = originalContent;
                            }
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold py-3.5 rounded-xl text-[13px] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-100 active:scale-[0.99]"
                        >
                          <span>Analyze Symptoms</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Your data is secure and private</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: AI Health Assistant Analysis */}
                  {bookingStep === 2 && (
                    isFindingNearestDoctor ? (
                      <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4 min-h-[320px]">
                        {/* Animated Radar Scanning Visual */}
                        <div className="relative w-24 h-24 flex items-center justify-center my-2">
                          <div className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping opacity-75"></div>
                          <div className="absolute inset-2 rounded-full border-2 border-blue-500/30 animate-pulse bg-blue-50/60"></div>
                          <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Navigation className="w-7 h-7 animate-bounce" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm text-[10px] font-black border-2 border-white animate-pulse">
                            📍
                          </div>
                        </div>

                        <div className="space-y-1.5 max-w-xs">
                          <h4 className="font-extrabold text-slate-900 text-base flex items-center justify-center gap-2">
                            <span>Finding Nearest Doctors</span>
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          </h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            Scanning verified hospitals in your city for top <strong className="text-blue-600 font-extrabold">{selectedDept || "Specialist"}</strong> doctors...
                          </p>
                        </div>

                        {/* Animated Progress / Scanning steps */}
                        <div className="w-full max-w-xs bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-left space-y-2.5 mt-2">
                          <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-700">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                            <span>Locating active OPD schedules...</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-emerald-500 h-full rounded-full animate-pulse w-4/5 transition-all duration-1000"></div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-blue-500" /> Jaipur • Noida • Gurugram
                            </span>
                            <span className="text-blue-600 font-black">Matching...</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5 text-center">
                        {/* Interactive Robot Illustration */}
                        <div className="flex justify-center py-2">
                          <motion.div 
                            animate={{ y: [0, -6, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            className="relative"
                          >
                            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                              {/* Glow */}
                              <circle cx="60" cy="60" r="50" fill="#EFF6FF" />
                              <circle cx="60" cy="65" r="40" fill="#DBEAFE" opacity="0.6" />
                              {/* Body */}
                              <rect x="35" y="45" width="50" height="48" rx="20" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="4" />
                              {/* Face Screen */}
                              <rect x="42" y="52" width="36" height="20" rx="10" fill="#1E293B" />
                              {/* Eyes */}
                              <motion.circle 
                                cx="51" cy="62" r="3" fill="#38BDF8"
                                animate={{ scaleY: [1, 0.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 1 }}
                              />
                              <motion.circle 
                                cx="69" cy="62" r="3" fill="#38BDF8"
                                animate={{ scaleY: [1, 0.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 1 }}
                              />
                              {/* Head Antenna */}
                              <rect x="58" y="32" width="4" height="14" fill="#3B82F6" />
                              <circle cx="60" cy="28" r="5" fill="#3B82F6" />
                              {/* Sparkles on antenna */}
                              <circle cx="60" cy="28" r="9" stroke="#93C5FD" strokeWidth="1" strokeDasharray="3 3" className="animate-spin" />
                              {/* Pulse line inside body */}
                              <path d="M48 80h6l3-6 4 12 3-8 2 2h6" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span className="absolute bottom-1 right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                              <Check className="w-3 h-3 text-white stroke-[3px]" />
                            </span>
                          </motion.div>
                        </div>

                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-100">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>AI Analysis Complete</span>
                          </span>
                          <p className="text-[12px] text-slate-400 font-bold mt-1">Based on your symptoms</p>
                        </div>

                        {/* Department recommendation box */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Recommended Department</span>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                  {selectedDept === "Cardiology" ? (
                                    <Heart className="w-4 h-4 fill-blue-100" />
                                  ) : (
                                    <BriefcaseMedical className="w-4 h-4" />
                                  )}
                                </div>
                                <span className="text-[16px] font-black text-slate-900">{selectedDept}</span>
                              </div>
                            </div>
                            
                            {/* Priority badge */}
                            <div className="text-right">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Priority Level</span>
                              <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full mt-1 ${
                                aiRecommendation.priority === "URGENT" 
                                  ? "bg-red-50 text-red-600 border border-red-100 uppercase" 
                                  : aiRecommendation.priority === "HIGH"
                                  ? "bg-orange-50 text-orange-700 border border-orange-100 uppercase"
                                  : "bg-amber-50 text-amber-700 border border-amber-100 uppercase"
                              }`}>
                                {aiRecommendation.priority}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-start gap-2 text-[12px] font-medium text-slate-600 leading-snug">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>
                              {aiRecommendation.reason}
                            </span>
                          </div>
                        </div>

                        {/* Bottom Button */}
                        <div className="pt-4 border-t border-slate-100 space-y-2">
                          <button
                            onClick={handleViewRecommendedDoctors}
                            disabled={isFindingNearestDoctor}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-[13px] flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-100 active:scale-[0.99] disabled:opacity-80 cursor-pointer"
                          >
                            <span>View Recommended Doctors</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <p className="text-[10px] text-slate-400 font-semibold italic">This is an automated symptom categorization checklist and does not replace medical diagnostics.</p>
                        </div>
                      </div>
                    )
                  )}

                  {/* STEP 3: Recommended Specialists */}
                  {bookingStep === 3 && (
                    <div className="space-y-4">
                      {/* AI suggestions badge */}
                      <div className="bg-blue-50/50 border border-blue-100/60 rounded-xl p-3 flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <p className="text-[12px] text-blue-800 font-bold leading-tight text-left">
                          AI suggests these <strong>{selectedDept}</strong> specialists based on your health analysis.
                        </p>
                      </div>

                      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                        {/* List Specialists based on chosen category */}
                        {(() => {
                          const recommendedDocs = doctorsList.filter(d => 
                            (d.department || d.specialty || "Cardiology").toLowerCase() === (selectedDept || "Cardiology").toLowerCase()
                          );
                          const finalDocs = recommendedDocs.length > 0 ? recommendedDocs : doctorsList.filter(d => (d.department || d.specialty) === "Cardiology");
                          
                          return finalDocs.map((doc, idx) => (
                            <div key={doc.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-3.5 hover:border-slate-200 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-left relative">
                              {idx === 0 && (
                                <span className="absolute top-4 right-4 text-amber-400">
                                  <Sparkles className="w-4 h-4 fill-amber-400" />
                                </span>
                              )}
                              
                              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-extrabold flex items-center justify-center text-sm shrink-0 border-2 border-white shadow-sm overflow-hidden">
                                {doc.avatar || doc.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>

                              <div className="flex-1 space-y-1 min-w-0">
                                <h4 className="font-extrabold text-slate-900 text-[14px] flex items-center gap-1">
                                  {doc.name}
                                </h4>
                                <p className="text-[11px] text-slate-400 font-bold">{doc.specialty}</p>
                                <p className="text-[10px] text-slate-500 font-semibold">{doc.degree || "MBBS, MD"}</p>
                                
                                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-extrabold text-slate-500">
                                  <span className="flex items-center gap-0.5 text-amber-500">
                                    ★ {doc.rating || "4.8"} <span className="text-[9px] text-slate-400 font-medium">({doc.reviewsCount || "100"})</span>
                                  </span>
                                  <span className="text-slate-300">|</span>
                                  <span>{doc.experience || "8+ Years"} Exp</span>
                                  <span className="text-slate-300">|</span>
                                  <span className="inline-flex items-center gap-0.5 text-emerald-700 font-black bg-emerald-50 border border-emerald-100/80 px-2 py-0.5 rounded-md">
                                    <IndianRupee className="w-3 h-3" />
                                    <span>₹{doc.fee || 800} Fee</span>
                                  </span>
                                </div>

                                <div className="pt-2 flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3" />
                                    <span>Available Today</span>
                                  </span>
                                  
                                  <button
                                    onClick={() => {
                                      setSelectedDoctor(doc);
                                      const hospital = MOCK_HOSPITALS.find(h => h.name === doc.hospitalName) || MOCK_HOSPITALS[0];
                                      setSelectedHospital(hospital);
                                      setBookingStep(4);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
                                  >
                                    Select Doctor
                                  </button>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Choose Date */}
                  {bookingStep === 4 && (() => {
                    const months = [
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ];

                    const handlePrevMonth = () => {
                      setCurrentCalendarMonth(prev => {
                        if (prev === 0) {
                          setCurrentCalendarYear(y => y - 1);
                          return 11;
                        }
                        return prev - 1;
                      });
                    };

                    const handleNextMonth = () => {
                      setCurrentCalendarMonth(prev => {
                        if (prev === 11) {
                          setCurrentCalendarYear(y => y + 1);
                          return 0;
                        }
                        return prev + 1;
                      });
                    };

                    const getDaysInMonth = (year: number, month: number) => {
                      const firstDay = new Date(year, month, 1).getDay();
                      const totalDays = new Date(year, month + 1, 0).getDate();
                      const prevTotalDays = new Date(year, month, 0).getDate();
                      const days = [];
                      
                      // Previous month padding
                      for (let i = firstDay - 1; i >= 0; i--) {
                        days.push({
                          day: prevTotalDays - i,
                          isCurrentMonth: false,
                          month: month === 0 ? 11 : month - 1,
                          year: month === 0 ? year - 1 : year
                        });
                      }
                      
                      // Current month days
                      for (let i = 1; i <= totalDays; i++) {
                        days.push({
                          day: i,
                          isCurrentMonth: true,
                          month: month,
                          year: year
                        });
                      }
                      
                      // Next month padding to fill a 6-row grid (42 cells)
                      const remainingCells = 42 - days.length;
                      for (let i = 1; i <= remainingCells; i++) {
                        days.push({
                          day: i,
                          isCurrentMonth: false,
                          month: month === 11 ? 0 : month + 1,
                          year: month === 11 ? year + 1 : year
                        });
                      }
                      
                      return days;
                    };

                    const daysInMonth = getDaysInMonth(currentCalendarYear, currentCalendarMonth);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const defaultFormattedDate = getFormattedDateLabel(today);

                    return (
                      <div className="space-y-4">
                        {/* Month Switcher Header */}
                        <div className="flex items-center justify-between px-1">
                          <button 
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5 rotate-180" />
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {/* Month Dropdown Selector */}
                            <select
                              value={currentCalendarMonth}
                              onChange={(e) => setCurrentCalendarMonth(parseInt(e.target.value))}
                              className="bg-transparent font-extrabold text-[15px] text-slate-900 border-none focus:outline-none focus:ring-0 cursor-pointer pr-5 py-0"
                            >
                              {months.map((m, idx) => (
                                <option key={m} value={idx}>{m}</option>
                              ))}
                            </select>

                            {/* Year Dropdown Selector */}
                            <select
                              value={currentCalendarYear}
                              onChange={(e) => setCurrentCalendarYear(parseInt(e.target.value))}
                              className="bg-transparent font-extrabold text-[15px] text-slate-900 border-none focus:outline-none focus:ring-0 cursor-pointer pr-5 py-0"
                            >
                              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(yr => (
                                <option key={yr} value={yr}>{yr}</option>
                              ))}
                            </select>
                          </div>

                          <button 
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Day Name labels */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pb-1">
                          <span>Sun</span>
                          <span>Mon</span>
                          <span>Tue</span>
                          <span>Wed</span>
                          <span>Thu</span>
                          <span>Fri</span>
                          <span>Sat</span>
                        </div>

                        {/* High-Fidelity Calendar Days Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {daysInMonth.map((d, index) => {
                            const cellDate = new Date(d.year, d.month, d.day);
                            cellDate.setHours(0, 0, 0, 0);
                            const isPast = cellDate < today;
                            const formattedLabel = getFormattedDateLabel(cellDate);
                            const isSelected = selectedDate === formattedLabel || (!selectedDate && cellDate.getTime() === today.getTime());

                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  if (d.isCurrentMonth && !isPast) {
                                    setSelectedDate(formattedLabel);
                                  }
                                }}
                                disabled={!d.isCurrentMonth || isPast}
                                className={`h-11 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                                  !d.isCurrentMonth 
                                    ? "text-slate-200 pointer-events-none opacity-30" 
                                    : isPast 
                                      ? "text-slate-300 bg-slate-50/50 cursor-not-allowed opacity-50" 
                                      : isSelected 
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-100 scale-105" 
                                        : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-50"
                                }`}
                              >
                                <span>{d.day}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Date Card Summary */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3 mt-2 text-left">
                          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Selected Date</span>
                            <span className="text-[13px] font-black text-slate-800 block">
                              {selectedDate || defaultFormattedDate}
                            </span>
                          </div>
                        </div>

                        {/* Bottom action */}
                        <div className="pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedDate) {
                                setSelectedDate(defaultFormattedDate);
                              }
                              
                              // Auto-select the first available slot matching this doctor's timing
                              const morningSlots = ["08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"];
                              const afternoonSlots = ["01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"];
                              const eveningSlots = ["04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM"];
                              const allSlots = [...morningSlots, ...afternoonSlots, ...eveningSlots];
                              const validSlots = allSlots.filter(s => isSlotWithinTiming(s, selectedDoctor?.timing));
                              
                              if (validSlots.length > 0) {
                                if (!selectedTime || !validSlots.includes(selectedTime)) {
                                  setSelectedTime(validSlots[0]);
                                }
                              } else {
                                setSelectedTime("09:30 AM");
                              }

                              setBookingStep(5);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-[13px] transition-all active:scale-[0.99] shadow-md shadow-blue-100"
                          >
                            Continue
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* STEP 5: Choose Time Slot */}
                  {bookingStep === 5 && (
                    <div className="space-y-4">
                      {/* Doctor Mini-header Info card */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                          {selectedDoctor?.avatar || "SW"}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-extrabold text-slate-900 text-[13px]">{selectedDoctor?.name || "Dr. Sarah Wilson"}</h5>
                          <p className="text-[10px] text-blue-600 font-extrabold">{selectedDoctor?.specialty || "Senior Cardiologist"}</p>
                          <div className="flex flex-wrap gap-2 items-center mt-1">
                            <span className="text-[10px] text-slate-400 font-bold">{selectedDate || getFormattedDateLabel(new Date())}</span>
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100/60">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span className="text-[9px] font-black uppercase tracking-wider">Timing: {selectedDoctor?.timing || "09:00 AM - 05:00 PM"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Time Slots organized by period */}
                      <div className="space-y-4 text-left max-h-[320px] overflow-y-auto pr-1">
                        
                        {/* Morning Section */}
                        {["08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"].filter(slot => isSlotWithinTiming(slot, selectedDoctor?.timing)).length > 0 ? (
                          <div className="space-y-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Morning Slots</span>
                            <div className="grid grid-cols-3 gap-2">
                              {["08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"].filter(slot => isSlotWithinTiming(slot, selectedDoctor?.timing)).map(slot => {
                                const isSelected = selectedTime === slot;
                                return (
                                  <button
                                    key={slot}
                                    onClick={() => setSelectedTime(slot)}
                                    className={`py-2 px-1 rounded-xl text-center text-[12px] font-bold border transition-all ${
                                      isSelected 
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100 scale-102" 
                                        : "bg-white text-slate-700 border-slate-100 hover:border-slate-200"
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        {/* Afternoon Section */}
                        {["01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"].filter(slot => isSlotWithinTiming(slot, selectedDoctor?.timing)).length > 0 ? (
                          <div className="space-y-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Afternoon Slots</span>
                            <div className="grid grid-cols-3 gap-2">
                              {["01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"].filter(slot => isSlotWithinTiming(slot, selectedDoctor?.timing)).map(slot => {
                                const isSelected = selectedTime === slot;
                                return (
                                  <button
                                    key={slot}
                                    onClick={() => setSelectedTime(slot)}
                                    className={`py-2 px-1 rounded-xl text-center text-[12px] font-bold border transition-all ${
                                      isSelected 
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100 scale-102" 
                                        : "bg-white text-slate-700 border-slate-100 hover:border-slate-200"
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        {/* Evening Section */}
                        {["04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM"].filter(slot => isSlotWithinTiming(slot, selectedDoctor?.timing)).length > 0 ? (
                          <div className="space-y-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Evening Slots</span>
                            <div className="grid grid-cols-3 gap-2">
                              {["04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM"].filter(slot => isSlotWithinTiming(slot, selectedDoctor?.timing)).map(slot => {
                                const isSelected = selectedTime === slot;
                                return (
                                  <button
                                    key={slot}
                                    onClick={() => setSelectedTime(slot)}
                                    className={`py-2 px-1 rounded-xl text-center text-[12px] font-bold border transition-all ${
                                      isSelected 
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100 scale-102" 
                                        : "bg-white text-slate-700 border-slate-100 hover:border-slate-200"
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                      </div>

                      {/* Selected Slot summary banner */}
                      <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-3 text-center text-[12px] font-bold text-slate-600 flex items-center justify-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Selected Slot: {selectedDate || getFormattedDateLabel(new Date())}, {selectedTime || "09:30 AM"}</span>
                      </div>

                      {/* Bottom action */}
                      <div className="pt-4 border-t border-slate-100">
                        <button
                          onClick={() => {
                            if (!selectedTime) {
                              const morningSlots = ["08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"];
                              const afternoonSlots = ["01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"];
                              const eveningSlots = ["04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM"];
                              const allSlots = [...morningSlots, ...afternoonSlots, ...eveningSlots];
                              const validSlots = allSlots.filter(s => isSlotWithinTiming(s, selectedDoctor?.timing));
                              setSelectedTime(validSlots[0] || "09:30 AM");
                            }
                            setBookingStep(6);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-[13px] transition-all active:scale-[0.99] shadow-md shadow-blue-100"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 6: Review & Confirm */}
                  {bookingStep === 6 && (
                    <div className="space-y-4">
                      <div className="bg-blue-50/40 border border-blue-100/50 rounded-2xl p-4 text-[12px] text-slate-600 font-bold leading-normal text-left">
                        Please review your appointment details carefully before confirming.
                      </div>

                      {/* Structured details list */}
                      <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-100 text-left">
                        {/* Patient info row */}
                        <div className="p-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <User className="w-4.5 h-4.5 text-slate-400" />
                            <span className="text-[12px] text-slate-500 font-bold">Patient</span>
                          </div>
                          <span className="text-[12px] font-black text-slate-800">{activePatient?.name || "Vatsal Pandey"}</span>
                        </div>

                        {/* Specialist row */}
                        <div className="p-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Stethoscope className="w-4.5 h-4.5 text-slate-400" />
                            <span className="text-[12px] text-slate-500 font-bold">Specialist</span>
                          </div>
                          <span className="text-[12px] font-black text-slate-800">{selectedDoctor?.name || "Dr. Sarah Wilson"}</span>
                        </div>

                        {/* Department row */}
                        <div className="p-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Heart className="w-4.5 h-4.5 text-slate-400" />
                            <span className="text-[12px] text-slate-500 font-bold">Department</span>
                          </div>
                          <span className="text-[12px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{selectedDept || "Cardiology"}</span>
                        </div>

                        {/* Date row */}
                        <div className="p-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Calendar className="w-4.5 h-4.5 text-slate-400" />
                            <span className="text-[12px] text-slate-500 font-bold">Date</span>
                          </div>
                          <span className="text-[12px] font-black text-slate-800">{selectedDate || getFormattedDateLabel(new Date())}</span>
                        </div>

                        {/* Time row */}
                        <div className="p-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Clock className="w-4.5 h-4.5 text-slate-400" />
                            <span className="text-[12px] text-slate-500 font-bold">Time</span>
                          </div>
                          <span className="text-[12px] font-black text-slate-800">{selectedTime || "09:30 AM"}</span>
                        </div>

                        {/* Symptoms row */}
                        <div className="p-3.5 text-left space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4.5 h-4.5 text-slate-400" />
                            <span className="text-[12px] text-slate-500 font-bold">Symptoms</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {selectedSymptoms.map(sym => (
                              <span key={sym} className="bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md border border-slate-100">
                                • {sym}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Bottom actions */}
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <button
                          onClick={() => {
                            // Push to appointmentsList state
                            const finalDate = selectedDate || getFormattedDateLabel(new Date());
                            const finalTime = selectedTime || "09:30 AM";
                            const parsedDate = parseSelectedDate(finalDate);
                            const apptYear = isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear();
                            const randId = `APT-${apptYear}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10000 + Math.random() * 90000)}`;
                            setGeneratedApptId(randId);
                            setCopiedApptId(false);

                            const dayNumVal = isNaN(parsedDate.getTime()) ? "28" : parsedDate.getDate().toString();
                            const monthVal = isNaN(parsedDate.getTime()) ? "Aug" : parsedDate.toLocaleString('en-US', { month: 'short' });
                            const dayNameVal = isNaN(parsedDate.getTime()) ? "Thu" : parsedDate.toLocaleString('en-US', { weekday: 'short' });

                            const customAppt: Appointment = {
                              id: randId,
                              patientId: activePatient?.id || "pat-vatsal",
                              doctorId: selectedDoctor?.id || "doc-5",
                              date: finalDate,
                              month: monthVal,
                              dayNum: dayNumVal,
                              dayName: dayNameVal,
                              time: finalTime,
                              type: "OPD Consultation",
                              status: "Confirmed",
                              symptoms: selectedSymptoms.join(", ") || "General OPD Consultation"
                            };

                            setAppointmentsList(prev => [customAppt, ...prev]);

                            if (activePatient) {
                              setRegisteredPatients(prev => {
                                const exists = prev.some(p => p.id === activePatient.id || p.phone === activePatient.phone);
                                if (exists) return prev;
                                return [activePatient as StoredPatient, ...prev];
                              });
                            }

                            setBookingStep(7);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-[13px] transition-all active:scale-[0.99] shadow-md shadow-blue-100"
                        >
                          Confirm Appointment
                        </button>
                        <p className="text-[10px] text-slate-400 font-semibold text-center">
                          You can reschedule or cancel anytime from My Appointments
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP 7: Appointment Confirmed Success Screen */}
                  {bookingStep === 7 && (
                    <div className="space-y-5 text-center">
                      
                      {/* Big animated Check Icon with circles around */}
                      <div className="flex justify-center py-2">
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center relative"
                        >
                          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-white stroke-[3.5]" />
                          </div>
                          {/* Animated concentric circles */}
                          <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full animate-ping pointer-events-none" />
                        </motion.div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-[20px] font-black text-slate-900 leading-tight">Appointment Confirmed!</h3>
                        <p className="text-[12px] text-slate-400 font-bold">Your appointment has been successfully booked.</p>
                      </div>

                      {/* Appointment ID card with copy button */}
                      <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-4 flex items-center justify-between text-left">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Appointment ID</span>
                          <span className="text-[14px] font-black text-slate-800 font-mono tracking-tight block mt-0.5">
                            {generatedApptId || "APT-2027-0828-00124"}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedApptId || "APT-2027-0828-00124");
                            setCopiedApptId(true);
                            setTimeout(() => setCopiedApptId(false), 2000);
                          }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            copiedApptId 
                              ? "bg-emerald-50 text-emerald-600" 
                              : "bg-white hover:bg-slate-50 text-slate-500 border border-slate-100"
                          }`}
                        >
                          {copiedApptId ? (
                            <Check className="w-4 h-4 stroke-[3px]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Specialist details card summary */}
                      <div className="bg-white border border-slate-100 rounded-2xl p-4 text-left flex gap-3.5 shadow-sm">
                        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0 overflow-hidden border">
                          {selectedDoctor?.avatar || "SW"}
                        </div>
                        <div className="flex-1 space-y-0.5 min-w-0">
                          <h4 className="font-extrabold text-slate-950 text-[13.5px] truncate">
                            {selectedDoctor?.name || "Dr. Sarah Wilson"}
                          </h4>
                          <p className="text-[10.5px] text-blue-600 font-extrabold">
                            {selectedDoctor?.specialty || "Senior Cardiologist"}
                          </p>
                          <p className="text-[10.5px] text-slate-400 font-semibold truncate mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{selectedDoctor?.hospitalName || "CityCare Hospital, Delhi"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Summary details list */}
                      <div className="bg-[#F8FAFC]/60 rounded-2xl p-4 text-left text-[12px] font-bold text-slate-600 space-y-3 border border-slate-100/40">
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                          <span>Date: {selectedDate || getFormattedDateLabel(new Date())}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                          <span>Time: {selectedTime || "09:30 AM"}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                          <span>Location: Slot B3, {selectedDoctor?.hospitalName || "CityCare Hospital, Delhi"}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-slate-100 space-y-2.5">
                        <button
                          onClick={() => {
                            // Close wizard
                            setShowBookingWizard(false);
                            setBookingStep(1);
                            // Navigate to appointments list tab
                            setPatientTab("APPOINTMENTS");
    setAppointmentTab("Upcoming");
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-[13px] transition-all shadow-md shadow-blue-100"
                        >
                          View My Appointments
                        </button>
                        
                        <CalendarSyncButton
                          eventDetails={{
                            title: `Consultation with ${selectedDoctor?.name || 'Medical Specialist'}`,
                            doctorName: selectedDoctor?.name || "Dr. Sarah Wilson",
                            specialty: selectedDoctor?.specialty || "Senior Specialist",
                            hospitalName: selectedDoctor?.hospitalName || "CityCare Hospital, Delhi",
                            dateStr: selectedDate || getFormattedDateLabel(new Date()),
                            timeStr: selectedTime || "09:30 AM",
                            appointmentId: generatedApptId || "APT-CONFIRMED",
                            symptoms: selectedSymptoms.join(", ") || "OPD Consultation"
                          }}
                          language={language}
                          variant="primary"
                        />
                      </div>

                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── FORGOT_PASSWORD SCREEN ─── */}
      {screen === "FORGOT_PASSWORD" && (
        <div className="flex flex-col min-h-[100dvh] bg-[#F8FAFC] px-5 py-8" id="screen-forgot-password">
          <button onClick={() => {
            setScreen("LOGIN_OPTIONS");
            setForgotPasswordSent(false);
            setForgotPasswordEmail("");
          }} className="text-slate-800 hover:text-slate-900 mb-6 w-fit">
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-[28px] font-black text-slate-900 leading-tight">
              Reset Password
            </h2>
            <p className="text-slate-500 text-[13px] font-medium mt-2 max-w-xs">
              {forgotPasswordSent 
                ? "Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder."
                : "Enter the email associated with your account and we'll send you a link to reset your password."}
            </p>
          </div>

          {!forgotPasswordSent ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (forgotPasswordEmail) setForgotPasswordSent(true);
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-[13px] font-bold text-slate-800 outline-none focus:border-blue-500"
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] py-4 rounded-xl shadow-[0_8px_20px_-8px_rgba(37,99,235,0.5)] transition-all active:scale-[0.99] mt-4"
              >
                Send Reset Link
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setScreen("LOGIN_OPTIONS");
                setForgotPasswordSent(false);
                setForgotPasswordEmail("");
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[15px] py-4 rounded-xl transition-all active:scale-[0.99]"
            >
              Return to Login
            </button>
          )}
        </div>
      )}

      {/* ─── 7. DOCTOR_LOGIN SCREEN ─── */}
      {screen === "DOCTOR_LOGIN" && (
        <motion.div 
          className="flex flex-col h-[100dvh] max-h-[100dvh] bg-white relative overflow-hidden font-sans justify-between select-none" 
          id="screen-doctor-login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Decorative soft blue/indigo light ambient wave background elements */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-100/50 to-indigo-100/30 rounded-full blur-3xl pointer-events-none -translate-x-1/4 -translate-y-1/4 opacity-80" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-blue-50/70 to-indigo-50/30 rounded-full blur-3xl pointer-events-none translate-x-1/4 translate-y-1/4 opacity-80" />
          
          {/* Faint medical cross symbols with floating motion */}
          <motion.div
            className="absolute top-10 left-8 text-blue-300/60 pointer-events-none"
            animate={{ y: [-3, 3, -3], rotate: [0, 90, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </motion.div>
          <motion.div
            className="absolute top-1/4 right-8 text-blue-300/40 pointer-events-none"
            animate={{ y: [3, -3, 3], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </motion.div>
          <motion.div
            className="absolute bottom-28 left-6 text-blue-300/30 pointer-events-none"
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </motion.div>

          <div className="relative z-10 px-5 pt-3 sm:pt-4 flex flex-col flex-1 pb-4 justify-between min-h-0 overflow-hidden">
            
            {/* Top Back/Arrow Navigation & Hospyn Logo Block */}
            <div className="shrink-0">
              <div className="flex justify-between items-center w-full">
                <motion.button 
                  onClick={() => setScreen("LOGIN_OPTIONS")} 
                  className="text-slate-500 hover:text-slate-800 transition-colors p-1.5 -ml-1.5 rounded-full hover:bg-slate-100/50 cursor-pointer"
                  id="btn-doc-login-back"
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                </motion.button>
              </div>

              {/* Hospyn Logo Block */}
              <div className="flex flex-col items-center text-center mt-1 mb-1.5" id="doctor-logo-header">
                <div className="flex items-center justify-center p-2 sm:p-2.5 bg-white/90 rounded-2xl border border-slate-100 shadow-2xs mb-1">
                  <FallbackImage type="header-logo" className="text-[#0c2340] scale-95 sm:scale-100" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  Doctor Portal
                </span>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold mt-0.5 tracking-wide">
                  Where Every Hospital Becomes One
                </p>
              </div>
            </div>

            {/* High-Fidelity Circular Doctor Avatar Portrait with Organic Levitation */}
            <motion.div 
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-3 border-white bg-gradient-to-tr from-blue-50 to-blue-100 shadow-[0_10px_26px_rgba(37,99,235,0.12)] overflow-hidden relative flex items-center justify-center mx-auto shrink-0"
              animate={{ y: [-3, 3, -3], scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full select-none">
                <defs>
                  <linearGradient id="doctorPfpBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f0f7ff" />
                    <stop offset="100%" stopColor="#dbeafe" />
                  </linearGradient>
                  <linearGradient id="coatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f1f5f9" />
                  </linearGradient>
                </defs>
                
                {/* Background */}
                <circle cx="50" cy="50" r="48" fill="url(#doctorPfpBg)" />
                
                {/* Ears */}
                <circle cx="27" cy="49" r="4.5" fill="#ffe3d1" />
                <circle cx="73" cy="49" r="4.5" fill="#ffe3d1" />
                
                {/* Face/Head */}
                <path d="M31 47 C31 31, 69 31, 69 47 C69 61, 31 61, 31 47 Z" fill="#ffe3d1" />
                
                {/* Neck */}
                <rect x="43" y="55" width="14" height="12" fill="#ffd1b3" />
                
                {/* Hair - sleek, combed back */}
                <path d="M29 42 C29 23, 71 23, 71 42 C71 31, 29 31, 29 42" fill="#1e293b" />
                <path d="M31 38 C34 22, 66 19, 69 33" fill="#0f172a" />

                {/* Eyes */}
                <circle cx="42" cy="46" r="3" fill="#0f172a" />
                <circle cx="58" cy="46" r="3" fill="#0f172a" />
                <circle cx="43.2" cy="45.2" r="0.9" fill="#ffffff" />
                <circle cx="59.2" cy="45.2" r="0.9" fill="#ffffff" />
                
                {/* Eyebrows */}
                <path d="M37 41.5 Q42 39.5 45 41.5" stroke="#0f172a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M63 41.5 Q58 39.5 55 41.5" stroke="#0f172a" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                {/* Smart modern glasses */}
                <circle cx="42" cy="46" r="6.5" stroke="#334155" strokeWidth="2" fill="none" />
                <circle cx="58" cy="46" r="6.5" stroke="#334155" strokeWidth="2" fill="none" />
                <line x1="48.5" y1="46" x2="51.5" y2="46" stroke="#334155" strokeWidth="2" />
                <path d="M25 45 Q30 45 35.5 46" stroke="#334155" strokeWidth="1.2" fill="none" />
                <path d="M75 45 Q70 45 64.5 46" stroke="#334155" strokeWidth="1.2" fill="none" />

                {/* Warm pleasant smile */}
                <path d="M43 52 Q50 56.5 57 52" stroke="#0f172a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                
                {/* Light blue shirt collar */}
                <path d="M34 65 L66 65 L58 90 L42 90 Z" fill="#bae6fd" />
                {/* Royal blue tie */}
                <path d="M47.5 65 L52.5 65 L55.5 86 L50 90 L44.5 86 Z" fill="#1d4ed8" />
                
                {/* White doctor coat lapels */}
                <path d="M28 65 L44 65 L38 90 L22 90 Z" fill="url(#coatGrad)" stroke="#e2e8f0" strokeWidth="0.5" />
                <path d="M72 65 L56 65 L62 90 L78 90 Z" fill="url(#coatGrad)" stroke="#e2e8f0" strokeWidth="0.5" />
                
                {/* Doctor coat shoulders */}
                <path d="M18 75 C18 63, 33 65, 33 65 L38 90 L12 90 Z" fill="url(#coatGrad)" />
                <path d="M82 75 C82 63, 67 65, 67 65 L62 90 L88 90 Z" fill="url(#coatGrad)" />
                
                {/* Stethoscope */}
                <circle cx="50" cy="82" r="3.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="50" cy="82" r="1.5" fill="#475569" />
                <path d="M31 61 C31 77, 47 82, 50 82" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M69 61 C69 77, 53 82, 50 82" fill="none" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </motion.div>

            {/* Pulse heartbeat divider banner */}
            <div className="flex items-center justify-center gap-2 my-1 shrink-0" id="doctor-portal-divider">
              <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
                <svg className="w-8 h-4 text-blue-500" viewBox="0 0 50 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M0 12 L15 12 L19 6 L23 18 L26 9 L28 12 L50 12" />
                </svg>
              </motion.div>
              <span className="text-[#0c2340] font-black text-sm sm:text-base tracking-tight uppercase">
                Doctor Portal
              </span>
              <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
                <svg className="w-8 h-4 text-blue-500" viewBox="0 0 50 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M0 12 L22 12 L24 12 L26 15 L29 6 L33 18 L37 12 L50 12" />
                </svg>
              </motion.div>
            </div>

            {/* Form Headers */}
            <div className="text-center mb-1 shrink-0">
              <h2 className="text-base sm:text-lg font-extrabold text-[#0c2340] tracking-tight">
                Welcome Back, Doctor
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold mt-0.5">
                Sign in to continue to your hospital dashboard
              </p>
            </div>

            {/* Doctor Form Input Elements */}
            <form onSubmit={handleDoctorLoginSubmit} className="space-y-2.5 max-w-sm w-full mx-auto shrink-0" id="doctor-login-form">
              
              {/* User ID or Email input with badge */}
              <div className="flex items-center bg-[#f8fafc] border border-slate-200 rounded-xl py-1.5 px-2.5 shadow-2xs focus-within:border-blue-500 focus-within:bg-white transition-all">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 stroke-[2.2]" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="User ID or Email"
                  className="w-full bg-transparent border-none outline-none pl-3 text-xs sm:text-[13px] font-bold text-slate-800 placeholder-slate-400 py-1"
                  value={docUserId}
                  onChange={(e) => { setDocUserId(e.target.value); setDoctorLoginError(""); }}
                />
              </div>

              {/* Password input with badge and eye toggle */}
              <div className="flex items-center bg-[#f8fafc] border border-slate-200 rounded-xl py-1.5 px-2.5 shadow-2xs focus-within:border-blue-500 focus-within:bg-white transition-all relative">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 stroke-[2.2]" />
                </div>
                <input
                  type={showDocLoginPwd ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Password"
                  className="w-full bg-transparent border-none outline-none pl-3 pr-8 text-xs sm:text-[13px] font-bold text-slate-800 placeholder-slate-400 py-1"
                  value={docPassword}
                  onChange={(e) => { setDocPassword(e.target.value); setDoctorLoginError(""); }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowDocLoginPwd(!showDocLoginPwd)} 
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showDocLoginPwd ? <EyeOff className="w-4 h-4 stroke-[2.2]" /> : <Eye className="w-4 h-4 stroke-[2.2]" />}
                </button>
              </div>

              {/* Options Row (Remember me & Forgot Password) */}
              <div className="flex items-center justify-between text-[11px] px-1 pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={docRememberMe} 
                    onChange={(e) => setDocRememberMe(e.target.checked)} 
                    className="sr-only" 
                  />
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${docRememberMe ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"}`}>
                    {docRememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-slate-600 font-bold">Remember Me</span>
                </label>
                
                <button 
                  type="button" 
                  onClick={() => setScreen("FORGOT_PASSWORD")} 
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {doctorLoginError && (
                <div className="text-red-500 text-[11px] font-bold text-center bg-red-50 p-1.5 rounded-xl border border-red-100">
                  {doctorLoginError}
                </div>
              )}
              
              {/* Submission Button */}
              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 px-5 rounded-xl flex items-center justify-between text-xs sm:text-[13px] shadow-[0_6px_20px_rgba(37,99,235,0.25)] transition-all cursor-pointer"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Continue as Doctor</span>
                <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
              </motion.button>
            </form>
          </div>
        </motion.div>
      )}

      {/* ─── 8. DOCTOR_DASHBOARD SCREEN ─── */}
      {screen === "DOCTOR_DASHBOARD" && activeDoctor && (
        <div className={`flex flex-col min-h-screen bg-slate-50 font-sans pb-24 relative overflow-hidden ${isDoctorDarkMode ? "dark-theme-active" : ""}`} id="screen-doctor-dashboard">
          
          {/* HEADER */}
          <header className="px-5 pt-8 pb-4 bg-white sticky top-0 z-10 rounded-b-[2rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]">
            {/* Hospyn Doctor Portal Brand Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100" id="doctor-portal-brand-bar">
              <FallbackImage type="header-logo" className="text-[#0c2340]" />
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                Doctor Portal
              </span>
            </div>

            <div className="flex justify-between items-start">
              <button 
                type="button"
                className="text-left cursor-pointer hover:opacity-85 transition-opacity focus:outline-none" 
                onClick={() => setDoctorTab("Profile")}
                title="View Doctor Profile"
              >
                {doctorTab === "Home" ? (
                  <>
                    <span className="text-[13px] text-slate-500 font-bold block mb-1">Hello 👋</span>
                    <h1 className="text-[26px] font-black text-slate-900 tracking-tight leading-tight">{activeDoctor.name.startsWith("Dr.") ? activeDoctor.name : `Dr. ${activeDoctor.name}`}</h1>
                  </>
                ) : (
                  <div>
                    <h1 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight">{doctorTab}</h1>
                    <span className="text-[12px] text-slate-500 font-bold block">{activeDoctor.name.startsWith("Dr.") ? activeDoctor.name : `Dr. ${activeDoctor.name}`}</span>
                  </div>
                )}
              </button>
              <div className="flex items-center gap-2">
                <PWAInstallButton 
                  variant="header" 
                  language={language} 
                  isDarkMode={isDoctorDarkMode} 
                />
                <button
                  type="button"
                  onClick={toggleDoctorDarkMode}
                  className="w-[42px] h-[42px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs border border-slate-200/80 active:scale-95"
                  title={isDoctorDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  aria-label="Toggle Dark Mode"
                >
                  {isDoctorDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
                </button>
                <button 
                  type="button"
                  className="relative cursor-pointer w-[46px] h-[46px] rounded-full bg-blue-50 text-blue-700 border-2 border-blue-100 flex items-center justify-center font-black text-base shadow-sm hover:scale-105 active:scale-95 transition-transform overflow-visible focus:outline-none focus:ring-2 focus:ring-blue-400" 
                  onClick={() => setDoctorTab("Profile")}
                  title="View Doctor Profile"
                  aria-label="Open Doctor Profile"
                >
                  {activeDoctor.avatar && activeDoctor.avatar.startsWith("http") ? (
                    <img src={activeDoctor.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    activeDoctor.name.replace(/^Dr\.\s*/i, "").charAt(0).toUpperCase()
                  )}
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-xs"></div>
                </button>
              </div>
            </div>
          </header>

          <main className="px-5 pt-6 pb-20 space-y-6">
            {doctorTab === "Home" && (
              <div className="space-y-6">
                {/* HOSPYN HEALTH BRAIN CARD */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-[28px] p-5 shadow-[0_8px_30px_-12px_rgba(59,130,246,0.2)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <BrainCircuit className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[17px] font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                      Hospyn Health Brain <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">AI</span>
                    </h2>
                  </div>

                  <div className="mb-4 relative z-10">
                    <span className="text-[13px] font-semibold text-slate-600">Connected Hospitals: <span className="font-extrabold text-blue-600">12</span></span>
                  </div>

                  <div className="space-y-2 mb-6 relative z-10">
                    {[
                      { icon: FileText, text: "Unified Patient Records" },
                      { icon: Sparkles, text: "AI Report Analysis" },
                      { icon: Search, text: "Medical Search" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4 text-slate-400" strokeWidth={2.5} />
                        <span className="text-[13px] font-bold text-slate-700">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setShowMedicalSearch(true)} className="bg-blue-600 text-white font-extrabold text-[13px] px-5 py-3 rounded-full flex items-center justify-center gap-1.5 w-max hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 relative z-10">
                    Open Health Brain <ChevronRight className="w-4 h-4" strokeWidth={3} />
                  </button>
                  
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 pointer-events-none opacity-80">
                    <div className="w-[160px] h-[160px] bg-gradient-to-tr from-blue-200/40 to-indigo-300/40 rounded-full blur-2xl absolute"></div>
                    <img src="https://api.dicebear.com/9.x/shapes/svg?seed=brain&backgroundColor=transparent" alt="Brain Graphic" className="w-[180px] h-[180px] object-cover opacity-30 mix-blend-multiply drop-shadow-2xl" />
                  </div>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Appointments", value: (doctorQueue.filter(i => i.appointment).length > 0 ? doctorQueue.filter(i => i.appointment).length + 18 : 24).toString(), sub: "Today", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Patients Seen", value: "18", sub: "Today", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Queue", value: doctorQueue.length.toString(), sub: "Waiting", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
                    { label: "Prescriptions", value: "31", sub: "Today", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-sm flex flex-col justify-between h-[125px] transition-all duration-200 hover:shadow-md hover:border-blue-100">
                      <div className="flex justify-between items-center w-full">
                        <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}>
                          <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} strokeWidth={2.5} />
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${stat.color} ${stat.bg} whitespace-nowrap`}>{stat.sub}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-normal block mb-1 leading-snug" title={stat.label}>{stat.label}</span>
                        <span className="text-2xl font-black text-slate-900 leading-none block">{stat.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* NEXT PATIENT CARD */}
                {doctorQueue.length > 0 && (() => {
                  const nextItem = doctorQueue[0];
                  const pat = nextItem.patient;
                  const appt = nextItem.appointment;
                  const initials = pat.name.split(" ").map(n => n[0]).join("").toUpperCase();
                  const age = new Date().getFullYear() - new Date(pat.dob).getFullYear();
                  
                  return (
                    <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                          <div className="w-[60px] h-[60px] bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xl font-bold border border-slate-100 shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <span className="text-[10px] bg-blue-50 text-blue-600 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                              {appt ? "Booked Appointment" : "Next Patient"}
                            </span>
                            <h3 className="text-lg font-black text-slate-900 leading-tight">{pat.name}</h3>
                            <span className="text-[13px] font-bold text-slate-500 block mt-0.5">
                              {age} Y • {pat.gender} • {pat.bloodGroup}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-blue-600 justify-end mb-1">
                            <Clock className="w-4 h-4" strokeWidth={2.5} />
                            <span className="text-sm font-black">{appt?.time || "09:30 AM"}</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400">{appt?.date || "OPD - 3"}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-blue-100/50">
                            <Activity className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.5} />
                            <span className="text-xs font-bold text-slate-700">
                              {appt?.symptoms || "Fever • Headache"}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => triggerDoctorConsultation(pat.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[14px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200"
                        >
                          Start Consultation <ChevronRight className="w-4 h-4" strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Today's Smart Queue */}
                <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm flex flex-col justify-between mb-5">
                  <div>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-[14px] font-black text-slate-900">Today's Smart Queue</h3>
                      <span className="text-[11px] font-extrabold text-blue-600 cursor-pointer hover:underline" onClick={() => setDoctorTab("Queue")}>View All</span>
                    </div>
                    
                    <div className="space-y-4">
                      {doctorQueue.slice(0, 4).map((item, i) => {
                        const pat = item.patient;
                        const appt = item.appointment;
                        const initials = pat.name.split(" ").map(n => n[0]).join("").toUpperCase();

                        return (
                          <div 
                            key={pat.id} 
                            onClick={() => triggerDoctorConsultation(pat.id)}
                            className="flex items-center justify-between gap-3 group cursor-pointer w-full min-w-0"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                {i + 1}
                              </div>
                              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 text-xs font-bold text-slate-600 shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1 flex items-center gap-1.5">
                                <span className="text-[12px] font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{pat.name}</span>
                                {appt && (
                                  <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                                    Booked
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-slate-500 shrink-0 whitespace-nowrap text-right ml-1">
                              {appt?.time || `09:${(30 + i * 15).toString()} AM`}
                            </span>
                          </div>
                        );
                      })}
                      {doctorQueue.length === 0 && (
                        <div className="text-center text-slate-400 text-xs font-bold mt-10">No patients in queue</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOTTOM SECTIONS */}
                <div className="w-full">
                  {/* Follow-Up Alerts */}
                  <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-[14px] font-black text-slate-900">Follow-Up Alerts</h3>
                    </div>

                    <div className="space-y-3 flex-1">
                      {[
                        { title: "Diabetes Review Due", patient: "Rahul Sharma", time: "7 days overdue", icon: Droplet, color: "text-orange-500", bg: "bg-orange-50" },
                        { title: "Blood Pressure Check Due", patient: "Meena Patel", time: "5 days overdue", icon: Activity, color: "text-red-500", bg: "bg-red-50" },
                        { title: "Missed Appointment", patient: "Arjun Nair", time: "3 days ago", icon: CalendarX, color: "text-blue-500", bg: "bg-blue-50" }
                      ].map((alert, i) => (
                        <div key={i} className="flex items-center justify-between group cursor-pointer p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${alert.bg} flex items-center justify-center shrink-0`}>
                              <alert.icon className={`w-4 h-4 ${alert.color}`} strokeWidth={2.5} />
                            </div>
                            <div>
                              <h4 className="text-[12px] font-black text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">{alert.title}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-500">{alert.patient}</span>
                                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                <span className={`text-[10px] font-bold ${i < 2 ? 'text-red-500' : 'text-slate-400'}`}>{alert.time}</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={2.5} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RECENT PATIENTS */}
                <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm mb-6">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-[14px] font-black text-slate-900">Recent Patients</h3>
                    <span className="text-[11px] font-extrabold text-blue-600 cursor-pointer hover:underline" onClick={() => setDoctorTab("Patients")}>View All</span>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5 snap-x">
                    {[
                      { name: "Rahul Sharma", condition: "Diabetes", time: "3 days ago" },
                      { name: "Meena Patel", condition: "Hypertension", time: "1 week ago" },
                      { name: "Arjun Nair", condition: "Asthma", time: "2 weeks ago" },
                      { name: "Priya Desai", condition: "Thyroid", time: "2 weeks ago" }
                    ].map((patient, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-100 rounded-[20px] p-4 min-w-[160px] snap-center cursor-pointer hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full border border-white shadow-sm flex items-center justify-center bg-blue-100 text-blue-700 font-bold">
                            {patient.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <h4 className="text-[12px] font-black text-slate-900 leading-tight">{patient.name}</h4>
                            <span className="text-[10px] font-bold text-slate-500">{patient.condition}</span>
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Last Visit</div>
                        <div className="text-[11px] font-extrabold text-slate-700">{patient.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {doctorTab === "Patients" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Patient Directory</h2>
                  <p className="text-[13px] text-slate-500 font-bold">Manage and view all registered patients ({filteredDoctorQueue.length})</p>
                </div>

                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={docPatientSearchQuery}
                    onChange={(e) => setDocPatientSearchQuery(e.target.value)}
                    placeholder="Search patients by name, ID or phone..." 
                    className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-[14px] font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" 
                  />
                </div>

                <div className="space-y-3">
                  {filteredDoctorQueue.map(item => {
                    const pat = item.patient;
                    const appt = item.appointment;
                    const age = new Date().getFullYear() - new Date(pat.dob).getFullYear();
                    const patRecs = recordsList.filter(r => r.patientId === pat.id);

                    return (
                      <div 
                        key={pat.id} 
                        onClick={() => setSelectedQuickPatient(item)}
                        className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-[14px] border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {pat.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-[14px] group-hover:text-blue-600 transition-colors">{pat.name}</h4>
                              {appt && (
                                <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                                  Appt: {appt.time}
                                </span>
                              )}
                              {pat.pregnancyStatus === "Pregnant" && (
                                <span className="text-[10px] font-extrabold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full border border-pink-100">
                                  Pregnant
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                              ID: {pat.id.toUpperCase()} • Age {age} • {pat.gender} • {pat.bloodGroup || "O+"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {patRecs.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewPatientReportsModal({ patient: pat, reports: patRecs });
                              }}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-extrabold text-[11px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="View Patient Reports"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Reports ({patRecs.length})</span>
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQuickPatient(item);
                            }}
                            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-blue-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="View Patient Info"
                          >
                            <Info className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredDoctorQueue.length === 0 && (
                    <div className="text-center text-slate-400 text-sm font-bold mt-10 p-6 bg-white rounded-2xl border border-slate-100">
                      No patients found matching "{docPatientSearchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {doctorTab === "Queue" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Today's OPD Queue</h2>
                    <p className="text-[13px] text-slate-500 font-bold">Booked consultations for {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ({doctorQueue.length} Patients)</p>
                  </div>
                </div>

                <div className="space-y-3" id="patient-queue-list">
                  {doctorQueue.map((item, i) => {
                    const pat = item.patient;
                    const appt = item.appointment;
                    const patInitials = pat.name.split(" ").map(n => n[0]).join("").toUpperCase();
                    const symptomsText = appt?.symptoms || "General routine consultation";
                    
                    const patientRecords = recordsList.filter(r => r.patientId === pat.id);

                    return (
                      <div key={pat.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4 hover:border-blue-100 transition-all">
                        <div className="flex justify-between items-start">
                          <div 
                            onClick={() => setSelectedQuickPatient(item)} 
                            className="flex gap-3 cursor-pointer group"
                          >
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100 shadow-sm">
                              {patInitials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{pat.name}</h4>
                                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">Token {i + 1}</span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-bold block mt-1">
                                Age {new Date().getFullYear() - new Date(pat.dob).getFullYear()} · {pat.gender} · {pat.bloodGroup} {pat.pregnancyStatus === "Pregnant" ? "· Pregnant" : ""}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${appt ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : pat.pregnancyStatus === "Pregnant" ? "text-orange-700 bg-orange-50 border border-orange-100" : "text-green-700 bg-green-50 border border-green-100"}`}>
                              {appt ? `Booked (${appt.time})` : pat.pregnancyStatus === "Pregnant" ? "Pregnancy Check" : "Confirmed"}
                            </span>
                            {appt?.date && (
                              <span className="text-[10px] font-bold text-slate-400">{appt.date}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                          <Activity className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Reason for Visit</span>
                            <p className="text-[12px] text-slate-700 font-medium">"{symptomsText}"</p>
                          </div>
                        </div>

                        {patientRecords.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Clinical Reports & Diagnostic Files ({patientRecords.length})</span>
                              <button
                                onClick={() => setViewPatientReportsModal({ patient: pat, reports: patientRecords })}
                                className="text-[10px] font-extrabold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>View All Reports</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {patientRecords.slice(0, 4).map(rec => (
                                <button
                                  key={rec.id}
                                  onClick={() => setPreviewRecord(rec)}
                                  className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-blue-200 text-slate-700 font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-500" /> {rec.name}
                                </button>
                              ))}
                              {patientRecords.length > 4 && (
                                <button
                                  onClick={() => setViewPatientReportsModal({ patient: pat, reports: patientRecords })}
                                  className="bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all"
                                >
                                  +{patientRecords.length - 4} More Reports
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => triggerDoctorConsultation(pat.id)}
                            className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-[13px] transition-colors shadow-sm shadow-blue-200 cursor-pointer"
                          >
                            Start Consultation
                          </button>
                          <button
                            onClick={() => setViewPatientReportsModal({ patient: pat, reports: patientRecords })}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-extrabold text-[12px] px-3.5 py-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="View Patient Medical Reports"
                          >
                            <FileText className="w-4 h-4 text-indigo-600" />
                            <span>Reports ({patientRecords.length})</span>
                          </button>
                          <button
                            onClick={() => setSelectedQuickPatient(item)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-extrabold text-[12px] px-3 py-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Quick Info"
                          >
                            <Info className="w-4 h-4 text-slate-600" />
                            <span>Info</span>
                          </button>
                          <button
                            onClick={() => handleAnalyzePatientHistory(pat.id)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 font-extrabold text-[12px] px-3 py-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="AI Multi-Report Analysis"
                          >
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span>AI Summary</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {doctorTab === "Profile" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900">Doctor Profile</h2>
                </div>

                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
                  
                  <div className="relative z-10 flex flex-col items-center mt-6">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 mb-4 relative flex items-center justify-center text-white shadow-blue-200">
                      {activeDoctor.avatar && activeDoctor.avatar.startsWith("http") ? (
                        <img src={activeDoctor.avatar} alt={activeDoctor.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <Stethoscope className="w-9 h-9 text-white stroke-[2.2]" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-100 mt-0.5">
                            {activeDoctor.name.replace(/^Dr\.\s*/i, "").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{activeDoctor.name.startsWith("Dr.") ? activeDoctor.name : `Dr. ${activeDoctor.name}`}</h3>
                    <p className="text-[13px] font-bold text-slate-500 mt-1">{activeDoctor.specialty} • {activeDoctor.experience || "12+ Yrs Exp"}</p>
                    <div className="flex items-center gap-1.5 mt-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-extrabold border border-blue-100">
                      <Building2 className="w-3.5 h-3.5" />
                      {activeDoctor.hospitalName || "Metro Heart Institute"}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 w-full pt-4 border-t border-slate-100 text-left">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Reg Number</span>
                        <span className="text-[12px] font-black text-slate-800">MCI-748920</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">OPD Timings</span>
                        <span className="text-[12px] font-black text-slate-800">09:00 AM - 05:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wider ml-2">Account Settings & Preferences</h4>
                  
                  <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
                    {/* Dark Mode Theme Toggle */}
                    <div className="w-full flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          {isDoctorDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-indigo-600" />}
                        </div>
                        <div className="text-left">
                          <span className="font-extrabold text-[14px] text-slate-700 block leading-tight">Dark Mode Theme</span>
                          <span className="text-[11px] font-bold text-slate-400">{isDoctorDarkMode ? "Dark Theme Active" : "Light Theme Active"}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={toggleDoctorDarkMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                          isDoctorDarkMode ? "bg-indigo-600" : "bg-slate-200"
                        }`}
                        title="Toggle Dark Mode"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isDoctorDarkMode ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {[
                      { id: "personal" as const, icon: User, text: "Personal Information", detail: `${activeDoctor.email || "rajesh.sharma@hospyn.com"}` },
                      { id: "timings" as const, icon: Clock, text: "Clinic Timings", detail: "Mon - Sat: 9 AM - 5 PM" },
                      { id: "schedule" as const, icon: Calendar, text: "My Schedule", detail: "12 Consultations Today" },
                      { id: "security" as const, icon: Shield, text: "Security & Privacy", detail: doc2FAEnabled ? "2FA Enabled" : "2FA Disabled" }
                    ].map((item, i) => (
                      <button 
                        key={item.id} 
                        onClick={() => setActiveDoctorProfileModal(item.id)}
                        className={`w-full flex items-center justify-between p-4 ${i !== 0 ? 'border-t border-slate-100' : ''} hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer text-left`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <item.icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="text-left">
                            <span className="font-extrabold text-[14px] text-slate-700 block leading-tight">{item.text}</span>
                            <span className="text-[11px] font-bold text-slate-400">{item.detail}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    ))}
                  </div>

                  {/* PWA Install Option in Doctor Profile */}
                  <div className="pt-3">
                    <PWAInstallButton 
                      variant="menu-item" 
                      language={language} 
                      isDarkMode={isDoctorDarkMode} 
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      setActiveDoctor(null);
                      setScreen("LOGIN_OPTIONS");
                    }}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-extrabold text-[14px] py-4 rounded-[20px] flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-5 h-5" strokeWidth={2.5} />
                    Log Out of Session
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* DOCTOR PROFILE OVERLAY MODALS */}
          {activeDoctorProfileModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-white w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col text-left"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      {activeDoctorProfileModal === "personal" && <User className="w-5 h-5" />}
                      {activeDoctorProfileModal === "timings" && <Clock className="w-5 h-5" />}
                      {activeDoctorProfileModal === "schedule" && <Calendar className="w-5 h-5" />}
                      {activeDoctorProfileModal === "security" && <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base leading-tight">
                        {activeDoctorProfileModal === "personal" && "Personal & Clinical Details"}
                        {activeDoctorProfileModal === "timings" && "Clinic & OPD Timings"}
                        {activeDoctorProfileModal === "schedule" && "Today's Clinical Schedule"}
                        {activeDoctorProfileModal === "security" && "Security & Account Privacy"}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400">
                        {activeDoctorProfileModal === "personal" && "View & manage your medical profile credentials"}
                        {activeDoctorProfileModal === "timings" && "Set working days, slots & appointment duration"}
                        {activeDoctorProfileModal === "schedule" && "Real-time consultation breakdown & timeline"}
                        {activeDoctorProfileModal === "security" && "Password, 2FA & data protection settings"}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveDoctorProfileModal(null)}
                    className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Content Scrollable Area */}
                <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs">
                  
                  {/* --- 1. PERSONAL INFORMATION MODAL --- */}
                  {activeDoctorProfileModal === "personal" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
                        <div className="w-14 h-14 rounded-full border-2 border-blue-200 bg-white overflow-hidden shrink-0 flex items-center justify-center text-blue-600 font-black text-xl">
                          {activeDoctor.avatar && activeDoctor.avatar.startsWith("http") ? (
                            <img src={activeDoctor.avatar} alt="Doctor Avatar" className="w-full h-full object-cover" />
                          ) : (
                            activeDoctor.name.replace(/^Dr\.\s*/i, "").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{activeDoctor.name.startsWith("Dr.") ? activeDoctor.name : `Dr. ${activeDoctor.name}`}</h4>
                          <p className="text-blue-700 font-extrabold text-[11px]">{activeDoctor.specialty} • {activeDoctor.experience || "12+ Yrs Exp"}</p>
                          <span className="inline-block mt-1 bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Verified Medical Practitioner
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 text-[10.5px] uppercase tracking-wider block">Medical Reg Number</label>
                          <input 
                            type="text" 
                            readOnly 
                            value="MCI-748920 (Delhi Council)" 
                            className="w-full bg-slate-100 text-slate-700 font-bold p-2.5 rounded-xl border border-slate-200 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 text-[10.5px] uppercase tracking-wider block">Department</label>
                          <input 
                            type="text" 
                            readOnly 
                            value={activeDoctor.department || "Cardiology"} 
                            className="w-full bg-slate-100 text-slate-700 font-bold p-2.5 rounded-xl border border-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 text-[10.5px] uppercase tracking-wider block">Primary Hospital</label>
                          <input 
                            type="text" 
                            readOnly 
                            value={activeDoctor.hospitalName || "Metro Heart Institute"} 
                            className="w-full bg-slate-100 text-slate-700 font-bold p-2.5 rounded-xl border border-slate-200 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-500 text-[10.5px] uppercase tracking-wider block">Consultation Fee (₹)</label>
                          <input 
                            type="text" 
                            value={docFeeInput}
                            onChange={(e) => setDocFeeInput(e.target.value)}
                            className="w-full bg-white text-slate-900 font-extrabold p-2.5 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-400 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 text-[10.5px] uppercase tracking-wider block">Phone Number</label>
                        <input 
                          type="text" 
                          value={docPhoneInput}
                          onChange={(e) => setDocPhoneInput(e.target.value)}
                          className="w-full bg-white text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-400 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-500 text-[10.5px] uppercase tracking-wider block">Clinical Specialization & Bio</label>
                        <textarea 
                          rows={3}
                          value={docBioInput}
                          onChange={(e) => setDocBioInput(e.target.value)}
                          className="w-full bg-white text-slate-800 font-semibold p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-400 text-xs leading-relaxed"
                        />
                      </div>

                      <button 
                        onClick={() => {
                          triggerToast("Personal information updated successfully!");
                          setActiveDoctorProfileModal(null);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-xs shadow-md shadow-blue-200 transition-colors cursor-pointer"
                      >
                        Save Personal Information
                      </button>
                    </div>
                  )}

                  {/* --- 2. CLINIC TIMINGS MODAL --- */}
                  {activeDoctorProfileModal === "timings" && (
                    <div className="space-y-5">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-2">Weekly Availability Days</h4>
                        <div className="flex flex-wrap gap-2">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                            const isActive = docWorkingDays[day];
                            return (
                              <button 
                                key={day}
                                onClick={() => setDocWorkingDays(prev => ({ ...prev, [day]: !prev[day] }))}
                                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                                  isActive 
                                    ? "bg-blue-600 text-white border-blue-600 shadow-xs" 
                                    : "bg-slate-100 text-slate-400 border-slate-200"
                                }`}
                              >
                                {day} {isActive ? "✓" : ""}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">OPD Consultation Slots</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 text-[11px]">Morning Shift</label>
                            <input 
                              type="text" 
                              value={docMorningSlot} 
                              onChange={(e) => setDocMorningSlot(e.target.value)}
                              className="w-full bg-white text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500 text-[11px]">Evening Shift</label>
                            <input 
                              type="text" 
                              value={docEveningSlot} 
                              onChange={(e) => setDocEveningSlot(e.target.value)}
                              className="w-full bg-white text-slate-800 font-bold p-2.5 rounded-xl border border-slate-200 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-slate-900 block text-xs">Emergency On-Call Availability</span>
                          <span className="text-[11px] font-semibold text-slate-500">Receive priority notifications for ER & ICU triage</span>
                        </div>
                        <button 
                          onClick={() => setDocEmergencyOnCall(!docEmergencyOnCall)}
                          className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${docEmergencyOnCall ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"}`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                          triggerToast("Clinic & OPD timings saved successfully!");
                          setActiveDoctorProfileModal(null);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-xs shadow-md shadow-blue-200 transition-colors cursor-pointer"
                      >
                        Update Clinic Schedule
                      </button>
                    </div>
                  )}

                  {/* --- 3. MY SCHEDULE MODAL --- */}
                  {activeDoctorProfileModal === "schedule" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                          <span className="text-xl font-black text-blue-700 block">12</span>
                          <span className="text-[10px] font-extrabold text-blue-600 uppercase">Consultations</span>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                          <span className="text-xl font-black text-emerald-700 block">8</span>
                          <span className="text-[10px] font-extrabold text-emerald-600 uppercase">Completed</span>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
                          <span className="text-xl font-black text-amber-700 block">4</span>
                          <span className="text-[10px] font-extrabold text-amber-600 uppercase">In Queue</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-2">
                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Today's Detailed Timeline</h4>
                        {[
                          { time: "09:00 AM - 10:00 AM", title: "IPD Ward Rounds & Cardiac ICU", status: "Completed", color: "bg-emerald-100 text-emerald-800" },
                          { time: "10:00 AM - 01:00 PM", title: "Morning OPD Consultations (12 Patients)", status: "Active Now", color: "bg-blue-600 text-white" },
                          { time: "01:00 PM - 02:00 PM", title: "Lunch Break & Clinical Case Review", status: "Break", color: "bg-slate-200 text-slate-700" },
                          { time: "02:00 PM - 04:30 PM", title: "Echocardiography & Doppler Diagnostics", status: "Upcoming", color: "bg-blue-100 text-blue-800" },
                          { time: "04:30 PM - 07:00 PM", title: "Evening OPD & Virtual Teleconsultations", status: "Upcoming", color: "bg-indigo-100 text-indigo-800" },
                        ].map((item, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-extrabold text-slate-400 block">{item.time}</span>
                              <span className="text-xs font-black text-slate-800">{item.title}</span>
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${item.color}`}>
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => {
                          triggerToast("Schedule blocked for emergency break.");
                          setActiveDoctorProfileModal(null);
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Block Schedule for Emergency / Surgery
                      </button>
                    </div>
                  )}

                  {/* --- 4. SECURITY & PRIVACY MODAL --- */}
                  {activeDoctorProfileModal === "security" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-extrabold text-slate-900 block text-xs">Two-Factor Authentication (2FA)</span>
                            <span className="text-[11px] font-semibold text-slate-500">Secure doctor console access via SMS OTP</span>
                          </div>
                          <button 
                            onClick={() => {
                              setDoc2FAEnabled(!doc2FAEnabled);
                              triggerToast(doc2FAEnabled ? "2FA disabled." : "2FA enabled for Doctor Portal.");
                            }}
                            className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${doc2FAEnabled ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"}`}
                          >
                            <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Change Account Password</h4>
                        <div className="space-y-2">
                          <input 
                            type="password" 
                            placeholder="Current Password" 
                            value={docCurrentPass}
                            onChange={(e) => setDocCurrentPass(e.target.value)}
                            className="w-full bg-white text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs"
                          />
                          <input 
                            type="password" 
                            placeholder="New Password" 
                            value={docNewPass}
                            onChange={(e) => setDocNewPass(e.target.value)}
                            className="w-full bg-white text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs"
                          />
                          <input 
                            type="password" 
                            placeholder="Confirm New Password" 
                            value={docConfirmPass}
                            onChange={(e) => setDocConfirmPass(e.target.value)}
                            className="w-full bg-white text-slate-800 p-2.5 rounded-xl border border-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-black text-emerald-900 text-xs block">HIPAA & Clinical Compliance Active</span>
                          <span className="text-[11px] text-emerald-700 font-semibold">End-to-end patient record encryption & ISO 27001 verified.</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          triggerToast("Security preferences saved successfully!");
                          setDocCurrentPass("");
                          setDocNewPass("");
                          setDocConfirmPass("");
                          setActiveDoctorProfileModal(null);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-xs shadow-md shadow-blue-200 transition-colors cursor-pointer"
                      >
                        Save Security Settings
                      </button>
                    </div>
                  )}

                </div>
              </motion.div>
            </div>
          )}

          {/* PATIENT QUICK INFO MODAL */}
          <AnimatePresence>
            {selectedQuickPatient && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto"
                onClick={() => setSelectedQuickPatient(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 15 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white w-full max-w-lg rounded-[28px] border border-slate-100 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
                >
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg border border-white/30 text-white shadow-inner shrink-0">
                        {selectedQuickPatient.patient.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">
                            {selectedQuickPatient.patient.id.toUpperCase()}
                          </span>
                          {selectedQuickPatient.patient.pregnancyStatus === "Pregnant" && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-pink-500/80 text-white px-2 py-0.5 rounded-full">
                              Pregnant
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-white leading-tight mt-0.5">
                          {selectedQuickPatient.patient.name}
                        </h3>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedQuickPatient(null)}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body - Scrollable */}
                  <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-sm">
                    {/* Quick Demographics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-0.5">Age & DOB</span>
                        <span className="text-xs font-black text-slate-800">
                          {new Date().getFullYear() - new Date(selectedQuickPatient.patient.dob).getFullYear()} Yrs
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {selectedQuickPatient.patient.dob}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-0.5">Gender</span>
                        <span className="text-xs font-black text-slate-800">{selectedQuickPatient.patient.gender}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-0.5">Blood Group</span>
                        <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md inline-block">
                          {selectedQuickPatient.patient.bloodGroup || "O+"}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-0.5">Visit Status</span>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                          {selectedQuickPatient.appointment ? selectedQuickPatient.appointment.time : "In Queue"}
                        </span>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Contact Information</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-extrabold text-slate-700">
                        <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                          <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>+91 {selectedQuickPatient.patient.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs truncate">
                          <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="truncate">{selectedQuickPatient.patient.email}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs col-span-1 sm:col-span-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Aadhaar: {selectedQuickPatient.patient.aadhaar || "Not Provided"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Reason for Visit / Symptoms */}
                    <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 space-y-1">
                      <div className="flex items-center gap-2 text-blue-800 font-extrabold text-xs">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span>Current OPD Symptoms / Reason for Visit</span>
                      </div>
                      <p className="text-xs text-slate-700 font-bold leading-relaxed pl-6">
                        "{selectedQuickPatient.appointment?.symptoms || "General OPD Medical Evaluation and Routine Health Screening"}"
                      </p>
                    </div>

                    {/* Chronic Conditions & Allergies */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Chronic Conditions</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedQuickPatient.patient.chronicConditions && selectedQuickPatient.patient.chronicConditions.length > 0 ? (
                            selectedQuickPatient.patient.chronicConditions.map((cond, idx) => (
                              <span key={idx} className="bg-amber-100/80 text-amber-900 border border-amber-200 text-[11px] font-extrabold px-2.5 py-1 rounded-lg">
                                {cond}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">None reported</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Known Allergies</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedQuickPatient.patient.allergies && selectedQuickPatient.patient.allergies.length > 0 ? (
                            selectedQuickPatient.patient.allergies.map((all, idx) => (
                              <span key={idx} className="bg-rose-100/80 text-rose-900 border border-rose-200 text-[11px] font-extrabold px-2.5 py-1 rounded-lg">
                                ⚠️ {all}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">No known allergies</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Linked Hospitals */}
                    {selectedQuickPatient.patient.linkedHospitals && selectedQuickPatient.patient.linkedHospitals.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Associated Medical Centers</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedQuickPatient.patient.linkedHospitals.map((hosp, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-2xs">
                              🏥 {hosp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Patient Medical Reports & Files */}
                    {(() => {
                      const pRecs = recordsList.filter(r => r.patientId === selectedQuickPatient.patient.id);
                      return (
                        <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs">
                              <FileText className="w-4 h-4 text-indigo-600" />
                              <span>Clinical Reports ({pRecs.length})</span>
                            </div>
                            {pRecs.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const pat = selectedQuickPatient.patient;
                                  setSelectedQuickPatient(null);
                                  setViewPatientReportsModal({ patient: pat, reports: pRecs });
                                }}
                                className="text-[11px] font-extrabold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>View Full List</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {pRecs.length > 0 ? (
                            <div className="space-y-2">
                              {pRecs.slice(0, 3).map(rec => (
                                <div key={rec.id} className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <span className="font-extrabold text-slate-800 text-xs block truncate">{rec.name}</span>
                                      <span className="text-[10px] text-slate-400 font-medium">{rec.category} • {rec.date}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewRecord(rec)}
                                      className="text-[10px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100 transition-colors shrink-0 cursor-pointer"
                                    >
                                      Preview
                                    </button>
                                  </div>
                                  {rec.summary && (
                                    <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                                      <span className="text-[9.5px] font-black text-indigo-600 uppercase tracking-wider block">Record Summary Pointers:</span>
                                      {renderSummaryInPointers(rec.summary)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 font-medium italic">No clinical files uploaded yet.</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => setSelectedQuickPatient(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        const pid = selectedQuickPatient.patient.id;
                        setSelectedQuickPatient(null);
                        triggerDoctorConsultation(pid);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Start Consultation</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PATIENT REPORTS VIEWER MODAL */}
          <AnimatePresence>
            {viewPatientReportsModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 overflow-y-auto"
                onClick={() => setViewPatientReportsModal(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 15 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white w-full max-w-xl rounded-[28px] border border-slate-100 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg border border-white/30 text-white shadow-inner shrink-0">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/20 inline-block">
                          {viewPatientReportsModal.reports.length} Reports Available
                        </span>
                        <h3 className="text-lg font-black text-white leading-tight mt-1">
                          Medical Records: {viewPatientReportsModal.patient.name}
                        </h3>
                        <p className="text-xs text-white/80 font-semibold mt-0.5">
                          ID: {viewPatientReportsModal.patient.id.toUpperCase()} • {viewPatientReportsModal.patient.gender} • Blood Group: {viewPatientReportsModal.patient.bloodGroup || "O+"}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setViewPatientReportsModal(null)}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
                    {viewPatientReportsModal.reports.length > 0 ? (
                      viewPatientReportsModal.reports.map((rec, idx) => (
                        <div 
                          key={rec.id || idx} 
                          className="bg-slate-50 hover:bg-blue-50/50 p-4 rounded-2xl border border-slate-200/80 hover:border-blue-200 transition-all space-y-2 group shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                                  {rec.name}
                                </h4>
                                <span className="text-[11px] text-slate-500 font-bold block">
                                  Category: {rec.category} • Date: {rec.date} • {rec.size || "1.5 MB"}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setPreviewRecord(rec)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Preview Report</span>
                            </button>
                          </div>
                          {rec.summary && (
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 text-left">
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">Clinical Finding Summary (Key Pointers)</span>
                              {renderSummaryInPointers(rec.summary)}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-400 font-bold space-y-2">
                        <FileText className="w-12 h-12 mx-auto text-slate-300" />
                        <p>No lab or diagnostic reports uploaded for this patient yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        const pid = viewPatientReportsModal.patient.id;
                        setViewPatientReportsModal(null);
                        handleAnalyzePatientHistory(pid);
                      }}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>AI Multi-Report Synthesis</span>
                    </button>
                    <button
                      onClick={() => setViewPatientReportsModal(null)}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOTTOM NAVIGATION */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center z-50 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
            {[
              { id: "Home", icon: Home },
              { id: "Patients", icon: Users },
              { id: "Queue", icon: ClipboardList },
              { id: "Profile", icon: User }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setDoctorTab(tab.id as any)}
                className={`flex flex-col items-center gap-1 ${doctorTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon className="w-6 h-6" strokeWidth={doctorTab === tab.id ? 2.5 : 2} />
                <span className={`text-[10px] font-extrabold ${doctorTab === tab.id ? 'text-blue-600' : 'text-slate-500'}`}>{tab.id}</span>
              </button>
            ))}
          </nav>

          {/* ACTIVE CONSULTATION WRITING SHEET */}
          <AnimatePresence>
            {showConsultationSheet && consultingPatient && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 bg-[#fafafa] z-[100] flex flex-col p-5 overflow-y-auto"
                id="consultation-wizard"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5 shrink-0">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setShowConsultationSheet(false);
                        setConsultingPatient(null);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6 text-slate-800" strokeWidth={2.5} />
                    </button>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-lg md:text-xl tracking-tight">Consultation: {consultingPatient.name}</h4>
                      <span className="text-xs text-[#6366f1] font-extrabold block tracking-tight">Delhi Hospital Network Session</span>
                    </div>
                  </div>
                  <FallbackImage type="header-logo" className="text-[#0c2340] scale-90" />
                </div>

                <div className="flex-1 space-y-5 pb-6 max-w-2xl mx-auto w-full" id="consultation-sheet-body">
                  {/* Patient background brief reminder */}
                  <div className="bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Clinical Background Check</span>
                    <div className="space-y-1">
                      <div className="text-[13px] text-slate-800 font-bold">
                        Known Conditions: <span className="font-extrabold text-slate-900">{consultingPatient.chronicConditions.join(", ") || "None declared"}</span>
                      </div>
                      <div className="text-[13px] text-slate-800 font-bold">
                        Allergies: <span className="font-black text-red-500">{consultingPatient.allergies.join(", ") || "No known allergies"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Medical Reports & Diagnostic Files inside Consultation Sheet */}
                  {(() => {
                    const patientRecs = recordsList.filter(r => r.patientId === consultingPatient.id || (consultingPatient.id === "pat-vatsal" && r.patientId === "pat-vatsal"));
                    if (patientRecs.length === 0) return null;
                    return (
                      <div className="bg-white border border-indigo-100 p-4 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                            <FileText className="w-4 h-4 text-indigo-600" />
                            <span>Uploaded Medical Reports ({patientRecs.length})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewPatientReportsModal({ patient: consultingPatient, reports: patientRecs })}
                            className="text-[11px] font-extrabold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>View All ({patientRecs.length})</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                          {patientRecs.map(rec => (
                            <div key={rec.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h5 className="font-extrabold text-slate-800 text-xs truncate">{rec.name}</h5>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{rec.category} • {rec.date} • {rec.size}</p>
                                {rec.summary && (
                                  <div className="mt-1 bg-white p-2 rounded-xl border border-slate-100 text-left">
                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block">Record Summary Pointers</span>
                                    {renderSummaryInPointers(rec.summary)}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setPreviewRecord(rec)}
                                className="text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 rounded-lg shrink-0 transition-colors shadow-2xs cursor-pointer"
                              >
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* AI Patient History Synthesis inside Consultation Sheet */}
                  <div className="bg-gradient-to-br from-indigo-50/40 to-purple-50/40 border border-indigo-100/50 p-5 rounded-3xl space-y-3 text-left">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#6366f1]" strokeWidth={2.5} />
                      <span className="text-[11px] font-black text-[#6366f1] uppercase tracking-wider block">AI Medical History Synthesis</span>
                    </div>
                    
                    {historyAnalysisResult ? (
                      <div className="space-y-3">
                        <div className="bg-white p-4 rounded-2xl border border-indigo-100/70 text-xs font-semibold text-slate-700 leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap markdown-body shadow-sm">
                          <Markdown>{historyAnalysisResult}</Markdown>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleAnalyzePatientHistory(consultingPatient.id)}
                            className="bg-[#6366f1] hover:bg-[#4f46e5] text-white font-black px-4 py-2.5 rounded-xl text-[11px] transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-100"
                            disabled={isHistoryAnalyzing}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {isHistoryAnalyzing ? "Analyzing..." : "Analyze History"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <p className="text-[13px] text-slate-500 font-bold leading-relaxed max-w-md">
                          Analyze the patient's historical medical documents, chronic conditions, and diagnostic files to synthesize multi-report clinical findings.
                        </p>
                        <button
                          onClick={() => handleAnalyzePatientHistory(consultingPatient.id)}
                          className="bg-[#6366f1] hover:bg-[#4f46e5] text-white font-black px-4 py-2.5 rounded-xl text-[12px] transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-100 self-end"
                          disabled={isHistoryAnalyzing}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {isHistoryAnalyzing ? "Analyzing..." : "Analyze History"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Consultation Notes */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Clinical Notes</label>
                      <span className="bg-[#374151] text-white text-[9px] font-black px-2 py-0.5 rounded-[4px] uppercase tracking-wide">Preview</span>
                    </div>
                    <textarea
                      rows={4}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-[13px] font-bold text-slate-800 outline-none focus:border-[#6366f1] transition-colors placeholder:text-slate-400"
                      placeholder="Enter diagnostic notes, patient reports review..."
                      value={consultationNotes}
                      onChange={(e) => setConsultationNotes(e.target.value)}
                    />
                  </div>

                  {/* Proposed Medicines list */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-wider block">Proposed Prescriptions</label>
                    <div className="space-y-3">
                      {prescribedMedicines.map((med, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <Pill className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                            <input
                              type="text"
                              className="w-full bg-[#f8fafc] border border-slate-200 rounded-full py-3.5 pl-11 pr-4 text-[13px] font-bold text-slate-800 outline-none focus:border-[#6366f1] transition-colors placeholder:text-slate-400"
                              placeholder="Enter medicine (e.g. Ibuprofen, Amoxicillin)..."
                              value={med}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPrescribedMedicines(prev => {
                                  const copy = [...prev];
                                  copy[idx] = val;
                                  return copy;
                                });
                              }}
                            />
                          </div>
                          {prescribedMedicines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setPrescribedMedicines(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="text-red-500 hover:text-red-600 text-[13px] font-black transition-colors px-2 shrink-0"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setPrescribedMedicines(prev => [...prev, ""])}
                        className="flex-1 bg-[#f1f5f9] hover:bg-slate-200 text-slate-800 py-3.5 rounded-full text-[13px] font-black flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        + Add Medicine
                      </button>

                      <button
                        type="button"
                        onClick={handleCheckInlineSafety}
                        disabled={inlineSafetyChecking}
                        className="flex-1 bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-60 text-white py-3.5 rounded-full text-[13px] font-black flex items-center justify-center gap-2 transition-colors shadow-md shadow-purple-100 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
                        {inlineSafetyChecking ? "Analyzing Safety..." : "Check Patient Safety"}
                      </button>
                    </div>

                    {inlineSafetyResult && (
                      <div className={`p-4 rounded-2xl border text-xs font-medium space-y-2.5 mt-2 transition-all ${
                        inlineSafetyResult.includes("HAZARD") || inlineSafetyResult.includes("ALERT") || inlineSafetyResult.includes("RISK")
                          ? "bg-amber-50/90 border-amber-200 text-amber-950"
                          : "bg-emerald-50/90 border-emerald-200 text-emerald-950"
                      }`}>
                        <div className="flex items-center justify-between border-b border-black/5 pb-2">
                          <div className="flex items-center gap-2 font-black text-xs">
                            {inlineSafetyResult.includes("HAZARD") || inlineSafetyResult.includes("ALERT") || inlineSafetyResult.includes("RISK") ? (
                              <ShieldAlert className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                            ) : (
                              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                            )}
                            <span>Safety Analysis Findings</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setInlineSafetyResult(null)}
                            className="text-[10px] font-black text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="leading-relaxed whitespace-pre-wrap text-[11.5px] font-semibold">
                          {inlineSafetyResult}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic AI Follow-up suggestions */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">AI Suggested Follow-Up Timeline</label>
                      <button
                        onClick={handleGenerateFollowup}
                        className="text-[11px] text-[#6366f1] font-black hover:underline tracking-tight"
                      >
                        {generatingFollowup ? "Analyzing..." : "Generate suggestions"}
                      </button>
                    </div>

                    {followupSuggestions && (
                      <div className="bg-[#fcfcff] border border-indigo-100 p-4 rounded-2xl text-[12px] font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {followupSuggestions}
                      </div>
                    )}
                  </div>

                  {/* Final OPD Queue release button */}
                  <button
                    onClick={confirmActiveConsultation}
                    className="w-full bg-[#0b1329] hover:bg-[#16223f] text-white font-black py-4 rounded-2xl text-[14px] flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-slate-200 mt-2"
                  >
                    <Send className="w-4 h-4 text-white" strokeWidth={2.5} /> Finalize Handoff &amp; Send Prescription
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Search Overlay */}
          {showMedicalSearch && (
            <div className="fixed inset-0 overflow-y-auto bg-white z-50 p-4 md:p-6 text-left" id="search-overlay-doctor">
              <MedicalSearch onBack={() => setShowMedicalSearch(false)} />
            </div>
          )}

          {/* AI Scanner / Report Reader Overlay */}
          {showReportReader && (
            <div className="fixed inset-0 overflow-y-auto bg-white z-50 p-4 md:p-6 text-left" id="reader-overlay-doctor">
              <AIReportReader 
                onBack={() => setShowReportReader(false)} 
                onRecordAdded={(rec) => {
                  setRecordsList(prev => [rec, ...prev]);
                  setShowReportReader(false);
                }}
              />
            </div>
          )}

          {/* AI Clinical History Analysis Modal for Doctor */}
          <AnimatePresence>
            {showHistoryAnalysisModal && historyAnalysisPatient && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" 
                id="history-analysis-modal-doctor" 
                onClick={() => setShowHistoryAnalysisModal(false)}
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 12 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-[32px] w-full max-w-[500px] max-h-[85vh] overflow-y-auto flex flex-col text-left shadow-2xl" 
                  onClick={(e) => e.stopPropagation()}
                >
                  
                  {/* Header */}
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">Clinical History Synthesis</h3>
                        <p className="text-[10px] text-slate-400 font-bold">Comprehensive Cross-Report Analysis</p>
                      </div>
                    </div>
                    <button onClick={() => setShowHistoryAnalysisModal(false)} className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-100 p-1.5 rounded-full shrink-0">✕</button>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    {/* Patient Quick Profile Badge */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center shadow-inner">
                        {historyAnalysisPatient.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      <div className="space-y-0.5 text-left">
                        <h4 className="font-black text-slate-900 text-sm leading-tight">{historyAnalysisPatient.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold">
                          Age {new Date().getFullYear() - new Date(historyAnalysisPatient.dob).getFullYear()} · {historyAnalysisPatient.gender} · Blood Group {historyAnalysisPatient.bloodGroup}
                        </p>
                      </div>
                    </div>

                    {/* AI Output or Loading */}
                    {isHistoryAnalyzing ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="relative flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                          <Sparkles className="w-5 h-5 text-indigo-600 absolute animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-800">Synthesizing Patient Dossier...</p>
                          <p className="text-[10px] text-slate-400 font-semibold max-w-[280px]">Our high-reasoning Gemini engine is analyzing clinical records, chronic status, and lab reports.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-left">
                        {/* Synthesized Output in Markdown style */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-700 leading-relaxed space-y-2 whitespace-pre-wrap markdown-body">
                          <Markdown>{historyAnalysisResult}</Markdown>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-5 border-t border-slate-100 flex gap-2.5 bg-slate-50/50 rounded-b-[32px]">
                    <button
                      onClick={() => {
                        const element = document.createElement("a");
                        const file = new Blob([historyAnalysisResult], { type: 'text/plain' });
                        element.href = URL.createObjectURL(file);
                        element.download = `${historyAnalysisPatient.name.replace(/\s+/g, '_')}_Clinical_Synthesis.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      disabled={isHistoryAnalyzing || !historyAnalysisResult}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Dossier</span>
                    </button>
                    <button
                      onClick={() => setShowHistoryAnalysisModal(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold px-5 py-3 rounded-2xl text-xs transition-colors"
                    >
                      Close
                    </button>
                  </div>

                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* --- SELECTED HOSPITAL DETAILS DIALOG --- */}
          {selectedDashboardHospital && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end justify-center"
              onClick={() => setSelectedDashboardHospital(null)}
            >
              <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                exit={{ y: 50 }}
                className="bg-white rounded-t-[32px] w-full max-w-[480px] max-h-[85vh] overflow-y-auto p-6 space-y-5 text-left shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Building2 className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Medical Facility</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight mt-1">{selectedDashboardHospital.name}</h3>
                    <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                      📍 {selectedDashboardHospital.address}
                    </p>
                    {activePatient && (
                      <button
                        onClick={() => toggleHospitalLink(selectedDashboardHospital.name)}
                        className={`mt-2.5 px-3 py-1.5 rounded-xl font-extrabold text-[10px] transition-all flex items-center gap-1.5 border ${
                          (activePatient.linkedHospitals || []).includes(selectedDashboardHospital.name)
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow"
                        }`}
                      >
                        {(activePatient.linkedHospitals || []).includes(selectedDashboardHospital.name) ? (
                          <>✓ Added to My Hospitals (Remove)</>
                        ) : (
                          <>+ Add to My Hospitals</>
                        )}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedDashboardHospital(null)}
                    className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-100 p-2 rounded-full"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick Hospital Services / Actions */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100/80">
                  <button
                    onClick={() => {
                      setSelectedHospital(selectedDashboardHospital);
                      setSelectedDept("");
                      setSelectedDoctor(null);
                      setBookingStep(1);
                      setShowBookingWizard(true);
                      setSelectedDashboardHospital(null);
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 bg-white hover:bg-blue-50/50 text-blue-700 font-extrabold text-[11px] py-2.5 rounded-xl border border-blue-100/40 transition-all shadow-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Appointment</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowFindSpecialist(true);
                      setSelectedDashboardHospital(null);
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 bg-white hover:bg-slate-100/60 text-slate-700 font-extrabold text-[11px] py-2.5 rounded-xl border border-slate-200/55 transition-all shadow-sm"
                  >
                    <Search className="w-4 h-4" />
                    <span>Find Doctor</span>
                  </button>
                </div>

                {/* Specialties / Departments */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Active Departments</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDashboardHospital.departments.map((dept: string) => (
                      <span key={dept} className="bg-slate-50 text-slate-700 font-extrabold text-[10px] px-2.5 py-1 rounded-lg border border-slate-100">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Aligned Doctors */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
                    <span>Aligned Specialists ({selectedDashboardHospital.doctors.length})</span>
                    <span className="text-[10px] text-emerald-600 font-extrabold normal-case">Direct Scheduling</span>
                  </h4>
                  
                  <div className="space-y-3">
                    {selectedDashboardHospital.doctors.map((doc: any) => {
                      const docDetails = doctorsList.find(d => d.id === doc.id) || MOCK_DOCTORS.find(d => d.id === doc.id) || doc;
                      return (
                        <div key={docDetails.id} className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                                {docDetails.avatar}
                              </div>
                              <div>
                                <h5 className="font-extrabold text-slate-900 text-xs leading-none">{docDetails.name}</h5>
                                <span className="text-[10px] text-blue-600 font-extrabold block mt-1">{docDetails.specialty}</span>
                                <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{docDetails.degree} · {docDetails.experience} exp</span>
                              </div>
                            </div>
                            
                            {/* Rating & Reviews */}
                            <div className="text-right">
                              <div className="flex items-center gap-1 justify-end">
                                <span className="text-amber-500 text-xs">★</span>
                                <span className="text-[11px] font-black text-slate-800">{docDetails.rating}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{docDetails.reviewsCount} real reviews</span>
                            </div>
                          </div>

                          {/* Timing, Fee and Booking */}
                          <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl mt-1">
                            <div className="flex flex-col">
                              <span className="text-[8.5px] text-slate-400 font-extrabold uppercase">Fee & Timing</span>
                              <span className="text-[10px] font-extrabold text-slate-800 mt-0.5 flex items-center gap-1">
                                <span className="text-emerald-700 font-black">₹{docDetails.fee || 800}</span>
                                <span className="text-slate-300">·</span>
                                <span className="text-slate-600 font-medium">🕒 {docDetails.timing}</span>
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedDashboardHospital(null);
                                // Trigger booking flow directly with this doctor and hospital!
                                setSelectedDoctor(docDetails);
                                setSelectedHospital(selectedDashboardHospital);
                                setSelectedDept(docDetails.department);
                                setBookingStep(4);
                                setShowBookingWizard(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
                            >
                              Book Appointment
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedDashboardHospital(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-2xl text-xs text-center transition-colors"
                >
                  Close Hospital Sheet
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* --- MY HOSPITALS NETWORK CATALOG --- */}
          {showHospitalsNetwork && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[190] flex items-end justify-center"
              onClick={() => setShowHospitalsNetwork(false)}
            >
              <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                exit={{ y: 50 }}
                className="bg-white rounded-t-[32px] w-full max-w-[480px] max-h-[85vh] overflow-y-auto p-6 space-y-4 text-left shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Building2 className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Our Aligned Hospital Network</h3>
                  </div>
                  <button
                    onClick={() => setShowHospitalsNetwork(false)}
                    className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-100 p-2 rounded-full"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-slate-500 font-semibold text-xs leading-relaxed">
                  Choose any clinical facility in the unified Hospyn network to view specialty clinics, operating hours, and book consultations.
                </p>

                 <div className="space-y-3 overflow-y-auto max-h-[50vh]">
                  {MOCK_HOSPITALS.map((hospital) => {
                    const isLinked = (activePatient?.linkedHospitals || []).includes(hospital.name);
                    return (
                      <div
                        key={hospital.name}
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div
                            onClick={() => {
                              setSelectedDashboardHospital(hospital);
                              setShowHospitalsNetwork(false);
                            }}
                            className="flex items-center gap-3 cursor-pointer flex-1 mr-2 min-w-0"
                          >
                            <div className="w-9 h-9 rounded-xl bg-blue-100/50 text-blue-600 flex items-center justify-center shrink-0">
                              <Building2 className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-extrabold text-slate-900 text-xs leading-snug truncate">{hospital.name}</h4>
                              <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">📍 {hospital.address.split(",")[1]?.trim() || "Jaipur, Rajasthan"}</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <button
                              onClick={() => toggleHospitalLink(hospital.name)}
                              className={`px-2.5 py-1.5 rounded-xl font-extrabold text-[9.5px] transition-all border ${
                                isLinked
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100"
                                  : "bg-blue-600 border-blue-600 hover:bg-blue-700 text-white shadow-sm"
                              }`}
                            >
                              {isLinked ? "Added ✓" : "+ Add"}
                            </button>
                          </div>
                        </div>

                        {/* Quick Services Actions inside Catalog Modal */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/40">
                          <button
                            onClick={() => {
                              setShowHospitalsNetwork(false);
                              setSelectedHospital(hospital);
                              setSelectedDept("");
                              setSelectedDoctor(null);
                              setBookingStep(1);
                              setShowBookingWizard(true);
                            }}
                            className="flex items-center justify-center gap-1 bg-white hover:bg-blue-50/50 text-blue-700 font-extrabold text-[10px] py-2 rounded-xl border border-blue-100/60 transition-all cursor-pointer shadow-sm"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Book Appt</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowHospitalsNetwork(false);
                              setShowFindSpecialist(true);
                            }}
                            className="flex items-center justify-center gap-1 bg-white hover:bg-slate-100/60 text-slate-700 font-extrabold text-[10px] py-2 rounded-xl border border-slate-200/50 transition-all cursor-pointer shadow-sm"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>Find Doctor</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowHospitalsNetwork(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-2xl text-xs text-center transition-colors"
                >
                  Close Catalog
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Interactive OTP Pop-up Banner & Prototype HUD */}
          {otpPopup && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] bg-slate-900/95 text-white backdrop-blur-xl rounded-[24px] p-4 shadow-2xl z-[10000] border border-emerald-500/40 flex flex-col gap-3 no-invert"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black tracking-widest uppercase text-emerald-400 flex items-center gap-1.5">
                      <span>HOSPYN SECURE OTP</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-300">
                      SMS Code sent to <span className="font-bold text-white">{otpPopup.phone}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpPopup(null)}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>

              {/* Big 6-digit OTP Code Banner */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-1 font-mono font-black text-xl tracking-wider text-emerald-400">
                  {otpPopup.code.split("").map((digit, idx) => (
                    <span key={idx} className="w-7 h-9 rounded-lg bg-slate-900 border border-emerald-500/40 flex items-center justify-center shadow-inner">
                      {digit}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(otpPopup.code);
                    triggerToast("OTP code copied to clipboard!");
                  }}
                  className="text-[11px] font-extrabold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
                >
                  Copy Code
                </button>
              </div>

              {/* One-tap Auto-fill Prototype action */}
              <button
                type="button"
                onClick={() => {
                  autoFillOtpCode(otpPopup.code, otpPopup.type);
                  setOtpPopup(null);
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.99] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                One-Tap Auto-Fill Code ({otpPopup.code})
              </button>
            </motion.div>
          )}

      {/* ─── ADMIN_LOGIN SCREEN ─── */}
      {screen === "ADMIN_LOGIN" && (
        <div className="flex flex-col min-h-[100dvh] bg-slate-950 text-white relative overflow-hidden justify-center items-center p-4" id="screen-admin-login">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative z-10">
            <button
              onClick={handleGoBack}
              className="text-slate-400 hover:text-white mb-2 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to App
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/10">
                <Shield className="w-7 h-7 fill-blue-500/20" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">App Manager Login</h2>
              <p className="text-xs text-slate-400 font-medium">Hospyn Platform Administrator Access</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!adminEmailInput.trim() || !adminPassInput.trim()) {
                  alert("Please enter manager email and password.");
                  return;
                }
                setScreen("ADMIN_DASHBOARD");
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Admin Email</label>
                <input
                  type="email"
                  required
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Password / Security PIN</label>
                <div className="relative">
                  <input
                    type={showAdminPass ? "text" : "password"}
                    required
                    value={adminPassInput}
                    onChange={(e) => setAdminPassInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-white outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-black py-3 rounded-xl transition-all cursor-pointer"
              >
                Log In to Console
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADMIN_DASHBOARD SCREEN ─── */}
      {screen === "ADMIN_DASHBOARD" && (
        <AdminDashboard
          onBack={handleGoBack}
          registeredPatients={registeredPatients}
          setRegisteredPatients={setRegisteredPatients}
          doctorsList={doctorsList}
          setDoctorsList={setDoctorsList}
          hospitalsList={hospitalsList}
          setHospitalsList={setHospitalsList}
          appointmentsList={appointmentsList}
          setAppointmentsList={setAppointmentsList}
          recordsList={recordsList}
          setRecordsList={setRecordsList}
          onResetSystemData={() => {
            setRegisteredPatients(DEFAULT_SAVED_PATIENTS);
            setDoctorsList(MOCK_DOCTORS);
            setHospitalsList(MOCK_HOSPITALS);
            localStorage.removeItem("hospyn_registered_patients");
            localStorage.removeItem("hospyn_doctors_list");
            localStorage.removeItem("hospyn_hospitals_list");
          }}
        />
      )}

          {/* Active Prescription Due Reminder Floating Alert */}
          {activeDueReminderAlert && (
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-md bg-slate-900 text-white rounded-3xl p-4.5 shadow-2xl border border-amber-400/40 animate-in slide-in-from-top duration-300 no-invert">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-lg shadow-amber-500/30">
                    <Pill className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                        {activeDueReminderAlert.slot === "Morning" ? (language === "hi" ? "सुबह की खुराक का समय" : "Morning Dose Due") : (language === "hi" ? "शाम की खुराक का समय" : "Evening Dose Due")}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    </div>
                    <h4 className="text-sm font-black text-white mt-1">
                      {activeDueReminderAlert.reminder.medicineName}
                    </h4>
                    <p className="text-[11px] text-slate-300 font-semibold mt-0.5">
                      {activeDueReminderAlert.slot === "Morning" 
                        ? `${activeDueReminderAlert.reminder.morningDosage} • ${activeDueReminderAlert.reminder.morningMeal}`
                        : `${activeDueReminderAlert.reminder.eveningDosage} • ${activeDueReminderAlert.reminder.eveningMeal}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveDueReminderAlert(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    // Mark dose taken in local storage
                    const list = getSavedPrescriptionReminders(activePatient?.id);
                    const updated = list.map(r => {
                      if (r.id !== activeDueReminderAlert.reminder.id) return r;
                      if (activeDueReminderAlert.slot === "Morning") {
                        return { ...r, morningTakenToday: true, morningTakenAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
                      } else {
                        return { ...r, eveningTakenToday: true, eveningTakenAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
                      }
                    });
                    savePrescriptionReminders(updated);
                    triggerToast(language === "hi" ? "दवा ली गई दर्ज की गई ✓" : "Medication logged as taken! ✓");
                    setActiveDueReminderAlert(null);
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <span>✓ {language === "hi" ? "दवा ले ली (Mark Taken)" : "Mark as Taken"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerToast(language === "hi" ? "10 मिनट के लिए स्नूज़ किया गया" : "Snoozed for 10 minutes");
                    setActiveDueReminderAlert(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-all"
                >
                  {language === "hi" ? "स्नूज़" : "Snooze"}
                </button>
              </div>
            </div>
          )}

          {/* Global Floating Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white font-extrabold text-[12px] px-5 py-3 rounded-2xl shadow-xl z-[9999] flex items-center gap-2.5 max-w-[340px] text-center border border-white/10 no-invert">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>{toastMessage}</span>
            </div>
          )}
    </div>
  );
}
