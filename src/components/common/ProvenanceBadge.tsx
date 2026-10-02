import React from 'react';
import { User, Stethoscope, Info, Bot } from 'lucide-react';
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
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <User className={size === 'sm' ? 'w-3 h-3 text-emerald-700' : 'w-3.5 h-3.5 text-emerald-700'} />,
      description: 'Direct self-reported disclosure by the patient. Primary factual input.',
    },
    AI_GENERATED: {
      label: 'AI-Synthesized (Assistive)',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      icon: <Bot className={size === 'sm' ? 'w-3 h-3 text-slate-600' : 'w-3.5 h-3.5 text-slate-600'} />,
      description: 'Pre-consultation clinical synthesis. Requires physician review (No autonomous diagnosis).',
    },
    CLINICIAN_VERIFIED: {
      label: 'Clinician-Verified',
      badgeClass: 'bg-teal-50 text-teal-900 border-teal-300 font-semibold',
      icon: <Stethoscope className={size === 'sm' ? 'w-3 h-3 text-teal-700' : 'w-3.5 h-3.5 text-teal-700'} />,
      description: 'Signed and approved by a licensed medical practitioner.',
    },
  };

  const config = configs[source] || configs.PATIENT_REPORTED;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2 py-0.5 gap-1.5',
    lg: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium whitespace-nowrap leading-none ${sizeClasses[size]} ${config.badgeClass} ${className}`}
      title={config.description}
    >
      {config.icon}
      <span>{config.label}</span>
      {showDescription && (
        <span className="hidden sm:inline text-slate-500 font-normal ml-1">
          : {config.description}
        </span>
      )}
    </span>
  );
};

export const ProvenanceLegend: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Info className="w-3.5 h-3.5 text-teal-700 shrink-0" />
          <span>Data Provenance:</span>
        </div>
        <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
        <span className="text-slate-300">·</span>
        <ProvenanceBadge source="AI_GENERATED" size="sm" />
        <span className="text-slate-300">·</span>
        <ProvenanceBadge source="CLINICIAN_VERIFIED" size="sm" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-teal-800 text-white flex items-center justify-center text-xs font-bold">
            <Info className="w-3 h-3" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 tracking-tight">
            Clinical Data Provenance Distinction
          </h4>
        </div>
        <span className="text-[11px] text-slate-400">Decision Support Governance</span>
      </div>

      <p className="text-xs text-slate-600 leading-normal">
        DocGenie maintains strict separation between patient-provided factual statements and algorithmic pre-consultation decision support.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
        <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center justify-between mb-1">
            <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
            <span className="text-[10px] text-slate-400 font-mono">Layer 1</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-normal">
            Directly self-reported symptoms, timelines, home medicines, and allergy history.
          </p>
        </div>

        <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center justify-between mb-1">
            <ProvenanceBadge source="AI_GENERATED" size="sm" />
            <span className="text-[10px] text-slate-400 font-mono">Layer 2</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-normal">
            Pre-consultation transcript synthesis and conservative red-flag surveillance.
          </p>
        </div>

        <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center justify-between mb-1">
            <ProvenanceBadge source="CLINICIAN_VERIFIED" size="sm" />
            <span className="text-[10px] text-slate-400 font-mono">Layer 3</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-normal">
            Doctor audit notes, verified differential consideration, and signed clinical record.
          </p>
        </div>
      </div>
    </div>
  );
};
