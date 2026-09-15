import React from 'react';
import { User, Sparkles, Stethoscope, Info } from 'lucide-react';
import { DataProvenance } from '../../types';

interface ProvenanceBadgeProps {
  source: DataProvenance | 'PATIENT_REPORTED' | 'AI_GENERATED' | 'CLINICIAN_VERIFIED';
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  source,
  size = 'md',
  showDescription = false,
  className = '',
}) => {
  const configs = {
    PATIENT_REPORTED: {
      label: 'Patient-Reported',
      shortLabel: 'Patient Input',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
      icon: <User className={size === 'sm' ? 'w-3 h-3 text-emerald-700' : 'w-3.5 h-3.5 text-emerald-700'} />,
      description: 'Direct self-reported disclosure by the patient. Primary factual input.',
    },
    AI_GENERATED: {
      label: 'AI-Synthesized (Assistive)',
      shortLabel: 'AI-Generated',
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300 font-semibold',
      icon: <Sparkles className={size === 'sm' ? 'w-3 h-3 text-indigo-600' : 'w-3.5 h-3.5 text-indigo-600'} />,
      description: 'Algorithmic clinical synthesis & triage assistive cues. Requires physician review (No autonomous diagnosis).',
    },
    CLINICIAN_VERIFIED: {
      label: 'Clinician-Verified',
      shortLabel: 'Doctor Verified',
      badgeClass: 'bg-teal-50 text-teal-900 border-teal-400 font-semibold',
      icon: <Stethoscope className={size === 'sm' ? 'w-3 h-3 text-teal-700' : 'w-3.5 h-3.5 text-teal-700'} />,
      description: 'Signed and approved by a licensed medical practitioner.',
    },
  };

  const config = configs[source] || configs.PATIENT_REPORTED;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs whitespace-nowrap transition-colors ${sizeClasses[size]} ${config.badgeClass} ${className}`}
      title={config.description}
    >
      {config.icon}
      <span>{config.label}</span>
      {showDescription && (
        <span className="hidden sm:inline text-slate-500 font-normal ml-1">
          — {config.description}
        </span>
      )}
    </span>
  );
};

/**
 * Visual banner showing the DocGenie Data Provenance Legend
 * Clearly demarcates Patient-Provided vs AI-Synthesized data layers.
 */
export const ProvenanceLegend: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Info className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          <span>Data Provenance:</span>
        </div>
        <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
        <span className="text-slate-400">•</span>
        <ProvenanceBadge source="AI_GENERATED" size="sm" />
        <span className="text-slate-400">•</span>
        <ProvenanceBadge source="CLINICIAN_VERIFIED" size="sm" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs font-bold">
            <Info className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            DocGenie Data Source & Provenance Distinction
          </h4>
        </div>
        <span className="text-[11px] font-medium text-slate-500">Clinical Safety Standard</span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        DocGenie strictly demarcates patient-entered factual history from algorithmic pre-consultation decision support. No autonomous medical diagnosis is generated.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
            <span className="text-[10px] font-bold text-emerald-800">Source: Patient</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-normal mt-1">
            Self-reported demographics, allergies, home medications, personal conditions, and symptoms entered directly by patient.
          </p>
        </div>

        <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <ProvenanceBadge source="AI_GENERATED" size="sm" />
            <span className="text-[10px] font-bold text-indigo-700">Source: AI Assist</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-normal mt-1">
            Structured transcript summarization, triage urgency cues, and intake completeness scoring. Requires physician audit.
          </p>
        </div>

        <div className="p-3 bg-white rounded-xl border border-teal-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <ProvenanceBadge source="CLINICIAN_VERIFIED" size="sm" />
            <span className="text-[10px] font-bold text-teal-800">Source: Clinician</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-normal mt-1">
            Formal physician review, clinical differential sign-off, verified prescriptions, and authorized consultation notes.
          </p>
        </div>
      </div>
    </div>
  );
};
