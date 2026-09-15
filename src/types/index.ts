/**
 * DocGenie - Core TypeScript Definitions
 * Module 1: Project Foundation & Synthetic Healthcare Entities
 */

export type UserRole = 'guest' | 'patient' | 'doctor';
export type AuthRole = 'PATIENT' | 'DOCTOR' | 'GUEST';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'PATIENT' | 'DOCTOR';
  uhid?: string;
  department?: string;
  specialization?: string;
  medicalRegNumber?: string;
  phone?: string;
  isDemoUser?: boolean;
}

export type AppRoute =
  | 'patient_login'
  | 'patient_dashboard'
  | 'start_case'
  | 'doctor_login'
  | 'doctor_dashboard';

export type CaseStatus =
  | 'intake_pending'
  | 'intake_completed'
  | 'doctor_review'
  | 'verified';

export type TriagePriority = 'routine' | 'urgent' | 'immediate';

export type PatientGender = 'Female' | 'Male' | 'Other' | 'Non-binary' | 'Prefer not to say';

export type DataProvenance = 'PATIENT_REPORTED' | 'AI_GENERATED' | 'CLINICIAN_VERIFIED';

export interface PatientMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  indication?: string;
  startDate?: string;
}

export interface EmergencyContactInfo {
  name: string;
  relationship: string;
  phone: string;
}

export interface RelevantMedicalHistory {
  pastSurgicalHistory?: string;
  familyHistory?: string;
  lifestyleNotes?: string;
  generalMedicalNotes?: string;
}

export interface SyntheticPatient {
  id: string;
  uhid: string; // Synthetic Universal Health ID
  fullName: string;
  age: number;
  dateOfBirth?: string; // YYYY-MM-DD
  gender: PatientGender;
  phone: string;
  email?: string;
  address?: string;
  bloodGroup: string;
  allergies: string[];
  medications: PatientMedication[];
  chronicConditions: string[]; // Known conditions
  relevantHistory: RelevantMedicalHistory;
  emergencyContact?: EmergencyContactInfo; // Optional emergency contact
  lastVisitDate?: string;
  avatarUrl?: string;
  lastProfileUpdateDate?: string;
}

export interface SyntheticDoctor {
  id: string;
  fullName: string;
  title: string;
  specialization: string;
  department: string;
  medicalRegNumber: string;
  hospitalName: string;
  roomNumber: string;
  avatarUrl?: string;
}

export interface ClinicalCase {
  id: string;
  uhid: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Female' | 'Male' | 'Other';
  createdAt: string;
  department: string;
  chiefComplaint: string;
  symptomDuration: string;
  severityLevel: 'Mild' | 'Moderate' | 'Severe';
  status: CaseStatus;
  priority: TriagePriority;
  completenessScore: number; // 0 - 100 percentage
  redFlagsCount: number;
  redFlags: string[];
  intakeMethod: 'Voice/Text Placeholder' | 'Digital Intake Portal';
  structuredSummaryPreview: string;
  doctorNotes?: string;
  verifiedAt?: string;
  assignedDoctorName?: string;
}

export interface StartCaseDraft {
  patientId: string;
  department: string;
  chiefComplaint: string;
  duration: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  patientConsentAccepted: boolean;
}

export type HistorySectionId =
  | 'chief_complaint'
  | 'present_illness'
  | 'associated_symptoms'
  | 'medical_history'
  | 'medications_allergies'
  | 'family_social_history';

export interface IntakeQuestion {
  id: string;
  sectionId: HistorySectionId;
  sectionTitle: string;
  assistantPrompt: string;
  contextHint?: string;
  placeholder: string;
  suggestedChips?: string[];
  isRequired?: boolean;
}

export interface IntakeAnswer {
  questionId: string;
  sectionId: HistorySectionId;
  text: string;
  isUnsure: boolean;
  updatedAt: string;
}

export interface IntakeConversationDraft {
  patientId: string;
  answers: Record<string, IntakeAnswer>;
  currentQuestionIndex: number;
  selectedDepartment: string;
  perceivedSeverity: 'Mild' | 'Moderate' | 'Severe';
  isReviewMode: boolean;
  isSubmitted: boolean;
  createdCaseId?: string;
  lastSavedAt: string;
}

