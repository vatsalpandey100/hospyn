import React, { useState, useMemo } from "react";
import { 
  Search, 
  Clock, 
  Heart, 
  Star, 
  Building2, 
  Briefcase, 
  IndianRupee, 
  ArrowLeft, 
  SlidersHorizontal,
  ChevronDown,
  X,
  Filter,
  Check
} from "lucide-react";
import { Doctor } from "../types";
import { MOCK_DOCTORS } from "../data/hospitalsData";

// Reusable custom high-fidelity SVG doctor avatar component (looks like a polished cartoonish Memoji character)
const DoctorAvatar: React.FC<{ doctor: Doctor }> = ({ doctor }) => {
  const isFemale = doctor.gender === "Female";
  const skinColor = isFemale ? "#fff1e6" : "#ffe3d1";
  const earsColor = isFemale ? "#fecda3" : "#ffd1b3";
  
  if (isFemale) {
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" id={`avatar-fem-${doctor.id}`}>
        <defs>
          <linearGradient id={`bgFemale-${doctor.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fdf2f8" />
            <stop offset="100%" stopColor="#fbcfe8" />
          </linearGradient>
          <linearGradient id={`coatFemale-${doctor.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
        </defs>
        
        {/* Rounded background circle */}
        <circle cx="50" cy="50" r="48" fill={`url(#bgFemale-${doctor.id})`} />
        
        {/* Ears */}
        <circle cx="28" cy="48" r="4" fill={earsColor} />
        <circle cx="72" cy="48" r="4" fill={earsColor} />
        
        {/* Face/Head */}
        <path d="M33 46 C33 33, 67 33, 67 46 C67 59, 33 59, 33 46 Z" fill={skinColor} />
        
        {/* Neck */}
        <rect x="44" y="54" width="12" height="10" fill={earsColor} />

        {/* Hair (Professional styled cut) */}
        <path d="M30 44 C27 28, 73 28, 70 44 C74 58, 66 64, 66 64 C66 64, 64 42, 50 42 C36 42, 34 64, 34 64 C34 64, 26 58, 30 44" fill="#4a1d96" />
        <path d="M33 35 C38 22, 62 22, 67 35" fill="#2e1065" />

        {/* Eyes with highlights */}
        <circle cx="43" cy="45" r="2.8" fill="#1e1b4b" />
        <circle cx="57" cy="45" r="2.8" fill="#1e1b4b" />
        <circle cx="44.2" cy="44.2" r="0.8" fill="#ffffff" />
        <circle cx="58.2" cy="44.2" r="0.8" fill="#ffffff" />
        <path d="M40 43 Q43 41 46 43" stroke="#1e1b4b" strokeWidth="1" fill="none" />
        <path d="M60 43 Q57 41 54 43" stroke="#1e1b4b" strokeWidth="1" fill="none" />

        {/* Soft blushing cheeks */}
        <circle cx="37" cy="50" r="3" fill="#f43f5e" opacity="0.15" />
        <circle cx="63" cy="50" r="3" fill="#f43f5e" opacity="0.15" />

        {/* Friendly smile */}
        <path d="M44 51 Q50 56 56 51" stroke="#3b0764" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Inner Shirt/Blouse */}
        <path d="M35 64 L65 64 L55 88 L45 88 Z" fill="#ec4899" />
        <path d="M45 64 L50 74 L55 64 Z" fill="#be185d" />
        
        {/* Lab Coat Lapels */}
        <path d="M30 64 L45 64 L40 88 L25 88 Z" fill={`url(#coatFemale-${doctor.id})`} stroke="#e2e8f0" strokeWidth="0.5" />
        <path d="M70 64 L55 64 L60 88 L75 88 Z" fill={`url(#coatFemale-${doctor.id})`} stroke="#e2e8f0" strokeWidth="0.5" />
        {/* Outer Coat shoulders */}
        <path d="M20 74 C20 62, 35 64, 35 64 L40 88 L15 88 Z" fill={`url(#coatFemale-${doctor.id})`} />
        <path d="M80 74 C80 62, 65 64, 65 64 L60 88 L85 88 Z" fill={`url(#coatFemale-${doctor.id})`} />
        
        {/* Stethoscope */}
        <circle cx="50" cy="80" r="3" fill="#cbd5e1" stroke="#cbd5e1" strokeWidth="1" />
        <circle cx="50" cy="80" r="1.2" fill="#475569" />
        <path d="M33 60 C33 75, 47 80, 50 80" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M67 60 C67 75, 53 80, 50 80" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  } else {
    // Male Doctor (e.g. Dr. Rajesh Kumar, Dr. Amit Patel, etc.)
    const hasGlasses = doctor.name.includes("Kumar") || doctor.name.includes("Patel") || doctor.name.includes("Gupta") || doctor.name.includes("Sharma") || doctor.name.includes("Malhotra");
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full" id={`avatar-male-${doctor.id}`}>
        <defs>
          <linearGradient id={`bgMale-${doctor.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          <linearGradient id={`coatMale-${doctor.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill={`url(#bgMale-${doctor.id})`} />
        
        {/* Ears */}
        <circle cx="28" cy="48" r="4" fill={earsColor} />
        <circle cx="72" cy="48" r="4" fill={earsColor} />
        
        {/* Face/Head */}
        <path d="M32 46 C32 32, 68 32, 68 46 C68 60, 32 60, 32 46 Z" fill={skinColor} />
        
        {/* Neck */}
        <rect x="44" y="54" width="12" height="10" fill={earsColor} />
        
        {/* Hair (Smart haircut) */}
        <path d="M30 40 C30 24, 70 24, 70 40 C70 30, 30 30, 30 40" fill="#1e293b" />
        <path d="M32 37 C35 23, 65 20, 68 33" fill="#0f172a" />

        {/* Eyes */}
        <circle cx="43" cy="45" r="2.8" fill="#0f172a" />
        <circle cx="57" cy="45" r="2.8" fill="#0f172a" />
        <circle cx="44.2" cy="44.2" r="0.8" fill="#ffffff" />
        <circle cx="58.2" cy="44.2" r="0.8" fill="#ffffff" />
        
        {/* Eyebrows */}
        <path d="M38 41 Q43 39 46 41" stroke="#0f172a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M62 41 Q57 39 54 41" stroke="#0f172a" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Dynamic Glasses */}
        {hasGlasses && (
          <>
            <circle cx="43" cy="45" r="5.5" stroke="#475569" strokeWidth="1.5" fill="none" />
            <circle cx="57" cy="45" r="5.5" stroke="#475569" strokeWidth="1.5" fill="none" />
            <line x1="48" y1="45" x2="52" y2="45" stroke="#475569" strokeWidth="1.5" />
            <path d="M28 44 Q33 44 37 45" stroke="#475569" strokeWidth="1" fill="none" />
            <path d="M72 44 Q67 44 63 45" stroke="#475569" strokeWidth="1" fill="none" />
          </>
        )}

        {/* Smiling Mouth */}
        <path d="M44 51 Q50 55 56 51" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Shirt & Blue Necktie */}
        <path d="M35 64 L65 64 L58 88 L42 88 Z" fill="#bae6fd" />
        <path d="M48 64 L52 64 L55 84 L50 88 L45 84 Z" fill="#025a8f" />
        
        {/* Lab Coat Lapels */}
        <path d="M30 64 L45 64 L40 88 L25 88 Z" fill={`url(#coatMale-${doctor.id})`} stroke="#e2e8f0" strokeWidth="0.5" />
        <path d="M70 64 L55 64 L60 88 L75 88 Z" fill={`url(#coatMale-${doctor.id})`} stroke="#e2e8f0" strokeWidth="0.5" />
        {/* Coat body */}
        <path d="M20 74 C20 62, 35 64, 35 64 L40 88 L15 88 Z" fill={`url(#coatMale-${doctor.id})`} />
        <path d="M80 74 C80 62, 65 64, 65 64 L60 88 L85 88 Z" fill={`url(#coatMale-${doctor.id})`} />
        
        {/* Stethoscope */}
        <circle cx="50" cy="80" r="3" fill="#cbd5e1" stroke="#cbd5e1" strokeWidth="1" />
        <circle cx="50" cy="80" r="1.2" fill="#475569" />
        <path d="M33 60 C33 75, 47 80, 50 80" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M67 60 C67 75, 53 80, 50 80" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
};

interface FindSpecialistProps {
  onBack: () => void;
  onBookDoctor: (doctor: Doctor) => void;
  language?: "en" | "hi";
}

export const FindSpecialist: React.FC<FindSpecialistProps> = ({ onBack, onBookDoctor, language = "en" }) => {
  const isHindi = language === "hi";
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("Relevance");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Toggle Favorite
  const toggleFavorite = (docId: string) => {
    setFavorites(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  // List of all unique specialties
  const specialtiesList = useMemo(() => {
    const list = MOCK_DOCTORS.map(d => d.specialty);
    return Array.from(new Set(list));
  }, []);

  // List of all locations
  const locationsList = useMemo(() => {
    return Array.from(new Set(MOCK_DOCTORS.map(d => d.hospitalName)));
  }, []);

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedSpecialties([]);
    setSelectedLocations([]);
    setSearchQuery("");
    setSortBy("Relevance");
  };

  // Toggle Specialty
  const handleToggleSpecialty = (spec: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  // Toggle Location
  const handleToggleLocation = (loc: string) => {
    setSelectedLocations(prev => 
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  // Get count of doctors per specialty based on active location filters
  const getSpecialtyCount = (spec: string) => {
    return MOCK_DOCTORS.filter(d => {
      const matchLoc = selectedLocations.length === 0 || selectedLocations.includes(d.hospitalName);
      return d.specialty === spec && matchLoc;
    }).length;
  };

  // Get count of doctors per location based on active specialty filters
  const getLocationCount = (loc: string) => {
    return MOCK_DOCTORS.filter(d => {
      const matchSpec = selectedSpecialties.length === 0 || selectedSpecialties.includes(d.specialty);
      return d.hospitalName === loc && matchSpec;
    }).length;
  };

  // Filter & Sort Doctors
  const filteredAndSortedDoctors = useMemo(() => {
    let result = [...MOCK_DOCTORS];

    // 1. Search Query Filter (Name, Specialty, Qualification/Degree, Hospital)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d => 
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        (d.degree && d.degree.toLowerCase().includes(q)) ||
        d.hospitalName.toLowerCase().includes(q)
      );
    }

    // 2. Specialty Filter
    if (selectedSpecialties.length > 0) {
      result = result.filter(d => selectedSpecialties.includes(d.specialty));
    }

    // 3. Location Filter
    if (selectedLocations.length > 0) {
      result = result.filter(d => selectedLocations.includes(d.hospitalName));
    }

    // 4. Sorting
    if (sortBy === "Highest Rated") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "Experience: High to Low" || sortBy === "Experience") {
      result.sort((a, b) => {
        const expA = parseInt(a.experience || "0");
        const expB = parseInt(b.experience || "0");
        return expB - expA;
      });
    } else if (sortBy === "Consultation Fee: Low to High" || sortBy === "Consultation Fee") {
      result.sort((a, b) => (a.fee || 0) - (b.fee || 0));
    }

    return result;
  }, [searchQuery, selectedSpecialties, selectedLocations, sortBy]);

  return (
    <div className="flex flex-col w-full bg-white rounded-[32px] overflow-hidden text-left" id="find-specialist-root">
      
      {/* Top minimal Navigation Link */}
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-4 self-start px-2 py-1 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-100/50"
        id="btn-back-dashboard"
      >
        <ArrowLeft className="w-4 h-4 text-slate-600" /> 
        <span>{isHindi ? "डैशबोर्ड पर वापस जाएं" : "Back to Dashboard"}</span>
      </button>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col space-y-6" id="main-listings-pane">
        
        {/* 1. Elegant Header Banner with high-fidelity vector graphics and gorgeous soft glows */}
        <div className="bg-gradient-to-r from-[#f0f6ff] to-[#f5f3ff] border border-blue-100/60 rounded-[32px] p-6 md:p-8 flex items-center justify-between relative overflow-hidden shadow-sm" id="specialist-promo-banner">
          
          <div className="space-y-2 max-w-[65%] z-10">
            <h1 className="text-[#0f172a] font-black text-2xl md:text-3.5xl tracking-tight leading-none">
              {isHindi ? "विशेषज्ञ डॉक्टर खोजें" : "Find Your Specialist"}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-bold leading-relaxed max-w-md">
              {isHindi ? "Hospyn सुविधाओं में शीर्ष श्रेणी के डॉक्टरों से जुड़ें" : <>Connect with top-rated doctors at <strong className="text-blue-600 font-extrabold">Hospyn</strong> facilities</>}
            </p>
          </div>

          {/* Gorgeous layered medical vector illustration strictly following the mockup design */}
          <div className="absolute right-4 bottom-0 top-0 w-36 md:w-44 flex items-center justify-center pointer-events-none z-10">
            <svg viewBox="0 0 120 120" className="w-full h-full text-blue-500 shrink-0">
              <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Soft visual lighting backdrop */}
              <circle cx="70" cy="50" r="28" fill="#3b82f6" opacity="0.15" filter="url(#glow)" />
              <circle cx="20" cy="80" r="3" fill="#3b82f6" opacity="0.3" />
              <circle cx="95" cy="35" r="4" fill="#3b82f6" opacity="0.4" />
              <circle cx="105" cy="70" r="2" fill="#3b82f6" opacity="0.3" />
              
              {/* Medical Shield shape */}
              <path 
                d="M45 25 L85 33 V60 C85 75 65 87 65 87 C65 87 45 75 45 60 V25 Z" 
                fill="url(#shieldGrad)" 
                stroke="#3b82f6" 
                strokeWidth="2.5" 
                strokeLinejoin="round"
                className="drop-shadow-md"
              />
              
              {/* Shield Cross symbol */}
              <path 
                d="M65 42 V62 M55 52 H75" 
                stroke="#ffffff" 
                strokeWidth="5" 
                strokeLinecap="round" 
              />
              
              {/* Metallic Stethoscope loop */}
              <path 
                d="M20 50 C20 95, 100 95, 100 50" 
                fill="none" 
                stroke="#94a3b8" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
              />
              {/* Flexible tubing wrapping the shield */}
              <path 
                d="M22 51 C30 115, 95 105, 98 52" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              
              {/* Stethoscope earpieces */}
              <circle cx="20" cy="48" r="3.5" fill="#475569" />
              <circle cx="100" cy="48" r="3.5" fill="#475569" />
              
              {/* Chestpiece diaphragm */}
              <path d="M65 87 Q45 105, 30 95" fill="none" stroke="#3b82f6" strokeWidth="2" />
              <circle cx="30" cy="95" r="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="30" cy="95" r="3" fill="#475569" />
            </svg>
          </div>
        </div>

        {/* 2. Collapsible Refine Results filter bar */}
        <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-4 flex flex-col transition-all duration-300" id="refine-results-container">
          <div 
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md shadow-blue-100/50 border border-slate-50 transition-transform group-hover:scale-105">
                <Filter className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <h4 className="font-extrabold text-slate-800 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                  {isHindi ? "फ़िल्टर और खोज" : "Refine Results"}
                </h4>
                <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                  {isHindi ? "विशेषज्ञता, अनुभव, फ़ीस आदि" : "Speciality, Experience, Fees & more"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pr-1">
              {/* Arrow symbol in middle */}
              <div className="hidden sm:block text-slate-300 font-bold transition-transform group-hover:translate-x-1">
                &rarr;
              </div>

              {/* Dynamic Toggle pill button strictly matching mockup */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setFiltersExpanded(!filtersExpanded);
                }}
                className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>{isHindi ? "फ़िल्टर खोलें" : "Toggle"}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${filtersExpanded ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* Smooth expandable Filter Control Panel */}
          {filtersExpanded && (
            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-left" id="expanded-filters-panel">
              
              {/* Specialty Grid Selection */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{isHindi ? "विशेषज्ञता (Specialty)" : "Specialty"}</span>
                <div className="grid grid-cols-2 gap-2">
                  {specialtiesList.map(spec => {
                    const count = getSpecialtyCount(spec);
                    const isChecked = selectedSpecialties.includes(spec);
                    return (
                      <button
                        key={spec}
                        onClick={() => handleToggleSpecialty(spec)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-extrabold transition-all ${
                          isChecked 
                            ? "bg-blue-50 border-blue-200 text-blue-700" 
                            : "bg-white border-slate-100 hover:border-slate-200 text-slate-600"
                        }`}
                      >
                        <span className="truncate pr-1">{spec}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                          isChecked ? "bg-blue-200/50 text-blue-700" : "bg-slate-100 text-slate-400"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location Grid Selection */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Facility Location</span>
                <div className="flex flex-col gap-2">
                  {locationsList.map(loc => {
                    const count = getLocationCount(loc);
                    const isChecked = selectedLocations.includes(loc);
                    return (
                      <button
                        key={loc}
                        onClick={() => handleToggleLocation(loc)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-extrabold transition-all ${
                          isChecked 
                            ? "bg-blue-50 border-blue-200 text-blue-700" 
                            : "bg-white border-slate-100 hover:border-slate-200 text-slate-600"
                        }`}
                      >
                        <span className="truncate pr-1">{loc}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                          isChecked ? "bg-blue-200/50 text-blue-700" : "bg-slate-100 text-slate-400"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action row inside filter menu */}
              <div className="md:col-span-2 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400 font-bold">
                  {(selectedSpecialties.length + selectedLocations.length) > 0 
                    ? `${selectedSpecialties.length + selectedLocations.length} filters active`
                    : "No active filters"
                  }
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearFilters}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-2 px-4 rounded-xl text-xs transition-colors"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={() => setFiltersExpanded(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-5 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* 3. Search Bar Block with integrated responsive input fields */}
        <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex gap-2.5 items-center" id="search-filter-controls">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input 
              type="text"
              placeholder={isHindi ? "डॉक्टर का नाम, विशेषज्ञता या अस्पताल खोजें..." : "Search doctor by name, speciality, hospital..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>
          
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-7 py-3.5 rounded-2xl text-xs shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] shrink-0"
          >
            {isHindi ? "खोजें" : "Search"}
          </button>
        </div>

        {/* 4. Filter feedback and inline sorting bar with direct-select pills */}
        <div className="space-y-3" id="sorting-and-results-info">
          
          <div className="text-xs font-bold text-slate-500 text-left px-1">
            {isHindi ? <>कुल <strong className="text-blue-600 font-black">{filteredAndSortedDoctors.length}</strong> विशेषज्ञ उपलब्ध हैं</> : <>Showing <strong className="text-blue-600 font-black">{filteredAndSortedDoctors.length}</strong> specialists based on criteria</>}
          </div>
          
          <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-3 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2 w-full text-left">
              <span className="text-slate-400 font-black text-[10px] uppercase tracking-wider mr-1">{isHindi ? "क्रमानुसार सेट करें:" : "Sort by:"}</span>
              {[
                { id: "Relevance", labelEn: "Relevance", labelHi: "प्रासंगिकता" },
                { id: "Highest Rated", labelEn: "Highest Rated", labelHi: "उच्चतम रेटिंग" },
                { id: "Experience", labelEn: "Experience", labelHi: "अनुभव" },
                { id: "Consultation Fee", labelEn: "Consultation Fee", labelHi: "परामर्श फ़ीस" }
              ].map(optionObj => {
                const option = optionObj.id;
                const label = isHindi ? optionObj.labelHi : optionObj.labelEn;
                const isActive = sortBy === option || (option === "Experience" && sortBy.startsWith("Experience")) || (option === "Consultation Fee" && sortBy.startsWith("Consultation Fee"));
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (option === "Experience") {
                        setSortBy("Experience: High to Low");
                      } else if (option === "Consultation Fee") {
                        setSortBy("Consultation Fee: Low to High");
                      } else {
                        setSortBy(option);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border ${
                      isActive 
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-100" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Doctor Listing column strictly formatted with the mockup styles */}
        <div className="space-y-5 pb-10" id="doctor-cards-container">
          {filteredAndSortedDoctors.length > 0 ? (
            filteredAndSortedDoctors.map((doc) => {
              const isFav = favorites.includes(doc.id);
              
              return (
                <div 
                  key={doc.id}
                  className="bg-white border border-slate-100 rounded-[28px] p-6 flex flex-col md:flex-row gap-5 hover:border-slate-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.012)] transition-all relative text-left"
                >
                  {/* Heart bookmark/save toggle top right */}
                  <button 
                    onClick={() => toggleFavorite(doc.id)}
                    className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors border border-slate-100"
                    title={isFav ? "Remove from Favorites" : "Save Doctor"}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
                  </button>

                  {/* High Fidelity Cartoon-style Avatar portrait circle */}
                  <div className="flex items-center md:items-start shrink-0">
                    <div className="w-20 h-20 rounded-[28px] overflow-hidden shadow-sm border border-slate-100 relative bg-slate-50">
                      <DoctorAvatar doctor={doc} />
                    </div>
                  </div>

                  {/* Doctor Info column */}
                  <div className="flex-1 flex flex-col space-y-3 min-w-0">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
                        {doc.name}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-xs text-blue-600 font-black">
                          {doc.specialty}
                        </span>
                        <span className="text-slate-300 text-xs font-light">|</span>
                        <span className="text-[11px] text-slate-500 font-bold truncate">
                          {doc.degree}
                        </span>
                      </div>

                      {/* Custom styled Yellow star review pill matching image */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="inline-flex items-center gap-1 bg-amber-50/75 border border-amber-100 px-2 py-0.5 rounded-lg text-amber-700 font-black text-[11px]">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{doc.rating}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold">({doc.reviewsCount} Reviews)</span>
                      </div>
                    </div>

                    {/* Integrated Metadata and Booking Panel exactly as pictured */}
                    <div className="bg-[#f8fafd] border border-slate-100/70 rounded-2.5xl p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                      
                      {/* Attributes list (2x2 structure) */}
                      <div className="grid grid-cols-2 gap-x-5 gap-y-3.5 text-xs font-bold text-slate-600">
                        
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black">{isHindi ? "अस्पताल" : "Hospital"}</span>
                            <span className="text-slate-800 text-[11.5px] font-extrabold block">{doc.hospitalName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center shrink-0">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black">{isHindi ? "अनुभव" : "Experience"}</span>
                            <span className="text-slate-800 text-[11.5px] font-extrabold block">{doc.experience}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black">{isHindi ? "समय" : "Timing"}</span>
                            <span className="text-slate-800 text-[11.5px] font-extrabold block">{doc.timing}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                            <IndianRupee className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-black">{isHindi ? "परामर्श फ़ीस" : "Consultation Fee"}</span>
                            <span className="text-slate-800 text-[11.5px] font-extrabold block">₹{doc.fee}</span>
                          </div>
                        </div>

                      </div>

                      {/* Unified Booking Action Trigger inside details panel */}
                      <button 
                        onClick={() => onBookDoctor(doc)}
                        className="bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-[0.98] text-white font-black py-3 px-5 rounded-2xl text-xs shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {isHindi ? "अपॉइंटमेंट बुक करें" : "Book Appointment"}
                      </button>

                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-100 rounded-[32px] p-12 text-center text-slate-500 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
                <SlidersHorizontal className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">No Specialist Found</h4>
                <p className="text-xs text-slate-400 mt-1">We couldn't find any specialist matching your active filter criteria. Try clearing some filters or searching for another term.</p>
              </div>
              <button 
                onClick={handleClearFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-colors shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
