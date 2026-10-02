import React, { useState } from 'react';
import { User, Phone, MapPin, Heart, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { SyntheticPatient } from '../../types';
import { Button } from '../common/Button';

interface EditPatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: SyntheticPatient;
  onSave: (updatedPatient: SyntheticPatient) => void;
}

export const EditPatientProfileModal: React.FC<EditPatientProfileModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSave,
}) => {
  const [formData, setFormData] = useState<SyntheticPatient>({ ...patient });
  const [allergiesText, setAllergiesText] = useState(patient.allergies?.join(', ') || '');
  const [conditionsText, setConditionsText] = useState(patient.chronicConditions?.join(', ') || '');
  const [medsText, setMedsText] = useState(patient.medications?.join(', ') || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SyntheticPatient = {
      ...formData,
      allergies: allergiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      chronicConditions: conditionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      medications: medsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onSave(updated);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 id="edit-profile-title" className="text-base font-semibold text-slate-900">
                Edit Patient Profile
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {patient.medicalRecordNumber || patient.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blood Group
              </label>
              <input
                type="text"
                value={formData.bloodGroup || ''}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                placeholder="e.g. O+, B+, A-"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
              Contact & Emergency
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>City / Address</span>
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center space-x-1">
                  <Heart className="w-3.5 h-3.5 text-slate-400" />
                  <span>Emergency Contact (Name & Number)</span>
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="e.g. Vikram Sharma (Spouse) +91 98200 11223"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
              Medical Background
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Allergies (comma separated)</span>
                </label>
                <input
                  type="text"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Chronic Conditions (comma separated)
                </label>
                <input
                  type="text"
                  value={conditionsText}
                  onChange={(e) => setConditionsText(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Current Medications (comma separated)
                </label>
                <input
                  type="text"
                  value={medsText}
                  onChange={(e) => setMedsText(e.target.value)}
                  placeholder="e.g. Metformin 500mg, Lisinopril 10mg"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-teal-50/50 border border-teal-200/60 text-teal-800 text-xs">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Updates are synced to local storage and active intake pre-consultation notes.</span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
