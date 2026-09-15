import React, { useState } from 'react';
import {
  User,
  PlusCircle,
  FileText,
  AlertCircle,
  Calendar,
  HeartPulse,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Edit3,
  Pill,
  History,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { SyntheticPatient, ClinicalCase } from '../../types';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { ProvenanceBadge, ProvenanceLegend } from '../common/ProvenanceBadge';
import { EditPatientProfileModal } from '../profile/EditPatientProfileModal';
import { useAuth } from '../../context/AuthContext';
import { SYNTHETIC_PATIENTS } from '../../data/mockData';
import { resetStoredPatientToDefault } from '../../lib/patientStorage';

interface PatientDashboardViewProps {
  patient: SyntheticPatient;
  cases: ClinicalCase[];
  onStartNewCase: () => void;
  onSelectCaseDetail?: (clinicalCase: ClinicalCase) => void;
}

export const PatientDashboardView: React.FC<PatientDashboardViewProps> = ({
  patient,
  cases,
  onStartNewCase,
}) => {
  const { updatePatientProfile } = useAuth();
  const [selectedCase, setSelectedCase] = useState<ClinicalCase | null>(null);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'summary' | 'medications' | 'history'>('summary');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Filter cases for the active patient
  const patientCases = cases.filter((c) => c.patientId === patient.id);

  // Profile Save Handler
  const handleSaveProfile = (updated: Partial<SyntheticPatient>) => {
    updatePatientProfile(updated);
    setToastMessage('Patient profile updated successfully. Baseline data saved with [Patient-Reported] provenance.');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 4500);
  };

  // Reset to original seed data for this patient
  const handleResetToSeed = () => {
    const reset = resetStoredPatientToDefault(patient.id);
    updatePatientProfile(reset);
    setToastMessage('Profile reset to original synthetic seed data.');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 4500);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Toast Notification */}
      {showSaveToast && (
        <div
          id="profile-save-toast"
          className="fixed bottom-6 right-6 z-50 max-w-md bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-700 flex items-center gap-3 animate-in slide-in-from-bottom-5"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          </div>
          <div className="text-xs">
            <span className="font-bold block">Profile Updated</span>
            <span className="text-emerald-200">{toastMessage}</span>
          </div>
          <button
            onClick={() => setShowSaveToast(false)}
            className="text-emerald-300 hover:text-white ml-auto text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner: Patient Overview & Quick Actions */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl text-white p-6 sm:p-8 shadow-md border border-teal-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-700/80 border border-teal-500/30 flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-inner">
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {patient.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-200 border border-teal-400/30 font-mono">
                  {patient.uhid}
                </span>
                <ProvenanceBadge source="PATIENT_REPORTED" size="sm" className="bg-emerald-950/70 border-emerald-500/40 text-emerald-200" />
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  Demo Synthetic Record
                </span>
              </div>

              <p className="text-sm text-teal-100/90 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  {patient.age} Yrs ({patient.dateOfBirth || 'DOB on file'}) • {patient.gender}
                </span>
                <span>•</span>
                <span>
                  Blood Group: <strong className="text-white">{patient.bloodGroup}</strong>
                </span>
                <span>•</span>
                <span>
                  Phone: <span className="font-mono text-xs">{patient.phone}</span>
                </span>
              </p>

              {/* Quick Status Chips */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {patient.allergies.length > 0 ? (
                  <div className="flex items-center gap-1.5 bg-rose-950/60 border border-rose-500/40 text-rose-200 px-3 py-1 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>
                      Allergies ({patient.allergies.length}):{' '}
                      <strong>{patient.allergies.join(', ')}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 text-slate-300 px-3 py-1 rounded-lg">
                    <span>No known drug allergies reported</span>
                  </div>
                )}

                {patient.medications && patient.medications.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-teal-950/60 border border-teal-500/40 text-teal-200 px-3 py-1 rounded-lg">
                    <Pill className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Active Meds: {patient.medications.length}</span>
                  </div>
                )}

                {patient.emergencyContact?.name && (
                  <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 text-slate-300 px-3 py-1 rounded-lg">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      Emergency: {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              id="edit-patient-profile-btn"
              variant="outline"
              size="md"
              onClick={() => setIsEditProfileModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold backdrop-blur-xs"
              icon={<Edit3 className="w-4 h-4" />}
            >
              Edit Health Profile
            </Button>

            <Button
              id="patient-start-case-btn"
              variant="primary"
              size="lg"
              onClick={onStartNewCase}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold border-none shadow-lg text-sm"
              icon={<PlusCircle className="w-5 h-5" />}
            >
              Start New Case Intake
            </Button>
          </div>
        </div>
      </div>

      {/* Data Source & Provenance Legend */}
      <ProvenanceLegend />

      {/* Patient Health Baseline & Editable Profile Card */}
      <Card className="border-teal-200/80 shadow-xs">
        <CardHeader
          title="Patient Baseline Health Profile"
          subtitle="Direct patient self-reported demographic disclosure, pharmacological history, and comorbidities."
          action={
            <div className="flex items-center gap-2">
              <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
              <Button
                id="edit-profile-card-action-btn"
                variant="outline"
                size="sm"
                onClick={() => setIsEditProfileModalOpen(true)}
                icon={<Edit3 className="w-3.5 h-3.5 text-teal-700" />}
                className="text-xs"
              >
                Edit Profile Fields
              </Button>
            </div>
          }
        />

        {/* Profile Tabs Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 gap-2 text-xs font-semibold">
          <button
            type="button"
            id="tab-profile-summary"
            onClick={() => setActiveProfileTab('summary')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeProfileTab === 'summary'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Demographics & Vitals</span>
          </button>
          <button
            type="button"
            id="tab-profile-meds"
            onClick={() => setActiveProfileTab('medications')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeProfileTab === 'medications'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Allergies & Current Medications ({patient.medications?.length || 0})</span>
          </button>
          <button
            type="button"
            id="tab-profile-history"
            onClick={() => setActiveProfileTab('history')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeProfileTab === 'history'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Known Conditions & Medical History</span>
          </button>
        </div>

        <CardContent className="p-6">
          {/* TAB: Demographics & Vitals */}
          {activeProfileTab === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              {/* Personal Details */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-700" />
                    <span>Identity & Demographics</span>
                  </span>
                  <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Full Name:</span>
                    <span className="font-semibold text-slate-800">{patient.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date of Birth (DOB):</span>
                    <span className="font-semibold text-slate-800">{patient.dateOfBirth || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Age:</span>
                    <span className="font-semibold text-slate-800">{patient.age} Years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sex / Gender:</span>
                    <span className="font-semibold text-slate-800">{patient.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Blood Group:</span>
                    <span className="font-semibold text-slate-800">{patient.bloodGroup}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-teal-700" />
                    <span>Contact Information</span>
                  </span>
                  <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono font-semibold text-slate-800">{patient.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                      {patient.email || 'Not provided'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">Address:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[180px]">
                      {patient.address || 'Pune, India (Demo)'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-500">
                    <span>Last Profile Sync:</span>
                    <span>{patient.lastProfileUpdateDate || '2026-09-14'}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2.5 md:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-teal-700" />
                    <span>Emergency Contact</span>
                  </span>
                  <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                </div>
                {patient.emergencyContact?.name ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Designated Kin:</span>
                      <span className="font-semibold text-slate-800">{patient.emergencyContact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Relationship:</span>
                      <span className="font-semibold text-slate-800">{patient.emergencyContact.relationship}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {patient.emergencyContact.phone}
                      </span>
                    </div>
                    <div className="p-2 bg-teal-50 rounded-lg text-teal-800 text-[11px] mt-2">
                      Priority contact for triage alerts during urgent care scenarios.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400">
                    <p>No emergency contact specified.</p>
                    <button
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="text-teal-700 font-semibold underline mt-1 text-xs cursor-pointer"
                    >
                      + Add Emergency Contact
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Allergies & Medications */}
          {activeProfileTab === 'medications' && (
            <div className="space-y-6 text-xs">
              {/* Allergies Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Known Allergies & Sensitivities
                    </h4>
                  </div>
                  <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                </div>
                {patient.allergies.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                    No allergies reported by patient.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-medium flex items-center gap-1.5 shadow-2xs"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{allergy}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Medications Section */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-700" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Current Active Medications
                    </h4>
                  </div>
                  <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                </div>

                {!patient.medications || patient.medications.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-center">
                    No current medications recorded.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {patient.medications.map((med) => (
                      <div
                        key={med.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 text-sm">{med.name}</span>
                            <span className="bg-slate-100 text-slate-800 font-mono text-[11px] px-2 py-0.5 rounded font-semibold">
                              {med.dosage}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs mt-1">
                            <strong>Schedule:</strong> {med.frequency}
                          </p>
                          {med.indication && (
                            <p className="text-slate-500 text-[11px] mt-0.5">
                              <strong>Purpose:</strong> {med.indication}
                            </p>
                          )}
                          {med.startDate && (
                            <p className="text-slate-400 text-[10px] mt-1 font-mono">
                              Started: {med.startDate}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Known Conditions & Relevant History */}
          {activeProfileTab === 'history' && (
            <div className="space-y-6 text-xs">
              {/* Chronic / Known Conditions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-teal-700" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Known Pre-Existing Conditions
                    </h4>
                  </div>
                  <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                </div>
                {patient.chronicConditions.length === 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                    No chronic conditions reported.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {patient.chronicConditions.map((cond, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium shadow-2xs"
                      >
                        {cond}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed Relevant History Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Past Surgical / Procedures:</span>
                  <p className="text-slate-600 leading-relaxed">
                    {patient.relevantHistory?.pastSurgicalHistory || 'No prior surgical history reported.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Family Medical History:</span>
                  <p className="text-slate-600 leading-relaxed">
                    {patient.relevantHistory?.familyHistory || 'No significant family history noted.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Lifestyle & Habits:</span>
                  <p className="text-slate-600 leading-relaxed">
                    {patient.relevantHistory?.lifestyleNotes || 'Lifestyle habits not specified.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">General Clinical Notes:</span>
                  <p className="text-slate-600 leading-relaxed">
                    {patient.relevantHistory?.generalMedicalNotes || 'Annual checkup routine.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Cases Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <Card>
            <CardHeader
              title={`My Clinical Cases (${patientCases.length})`}
              subtitle="Review intake status, completeness scores, and physician verification logs."
              action={
                <Button
                  id="header-start-case-btn"
                  variant="outline"
                  size="sm"
                  onClick={onStartNewCase}
                  icon={<PlusCircle className="w-3.5 h-3.5 text-teal-700" />}
                >
                  New Intake
                </Button>
              }
            />

            <CardContent className="p-4 space-y-3">
              {patientCases.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium">No cases found for this synthetic profile.</p>
                  <Button
                    size="sm"
                    variant="primary"
                    className="mt-3 bg-teal-700 hover:bg-teal-800 text-white"
                    onClick={onStartNewCase}
                  >
                    Initiate First Case
                  </Button>
                </div>
              ) : (
                patientCases.map((c) => (
                  <div
                    key={c.id}
                    id={`case-card-${c.id}`}
                    onClick={() => setSelectedCase(selectedCase?.id === c.id ? null : c)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedCase?.id === c.id
                        ? 'border-teal-500 bg-teal-50/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {c.id}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                          {c.department}
                        </span>
                        <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={c.priority} />
                        <StatusBadge status={c.status} />
                      </div>
                    </div>

                    <div className="mb-1">
                      <span className="text-[11px] text-slate-400 font-semibold block">
                        Chief Complaint (Patient Words):
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">
                        "{c.chiefComplaint}"
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100 mt-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {c.createdAt}
                        </span>
                        <span>•</span>
                        <span>Duration: {c.symptomDuration}</span>
                        <span>•</span>
                        <span>Severity: {c.severityLevel}</span>
                      </div>

                      {/* Intake Completeness Indicator */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-600">
                          Completeness:
                        </span>
                        <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.completenessScore >= 80
                                ? 'bg-teal-600'
                                : c.completenessScore >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${c.completenessScore}%` }}
                          ></div>
                        </div>
                        <span className="font-mono font-bold text-slate-700">
                          {c.completenessScore}%
                        </span>
                      </div>
                    </div>

                    {/* Expandable Case Snapshot */}
                    {selectedCase?.id === c.id && (
                      <div className="mt-4 pt-3 border-t border-teal-100 bg-teal-50/50 -mx-4 -mb-4 p-4 rounded-b-xl space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                              Structured Intake Summary Preview
                            </h4>
                            <ProvenanceBadge source="AI_GENERATED" size="sm" />
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-teal-200">
                            {c.structuredSummaryPreview}
                          </p>
                        </div>

                        {c.redFlags.length > 0 && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold">Safety Red Flags Identified:</span>
                              <ProvenanceBadge source="AI_GENERATED" size="sm" />
                            </div>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {c.redFlags.map((flag, idx) => (
                                <li key={idx}>{flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {c.doctorNotes && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold">Attending Clinician Verification Note:</span>
                              <ProvenanceBadge source="CLINICIAN_VERIFIED" size="sm" />
                            </div>
                            <p>{c.doctorNotes}</p>
                            {c.verifiedAt && (
                              <span className="text-[10px] text-emerald-700 block mt-1">
                                Verified at {c.verifiedAt} by {c.assignedDoctorName || 'Consultant'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Patient Safety Guidelines & Provenance */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <span>Patient Provenance Card</span>
              </h3>
              <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
            </div>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Universal Health ID:</span>
                <span className="font-mono font-semibold text-slate-800">{patient.uhid}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Age / Gender:</span>
                <span className="font-semibold text-slate-800">{patient.age} / {patient.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Blood Group:</span>
                <span className="font-semibold text-slate-800">{patient.bloodGroup}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Allergies Status:</span>
                <span className="font-semibold text-rose-700">
                  {patient.allergies.length > 0 ? `${patient.allergies.length} on file` : 'NKDA'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Active Prescriptions:</span>
                <span className="font-semibold text-slate-800">
                  {patient.medications?.length || 0} medications
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Emergency Kin:</span>
                <span className="font-semibold text-slate-800">
                  {patient.emergencyContact?.name ? `${patient.emergencyContact.name}` : 'None'}
                </span>
              </div>

              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="w-full text-xs text-teal-700 border-teal-300 hover:bg-teal-50"
                  icon={<Edit3 className="w-3.5 h-3.5" />}
                >
                  Edit Profile Information
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Patient Safety Disclaimer</span>
            </div>
            <p className="text-[11px] leading-relaxed text-teal-800">
              DocGenie pre-consultation intake assists doctors by organizing self-reported history. It does not generate medical diagnoses or dispense autonomous treatment. In emergencies, visit the nearest Emergency Room immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditPatientProfileModal
        patient={patient}
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSave={handleSaveProfile}
        onResetToDefault={handleResetToSeed}
      />
    </div>
  );
};
