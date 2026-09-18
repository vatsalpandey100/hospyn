import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldReportsSection = `                  {/* Recent Reports Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-extrabold text-slate-900 text-[14px]">Recent Reports</span>
                      <button 
                        onClick={() => setPatientTab("RECORDS")}
                        className="text-[12px] text-blue-600 font-extrabold hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    <div className="bg-white border border-slate-100/80 rounded-[24px] p-4.5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between h-[210px]">
                      {/* Report 1 */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="text-left min-w-0">
                            <h5 className="font-extrabold text-slate-800 text-[13px] truncate">Blood Test</h5>
                            <span className="text-[10px] text-slate-400 font-bold">12 Jul 2026</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const rec = activePatientRecords.find(r => r.name.toLowerCase().includes("blood"));
                            if (rec) setPreviewRecord(rec);
                            else alert("Blood test report details loaded securely.");
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Report 2 */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="text-left min-w-0">
                            <h5 className="font-extrabold text-slate-800 text-[13px] truncate">MRI Report</h5>
                            <span className="text-[10px] text-slate-400 font-bold">05 Jul 2026</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => alert("MRI Scan report downloading securely...")}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors shrink-0"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Report 3 */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="text-left min-w-0">
                            <h5 className="font-extrabold text-slate-800 text-[13px] truncate">X-Ray Chest</h5>
                            <span className="text-[10px] text-slate-400 font-bold">01 Jul 2026</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => alert("Chest X-Ray report downloading securely...")}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors shrink-0"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>`;

const newReportsSection = `                  {/* Recent Reports Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="font-extrabold text-slate-900 text-[14px]">Recent Reports</span>
                      <button 
                        onClick={() => setPatientTab("RECORDS")}
                        className="text-[12px] text-blue-600 font-extrabold hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    <div className="bg-white border border-slate-100/80 rounded-[24px] p-4.5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col h-[210px] overflow-hidden gap-3">
                      {activePatientRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs font-bold gap-2">
                          <ClipboardList className="w-8 h-8 opacity-20" />
                          <span>No recent reports</span>
                          <button onClick={() => { setPatientTab("RECORDS"); setShowUploadRecordModal(true); }} className="text-blue-600 font-extrabold text-[11px] hover:underline bg-blue-50 px-3 py-1.5 rounded-lg mt-1">Upload First Record</button>
                        </div>
                      ) : (
                        activePatientRecords.slice(0, 3).map((rec, i) => (
                          <div key={rec.id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 \${
                                i === 0 ? "bg-blue-50 text-blue-600" :
                                i === 1 ? "bg-purple-50 text-purple-600" : "bg-emerald-50 text-emerald-600"
                              }\`}>
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="text-left min-w-0">
                                <h5 className="font-extrabold text-slate-800 text-[13px] truncate">{rec.name}</h5>
                                <span className="text-[10px] text-slate-400 font-bold">{rec.date}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => setPreviewRecord(rec)}
                              className={\`p-1.5 rounded-lg transition-colors shrink-0 \${
                                i === 0 ? "text-blue-600 hover:bg-blue-50" :
                                i === 1 ? "text-purple-600 hover:bg-purple-50" : "text-emerald-600 hover:bg-emerald-50"
                              }\`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>`;

if (content.includes(oldReportsSection)) {
  content = content.replace(oldReportsSection, newReportsSection);
  fs.writeFileSync('src/App.tsx', content);
  console.log('Success');
} else {
  console.log('Not found');
}
