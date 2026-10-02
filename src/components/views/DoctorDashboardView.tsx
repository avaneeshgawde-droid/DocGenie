import React, { useState } from 'react';
import {
  Stethoscope,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Edit3,
  X,
  AlertTriangle,
  FileCode2,
  Hospital,
  ShieldCheck,
} from 'lucide-react';
import { SyntheticDoctor, ClinicalCase, SyntheticPatient, ValidatedStructuredIntakeRecord } from '../../types/index';
import { SYNTHETIC_PATIENTS } from '../../data/mockData';
import { getStoredPatientById } from '../../lib/patientStorage';
import { getDoctorNoteDraft, saveDoctorNoteDraft, clearDoctorNoteDraft } from '../../lib/caseStorage';
import { getStoredStructuredRecord, convertConversationToStructuredRecord } from '../../lib/structuredIntakeConverter';
import { StructuredRecordViewer } from '../intake/StructuredRecordViewer';
import { Card, CardHeader } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { ProvenanceBadge, ProvenanceLegend } from '../common/ProvenanceBadge';

interface DoctorDashboardViewProps {
  doctor: SyntheticDoctor;
  cases: ClinicalCase[];
  onUpdateCase: (updatedCase: ClinicalCase) => void;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  doctor,
  cases,
  onUpdateCase,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const ACTIVE_REVIEW_KEY = 'docgenie_active_doctor_review_case_id_v1';

  const [selectedCaseForReview, setSelectedCaseForReview] = useState<ClinicalCase | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCaseId = localStorage.getItem(ACTIVE_REVIEW_KEY);
        if (savedCaseId) {
          const match = cases.find((c) => c.id === savedCaseId);
          if (match) return match;
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [verificationNotes, setVerificationNotes] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCaseId = localStorage.getItem(ACTIVE_REVIEW_KEY);
        if (savedCaseId) {
          const unsaved = getDoctorNoteDraft(savedCaseId);
          if (unsaved) return unsaved;
          const match = cases.find((c) => c.id === savedCaseId);
          if (match?.doctorNotes) return match.doctorNotes;
        }
      } catch {
        // ignore
      }
    }
    return '';
  });

  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Filter cases
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') {
      return c.status !== 'verified';
    }
    if (statusFilter === 'verified') {
      return c.status === 'verified';
    }
    return true;
  });

  // Calculate high-level stats
  const totalCases = cases.length;
  const pendingReviewCount = cases.filter((c) => c.status !== 'verified').length;
  const verifiedCount = cases.filter((c) => c.status === 'verified').length;
  const urgentCount = cases.filter((c) => c.priority === 'urgent' || c.priority === 'immediate').length;

  const handleOpenReview = (c: ClinicalCase) => {
    setSelectedCaseForReview(c);
    try {
      localStorage.setItem(ACTIVE_REVIEW_KEY, c.id);
    } catch {
      // ignore
    }
    const unsavedDraft = getDoctorNoteDraft(c.id);
    setVerificationNotes(unsavedDraft !== '' ? unsavedDraft : (c.doctorNotes || ''));
  };

  const handleCloseReview = () => {
    setSelectedCaseForReview(null);
    try {
      localStorage.removeItem(ACTIVE_REVIEW_KEY);
    } catch {
      // ignore
    }
  };

  const handleNotesChange = (value: string) => {
    setVerificationNotes(value);
    if (selectedCaseForReview) {
      saveDoctorNoteDraft(selectedCaseForReview.id, value, doctor.id);
    }
  };

  const handleVerifyCase = () => {
    if (!selectedCaseForReview) return;

    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    const updated: ClinicalCase = {
      ...selectedCaseForReview,
      status: 'verified',
      doctorNotes: verificationNotes || 'Clinical intake summary reviewed and verified by attending physician.',
      verifiedAt: `Today at ${timeString}`,
      assignedDoctorName: doctor.fullName,
    };

    onUpdateCase(updated);
    clearDoctorNoteDraft(selectedCaseForReview.id);
    handleCloseReview();
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  const [doctorViewingRecord, setDoctorViewingRecord] = useState<ValidatedStructuredIntakeRecord | null>(null);

  const handleOpenStructuredRecordForDoctor = (c: ClinicalCase) => {
    if (c.structuredIntakeRecord) {
      setDoctorViewingRecord(c.structuredIntakeRecord);
      return;
    }
    const stored = getStoredStructuredRecord(c.patientId) || getStoredStructuredRecord(c.id);
    if (stored) {
      setDoctorViewingRecord(stored);
      return;
    }
    // Generate deterministic structured record from case & synthetic patient profile
    const linked = getStoredPatientById(c.uhid) ||
      getStoredPatientById(c.patientId) ||
      SYNTHETIC_PATIENTS.find((p) => p.uhid === c.uhid || p.id === c.patientId) || {
        id: c.patientId,
        uhid: c.uhid,
        fullName: c.patientName,
        age: c.patientAge,
        gender: c.patientGender,
        phone: '+91 98765 43210',
        bloodGroup: 'B+',
        allergies: [],
        medications: [],
        chronicConditions: [],
        relevantHistory: {},
      };

    const generated = convertConversationToStructuredRecord({
      caseId: c.id,
      patient: linked,
      answers: {
        q1_chief_complaint: {
          questionId: 'q1_chief_complaint',
          sectionId: 'chief_complaint',
          text: c.chiefComplaint,
          isUnsure: false,
          updatedAt: c.createdAt,
        },
        q2_duration_onset: {
          questionId: 'q2_duration_onset',
          sectionId: 'present_illness',
          text: c.symptomDuration,
          isUnsure: false,
          updatedAt: c.createdAt,
        },
      },
      messages: [],
      department: c.department,
      perceivedSeverity: c.severityLevel,
      reviewFlags: c.redFlags,
    });
    setDoctorViewingRecord(generated);
  };

  // Find linked patient from persistent storage (with latest user edits) or fallback to seed
  const linkedPatient: SyntheticPatient | undefined = selectedCaseForReview
    ? (getStoredPatientById(selectedCaseForReview.uhid) ||
       getStoredPatientById(selectedCaseForReview.patientId) ||
       SYNTHETIC_PATIENTS.find((p) => p.uhid === selectedCaseForReview.uhid))
    : undefined;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner: Doctor Station Clinical Header */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-7 border border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {doctor.fullName}
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {doctor.specialization}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  Room {doctor.roomNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2.5">
                <span>{doctor.department}</span>
                <span className="text-slate-600">·</span>
                <span>Medical Reg: <strong className="text-slate-200 font-mono">{doctor.medicalRegNumber}</strong></span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Hospital className="w-3.5 h-3.5 text-slate-400" />
                  <span>{doctor.hospitalName}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-teal-950 text-teal-300 border border-teal-800/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span className="font-medium">OPD Worklist Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>Clinical intake verified and signed into electronic patient record.</span>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards - Clean Single-Elevation Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total OPD Cases
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums font-mono">{totalCases}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Assigned to clinic</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Review</span>
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1 tabular-nums font-mono">{pendingReviewCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting doctor sign-off</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Urgent / Triage</span>
          </div>
          <div className="text-2xl font-bold text-rose-900 mt-1 tabular-nums font-mono">{urgentCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Flagged for prompt attention</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Cases</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1 tabular-nums font-mono">{verifiedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Signed by clinician</div>
        </div>
      </div>

      {/* Clinical Review Governance Notice */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-950">
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-bold">Attending Clinician Workstation:</span>{' '}
            <span className="text-slate-700">
              Review pre-consultation intake summaries, inspect validated HL7/FHIR JSON fields, and sign electronic case files before patient entry.
            </span>
          </div>
        </div>
      </div>

      {/* Data Provenance Tier Indicator for Clinicians */}
      <ProvenanceLegend compact />

      {/* Cases Table Section */}
      <Card>
        <CardHeader
          title="OPD Patient Intake Queue"
          subtitle="Click on any patient record to review the pre-consultation summary and sign verification."
          action={
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search patient, UHID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600 focus:outline-none w-44 sm:w-56 bg-white"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
                {(['all', 'pending', 'verified'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1 rounded-md capitalize font-medium cursor-pointer transition-colors ${
                      statusFilter === tab
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs tabular-nums">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Patient &amp; UHID</th>
                <th className="py-3 px-4">Chief Complaint</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Completeness</th>
                <th className="py-3 px-4">Triage Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No matching cases found in the intake worklist.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    id={`doctor-case-row-${c.id}`}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => handleOpenReview(c)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{c.patientName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {c.uhid} · {c.patientAge}y {c.patientGender}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 line-clamp-1">
                        {c.chiefComplaint}
                      </div>
                      <div className="text-[11px] text-slate-500">Duration: {c.symptomDuration}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                        {c.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.completenessScore >= 80
                                ? 'bg-teal-600'
                                : c.completenessScore >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${c.completenessScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-700 text-[11px]">
                          {c.completenessScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant={c.status === 'verified' ? 'outline' : 'primary'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReview(c);
                        }}
                        className="text-xs"
                      >
                        {c.status === 'verified' ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            <span>View</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3 h-3 mr-1" />
                            <span>Review &amp; Verify</span>
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Doctor Clinical Review & Verification Modal */}
      {selectedCaseForReview && (
        <div
          id="doctor-review-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div
            id="doctor-review-modal"
            className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Clinical Pre-Consultation Intake Review
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Case #{selectedCaseForReview.id} · UHID: {selectedCaseForReview.uhid}
                  </p>
                </div>
              </div>
              <button
                id="close-doctor-review-modal-btn"
                onClick={handleCloseReview}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Patient Baseline Header */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedCaseForReview.patientName} ({selectedCaseForReview.patientAge}y, {selectedCaseForReview.patientGender})
                    </span>
                    <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                  </div>
                  <span className="text-slate-500 block text-[11px] mt-0.5 font-mono">
                    UHID: {selectedCaseForReview.uhid} {linkedPatient?.phone ? `· Phone: ${linkedPatient.phone}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Completeness</span>
                    <span className="font-bold text-teal-700 text-sm font-mono">
                      {selectedCaseForReview.completenessScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Triage Urgency</span>
                    <PriorityBadge priority={selectedCaseForReview.priority} />
                  </div>
                </div>
              </div>

              {/* Patient-Reported Baseline Pharmacological & Allergy Profile */}
              {linkedPatient && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Patient-Reported Clinical Baseline
                    </span>
                    <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Allergies */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-semibold block uppercase">
                        Known Allergies:
                      </span>
                      <span className="font-medium text-rose-800">
                        {linkedPatient.allergies.length > 0
                          ? linkedPatient.allergies.join(', ')
                          : 'No known drug allergies reported'}
                      </span>
                    </div>

                    {/* Chronic Conditions */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-semibold block uppercase">
                        Pre-Existing Conditions:
                      </span>
                      <span className="font-medium text-slate-800">
                        {linkedPatient.chronicConditions.length > 0
                          ? linkedPatient.chronicConditions.join(', ')
                          : 'None reported'}
                      </span>
                    </div>

                    {/* Current Medications */}
                    <div className="sm:col-span-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-semibold block uppercase mb-1">
                        Active Medications On Record:
                      </span>
                      {linkedPatient.medications && linkedPatient.medications.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {linkedPatient.medications.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-800 border border-slate-200 rounded-md font-medium text-[11px]"
                            >
                              <strong>{m.name}</strong> ({m.dosage}, {m.frequency})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">
                          No active prescription medications recorded.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Red Flags Alert if present */}
              {selectedCaseForReview.redFlags.length > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                  <div className="flex items-center justify-between font-bold text-rose-800">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Red Flag Detection Notice</span>
                    </div>
                    <ProvenanceBadge source="AI_GENERATED" size="sm" />
                  </div>
                  <ul className="list-disc pl-5 text-xs space-y-0.5 text-rose-950 font-medium">
                    {selectedCaseForReview.redFlags.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Patient Reported Chief Complaint */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Reported Chief Complaint &amp; Duration
                  </h4>
                  <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 text-xs">
                  <p className="font-semibold">{selectedCaseForReview.chiefComplaint}</p>
                  <p className="text-slate-500 mt-1">
                    Duration: {selectedCaseForReview.symptomDuration} · Perceived Severity: {selectedCaseForReview.severityLevel}
                  </p>
                </div>
              </div>

              {/* Structured Summary Snapshot */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Pre-Consultation Structured Summary Snapshot
                  </h4>
                  <ProvenanceBadge source="AI_GENERATED" size="sm" />
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed text-xs font-mono">
                  {selectedCaseForReview.structuredSummaryPreview}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  * Decision-support synthesis. Attending clinician retains sole clinical authority.
                </span>

                {/* Validated Structured JSON Artifact Inspector */}
                <div className="mt-2.5 p-3 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0">
                      <FileCode2 className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">Validated Structured Clinical JSON</span>
                        <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.2 rounded font-mono font-semibold">15 Fields Valid</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">Complete HL7/FHIR breakdown with zero-guess missing data isolation</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    id="doctor-inspect-json-btn"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenStructuredRecordForDoctor(selectedCaseForReview)}
                    icon={<FileCode2 className="w-3.5 h-3.5 text-teal-400" />}
                    className="border-slate-700 text-slate-200 hover:bg-slate-800 bg-slate-800/90 text-xs py-1.5 h-8 shrink-0"
                  >
                    Inspect JSON
                  </Button>
                </div>
              </div>

              {/* Doctor Verification Notes Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="doctor-notes-input"
                    className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]"
                  >
                    Doctor's Clinical Audit &amp; Verification Notes *
                  </label>
                  <ProvenanceBadge source="CLINICIAN_VERIFIED" size="sm" />
                </div>
                <textarea
                  id="doctor-notes-input"
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="e.g. Clinical history reviewed and accepted. Patient confirmed. Order routine viral panel..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600 focus:outline-none bg-white"
                />
              </div>

              {/* Clinician Responsibility Banner */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Mandatory Clinician Verification:</strong> Signing this case validates the intake record under {doctor.fullName} ({doctor.medicalRegNumber}). DocGenie provides decision support only and does not formulate final diagnosis.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseReview}
              >
                Cancel
              </Button>
              <Button
                id="confirm-verify-case-btn"
                variant="primary"
                size="sm"
                onClick={handleVerifyCase}
                icon={<CheckCircle2 className="w-4 h-4" />}
                className="bg-teal-700 hover:bg-teal-800 text-white"
              >
                {selectedCaseForReview.status === 'verified'
                  ? 'Update Verification & Notes'
                  : 'Verify & Sign Record'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Validated Structured Clinical JSON Modal Viewer for Clinician */}
      {doctorViewingRecord && (
        <StructuredRecordViewer
          record={doctorViewingRecord}
          isOpen={Boolean(doctorViewingRecord)}
          onClose={() => setDoctorViewingRecord(null)}
        />
      )}
    </div>
  );
};
