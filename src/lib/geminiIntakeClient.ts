import { HistorySectionId, IntakeAnswer, IntakeChatMessage } from '../types';

export interface IntakeTurnRequest {
  patient: {
    id: string;
    fullName: string;
    age: number;
    gender: string;
    chronicConditions?: string[];
    allergies?: string[];
  };
  currentSectionId: HistorySectionId;
  patientInput: string;
  isUnsure: boolean;
  answersSoFar: Record<string, IntakeAnswer>;
  conversationHistory: Array<{
    role: 'assistant' | 'user';
    text: string;
    sectionId?: string;
    isUnsure?: boolean;
  }>;
  accumulatedReviewFlags?: string[];
  currentQuestionIndex?: number;
}

export interface IntakeTurnResponse {
  nextQuestion: string;
  sectionId: HistorySectionId;
  sectionTitle: string;
  contextHint?: string;
  suggestedChips: string[];
  urgentReviewFlags: string[];
  isSectionFinished: boolean;
  isIntakeComplete: boolean;
  extractedSummary: string;
  isUnsureRecorded: boolean;
  source: 'gemini' | 'clinical_rules_fallback';
}

/**
 * Client-side caller for the server-side Gemini Clinical Intake API.
 * Keeps all API keys and LLM SDK interactions securely server-side.
 */
export async function submitIntakeTurn(
  payload: IntakeTurnRequest
): Promise<IntakeTurnResponse> {
  try {
    const res = await fetch('/api/intake/turn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => null);
      throw new Error(errorJson?.message || `Server responded with status ${res.status}`);
    }

    const data: IntakeTurnResponse = await res.json();
    return data;
  } catch (err) {
    console.warn('API /api/intake/turn network issue, using local safety fallback:', err);
    // Return a safe client-side fallback response if network fails
    return getLocalSafetyFallback(payload);
  }
}

/**
 * Local safety fallback in case the browser is offline or server encounters network issues.
 */
function getLocalSafetyFallback(payload: IntakeTurnRequest): IntakeTurnResponse {
  const sections: { id: HistorySectionId; title: string; defaultQuestion: string; chips: string[] }[] = [
    {
      id: 'chief_complaint',
      title: 'Chief Complaint',
      defaultQuestion: 'What is the primary symptom or health concern bringing you in today?',
      chips: ['Throat irritation & cough', 'Fever & body chills', 'Stomach pain', 'Headache & fatigue'],
    },
    {
      id: 'present_illness',
      title: 'History of Present Illness',
      defaultQuestion: 'How long have you experienced this symptom, and did it begin suddenly or gradually?',
      chips: ['Started < 24 hours ago', 'Gradual over 2-3 days', 'About 1 week ago', 'Recurring intermittently'],
    },
    {
      id: 'associated_symptoms',
      title: 'Associated Symptoms',
      defaultQuestion: 'Are you experiencing any other symptoms such as fever, nausea, dizziness, or shortness of breath?',
      chips: ['Mild fever & fatigue', 'Nausea / loss of appetite', 'Dizziness or lightheadedness', 'No other symptoms'],
    },
    {
      id: 'medical_history',
      title: 'Past Medical History',
      defaultQuestion: 'Do you have any diagnosed chronic medical conditions or past surgeries?',
      chips: ['Hypertension', 'Type 2 Diabetes', 'Asthma / Allergies', 'No pre-existing conditions'],
    },
    {
      id: 'medications_allergies',
      title: 'Medications & Allergies',
      defaultQuestion: 'Are you currently taking any prescription drugs or supplements? Any drug/food allergies?',
      chips: ['No regular medications', 'Daily blood pressure medicine', 'Penicillin allergy', 'No known drug allergies'],
    },
    {
      id: 'family_social_history',
      title: 'Family & Social History',
      defaultQuestion: 'Is there any family history of major illness, or relevant lifestyle habits (smoking/alcohol)?',
      chips: ['Family history of cardiac disease', 'Family history of diabetes', 'Non-smoker, non-drinker', 'No significant risk factors'],
    },
  ];

  const currentIdx = sections.findIndex((s) => s.id === payload.currentSectionId);
  const safeIdx = currentIdx >= 0 ? currentIdx : 0;
  const isLast = safeIdx >= sections.length - 1;
  const nextIdx = (payload.patientInput || payload.isUnsure) && !isLast ? safeIdx + 1 : safeIdx;
  const target = sections[nextIdx];

  const isIntakeComplete = isLast && Boolean(payload.patientInput || payload.isUnsure);

  return {
    nextQuestion: isIntakeComplete
      ? 'All 6 clinical history sections have been recorded. Please review your answers below.'
      : target.defaultQuestion,
    sectionId: target.id,
    sectionTitle: target.title,
    contextHint: 'Please provide objective details for your doctor.',
    suggestedChips: target.chips,
    urgentReviewFlags: payload.accumulatedReviewFlags || [],
    isSectionFinished: Boolean(payload.patientInput || payload.isUnsure),
    isIntakeComplete,
    extractedSummary: payload.isUnsure
      ? "Patient marked as unsure / to be clarified with physician during physical examination."
      : payload.patientInput || 'None reported',
    isUnsureRecorded: payload.isUnsure,
    source: 'clinical_rules_fallback',
  };
}
