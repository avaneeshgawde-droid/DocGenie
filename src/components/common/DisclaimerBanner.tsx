import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <aside
      id="clinical-safety-disclaimer"
      aria-label="Clinical Decision Support Disclaimer"
      className="bg-slate-900 text-slate-300 text-xs px-4 py-2 border-b border-slate-800"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-slate-100">Clinical Decision Support:</span>
          <span className="text-slate-300 text-[11px] sm:text-xs">
            DocGenie assists hospital OPD intake and triage prioritization. It does not provide autonomous clinical diagnosis. All patient records require licensed physician verification.
          </span>
        </div>
        <div className="text-[10px] text-teal-400 font-mono tracking-wider shrink-0 uppercase">
          SIH 2026 · PS-24
        </div>
      </div>
    </aside>
  );
};
