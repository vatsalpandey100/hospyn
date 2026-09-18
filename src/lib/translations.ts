export type Language = "en" | "hi";

export function t(en: string, hi: string, lang: Language = "en"): string {
  return lang === "hi" ? hi : en;
}

export const translations = {
  en: {
    // Navigation Tabs
    home: "Home",
    appointments: "Appointments",
    records: "Records",
    hospitals: "Hospitals",
    profile: "Profile",
    more: "More Services",
    aiAssist: "AI Assist",

    // Dashboard Header
    welcome: "Welcome",
    searchPlaceholder: "Search doctors, hospitals, specialties...",
    bookAppointment: "Book Appointment",
    quickActions: "Quick Actions",
    
    // Quick Actions
    symptomChecker: "Symptom Checker",
    reportReader: "AI Report Reader",
    medicalSearch: "Medical Search",
    findSpecialist: "Find Specialist",
    prescriptions: "Prescriptions",
    emergency: "Emergency SOS",

    // Common UI
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    loading: "Loading...",
    verified: "Verified",
    search: "Search",
    filter: "Filter",
    viewAll: "View All",
    download: "Download",
    details: "Details",
    status: "Status",
    date: "Date",
    time: "Time",
    doctor: "Doctor",
    patient: "Patient",
    
    // Profile Screen
    myProfile: "My Profile",
    manageProfile: "Manage your health information and preferences",
    personalInfo: "Personal Information",
    medicalInfo: "Medical Information",
    medicalRecords: "Medical Records",
    emergencyContact: "Emergency Contact",
    privacyData: "Privacy & Data",
    biometricLogin: "Biometric Login",
    notifications: "Notification Settings",
    language: "Language",
    themeMode: "Theme Mode",
    logOut: "Log Out",
    editProfile: "Edit Profile",
    fullName: "Full Name",
    dob: "Date of Birth",
    gender: "Gender",
    mobileNumber: "Mobile Number",
    emailAddress: "Email Address",
    bloodGroup: "Blood Group",
    address: "Address",
    selectLanguage: "Choose your preferred language",
    
    // AI Symptom Checker
    symptomCheckerTitle: "AI Symptom Checker",
    symptomCheckerSub: "Gemini 3.5 Flash Active",
    symptomDisclaimer: "Clinical Note: This symptom checker provides educational guidance and is not a substitute for professional medical advice.",
    symptomPlaceholder: "Describe symptoms, e.g. sharp headache...",
    symptomGreeting: "Hello! I am Hospyn's AI Symptom Assistant. Tell me what symptoms you are experiencing, and I'll help guide you to potential clinical causes and the correct specialists.",
    
    // AI Report Reader
    reportReaderTitle: "AI Report Reader",
    reportReaderSub: "Gemini 3.1 Pro Intelligence",
    analyzeDocs: "Analyze Clinical Documents",
    uploadDesc: "Take a photo of your Blood Test, Urine Test, or Prescription. Gemini Pro will explain the readings simply.",
    docCategory: "Document Category",
    choosePhoto: "Choose Photo",
    takePhoto: "Take Photo",
    analyzeBtn: "Analyze Report",
    
    // Medical Search
    medicalSearchTitle: "AI Medical Search",
    medicalSearchSub: "Web-Grounded via Google Search",
    searchBoxLabel: "Clinical Database Lookup",
    searchPlaceholderText: "Search diseases, symptoms, or drug ingredients...",
    searchBtn: "Perform Grounded Lookup",

    // Doctor Portal
    doctorDashboard: "Doctor Dashboard",
    opdQueue: "Today's OPD Queue",
    patients: "Patients Directory",
    consultation: "Consultation",
    writePrescription: "Write Prescription",
    aiSafetyCheck: "AI Safety Check",
  },
  hi: {
    // Navigation Tabs
    home: "होम",
    appointments: "अपॉइंटमेंट",
    records: "मेडिकल रिकॉर्ड्स",
    hospitals: "अस्पताल",
    profile: "प्रोफ़ाइल",
    more: "अन्य सेवाएं",
    aiAssist: "AI सहायक",

    // Dashboard Header
    welcome: "स्वागत है",
    searchPlaceholder: "डॉक्टर, अस्पताल या विशेषज्ञ खोजें...",
    bookAppointment: "अपॉइंटमेंट बुक करें",
    quickActions: "त्वरित सेवाएं",
    
    // Quick Actions
    symptomChecker: "लक्षण जांच (AI Checker)",
    reportReader: "रिपोर्ट रीडर (AI Reader)",
    medicalSearch: "मेडिकल खोज (Search)",
    findSpecialist: "विशेषज्ञ खोजें",
    prescriptions: "दवा पर्ची (Prescriptions)",
    emergency: "आपत्कालीन SOS",

    // Common UI
    back: "वापस",
    save: "सहेजें",
    cancel: "रद्द करें",
    close: "बंद करें",
    loading: "लोड हो रहा है...",
    verified: "सत्यापित",
    search: "खोजें",
    filter: "फ़िल्टर",
    viewAll: "सभी देखें",
    download: "डाउनलोड",
    details: "विवरण",
    status: "स्थिति",
    date: "दिनांक",
    time: "समय",
    doctor: "डॉक्टर",
    patient: "मरीज़",

    // Profile Screen
    myProfile: "मेरी प्रोफ़ाइल",
    manageProfile: "अपनी स्वास्थ्य संबंधी जानकारी और प्राथमिकताएं प्रबंधित करें",
    personalInfo: "व्यक्तिगत जानकारी",
    medicalInfo: "चिकित्सा जानकारी",
    medicalRecords: "मेडिकल रिकॉर्ड्स",
    emergencyContact: "आपातकालीन संपर्क",
    privacyData: "गोपनीयता और डेटा",
    biometricLogin: "बायोमेट्रिक लॉगिन",
    notifications: "सूचना सेटिंग्स",
    language: "भाषा (Language)",
    themeMode: "थीम मोड",
    logOut: "लॉग आउट",
    editProfile: "प्रोफ़ाइल संपादित करें",
    fullName: "पूरा नाम",
    dob: "जन्म तिथि",
    gender: "लिंग",
    mobileNumber: "मोबाइल नंबर",
    emailAddress: "ईमेल पता",
    bloodGroup: "ब्लड ग्रुप",
    address: "पता",
    selectLanguage: "अपनी पसंदीदा भाषा चुनें",

    // AI Symptom Checker
    symptomCheckerTitle: "AI लक्षण जांचकर्ता",
    symptomCheckerSub: "Gemini 3.5 Flash सक्रिय",
    symptomDisclaimer: "क्लिनिकल नोट: यह लक्षण जांचकर्ता केवल शैक्षणिक मार्गदर्शन प्रदान करता है और आपातकालीन चिकित्सा का विकल्प नहीं है।",
    symptomPlaceholder: "अपने लक्षणों का वर्णन करें, जैसे- तेज सिरदर्द...",
    symptomGreeting: "नमस्ते! मैं हॉस्पिन का AI लक्षण सहायक हूँ। मुझे बताएं कि आप क्या लक्षण अनुभव कर रहे हैं, और मैं आपको संभावित कारणों और सही विशेषज्ञ डॉक्टरों के मार्गदर्शन में मदद करूंगा।",

    // AI Report Reader
    reportReaderTitle: "AI रिपोर्ट रीडर",
    reportReaderSub: "Gemini 3.1 Pro बुद्धिमत्ता",
    analyzeDocs: "क्लिनिकल दस्तावेज़ विश्लेषण",
    uploadDesc: "अपने ब्लड टेस्ट, यूरिन टेस्ट या प्रिस्क्रिप्शन की फोटो लें। Gemini Pro आपको इसे आसान हिंदी में समझाएगा।",
    docCategory: "दस्तावेज़ की श्रेणी",
    choosePhoto: "फोटो चुनें",
    takePhoto: "फोटो खींचें",
    analyzeBtn: "रिपोर्ट का विश्लेषण करें",

    // Medical Search
    medicalSearchTitle: "AI मेडिकल खोज",
    medicalSearchSub: "गूगल सर्च द्वारा सत्यापित",
    searchBoxLabel: "क्लिनिकल डेटाबेस खोज",
    searchPlaceholderText: "बीमारियों, लक्षणों या दवाओं की जानकारी खोजें...",
    searchBtn: "सत्यापित खोज करें",

    // Doctor Portal
    doctorDashboard: "डॉक्टर डैशबोर्ड",
    opdQueue: "आज की OPD कतार",
    patients: "मरीज़ों की सूची",
    consultation: "परामर्श",
    writePrescription: "दवा पर्ची लिखें",
    aiSafetyCheck: "AI सुरक्षा जांच",
  }
};
