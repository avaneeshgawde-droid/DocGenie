import React, { useState } from 'react';
import { X, Shield, FileText } from 'lucide-react';
import { Button } from './Button';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-lg shadow-lg max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
              {activeTab === 'terms' ? (
                <FileText className="w-4 h-4" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-base font-semibold text-slate-900">
                {activeTab === 'terms' ? 'Terms & Conditions of Service' : 'Patient Privacy & Data Protection Policy'}
              </h2>
              <p className="text-xs text-slate-500">
                DocGenie Healthcare Platform • Clinical Intake & Patient-Flow System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'terms'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Terms & Conditions
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          {activeTab === 'terms' ? (
            <>
              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 text-sm">
                  1. Clinical Decision Support Disclaimer
                </h3>
                <p>
                  DocGenie provides administrative intake streamlining and clinical history summarization.
                  DocGenie is NOT a medical diagnostic device and does not dispense medical advice, prescribe
                  pharmacotherapy, or replace clinical judgment. All summarized intake information, provisional
                  triage tags, and questionnaire answers must be independently verified by a licensed medical practitioner.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 text-sm">
                  2. Emergency Medical Exclusions
                </h3>
                <p>
                  Do not use DocGenie for emergency medical conditions. If you experience severe chest pain,
                  sudden shortness of breath, sudden numbness, uncontrolled bleeding, severe trauma, or acute loss of consciousness,
                  immediately call national emergency services (112 / 108) or proceed to the nearest emergency department.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 text-sm">
                  3. Synthetic Data and Demonstration Protocol
                </h3>
                <p>
                  In compliance with patient confidentiality and hackathon sandbox rules, demonstrator accounts
                  operate with de-identified synthetic test cases. When connected to clinical enterprise backends,
                  all data handling complies with hospital role isolation policies.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 text-sm">
                  4. Role Isolation and Verification Authority
                </h3>
                <p>
                  Patient accounts are restricted to intake completion and personal consultation history reviews.
                  Physician verification, triage escalation, and medical record sign-offs are strictly restricted to authenticated
                  doctor accounts with appropriate clinical credentials.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 text-sm">
                  1. Data Collection & Healthcare Records
                </h3>
                <p>
                  DocGenie collects patient-reported symptoms, medical chronology, allergies, current medications,
                  and vital trends strictly for pre-consultation OPD preparation. Information is collected solely to assist
                  the consulting physician during the scheduled outpatient consultation.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 text-sm">
                  2. Encryption and Access Controls
                </h3>
                <p>
                  Data transmissions utilize transport-layer encryption (TLS 1.3). When deployed with Supabase or hospital
                  storage, records adhere to Row Level Security (RLS) policies ensuring patients can only view their own intake
                  data and licensed clinical staff can only access assigned departmental worklists.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 text-sm">
                  3. AI Processing and Model Boundaries
                </h3>
                <p>
                  Automated summarization features operate with isolated contextual prompts. No patient health information
                  is used for training generalized public language models. Clinical summaries retain provenance indicators
                  distinguishing patient-reported entries from structured conversions.
                </p>
              </section>

              <section className="space-y-1.5">
                <h3 className="font-semibold text-slate-900 text-sm">
                  4. Patient Rights & Record Retention
                </h3>
                <p>
                  Patients retain the right to inspect, review, and request correction of their pre-consultation draft
                  before submission. Submitted records become part of the hospital outpatient documentation subject to statutory
                  health record retention mandates.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
          <span className="text-[11px] text-slate-500 font-mono">
            Version 1.2.0 • Last revised October 2026
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
