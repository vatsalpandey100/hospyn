import React, { useState } from "react";
import { 
  Shield, 
  Users, 
  Stethoscope, 
  Building2, 
  Calendar, 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Activity, 
  Clock, 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Check, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  Star, 
  DollarSign,
  ChevronRight,
  Eye
} from "lucide-react";
import { Patient, Doctor, Hospital, Appointment, MedicalRecord } from "../types";

interface AdminDashboardProps {
  onBack: () => void;
  registeredPatients: Patient[];
  setRegisteredPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  doctorsList: Doctor[];
  setDoctorsList: React.Dispatch<React.SetStateAction<Doctor[]>>;
  hospitalsList: Hospital[];
  setHospitalsList: React.Dispatch<React.SetStateAction<Hospital[]>>;
  appointmentsList: Appointment[];
  setAppointmentsList: React.Dispatch<React.SetStateAction<Appointment[]>>;
  recordsList: MedicalRecord[];
  setRecordsList: React.Dispatch<React.SetStateAction<MedicalRecord[]>>;
  onResetSystemData?: () => void;
}

export function AdminDashboard({
  onBack,
  registeredPatients,
  setRegisteredPatients,
  doctorsList,
  setDoctorsList,
  hospitalsList,
  setHospitalsList,
  appointmentsList,
  setAppointmentsList,
  recordsList,
  setRecordsList,
  onResetSystemData
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "doctors" | "hospitals" | "appointments" | "records" | "audit">("overview");

  // Search & Filter queries
  const [userSearch, setUserSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointmentFilterStatus, setAppointmentFilterStatus] = useState<string>("ALL");

  // Toast message
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Activity log state
  const [activityLogs, setActivityLogs] = useState<Array<{ id: string; time: string; text: string; category: string }>>([
    { id: "1", time: "Just now", text: "Admin logged into System Manager Console", category: "Auth" },
    { id: "2", time: "10 mins ago", text: "New patient account registered (Rahul Sharma)", category: "User" },
    { id: "3", time: "25 mins ago", text: "Appointment scheduled with Dr. Rajesh Kumar", category: "Appointment" },
    { id: "4", time: "1 hour ago", text: "Updated hospital beds inventory for Apollo Hospital", category: "Hospital" }
  ]);

  const logAction = (text: string, category: string = "Admin") => {
    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setActivityLogs(prev => [
      { id: Date.now().toString(), time: timeStr, text, category },
      ...prev
    ]);
  };

  // Modal States
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);

  // New Doctor Form
  const [newDocName, setNewDocName] = useState("");
  const [newDocSpecialty, setNewDocSpecialty] = useState("Cardiology");
  const [newDocHospital, setNewDocHospital] = useState(hospitalsList[0]?.name || "Pink City Multispeciality Hospital");
  const [newDocDegree, setNewDocDegree] = useState("MBBS, MD");
  const [newDocExp, setNewDocExp] = useState("10+ Years");
  const [newDocFee, setNewDocFee] = useState("800");
  const [newDocPhone, setNewDocPhone] = useState("9876543210");
  const [newDocEmail, setNewDocEmail] = useState("");
  const [newDocGender, setNewDocGender] = useState<"Male" | "Female">("Male");
  const [newDocTiming, setNewDocTiming] = useState("09:00 AM - 01:00 PM");

  // New Hospital Form
  const [newHospName, setNewHospName] = useState("");
  const [newHospCity, setNewHospCity] = useState("Jaipur");
  const [newHospAddress, setNewHospAddress] = useState("");
  const [newHospPhone, setNewHospPhone] = useState("+91 141 2700000");
  const [newHospDepts, setNewHospDepts] = useState("Cardiology, Neurology, OPD, ICU");
  const [newHospRating, setNewHospRating] = useState("4.8");
  const [newHospBeds, setNewHospBeds] = useState("250 Beds");

  // New User Form
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserGender, setNewUserGender] = useState<"Male" | "Female" | "Other">("Male");
  const [newUserDob, setNewUserDob] = useState("1995-05-15");
  const [newUserBlood, setNewUserBlood] = useState("O+");
  const [newUserAddress, setNewUserAddress] = useState("");

  // Handlers for Doctor
  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      alert("Please enter doctor name");
      return;
    }
    const created: Doctor = {
      id: `doc-${Date.now()}`,
      name: newDocName.startsWith("Dr.") ? newDocName : `Dr. ${newDocName}`,
      email: newDocEmail || `${newDocName.toLowerCase().replace(/\s+/g, ".")}@hospyn.com`,
      specialty: newDocSpecialty,
      department: newDocSpecialty,
      hospitalName: newDocHospital,
      phone: newDocPhone,
      avatar: newDocName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
      degree: newDocDegree,
      rating: 4.9,
      reviewsCount: 1,
      experience: newDocExp,
      timing: newDocTiming,
      fee: parseInt(newDocFee) || 800,
      gender: newDocGender
    };

    setDoctorsList(prev => [created, ...prev]);
    logAction(`Added new Doctor: ${created.name} (${created.specialty})`, "Doctor");
    showToast(`Doctor ${created.name} onboarded successfully!`);
    setShowAddDoctorModal(false);
    setNewDocName("");
    setNewDocEmail("");
  };

  const handleDeleteDoctor = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the platform?`)) {
      setDoctorsList(prev => prev.filter(d => d.id !== id));
      logAction(`Removed Doctor: ${name}`, "Doctor");
      showToast(`${name} has been removed.`);
    }
  };

  // Handlers for Hospital
  const handleCreateHospital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospName.trim()) {
      alert("Please enter hospital name");
      return;
    }
    const created: Hospital = {
      name: newHospName,
      address: newHospAddress || "Main Sector Road, Medical Enclave",
      city: newHospCity,
      departments: newHospDepts.split(",").map(d => d.trim()).filter(Boolean),
      doctors: [],
      phone: newHospPhone,
      rating: parseFloat(newHospRating) || 4.8,
      reviewsCount: 25,
      bedsCount: newHospBeds,
      emergencyService: "24/7 Available"
    };

    setHospitalsList(prev => [created, ...prev]);
    logAction(`Added new Hospital: ${created.name}`, "Hospital");
    showToast(`Hospital ${created.name} connected successfully!`);
    setShowAddHospitalModal(false);
    setNewHospName("");
    setNewHospAddress("");
  };

  const handleDeleteHospital = (name: string) => {
    if (confirm(`Are you sure you want to disconnect hospital "${name}"?`)) {
      setHospitalsList(prev => prev.filter(h => h.name !== name));
      logAction(`Removed Hospital: ${name}`, "Hospital");
      showToast(`Hospital ${name} disconnected.`);
    }
  };

  // Handlers for Patient / User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPhone) {
      alert("Please enter patient name and mobile number");
      return;
    }
    const created: Patient = {
      id: `pat-${Date.now()}`,
      name: newUserName,
      email: newUserEmail || `${newUserName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      phone: newUserPhone,
      dob: newUserDob,
      gender: newUserGender,
      bloodGroup: newUserBlood,
      aadhaar: `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
      chronicConditions: ["General Health Checkup"],
      allergies: ["None"],
      address: newUserAddress || "123 Healthcare Enclave",
      linkedHospitals: [hospitalsList[0]?.name || "Pink City Multispeciality Hospital"]
    };

    setRegisteredPatients(prev => [created, ...prev]);
    logAction(`Added new Patient profile: ${created.name}`, "User");
    showToast(`Patient ${created.name} registered successfully!`);
    setShowAddUserModal(false);
    setNewUserName("");
    setNewUserPhone("");
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete patient account "${name}"?`)) {
      setRegisteredPatients(prev => prev.filter(p => p.id !== id));
      logAction(`Deleted Patient user: ${name}`, "User");
      showToast(`User ${name} deleted.`);
    }
  };

  // Handler for Appointment status update
  const handleUpdateAppointmentStatus = (id: string, newStatus: Appointment["status"]) => {
    setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    logAction(`Updated Appointment #${id} status to ${newStatus}`, "Appointment");
    showToast(`Appointment status updated to ${newStatus}`);
  };

  const handleDeleteAppointment = (id: string) => {
    if (confirm(`Are you sure you want to cancel and remove Appointment #${id}?`)) {
      setAppointmentsList(prev => prev.filter(a => a.id !== id));
      logAction(`Removed Appointment #${id}`, "Appointment");
      showToast(`Appointment #${id} removed.`);
    }
  };

  // Export JSON Database
  const handleExportDatabase = () => {
    const backupData = {
      patients: registeredPatients,
      doctors: doctorsList,
      hospitals: hospitalsList,
      appointments: appointmentsList,
      records: recordsList,
      exportTimestamp: new Date().toISOString()
    };
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = `Hospyn_System_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    logAction("Exported full system JSON backup", "Database");
    showToast("System database backup downloaded!");
  };

  // Filtered lists
  const filteredUsers = registeredPatients.filter(p => 
    p.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.phone.includes(userSearch) ||
    p.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (p.aadhaar && p.aadhaar.includes(userSearch))
  );

  const filteredDoctors = doctorsList.filter(d => 
    d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.specialty.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.hospitalName.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const filteredHospitals = hospitalsList.filter(h => 
    h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    (h.city && h.city.toLowerCase().includes(hospitalSearch.toLowerCase()))
  );

  const filteredAppointments = appointmentsList.filter(a => {
    const matchesSearch = a.id.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      a.patientId.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      a.doctorId.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      (a.type && a.type.toLowerCase().includes(appointmentSearch.toLowerCase()));

    if (appointmentFilterStatus === "ALL") return matchesSearch;
    return matchesSearch && a.status === appointmentFilterStatus;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[300] bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xl shadow-slate-950/50">
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-800/80 cursor-pointer shadow-sm group"
            title="Return to App Login"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
              <Shield className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black text-white tracking-tight leading-none">Hospyn</h1>
                <span className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-500/30 uppercase tracking-wide">
                  Admin Console
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Healthcare Operations & Platform Control</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 text-xs text-slate-300 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-400 text-[11px]">System Active</span>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-rose-500/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Admin</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-slate-900/95 to-slate-900/60 border border-slate-800 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between hover:border-blue-500/40 transition-all shadow-md group min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5 text-blue-400">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Total Users</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight my-0.5">{registeredPatients.length}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-1.5 pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                <span className="truncate">Patients</span>
                <span className="text-blue-400 font-bold shrink-0">Synced</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/95 to-slate-900/60 border border-slate-800 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-md group min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5 text-purple-400">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Doctors</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight my-0.5">{doctorsList.length}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-1.5 pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                <span className="truncate">Onboarded</span>
                <span className="text-purple-400 font-bold shrink-0">Verified</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/95 to-slate-900/60 border border-slate-800 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-md group min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5 text-emerald-400">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Hospitals</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight my-0.5">{hospitalsList.length}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-1.5 pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                <span className="truncate">Networks</span>
                <span className="text-emerald-400 font-bold shrink-0">24/7 OPD</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/95 to-slate-900/60 border border-slate-800 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-md group min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5 text-amber-400">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Appointments</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight my-0.5">{appointmentsList.length}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-1.5 pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                <span className="truncate">Bookings</span>
                <span className="text-amber-400 font-bold shrink-0">Live</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/95 to-slate-900/60 border border-slate-800 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-md group min-w-0 col-span-2 sm:col-span-1 lg:col-span-1">
            <div className="flex items-center justify-between gap-2 mb-1.5 text-cyan-400">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 truncate">Health Records</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight my-0.5">{recordsList.length}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-1.5 pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                <span className="truncate">Documents</span>
                <span className="text-cyan-400 font-bold shrink-0">Encrypted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800/80 overflow-x-auto no-scrollbar shadow-inner">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "users", label: `Patients (${registeredPatients.length})`, icon: Users },
            { id: "doctors", label: `Doctors (${doctorsList.length})`, icon: Stethoscope },
            { id: "hospitals", label: `Hospitals (${hospitalsList.length})`, icon: Building2 },
            { id: "appointments", label: `Appointments (${appointmentsList.length})`, icon: Calendar },
            { id: "audit", label: "System Logs & Tools", icon: Shield }
          ].map(tab => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                }`}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6">
              
              {/* Quick Actions Panel */}
              <div className="xl:col-span-1 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" /> Quick Admin Actions
                </h3>

                <div className="space-y-2.5">
                  <button
                    onClick={() => setShowAddDoctorModal(true)}
                    className="w-full bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-300 font-bold p-3 sm:p-3.5 rounded-2xl text-xs flex items-center justify-between transition-all cursor-pointer group gap-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-purple-500/20 shrink-0">
                        <Stethoscope className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="truncate font-bold">Onboard New Doctor</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => setShowAddHospitalModal(true)}
                    className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 font-bold p-3 sm:p-3.5 rounded-2xl text-xs flex items-center justify-between transition-all cursor-pointer group gap-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-emerald-500/20 shrink-0">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="truncate font-bold">Connect New Hospital</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="w-full bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold p-3 sm:p-3.5 rounded-2xl text-xs flex items-center justify-between transition-all cursor-pointer group gap-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-blue-500/20 shrink-0">
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="truncate font-bold">Add Patient Profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={handleExportDatabase}
                    className="w-full bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 font-bold p-3 sm:p-3.5 rounded-2xl text-xs flex items-center justify-between transition-all cursor-pointer group gap-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-cyan-500/20 shrink-0">
                        <Download className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="truncate font-bold">Export System JSON</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* System Live Audit Feed */}
              <div className="xl:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" /> Real-time System Audit Feed
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">Auto-logging active</span>
                </div>

                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {activityLogs.map(log => (
                    <div key={log.id} className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${
                          log.category === "Doctor" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                          log.category === "Hospital" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                          log.category === "User" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                          "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}>
                          {log.category}
                        </span>
                        <span className="text-slate-200 font-medium leading-relaxed break-words min-w-0 flex-1">{log.text}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0 self-end sm:self-auto">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── TAB 2: USERS / PATIENTS ─── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search patients by name, phone, email, ABHA/Aadhaar..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Patient Profile</span>
              </button>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-700/80 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                      <th className="py-3.5 px-4">Patient Name</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">Demographics</th>
                      <th className="py-3.5 px-4">Conditions</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          No patient records matching "{userSearch}"
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(patient => (
                        <tr key={patient.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-extrabold flex items-center justify-center text-xs shrink-0">
                                {patient.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold text-white">{patient.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">ID: {patient.id}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-200">{patient.phone}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{patient.email}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="bg-slate-700/60 text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-bold mr-1">
                              {patient.gender}
                            </span>
                            <span className="bg-rose-500/20 text-rose-300 text-[10px] px-2 py-0.5 rounded-md font-extrabold">
                              {patient.bloodGroup}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">DOB: {patient.dob}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {(patient.chronicConditions || []).slice(0, 2).map((c, i) => (
                                <span key={i} className="bg-slate-900 text-slate-300 text-[9px] px-2 py-0.5 rounded border border-slate-700">
                                  {c}
                                </span>
                              ))}
                              {(patient.chronicConditions || []).length > 2 && (
                                <span className="text-[9px] text-slate-400 font-bold">
                                  +{(patient.chronicConditions || []).length - 2} more
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedPatientForDetails(patient)}
                              className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
                              title="View Patient Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(patient.id, patient.name)}
                              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                              title="Delete Patient"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: DOCTORS ─── */}
        {activeTab === "doctors" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search doctors by name, specialty, hospital..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={() => setShowAddDoctorModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard Doctor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDoctors.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                  No doctors found matching "{doctorSearch}"
                </div>
              ) : (
                filteredDoctors.map(doctor => (
                  <div key={doctor.id} className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-5 space-y-4 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-300 font-black text-sm flex items-center justify-center border border-purple-500/30 shrink-0">
                            {doctor.avatar || doctor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-white text-sm leading-tight">{doctor.name}</h4>
                            <span className="text-[11px] text-purple-400 font-extrabold">{doctor.specialty}</span>
                          </div>
                        </div>

                        <span className="flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {doctor.rating || 4.8}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">{doctor.hospitalName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{doctor.degree || "MBBS, MD"} ({doctor.experience || "10+ Years Exp"})</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{doctor.timing || "09:00 AM - 01:00 PM"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-[10px] text-slate-400 block font-semibold">Consultation Fee</span>
                        <span className="font-black text-white text-sm">₹{doctor.fee || 800}</span>
                      </div>

                      <button
                        onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: HOSPITALS ─── */}
        {activeTab === "hospitals" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search hospitals by name, city, departments..."
                  value={hospitalSearch}
                  onChange={(e) => setHospitalSearch(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={() => setShowAddHospitalModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Connect Hospital</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHospitals.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                  No hospitals found matching "{hospitalSearch}"
                </div>
              ) : (
                filteredHospitals.map((hospital, idx) => (
                  <div key={idx} className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-5 space-y-4 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center border border-emerald-500/30 shrink-0">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-white text-base leading-tight">{hospital.name}</h4>
                            <span className="text-[11px] text-emerald-400 font-bold">{hospital.city || "Jaipur"}, India</span>
                          </div>
                        </div>

                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/30">
                          {hospital.bedsCount || "200+ Beds"}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{hospital.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{hospital.phone || "+91 141 2700000"}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">Departments</span>
                        <div className="flex flex-wrap gap-1">
                          {hospital.departments.map((dept, dIdx) => (
                            <span key={dIdx} className="bg-slate-900 text-slate-300 text-[10px] px-2 py-0.5 rounded-lg border border-slate-700">
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{hospital.rating || 4.8} ({hospital.reviewsCount || 30} Reviews)</span>
                      </div>

                      <button
                        onClick={() => handleDeleteHospital(hospital.name)}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 5: APPOINTMENTS ─── */}
        {activeTab === "appointments" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Filter appointments by ID, doctor ID, patient ID..."
                  value={appointmentSearch}
                  onChange={(e) => setAppointmentSearch(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                {["ALL", "Upcoming", "Completed", "Cancelled"].map(st => (
                  <button
                    key={st}
                    onClick={() => setAppointmentFilterStatus(st)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      appointmentFilterStatus === st 
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20" 
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-700/80 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                      <th className="py-3.5 px-4">Appt ID</th>
                      <th className="py-3.5 px-4">Patient / Doctor</th>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          No appointments matching criteria
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map(appt => (
                        <tr key={appt.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                            #{appt.id}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-white font-bold">Patient: {appt.patientId}</div>
                            <div className="text-[10px] text-slate-400">Doctor ID: {appt.doctorId}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-200">{appt.date}</div>
                            <div className="text-[10px] text-slate-400">{appt.time}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="bg-slate-900 text-slate-300 text-[10px] px-2.5 py-1 rounded-lg border border-slate-700">
                              {appt.type || "OPD Consultation"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              appt.status === "Completed" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                              appt.status === "Cancelled" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                              "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}>
                              {appt.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            {appt.status !== "Completed" && (
                              <button
                                onClick={() => handleUpdateAppointmentStatus(appt.id, "Completed")}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Complete
                              </button>
                            )}

                            {appt.status !== "Cancelled" && (
                              <button
                                onClick={() => handleUpdateAppointmentStatus(appt.id, "Cancelled")}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 6: SYSTEM AUDIT & RESET ─── */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 space-y-4">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" /> Platform Maintenance & System Reset
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                As the Hospyn App Manager, you can reset local system caches, export state backups, or restore demo sample state at any time.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleExportDatabase}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Complete JSON Backup</span>
                </button>

                {onResetSystemData && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to reset all patients, doctors, and hospitals to factory defaults?")) {
                        onResetSystemData();
                        logAction("Factory reset performed on database", "Database");
                        showToast("System database reset to factory defaults!");
                      }
                    }}
                    className="bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-rose-400" />
                    <span>Restore Factory System State</span>
                  </button>
                )}
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 space-y-4">
              <h4 className="font-extrabold text-white text-sm">Full Administrative Activity Trail</h4>
              <div className="space-y-2">
                {activityLogs.map(log => (
                  <div key={log.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-slate-300 font-medium">{log.text}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ─── MODAL: ADD DOCTOR ─── */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="font-black text-white text-base">Onboard New Doctor</h3>
              </div>
              <button onClick={() => setShowAddDoctorModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Anita Verma"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Specialty</label>
                  <select
                    value={newDocSpecialty}
                    onChange={(e) => setNewDocSpecialty(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-purple-500"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Gynaecology">Gynaecology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="ENT Specialist">ENT Specialist</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Affiliated Hospital</label>
                  <select
                    value={newDocHospital}
                    onChange={(e) => setNewDocHospital(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-purple-500"
                  >
                    {hospitalsList.map((h, i) => (
                      <option key={i} value={h.name}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Degree / Qualification</label>
                  <input
                    type="text"
                    placeholder="MBBS, MD, DM"
                    value={newDocDegree}
                    onChange={(e) => setNewDocDegree(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Experience</label>
                  <input
                    type="text"
                    placeholder="12+ Years"
                    value={newDocExp}
                    onChange={(e) => setNewDocExp(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    placeholder="800"
                    value={newDocFee}
                    onChange={(e) => setNewDocFee(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">OPD Timing</label>
                  <input
                    type="text"
                    placeholder="10:00 AM - 02:00 PM"
                    value={newDocTiming}
                    onChange={(e) => setNewDocTiming(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD HOSPITAL ─── */}
      {showAddHospitalModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-black text-white text-base">Connect New Hospital</h3>
              </div>
              <button onClick={() => setShowAddHospitalModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHospital} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Hospital Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fortis Healthcare Jaipur"
                  value={newHospName}
                  onChange={(e) => setNewHospName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">City</label>
                  <input
                    type="text"
                    value={newHospCity}
                    onChange={(e) => setNewHospCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={newHospPhone}
                    onChange={(e) => setNewHospPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Address Location</label>
                <input
                  type="text"
                  placeholder="Street / Sector address"
                  value={newHospAddress}
                  onChange={(e) => setNewHospAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Departments (Comma Separated)</label>
                <input
                  type="text"
                  value={newHospDepts}
                  onChange={(e) => setNewHospDepts(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddHospitalModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
                >
                  Connect Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD PATIENT ─── */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-black text-white text-base">Add Patient Profile</h3>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Full Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suman Sharma"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Blood Group</label>
                  <select
                    value={newUserBlood}
                    onChange={(e) => setNewUserBlood(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                  >
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Gender</label>
                  <select
                    value={newUserGender}
                    onChange={(e) => setNewUserGender(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newUserDob}
                    onChange={(e) => setNewUserDob(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="patient@gmail.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
                >
                  Create Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: VIEW PATIENT DETAILS ─── */}
      {selectedPatientForDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 font-black text-lg flex items-center justify-center border border-blue-500/30 shrink-0">
                  {selectedPatientForDetails.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-black text-white text-lg leading-tight">{selectedPatientForDetails.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">Patient ID: {selectedPatientForDetails.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatientForDetails(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Mobile Number</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  {selectedPatientForDetails.phone}
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Email Address</span>
                <span className="font-bold text-white truncate block" title={selectedPatientForDetails.email}>
                  {selectedPatientForDetails.email || "Not Provided"}
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Blood Group</span>
                <span className="font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 inline-block">
                  {selectedPatientForDetails.bloodGroup || "O+"}
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Gender / DOB</span>
                <span className="font-bold text-white">
                  {selectedPatientForDetails.gender} • {selectedPatientForDetails.dob || "N/A"}
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Aadhaar Number</span>
                <span className="font-mono text-slate-200">
                  {selectedPatientForDetails.aadhaar || "Not Provided"}
                </span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Emergency Contact</span>
                <span className="font-bold text-emerald-400">
                  {selectedPatientForDetails.phone}
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 text-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Residential Address</span>
              <p className="text-slate-200 font-medium">
                {selectedPatientForDetails.address || "Main Sector Road, Healthcare Enclave"}
              </p>
            </div>

            {/* Health Conditions & Allergies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Chronic Conditions</span>
                <div className="flex flex-wrap gap-1">
                  {(selectedPatientForDetails.chronicConditions || ["None"]).map((cond, i) => (
                    <span key={i} className="bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-lg font-semibold">
                      {cond}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Known Allergies</span>
                <div className="flex flex-wrap gap-1">
                  {(selectedPatientForDetails.allergies || ["None"]).map((alg, i) => (
                    <span key={i} className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-lg font-semibold">
                      {alg}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Synced Medical Documents */}
            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300 font-extrabold uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" /> Uploaded Medical Records ({selectedPatientForDetails.uploadedFiles?.length || 0})
                </span>
              </div>
              
              {!selectedPatientForDetails.uploadedFiles || selectedPatientForDetails.uploadedFiles.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No medical documents uploaded yet.</p>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {selectedPatientForDetails.uploadedFiles.map((doc, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-white block truncate">{doc.name}</span>
                          <span className="text-[10px] text-slate-400">{doc.category} • {doc.date}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 shrink-0">
                        {doc.size || "1.2 MB"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedPatientForDetails(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close View
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteUser(selectedPatientForDetails.id, selectedPatientForDetails.name);
                  setSelectedPatientForDetails(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
