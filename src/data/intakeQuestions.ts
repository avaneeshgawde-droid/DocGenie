import { HistorySectionId, IntakeQuestion } from '../types';

export interface HistorySectionMeta {
  id: HistorySectionId;
  title: string;
  shortLabel: string;
  description: string;
  stepNumber: number;
}

export const HISTORY_SECTIONS: HistorySectionMeta[] = [
  {
    id: 'chief_complaint',
    title: 'Chief Complaint',
    shortLabel: 'Chief Complaint',
    description: 'Primary symptom or reason for medical consultation',
    stepNumber: 1,
  },
  {
    id: 'present_illness',
    title: 'History of Present Illness',
    shortLabel: 'Present Illness',
    description: 'Onset, duration, severity, and symptom progression',
    stepNumber: 2,
  },
  {
    id: 'associated_symptoms',
    title: 'Associated Symptoms',
    shortLabel: 'Associated Symptoms',
    description: 'Accompanying systemic or localized clinical signs',
    stepNumber: 3,
  },
  {
    id: 'medical_history',
    title: 'Past Medical History',
    shortLabel: 'Medical History',
    description: 'Pre-existing chronic conditions, surgeries, and past admissions',
    stepNumber: 4,
  },
  {
    id: 'medications_allergies',
    title: 'Medications & Allergies',
    shortLabel: 'Meds & Allergies',
    description: 'Prescription drugs, OTC supplements, and adverse reactions',
    stepNumber: 5,
  },
  {
    id: 'family_social_history',
    title: 'Family & Social History',
    shortLabel: 'Family / Social',
    description: 'Hereditary disease risks, habits, and occupational factors',
    stepNumber: 6,
  },
];

export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: 'q1_chief_complaint',
    sectionId: 'chief_complaint',
    sectionTitle: 'Chief Complaint',
    assistantPrompt:
      'Hello! I am your clinical intake assistant. To help the attending physician prepare for your consultation, what is the primary symptom or health concern bringing you in today?',
    contextHint: 'Describe your main symptom in your own words.',
    placeholder: 'e.g. Throbbing pain behind my forehead and mild fever since yesterday...',
    suggestedChips: [
      'Throat irritation & dry cough',
      'Persistent fever with body chills',
      'Abdominal pain & stomach discomfort',
      'Severe headache & light sensitivity',
      'Lower back stiffness & joint pain',
    ],
    isRequired: true,
  },
  {
    id: 'q2_duration_onset',
    sectionId: 'present_illness',
    sectionTitle: 'History of Present Illness',
    assistantPrompt:
      'How long have you had this issue, and did it begin suddenly or develop gradually over time?',
    contextHint: 'Specify the timeline and initial trigger if known.',
    placeholder: 'e.g. It began gradually 2 days ago and has gotten progressively sharper...',
    suggestedChips: [
      'Started < 24 hours ago (acute)',
      'Gradual onset over 2–3 days',
      'Began about 1 week ago',
      'Recurring intermittently for over a month',
      'Triggered suddenly after physical exertion',
    ],
    isRequired: true,
  },
  {
    id: 'q3_severity_progression',
    sectionId: 'present_illness',
    sectionTitle: 'History of Present Illness',
    assistantPrompt:
      'How would you rate the discomfort (Mild, Moderate, or Severe), and is it staying the same, improving, or getting worse?',
    contextHint: 'Help the doctor gauge the intensity and rate of change.',
    placeholder: 'e.g. Around 6 out of 10 in severity; worse when moving or coughing...',
    suggestedChips: [
      'Mild discomfort, stable throughout the day',
      'Moderate pain, gradually getting worse',
      'Severe pain, interfering with sleep and routine',
      'Fluctuates in waves throughout the day',
    ],
    isRequired: false,
  },
  {
    id: 'q4_associated_symptoms',
    sectionId: 'associated_symptoms',
    sectionTitle: 'Associated Symptoms',
    assistantPrompt:
      'Are you experiencing any other symptoms alongside your main complaint (such as fever, chills, nausea, dizziness, shortness of breath, or appetite loss)?',
    contextHint: 'Check for any accompanying signs your doctor should know about.',
    placeholder: 'e.g. Low-grade fever and fatigue, but no nausea or breathing difficulty...',
    suggestedChips: [
      'Low fever & general muscle fatigue',
      'Nausea & reduced appetite',
      'Dizziness or lightheadedness',
      'Sneezing, nasal congestion, runny nose',
      'No other noticeable symptoms',
    ],
    isRequired: false,
  },
  {
    id: 'q5_medical_history',
    sectionId: 'medical_history',
    sectionTitle: 'Past Medical History',
    assistantPrompt:
      'Do you have any diagnosed chronic medical conditions (e.g. hypertension, diabetes, asthma, thyroid disease) or any past surgical procedures?',
    contextHint: 'List known medical conditions or previous hospitalizations.',
    placeholder: 'e.g. Diagnosed with hypertension 3 years ago. Had appendectomy in 2018...',
    suggestedChips: [
      'Hypertension (high blood pressure)',
      'Type 2 Diabetes Mellitus',
      'Asthma / Respiratory allergies',
      'Thyroid disorder (Hypo / Hyper)',
      'No known pre-existing medical conditions',
    ],
    isRequired: false,
  },
  {
    id: 'q6_medications_allergies',
    sectionId: 'medications_allergies',
    sectionTitle: 'Medications & Allergies',
    assistantPrompt:
      'Are you currently taking any prescription drugs, OTC pain relievers, or daily supplements? Also, do you have any drug or food allergies?',
    contextHint: 'Critical for doctor to check safe drug interactions and contraindications.',
    placeholder: 'e.g. Taking Metformin 500mg once daily. Allergic to Penicillin (causes skin rash)...',
    suggestedChips: [
      'No regular medications taken',
      'Daily blood pressure prescription',
      'Took Paracetamol / Crocin earlier today',
      'Penicillin / Amoxicillin allergy',
      'No known drug allergies (NKDA)',
    ],
    isRequired: false,
  },
  {
    id: 'q7_family_social',
    sectionId: 'family_social_history',
    sectionTitle: 'Family & Social History',
    assistantPrompt:
      'Is there any family history of significant illness (e.g. heart disease, stroke, diabetes)? Any relevant lifestyle factors such as smoking, alcohol, or recent travel?',
    contextHint: 'Helps evaluate hereditary predisposition and lifestyle context.',
    placeholder: 'e.g. Mother has diabetes. Non-smoker, no recent out-of-town travel...',
    suggestedChips: [
      'Family history of cardiac disease',
      'Family history of diabetes',
      'Non-smoker, non-drinker',
      'High screen time / sedentary desk job',
      'No significant family or lifestyle risk factors',
    ],
    isRequired: false,
  },
];
