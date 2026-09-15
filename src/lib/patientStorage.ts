import { SyntheticPatient, PatientMedication } from '../types';
import { SYNTHETIC_PATIENTS } from '../data/mockData';

const STORAGE_KEY_PATIENTS = 'docgenie_patients_store_v1';
const STORAGE_KEY_ACTIVE_PATIENT_ID = 'docgenie_active_patient_id_v1';

// In-memory fallback if localStorage is disabled or throws
let memoryPatients: SyntheticPatient[] = JSON.parse(JSON.stringify(SYNTHETIC_PATIENTS));
let memoryActivePatientId: string = SYNTHETIC_PATIENTS[0].id;

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__docgenie_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes a stored patient object to guarantee all nested arrays and objects exist.
 */
function normalizePatient(raw: Partial<SyntheticPatient>, fallback: SyntheticPatient): SyntheticPatient {
  return {
    ...fallback,
    ...raw,
    id: raw.id || fallback.id,
    uhid: raw.uhid || fallback.uhid,
    fullName: raw.fullName || fallback.fullName,
    age: typeof raw.age === 'number' ? raw.age : fallback.age,
    dateOfBirth: raw.dateOfBirth !== undefined ? raw.dateOfBirth : fallback.dateOfBirth,
    gender: raw.gender || fallback.gender,
    phone: raw.phone !== undefined ? raw.phone : fallback.phone,
    email: raw.email !== undefined ? raw.email : fallback.email,
    address: raw.address !== undefined ? raw.address : fallback.address,
    bloodGroup: raw.bloodGroup || fallback.bloodGroup,
    // Ensure nested arrays are cloned properly
    allergies: Array.isArray(raw.allergies) ? [...raw.allergies] : [...fallback.allergies],
    medications: Array.isArray(raw.medications)
      ? raw.medications.map((m) => ({ ...m }))
      : fallback.medications.map((m) => ({ ...m })),
    chronicConditions: Array.isArray(raw.chronicConditions)
      ? [...raw.chronicConditions]
      : [...fallback.chronicConditions],
    // Ensure nested objects are merged safely
    relevantHistory: {
      ...fallback.relevantHistory,
      ...(raw.relevantHistory || {}),
    },
    emergencyContact: raw.emergencyContact !== undefined ? raw.emergencyContact : fallback.emergencyContact,
    lastVisitDate: raw.lastVisitDate || fallback.lastVisitDate,
    lastProfileUpdateDate: raw.lastProfileUpdateDate || fallback.lastProfileUpdateDate,
    avatarUrl: raw.avatarUrl || fallback.avatarUrl,
  };
}

/**
 * Retrieve all patients from persistent storage, initialized with synthetic seed data.
 */
export function getStoredPatients(): SyntheticPatient[] {
  if (!isLocalStorageAvailable()) {
    return memoryPatients;
  }

  try {
    const rawData = localStorage.getItem(STORAGE_KEY_PATIENTS);
    if (!rawData) {
      // First run: save deep copy of SYNTHETIC_PATIENTS to storage
      const initial = JSON.parse(JSON.stringify(SYNTHETIC_PATIENTS));
      localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(rawData);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = JSON.parse(JSON.stringify(SYNTHETIC_PATIENTS));
      localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(initial));
      return initial;
    }

    // Match seeds with stored records, and preserve any custom registered patients
    const normalizedList: SyntheticPatient[] = [];
    const seenIds = new Set<string>();

    for (const seed of SYNTHETIC_PATIENTS) {
      const existing = parsed.find((p: SyntheticPatient) => p && (p.id === seed.id || p.uhid === seed.uhid));
      if (existing) {
        normalizedList.push(normalizePatient(existing, seed));
      } else {
        normalizedList.push(seed);
      }
      seenIds.add(seed.id);
      if (seed.uhid) seenIds.add(seed.uhid);
    }

    // Retain any additional patients stored in parsed (e.g. registered or Supabase user IDs)
    for (const p of parsed) {
      if (p && p.id && !seenIds.has(p.id) && (!p.uhid || !seenIds.has(p.uhid))) {
        normalizedList.push(
          normalizePatient(p, {
            ...SYNTHETIC_PATIENTS[0],
            id: p.id,
            uhid: p.uhid || `UHID-PAT-${p.id.slice(-4)}`,
            fullName: p.fullName || 'Hospital Patient',
          })
        );
        seenIds.add(p.id);
        if (p.uhid) seenIds.add(p.uhid);
      }
    }

    return normalizedList;
  } catch (err) {
    console.error('Error reading patients from localStorage, falling back to seed:', err);
    return JSON.parse(JSON.stringify(SYNTHETIC_PATIENTS));
  }
}

/**
 * Retrieve a specific patient by ID or UHID from persistent storage.
 */
export function getStoredPatientById(idOrUhid: string): SyntheticPatient | null {
  const allPatients = getStoredPatients();
  const found = allPatients.find((p) => p.id === idOrUhid || p.uhid === idOrUhid);
  return found || null;
}

/**
 * Save an updated patient profile to persistent storage.
 * Handles demographic fields, contact info, nested arrays (allergies, medications, conditions),
 * and nested objects (relevantHistory, emergencyContact).
 */
export function saveStoredPatient(
  patientId: string,
  updates: Partial<SyntheticPatient>
): SyntheticPatient {
  const allPatients = getStoredPatients();
  const targetIndex = allPatients.findIndex((p) => p.id === patientId || p.uhid === patientId);

  const fallback =
    SYNTHETIC_PATIENTS.find((p) => p.id === patientId || p.uhid === patientId) || SYNTHETIC_PATIENTS[0];

  const current = targetIndex >= 0 ? allPatients[targetIndex] : fallback;
  const todayDate = new Date().toISOString().split('T')[0];

  // Deep clone and merge updates
  const updated: SyntheticPatient = {
    ...current,
    ...updates,
    // Preserve array clones if provided
    allergies: updates.allergies !== undefined ? [...updates.allergies] : [...current.allergies],
    medications:
      updates.medications !== undefined
        ? updates.medications.map((m: PatientMedication) => ({ ...m }))
        : current.medications.map((m: PatientMedication) => ({ ...m })),
    chronicConditions:
      updates.chronicConditions !== undefined ? [...updates.chronicConditions] : [...current.chronicConditions],
    // Merge nested relevantHistory object
    relevantHistory: updates.relevantHistory
      ? { ...current.relevantHistory, ...updates.relevantHistory }
      : { ...current.relevantHistory },
    // Emergency contact (can be updated or cleared)
    emergencyContact:
      updates.emergencyContact !== undefined
        ? updates.emergencyContact
        : current.emergencyContact,
    lastProfileUpdateDate: todayDate,
  };

  if (targetIndex >= 0) {
    allPatients[targetIndex] = updated;
  } else {
    allPatients.push(updated);
  }

  // Persist to storage
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(allPatients));
      localStorage.setItem(STORAGE_KEY_ACTIVE_PATIENT_ID, updated.id);
    } catch (err) {
      console.error('Failed to write patient to localStorage:', err);
    }
  }
  memoryPatients = allPatients;
  memoryActivePatientId = updated.id;

  // Dispatch custom browser event so any reactive listener updates instantly
  try {
    window.dispatchEvent(
      new CustomEvent('docgenie_patient_updated', {
        detail: { patient: updated },
      })
    );
  } catch {
    // Window event dispatch failed, ignore in test environments
  }

  return updated;
}

/**
 * Reset a patient profile back to the initial synthetic seed data.
 */
export function resetStoredPatientToDefault(patientId: string): SyntheticPatient {
  const seed =
    SYNTHETIC_PATIENTS.find((p) => p.id === patientId || p.uhid === patientId) || SYNTHETIC_PATIENTS[0];

  const allPatients = getStoredPatients();
  const targetIndex = allPatients.findIndex((p) => p.id === patientId || p.uhid === patientId);

  const resetCopy: SyntheticPatient = JSON.parse(JSON.stringify(seed));
  resetCopy.lastProfileUpdateDate = new Date().toISOString().split('T')[0];

  if (targetIndex >= 0) {
    allPatients[targetIndex] = resetCopy;
  } else {
    allPatients.push(resetCopy);
  }

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(allPatients));
    } catch (err) {
      console.error('Failed to reset patient in localStorage:', err);
    }
  }
  memoryPatients = allPatients;

  try {
    window.dispatchEvent(
      new CustomEvent('docgenie_patient_updated', {
        detail: { patient: resetCopy },
      })
    );
  } catch {
    // ignore
  }

  return resetCopy;
}

/**
 * Get active patient ID from persistent storage.
 */
export function getActivePatientId(): string {
  if (isLocalStorageAvailable()) {
    const storedId = localStorage.getItem(STORAGE_KEY_ACTIVE_PATIENT_ID);
    if (storedId) return storedId;
  }
  return memoryActivePatientId || SYNTHETIC_PATIENTS[0].id;
}

/**
 * Set active patient ID in persistent storage.
 */
export function setActivePatientId(patientId: string): void {
  memoryActivePatientId = patientId;
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PATIENT_ID, patientId);
    } catch (err) {
      console.error('Failed to set active patient ID in localStorage:', err);
    }
  }
}

/**
 * Get the currently active patient with latest persistent updates applied.
 */
export function getActivePatient(): SyntheticPatient {
  const activeId = getActivePatientId();
  const patient = getStoredPatientById(activeId);
  return patient || getStoredPatients()[0];
}
