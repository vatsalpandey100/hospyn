import React, { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  FlaskConical, 
  Activity, 
  FileText, 
  ShieldCheck, 
  Star, 
  Calendar, 
  Info,
  Sparkles,
  ArrowRight,
  Shield,
  Heart,
  CalendarCheck,
  Check,
  AlertTriangle,
  BookOpen,
  MapPin,
  Clock,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Appointment } from "../types";

interface MoreScreenProps {
  onBack: () => void;
  onNavigateTab: (tab: "HOME" | "APPOINTMENTS" | "RECORDS") => void;
  onOpenSymptomChecker: () => void;
  onOpenReportReader: () => void;
  onOpenFindSpecialist: () => void;
  onBookAppointment: () => void;
  patientId: string;
  patientName: string;
  patientConditions: string[];
  patientAllergies: string[];
  patientBloodGroup: string;
  patientPregnancy: string;
  patientDob: string;
  onAddAppointment?: (appt: Appointment) => void;
  language?: "en" | "hi";
}

interface LabTestPackage {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({
  onBack,
  onNavigateTab,
  onOpenSymptomChecker,
  onOpenReportReader,
  onOpenFindSpecialist,
  onBookAppointment,
  patientId,
  patientName,
  patientConditions,
  patientAllergies,
  patientBloodGroup,
  patientPregnancy,
  patientDob,
  onAddAppointment,
  language = "en"
}) => {
  const isHindi = language === "hi";
  // Nested sub-modals or views on More screen
  const [activeSubModal, setActiveSubModal] = useState<"NONE" | "LAB_TESTS" | "MEDICAL_HISTORY" | "HEALTH_TIPS" | "ABOUT_HOSPYN">("NONE");
  
  // Pre-fill tomorrow's date for lab booking
  const getTomorrowDateStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Lab Tests booking states
  const [selectedLabPackage, setSelectedLabPackage] = useState<string | null>(null);
  const [labBookingConfirmed, setLabBookingConfirmed] = useState(false);
  const [labBookingDate, setLabBookingDate] = useState(getTomorrowDateStr());
  const [labBookingTime, setLabBookingTime] = useState("08:00 AM - 10:00 AM");
  const [labAddressFlat, setLabAddressFlat] = useState("");
  const [labAddressStreet, setLabAddressStreet] = useState("");
  const [labAddressPincode, setLabAddressPincode] = useState("");
  const [labAddressCity, setLabAddressCity] = useState("");
  const [labAppointmentId, setLabAppointmentId] = useState("");

  const labPackages: LabTestPackage[] = [
    { id: "pkg-cbc", name: "Complete Hemogram (CBC)", description: "Evaluates overall health, checks for anemia, infection, and platelet levels.", price: "₹299", duration: "12 Hours" },
    { id: "pkg-thyroid", name: "Thyroid Profile (T3, T4, TSH)", description: "Comprehensive evaluation of thyroid gland activity and metabolic hormone balance.", price: "₹499", duration: "24 Hours" },
    { id: "pkg-lipid", name: "Lipid Profile (Cholesterol)", description: "Measures blood cholesterol and triglycerides to evaluate cardiovascular risks.", price: "₹399", duration: "8 Hours" },
    { id: "pkg-diabetes", name: "Diabetes Screening (HbA1c)", description: "Measures average blood sugar levels over 3 months; key marker for diabetes control.", price: "₹349", duration: "12 Hours" },
    { id: "pkg-lft", name: "Liver Function Test (LFT)", description: "Evaluates liver enzymes, protein, and bilirubin levels to assess complete liver health.", price: "₹449", duration: "15 Hours" },
    { id: "pkg-kft", name: "Kidney Function Test (KFT)", description: "Measures blood urea, creatinine, and electrolytes to evaluate kidney filtration efficiency.", price: "₹499", duration: "15 Hours" },
    { id: "pkg-vitamins", name: "Vitamin D & B12 Panel", description: "Assesses primary nutritional biomarkers essential for bone strength and nervous system.", price: "₹899", duration: "24 Hours" },
    { id: "pkg-fullbody", name: "Comprehensive Full Body Checkup", description: "All-in-one health screening including Lipids, CBC, HbA1c, Liver, Kidney, and Thyroid.", price: "₹1499", duration: "36 Hours" }
  ];

  const handleBookLabTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabPackage) return;
    if (!labAddressFlat || !labAddressStreet || !labAddressPincode || !labAddressCity) {
      alert("Please fill in your complete home collection address.");
      return;
    }
    const randNum = Math.floor(100000 + Math.random() * 900000);
    const appointmentId = `HSP-LAB-${randNum}`;
    setLabAppointmentId(appointmentId);
    setLabBookingConfirmed(true);

    if (onAddAppointment) {
      const selectedPkg = labPackages.find(p => p.id === selectedLabPackage);
      const bookingDate = labBookingDate || new Date().toISOString().split('T')[0];
      const parsedDate = new Date(bookingDate);
      
      onAddAppointment({
        id: appointmentId,
        patientId: patientId || "pat-vatsal",
        doctorId: "lab-technician",
        date: bookingDate,
        month: parsedDate.toLocaleString('en-US', { month: 'short' }),
        dayNum: parsedDate.getDate().toString(),
        dayName: parsedDate.toLocaleString('en-US', { weekday: 'short' }),
        time: labBookingTime,
        type: `Lab Test: ${selectedPkg?.name || "Blood Test"}`,
        status: "Confirmed",
        notes: `Home collection at: ${labAddressFlat}, ${labAddressStreet}, ${labAddressCity} - ${labAddressPincode}. Pay on Visit: ${selectedPkg?.price || "₹299"}.`
      });
    }
  };

  const getAge = (dob: string) => {
    if (!dob) return "N/A";
    const birthYear = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  };

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-screen bg-slate-50/50 pb-24 relative text-left" id="more-screen-layout">
      {/* ─── HEADER ─── */}
      <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white text-slate-700 flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all"
          id="more-back-btn"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <h1 className="font-extrabold text-slate-900 text-[18px]" id="more-title">{isHindi ? "अन्य सेवाएं" : "More"}</h1>
        <div className="w-10 h-10"></div> {/* Spacer for symmetry */}
      </div>

      <div className="p-4 space-y-6">
        {/* ─── BANNER WITH ILLUSTRATION ─── */}
        <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-blue-50/30 border border-blue-100/30 rounded-[28px] p-6 relative overflow-hidden flex justify-between items-center" id="more-all-features-banner">
          {/* Subtle decorative grid/dots in background */}
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none"></div>

          <div className="space-y-3 z-10 max-w-[60%] text-left">
            <h2 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight">{isHindi ? "सभी सुविधाएं" : "All Features"}</h2>
            <p className="text-[12px] text-slate-500 font-bold leading-relaxed">
              {isHindi ? "आपकी स्वास्थ्य यात्रा के लिए आवश्यक सब कुछ" : "Everything you need for your healthcare journey"}
            </p>
            {/* Blue indicator line */}
            <div className="w-12 h-1 bg-blue-600 rounded-full mt-2"></div>
          </div>

          {/* High-fidelity custom SVG Illustration (Matches the mockup 3D First Aid Kit + Beaker + leaves) */}
          <div className="w-[120px] h-[100px] shrink-0 relative z-10" id="banner-3d-illustration">
            <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
              {/* Soft shadows */}
              <ellipse cx="60" cy="85" rx="35" ry="6" fill="#1e3a8a" fillOpacity="0.08" />
              <ellipse cx="92" cy="85" rx="15" ry="3" fill="#1e3a8a" fillOpacity="0.05" />

              {/* Plants/Leaves Background */}
              <g opacity="0.8">
                {/* Stem & Leaves Left */}
                <path d="M40 75C34 68 36 50 36 50C36 50 48 56 46 68C44 75 40 75 40 75Z" fill="#93C5FD" />
                <path d="M36 62C30 58 28 46 28 46C28 46 38 48 39 56C40 60 36 62 36 62Z" fill="#60A5FA" />
                <path d="M41 72C38 70 38 65 41 63C44 61 46 65 44 68C43 71 41 72 41 72Z" fill="#3B82F6" />
              </g>

              {/* 3D Medical Kit Bag */}
              {/* Back shadows */}
              <rect x="52" y="32" width="50" height="46" rx="12" fill="#DBEAFE" />
              <rect x="50" y="34" width="50" height="44" rx="10" fill="#EBF3FF" />
              
              {/* Front Main Body */}
              <rect x="50" y="38" width="50" height="40" rx="10" fill="#FFFFFF" />
              {/* Depth bottom lip */}
              <path d="M50 68C50 73.5 54.5 78 60 78H90C95.5 78 100 73.5 100 68V72C100 75 97.5 78 94 78H56C52.5 78 50 75 50 72V68Z" fill="#D1E2FF" />

              {/* Blue handle */}
              <path d="M64 34V26C64 22.7 66.7 20 70 20H80C83.3 20 86 22.7 86 26V34" stroke="#3B82F6" strokeWidth="4.5" strokeLinecap="round" />
              <rect x="68" y="32" width="14" height="4" rx="2" fill="#2563EB" />

              {/* Medical Plus Cross on front (Large blue plus) */}
              <g id="medical-cross-logo">
                <rect x="71" y="50" width="8" height="16" rx="2.5" fill="#3B82F6" />
                <rect x="67" y="54" width="16" height="8" rx="2.5" fill="#3B82F6" />
              </g>

              {/* Glass Beaker/Flask */}
              <g opacity="0.95" id="glass-beaker">
                {/* Beaker Body */}
                <path d="M22 78C22 83.5 26.5 84 32 84C37.5 84 42 83.5 42 78L36 54V46H28V54L22 78Z" fill="#FFFFFF" fillOpacity="0.85" stroke="#BFDBFE" strokeWidth="1.5" />
                {/* Purple Fluid Level inside beaker */}
                <path d="M23.5 72C23.5 77.5 26.5 82.5 32 82.5C37.5 82.5 40.5 77.5 40.5 72H23.5Z" fill="#8B5CF6" fillOpacity="0.75" />
                {/* Bubble in fluid */}
                <circle cx="30" cy="76" r="1.5" fill="#FFFFFF" fillOpacity="0.8" />
                <circle cx="34" cy="74" r="1" fill="#FFFFFF" fillOpacity="0.8" />
                {/* Neck ring */}
                <rect x="27" y="44" width="10" height="3" rx="1.5" fill="#BFDBFE" />
              </g>

              {/* Floating sphere in front */}
              <circle cx="28" cy="80" r="5" fill="#3B82F6" />
              <circle cx="30" cy="79" r="1.5" fill="#FFFFFF" fillOpacity="0.6" />
            </svg>
          </div>
        </div>

        {/* ─── PATIENT SERVICES GRID ─── */}
        <div className="space-y-3.5 text-left">
          <h3 className="font-extrabold text-slate-900 text-[15px] px-1">{isHindi ? "मरीज़ सेवाएं" : "Patient Services"}</h3>
          
          <div className="grid grid-cols-2 gap-3.5" id="patient-services-grid">
            
            {/* 1. Lab Tests */}
            <button 
              onClick={() => setActiveSubModal("LAB_TESTS")}
              className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-blue-100 flex flex-col items-center text-center gap-3 transition-all active:scale-[0.98] group"
            >
              <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <FlaskConical className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xs tracking-tight">{isHindi ? "लैब टेस्ट" : "Lab Tests"}</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-normal">{isHindi ? "घर पर लैब टेस्ट बुक करें" : "Book lab tests at home"}</p>
              </div>
            </button>

            {/* 2. Health Records */}
            <button 
              onClick={() => {
                onNavigateTab("RECORDS");
                onBack();
              }}
              className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-emerald-100 flex flex-col items-center text-center gap-3 transition-all active:scale-[0.98] group"
            >
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <Activity className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xs tracking-tight">{isHindi ? "स्वास्थ्य रिकॉर्ड" : "Health Records"}</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-normal">{isHindi ? "अपने मेडिकल रिकॉर्ड्स देखें" : "View your medical records"}</p>
              </div>
            </button>

            {/* 3. Medical History */}
            <button 
              onClick={() => setActiveSubModal("MEDICAL_HISTORY")}
              className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-red-100 flex flex-col items-center text-center gap-3 transition-all active:scale-[0.98] group"
            >
              <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <FileText className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xs tracking-tight">{isHindi ? "चिकित्सा इतिहास" : "Medical History"}</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-normal">{isHindi ? "पिछली बीमारी व इतिहास देखें" : "View your past illness & history"}</p>
              </div>
            </button>

            {/* 4. Medical Reports */}
            <button 
              onClick={() => {
                onNavigateTab("RECORDS");
                onBack();
              }}
              className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-blue-100 flex flex-col items-center text-center gap-3 transition-all active:scale-[0.98] group"
            >
              <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <FileText className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xs tracking-tight">{isHindi ? "मेडिकल रिपोर्ट" : "Medical Reports"}</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-normal">{isHindi ? "लैब रिपोर्ट्स और फाइलें प्रबंधित करें" : "Manage your lab reports & history"}</p>
              </div>
            </button>

            {/* 5. Health Tips */}
            <button 
              onClick={() => setActiveSubModal("HEALTH_TIPS")}
              className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-amber-100 flex flex-col items-center text-center gap-3 transition-all active:scale-[0.98] group"
            >
              <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center transition-transform group-hover:scale-105">
                <Star className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xs tracking-tight">{isHindi ? "स्वास्थ्य टिप्स" : "Health Tips"}</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-normal">{isHindi ? "दैनिक स्वास्थ्य संबंधी उपयोगी सुझाव" : "Daily tips for a better life"}</p>
              </div>
            </button>

            {/* 6. Appointments */}
            <button 
              onClick={() => {
                onNavigateTab("APPOINTMENTS");
                onBack();
              }}
              className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-blue-100 flex flex-col items-center text-center gap-3 transition-all active:scale-[0.98] group"
            >
              <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <CalendarCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-xs tracking-tight">{isHindi ? "अपॉइंटमेंट्स" : "Appointments"}</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-normal">{isHindi ? "अपनी अपॉइंटमेंट्स देखें व प्रबंधित करें" : "View & manage your appointments"}</p>
              </div>
            </button>

          </div>
        </div>

        {/* ─── ABOUT HOSPYN SECTION ─── */}
        <div className="space-y-3.5 text-left">
          <h3 className="font-extrabold text-slate-900 text-[15px] px-1">{isHindi ? "Hospyn के बारे में" : "About Hospyn"}</h3>
          
          <button 
            onClick={() => setActiveSubModal("ABOUT_HOSPYN")}
            className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Info className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="text-left space-y-0.5">
                <h4 className="font-extrabold text-slate-900 text-xs leading-tight">{isHindi ? "Hospyn के बारे में जानकारी" : "About Hospyn"}</h4>
                <p className="text-[10px] text-slate-400 font-bold">{isHindi ? "संस्करण 1.0.0" : "Version 1.0.0"}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 stroke-[2.5]" />
          </button>
        </div>

      </div>

      {/* ─── SUB-MODAL OVERLAYS (AnimatePresence) ─── */}
      <AnimatePresence>
        
        {/* 1. LAB TESTS SUB-MODAL */}
        {activeSubModal === "LAB_TESTS" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end justify-center"
            onClick={() => {
              setActiveSubModal("NONE");
              setLabBookingConfirmed(false);
              setSelectedLabPackage(null);
            }}
          >
            <div 
              className="bg-white rounded-t-[32px] w-full max-w-[480px] max-h-[90vh] overflow-y-auto p-6 space-y-5 text-left shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Book Lab Tests at Home</h3>
                </div>
                <button 
                  onClick={() => {
                    setActiveSubModal("NONE");
                    setLabBookingConfirmed(false);
                    setSelectedLabPackage(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-100 p-1.5 rounded-full"
                >
                  ✕
                </button>
              </div>

              {!labBookingConfirmed ? (
                <form onSubmit={handleBookLabTest} className="space-y-4">
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    Select a premium clinical test package below. A trained clinical technician will visit your home to collect the sample securely.
                  </p>

                  {/* List of Packages */}
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {labPackages.map(pkg => (
                      <label 
                        key={pkg.id}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer block ${selectedLabPackage === pkg.id ? 'border-blue-500 bg-blue-50/20 shadow-sm' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}
                      >
                        <input 
                          type="radio" 
                          name="lab-package" 
                          className="mt-1"
                          checked={selectedLabPackage === pkg.id}
                          onChange={() => setSelectedLabPackage(pkg.id)}
                        />
                        <div className="flex-1 space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-900 text-xs">{pkg.name}</span>
                            <span className="font-black text-blue-600 text-xs">{pkg.price}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{pkg.description}</p>
                          <div className="text-[9px] text-slate-400 font-bold pt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Reports in {pkg.duration}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Date & Time Select */}
                  {selectedLabPackage && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4.5 pt-2"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase">Select Date</span>
                          <input 
                            type="date" 
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={labBookingDate}
                            onChange={(e) => setLabBookingDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase">Preferred Time</span>
                          <select 
                            value={labBookingTime}
                            onChange={(e) => setLabBookingTime(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                          >
                            <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM (Fasting)</option>
                            <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                            <option value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM</option>
                            <option value="04:00 PM - 07:00 PM">04:00 PM - 07:00 PM</option>
                          </select>
                        </div>
                      </div>

                      {/* Collection Address Fields */}
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                            Home Collection Address
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <input 
                            type="text" 
                            required
                            placeholder="Flat / House No. / Building / Floor"
                            value={labAddressFlat}
                            onChange={(e) => setLabAddressFlat(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                          />
                          <input 
                            type="text" 
                            required
                            placeholder="Street Name, Area, Locality"
                            value={labAddressStreet}
                            onChange={(e) => setLabAddressStreet(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text" 
                              required
                              placeholder="Pincode"
                              maxLength={6}
                              value={labAddressPincode}
                              onChange={(e) => setLabAddressPincode(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                            />
                            <input 
                              type="text" 
                              required
                              placeholder="City / State"
                              value={labAddressCity}
                              onChange={(e) => setLabAddressCity(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedLabPackage || !labBookingDate || !labAddressFlat || !labAddressStreet || !labAddressPincode || !labAddressCity}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                  >
                    <span>Confirm Home Collection Appointment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="py-6 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                    <Check className="w-7 h-7 stroke-[3]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm">Lab Appointment Scheduled!</h4>
                    <p className="text-xs text-slate-500 font-bold max-w-[280px] mx-auto">
                      A certified technician has been assigned to visit you on <strong className="text-slate-800">{new Date(labBookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong> during <strong className="text-slate-800">{labBookingTime}</strong>.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-2 max-w-[340px] mx-auto">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Appointment ID:</span>
                      <span className="text-blue-600 font-black select-all bg-blue-50/50 px-1.5 py-0.5 rounded-md border border-blue-100">{labAppointmentId}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Assigned Expert:</span>
                      <span className="text-slate-900 font-extrabold">Technician Rohan Sharma</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Selected Package:</span>
                      <span className="text-slate-900 font-extrabold">{labPackages.find(p => p.id === selectedLabPackage)?.name}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Total (Pay on Visit):</span>
                      <span className="text-blue-600 font-black">{labPackages.find(p => p.id === selectedLabPackage)?.price}</span>
                    </div>
                    <div className="border-t border-slate-200/60 pt-2 flex flex-col gap-1 text-[10px] text-slate-500 font-bold">
                      <span>Collection Location:</span>
                      <span className="text-slate-700 font-semibold leading-relaxed bg-white/70 p-2 rounded-xl border border-slate-100">
                        {labAddressFlat}, {labAddressStreet}, {labAddressCity} - {labAddressPincode}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveSubModal("NONE");
                      setLabBookingConfirmed(false);
                      setSelectedLabPackage(null);
                      onBack();
                      onNavigateTab("APPOINTMENTS");
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 2. MEDICAL HISTORY OVERLAY */}
        {activeSubModal === "MEDICAL_HISTORY" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setActiveSubModal("NONE")}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-[480px] max-h-[90vh] overflow-y-auto p-6 space-y-5 text-left shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Past Clinical History</h3>
                </div>
                <button 
                  onClick={() => setActiveSubModal("NONE")}
                  className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-100 p-1.5 rounded-full"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Profile Snapshot Card */}
                <div className="bg-gradient-to-r from-rose-50/50 to-orange-50/50 border border-rose-100/40 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-600 font-extrabold text-sm flex items-center justify-center shadow-inner">
                      {patientName.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div className="space-y-0.5 text-left">
                      <h4 className="font-black text-slate-900 text-xs leading-none">{patientName}</h4>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase">Age {getAge(patientDob)} · {patientBloodGroup} Blood</p>
                    </div>
                  </div>
                  
                  {patientPregnancy && (
                    <div className="bg-orange-500/10 text-orange-700 text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-orange-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Obstetrics Notice: Patient pregnancy active</span>
                    </div>
                  )}
                </div>

                {/* Conditions & Allergies */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Chronic Conditions</span>
                    {patientConditions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {patientConditions.map(cond => (
                          <span key={cond} className="bg-blue-50 text-blue-700 border border-blue-100/50 text-[10px] font-extrabold px-2 py-0.5 rounded-lg">{cond}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold block">No chronic conditions declared</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Known Allergies</span>
                    {patientAllergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {patientAllergies.map(alg => (
                          <span key={alg} className="bg-rose-50 text-rose-700 border border-rose-100/50 text-[10px] font-extrabold px-2 py-0.5 rounded-lg">{alg}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold block">No known allergies declared</span>
                    )}
                  </div>
                </div>

                {/* Digital Health Locker Secure Sign */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-left flex gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-black text-slate-800">Aadhaar Health Vault Verified</h5>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      All historical diagnoses and records are encrypted with your Aadhaar biometric credentials (E-KYC) and stored in your Digital Health Locker.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onNavigateTab("RECORDS");
                    setActiveSubModal("NONE");
                    onBack();
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Browse Raw Diagnostic PDFs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 3. HEALTH TIPS */}
        {activeSubModal === "HEALTH_TIPS" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end justify-center"
            onClick={() => setActiveSubModal("NONE")}
          >
            <div 
              className="bg-white rounded-t-[32px] w-full max-w-[480px] max-h-[90vh] overflow-y-auto p-6 space-y-5 text-left shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                    <Star className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Daily Health Tips</h3>
                </div>
                <button 
                  onClick={() => setActiveSubModal("NONE")}
                  className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-100 p-1.5 rounded-full"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {/* Personalized banner based on Asthma condition */}
                {patientConditions.some(c => c.toLowerCase().includes("asthma")) ? (
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-3 text-left">
                    <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-[11px] font-black text-blue-800 uppercase tracking-wider block">Asthma Management Tip</span>
                      <p className="text-[10.5px] text-slate-600 font-bold leading-relaxed">
                        With current seasonal shifts, pollen counts are high in Delhi. Ensure your dry-powder inhaler (DPI) is within reach, and wear a masks outdoors to prevent sudden asthma flare-ups.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex gap-3 text-left">
                    <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-[11px] font-black text-indigo-800 uppercase tracking-wider block">Clinical Insight Tip</span>
                      <p className="text-[10.5px] text-slate-600 font-bold leading-relaxed">
                        Maintain 150 minutes of moderate-intensity aerobic physical activity per week. Logging your steps and heart rate directly helps doctors evaluate baseline physical capacity.
                      </p>
                    </div>
                  </div>
                )}

                {/* 15 general beautiful tips cards */}
                <div className="space-y-3">
                  
                  {/* Tip 1 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Nutrition</span>
                      <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Hydration Baseline</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Drink 3 Liters of Water Daily</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Maintaining systemic hydration optimizes kidney function, clears toxic metabolic byproducts, and sustains mucous membrane integrity, helping guard against seasonal respiratory viral strains.
                    </p>
                  </div>

                  {/* Tip 2 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Cardiology</span>
                      <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Arterial Care</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Limit Sodium Consumption Below 2g</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Excessive salt intake raises arterial pressure by drawing water into the bloodstream. Reducing processed food intake maintains renal equilibrium and prevents chronic vascular strain.
                    </p>
                  </div>

                  {/* Tip 3 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Lifestyle &amp; Mind</span>
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Sleep Hygiene</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Maintain 7-8 Hours Sleep Loop</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Deep circadian-aligned sleep cycles are critical for cognitive recovery and cellular immunity. Avoid bright digital displays 45 minutes before sleep to stimulate natural melatonin production.
                    </p>
                  </div>

                  {/* Tip 4 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Mental Wellbeing</span>
                      <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Stress Reduction</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Practice 4-7-8 Breathing Technique</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Inhale for 4 seconds, hold for 7, and exhale for 8. Doing this for just 4 cycles downregulates your sympathetic nervous system, lowers high pulse rate, and mitigates acute cortisol spikes.
                    </p>
                  </div>

                  {/* Tip 5 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Ophthalmology</span>
                      <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Digital Eye Strain</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Adhere to the 20-20-20 Rule</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Every 20 minutes spent looking at a screen, take a break to look at an object 20 feet away for at least 20 seconds. This resets your focus muscles and prevents dry eyes and headaches.
                    </p>
                  </div>

                  {/* Tip 6 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Cardiology</span>
                      <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Active Lifestyle</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Accumulate 8,000 Steps Daily</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Consistent daily walking strengthens heart muscles, regulates systemic arterial blood pressure, improves HDL (good cholesterol), and boosts metabolic rates.
                    </p>
                  </div>

                  {/* Tip 7 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Ergonomics</span>
                      <span className="text-[9px] font-extrabold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Posture Align</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Align Screen to Eye Level</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Ensure your monitor is placed directly at eye level with your keyboard positioning allowing 90-degree arm folds. This prevents cervical spine compression and lower back muscle tension.
                    </p>
                  </div>

                  {/* Tip 8 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Immunology</span>
                      <span className="text-[9px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Micronutrient</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Optimize Vitamin D &amp; B12 Levels</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Get 15 minutes of safe sunlight exposure in the early morning, and consume fortified foods or quality supplements. These vitamins are vital for active T-cell response and neurological integrity.
                    </p>
                  </div>

                  {/* Tip 9 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Gastroenterology</span>
                      <span className="text-[9px] font-extrabold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">Gut Health</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Incorporate Probiotics &amp; High Fiber</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Eat natural curd, buttermilk, oats, and whole grains. A diverse gut microbiome regulates emotional mood (via the gut-brain axis), improves nutrition extraction, and supports systemic immunity.
                    </p>
                  </div>

                  {/* Tip 10 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Diabetology</span>
                      <span className="text-[9px] font-extrabold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">Glycemic Index</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Limit Refined Carbs &amp; Sugars</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Replace white rice and refined flour with complex whole grains. This slows glucose absorption rates, reducing sudden insulin spikes and preventing metabolic syndrome or type-2 diabetes.
                    </p>
                  </div>

                  {/* Tip 11 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Dermatology</span>
                      <span className="text-[9px] font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">Skin Defense</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Apply Broad-Spectrum Sunscreen</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Use SPF 30+ daily, even when staying indoors or on cloudy days. This protects epidermal cells from skin-damaging UVA and UVB radiation, preventing early aging and cellular mutations.
                    </p>
                  </div>

                  {/* Tip 12 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Pulmonology</span>
                      <span className="text-[9px] font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">Lungs</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Perform Deep Abdominal Breathing</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Spend 5 minutes daily on diaphragmatic breathing. This expands alveolar capacity, enhances gaseous transport exchange efficiency, and strengthens auxiliary respiratory muscles.
                    </p>
                  </div>

                  {/* Tip 13 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Dentistry</span>
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Oral Hygiene</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Floss Once Daily Before Bed</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Flossing targets interdental plaque biofilm that manual brushing cannot reach. Removing this prevents chronic gingivitis, tooth decay, and lower-level chronic inflammatory responses.
                    </p>
                  </div>

                  {/* Tip 14 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Orthopedics</span>
                      <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Joint Health</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Focus on Dynamic Stretching</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Spend 5 minutes doing shoulder rolls, neck stretches, and hamstring extensions if sitting for long hours. Dynamic stretches maintain synovial joint lubrication and reduce physical rigidity.
                    </p>
                  </div>

                  {/* Tip 15 */}
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Preventative Health</span>
                      <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Annual Checkups</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs">Schedule Regular Lab Screenings</h5>
                    <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                      Early detection through routine diagnostic panels (like lipids, glucose, liver, and kidney parameters) is the strongest defense against silent metabolic or cardiovascular diseases.
                    </p>
                  </div>

                </div>

                <button
                  onClick={() => setActiveSubModal("NONE")}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-2xl text-xs text-center transition-colors"
                >
                  Close Tips Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 4. ABOUT HOSPYN OVERLAY */}
        {activeSubModal === "ABOUT_HOSPYN" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end justify-center"
            onClick={() => setActiveSubModal("NONE")}
          >
            <div 
              className="bg-white rounded-t-[32px] w-full max-w-[480px] p-6 space-y-5 text-left shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">About Hospyn Digital Portal</h3>
                </div>
                <button 
                  onClick={() => setActiveSubModal("NONE")}
                  className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-100 p-1.5 rounded-full"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs font-bold text-slate-600 leading-relaxed">
                <div className="text-center py-3">
                  <div className="w-14 h-14 bg-blue-500 rounded-[18px] flex items-center justify-center shadow-lg relative mx-auto mb-3">
                    <div className="w-7 h-3 bg-white rounded-full"></div>
                    <div className="w-3 h-7 bg-white rounded-full absolute"></div>
                  </div>
                  <h4 className="font-black text-slate-900 text-[16px]">Hospyn</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Unified Health Locker</p>
                </div>

                <p className="text-slate-500 font-semibold text-center leading-relaxed">
                  Hospyn is a smart, fully integrated clinical platform and Digital Health Locker system designed to streamline patient care, OPD consultations, and diagnostic record analytics.
                </p>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <h5 className="font-black text-slate-900 text-[11px] uppercase tracking-wider">Platform Specifications:</h5>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Clinical Engine Version:</span>
                    <span className="text-slate-900 font-extrabold">v1.0.0 (Stable release)</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>AI Reasoning Models:</span>
                    <span className="text-slate-900 font-extrabold">Gemini 3.1 Pro &amp; 3.5 Flash</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Biometric Encryption:</span>
                    <span className="text-emerald-600 font-extrabold">AES-GCM-256 (Aadhaar Lockers)</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>SMS OTP Gateway:</span>
                    <span className="text-blue-600 font-extrabold">Hospyn Secure Real-Time</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-bold text-center pt-2">
                  © 2026 Hospyn Digital Network, Inc. All rights reserved.
                </div>

                <button
                  onClick={() => setActiveSubModal("NONE")}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-2xl text-xs transition-colors"
                >
                  Close specifications
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
