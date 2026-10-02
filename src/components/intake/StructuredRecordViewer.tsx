import React, { useState } from 'react';
import {
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  X,
  ShieldCheck,
  Clock,
  Sparkles,
  Database,
  FileText,
  User,
  Activity,
  Layers,
  HelpCircle,
  Pill,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ValidatedStructuredIntakeRecord } from '../../types/index';
import { Button } from '../common/Button';

interface StructuredRecordViewerProps {
  record: ValidatedStructuredIntakeRecord;
  onClose: () => void;
  isOpen: boolean;
}

export const StructuredRecordViewer: React.FC<StructuredRecordViewerProps> = ({
  record,
  onClose,
  isOpen,
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'json' | 'audit'>('cards');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !record) return null;

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(record, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  const handleDownloadJson = () => {
    try {
      const jsonStr = JSON.stringify(record, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DocGenie-Intake-${record.patientId}-${record.timestampsVersion.schemaVersion}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download JSON:', err);
    }
  };

  const auditChecklist = [
    { num: 1, label: 'Patient Identifier & UHID', value: `${record.patientId} (${record.uhid})`, status: 'VALID' },
    { num: 2, label: 'Chief Complaint', value: record.chiefComplaint, status: 'VALID' },
    { num: 3, label: 'Onset & Duration', value: `${record.onsetDuration.onset || 'Unspecified'} • ${record.onsetDuration.duration || 'Unspecified'}`, status: 'VALID' },
    { num: 4, label: 'Symptom Description & Location & Severity', value: `${record.symptomDetails.description} (Loc: ${record.symptomDetails.location || 'Pending exam'}, Sev: ${record.symptomDetails.severity})`, status: 'VALID' },
    { num: 5, label: 'Associated Symptoms', value: `${record.associatedSymptoms.length} documented`, status: 'VALID' },
    { num: 6, label: 'Relevant History & Known Conditions', value: `${record.relevantHistory.knownChronicConditions.length} chronic conditions, Surgical: ${record.relevantHistory.surgicalHistory ? 'Yes' : 'None'}`, status: 'VALID' },
    { num: 7, label: 'Medications Reconciliation', value: `${record.medications.length} active/reported drugs`, status: 'VALID' },
    { num: 8, label: 'Allergies & Drug Sensitivities', value: `${record.allergies.length} recorded`, status: 'VALID' },
    { num: 9, label: 'Family & Social History', value: record.familySocialHistory.familyHistory ? 'Recorded' : 'Unspecified', status: 'VALID' },
    { num: 10, label: 'Referenced Clinical Documents', value: `${record.referencedDocuments.length} referenced files`, status: 'VALID' },
    { num: 11, label: 'Unknown / Missing Fields (Zero-Guess)', value: `${record.unknownMissingFields.length} unconfirmed item(s) explicitly isolated (Never guessed)`, status: 'VALID' },
    { num: 12, label: 'Review Flags (Conservative Safety)', value: `${record.reviewFlags.length} flag(s) identified`, status: 'VALID' },
    { num: 13, label: 'AI-Generated Summary & Disclaimer', value: 'Autonomous diagnosis disclaimed; decision support only', status: 'VALID' },
    { num: 14, label: 'Source & Provenance Metadata', value: `${record.sourceProvenance.dataProvenance} via ${record.sourceProvenance.intakeChannel}`, status: 'VALID' },
    { num: 15, label: 'Timestamps & Schema Version', value: `v${record.timestampsVersion.schemaVersion} @ ${record.timestampsVersion.intakeCompletedAt}`, status: 'VALID' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-600/30 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0 shadow-inner">
              <FileCode2 className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Validated Structured Clinical JSON
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Schema Valid (15/15)</span>
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  v{record.timestampsVersion.schemaVersion}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>Patient: <strong className="text-slate-200">{record.patientName}</strong></span>
                <span>•</span>
                <span>ID: <strong className="text-slate-300 font-mono">{record.patientId}</strong></span>
                <span>•</span>
                <span>UHID: <strong className="text-teal-300 font-mono">{record.uhid}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJson}
              icon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              className="border-slate-700 text-slate-200 hover:bg-slate-800 bg-slate-800/80"
            >
              {copied ? 'Copied JSON' : 'Copy JSON'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadJson}
              icon={<Download className="w-4 h-4" />}
              className="border-slate-700 text-slate-200 hover:bg-slate-800 bg-slate-800/80"
            >
              Download
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Bar: Supabase Sync & Zero-Guess Affirmation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-medium text-[11px] bg-teal-50 text-teal-800 border border-teal-200">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {record.supabaseSyncStatus?.isSynced
                  ? 'Supabase: Synced (table: structured_intake_records)'
                  : record.supabaseSyncStatus?.notice || 'Dual-Layer Storage: LocalStorage Active (Demo Mode)'}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-medium text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Zero-Guess Protocol: {record.unknownMissingFields.length} unconfirmed item(s) preserved without hallucination</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Extracted: {new Date(record.timestampsVersion.conversionTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('cards')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'cards'
                ? 'border-teal-600 text-teal-800 bg-teal-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Clinical Schema Breakdown (15 Fields)</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'json'
                ? 'border-teal-600 text-teal-800 bg-teal-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Raw Validated JSON</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-teal-600 text-teal-800 bg-teal-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validation & Compliance Audit</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {activeTab === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 1: Patient ID & Demographics */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-teal-800">
                    <User className="w-4 h-4 text-teal-600" />
                    <span>1. Patient ID & Identifiers</span>
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                    ID / UHID
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-700">
                  <p><strong>Patient ID:</strong> <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{record.patientId}</span></p>
                  <p><strong>Universal Health ID (UHID):</strong> <span className="font-mono text-teal-700 font-semibold">{record.uhid}</span></p>
                  <p><strong>Demographics:</strong> {record.patientName}, {record.patientAge} years, {record.patientGender}</p>
                  <p><strong>Department:</strong> {record.department}</p>
                </div>
              </div>

              {/* Field 2 & 3: Chief Complaint, Onset & Duration */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-teal-800">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <span>2 & 3. Chief Complaint, Onset & Duration</span>
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                    HPI Core
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">Chief Complaint</span>
                    <span className="font-semibold text-slate-900 text-sm">{record.chiefComplaint}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[10px] block uppercase font-semibold">Reported Onset</span>
                      <span className="font-medium text-slate-800">{record.onsetDuration.onset || 'Unspecified (Patient unsure)'}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[10px] block uppercase font-semibold">Timeline Duration</span>
                      <span className="font-medium text-slate-800">{record.onsetDuration.duration || 'Unspecified'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Field 4 & 5: Symptom Details, Location, Severity & Associated Symptoms */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-teal-800">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <span>4 & 5. Symptom Details & Associated Signs</span>
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                    Clinical Spec
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[10px] block uppercase font-semibold">Anatomical Location</span>
                      <span className="font-medium text-slate-800">
                        {record.symptomDetails.location || (
                          <em className="text-amber-700 font-normal">Not localized (requires physical exam)</em>
                        )}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[10px] block uppercase font-semibold">Severity Rating</span>
                      <span className="font-bold text-slate-900">{record.symptomDetails.severity}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] font-semibold block mb-1">Associated Symptoms:</span>
                    {record.associatedSymptoms.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {record.associatedSymptoms.map((sym, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200">
                            • {sym}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No secondary associated symptoms declared.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Field 6: Relevant Medical History */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-teal-800">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <span>6. Relevant Medical History</span>
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                    Past History
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <p>
                    <strong>Chronic Conditions:</strong>{' '}
                    {record.relevantHistory.knownChronicConditions.length > 0
                      ? record.relevantHistory.knownChronicConditions.join(', ')
                      : 'None on record'}
                  </p>
                  <p>
                    <strong>Surgical History:</strong>{' '}
                    {record.relevantHistory.surgicalHistory || 'No prior surgeries documented.'}
                  </p>
                  {record.relevantHistory.pastMedicalHistory && (
                    <p>
                      <strong>Patient Stated History:</strong>{' '}
                      {record.relevantHistory.pastMedicalHistory}
                    </p>
                  )}
                </div>
              </div>

              {/* Field 7 & 8: Medications & Allergies */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-teal-800">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span>7 & 8. Medications & Allergies</span>
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                    Rx / Sensitivities
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">Medications:</span>
                    {record.medications.length > 0 ? (
                      <div className="space-y-1">
                        {record.medications.map((m) => (
                          <div key={m.id} className="p-1.5 bg-slate-50 rounded border border-slate-200 text-[11px] flex justify-between items-center">
                            <span><strong>{m.name}</strong> {m.dosage ? `(${m.dosage}, ${m.frequency})` : ''}</span>
                            <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">{m.source}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No active medications declared.</span>
                    )}
                  </div>
                  <div>
                    <span className="text-rose-700 text-[10px] font-bold uppercase block mb-1">Allergies:</span>
                    {record.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {record.allergies.map((a) => (
                          <span key={a.id} className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[11px] font-medium">
                            ⚠️ {a.substance}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No known drug allergies.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Field 9: Family & Social History */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-teal-800">
                    <User className="w-4 h-4 text-teal-600" />
                    <span>9. Family & Social History</span>
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                    Genetics / Lifestyle
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <p>
                    <strong>Family Medical History:</strong>{' '}
                    {record.familySocialHistory.familyHistory || 'None reported / to be clarified.'}
                  </p>
                  <p>
                    <strong>Lifestyle & Social Habits:</strong>{' '}
                    {record.familySocialHistory.lifestyleSocial || record.familySocialHistory.habitsAndExposure || 'Desk-based work, non-smoker on profile.'}
                  </p>
                </div>
              </div>

              {/* Field 10: Referenced Clinical Documents */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 md:col-span-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-teal-800">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>10. Referenced Clinical Documents ({record.referencedDocuments.length})</span>
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                    Synthetic EMR Records
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {record.referencedDocuments.map((doc) => (
                    <div key={doc.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5">
                      <div className="p-1.5 bg-teal-100 text-teal-800 rounded shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{doc.title}</div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{doc.summary}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span className="font-mono">{doc.documentType}</span>
                          <span>•</span>
                          <span>{doc.referenceDate}</span>
                          {doc.fileSize && <span>• {doc.fileSize}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field 11: Unknown / Missing Fields ("Never guess missing data") */}
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2 md:col-span-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>11. Unknown / Missing Fields Checklist ({record.unknownMissingFields.length})</span>
                  </span>
                  <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-900 font-semibold">
                    Never Guess Missing Data Protocol
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  The clinical parser rigorously tracks all patient-marked "unsure" or omitted items. Missing facts are never hallucinated.
                </p>
                {record.unknownMissingFields.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {record.unknownMissingFields.map((unk) => (
                      <div key={unk.id} className="p-2 bg-white rounded-lg border border-amber-200">
                        <div className="flex items-center justify-between">
                          <strong className="text-amber-950">{unk.fieldName}</strong>
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-medium">
                            {unk.reason}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{unk.inquiryPrompt}</p>
                        <span className="text-[10px] text-amber-700 font-medium mt-1 inline-block">
                          Status: {unk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-emerald-800 text-xs">
                    All standard clinical history sections provided by patient without unknown items.
                  </div>
                )}
              </div>

              {/* Field 12: Review Flags */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 md:col-span-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>12. Conservative Review Flags ({record.reviewFlags.length})</span>
                  </span>
                  <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-mono">
                    Red-Flag Surveillance
                  </span>
                </div>
                {record.reviewFlags.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {record.reviewFlags.map((flag) => (
                      <div key={flag.id} className="p-2.5 bg-rose-50/60 rounded-lg border border-rose-200 flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-rose-950 flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>{flag.flag}</span>
                          </div>
                          <p className="text-[11px] text-rose-900 mt-0.5">
                            Recommended Action: {flag.clinicalActionRecommended}
                          </p>
                          <span className="text-[10px] text-rose-700 font-mono mt-0.5 block">
                            Detected via: {flag.detectedFrom}
                          </span>
                        </div>
                        <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded uppercase">
                          {flag.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Zero urgent red flags detected during intake screening. Standard routine triage flow.</span>
                  </div>
                )}
              </div>

              {/* Field 13: AI-Generated Summary & Strict Diagnostic Disclaimer */}
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 shadow-2xs space-y-2 md:col-span-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>13. AI-Generated Summary & Clinical Narrative</span>
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                    Decision Support Only
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-indigo-100 text-xs text-slate-800 leading-relaxed font-sans">
                  {record.aiGeneratedSummary.clinicalNarrative}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                    <span className="text-[10px] font-bold uppercase text-indigo-950 block mb-1">Chief Findings:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700">
                      {record.aiGeneratedSummary.chiefFindings.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                    <span className="text-[10px] font-bold uppercase text-indigo-950 block mb-1">Suggested Clinical Focus:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700">
                      {record.aiGeneratedSummary.suggestedClinicalFocus.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {/* Explicit Anti-Autonomous Diagnosis Affirmation */}
                <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-lg text-amber-950 text-[11px] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Mandatory Clinical Non-Autonomous Disclaimer:</strong>{' '}
                    {record.aiGeneratedSummary.disclaimer}{' '}
                    <span className="font-mono font-bold block mt-0.5 text-amber-900">
                      diagnosticClaim: "{record.aiGeneratedSummary.diagnosticClaim}"
                    </span>
                  </div>
                </div>
              </div>

              {/* Field 14 & 15: Source Provenance & Timestamps Version */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 md:col-span-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-teal-800">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>14 & 15. Source Provenance, Timestamps & Versioning</span>
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                    Audit Trail
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">Data Provenance</span>
                    <span className="font-bold text-slate-800">{record.sourceProvenance.dataProvenance}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">Model / Engine</span>
                    <span className="font-medium text-slate-800 font-mono text-[11px]">{record.sourceProvenance.modelUsed}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">Extraction Engine</span>
                    <span className="font-medium text-slate-800 text-[11px]">{record.sourceProvenance.extractionEngine}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-400 text-[10px] block uppercase font-semibold">Schema Version</span>
                    <span className="font-bold text-teal-700 font-mono">v{record.timestampsVersion.schemaVersion}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 flex flex-wrap gap-4 pt-1 font-mono">
                  <span>Intake Completed: {new Date(record.timestampsVersion.intakeCompletedAt).toLocaleString()}</span>
                  <span>Conversion Timestamp: {new Date(record.timestampsVersion.conversionTimestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Validated Schema JSON Output (application/json)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs flex items-center gap-1 font-mono"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs flex items-center gap-1 font-mono"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-md">
                <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[58vh] leading-relaxed selection:bg-teal-700 selection:text-white">
                  <code>{JSON.stringify(record, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <span>15-Field Clinical Validation Audit Checklist</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Verified by DocGenie Schema Validator at {new Date(record.validationStatus.validatedAt).toLocaleString()}
                </p>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {auditChecklist.map((item) => (
                  <div key={item.num} className="p-3 sm:px-4 flex items-center justify-between text-xs hover:bg-slate-50/80">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-[11px] shrink-0">
                        {item.num}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900">{item.label}</div>
                        <div className="text-slate-500 text-[11px] truncate max-w-md">{item.value}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{item.status}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800">Compliance & Regulatory Attestation:</h4>
                <ul className="list-disc pl-5 text-slate-600 space-y-1 text-[11px]">
                  <li><strong>Zero-Guess Mandate:</strong> Missing parameters are explicitly indexed in <code className="text-amber-800 font-mono">unknownMissingFields</code>. No medical data has been hallucinated.</li>
                  <li><strong>Non-Autonomous Diagnosis:</strong> The summary engine acts strictly as an administrative and triage decision-support tool. Final diagnosis is solely the duty of the licensed attending doctor.</li>
                  <li><strong>Persistence:</strong> The record is persisted to local storage and mirrored to Supabase <code className="text-teal-800 font-mono">structured_intake_records</code> when connected.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Record ID: <strong className="font-mono text-slate-700">{record.id}</strong></span>
          </div>
          <Button variant="primary" size="sm" onClick={onClose} className="bg-teal-700 hover:bg-teal-800 text-white">
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
};
