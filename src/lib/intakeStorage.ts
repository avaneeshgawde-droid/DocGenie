import { IntakeConversationDraft } from '../types';
import { supabase, isSupabaseReady } from './supabase';

const DRAFT_PREFIX = 'docgenie_intake_draft_v1_';

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Synchronous local retrieval for instant component initialization on render/mount.
 */
export function getIntakeDraft(patientId: string): IntakeConversationDraft | null {
  if (!isStorageAvailable() || !patientId) return null;
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${patientId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.patientId === patientId && parsed.answers) {
      return parsed as IntakeConversationDraft;
    }
  } catch (err) {
    console.warn('Failed to parse intake draft from localStorage:', err);
  }
  return null;
}

/**
 * Asynchronous dual-layer retrieval: checks Supabase case_intake if connected,
 * falls back to or merges with localStorage.
 */
export async function getIntakeDraftAsync(patientId: string): Promise<IntakeConversationDraft | null> {
  const localDraft = getIntakeDraft(patientId);

  if (!isSupabaseReady() || !supabase || !patientId) {
    return localDraft;
  }

  try {
    const { data, error } = await supabase
      .from('case_intake')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();

    if (error || !data) {
      return localDraft;
    }

    const cloudDraft: IntakeConversationDraft = {
      patientId: data.patient_id,
      answers: data.answers || {},
      currentQuestionIndex: data.current_question_index ?? 0,
      selectedDepartment: data.selected_department || undefined,
      perceivedSeverity: data.perceived_severity || undefined,
      isReviewMode: Boolean(data.is_review_mode),
      isSubmitted: Boolean(data.is_submitted),
      createdCaseId: data.created_case_id || undefined,
      lastSavedAt: data.last_saved_at || new Date().toISOString(),
    };

    // If cloudDraft is newer or has answers, keep local in sync
    if (cloudDraft.answers && Object.keys(cloudDraft.answers).length > 0) {
      try {
        localStorage.setItem(`${DRAFT_PREFIX}${patientId}`, JSON.stringify(cloudDraft));
      } catch {
        // ignore
      }
      return cloudDraft;
    }
  } catch (err) {
    console.warn('Supabase case_intake draft fetch notice (using local draft):', err);
  }

  return localDraft;
}

/**
 * Dual-layer save: persists immediately to localStorage (demo mode / offline resilience)
 * and asynchronously pushes to Supabase case_intake table when connected.
 */
export function saveIntakeDraft(draft: IntakeConversationDraft): void {
  if (!isStorageAvailable() || !draft?.patientId) return;

  const dataToSave: IntakeConversationDraft = {
    ...draft,
    lastSavedAt: new Date().toISOString(),
  };

  // 1. Layer 1: LocalStorage
  try {
    localStorage.setItem(`${DRAFT_PREFIX}${draft.patientId}`, JSON.stringify(dataToSave));
  } catch (err) {
    console.error('Failed to save intake draft to localStorage:', err);
  }

  // 2. Layer 2: Supabase (case_intake table)
  if (isSupabaseReady() && supabase) {
    Promise.resolve(
      supabase
        .from('case_intake')
        .upsert({
          patient_id: draft.patientId,
          answers: draft.answers || {},
          current_question_index: draft.currentQuestionIndex ?? 0,
          selected_department: draft.selectedDepartment || null,
          perceived_severity: draft.perceivedSeverity || null,
          is_review_mode: Boolean(draft.isReviewMode),
          is_submitted: Boolean(draft.isSubmitted),
          created_case_id: draft.createdCaseId || null,
          last_saved_at: dataToSave.lastSavedAt,
        })
    )
      .then(({ error }: any) => {
        if (error) {
          console.warn('Supabase case_intake upsert notice:', error.message);
        }
      })
      .catch((err: any) => {
        console.warn('Supabase case_intake table skipped (demo mode active):', err);
      });
  }
}

/**
 * Clear intake draft in both localStorage and Supabase after successful submission.
 */
export function clearIntakeDraft(patientId: string): void {
  if (!patientId) return;

  // 1. Layer 1: LocalStorage
  if (isStorageAvailable()) {
    try {
      localStorage.removeItem(`${DRAFT_PREFIX}${patientId}`);
    } catch (err) {
      console.warn('Failed to remove intake draft from localStorage:', err);
    }
  }

  // 2. Layer 2: Supabase
  if (isSupabaseReady() && supabase) {
    Promise.resolve(
      supabase
        .from('case_intake')
        .delete()
        .eq('patient_id', patientId)
    )
      .then(() => {})
      .catch(() => {});
  }
}
