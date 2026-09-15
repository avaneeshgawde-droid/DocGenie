import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  HelpCircle,
  Edit3,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  FileCheck2,
  Clock,
  ChevronRight,
  Building2,
  Activity,
  AlertCircle
} from 'lucide-react';
import {
  SyntheticPatient,
  ClinicalCase,
  IntakeAnswer,
  HistorySectionId,
  IntakeQuestion,
  IntakeConversationDraft
} from '../../types';
import { INTAKE_QUESTIONS, HISTORY_SECTIONS } from '../../data/intakeQuestions';
import { getIntakeDraft, getIntakeDraftAsync, saveIntakeDraft, clearIntakeDraft } from '../../lib/intakeStorage';
import { DEPARTMENTS } from '../../data/mockData';
import { EmergencyDisclaimerBanner } from './EmergencyDisclaimerBanner';
import { IntakeSectionProgress } from './IntakeSectionProgress';
import { Button } from '../common/Button';
import { Card, CardHeader, CardContent } from '../common/Card';

interface ConversationScreenProps {
  patient: SyntheticPatient;
  onCreateCase: (newCase: ClinicalCase) => void;
  onCancel: () => void;
  onNavigateToDoctorDashboard: () => void;
}

export const ConversationScreen: React.FC<ConversationScreenProps> = ({
  patient,
  onCreateCase,
  onCancel,
  onNavigateToDoctorDashboard,
}) => {
  // 1. Initial State loaded synchronously from persistent storage (instant hydration, zero wipeout on mount)
  const initialDraft = getIntakeDraft(patient.id);

  const [answers, setAnswers] = useState<Record<string, IntakeAnswer>>(() => {
    return initialDraft?.answers || {};
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    return typeof initialDraft?.currentQuestionIndex === 'number'
      ? Math.min(initialDraft.currentQuestionIndex, INTAKE_QUESTIONS.length - 1)
      : 0;
  });
  const [inputText, setInputText] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>(() => {
    return initialDraft?.selectedDepartment || DEPARTMENTS[0];
  });
  const [perceivedSeverity, setPerceivedSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>(() => {
    return initialDraft?.perceivedSeverity || 'Moderate';
  });
  const [isReviewMode, setIsReviewMode] = useState<boolean>(() => {
    return Boolean(initialDraft?.isReviewMode);
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(() => {
    return Boolean(initialDraft?.isSubmitted);
  });
  const [createdCaseId, setCreatedCaseId] = useState<string>(() => {
    return initialDraft?.createdCaseId || '';
  });
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    return initialDraft?.lastSavedAt || null;
  });

  // In-line editing state for previous answers
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Auto-scroll anchor
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 2. Dual-layer: Check Supabase case_intake on mount for cloud drafts
  useEffect(() => {
    getIntakeDraftAsync(patient.id).then((cloudDraft) => {
      if (cloudDraft && cloudDraft.answers && Object.keys(cloudDraft.answers).length > 0) {
        setAnswers((prev) => {
          // If local answers already has more or equal keys, keep local to avoid overwriting recent changes
          if (Object.keys(prev).length >= Object.keys(cloudDraft.answers).length) {
            return prev;
          }
          return { ...cloudDraft.answers, ...prev };
        });
        if (cloudDraft.selectedDepartment) setSelectedDepartment(cloudDraft.selectedDepartment);
        if (cloudDraft.perceivedSeverity) setPerceivedSeverity(cloudDraft.perceivedSeverity);
        if (cloudDraft.lastSavedAt) setLastSavedTime(cloudDraft.lastSavedAt);
        if (typeof cloudDraft.currentQuestionIndex === 'number') {
          setCurrentQuestionIndex((prev) => Math.max(prev, cloudDraft.currentQuestionIndex));
        }
        if (cloudDraft.isReviewMode) setIsReviewMode(true);
        if (cloudDraft.isSubmitted && cloudDraft.createdCaseId) {
          setIsSubmitted(true);
          setCreatedCaseId(cloudDraft.createdCaseId);
        }
      }
    });
  }, [patient.id]);

  // 3. Persist draft whenever answers, currentQuestionIndex, or review mode changes
  useEffect(() => {
    if (isSubmitted) return;

    const draftData: IntakeConversationDraft = {
      patientId: patient.id,
      answers,
      currentQuestionIndex,
      selectedDepartment,
      perceivedSeverity,
      isReviewMode,
      isSubmitted,
      createdCaseId,
      lastSavedAt: new Date().toISOString(),
    };

    saveIntakeDraft(draftData);
    setLastSavedTime(draftData.lastSavedAt);
  }, [answers, currentQuestionIndex, selectedDepartment, perceivedSeverity, isReviewMode, isSubmitted, createdCaseId, patient.id]);

  // Scroll to bottom when question index or answer count changes
  useEffect(() => {
    if (!isReviewMode && !isSubmitted) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentQuestionIndex, answers, isReviewMode, isSubmitted]);

  // Current active question
  const currentQuestion: IntakeQuestion | undefined = INTAKE_QUESTIONS[currentQuestionIndex];
  const isAllAnswered = INTAKE_QUESTIONS.every((q) => Boolean(answers[q.id]));

  // Submit answer for active question
  const handleAnswerSubmit = (textToSubmit?: string, isUnsure = false) => {
    if (!currentQuestion) return;

    const finalAnswerText = (textToSubmit !== undefined ? textToSubmit : inputText).trim();

    // If not "I'm not sure" and empty for required question, prevent submit
    if (!isUnsure && !finalAnswerText && currentQuestion.isRequired) {
      return;
    }

    const recordedText = isUnsure
      ? finalAnswerText || "I'm not sure / Patient marked as unsure"
      : finalAnswerText || 'None reported / Not applicable';

    const newAnswer: IntakeAnswer = {
      questionId: currentQuestion.id,
      sectionId: currentQuestion.sectionId,
      text: recordedText,
      isUnsure,
      updatedAt: new Date().toISOString(),
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: newAnswer,
    }));

    setInputText('');

    // If this is the last question, advance to review mode
    if (currentQuestionIndex >= INTAKE_QUESTIONS.length - 1) {
      setIsReviewMode(true);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // Handle "I'm not sure"
  const handleNotSure = () => {
    handleAnswerSubmit(undefined, true);
  };

  // Handle suggested chip click
  const handleChipClick = (chip: string) => {
    setInputText(chip);
    // Focus textarea
    inputRef.current?.focus();
  };

  // Begin editing a previous answer
  const handleStartEdit = (questionId: string) => {
    const existing = answers[questionId];
    setEditingQuestionId(questionId);
    setEditingText(existing ? existing.text : '');
  };

  // Save the edited previous answer without altering other state
  const handleSaveEdit = (questionId: string, isUnsure = false) => {
    const targetQ = INTAKE_QUESTIONS.find((q) => q.id === questionId);
    if (!targetQ) return;

    const newText = isUnsure
      ? "I'm not sure / Patient marked as unsure"
      : editingText.trim() || 'None reported / Not applicable';

    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        sectionId: targetQ.sectionId,
        text: newText,
        isUnsure,
        updatedAt: new Date().toISOString(),
      },
    }));

    setEditingQuestionId(null);
    setEditingText('');
  };

  // Navigate to a specific section from the top progress bar
  const handleJumpToSection = (sectionId: HistorySectionId) => {
    const firstQIndex = INTAKE_QUESTIONS.findIndex((q) => q.sectionId === sectionId);
    if (firstQIndex >= 0) {
      setCurrentQuestionIndex(firstQIndex);
      setIsReviewMode(false);
    }
  };

  // Reset / Clear Draft
  const handleResetDraft = () => {
    if (window.confirm('Are you sure you want to reset this intake conversation? This will clear all draft responses.')) {
      clearIntakeDraft(patient.id);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setInputText('');
      setIsReviewMode(false);
      setIsSubmitted(false);
      setCreatedCaseId('');
    }
  };

  // Final submission of clinical case
  const handleFinalCaseSubmit = () => {
    const newCaseId = `case-2026-${Math.floor(100 + Math.random() * 900)}`;

    const chiefComplaintAnswer = answers['q1_chief_complaint']?.text || 'Patient reported symptom intake';
    const durationAnswer = answers['q2_duration_onset']?.text || '1-3 days';

    // Build structured medical history text
    const summarySections = INTAKE_QUESTIONS.map((q) => {
      const a = answers[q.id];
      const ansText = a ? (a.isUnsure ? `[Unsure] ${a.text}` : a.text) : 'Not answered';
      return `• ${q.sectionTitle}: "${ansText}"`;
    }).join('\n');

    const structuredSummary = `Patient ${patient.fullName} (${patient.age}${patient.gender.charAt(0)}) intake completed.\n${summarySections}`;

    const newCase: ClinicalCase = {
      id: newCaseId,
      uhid: patient.uhid,
      patientId: patient.id,
      patientName: patient.fullName,
      patientAge: patient.age,
      patientGender: patient.gender === 'Female' ? 'Female' : 'Male',
      createdAt: 'Just now (Intake Portal)',
      department: selectedDepartment,
      chiefComplaint: chiefComplaintAnswer,
      symptomDuration: durationAnswer,
      severityLevel: perceivedSeverity,
      status: 'intake_completed',
      priority: perceivedSeverity === 'Severe' ? 'urgent' : 'routine',
      completenessScore: Math.round((Object.keys(answers).length / INTAKE_QUESTIONS.length) * 100),
      redFlagsCount: perceivedSeverity === 'Severe' ? 1 : 0,
      redFlags: perceivedSeverity === 'Severe' ? ['Patient rated symptoms as Severe during clinical intake'] : [],
      intakeMethod: 'Digital Intake Portal',
      structuredSummaryPreview: structuredSummary,
      doctorNotes: '',
    };

    onCreateCase(newCase);
    setCreatedCaseId(newCaseId);
    setIsSubmitted(true);

    // Save final state
    saveIntakeDraft({
      patientId: patient.id,
      answers,
      currentQuestionIndex,
      selectedDepartment,
      perceivedSeverity,
      isReviewMode: true,
      isSubmitted: true,
      createdCaseId: newCaseId,
      lastSavedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header with Title and Reset / Back Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-2xs">
                <Bot className="w-5 h-5" />
              </span>
              <span>DocGenie Clinical Pre-Consultation Intake</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Module 4 • Guided Patient History Intake (Conversational UI)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {Object.keys(answers).length > 0 && !isSubmitted && (
            <button
              type="button"
              onClick={handleResetDraft}
              className="text-xs text-slate-500 hover:text-rose-700 font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Clear current answers and restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Intake</span>
            </button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Emergency Care Disclaimer Banner */}
      <EmergencyDisclaimerBanner />

      {/* Section Progress Tracker */}
      <IntakeSectionProgress
        currentSectionId={
          isReviewMode
            ? 'family_social_history'
            : currentQuestion?.sectionId || 'chief_complaint'
        }
        answers={answers}
        onSelectSection={handleJumpToSection}
      />

      {/* Draft Persistence Status Bar */}
      {lastSavedTime && !isSubmitted && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4 px-2">
          <div className="flex items-center gap-1.5 text-teal-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Draft auto-saved to localStorage</span>
          </div>
          <span className="text-slate-400">
            Active Patient: <strong className="text-slate-700">{patient.fullName}</strong> ({patient.uhid})
          </span>
        </div>
      )}

      {isSubmitted ? (
        /* Case Submitted Success View */
        <Card className="border-teal-300 bg-gradient-to-b from-teal-50/50 to-white shadow-sm">
          <CardContent className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-teal-800 bg-teal-100/80 px-3 py-1 rounded-full">
                Pre-Consultation Intake Finalized
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                Case #{createdCaseId} Queued for Clinician Review
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
                All 6 patient history sections have been recorded and formatted for the attending physician at{' '}
                <strong className="text-slate-800">{selectedDepartment}</strong>.
              </p>
            </div>

            {/* Structured Summary Preview Box */}
            <div className="max-w-xl mx-auto p-4 bg-white rounded-xl border border-slate-200 text-left text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Intake Data Summary
                </span>
                <span className="font-mono text-teal-700 font-semibold">{createdCaseId}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Department:</span>
                  <span className="font-medium text-slate-800">{selectedDepartment}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Reported Severity:</span>
                  <span className="font-medium text-slate-800">{perceivedSeverity}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-[11px] text-slate-700 border-t border-slate-100">
                {INTAKE_QUESTIONS.map((q) => {
                  const ans = answers[q.id];
                  return (
                    <div key={q.id} className="flex items-start justify-between gap-2 py-0.5">
                      <span className="font-semibold text-slate-500 shrink-0">{q.sectionTitle}:</span>
                      <span className="text-slate-900 text-right truncate max-w-[280px]">
                        {ans?.isUnsure ? (
                          <span className="italic text-amber-700">Unsure / To be reviewed</span>
                        ) : (
                          ans?.text || '—'
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button
                id="intake-return-dashboard-btn"
                variant="primary"
                onClick={onCancel}
              >
                Return to Patient Dashboard
              </Button>
              <Button
                id="intake-view-doctor-station-btn"
                variant="outline"
                onClick={onNavigateToDoctorDashboard}
              >
                <span>View Case in Doctor OPD Station</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : isReviewMode ? (
        /* Summary & Review Mode Before Final Submission */
        <Card className="border-slate-200 shadow-sm">
          <CardHeader
            title="Review & Confirm Pre-Consultation History"
            subtitle="Verify your answers across all 6 sections before sending to the attending physician."
          />
          <CardContent className="p-6 space-y-6">
            {/* 6 Structured History Review Panels */}
            <div className="space-y-4">
              {HISTORY_SECTIONS.map((section) => {
                const sectionQuestions = INTAKE_QUESTIONS.filter(
                  (q) => q.sectionId === section.id
                );

                return (
                  <div
                    key={section.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-bold">
                          {section.stepNumber}
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          {section.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleJumpToSection(section.id)}
                        className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Section</span>
                      </button>
                    </div>

                    <div className="space-y-2 mt-2">
                      {sectionQuestions.map((q) => {
                        const ans = answers[q.id];
                        const isEditingThis = editingQuestionId === q.id;

                        return (
                          <div
                            key={q.id}
                            className="p-3 bg-white rounded-lg border border-slate-200 text-xs"
                          >
                            <div className="text-slate-500 font-medium mb-1 flex items-center justify-between">
                              <span>{q.assistantPrompt}</span>
                              {!isEditingThis && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(q.id)}
                                  className="text-[11px] text-teal-700 hover:text-teal-800 font-medium cursor-pointer ml-2 shrink-0"
                                >
                                  Edit
                                </button>
                              )}
                            </div>

                            {isEditingThis ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  rows={2}
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full p-2.5 text-xs border border-teal-500 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-teal-50/20"
                                  placeholder="Update your answer..."
                                />
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(q.id, true)}
                                    className="text-[11px] text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded border border-amber-200 cursor-pointer"
                                  >
                                    Mark as "I'm not sure"
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingQuestionId(null)}
                                      className="text-[11px] text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => handleSaveEdit(q.id, false)}
                                    >
                                      Save Update
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : ans ? (
                              ans.isUnsure ? (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-medium text-[11px]">
                                  <HelpCircle className="w-3 h-3" />
                                  <span>Marked as "I'm not sure" (Will be clarified in consultation)</span>
                                </div>
                              ) : (
                                <p className="text-slate-900 font-medium leading-relaxed">
                                  {ans.text}
                                </p>
                              )
                            ) : (
                              <p className="text-slate-400 italic">Not answered yet</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Department & Severity Verification */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Consultation Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Overall Perceived Severity
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Mild', 'Moderate', 'Severe'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPerceivedSeverity(lvl)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        perceivedSeverity === lvl
                          ? lvl === 'Severe'
                            ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-200'
                            : 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-200'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Patient Consent / Safety Agreement Checkbox */}
            <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl text-xs text-slate-700 leading-relaxed">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>
                  I confirm that the responses provided above are accurate to the best of my recall and understand that DocGenie is an intake questionnaire that does not perform autonomous diagnosis.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReviewMode(false);
                  setCurrentQuestionIndex(0);
                }}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Return to Chat Stream
              </Button>

              <Button
                id="submit-final-intake-btn"
                variant="primary"
                onClick={handleFinalCaseSubmit}
                icon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Complete Intake &amp; Queue for Doctor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Active Conversation Stream View */
        <div className="space-y-4">
          {/* Main Chat Thread Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs min-h-[460px] flex flex-col justify-between">
            {/* Conversation Messages Container */}
            <div className="space-y-6 flex-1 overflow-y-auto max-h-[520px] pr-1">
              {/* Completed Questions & Patient Answers */}
              {INTAKE_QUESTIONS.slice(0, currentQuestionIndex).map((q, idx) => {
                const answer = answers[q.id];
                const isEditingThis = editingQuestionId === q.id;

                return (
                  <div key={q.id} className="space-y-3 pt-1">
                    {/* Assistant Question Bubble */}
                    <div className="flex items-start gap-3 max-w-2xl">
                      <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-800 shadow-2xs space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[10px] text-teal-800 uppercase tracking-wider">
                            {q.sectionTitle}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] text-slate-400">Step {idx + 1} of {INTAKE_QUESTIONS.length}</span>
                        </div>
                        <p className="leading-relaxed font-medium text-slate-800">
                          {q.assistantPrompt}
                        </p>
                      </div>
                    </div>

                    {/* Patient Answer Bubble */}
                    {answer && (
                      <div className="flex items-start justify-end gap-3 max-w-2xl ml-auto">
                        <div className="bg-teal-700 text-white rounded-2xl rounded-tr-sm p-3.5 text-xs shadow-2xs space-y-1.5 max-w-lg">
                          <div className="flex items-center justify-between gap-4 text-[10px] text-teal-200/90">
                            <span>You (Patient)</span>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(q.id)}
                              className="inline-flex items-center gap-1 text-teal-100 hover:text-white underline cursor-pointer"
                              title="Edit this previous answer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </div>

                          {isEditingThis ? (
                            <div className="mt-1 space-y-2 bg-teal-800 p-2.5 rounded-lg text-slate-900">
                              <textarea
                                rows={2}
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full p-2 text-xs bg-white text-slate-900 rounded border border-teal-300 focus:outline-none"
                              />
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(q.id, true)}
                                  className="text-[10px] text-amber-200 hover:text-amber-100 underline cursor-pointer"
                                >
                                  Mark "I'm not sure"
                                </button>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingQuestionId(null)}
                                    className="text-[10px] text-teal-200 hover:text-white px-2 py-0.5 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(q.id, false)}
                                    className="text-[10px] bg-white text-teal-900 font-bold px-2.5 py-1 rounded shadow-2xs hover:bg-teal-50 cursor-pointer"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : answer.isUnsure ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-800/80 text-teal-100 text-[11px]">
                              <HelpCircle className="w-3 h-3 text-amber-300" />
                              <span className="font-semibold text-amber-200">I'm not sure</span>
                              <span className="opacity-75">— Marked for clinician follow-up</span>
                            </div>
                          ) : (
                            <p className="leading-relaxed whitespace-pre-wrap">{answer.text}</p>
                          )}
                        </div>

                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Active Current Question Bubble */}
              {currentQuestion && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 max-w-2xl">
                    <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-teal-50/60 border border-teal-200 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-800 shadow-2xs space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[10px] text-teal-800 uppercase tracking-wider">
                          {currentQuestion.sectionTitle}
                        </span>
                        <span className="text-teal-300">•</span>
                        <span className="text-[10px] text-teal-700 font-medium">
                          Question {currentQuestionIndex + 1} of {INTAKE_QUESTIONS.length}
                        </span>
                        {currentQuestion.isRequired && (
                          <span className="text-[10px] text-rose-600 font-semibold">* Required</span>
                        )}
                      </div>
                      <p className="leading-relaxed font-semibold text-slate-900 text-sm">
                        {currentQuestion.assistantPrompt}
                      </p>
                      {currentQuestion.contextHint && (
                        <p className="text-[11px] text-slate-500 italic">
                          💡 {currentQuestion.contextHint}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Suggested Answer Chips (Quick Answers) */}
                  {currentQuestion.suggestedChips && currentQuestion.suggestedChips.length > 0 && (
                    <div className="pl-11 pr-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Quick Suggestions (Tap to insert):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentQuestion.suggestedChips.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => handleChipClick(chip)}
                            className="px-2.5 py-1 rounded-full text-xs bg-slate-100 hover:bg-teal-100 hover:text-teal-900 hover:border-teal-300 border border-slate-200 text-slate-700 transition-colors cursor-pointer text-left"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            {currentQuestion && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                {/* Back / Navigation helpers */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {currentQuestionIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Previous Question</span>
                      </button>
                    )}
                  </div>

                  {/* Review Button if questions answered */}
                  {Object.keys(answers).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsReviewMode(true)}
                      className="text-xs text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Review All Answers ({Object.keys(answers).length}/{INTAKE_QUESTIONS.length})</span>
                    </button>
                  )}
                </div>

                {/* Main Input Controls Box */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      id="intake-conversation-input"
                      rows={2}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAnswerSubmit();
                        }
                      }}
                      placeholder={currentQuestion.placeholder}
                      className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none placeholder:text-slate-400 bg-white"
                    />
                  </div>

                  {/* Action Buttons: "I'm not sure" and "Submit" */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      id="intake-not-sure-btn"
                      variant="outline"
                      type="button"
                      onClick={handleNotSure}
                      className="text-amber-800 border-amber-300 hover:bg-amber-50"
                      icon={<HelpCircle className="w-4 h-4 text-amber-600" />}
                      title="Click if you don't know or are uncertain about this information"
                    >
                      I'm Not Sure
                    </Button>

                    <Button
                      id="intake-submit-answer-btn"
                      variant="primary"
                      type="button"
                      disabled={currentQuestion.isRequired && !inputText.trim()}
                      onClick={() => handleAnswerSubmit()}
                      icon={<Send className="w-4 h-4" />}
                    >
                      <span>Submit</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Press <strong>Enter</strong> to submit, <strong>Shift + Enter</strong> for a new line</span>
                  <span>Section {currentQuestionIndex + 1} of {INTAKE_QUESTIONS.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
