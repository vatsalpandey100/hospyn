import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state for showUploadRecordModal and uploadRecordFile
const stateVars = `
  const [showUploadRecordModal, setShowUploadRecordModal] = useState(false);
  const [uploadRecordFile, setUploadRecordFile] = useState<File | null>(null);
  const [uploadRecordCategory, setUploadRecordCategory] = useState("Lab Report");
  const [uploadRecordName, setUploadRecordName] = useState("");
`;

content = content.replace(
  'const [showRecordsSummaryModal, setShowRecordsSummaryModal] = useState(false);',
  'const [showRecordsSummaryModal, setShowRecordsSummaryModal] = useState(false);\n' + stateVars
);

// 2. Add handleAddRecordSubmit function
const addRecordFn = `
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
      id: \`rec-\${Date.now()}\`,
      patientId: activePatient.id,
      name: uploadRecordName || uploadRecordFile.name,
      category: uploadRecordCategory,
      size: fileSize,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      summary: "Patient uploaded clinical document. Pending review.",
      fileBase64: fileBase64
    };
    
    setRecordsList(prev => [newRecord, ...prev]);
    setShowUploadRecordModal(false);
    setUploadRecordFile(null);
    setUploadRecordName("");
    setUploadRecordCategory("Lab Report");
  };
`;

content = content.replace(
  'const handleRegistrationWizardSubmit = async () => {',
  addRecordFn + '\n  const handleRegistrationWizardSubmit = async () => {'
);

// 3. Add Plus button in RECORDS tab
const plusButton = `
                  <button 
                    onClick={() => setShowUploadRecordModal(true)} 
                    className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-[0_4px_10px_rgba(37,99,235,0.25)]"
                    title="Upload Record"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  {/* Search Trigger */}`;

content = content.replace(
  '{/* Search Trigger */}',
  plusButton
);

// 4. Add the modal UI
const uploadModalUI = `
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
                        onChange={(e) => setUploadRecordCategory(e.target.value)}
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
                                setUploadRecordName(file.name.replace(/\.[^/.]+$/, ""));
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
`;

content = content.replace(
  '{/* Selected Record Preview Modal */}',
  uploadModalUI + '\n          {/* Selected Record Preview Modal */}'
);

fs.writeFileSync('src/App.tsx', content);
