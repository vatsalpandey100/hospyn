import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetRegex = /<div className="bg-white border border-slate-100\/80 rounded-\[24px\] p-4\.5 shadow-\[0_8px_30px_rgba\(0,0,0,0\.01\)\] flex flex-col justify-between h-\[210px\]">[\s\S]*?\{" "\}\n\s*<button/g;

// I will do it differently. I'll just write a script to replace the entire "Recent Reports Section" up to "Recent Prescriptions Section"

