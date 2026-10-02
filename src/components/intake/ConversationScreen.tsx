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
  AlertCircle,
  PlusCircle,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  FileCode2,
} from 'lucide-react';
import {
  SyntheticPatient,
  ClinicalCase,
  IntakeAnswer,
  HistorySectionId,
  IntakeQuestion,
  IntakeConversationDraft,
  IntakeChatMessage,
  ValidatedStructuredIntakeRecord,
} from '../../types/index';
import { INTAKE_QUESTIONS, HISTORY_SECTIONS } from '../../data/intakeQuestions';
import { getIntakeDraft, getIntakeDraftAsync, saveIntakeDraft, clearIntakeDraft } from '../../lib/intakeStorage';
import { submitIntakeTurn, IntakeTurnResponse } from '../../lib/geminiIntakeClient';
import {
  convertConversationToStructuredRecord,
  convertCompletedConversation,
  saveValidatedStructuredRecord,
  getStoredStructuredRecord,
} from '../../lib/structuredIntakeConverter';
import { StructuredRecordViewer } from './StructuredRecordViewer';
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

const DEFAULT_INITIAL_MESSAGE: IntakeChatMessage = {
  id: 'msg-init-1',
  role: 'assistant',
  text: 'Hello! I am DocGenie\'s clinical intake assistant at City Health Medical Center. To help the attending physician prepare for your consultation, what is the primary symptom or health concern bringing you in today?',
  timestamp: new Date().toISOString(),
  sectionId: 'chief_complaint',
  sectionTitle: 'Chief Complaint',
  suggestedChips: [
    'Throat irritation & dry cough',
    'Persistent fever with body chills',
    'Abdominal pain & stomach discomfort',
    'Severe headache & light sensitivity',
    'Lower back stiffness & joint pain',
  ],
  contextHint: 'Describe your main symptom in your own words.',
  source: 'gemini',
};

const SECTION_TO_QUESTION_MAP: Record<HistorySectionId, string> = {
  chief_complaint: 'q1_chief_complaint',
  present_illness: 'q2_duration_onset',
  associated_symptoms: 'q4_associated_symptoms',
  medical_history: 'q5_medical_history',
  medications_allergies: 'q6_medications_allergies',
  family_social_history: 'q7_family_social',
};

export const ConversationScreen: React.FC<ConversationScreenProps> = ({
  patient,
  onCreateCase,
  onCancel,
  onNavigateToDoctorDashboard,
}) => {
  // 1. Initial State loaded synchronously from persistent storage
  const initialDraft = getIntakeDraft(patient.id);

  const [answers, setAnswers] = useState<Record<string, IntakeAnswer>>(() => {
    return initialDraft?.answers || {};
  });

  const [currentSectionId, setCurrentSectionId] = useState<HistorySectionId>(() => {
    const qIndex = initialDraft?.currentQuestionIndex ?? 0;
    const mapped = HISTORY_SECTIONS[qIndex]?.id || 'chief_complaint';
    return mapped;
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    return typeof initialDraft?.currentQuestionIndex === 'number'
      ? Math.min(initialDraft.currentQuestionIndex, HISTORY_SECTIONS.length - 1)
      : 0;
  });

  const [messages, setMessages] = useState<IntakeChatMessage[]>(() => {
    if (initialDraft?.conversationMessages && initialDraft.conversationMessages.length > 0) {
      return initialDraft.conversationMessages;
    }
    return [DEFAULT_INITIAL_MESSAGE];
  });

  const [reviewFlags, setReviewFlags] = useState<string[]>(() => {
    return initialDraft?.reviewFlags || [];
  });

  const [activeSuggestedChips, setActiveSuggestedChips] = useState<string[]>(() => {
    if (initialDraft?.conversationMessages && initialDraft.conversationMessages.length > 0) {
      const lastAssistant = [...initialDraft.conversationMessages].reverse().find((m) => m.role === 'assistant');
      if (lastAssistant?.suggestedChips) return lastAssistant.suggestedChips;
    }
    return DEFAULT_INITIAL_MESSAGE.suggestedChips || [];
  });

  const [activeContextHint, setActiveContextHint] = useState<string>(() => {
    if (initialDraft?.conversationMessages && initialDraft.conversationMessages.length > 0) {
      const lastAssistant = [...initialDraft.conversationMessages].reverse().find((m) => m.role === 'assistant');
      if (lastAssistant?.contextHint) return lastAssistant.contextHint;
    }
    return DEFAULT_INITIAL_MESSAGE.contextHint || 'Describe your symptom objectively.';
  });

  const [inputText, setInputText] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
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

  // Validated Structured Clinical JSON State (Module 2)
  const [showStructuredViewer, setShowStructuredViewer] = useState(false);
  const [structuredRecord, setStructuredRecord] = useState<ValidatedStructuredIntakeRecord | null>(() => {
    return initialDraft?.structuredRecord || getStoredStructuredRecord(patient.id) || null;
  });
  const [isConvertingStructured, setIsConvertingStructured] = useState(false);

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
          if (Object.keys(prev).length >= Object.keys(cloudDraft.answers).length) {
            return prev;
          }
          return { ...cloudDraft.answers, ...prev };
        });
        if (cloudDraft.conversationMessages && cloudDraft.conversationMessages.length > 0) {
          setMessages(cloudDraft.conversationMessages);
          const lastAss = [...cloudDraft.conversationMessages].reverse().find((m) => m.role === 'assistant');
          if (lastAss?.suggestedChips) setActiveSuggestedChips(lastAss.suggestedChips);
          if (lastAss?.contextHint) setActiveContextHint(lastAss.contextHint);
        }
        if (cloudDraft.reviewFlags && cloudDraft.reviewFlags.length > 0) {
          setReviewFlags((prev) => Array.from(new Set([...prev, ...(cloudDraft.reviewFlags || [])])));
        }
        if (cloudDraft.selectedDepartment) setSelectedDepartment(cloudDraft.selectedDepartment);
        if (cloudDraft.perceivedSeverity) setPerceivedSeverity(cloudDraft.perceivedSeverity);
        if (cloudDraft.lastSavedAt) setLastSavedTime(cloudDraft.lastSavedAt);
        if (typeof cloudDraft.currentQuestionIndex === 'number') {
          setCurrentQuestionIndex((prev) => Math.max(prev, cloudDraft.currentQuestionIndex));
          const sec = HISTORY_SECTIONS[cloudDraft.currentQuestionIndex]?.id || 'chief_complaint';
          setCurrentSectionId(sec);
        }
        if (cloudDraft.isReviewMode) setIsReviewMode(true);
        if (cloudDraft.isSubmitted && cloudDraft.createdCaseId) {
          setIsSubmitted(true);
          setCreatedCaseId(cloudDraft.createdCaseId);
        }
      }
    });
  }, [patient.id]);

  // 3. Persist draft whenever answers, messages, or review mode changes
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
      reviewFlags,
      conversationMessages: messages,
    };

    saveIntakeDraft(draftData);
    setLastSavedTime(draftData.lastSavedAt);
  }, [answers, currentQuestionIndex, selectedDepartment, perceivedSeverity, isReviewMode, isSubmitted, createdCaseId, reviewFlags, messages, patient.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isReviewMode && !isSubmitted) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoadingAI, isReviewMode, isSubmitted]);

  // Submit answer for active question to Gemini Server-Side API
  const handleAnswerSubmit = async (textToSubmit?: string, isUnsure = false) => {
    const rawAnswer = (textToSubmit !== undefined ? textToSubmit : inputText).trim();

    // Prevent submitting empty text unless "I'm not sure" is explicitly clicked
    if (!isUnsure && !rawAnswer) {
      return;
    }

    const displayText = isUnsure
      ? rawAnswer || "I'm not sure / Need clinician to evaluate"
      : rawAnswer;

    // 1. Add patient message to conversation stream
    const userMessageId = `usr-${Date.now()}`;
    const userMsg: IntakeChatMessage = {
      id: userMessageId,
      role: 'user',
      text: displayText,
      timestamp: new Date().toISOString(),
      sectionId: currentSectionId,
      isUnsure,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoadingAI(true);

    try {
      // 2. Call server-side Gemini API
      const response: IntakeTurnResponse = await submitIntakeTurn({
        patient: {
          id: patient.id,
          fullName: patient.fullName,
          age: patient.age,
          gender: patient.gender,
          chronicConditions: patient.chronicConditions,
          allergies: patient.allergies,
        },
        currentSectionId,
        patientInput: rawAnswer,
        isUnsure,
        answersSoFar: answers,
        conversationHistory: updatedMessages.map((m) => ({
          role: m.role,
          text: m.text,
          sectionId: m.sectionId,
          isUnsure: m.isUnsure,
        })),
        accumulatedReviewFlags: reviewFlags,
        currentQuestionIndex,
      });

      // 3. Process conservative urgent review flags if generated
      const newFlags = response.urgentReviewFlags || [];
      if (newFlags.length > 0) {
        setReviewFlags((prev) => Array.from(new Set([...prev, ...newFlags])));
      }

      // 4. Update the answer for the current section
      const questionKey = SECTION_TO_QUESTION_MAP[currentSectionId] || `q_${currentSectionId}`;
      const recordedAnswer: IntakeAnswer = {
        questionId: questionKey,
        sectionId: currentSectionId,
        text: response.extractedSummary || displayText,
        isUnsure: response.isUnsureRecorded || isUnsure,
        updatedAt: new Date().toISOString(),
        urgentFlags: newFlags,
      };

      setAnswers((prev) => ({
        ...prev,
        [questionKey]: recordedAnswer,
      }));

      // 5. If the intake is completed, move to review mode
      if (response.isIntakeComplete) {
        const assistantFinalMsg: IntakeChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: response.nextQuestion,
          timestamp: new Date().toISOString(),
          sectionId: currentSectionId,
          sectionTitle: response.sectionTitle,
          urgentFlags: newFlags,
          source: response.source,
        };
        setMessages((prev) => [...prev, assistantFinalMsg]);
        setIsReviewMode(true);
      } else {
        // Advance to next question / section
        const assistantMsg: IntakeChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: response.nextQuestion,
          timestamp: new Date().toISOString(),
          sectionId: response.sectionId,
          sectionTitle: response.sectionTitle,
          suggestedChips: response.suggestedChips,
          contextHint: response.contextHint,
          urgentFlags: newFlags,
          source: response.source,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setCurrentSectionId(response.sectionId);
        setActiveSuggestedChips(response.suggestedChips || []);
        setActiveContextHint(response.contextHint || 'Describe your symptoms in your own words.');

        const nextSectionIndex = HISTORY_SECTIONS.findIndex((s) => s.id === response.sectionId);
        if (nextSectionIndex >= 0) {
          setCurrentQuestionIndex(nextSectionIndex);
        }
      }
    } catch (err) {
      console.error('Failed to process AI intake turn:', err);
      // Fallback: move to next section index
      const nextIdx = Math.min(currentQuestionIndex + 1, HISTORY_SECTIONS.length - 1);
      setCurrentQuestionIndex(nextIdx);
      const nextSec = HISTORY_SECTIONS[nextIdx]?.id || 'present_illness';
      setCurrentSectionId(nextSec);
      if (nextIdx >= HISTORY_SECTIONS.length - 1 && currentQuestionIndex === HISTORY_SECTIONS.length - 1) {
        setIsReviewMode(true);
      }
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Handle "I'm not sure"
  const handleNotSure = () => {
    handleAnswerSubmit(undefined, true);
  };

  // Handle suggested chip click
  const handleChipClick = (chip: string) => {
    setInputText(chip);
    inputRef.current?.focus();
  };

  // Begin editing a previous answer in review mode
  const handleStartEdit = (questionId: string) => {
    const existing = answers[questionId];
    setEditingQuestionId(questionId);
    setEditingText(existing ? existing.text : '');
  };

  // Save the edited previous answer
  const handleSaveEdit = (questionId: string, isUnsure = false) => {
    const targetQ = INTAKE_QUESTIONS.find((q) => q.id === questionId);
    const targetSec = targetQ?.sectionId || 'chief_complaint';

    const newText = isUnsure
      ? "Patient marked as unsure / to be clarified with physician during physical examination."
      : editingText.trim() || 'None reported / Not applicable';

    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        sectionId: targetSec,
        text: newText,
        isUnsure,
        updatedAt: new Date().toISOString(),
      },
    }));

    setEditingQuestionId(null);
    setEditingText('');
  };

  // Jump to section
  const handleJumpToSection = (sectionId: HistorySectionId) => {
    const secIdx = HISTORY_SECTIONS.findIndex((s) => s.id === sectionId);
    if (secIdx >= 0) {
      setCurrentSectionId(sectionId);
      setCurrentQuestionIndex(secIdx);
      setIsReviewMode(false);
    }
  };

  // Reset Draft
  const handleResetDraft = () => {
    clearIntakeDraft(patient.id);
    setAnswers({});
    setCurrentSectionId('chief_complaint');
    setCurrentQuestionIndex(0);
    setMessages([DEFAULT_INITIAL_MESSAGE]);
    setActiveSuggestedChips(DEFAULT_INITIAL_MESSAGE.suggestedChips || []);
    setActiveContextHint(DEFAULT_INITIAL_MESSAGE.contextHint || '');
    setReviewFlags([]);
    setInputText('');
    setSelectedDepartment(DEPARTMENTS[0]);
    setPerceivedSeverity('Moderate');
    setIsReviewMode(false);
    setIsSubmitted(false);
    setCreatedCaseId('');
    setEditingQuestionId(null);
    setEditingText('');
    setLastSavedTime(null);
    setStructuredRecord(null);
    setShowStructuredViewer(false);
  };

  // Start Fresh Case
  const handleStartNewCase = () => {
    clearIntakeDraft(patient.id);
    setAnswers({});
    setCurrentSectionId('chief_complaint');
    setCurrentQuestionIndex(0);
    setMessages([DEFAULT_INITIAL_MESSAGE]);
    setActiveSuggestedChips(DEFAULT_INITIAL_MESSAGE.suggestedChips || []);
    setActiveContextHint(DEFAULT_INITIAL_MESSAGE.contextHint || '');
    setReviewFlags([]);
    setInputText('');
    setSelectedDepartment(DEPARTMENTS[0]);
    setPerceivedSeverity('Moderate');
    setIsReviewMode(false);
    setIsSubmitted(false);
    setCreatedCaseId('');
    setEditingQuestionId(null);
    setEditingText('');
    setLastSavedTime(null);
    setStructuredRecord(null);
    setShowStructuredViewer(false);
  };

  // Convert conversation to validated structured JSON and open viewer
  const handleOpenStructuredRecord = async () => {
    if (structuredRecord) {
      setShowStructuredViewer(true);
      return;
    }
    setIsConvertingStructured(true);
    try {
      const record = await convertCompletedConversation({
        caseId: createdCaseId || undefined,
        patient,
        answers,
        messages,
        department: selectedDepartment,
        perceivedSeverity,
        reviewFlags,
      });
      setStructuredRecord(record);
      setShowStructuredViewer(true);
    } catch (err) {
      console.warn('Server conversion unavailable, executing deterministic client-side extraction:', err);
      const fallback = convertConversationToStructuredRecord({
        caseId: createdCaseId || undefined,
        patient,
        answers,
        messages,
        department: selectedDepartment,
        perceivedSeverity,
        reviewFlags,
      });
      setStructuredRecord(fallback);
      saveValidatedStructuredRecord(fallback);
      setShowStructuredViewer(true);
    } finally {
      setIsConvertingStructured(false);
    }
  };

  // Final submission of clinical case
  const handleFinalCaseSubmit = () => {
    const uniqueSuffix = `${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const newCaseId = `case-2026-${uniqueSuffix}`;

    const chiefComplaintAnswer = answers['q1_chief_complaint']?.text || 'Patient reported symptom intake';
    const durationAnswer = answers['q2_duration_onset']?.text || '1-3 days';

    // Build structured medical history text
    const summarySections = HISTORY_SECTIONS.map((sec) => {
      const qKey = SECTION_TO_QUESTION_MAP[sec.id];
      const a = answers[qKey];
      const ansText = a ? (a.isUnsure ? `[Unsure / Unknown] ${a.text}` : a.text) : 'Not reported';
      return `• ${sec.title}: "${ansText}"`;
    }).join('\n');

    const flagSummary = reviewFlags.length > 0
      ? `\n\nCONSERVATIVE CLINICAL REVIEW FLAGS (${reviewFlags.length}):\n${reviewFlags.map((f) => `⚠️ ${f}`).join('\n')}`
      : '\n\nReview Flags: None detected. Standard routine intake.';

    const structuredSummary = `Patient ${patient.fullName} (${patient.age}${patient.gender.charAt(0)}) intake completed via DocGenie Server-Side Gemini API.\n${summarySections}${flagSummary}`;

    // Auto-escalate priority if acute review flags are present
    const calculatedPriority = reviewFlags.length > 0
      ? 'urgent'
      : perceivedSeverity === 'Severe'
      ? 'urgent'
      : 'routine';

    // Convert completed conversation into validated structured JSON (15 fields, never guessing missing data)
    const validatedJsonRecord = convertConversationToStructuredRecord({
      caseId: newCaseId,
      patient,
      answers,
      messages,
      department: selectedDepartment,
      perceivedSeverity,
      reviewFlags,
    });
    setStructuredRecord(validatedJsonRecord);
    saveValidatedStructuredRecord(validatedJsonRecord);

    const newCase: ClinicalCase = {
      id: newCaseId,
      uhid: patient.uhid,
      patientId: patient.id,
      patientName: patient.fullName,
      patientAge: patient.age,
      patientGender: patient.gender === 'Female' ? 'Female' : 'Male',
      createdAt: 'Just now (Gemini AI Intake)',
      department: selectedDepartment,
      chiefComplaint: chiefComplaintAnswer,
      symptomDuration: durationAnswer,
      severityLevel: perceivedSeverity,
      status: 'intake_completed',
      priority: calculatedPriority,
      completenessScore: Math.round((Object.keys(answers).length / HISTORY_SECTIONS.length) * 100),
      redFlagsCount: reviewFlags.length,
      redFlags: reviewFlags,
      intakeMethod: 'Digital Intake Portal',
      structuredSummaryPreview: structuredSummary,
      doctorNotes: '',
      structuredIntakeRecord: validatedJsonRecord,
    };

    onCreateCase(newCase);
    setCreatedCaseId(newCaseId);
    setIsSubmitted(true);

    // Save final state with structured record
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
      reviewFlags,
      conversationMessages: messages,
      structuredRecord: validatedJsonRecord,
    });
  };

  const activeAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant') || DEFAULT_INITIAL_MESSAGE;

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
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span>Adaptive AI History Intake • Powered by Gemini Server-Side API</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Sparkles className="w-3 h-3" />
              <span>Zero Autonomous Diagnosis Guarantee</span>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isSubmitted ? (
            <Button
              id="top-start-new-case-btn"
              variant="primary"
              size="sm"
              onClick={handleStartNewCase}
              icon={<PlusCircle className="w-3.5 h-3.5" />}
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              Start New Case
            </Button>
          ) : Object.keys(answers).length > 0 ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="top-view-json-btn"
                onClick={handleOpenStructuredRecord}
                disabled={isConvertingStructured}
                className="text-xs text-teal-800 hover:text-teal-900 font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-300 bg-teal-50/70 hover:bg-teal-100 transition-colors cursor-pointer"
                title="Inspect validated structured clinical JSON (15 fields)"
              >
                {isConvertingStructured ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />
                ) : (
                  <FileCode2 className="w-3.5 h-3.5 text-teal-700" />
                )}
                <span>Validated JSON</span>
              </button>

              <button
                type="button"
                id="reset-intake-draft-btn"
                onClick={handleResetDraft}
                className="text-xs text-slate-500 hover:text-rose-700 font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Clear current answers and restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          ) : null}

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

      {/* Active Clinical Review Flags Alert (Conservative Safety Notice) */}
      {reviewFlags.length > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 shadow-2xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-amber-950 flex items-center gap-2">
                <span>CONSERVATIVE CLINICAL REVIEW FLAGS GENERATED ({reviewFlags.length})</span>
                <span className="text-[10px] uppercase tracking-wider bg-amber-200/80 px-2 py-0.5 rounded text-amber-900 font-bold">
                  Attending Doctor Alerted
                </span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                DocGenie does not perform emergency intervention or diagnosis. The following statement was flagged conservatively for the doctor's immediate review:
              </p>
              <ul className="list-disc list-inside space-y-0.5 font-medium text-amber-900 mt-1 pl-1">
                {reviewFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-700 italic pt-1">
                ⚡ If you are experiencing sudden severe chest pain, inability to breathe, or loss of consciousness, please report to the Emergency OPD immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section Progress Tracker */}
      <IntakeSectionProgress
        currentSectionId={isReviewMode ? 'family_social_history' : currentSectionId}
        answers={answers}
        onSelectSection={handleJumpToSection}
      />

      {/* Draft Persistence Status Bar */}
      {lastSavedTime && !isSubmitted && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4 px-2">
          <div className="flex items-center gap-1.5 text-teal-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Dual-layer draft synced (Local + Cloud)</span>
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
                All 6 patient history sections have been structured by DocGenie and formatted for the attending physician at{' '}
                <strong className="text-slate-800">{selectedDepartment}</strong>.
              </p>
            </div>

            {/* Structured Summary Preview Box */}
            <div className="max-w-xl mx-auto p-4 bg-white rounded-xl border border-slate-200 text-left text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Clinical History Brief
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

              {reviewFlags.length > 0 && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800">
                  <span className="font-bold block mb-1">⚠️ Urgent Review Flags ({reviewFlags.length}):</span>
                  {reviewFlags.map((f, i) => (
                    <div key={i}>• {f}</div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 pt-1 text-[11px] text-slate-700 border-t border-slate-100">
                {HISTORY_SECTIONS.map((sec) => {
                  const qKey = SECTION_TO_QUESTION_MAP[sec.id];
                  const ans = answers[qKey];
                  return (
                    <div key={sec.id} className="flex items-start justify-between gap-2 py-0.5">
                      <span className="font-semibold text-slate-500 shrink-0">{sec.title}:</span>
                      <span className="text-slate-900 text-right truncate max-w-[280px]">
                        {ans?.isUnsure ? (
                          <span className="italic text-amber-700">Unsure / Unknown</span>
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
                id="view-submitted-json-btn"
                variant="outline"
                onClick={handleOpenStructuredRecord}
                icon={<FileCode2 className="w-4 h-4 text-teal-600" />}
                className="border-teal-300 text-teal-900 bg-teal-50/50 hover:bg-teal-100 font-semibold"
              >
                Inspect Validated JSON (15 Fields)
              </Button>
              <Button
                id="intake-start-new-case-btn"
                variant="primary"
                onClick={handleStartNewCase}
                icon={<PlusCircle className="w-4 h-4" />}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-xs"
              >
                Start New Case
              </Button>
              <Button
                id="intake-return-dashboard-btn"
                variant="outline"
                onClick={onCancel}
              >
                Return to Patient Dashboard
              </Button>
              <Button
                id="intake-view-doctor-station-btn"
                variant="ghost"
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
                const qKey = SECTION_TO_QUESTION_MAP[section.id];
                const ans = answers[qKey];
                const isEditingThis = editingQuestionId === qKey;

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

                      {!isEditingThis && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(qKey)}
                          className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Answer</span>
                        </button>
                      )}
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                      {isEditingThis ? (
                        <div className="space-y-2">
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
                              onClick={() => handleSaveEdit(qKey, true)}
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
                                onClick={() => handleSaveEdit(qKey, false)}
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
                            <span>Marked as "I'm not sure / Unknown" (Will be evaluated during doctor physical exam)</span>
                          </div>
                        ) : (
                          <p className="text-slate-900 font-medium leading-relaxed">
                            {ans.text}
                          </p>
                        )
                      ) : (
                        <p className="text-slate-400 italic">Not reported yet</p>
                      )}
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
                  I confirm that the responses provided above are accurate to the best of my recall. I understand that DocGenie does not perform autonomous diagnosis and my history will be reviewed by the attending clinician.
                </span>
              </label>
            </div>

            {/* Structured Clinical JSON Card & Inspector Trigger */}
            <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
                  <FileCode2 className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-white">Validated Structured Clinical JSON (HL7/FHIR)</span>
                    <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>15/15 Fields Validated</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Structured patient record conforming to schema v1.0.0 with zero-guess missing data isolation, review flags, and non-autonomous diagnosis disclaimer.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                id="inspect-structured-json-review-btn"
                variant="outline"
                size="sm"
                onClick={handleOpenStructuredRecord}
                disabled={isConvertingStructured}
                icon={isConvertingStructured ? <Loader2 className="w-4 h-4 animate-spin text-teal-400" /> : <FileCode2 className="w-4 h-4 text-teal-400" />}
                className="border-slate-700 text-slate-100 hover:bg-slate-800 bg-slate-800/90 shrink-0 text-xs py-2"
              >
                {isConvertingStructured ? 'Validating...' : 'Inspect Structured JSON'}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReviewMode(false);
                }}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Return to Intake Chat
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
              {messages.map((msg, idx) => {
                if (msg.role === 'assistant') {
                  const secMeta = HISTORY_SECTIONS.find((s) => s.id === msg.sectionId);
                  const stepNum = secMeta ? secMeta.stepNumber : 1;

                  return (
                    <div key={msg.id || idx} className="space-y-2 pt-1">
                      <div className="flex items-start gap-3 max-w-2xl">
                        <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-teal-50/60 border border-teal-200 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-800 shadow-2xs space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[10px] text-teal-800 uppercase tracking-wider">
                              {msg.sectionTitle || secMeta?.title || 'History Intake'}
                            </span>
                            <span className="text-teal-300">•</span>
                            <span className="text-[10px] text-teal-700 font-medium">
                              Section {stepNum} of 6
                            </span>
                            {msg.source === 'gemini' && (
                              <span className="text-[10px] text-teal-600 inline-flex items-center gap-0.5 ml-auto">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Adaptive</span>
                              </span>
                            )}
                          </div>
                          <p className="leading-relaxed font-semibold text-slate-900 text-sm">
                            {msg.text}
                          </p>
                          {msg.contextHint && (
                            <p className="text-[11px] text-slate-500 italic">
                              💡 {msg.contextHint}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={msg.id || idx} className="flex items-start justify-end gap-3 max-w-2xl ml-auto">
                      <div className="bg-teal-700 text-white rounded-2xl rounded-tr-sm p-3.5 text-xs shadow-2xs space-y-1.5 max-w-lg">
                        <div className="flex items-center justify-between gap-4 text-[10px] text-teal-200/90">
                          <span>You (Patient)</span>
                        </div>
                        {msg.isUnsure ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-800/80 text-teal-100 text-[11px]">
                            <HelpCircle className="w-3 h-3 text-amber-300" />
                            <span className="font-semibold text-amber-200">I'm not sure / Unknown</span>
                            <span className="opacity-75">— Marked for doctor review</span>
                          </div>
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>

                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    </div>
                  );
                }
              })}

              {/* AI Typing / Processing State */}
              {isLoadingAI && (
                <div className="flex items-start gap-3 max-w-2xl animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-teal-50/80 border border-teal-200 rounded-2xl rounded-tl-sm p-3 text-xs text-teal-800 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                    <span className="font-medium">DocGenie AI is analyzing your response and formulating the next history question...</span>
                  </div>
                </div>
              )}

              {/* Suggested Quick Chips for the Active Question */}
              {!isLoadingAI && activeSuggestedChips && activeSuggestedChips.length > 0 && (
                <div className="pl-11 pr-2 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Quick Suggestions (Tap to insert):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSuggestedChips.map((chip) => (
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

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
              {/* Back / Navigation helpers */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Section {currentQuestionIndex + 1} of 6: <strong>{HISTORY_SECTIONS[currentQuestionIndex]?.title}</strong>
                  </span>
                </div>

                {/* Review Button if questions answered */}
                {Object.keys(answers).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsReviewMode(true)}
                    className="text-xs text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Review Recorded Answers ({Object.keys(answers).length}/6)</span>
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
                    disabled={isLoadingAI}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAnswerSubmit();
                      }
                    }}
                    placeholder={activeContextHint || 'Describe your symptoms clearly (e.g. onset, severity, duration)...'}
                    className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none placeholder:text-slate-400 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                {/* Action Buttons: "I'm not sure" and "Submit" */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    id="intake-not-sure-btn"
                    variant="outline"
                    type="button"
                    disabled={isLoadingAI}
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
                    disabled={isLoadingAI || !inputText.trim()}
                    onClick={() => handleAnswerSubmit()}
                    icon={isLoadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  >
                    <span>Submit</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Press <strong>Enter</strong> to submit, <strong>Shift + Enter</strong> for a new line</span>
                <span>Section {currentQuestionIndex + 1} of 6</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validated Structured Clinical JSON Modal Viewer */}
      {structuredRecord && (
        <StructuredRecordViewer
          record={structuredRecord}
          isOpen={showStructuredViewer}
          onClose={() => setShowStructuredViewer(false)}
        />
      )}
    </div>
  );
};
