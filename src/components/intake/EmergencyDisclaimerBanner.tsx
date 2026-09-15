import React, { useState } from 'react';
import { AlertOctagon, PhoneCall, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

export const EmergencyDisclaimerBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-3.5 mb-6 shadow-2xs transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Emergency Care Disclaimer &amp; Safety Notice
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200/80 text-rose-900">
                Non-Autonomous AI Protocol
              </span>
            </div>
            <p className="text-xs text-rose-950 mt-1 leading-relaxed">
              <strong>Do not use this intake for medical emergencies.</strong> If you are experiencing
              sudden crushing chest pain, difficulty breathing, severe bleeding, or stroke-like numbness,
              call emergency services (<strong>112 / 108</strong>) or report immediately to hospital
              Emergency (Casualty).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-rose-700 hover:text-rose-900 text-xs font-medium inline-flex items-center gap-1 shrink-0 px-2 py-1 rounded-md hover:bg-rose-100 transition-colors cursor-pointer"
          aria-label={isExpanded ? 'Collapse disclaimer details' : 'Expand disclaimer details'}
        >
          <span>{isExpanded ? 'Less' : 'Details'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-rose-200/70 text-[11px] text-rose-900/90 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-rose-950">No Autonomous Diagnosis</span>
              DocGenie gathers structured pre-consultation information to aid hospital OPD clinicians. It does not replace independent professional medical judgment.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <PhoneCall className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-rose-950">Immediate Care Pathway</span>
              Casualty triage nurses will prioritize patients based on physical vitals upon in-person OPD arrival.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
