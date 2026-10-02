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
  structuredIntakeRecord?: ValidatedStructuredIntakeRecord;
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
  urgentFlags?: string[];
}

export interface IntakeChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
  sectionId?: HistorySectionId;
  sectionTitle?: string;
  isUnsure?: boolean;
  urgentFlags?: string[];
  suggestedChips?: string[];
  contextHint?: string;
  source?: 'gemini' | 'clinical_rules_fallback';
}

// ---------------------------------------------------------
// Validated Structured Clinical JSON Interfaces (Module 2)
// ---------------------------------------------------------

export interface StructuredSymptomDetails {
  description: string;
  location: string | null;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Unspecified';
  characterOrQuality?: string | null;
  progression?: string | null;
}

export interface StructuredOnsetDuration {
  onset: string | null;
  duration: string | null;
  rawInput: string;
}

export interface StructuredRelevantHistory {
  pastMedicalHistory: string | null;
  surgicalHistory: string | null;
  knownChronicConditions: string[];
  patientReportedNotes: string | null;
}

export interface StructuredMedicationItem {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  source: 'PATIENT_REPORTED' | 'PROFILE_RECORD' | 'UNSPECIFIED';
}

export interface StructuredAllergyItem {
  id: string;
  substance: string;
  reaction: string | null;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Unspecified';
  source: 'PATIENT_REPORTED' | 'PROFILE_RECORD';
}

export interface StructuredFamilySocialHistory {
  familyHistory: string | null;
  lifestyleSocial: string | null;
  habitsAndExposure: string | null;
}

export interface StructuredReferencedDocument {
  id: string;
  title: string;
  documentType: 'LAB_REPORT' | 'PRESCRIPTION' | 'PRIOR_DISCHARGE' | 'IMAGING' | 'OTHER';
  summary?: string;
  referenceDate?: string;
  fileSize?: string;
}

export interface StructuredUnknownMissingField {
  id: string;
  fieldKey: string;
  fieldName: string;
  reason: 'EXPLICIT_PATIENT_UNSURE' | 'NOT_REPORTED_BY_PATIENT' | 'NO_PRIOR_RECORD' | 'INCOMPLETE_INPUT';
  inquiryPrompt: string;
  status: 'PENDING_PHYSICIAN_CLARIFICATION';
}

export interface StructuredReviewFlagItem {
  id: string;
  flag: string;
  category: 'RED_FLAG' | 'URGENCY' | 'ALLERGY_ALERT' | 'CLINICAL_REVIEW';
  severity: 'immediate' | 'urgent' | 'caution' | 'routine';
  detectedFrom: string;
  clinicalActionRecommended: string;
}

export interface StructuredAiGeneratedSummary {
  clinicalNarrative: string;
  chiefFindings: string[];
  suggestedClinicalFocus: string[];
  disclaimer: string;
  diagnosticClaim: 'NONE';
}

export interface StructuredSourceProvenance {
  dataProvenance: 'PATIENT_REPORTED' | 'AI_GENERATED';
  intakeChannel: 'DocGenie Conversational Intake Portal';
  modelUsed: string;
  promptVersion: string;
  extractionEngine: 'DocGenie Clinical Parser v1.0.0';
  isPatientVerified: boolean;
}

export interface StructuredTimestampsVersion {
  schemaVersion: '1.0.0';
  intakeCompletedAt: string;
  conversionTimestamp: string;
  lastModified: string;
}

export interface StructuredValidationStatus {
  isValid: boolean;
  schemaCompliant: boolean;
  validatedAt: string;
  checkedFieldsCount: number;
  missingDataGuessed: false;
  errors: string[];
  warnings: string[];
}

export interface ValidatedStructuredIntakeRecord {
  id: string;
  caseId?: string;
  patientId: string;
  uhid: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  department: string;
  chiefComplaint: string;
  onsetDuration: StructuredOnsetDuration;
  symptomDetails: StructuredSymptomDetails;
  associatedSymptoms: string[];
  relevantHistory: StructuredRelevantHistory;
  medications: StructuredMedicationItem[];
  allergies: StructuredAllergyItem[];
  familySocialHistory: StructuredFamilySocialHistory;
  referencedDocuments: StructuredReferencedDocument[];
  unknownMissingFields: StructuredUnknownMissingField[];
  reviewFlags: StructuredReviewFlagItem[];
  aiGeneratedSummary: StructuredAiGeneratedSummary;
  sourceProvenance: StructuredSourceProvenance;
  timestampsVersion: StructuredTimestampsVersion;
  validationStatus: StructuredValidationStatus;
  supabaseSyncStatus?: {
    isSynced: boolean;
    syncedAt?: string;
    targetTable: string;
    notice?: string;
  };
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
  reviewFlags?: string[];
  conversationMessages?: IntakeChatMessage[];
  structuredRecord?: ValidatedStructuredIntakeRecord;
  referencedDocuments?: StructuredReferencedDocument[];
}


