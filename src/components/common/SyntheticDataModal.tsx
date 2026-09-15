import React from 'react';
import { ShieldCheck, Info, X, Database, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface SyntheticDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyntheticDataModal: React.FC<SyntheticDataModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="synthetic-data-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div
        id="synthetic-data-modal"
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-teal-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-600 text-white rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Synthetic / Demo Data Mode</h3>
              <p className="text-xs text-teal-700 font-medium">Smart India Hackathon 2026 Sandbox</p>
            </div>
          </div>
          <button
            id="close-synthetic-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-slate-600">
          <div className="flex gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold block mb-0.5">Strict Privacy & Healthcare Compliance</span>
              All patient records, medical identifiers (UHID), case histories, and physician names in this environment are purely synthetic and artificially generated for development and demonstration purposes. No protected health information (PHI) is collected, stored, or processed.
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Synthetic Sandbox Features</h4>
            <ul className="text-xs space-y-2">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Simulated Indian OPD patients (Aarav Sharma, Priya Patel, Rajesh Iyer)</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Mock Physician Profiles (Dr. Ananya Roy, Dr. Vikram Malhotra)</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Non-clinical prototype: Zero autonomous diagnosis; doctor in full control</span>
              </li>
              <li className="flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-600 shrink-0" />
                <span>AI, real-time queues, voice intake & appointments reserved for Modules 2 & 3</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button id="dismiss-synthetic-modal-btn" variant="primary" size="sm" onClick={onClose}>
            Acknowledge & Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
