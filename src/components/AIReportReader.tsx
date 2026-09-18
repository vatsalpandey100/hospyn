import React, { useState } from "react";
import { Sparkles, ArrowLeft, Camera, FileText, UploadCloud, CheckCircle } from "lucide-react";

interface AIReportReaderProps {
  onBack: () => void;
  onRecordAdded?: (newRecord: any) => void;
  language?: "en" | "hi";
}

export const AIReportReader: React.FC<AIReportReaderProps> = ({ onBack, onRecordAdded, language = "en" }) => {
  const isHindi = language === "hi";
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [category, setCategory] = useState("Lab Report");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!fileBase64 || loading) return;

    setLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch("/api/ai/analyze-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: fileBase64,
          mimeType: mimeType,
          category: category,
          language: language
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAnalysis(data.text);

        // Optional callback to insert this newly analyzed record directly into the library!
        if (onRecordAdded) {
          onRecordAdded({
            id: `record-${Date.now()}`,
            name: fileName,
            category: category,
            size: "1.2 MB",
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            summary: data.text,
            fileBase64: fileBase64
          });
        }
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (err: any) {
      setAnalysis(`Analysis Error: ${err.message || "Failed to parse the report."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full bg-slate-50 rounded-3xl overflow-hidden border border-slate-100" id="report-reader-root">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white px-4 py-3 border-b border-slate-100" id="report-reader-header">
        <button className="p-2 hover:bg-slate-50 rounded-full transition-colors" onClick={onBack} id="btn-back">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-blue-600 fill-blue-100" /> {isHindi ? "AI रिपोर्ट रीडर" : "AI Report Reader"}
          </h3>
          <span className="text-xs text-indigo-600 font-semibold">Gemini 3.1 Pro Intelligence</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" id="report-reader-body">
        {/* Upload Container */}
        {!analysis && !loading ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4" id="upload-panel">
            <div className="flex justify-center" id="upload-illus">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <UploadCloud className="w-8 h-8" />
              </div>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                {isHindi ? "दस्तावेज़ का विश्लेषण करें" : "Analyze Clinical Documents"}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                {isHindi 
                  ? "ब्लड टेस्ट, यूरिन टेस्ट या प्रिस्क्रिप्शन की फोटो लें। Gemini Pro आपको आसान भाषा में समझाएगा।" 
                  : "Take a photo of your Blood Test, Urine Test, or Prescription. Gemini Pro will explain the readings simply."}
              </p>
            </div>

            {/* Category Selector */}
            <div className="text-left space-y-1.5" id="category-picker-wrap">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {isHindi ? "दस्तावेज़ श्रेणी" : "Document Category"}
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                id="category-select"
              >
                <option value="Lab Report">{isHindi ? "लैब रिपोर्ट (ब्लड/सीरम जांच)" : "Lab Report (e.g. Blood Test, Serum)"}</option>
                <option value="Prescription">{isHindi ? "दवा पर्ची (Prescription)" : "Prescription (Medicines, dosage)"}</option>
                <option value="Discharge Summary">{isHindi ? "डिस्चार्ज समरी (Discharge Summary)" : "Discharge Summary"}</option>
                <option value="Radiology Report">{isHindi ? "रेडियोलॉजी रिपोर्ट (X-Ray, MRI)" : "Radiology Report (X-Ray, MRI notes)"}</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2" id="action-buttons-wrap">
              {/* File Upload Selector */}
              <label className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-extrabold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5">
                <FileText className="w-4 h-4" />
                {isHindi ? "फोटो चुनें" : "Choose Photo"}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              {/* Camera Trigger directly */}
              <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-extrabold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-100">
                <Camera className="w-4 h-4" />
                {isHindi ? "फोटो खींचें" : "Take Photo"}
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {fileBase64 && (
              <div className="bg-slate-50 rounded-xl p-3 text-left border border-slate-100 flex items-center justify-between" id="selected-file-badge">
                <div className="flex items-center gap-2 overflow-hidden">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">{fileName}</span>
                </div>
                <button
                  onClick={handleAnalyze}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors"
                  id="btn-analyze"
                >
                  Analyze
                </button>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4 py-16" id="analysis-loading">
            <div className="relative flex items-center justify-center w-16 h-16" id="loading-spinner">
              <div className="absolute w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
              <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Gemini reading your report...</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px] leading-relaxed">
                Applying advanced multimodal medical reasoning to explain your values simply.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4" id="analysis-results">
            {/* Image Preview thumbnail */}
            {fileBase64 && (
              <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-3" id="preview-thumbnail">
                <img src={fileBase64} alt="Report Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0" />
                <div className="overflow-hidden">
                  <h5 className="text-xs font-extrabold text-slate-800 truncate">{fileName}</h5>
                  <span className="text-[10px] text-green-600 font-bold block">✓ Successfully Analyzed as {category}</span>
                </div>
              </div>
            )}

            {/* Analysis card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="results-card">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-slate-900 text-sm">AI Explanation</h4>
                <button
                  className="text-xs text-blue-600 font-bold hover:underline"
                  onClick={() => {
                    setAnalysis(null);
                    setFileBase64(null);
                  }}
                  id="btn-reanalyze"
                >
                  Analyze Another
                </button>
              </div>
              <div className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                {analysis}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
