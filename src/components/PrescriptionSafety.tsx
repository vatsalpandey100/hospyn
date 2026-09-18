import React, { useState } from "react";
import { Patient } from "../types";
import { AlertOctagon, Sparkles, CheckCircle, ShieldAlert, ArrowLeft, Pill, ShieldCheck } from "lucide-react";

interface PrescriptionSafetyProps {
  patient: Patient;
  onBack: () => void;
  onPrescriptionConfirmed: (medicines: string[]) => void;
  language?: "en" | "hi";
}

export const PrescriptionSafety: React.FC<PrescriptionSafetyProps> = ({ patient, onBack, onPrescriptionConfirmed, language = "en" }) => {
  const isHindi = language === "hi";
  const [medicines, setMedicines] = useState<string[]>([""]);
  const [checking, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAddMedicine = () => {
    setMedicines(prev => [...prev, ""]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, val: string) => {
    setMedicines(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleCheckSafety = async () => {
    const activeMeds = medicines.filter(m => m.trim());
    if (activeMeds.length === 0) {
      alert("Please add at least one medicine to verify.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/prescription-safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicines: activeMeds,
          language: language,
          patientInfo: {
            gender: patient.gender,
            dob: patient.dob,
            allergies: patient.allergies,
            chronicConditions: patient.chronicConditions,
            pregnancyStatus: patient.pregnancyStatus
          }
        })
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data.text);
      } else {
        throw new Error(data.error || "Safety verification failed");
      }
    } catch (err: any) {
      setResult(`Verification Error: ${err.message || "Failed to complete clinical evaluation."}`);
    } finally {
      setLoading(false);
    }
  };

  const hasHazards = result && !result.includes("NO CLINICAL HAZARDS DETECTED");

  return (
    <div className="flex flex-col bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 shadow-sm" id="safety-engine-root">
      {/* Top Header */}
      <div className="flex items-center gap-3 bg-white px-4 py-3 border-b border-slate-100" id="safety-engine-header">
        <button className="p-2 hover:bg-slate-50 rounded-full transition-colors" onClick={onBack} id="btn-back">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
            <ShieldAlert className="w-4 h-4 text-purple-600" /> {isHindi ? "AI दवा सुरक्षा जांच" : "AI Prescription Safety Engine"}
          </h3>
          <span className="text-xs text-purple-600 font-semibold">{isHindi ? "मरीज़ सुरक्षा विश्लेषक" : "Real-time Patient Handoff Analyzer"}</span>
        </div>
      </div>

      <div className="p-4 space-y-4" id="safety-engine-body">
        {/* Patient Health Profile Summary */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2.5" id="patient-safety-summary">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-ping"></div>
            <h4 className="text-xs font-extrabold text-slate-900">{isHindi ? "सक्रिय मरीज़ स्वास्थ्य प्रोफ़ाइल" : "Active Patient Health Profile"}</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700" id="profile-grid">
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">{isHindi ? "मरीज़ का नाम" : "Patient Name"}</span>
              <span className="text-slate-800">{patient.name}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">{isHindi ? "ब्लड ग्रुप" : "Blood Group"}</span>
              <span className="text-red-600">{patient.bloodGroup}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl col-span-2">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">{isHindi ? "गंभीर बीमारियां" : "Chronic Conditions"}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {patient.chronicConditions.map((c, i) => (
                  <span key={i} className="bg-blue-100 text-blue-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl col-span-2">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block">{isHindi ? "एलर्जी" : "Allergies"}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {patient.allergies.map((a, i) => (
                  <span key={i} className="bg-red-100 text-red-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            </div>
            {patient.pregnancyStatus && (
              <div className="bg-orange-50 p-2 rounded-xl col-span-2 border border-orange-100">
                <span className="text-[9px] text-orange-500 uppercase tracking-wider font-extrabold block">{isHindi ? "गर्भावस्था अलर्ट" : "Pregnancy Safety Flag"}</span>
                <span className="text-orange-700 font-extrabold">{patient.pregnancyStatus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Medicines Entry Form */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3" id="medicines-entry-form">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{isHindi ? "प्रस्तावित दवाएं" : "Proposed Prescriptions"}</label>
          <div className="space-y-2" id="medicines-list">
            {medicines.map((med, idx) => (
              <div key={idx} className="flex gap-2 items-center" id={`med-row-${idx}`}>
                <div className="relative flex-1 flex items-center">
                  <Pill className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 outline-none focus:border-purple-600 focus:bg-white"
                    placeholder={isHindi ? "दवा दर्ज करें (जैसे Ibuprofen, Amoxicillin)..." : "Enter medicine (e.g. Ibuprofen, Amoxicillin)..."}
                    value={med}
                    onChange={(e) => handleMedicineChange(idx, e.target.value)}
                  />
                </div>
                {medicines.length > 1 && (
                  <button
                    onClick={() => handleRemoveMedicine(idx)}
                    className="text-red-500 hover:text-red-700 font-extrabold text-xs px-2 py-1"
                  >
                    {isHindi ? "हटाएं" : "Remove"}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2" id="prescription-actions">
            <button
              onClick={handleAddMedicine}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-extrabold transition-all active:scale-[0.98]"
            >
              + {isHindi ? "दवा जोड़ें" : "Add Medicine"}
            </button>
            <button
              onClick={handleCheckSafety}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-xs font-extrabold transition-all active:scale-[0.98] shadow-md shadow-purple-100 flex items-center justify-center gap-1.5"
              disabled={checking}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {checking ? (isHindi ? "सुरक्षा जांची जा रही है..." : "Analyzing Safety...") : (isHindi ? "दवा सुरक्षा जांचें" : "Check Patient Safety")}
            </button>
          </div>
        </div>

        {/* Evaluation results */}
        {result && (
          <div
            className={`p-4 rounded-2xl border shadow-sm space-y-3 text-xs ${
              hasHazards
                ? "bg-red-50/50 border-red-100 text-slate-800"
                : "bg-green-50/50 border-green-100 text-slate-800"
            }`}
            id="evaluation-results"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              {hasHazards ? (
                <ShieldAlert className="w-5 h-5 text-red-600 animate-bounce" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-green-600" />
              )}
              <h4 className="font-extrabold text-sm text-slate-900">
                {hasHazards ? (isHindi ? "दुष्प्रभाव और खतरे मिले" : "Contraindications & Side-Effects Identified") : (isHindi ? "चिकित्सीय सुरक्षा स्वीकृत" : "Clinical Clearance Approved")}
              </h4>
            </div>
            <div className="font-medium leading-relaxed whitespace-pre-wrap">
              {result}
            </div>

            {/* Let doctor confirm the prescription */}
            <button
              onClick={() => onPrescriptionConfirmed(medicines.filter(m => m.trim()))}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl text-xs transition-colors mt-2"
            >
              {isHindi ? "पुष्टि करें और दवा पर्ची में जोड़ें" : "Confirm and Add to Prescription"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
