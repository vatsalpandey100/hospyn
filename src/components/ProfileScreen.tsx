import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Heart, 
  Shield, 
  Baby, 
  Clipboard, 
  Folder, 
  Phone, 
  Lock, 
  Bell, 
  Globe, 
  LogOut, 
  Camera, 
  Calendar, 
  ChevronRight, 
  ChevronDown, 
  ShieldCheck, 
  Mail, 
  ArrowLeft, 
  Settings, 
  Check,
  Droplet,
  Moon,
  Sun,
  MapPin
} from "lucide-react";
import { Patient } from "../types";
import { FallbackImage } from "./FallbackImage";
import { PrescriptionReminderManager } from "./PrescriptionReminderManager";
import { PWAInstallButton } from "./PWAInstallButton";

interface ProfileScreenProps {
  activePatient: Patient;
  onUpdatePatient: (updated: Patient) => void;
  onLogOut: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  appName?: string;
  language?: "en" | "hi";
  onSelectLanguage?: (lang: "en" | "hi") => void;
  onReplayCinematicIntro?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  activePatient,
  onUpdatePatient,
  onLogOut,
  isDarkMode,
  onToggleDarkMode,
  appName = "Hospyn",
  language = "en",
  onSelectLanguage,
  onReplayCinematicIntro
}) => {
  const isHindi = language === "hi";
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States for Edit Profile
  const [name, setName] = useState(activePatient.name);
  const [dob, setDob] = useState(activePatient.dob);
  const [gender, setGender] = useState(activePatient.gender);
  const [phone, setPhone] = useState(activePatient.phone);
  const [email, setEmail] = useState(activePatient.email);
  const [bloodGroup, setBloodGroup] = useState(activePatient.bloodGroup);
  const [address, setAddress] = useState(activePatient.address || "Sector 45, Gurugram, Haryana, India - 122003");
  const [flatHouseNo, setFlatHouseNo] = useState(activePatient.flatHouseNo || "");
  const [streetArea, setStreetArea] = useState(activePatient.streetArea || "");
  const [city, setCity] = useState(activePatient.city || "");
  const [stateName, setStateName] = useState(activePatient.state || "");
  const [pincode, setPincode] = useState(activePatient.pincode || "");
  const [photo, setPhoto] = useState<string | null>(activePatient.photo || null);

  React.useEffect(() => {
    setName(activePatient.name);
    setDob(activePatient.dob);
    setGender(activePatient.gender);
    setPhone(activePatient.phone);
    setEmail(activePatient.email);
    setBloodGroup(activePatient.bloodGroup);
    setAddress(activePatient.address || "Sector 45, Gurugram, Haryana, India - 122003");
    setFlatHouseNo(activePatient.flatHouseNo || "");
    setStreetArea(activePatient.streetArea || "");
    setCity(activePatient.city || "");
    setStateName(activePatient.state || "");
    setPincode(activePatient.pincode || "");
    setPhoto(activePatient.photo || null);
  }, [activePatient]);

  // Sub-sections Dialog States
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  // Custom Alert / Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        showToast("Profile photo selected!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast("Full Name is required");
      return;
    }
    if (!phone.trim()) {
      showToast("Mobile Number is required");
      return;
    }

    const updated: Patient = {
      ...activePatient,
      name,
      dob,
      gender,
      phone,
      email,
      bloodGroup,
      address,
      flatHouseNo,
      streetArea,
      city,
      state: stateName,
      pincode,
      photo: photo || undefined
    };

    onUpdatePatient(updated);
    setIsEditing(false);
    showToast("Profile updated successfully!");
  };

  // Format date of birth to e.g. "27 Aug 2009"
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    return dateStr;
  };

  // Helper to format phone to "+91 XXXXX XXXXX" or similar
  const formatPhone = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, "");
    if (clean.length === 10) {
      return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
    }
    if (phoneStr.startsWith("+")) return phoneStr;
    return `+91 ${phoneStr}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-full z-[300] shadow-xl flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          /* ─── MY PROFILE MAIN SCREEN ─── */
          <motion.div
            key="profile-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col pb-24"
          >
            {/* Header section matching exact mockup layout */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between bg-white">
              {/* App Brand Logo */}
              <FallbackImage type="header-logo" className="text-slate-900" />
              
              {/* Top Icons */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={onToggleDarkMode}
                  className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-600 transition-colors"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => showToast("Profile settings aligned and optimized.")}
                  className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-600 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* My Profile Page Title Box */}
            <div className="px-6 pt-2 pb-4 flex justify-between items-start bg-white relative overflow-hidden">
              <div className="space-y-1 max-w-[240px] z-10">
                <h1 className="text-[28px] font-black text-slate-900 tracking-tight">
                  {isHindi ? "मेरी प्रोफाइल" : "My Profile"}
                </h1>
                <p className="text-slate-500 font-semibold text-xs leading-relaxed">
                  {isHindi ? "अपनी स्वास्थ्य संबंधी जानकारी और प्राथमिकताओं का प्रबंधन करें" : "Manage your health information and preferences"}
                </p>
              </div>
              
              {/* Gorgeous Floating Vector Illustration mimicking the mockup */}
              <div className="absolute right-4 top-1 w-28 h-24 pointer-events-none opacity-90 select-none z-0">
                <div className="w-full h-full relative">
                  {/* Styled Cloud Background */}
                  <div className="absolute inset-0 bg-blue-50/70 rounded-[40px] blur-xl"></div>
                  {/* Subtle Profile Badge Graphic */}
                  <div className="absolute top-2 right-4 w-14 h-14 bg-blue-100/60 rounded-full flex items-center justify-center text-blue-500">
                    <User className="w-8 h-8 opacity-70" />
                  </div>
                  {/* Little Leaves Decoration */}
                  <div className="absolute bottom-2 left-6 w-3 h-3 bg-emerald-100 rounded-full"></div>
                  <div className="absolute bottom-4 left-10 w-2 h-2 bg-emerald-200 rounded-full"></div>
                  {/* Shield with Plus inside */}
                  <div className="absolute bottom-1 right-2 w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
                    <span className="font-extrabold text-sm leading-none">+</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Detail Card */}
            <div className="px-6 mt-1">
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full bg-white border border-slate-100/90 rounded-[28px] p-5 flex items-center justify-between text-left shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:border-blue-100 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Profile Picture */}
                  <div className="w-[72px] h-[72px] rounded-full border-2 border-slate-50 bg-slate-100/80 shrink-0 overflow-hidden relative shadow-sm">
                    {photo ? (
                      <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-700 font-extrabold text-2xl">
                        {name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Text Details */}
                  <div className="space-y-1">
                    <h2 className="font-black text-slate-900 text-lg tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                      {name}
                    </h2>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        {formatPhone(phone)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        {email}
                      </span>
                      {address && (
                        <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{address}</span>
                        </span>
                      )}
                    </div>
                    {/* Verified badge */}
                    <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1 border border-blue-100/30">
                      <span className="text-[9.5px] font-black uppercase tracking-wider">
                        {isHindi ? "सत्यापित" : "Verified"}
                      </span>
                      <ShieldCheck className="w-3 h-3 fill-blue-600 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Arrow chevron */}
                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center transition-all shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>

            {/* Health Summary Sections */}
            <div className="px-6 mt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {isHindi ? "स्वास्थ्य सारांश" : "Health Summary"}
                </h3>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-[12px] text-blue-600 font-extrabold hover:underline"
                >
                  {isHindi ? "सभी देखें" : "View All"}
                </button>
              </div>

              {/* Horizontal Scroll / Flex list of Summary Cards */}
              <div className="grid grid-cols-4 gap-2">
                {/* 1. Blood Group */}
                <div className="bg-rose-50/40 border border-rose-100/40 rounded-2xl p-3 flex flex-col items-center justify-between text-center min-h-[96px]">
                  <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <Droplet className="w-3.5 h-3.5 fill-rose-500" />
                  </div>
                  <span className="text-[9.5px] font-extrabold text-slate-400 mt-1 leading-tight">
                    {isHindi ? "रक्त समूह" : "Blood Group"}
                  </span>
                  <span className="text-base font-black text-rose-600 mt-1">{bloodGroup || "O+"}</span>
                </div>

                {/* 2. Chronic Conditions */}
                <div className="bg-emerald-50/40 border border-emerald-100/40 rounded-2xl p-3 flex flex-col items-center justify-between text-center min-h-[96px]">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 fill-emerald-600" />
                  </div>
                  <span className="text-[9.5px] font-extrabold text-slate-400 mt-1 leading-tight">
                    {isHindi ? "दीर्घकालिक बीमारियां" : "Chronic Conditions"}
                  </span>
                  <span className="text-base font-black text-emerald-600 mt-1">{activePatient.chronicConditions?.length || 0}</span>
                </div>

                {/* 3. Allergies */}
                <div className="bg-purple-50/40 border border-purple-100/40 rounded-2xl p-3 flex flex-col items-center justify-between text-center min-h-[96px]">
                  <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 fill-purple-600" />
                  </div>
                  <span className="text-[9.5px] font-extrabold text-slate-400 mt-1 leading-tight">
                    {isHindi ? "एलर्जी" : "Allergies"}
                  </span>
                  <span className="text-base font-black text-purple-600 mt-1">{activePatient.allergies?.length || 0}</span>
                </div>

                {/* 4. Pregnancy Status */}
                <div className="bg-blue-50/40 border border-blue-100/40 rounded-2xl p-3 flex flex-col items-center justify-between text-center min-h-[96px]">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Baby className="w-3.5 h-3.5 fill-blue-600" />
                  </div>
                  <span className="text-[9.5px] font-extrabold text-slate-400 mt-1 leading-tight">
                    {isHindi ? "गर्भावस्था स्थिति" : "Pregnancy Status"}
                  </span>
                  <span className="text-base font-black text-blue-600 mt-1">{activePatient.pregnancyStatus || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Menu List Options */}
            <div className="px-6 mt-6 space-y-2.5">
              
              {/* Option 1: Personal Information */}
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-[12.5px] leading-tight">
                      {isHindi ? "व्यक्तिगत जानकारी" : "Personal Information"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold block mt-0.5">
                      {isHindi ? "अपनी व्यक्तिगत जानकारी देखें और बदलें" : "View and update your personal details"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>

              {/* Option 2: Medical Information */}
              <button 
                onClick={() => setActiveDialog("MEDICAL_INFO")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Clipboard className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-[12.5px] leading-tight">
                      {isHindi ? "चिकित्सा जानकारी" : "Medical Information"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold block mt-0.5">
                      {isHindi ? "अपनी स्वास्थ्य संबंधी जानकारी प्रबंधित करें" : "Manage your health information"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>

              {/* Option 3: Medical Records */}
              <button 
                onClick={() => setActiveDialog("MEDICAL_RECORDS")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Folder className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-[12.5px] leading-tight">
                      {isHindi ? "चिकित्सा रिकॉर्ड" : "Medical Records"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold block mt-0.5">
                      {isHindi ? "अपलोड की गई रिपोर्ट और दस्तावेज़" : "Uploaded reports and documents"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>

              {/* Option 4: Emergency Contact */}
              <button 
                onClick={() => setActiveDialog("EMERGENCY_CONTACT")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-[12.5px] leading-tight">
                      {isHindi ? "आपातकालीन संपर्क" : "Emergency Contact"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold block mt-0.5">
                      {isHindi ? "आपातकालीन संपर्कों का प्रबंधन करें" : "Manage emergency contacts"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>

              {/* Option 5: Privacy & Data */}
              <button 
                onClick={() => setActiveDialog("PRIVACY_DATA")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-[12.5px] leading-tight">
                      {isHindi ? "गोपनीयता और डेटा" : "Privacy & Data"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold block mt-0.5">
                      {isHindi ? "अपनी गोपनीयता प्राथमिकताओं का प्रबंधन करें" : "Manage your privacy preferences"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>

              {/* Option 6: Notification Settings */}
              <button 
                onClick={() => setActiveDialog("NOTIFICATIONS")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Bell className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-[12.5px] leading-tight">
                      {isHindi ? "सूचना सेटिंग्स" : "Notification Settings"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold block mt-0.5">
                      {isHindi ? "अपनी सूचना प्राथमिकताओं का प्रबंधन करें" : "Manage your notification preferences"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>

              {/* Option 7: Language */}
              <button 
                onClick={() => setActiveDialog("LANGUAGE")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Globe className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-[12.5px] leading-tight">
                      {isHindi ? "भाषा (Language)" : "Language"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold block mt-0.5">
                      {isHindi ? "अपनी पसंदीदा भाषा चुनें" : "Choose your preferred language"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11.5px] font-extrabold text-blue-600">
                    {language === "hi" ? "हिन्दी (Hindi)" : "English"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>

              {/* Option 8: Theme Mode */}
              <button 
                onClick={onToggleDarkMode}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-[12.5px] leading-tight">
                      {isHindi ? "थीम मोड" : "Theme Mode"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold block mt-0.5">
                      {isHindi ? "लाइट और डार्क मोड के बीच स्विच करें" : "Toggle between Light and Dark mode"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11.5px] font-extrabold text-blue-600">
                    {isDarkMode ? (isHindi ? "डार्क मोड" : "Dark Mode") : (isHindi ? "लाइट मोड" : "Light Mode")}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>

              {/* Option 9: Install App (Chrome PWA) */}
              <PWAInstallButton 
                variant="menu-item" 
                language={language} 
                isDarkMode={isDarkMode} 
              />

              {/* Option 10: Replay Cinematic Opening */}
              {onReplayCinematicIntro && (
                <button 
                  onClick={onReplayCinematicIntro}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50/60 transition-colors text-left group"
                  id="btn-replay-cinematic-intro"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="50" cy="25" rx="13" ry="18" fill="#38bdf8" />
                        <ellipse cx="50" cy="75" rx="13" ry="18" fill="#2563eb" />
                        <ellipse cx="25" cy="50" rx="18" ry="13" fill="#60a5fa" />
                        <ellipse cx="75" cy="50" rx="18" ry="13" fill="#38bdf8" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-[12.5px] leading-tight">
                        {isHindi ? "सिनेमैटिक ओपनिंग देखें" : "Cinematic Brand Intro"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold block mt-0.5">
                        {isHindi ? "हॉस्पिन का प्रीमियम ओपनिंग एनिमेशन दोबारा चलाएं" : "Replay the signature split-door opening animation"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              )}

            </div>

            {/* Logout Action Button */}
            <div className="px-6 mt-8">
              <button
                onClick={onLogOut}
                className="w-full border border-rose-100 hover:bg-rose-50/50 text-rose-600 font-extrabold text-xs py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(244,63,94,0.015)]"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>{isHindi ? "लॉग आउट" : "Log Out"}</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* ─── EDIT PROFILE VIEW (RIGHT SCREEN) ─── */
          <motion.div
            key="profile-edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col pb-24"
          >
            {/* Header top bar */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-100/70 bg-white sticky top-0 z-10">
              <button 
                onClick={() => setIsEditing(false)}
                className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
              
              <h2 className="font-black text-slate-900 text-base">
                {isHindi ? "प्रोफाइल संपादित करें" : "Edit Profile"}
              </h2>
              
              <button
                onClick={handleSave}
                className="text-xs font-black text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3.5 py-1.5 rounded-full transition-colors"
              >
                {isHindi ? "सहेजें" : "Save"}
              </button>
            </div>

            {/* Change Profile Photo section */}
            <div className="flex flex-col items-center justify-center py-6 bg-slate-50/30 border-b border-slate-50">
              <div className="relative cursor-pointer group" onClick={handlePhotoClick}>
                {/* Image or letter wrapper */}
                <div className="w-[88px] h-[88px] rounded-full border-4 border-white bg-slate-100 shadow-md shrink-0 overflow-hidden relative">
                  {photo ? (
                    <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-700 font-extrabold text-3xl">
                      {name.charAt(0)}
                    </div>
                  )}
                </div>
                
                {/* Camera Overlay Badge */}
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center shadow transition-transform group-hover:scale-105">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              <button 
                onClick={handlePhotoClick}
                className="text-[11.5px] font-black text-blue-600 mt-2 hover:underline"
              >
                {isHindi ? "प्रोफाइल फोटो बदलने के लिए टैप करें" : "Tap to change profile photo"}
              </button>
            </div>

            {/* Personal Information form fields */}
            <div className="p-6 space-y-4">
              <h3 className="text-[11.5px] font-black text-slate-400 uppercase tracking-wider mb-1">
                {isHindi ? "व्यक्तिगत जानकारी" : "Personal Information"}
              </h3>

              {/* 1. Full Name */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">
                  {isHindi ? "पूरा नाम" : "Full Name"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    placeholder={isHindi ? "पूरा नाम दर्ज करें" : "Enter full name"}
                  />
                </div>
              </div>

              {/* 2. Date of Birth */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">
                  {isHindi ? "जन्म तिथि" : "Date of Birth"}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-10 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                </div>
                {/* Formatted DOB under-label for high correspondence with screenshot */}
                <span className="text-[10px] text-slate-400 font-bold block mt-1">
                  {isHindi ? "स्वरूप पूर्वावलोकन:" : "Format Preview:"} {formatDateString(dob)}
                </span>
              </div>

              {/* 3. Gender */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">
                  {isHindi ? "लिंग" : "Gender"}
                </label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none"
                  >
                    <option value="Male">{isHindi ? "पुरुष (Male)" : "Male"}</option>
                    <option value="Female">{isHindi ? "महिला (Female)" : "Female"}</option>
                    <option value="Other">{isHindi ? "अन्य (Other)" : "Other"}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 4. Mobile Number */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">
                  {isHindi ? "मोबाइल नंबर (बदला नहीं जा सकता)" : "Mobile Number (Cannot be changed)"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    disabled
                    className="w-full bg-slate-100/70 border border-slate-200 rounded-xl pl-4 pr-24 py-3 text-xs font-bold text-slate-500 cursor-not-allowed transition-all"
                    placeholder={isHindi ? "मोबाइल नंबर दर्ज करें" : "Enter mobile number"}
                  />
                  
                  {/* Verified blue badge on the right side of the input box */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100/50">
                    <span className="text-[9px] font-black uppercase tracking-wider">
                      {isHindi ? "सत्यापित" : "Verified"}
                    </span>
                    <ShieldCheck className="w-3 h-3 fill-blue-600 text-white" />
                  </div>
                </div>
              </div>

              {/* 5. Email Address */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">
                  {isHindi ? "ईमेल पता" : "Email Address"}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    placeholder={isHindi ? "ईमेल पता दर्ज करें" : "Enter email address"}
                  />
                </div>
              </div>

              {/* 6. Blood Group */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">
                  {isHindi ? "रक्त समूह" : "Blood Group"}
                </label>
                <div className="relative">
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 7. Address Details */}
              <div className="space-y-3 pt-2 text-left border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                    {isHindi ? "पता विवरण (Address Details)" : "Address Details"}
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      {isHindi ? "मकान / फ्लैट न०" : "House / Flat No."}
                    </label>
                    <input
                      type="text"
                      value={flatHouseNo}
                      onChange={(e) => {
                        setFlatHouseNo(e.target.value);
                        const parts = [e.target.value, streetArea, city, stateName, pincode ? `- ${pincode}` : ''].filter(Boolean);
                        setAddress(parts.join(", "));
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="e.g. Flat 402"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      {isHindi ? "सड़क / क्षेत्र" : "Street / Area"}
                    </label>
                    <input
                      type="text"
                      value={streetArea}
                      onChange={(e) => {
                        setStreetArea(e.target.value);
                        const parts = [flatHouseNo, e.target.value, city, stateName, pincode ? `- ${pincode}` : ''].filter(Boolean);
                        setAddress(parts.join(", "));
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="e.g. Sector 45"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      {isHindi ? "शहर" : "City"}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        const parts = [flatHouseNo, streetArea, e.target.value, stateName, pincode ? `- ${pincode}` : ''].filter(Boolean);
                        setAddress(parts.join(", "));
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="e.g. Gurugram"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      {isHindi ? "राज्य" : "State"}
                    </label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => {
                        setStateName(e.target.value);
                        const parts = [flatHouseNo, streetArea, city, e.target.value, pincode ? `- ${pincode}` : ''].filter(Boolean);
                        setAddress(parts.join(", "));
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="e.g. Haryana"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">
                      {isHindi ? "पिनकोड" : "Pincode"}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setPincode(val);
                        const parts = [flatHouseNo, streetArea, city, stateName, val ? `- ${val}` : ''].filter(Boolean);
                        setAddress(parts.join(", "));
                      }}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="122003"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">
                    {isHindi ? "पूरा पता (संयुक्त)" : "Full Combined Address"}
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                    placeholder={isHindi ? "पूरा पता दर्ज करें" : "Enter full address"}
                  />
                </div>
              </div>

              {/* Read Only/Summary Section from right screen */}
              <div className="pt-2 space-y-3">
                <h4 className="text-[11.5px] font-black text-slate-400 uppercase tracking-wider">
                  {isHindi ? "स्वास्थ्य जानकारी (सारांश)" : "Health Information (Summary)"}
                </h4>
                
                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                  <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100/80">
                    <span className="text-xs font-bold text-slate-700">
                      {isHindi ? "दीर्घकालिक बीमारियां" : "Chronic Conditions"}
                    </span>
                    <span className="text-xs font-black text-blue-600">{activePatient.chronicConditions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100/80">
                    <span className="text-xs font-bold text-slate-700">
                      {isHindi ? "एलर्जी" : "Allergies"}
                    </span>
                    <span className="text-xs font-black text-blue-600">{activePatient.allergies?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-xs font-bold text-slate-700">
                      {isHindi ? "गर्भावस्था की स्थिति" : "Pregnancy Status"}
                    </span>
                    <span className="text-xs font-black text-blue-600">{activePatient.pregnancyStatus || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Safe & Secure Info Badge */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-left">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 fill-blue-600 text-white" />
                </div>
                <div>
                  <h5 className="font-extrabold text-blue-900 text-xs">
                    {isHindi ? "आपका डेटा पूरी तरह सुरक्षित है" : "Your data is safe and secure"}
                  </h5>
                  <p className="text-[10px] text-blue-700 font-medium leading-relaxed mt-0.5">
                    {isHindi 
                      ? "हम आपकी व्यक्तिगत और चिकित्सा जानकारी की सुरक्षा के लिए उन्नत एन्क्रिप्शन का उपयोग करते हैं।" 
                      : "We use advanced encryption to protect your personal and medical information."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUB-SECTIONS MODAL / DIALOG POPUPS */}
      <AnimatePresence>
        {activeDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-end justify-center"
            onClick={() => setActiveDialog(null)}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
              className="bg-white rounded-t-[32px] w-full max-w-[480px] max-h-[75vh] overflow-y-auto p-6 space-y-4 text-left shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">
                  {activeDialog === "MEDICAL_INFO" ? (isHindi ? "चिकित्सा जानकारी" : "Medical Info") :
                   activeDialog === "MEDICAL_RECORDS" ? (isHindi ? "चिकित्सा रिकॉर्ड" : "Medical Records") :
                   activeDialog === "EMERGENCY_CONTACT" ? (isHindi ? "आपातकालीन संपर्क" : "Emergency Contact") :
                   activeDialog === "PRIVACY_DATA" ? (isHindi ? "गोपनीयता और डेटा" : "Privacy & Data") :
                   activeDialog === "NOTIFICATIONS" ? (isHindi ? "सूचना सेटिंग्स" : "Notifications") :
                   activeDialog === "LANGUAGE" ? (isHindi ? "भाषा (Language)" : "Language") :
                   activeDialog.replace("_", " ")}
                </h3>
                <button
                  onClick={() => setActiveDialog(null)}
                  className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-100 p-2 rounded-full"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body Content depending on what was clicked */}
              <div className="space-y-3 pb-6">
                {activeDialog === "MEDICAL_INFO" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {isHindi 
                        ? "आपके पंजीकृत चिकित्सा रिकॉर्ड में निम्नलिखित क्लिनिकल स्थितियां और लक्षण शामिल हैं:" 
                        : "Your registered medical records indicate the following clinical conditions and symptoms actively monitored:"}
                    </p>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">
                        {isHindi ? "दीर्घकालिक बीमारियां" : "Diagnosed Chronic Illnesses"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activePatient.chronicConditions?.map((cond) => (
                          <span key={cond} className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10.5px] font-black px-3 py-1 rounded-lg">
                            {cond}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase">
                        {isHindi ? "पंजीकृत एलर्जी" : "Registered Allergies"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activePatient.allergies?.map((allergy) => (
                          <span key={allergy} className="bg-purple-50 text-purple-700 border border-purple-100 text-[10.5px] font-black px-3 py-1 rounded-lg">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeDialog === "MEDICAL_RECORDS" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {isHindi 
                        ? "आप नीचे दिए गए नेविगेशन बार में **रिकॉर्ड (Records)** टैब में अपनी पूरी रिपोर्ट और इतिहास देख सकते हैं।" 
                        : "You can access and view your fully detailed clinical file download vault and upload history in the dedicated **Records** tab on the navigation bar."}
                    </p>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                      <Folder className="w-6 h-6 text-purple-500 shrink-0" />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">
                          {isHindi ? "एकल रिकॉर्ड भंडार" : "Unified Record Repository"}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold block mt-0.5">
                          {isHindi 
                            ? "इसमें लैब रिपोर्ट, AI सारांश और रसीदें शामिल हैं।" 
                            : "Includes automatic lab reports, AI synopses, and PDF receipts."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDialog === "EMERGENCY_CONTACT" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {isHindi 
                        ? "आपात स्थिति में हॉस्पिन आपके निर्दिष्ट आपातकालीन संपर्क से तुरंत संपर्क करेगा:" 
                        : "In the event of an emergency, Hospyn will immediately reach out to your specified emergency responder:"}
                    </p>
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          {isHindi ? "मुख्य संपर्क" : "Primary Kin"}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">Dr. Alok Pandey</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-bold">
                        {isHindi ? "संबंध: पिता" : "Relationship: Father"}
                      </p>
                      <p className="text-[11px] text-slate-600 font-bold">
                        {isHindi ? "संपर्क: +91 91234 56789" : "Contact: +91 91234 56789"}
                      </p>
                    </div>
                  </div>
                )}

                {activeDialog === "PRIVACY_DATA" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {isHindi 
                        ? "आपका सारा डेटा एन्क्रिप्टेड और सुरक्षित है। आप नियंत्रित कर सकते हैं कि आपकी स्वास्थ्य जानकारी तक किसकी पहुंच है:" 
                        : "All your data is fully encrypted using HIPAA-compliant AES-256 standards. You control which hospitals have access to your health profile:"}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-xs font-bold text-slate-700">
                          {isHindi ? "अस्पताल के साथ साझाकरण" : "Allow Hospital Sharing"}
                        </span>
                        <span className="text-xs font-black text-emerald-600">
                          {isHindi ? "सक्षम" : "ENABLED"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-xs font-bold text-slate-700">
                          {isHindi ? "एन्क्रिप्टेड क्लाउड सिंक" : "Encrypted Backup Cloud Sync"}
                        </span>
                        <span className="text-xs font-black text-emerald-600">
                          {isHindi ? "सक्रिय" : "ACTIVE"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDialog === "NOTIFICATIONS" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {isHindi 
                        ? "सक्रिय दवाओं के लिए सुबह/शाम के रिमाइंडर समय और पुश सूचनाएं प्रबंधित करें:" 
                        : "Configure morning and evening push reminder schedules for active prescriptions:"}
                    </p>

                    <PrescriptionReminderManager
                      language={language}
                      patientId={activePatient?.id || "pat-1"}
                      patientName={activePatient?.name || "Gunjan Sharma"}
                      onShowToast={showToast}
                    />

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                        {isHindi ? "अतिरिक्त संचार चैनल" : "Additional Channels"}
                      </h5>
                      <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-xs font-bold text-slate-700">
                          {isHindi ? "SMS और OTP" : "SMS Verification & OTPs"}
                        </span>
                        <span className="text-xs font-black text-emerald-600">
                          {isHindi ? "सक्षम" : "ENABLED"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-xs font-bold text-slate-700">
                          {isHindi ? "व्हाट्सएप रिपोर्ट डिलीवरी" : "WhatsApp Reports Delivery"}
                        </span>
                        <span className="text-xs font-black text-emerald-600">
                          {isHindi ? "सक्षम" : "ENABLED"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDialog === "LANGUAGE" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {language === "hi" 
                        ? "ऐप की भाषा और AI सहायकों की भाषा चुनें:" 
                        : "Choose the primary language for AI assistants and clinical services:"}
                    </p>
                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          if (onSelectLanguage) onSelectLanguage("en");
                          showToast("Language changed to English");
                          setActiveDialog(null);
                        }}
                        className={`w-full flex justify-between items-center p-3 border rounded-xl text-left transition-all ${
                          language === "en" 
                            ? "border-blue-200 bg-blue-50/70 shadow-2xs" 
                            : "border-slate-100 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <span className={`text-xs ${language === "en" ? "font-black text-blue-600" : "font-bold text-slate-700"}`}>
                          English (Default)
                        </span>
                        {language === "en" && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                      <button 
                        onClick={() => {
                          if (onSelectLanguage) onSelectLanguage("hi");
                          showToast("भाषा हिन्दी में बदल दी गई है (Language set to Hindi)");
                          setActiveDialog(null);
                        }}
                        className={`w-full flex justify-between items-center p-3 border rounded-xl text-left transition-all ${
                          language === "hi" 
                            ? "border-blue-200 bg-blue-50/70 shadow-2xs" 
                            : "border-slate-100 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className={`text-xs ${language === "hi" ? "font-black text-blue-600" : "font-bold text-slate-700"}`}>
                            Hindi (हिन्दी)
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {language === "hi" ? "AI जवाब भी हिन्दी में देगा" : "AI will respond in Hindi"}
                          </span>
                        </div>
                        {language === "hi" && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Close Sheet Button */}
              <button
                onClick={() => setActiveDialog(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-2xl text-xs text-center transition-colors"
              >
                {isHindi ? "बंद करें" : "Close View"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
