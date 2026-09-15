import { ClinicalCase } from '../types';
import { SYNTHETIC_CASES } from '../data/mockData';
import { supabase, isSupabaseReady } from './supabase';

const STORAGE_KEY_CASES = 'docgenie_clinical_cases_v1';
const STORAGE_PREFIX_DOCTOR_NOTE_DRAFT = 'docgenie_doctor_note_draft_v1_';

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Retrieve cases synchronously from localStorage with fallback to SYNTHETIC_CASES.
 * Ensures immediate hydration without flashing or resetting on browser refresh.
 */
export function getStoredCases(): ClinicalCase[] {
  if (!isStorageAvailable()) return SYNTHETIC_CASES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CASES);
    if (!raw) return SYNTHETIC_CASES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as ClinicalCase[];
    }
  } catch (err) {
    console.warn('Failed to parse stored clinical cases from localStorage:', err);
  }
  return SYNTHETIC_CASES;
}

/**
 * Save full list of cases to localStorage.
 */
export function saveStoredCases(cases: ClinicalCase[]): void {
  if (!isStorageAvailable() || !Array.isArray(cases)) return;
  try {
    localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
  } catch (err) {
    console.error('Failed to save clinical cases to localStorage:', err);
  }
}

/**
 * Save or update a single clinical case in both localStorage and Supabase (if connected).
 */
export async function saveStoredCase(clinicalCase: ClinicalCase): Promise<void> {
  if (!clinicalCase?.id) return;

  // 1. Persist to local storage immediately
  const existingCases = getStoredCases();
  const index = existingCases.findIndex((c) => c.id === clinicalCase.id);
  let updatedCases: ClinicalCase[];

  if (index >= 0) {
    updatedCases = existingCases.map((c) => (c.id === clinicalCase.id ? clinicalCase : c));
  } else {
    updatedCases = [clinicalCase, ...existingCases];
  }

  saveStoredCases(updatedCases);

  // 2. Persist to Supabase if connected
  if (isSupabaseReady() && supabase) {
    try {
      const payload = {
        id: clinicalCase.id,
        patient_id: clinicalCase.patientId,
        patient_name: clinicalCase.patientName,
        uhid: clinicalCase.uhid,
        department: clinicalCase.department,
        chief_complaint: clinicalCase.chiefComplaint,
        symptom_duration: clinicalCase.symptomDuration,
        severity_level: clinicalCase.severityLevel,
        status: clinicalCase.status,
        priority: clinicalCase.priority,
        completeness_score: clinicalCase.completenessScore,
        red_flags: clinicalCase.redFlags,
        doctor_notes: clinicalCase.doctorNotes || '',
        verified_at: clinicalCase.verifiedAt || null,
        assigned_doctor_name: clinicalCase.assignedDoctorName || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('cases').upsert(payload);
      if (error) {
        console.warn('Supabase cases upsert notice (local state preserved):', error.message);
      }
    } catch (err) {
      console.warn('Supabase cases table update skipped (demo mode active):', err);
    }
  }
}

/**
 * Async fetch of cases from Supabase database table with fallback to local store.
 */
export async function fetchStoredCasesAsync(): Promise<ClinicalCase[]> {
  const localCases = getStoredCases();

  if (!isSupabaseReady() || !supabase) {
    return localCases;
  }

  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return localCases;
    }

    const mappedCases: ClinicalCase[] = data.map((row: any) => ({
      id: row.id,
      uhid: row.uhid || 'UHID-DEMO',
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientAge: row.patient_age || 35,
      patientGender: row.patient_gender || 'Other',
      createdAt: row.created_at || 'Recently',
      department: row.department || 'General Medicine OPD',
      chiefComplaint: row.chief_complaint || 'Intake summary',
      symptomDuration: row.symptom_duration || 'Not specified',
      severityLevel: row.severity_level || 'Moderate',
      status: row.status || 'intake_completed',
      priority: row.priority || 'routine',
      completenessScore: row.completeness_score || 90,
      redFlagsCount: Array.isArray(row.red_flags) ? row.red_flags.length : 0,
      redFlags: Array.isArray(row.red_flags) ? row.red_flags : [],
      intakeMethod: row.intake_method || 'Digital Intake Portal',
      structuredSummaryPreview: row.structured_summary_preview || row.chief_complaint,
      doctorNotes: row.doctor_notes || '',
      verifiedAt: row.verified_at || undefined,
      assignedDoctorName: row.assigned_doctor_name || undefined,
    }));

    // Merge Supabase cases with any local cases not yet synced
    const merged = [...mappedCases];
    for (const localCase of localCases) {
      if (!merged.some((m) => m.id === localCase.id)) {
        merged.push(localCase);
      }
    }

    saveStoredCases(merged);
    return merged;
  } catch (err) {
    console.warn('Could not fetch cases from Supabase (falling back to local store):', err);
    return localCases;
  }
}

/**
 * Retrieve unsaved doctor note draft for a given case ID.
 */
export function getDoctorNoteDraft(caseId: string): string {
  if (!isStorageAvailable() || !caseId) return '';
  try {
    return localStorage.getItem(`${STORAGE_PREFIX_DOCTOR_NOTE_DRAFT}${caseId}`) || '';
  } catch {
    return '';
  }
}

/**
 * Save unsaved doctor note draft for a given case ID.
 */
export function saveDoctorNoteDraft(caseId: string, notes: string, doctorId?: string): void {
  if (!isStorageAvailable() || !caseId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX_DOCTOR_NOTE_DRAFT}${caseId}`, notes);

    // Also attempt background sync to Supabase doctor_notes table if ready
    if (isSupabaseReady() && supabase && doctorId) {
      Promise.resolve(
        supabase
          .from('doctor_notes')
          .upsert({
            case_id: caseId,
            doctor_id: doctorId,
            notes: notes,
            is_draft: true,
            updated_at: new Date().toISOString(),
          })
      )
        .then(({ error }: any) => {
          if (error) {
            // Optional table; silently handle
          }
        })
        .catch(() => {});
    }
  } catch (err) {
    console.warn('Failed to save doctor note draft:', err);
  }
}

/**
 * Clear unsaved doctor note draft after verification or cancellation.
 */
export function clearDoctorNoteDraft(caseId: string): void {
  if (!isStorageAvailable() || !caseId) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX_DOCTOR_NOTE_DRAFT}${caseId}`);

    if (isSupabaseReady() && supabase) {
      Promise.resolve(
        supabase
          .from('doctor_notes')
          .delete()
          .eq('case_id', caseId)
          .eq('is_draft', true)
      )
        .then(() => {})
        .catch(() => {});
    }
  } catch {
    // ignore
  }
}
