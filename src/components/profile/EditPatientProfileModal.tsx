import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertOctagon,
  Pill,
  HeartPulse,
  History,
  ShieldAlert,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import {
  SyntheticPatient,
  PatientGender,
  PatientMedication,
  EmergencyContactInfo,
  RelevantMedicalHistory
} from '../../types';
import { Button } from '../common/Button';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

interface EditPatientProfileModalProps {
  patient: SyntheticPatient;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<SyntheticPatient>) => void;
  onResetToDefault?: () => void;
}

const COMMON_ALLERGIES = [
  'Penicillin',
  'Sulfa drugs',
  'Amoxicillin',
  'Aspirin / NSAIDs',
  'Latex',
  'Peanuts',
  'Dust mites',
  'No Known Drug Allergies (NKDA)',
];

const COMMON_CONDITIONS = [
  'Mild Hypertension',
  'Type 2 Diabetes Mellitus',
  'Bronchial Asthma',
  'Hypothyroidism',
  'Dyslipidemia',
  'GERD / Acid Reflux',
  'Allergic Rhinitis',
  'No chronic conditions reported',
];

export const EditPatientProfileModal: React.FC<EditPatientProfileModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSave,
  onResetToDefault,
}) => {
  // Core Profile Fields
  const [fullName, setFullName] = useState(patient.fullName);
  const [dateOfBirth, setDateOfBirth] = useState(patient.dateOfBirth || '1988-05-14');
  const [age, setAge] = useState<number>(patient.age || 38);
  const [gender, setGender] = useState<PatientGender>(patient.gender || 'Male');
  const [bloodGroup, setBloodGroup] = useState(patient.bloodGroup || 'B+');
  
  // Contact
  const [phone, setPhone] = useState(patient.phone || '');
  const [email, setEmail] = useState(patient.email || '');
  const [address, setAddress] = useState(patient.address || '');

  // Allergies List
  const [allergies, setAllergies] = useState<string[]>(patient.allergies || []);
  const [newAllergyInput, setNewAllergyInput] = useState('');

  // Medications List
  const [medications, setMedications] = useState<PatientMedication[]>(
    patient.medications && patient.medications.length > 0
      ? patient.medications
      : []
  );

  // New medication form draft
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('');
  const [newMedIndication, setNewMedIndication] = useState('');
  const [isAddingMed, setIsAddingMed] = useState(false);

  // Known Conditions List
  const [chronicConditions, setChronicConditions] = useState<string[]>(
    patient.chronicConditions || []
  );
  const [newConditionInput, setNewConditionInput] = useState('');

  // Relevant History
  const [relevantHistory, setRelevantHistory] = useState<RelevantMedicalHistory>({
    pastSurgicalHistory: patient.relevantHistory?.pastSurgicalHistory || '',
    familyHistory: patient.relevantHistory?.familyHistory || '',
    lifestyleNotes: patient.relevantHistory?.lifestyleNotes || '',
    generalMedicalNotes: patient.relevantHistory?.generalMedicalNotes || '',
  });

  // Optional Emergency Contact
  const [hasEmergencyContact, setHasEmergencyContact] = useState<boolean>(
    Boolean(patient.emergencyContact?.name || patient.emergencyContact?.phone)
  );
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContactInfo>({
    name: patient.emergencyContact?.name || '',
    relationship: patient.emergencyContact?.relationship || 'Spouse',
    phone: patient.emergencyContact?.phone || '',
  });

  // Form error & active tab
  const [activeSection, setActiveSection] = useState<
    'demographics' | 'clinical' | 'history' | 'emergency'
  >('demographics');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync form state whenever modal is opened or patient updates
  useEffect(() => {
    if (isOpen && patient) {
      setFullName(patient.fullName || '');
      setDateOfBirth(patient.dateOfBirth || '1988-05-14');
      setAge(typeof patient.age === 'number' ? patient.age : 38);
      setGender(patient.gender || 'Male');
      setBloodGroup(patient.bloodGroup || 'B+');
      setPhone(patient.phone || '');
      setEmail(patient.email || '');
      setAddress(patient.address || '');
      setAllergies(Array.isArray(patient.allergies) ? [...patient.allergies] : []);
      setMedications(
        Array.isArray(patient.medications)
          ? patient.medications.map((m) => ({ ...m }))
          : []
      );
      setChronicConditions(
        Array.isArray(patient.chronicConditions) ? [...patient.chronicConditions] : []
      );
      setRelevantHistory({
        pastSurgicalHistory: patient.relevantHistory?.pastSurgicalHistory || '',
        familyHistory: patient.relevantHistory?.familyHistory || '',
        lifestyleNotes: patient.relevantHistory?.lifestyleNotes || '',
        generalMedicalNotes: patient.relevantHistory?.generalMedicalNotes || '',
      });
      setHasEmergencyContact(
        Boolean(patient.emergencyContact?.name || patient.emergencyContact?.phone)
      );
      setEmergencyContact({
        name: patient.emergencyContact?.name || '',
        relationship: patient.emergencyContact?.relationship || 'Spouse',
        phone: patient.emergencyContact?.phone || '',
      });
      setFormError(null);
      setIsAddingMed(false);
      setNewAllergyInput('');
      setNewConditionInput('');
    }
  }, [isOpen, patient]);

  if (!isOpen) return null;

  // Auto-calculate age when DOB changes
  const handleDobChange = (dobString: string) => {
    setDateOfBirth(dobString);
    if (dobString) {
      const birth = new Date(dobString);
      const now = new Date();
      let calculatedAge = now.getFullYear() - birth.getFullYear();
      const monthDiff = now.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 0 && calculatedAge < 130) {
        setAge(calculatedAge);
      }
    }
  };

  // Allergy handlers
  const handleAddAllergy = (allergyText?: string) => {
    const text = (allergyText || newAllergyInput).trim();
    if (!text) return;
    if (!allergies.includes(text)) {
      setAllergies([...allergies, text]);
    }
    setNewAllergyInput('');
  };

  const handleRemoveAllergy = (indexToRemove: number) => {
    setAllergies(allergies.filter((_, idx) => idx !== indexToRemove));
  };

  // Medication handlers
  const handleAddMedication = () => {
    if (!newMedName.trim()) {
      setFormError('Medication name is required.');
      return;
    }
    const newMed: PatientMedication = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || 'Standard Dose',
      frequency: newMedFreq.trim() || 'Once daily',
      indication: newMedIndication.trim() || 'Self-reported medication',
      startDate: new Date().toISOString().split('T')[0],
    };
    setMedications([...medications, newMed]);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedFreq('');
    setNewMedIndication('');
    setIsAddingMed(false);
    setFormError(null);
  };

  const handleRemoveMedication = (idToRemove: string) => {
    setMedications(medications.filter((m) => m.id !== idToRemove));
  };

  // Condition handlers
  const handleAddCondition = (condText?: string) => {
    const text = (condText || newConditionInput).trim();
    if (!text) return;
    if (!chronicConditions.includes(text)) {
      setChronicConditions([...chronicConditions, text]);
    }
    setNewConditionInput('');
  };

  const handleRemoveCondition = (indexToRemove: number) => {
    setChronicConditions(chronicConditions.filter((_, idx) => idx !== indexToRemove));
  };

  // Save handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Patient Full Name is required.');
      setActiveSection('demographics');
      return;
    }
    if (!phone.trim()) {
      setFormError('Contact phone number is required.');
      setActiveSection('demographics');
      return;
    }

    const updatedProfile: Partial<SyntheticPatient> = {
      fullName: fullName.trim(),
      age: Number(age) || 0,
      dateOfBirth,
      gender,
      bloodGroup,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      allergies,
      medications,
      chronicConditions,
      relevantHistory,
      emergencyContact: hasEmergencyContact && emergencyContact.name.trim()
        ? {
            name: emergencyContact.name.trim(),
            relationship: emergencyContact.relationship.trim() || 'Family',
            phone: emergencyContact.phone.trim() || 'Not provided',
          }
        : undefined,
    };

    onSave(updatedProfile);
    onClose();
  };

  return (
    <div
      id="edit-patient-profile-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in"
    >
      <div
        id="edit-patient-profile-modal"
        className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Edit Patient Health Profile
                </h3>
                <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
              </div>
              <p className="text-xs text-slate-500">
                UHID: <strong className="font-mono text-slate-700">{patient.uhid}</strong> • Synthetic Patient Record
              </p>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Data Provenance & Safety Notice */}
        <div className="px-6 py-2.5 bg-emerald-50/70 border-b border-emerald-100 text-[11px] text-emerald-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>
              <strong>Patient-Provided Data Tier:</strong> Changes made here are saved directly as self-reported medical baseline and will be clearly labeled to clinicians.
            </span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[10px] bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded">
            No AI Alteration
          </span>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            id="tab-demographics"
            onClick={() => setActiveSection('demographics')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'demographics'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Demographics & Contact</span>
          </button>
          <button
            type="button"
            id="tab-clinical"
            onClick={() => setActiveSection('clinical')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'clinical'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>2. Allergies & Medications</span>
            {(allergies.length > 0 || medications.length > 0) && (
              <span className="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {allergies.length + medications.length}
              </span>
            )}
          </button>
          <button
            type="button"
            id="tab-history"
            onClick={() => setActiveSection('history')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'history'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>3. Conditions & Medical History</span>
          </button>
          <button
            type="button"
            id="tab-emergency"
            onClick={() => setActiveSection('emergency')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'emergency'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>4. Emergency Contact</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* TAB 1: Demographics & Contact */}
          {activeSection === 'demographics' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-700" />
                  <span>Personal Demographics</span>
                </h4>
                <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="input-full-name" className="block font-semibold text-slate-700 mb-1">
                    Full Legal / Preferred Name *
                  </label>
                  <div className="relative">
                    <input
                      id="input-full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="input-dob" className="block font-semibold text-slate-700 mb-1">
                    Date of Birth (DOB) *
                  </label>
                  <div className="relative">
                    <input
                      id="input-dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => handleDobChange(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Age auto-computes from date of birth
                  </span>
                </div>

                {/* Age */}
                <div>
                  <label htmlFor="input-age" className="block font-semibold text-slate-700 mb-1">
                    Age (Years) *
                  </label>
                  <input
                    id="input-age"
                    type="number"
                    min="0"
                    max="125"
                    required
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                {/* Sex / Gender */}
                <div>
                  <label htmlFor="select-gender" className="block font-semibold text-slate-700 mb-1">
                    Sex / Gender Assigned *
                  </label>
                  <select
                    id="select-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as PatientGender)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label htmlFor="select-blood-group" className="block font-semibold text-slate-700 mb-1">
                    Blood Group (Optional)
                  </label>
                  <select
                    id="select-blood-group"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                  Contact Information
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-phone" className="block font-semibold text-slate-700 mb-1">
                      Primary Contact Phone *
                    </label>
                    <div className="relative">
                      <input
                        id="input-phone"
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210 (Demo)"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none font-mono"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="input-email" className="block font-semibold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <input
                        id="input-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="patient@demo.docgenie.in"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="input-address" className="block font-semibold text-slate-700 mb-1">
                      Residential Address / City
                    </label>
                    <div className="relative">
                      <input
                        id="input-address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Flat 402, Greenfield Residency, Aundh, Pune"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Allergies & Medications */}
          {activeSection === 'clinical' && (
            <div className="space-y-6 text-xs">
              {/* Allergies Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-rose-900">
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                      <span>Known Allergies & Adverse Reactions</span>
                    </h4>
                    <p className="text-slate-500 text-[11px]">
                      Drug allergies, food triggers, latex or environmental sensitivities.
                    </p>
                  </div>
                  <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                </div>

                {/* Existing Allergies Chips */}
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 min-h-[60px] flex flex-wrap gap-2 items-center">
                  {allergies.length === 0 ? (
                    <span className="text-slate-400 italic text-xs">
                      No allergies recorded yet. Add from suggestions below or type custom.
                    </span>
                  ) : (
                    allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-rose-300 rounded-full text-rose-900 font-medium text-xs shadow-2xs"
                      >
                        <span>{allergy}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(idx)}
                          className="text-rose-400 hover:text-rose-700 cursor-pointer rounded-full p-0.5"
                          title="Remove allergy"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Allergy Input */}
                <div className="flex gap-2">
                  <input
                    id="input-new-allergy"
                    type="text"
                    value={newAllergyInput}
                    onChange={(e) => setNewAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAllergy();
                      }
                    }}
                    placeholder="Type allergy and press Add (e.g. Penicillin, Sulfa, Peanuts)..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddAllergy()}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add
                  </Button>
                </div>

                {/* Quick Allergy Suggestions */}
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">
                    Quick Suggestions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_ALLERGIES.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleAddAllergy(item)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          allergies.includes(item)
                            ? 'bg-rose-100 border-rose-300 text-rose-800 font-semibold cursor-default'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-rose-50 hover:border-rose-200'
                        }`}
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Medications Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-teal-900">
                      <Pill className="w-4 h-4 text-teal-700" />
                      <span>Current Active Medications</span>
                    </h4>
                    <p className="text-slate-500 text-[11px]">
                      Prescription pharmaceuticals, over-the-counter drugs, vitamins & supplements.
                    </p>
                  </div>
                  <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                </div>

                {/* Current Meds List */}
                <div className="space-y-2">
                  {medications.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500">
                      No current medications reported.
                    </div>
                  ) : (
                    medications.map((med) => (
                      <div
                        key={med.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-teal-300 transition-colors"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                            <Pill className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{med.name}</span>
                              <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded">
                                {med.dosage}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              <span>Schedule: {med.frequency}</span>
                              {med.indication && (
                                <span className="ml-2 text-slate-400">• For: {med.indication}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(med.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Remove medication"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Medication Trigger / Box */}
                {!isAddingMed ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingMed(true)}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="text-teal-700 border-teal-300 hover:bg-teal-50"
                  >
                    Add Medication Entry
                  </Button>
                ) : (
                  <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 space-y-3">
                    <h5 className="font-bold text-teal-900 text-xs">New Medication Entry</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Medication / Brand Name *
                        </label>
                        <input
                          type="text"
                          value={newMedName}
                          onChange={(e) => setNewMedName(e.target.value)}
                          placeholder="e.g. Metformin, Telmisartan"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-600"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Dosage / Strength
                        </label>
                        <input
                          type="text"
                          value={newMedDosage}
                          onChange={(e) => setNewMedDosage(e.target.value)}
                          placeholder="e.g. 500 mg, 10 ml"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-600"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Frequency / Timing
                        </label>
                        <input
                          type="text"
                          value={newMedFreq}
                          onChange={(e) => setNewMedFreq(e.target.value)}
                          placeholder="e.g. Twice daily after meals"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-600"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Purpose / Indication (Optional)
                        </label>
                        <input
                          type="text"
                          value={newMedIndication}
                          onChange={(e) => setNewMedIndication(e.target.value)}
                          placeholder="e.g. Blood sugar control"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-teal-600"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingMed(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleAddMedication}
                        icon={<Check className="w-3.5 h-3.5" />}
                        className="bg-teal-700 hover:bg-teal-800 text-white"
                      >
                        Save Medication
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Conditions & Relevant History */}
          {activeSection === 'history' && (
            <div className="space-y-6 text-xs">
              {/* Known Chronic Conditions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-teal-700" />
                      <span>Known Conditions & Chronic Illnesses</span>
                    </h4>
                    <p className="text-slate-500 text-[11px]">
                      Pre-existing diagnoses, comorbidities, or long-standing health concerns.
                    </p>
                  </div>
                  <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[50px] flex flex-wrap gap-2 items-center">
                  {chronicConditions.length === 0 ? (
                    <span className="text-slate-400 italic text-xs">
                      No chronic conditions recorded.
                    </span>
                  ) : (
                    chronicConditions.map((cond, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded-full text-slate-800 font-medium text-xs shadow-2xs"
                      >
                        <span>{cond}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCondition(idx)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer rounded-full p-0.5"
                          title="Remove condition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    id="input-new-condition"
                    type="text"
                    value={newConditionInput}
                    onChange={(e) => setNewConditionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCondition();
                      }
                    }}
                    placeholder="Add known condition (e.g. Hypertension, Asthma)..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddCondition()}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CONDITIONS.map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => handleAddCondition(cond)}
                      className="text-[11px] px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      + {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Relevant History Sub-sections */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <History className="w-4 h-4 text-teal-700" />
                    <span>Relevant Medical & Surgical History</span>
                  </h4>
                  <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
                </div>

                {/* Past Surgical */}
                <div>
                  <label htmlFor="input-past-surgical" className="block font-semibold text-slate-700 mb-1">
                    Past Surgical History & Hospitalizations
                  </label>
                  <textarea
                    id="input-past-surgical"
                    rows={2}
                    value={relevantHistory.pastSurgicalHistory || ''}
                    onChange={(e) =>
                      setRelevantHistory({
                        ...relevantHistory,
                        pastSurgicalHistory: e.target.value,
                      })
                    }
                    placeholder="e.g. Laparoscopic appendectomy in 2018 (uncomplicated, full recovery)"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                {/* Family History */}
                <div>
                  <label htmlFor="input-family-history" className="block font-semibold text-slate-700 mb-1">
                    Family Medical History
                  </label>
                  <textarea
                    id="input-family-history"
                    rows={2}
                    value={relevantHistory.familyHistory || ''}
                    onChange={(e) =>
                      setRelevantHistory({
                        ...relevantHistory,
                        familyHistory: e.target.value,
                      })
                    }
                    placeholder="e.g. Father diagnosed with hypertension; Mother has no chronic illnesses"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                {/* Lifestyle Notes */}
                <div>
                  <label htmlFor="input-lifestyle" className="block font-semibold text-slate-700 mb-1">
                    Lifestyle & Habit Notes (Tobacco, Alcohol, Physical Activity, Diet)
                  </label>
                  <textarea
                    id="input-lifestyle"
                    rows={2}
                    value={relevantHistory.lifestyleNotes || ''}
                    onChange={(e) =>
                      setRelevantHistory({
                        ...relevantHistory,
                        lifestyleNotes: e.target.value,
                      })
                    }
                    placeholder="e.g. Non-smoker, occasional social drink, vegetarian diet, 30 min daily walking"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                {/* General Notes */}
                <div>
                  <label htmlFor="input-general-medical" className="block font-semibold text-slate-700 mb-1">
                    General Medical & Immunization Notes
                  </label>
                  <textarea
                    id="input-general-medical"
                    rows={2}
                    value={relevantHistory.generalMedicalNotes || ''}
                    onChange={(e) =>
                      setRelevantHistory({
                        ...relevantHistory,
                        generalMedicalNotes: e.target.value,
                      })
                    }
                    placeholder="e.g. Annual health check completed June 2026. Blood pressure stable on monotherapy."
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Optional Emergency Contact */}
          {activeSection === 'emergency' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-teal-700" />
                  <span>Optional Emergency Contact</span>
                </h4>
                <ProvenanceBadge source="PATIENT_REPORTED" size="sm" />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Include Emergency Contact on Patient Profile
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Accessible to triage and hospital staff during medical urgencies.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasEmergencyContact}
                    onChange={(e) => setHasEmergencyContact(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-700"></div>
                </label>
              </div>

              {hasEmergencyContact ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label htmlFor="input-emergency-name" className="block font-semibold text-slate-700 mb-1">
                      Emergency Contact Name *
                    </label>
                    <input
                      id="input-emergency-name"
                      type="text"
                      value={emergencyContact.name}
                      onChange={(e) =>
                        setEmergencyContact({
                          ...emergencyContact,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. Sunita Sharma"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="select-emergency-rel" className="block font-semibold text-slate-700 mb-1">
                      Relationship *
                    </label>
                    <select
                      id="select-emergency-rel"
                      value={emergencyContact.relationship}
                      onChange={(e) =>
                        setEmergencyContact({
                          ...emergencyContact,
                          relationship: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Child">Child</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="input-emergency-phone" className="block font-semibold text-slate-700 mb-1">
                      Emergency Phone Number *
                    </label>
                    <div className="relative">
                      <input
                        id="input-emergency-phone"
                        type="text"
                        value={emergencyContact.phone}
                        onChange={(e) =>
                          setEmergencyContact({
                            ...emergencyContact,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+91 98765 11111 (Demo)"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none font-mono"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50/70 border border-dashed border-slate-300 rounded-xl text-center text-slate-400">
                  No emergency contact designated. You can enable this anytime.
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onResetToDefault && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onResetToDefault}
                  icon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
                  className="text-xs text-slate-600 hover:text-slate-900"
                >
                  Reset to Seed Data
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                id="save-patient-profile-btn"
                type="submit"
                variant="primary"
                size="sm"
                icon={<Check className="w-4 h-4" />}
                className="bg-teal-700 hover:bg-teal-800 text-white"
              >
                Save Profile Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
