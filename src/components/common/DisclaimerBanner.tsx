import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <aside
      id="clinical-safety-disclaimer"
      aria-label="Clinical Decision Support Disclaimer"
      className="bg-slate-900 text-slate-300 text-xs px-4 py-2 border-b border-slate-800"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="font-medium text-slate-200">Clinical Decision Support Aid:</span>
          <span>
            DocGenie is an administrative and pre-consultation intake workflow assistant. It does not provide autonomous clinical diagnosis or treatment decisions. All clinical reviews require licensed physician verification.
          </span>
        </div>
        <div className="text-[11px] text-teal-400/90 font-mono tracking-wider shrink-0 uppercase">
          SIH 2026 • Module 1 Foundation
        </div>
      </div>
    </aside>
  );
};
