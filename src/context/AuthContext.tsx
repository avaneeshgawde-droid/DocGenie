import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthRole, UserProfile, SyntheticPatient, SyntheticDoctor } from '../types';
import { SYNTHETIC_PATIENTS, SYNTHETIC_DOCTORS } from '../data/mockData';
import { supabase, isSupabaseReady } from '../lib/supabase';
import { config } from '../config/env';
import {
  getActivePatient,
  getStoredPatientById,
  saveStoredPatient,
  setActivePatientId,
  resetStoredPatientToDefault,
} from '../lib/patientStorage';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentRole: AuthRole;
  activePatient: SyntheticPatient | null;
  activeDoctor: SyntheticDoctor | null;
  isSupabaseConfigured: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  authError: string | null;
  signInWithEmail: (email: string, password: string, targetRole: 'PATIENT' | 'DOCTOR') => Promise<boolean>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string,
    targetRole: 'PATIENT' | 'DOCTOR',
    extra?: { uhid?: string; department?: string; specialization?: string; medicalRegNumber?: string }
  ) => Promise<{ success: boolean; message?: string }>;
  loginAsDemoPatient: (patient: SyntheticPatient) => void;
  loginAsDemoDoctor: (doctor: SyntheticDoctor) => void;
  updatePatientProfile: (updatedProfile: Partial<SyntheticPatient>) => Promise<void> | void;
  signOut: () => Promise<void>;
  clearError: () => void;
  setDemoMode: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseReady();
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isConfigured);
  const [isLoading, setIsLoading] = useState<boolean>(isConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active role and profiles (initialized from persistent storage)
  const [currentRole, setCurrentRole] = useState<AuthRole>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('docgenie_active_role_v1');
        if (saved === 'PATIENT' || saved === 'DOCTOR' || saved === 'GUEST') {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return 'PATIENT';
  });

  const [activePatient, setActivePatient] = useState<SyntheticPatient | null>(() => {
    return getActivePatient();
  });
  const [activeDoctor, setActiveDoctor] = useState<SyntheticDoctor | null>(SYNTHETIC_DOCTORS[0]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const p = getActivePatient();
    return {
      id: p.id,
      email: p.email || `${p.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@demo.docgenie.in`,
      fullName: p.fullName,
      role: 'PATIENT',
      uhid: p.uhid,
      phone: p.phone,
      isDemoUser: true,
    };
  });

  // Track role changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docgenie_active_role_v1', currentRole);
      } catch {
        // ignore
      }
    }
  }, [currentRole]);

  // In demo mode or offline, ensure active patient is hydrated from persistent localStorage on mount
  useEffect(() => {
    if (!isConfigured || isDemoMode) {
      const persisted = getActivePatient();
      if (persisted) {
        setActivePatient(persisted);
        setCurrentUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            id: persisted.id,
            fullName: persisted.fullName,
            phone: persisted.phone,
            uhid: persisted.uhid,
          };
        });
      }
    }
  }, [isConfigured, isDemoMode]);

  // Listen to Supabase auth events if configured
  useEffect(() => {
    if (!isConfigured || !supabase || isDemoMode) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function checkCurrentSession() {
      try {
        const { data, error } = await supabase!.auth.getSession();
        if (error) {
          console.warn('Supabase getSession error:', error.message);
          if (isMounted) setIsLoading(false);
          return;
        }

        if (data?.session?.user && isMounted) {
          const sbUser = data.session.user;
          const userMetaRole = (sbUser.user_metadata?.role as string)?.toUpperCase();
          const targetRole: 'PATIENT' | 'DOCTOR' = userMetaRole === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

          // Try to fetch profile from public.profiles table
          let dbProfile: Record<string, unknown> | null = null;
          try {
            const profileRes = await supabase!
              .from('profiles')
              .select('*')
              .eq('id', sbUser.id)
              .maybeSingle();
            if (!profileRes.error && profileRes.data) {
              dbProfile = profileRes.data as Record<string, unknown>;
            }
          } catch {
            // profiles table might not exist yet; gracefully fallback to metadata
          }

          // Try to fetch patient details from public.patients table if available
          let dbPatient: Record<string, unknown> | null = null;
          try {
            const patientRes = await supabase!
              .from('patients')
              .select('*')
              .eq('id', sbUser.id)
              .maybeSingle();
            if (!patientRes.error && patientRes.data) {
              dbPatient = patientRes.data as Record<string, unknown>;
            }
          } catch {
            // patients table is optional
          }

          const effectiveRole: 'PATIENT' | 'DOCTOR' =
            (dbProfile?.role as string)?.toUpperCase() === 'DOCTOR' || targetRole === 'DOCTOR'
              ? 'DOCTOR'
              : 'PATIENT';

          const profile: UserProfile = {
            id: sbUser.id,
            email: sbUser.email || 'user@hospital.in',
            fullName:
              (dbPatient?.full_name as string) ||
              (dbPatient?.fullName as string) ||
              (dbProfile?.full_name as string) ||
              sbUser.user_metadata?.full_name ||
              (effectiveRole === 'DOCTOR' ? 'Dr. Staff Clinician' : 'Hospital Patient'),
            role: effectiveRole,
            uhid: (dbPatient?.uhid as string) || (dbProfile?.uhid as string) || sbUser.user_metadata?.uhid || 'UHID-REG-2026-LIVE',
            phone: (dbPatient?.phone as string) || (dbProfile?.phone as string) || sbUser.user_metadata?.phone,
            medicalRegNumber:
              (dbProfile?.medical_reg_number as string) || sbUser.user_metadata?.medical_reg_number,
            department: (dbProfile?.department as string) || sbUser.user_metadata?.department,
            specialization:
              (dbProfile?.specialization as string) || sbUser.user_metadata?.specialization,
            isDemoUser: false,
          };

          setCurrentUser(profile);
          setCurrentRole(effectiveRole);

          if (effectiveRole === 'PATIENT') {
            // Resolve existing saved profile or fallback to initial synthetic seed
            const localStored = getStoredPatientById(sbUser.id) || getStoredPatientById(profile.uhid);
            const seedFallback = SYNTHETIC_PATIENTS[0];

            const patientRecord: SyntheticPatient = {
              id: profile.id,
              uhid: profile.uhid,
              fullName: profile.fullName,
              age:
                typeof dbPatient?.age === 'number'
                  ? dbPatient.age
                  : typeof dbProfile?.age === 'number'
                  ? dbProfile.age
                  : typeof localStored?.age === 'number'
                  ? localStored.age
                  : seedFallback.age,
              dateOfBirth:
                (dbPatient?.date_of_birth as string) ||
                (dbPatient?.dateOfBirth as string) ||
                (dbProfile?.date_of_birth as string) ||
                localStored?.dateOfBirth ||
                seedFallback.dateOfBirth,
              gender:
                (dbPatient?.gender as any) ||
                (dbProfile?.gender as any) ||
                localStored?.gender ||
                seedFallback.gender,
              phone: profile.phone || localStored?.phone || seedFallback.phone,
              email: profile.email || localStored?.email || seedFallback.email,
              address:
                (dbPatient?.address as string) ||
                (dbProfile?.address as string) ||
                localStored?.address ||
                seedFallback.address,
              bloodGroup:
                (dbPatient?.blood_group as string) ||
                (dbPatient?.bloodGroup as string) ||
                (dbProfile?.blood_group as string) ||
                localStored?.bloodGroup ||
                seedFallback.bloodGroup,
              allergies: Array.isArray(dbPatient?.allergies)
                ? dbPatient!.allergies
                : Array.isArray(dbProfile?.allergies)
                ? dbProfile!.allergies
                : Array.isArray(localStored?.allergies)
                ? localStored!.allergies
                : seedFallback.allergies,
              medications: Array.isArray(dbPatient?.medications)
                ? dbPatient!.medications
                : Array.isArray(dbProfile?.medications)
                ? dbProfile!.medications
                : Array.isArray(localStored?.medications)
                ? localStored!.medications
                : seedFallback.medications,
              chronicConditions: Array.isArray(dbPatient?.chronic_conditions)
                ? dbPatient!.chronic_conditions
                : Array.isArray(dbPatient?.chronicConditions)
                ? dbPatient!.chronicConditions
                : Array.isArray(dbProfile?.chronic_conditions)
                ? dbProfile!.chronic_conditions
                : Array.isArray(localStored?.chronicConditions)
                ? localStored!.chronicConditions
                : seedFallback.chronicConditions,
              relevantHistory:
                (dbPatient?.relevant_history as any) ||
                (dbPatient?.relevantHistory as any) ||
                (dbProfile?.relevant_history as any) ||
                localStored?.relevantHistory ||
                seedFallback.relevantHistory,
              emergencyContact:
                (dbPatient?.emergency_contact as any) ||
                (dbPatient?.emergencyContact as any) ||
                (dbProfile?.emergency_contact as any) ||
                localStored?.emergencyContact ||
                seedFallback.emergencyContact,
              lastProfileUpdateDate:
                (dbProfile?.updated_at as string)?.split('T')[0] ||
                localStored?.lastProfileUpdateDate ||
                new Date().toISOString().split('T')[0],
            };

            setActivePatient(patientRecord);
            saveStoredPatient(patientRecord.id, patientRecord);
          } else {
            setActiveDoctor({
              id: profile.id,
              fullName: profile.fullName,
              title: 'Consultant',
              specialization: profile.specialization || 'Internal Medicine',
              department: profile.department || 'General Medicine OPD',
              medicalRegNumber: profile.medicalRegNumber || 'MCI-LIVE-2026',
              hospitalName: config.hospitalName,
              roomNumber: 'OPD Room 102',
            });
          }
        }
      } catch (err) {
        console.warn('Error reading Supabase session:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkCurrentSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentRole('GUEST');
        setActivePatient(null);
        setActiveDoctor(null);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Handled by signInWithEmail or checkCurrentSession
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [isConfigured, isDemoMode]);

  // Sign in with Email & Password
  const signInWithEmail = async (
    email: string,
    password: string,
    targetRole: 'PATIENT' | 'DOCTOR'
  ): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      // 1. If Supabase is configured and not in isolated demo mode:
      if (isConfigured && supabase && !isDemoMode) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setAuthError(error.message);
          setIsLoading(false);
          return false;
        }

        if (!data.user) {
          setAuthError('Authentication failed: No user returned.');
          setIsLoading(false);
          return false;
        }

        // Query profiles table to determine authoritative role
        let userRole: 'PATIENT' | 'DOCTOR' = targetRole;
        try {
          const profileRes = await supabase
            .from('profiles')
            .select('role, full_name, uhid, medical_reg_number, department, specialization')
            .eq('id', data.user.id)
            .maybeSingle();

          if (!profileRes.error && profileRes.data?.role) {
            userRole = String(profileRes.data.role).toUpperCase() as 'PATIENT' | 'DOCTOR';
          } else if (data.user.user_metadata?.role) {
            userRole = String(data.user.user_metadata.role).toUpperCase() as 'PATIENT' | 'DOCTOR';
          }
        } catch {
          // If table query fails, fallback to user metadata
          if (data.user.user_metadata?.role) {
            userRole = String(data.user.user_metadata.role).toUpperCase() as 'PATIENT' | 'DOCTOR';
          }
        }

        // STRICT ROLE ENFORCEMENT: Patient cannot log into Doctor portal & vice versa
        if (userRole !== targetRole) {
          await supabase.auth.signOut();
          setAuthError(
            `Role Mismatch: This account is registered with role [${userRole}]. You cannot sign into the [${targetRole}] portal with these credentials.`
          );
          setIsLoading(false);
          return false;
        }

        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName:
            data.user.user_metadata?.full_name ||
            (targetRole === 'DOCTOR' ? 'Dr. Verified Clinician' : 'Hospital Patient'),
          role: targetRole,
          uhid: data.user.user_metadata?.uhid || 'UHID-LIVE-2026',
          medicalRegNumber: data.user.user_metadata?.medical_reg_number,
          department: data.user.user_metadata?.department || 'General Medicine OPD',
          specialization: data.user.user_metadata?.specialization || 'Clinical Medicine',
          isDemoUser: false,
        };

        setCurrentUser(profile);
        setCurrentRole(targetRole);

        if (targetRole === 'PATIENT') {
          // Check for existing profile in Supabase or local storage
          let dbPatientData: Record<string, unknown> | null = null;
          try {
            const patRes = await supabase
              .from('patients')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();
            if (!patRes.error && patRes.data) {
              dbPatientData = patRes.data as Record<string, unknown>;
            }
          } catch {
            // patients table is optional
          }

          let dbProfileData: Record<string, unknown> | null = null;
          try {
            const profRes = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();
            if (!profRes.error && profRes.data) {
              dbProfileData = profRes.data as Record<string, unknown>;
            }
          } catch {
            // profiles table query fallback
          }

          const localStored = getStoredPatientById(data.user.id) || getStoredPatientById(profile.uhid);
          const seedFallback = SYNTHETIC_PATIENTS[0];

          const patientRecord: SyntheticPatient = {
            id: profile.id,
            uhid: profile.uhid,
            fullName:
              (dbPatientData?.full_name as string) ||
              (dbPatientData?.fullName as string) ||
              (dbProfileData?.full_name as string) ||
              profile.fullName,
            age:
              typeof dbPatientData?.age === 'number'
                ? dbPatientData.age
                : typeof dbProfileData?.age === 'number'
                ? dbProfileData.age
                : typeof localStored?.age === 'number'
                ? localStored.age
                : seedFallback.age,
            dateOfBirth:
              (dbPatientData?.date_of_birth as string) ||
              (dbPatientData?.dateOfBirth as string) ||
              (dbProfileData?.date_of_birth as string) ||
              localStored?.dateOfBirth ||
              seedFallback.dateOfBirth,
            gender:
              (dbPatientData?.gender as any) ||
              (dbProfileData?.gender as any) ||
              localStored?.gender ||
              seedFallback.gender,
            phone:
              (dbPatientData?.phone as string) ||
              (dbProfileData?.phone as string) ||
              profile.phone ||
              localStored?.phone ||
              seedFallback.phone,
            email: profile.email || localStored?.email || seedFallback.email,
            address:
              (dbPatientData?.address as string) ||
              (dbProfileData?.address as string) ||
              localStored?.address ||
              seedFallback.address,
            bloodGroup:
              (dbPatientData?.blood_group as string) ||
              (dbPatientData?.bloodGroup as string) ||
              (dbProfileData?.blood_group as string) ||
              localStored?.bloodGroup ||
              seedFallback.bloodGroup,
            allergies: Array.isArray(dbPatientData?.allergies)
              ? dbPatientData!.allergies
              : Array.isArray(dbProfileData?.allergies)
              ? dbProfileData!.allergies
              : Array.isArray(localStored?.allergies)
              ? localStored!.allergies
              : seedFallback.allergies,
            medications: Array.isArray(dbPatientData?.medications)
              ? dbPatientData!.medications
              : Array.isArray(dbProfileData?.medications)
              ? dbProfileData!.medications
              : Array.isArray(localStored?.medications)
              ? localStored!.medications
              : seedFallback.medications,
            chronicConditions: Array.isArray(dbPatientData?.chronic_conditions)
              ? dbPatientData!.chronic_conditions
              : Array.isArray(dbPatientData?.chronicConditions)
              ? dbPatientData!.chronicConditions
              : Array.isArray(dbProfileData?.chronic_conditions)
              ? dbProfileData!.chronic_conditions
              : Array.isArray(localStored?.chronicConditions)
              ? localStored!.chronicConditions
              : seedFallback.chronicConditions,
            relevantHistory:
              (dbPatientData?.relevant_history as any) ||
              (dbPatientData?.relevantHistory as any) ||
              (dbProfileData?.relevant_history as any) ||
              localStored?.relevantHistory ||
              seedFallback.relevantHistory,
            emergencyContact:
              (dbPatientData?.emergency_contact as any) ||
              (dbPatientData?.emergencyContact as any) ||
              (dbProfileData?.emergency_contact as any) ||
              localStored?.emergencyContact ||
              seedFallback.emergencyContact,
            lastProfileUpdateDate:
              (dbProfileData?.updated_at as string)?.split('T')[0] ||
              localStored?.lastProfileUpdateDate ||
              new Date().toISOString().split('T')[0],
          };

          setActivePatient(patientRecord);
          saveStoredPatient(patientRecord.id, patientRecord);
        } else {
          setActiveDoctor({
            id: profile.id,
            fullName: profile.fullName,
            title: 'Consultant',
            specialization: profile.specialization || 'General Medicine',
            department: profile.department || 'General Medicine OPD',
            medicalRegNumber: profile.medicalRegNumber || 'MCI-LIVE-2026',
            hospitalName: config.hospitalName,
            roomNumber: 'Room 204',
          });
        }

        setIsLoading(false);
        return true;
      }

      // 2. ISOLATED DEMO MODE AUTHENTICATION
      await new Promise((res) => setTimeout(res, 400)); // simulated latency

      if (targetRole === 'DOCTOR') {
        const doc = SYNTHETIC_DOCTORS[0];
        loginAsDemoDoctor(doc);
      } else {
        const pat = SYNTHETIC_PATIENTS[0];
        loginAsDemoPatient(pat);
      }

      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(msg);
      setIsLoading(false);
      return false;
    }
  };

  // Sign up with Email & Password
  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    targetRole: 'PATIENT' | 'DOCTOR',
    extra?: { uhid?: string; department?: string; specialization?: string; medicalRegNumber?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      if (isConfigured && supabase && !isDemoMode) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: targetRole,
              ...extra,
            },
          },
        });

        if (error) {
          setAuthError(error.message);
          setIsLoading(false);
          return { success: false, message: error.message };
        }

        // Try inserting into profiles table if user is returned and table exists
        if (data.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email,
              full_name: fullName,
              role: targetRole,
              uhid: extra?.uhid || (targetRole === 'PATIENT' ? `UHID-SYN-${Date.now().toString().slice(-4)}` : null),
              department: extra?.department || null,
              specialization: extra?.specialization || null,
              medical_reg_number: extra?.medicalRegNumber || null,
            });
          } catch {
            // Silent fallback if profiles table hasn't been migrated yet
          }
        }

        setIsLoading(false);
        return {
          success: true,
          message: data.session
            ? 'Account created and signed in successfully!'
            : 'Account registered! Please check your email to verify your address if email confirmation is enabled.',
        };
      }

      // Demo mode sign-up simulation
      await new Promise((res) => setTimeout(res, 400));
      if (targetRole === 'DOCTOR') {
        const doc: SyntheticDoctor = {
          ...SYNTHETIC_DOCTORS[0],
          id: `doc-demo-${Date.now()}`,
          fullName,
          medicalRegNumber: extra?.medicalRegNumber || 'MCI-DEMO-2026',
        };
        loginAsDemoDoctor(doc);
      } else {
        const pat: SyntheticPatient = {
          ...SYNTHETIC_PATIENTS[0],
          id: `pat-demo-${Date.now()}`,
          fullName,
          uhid: extra?.uhid || `UHID-DEMO-${Date.now().toString().slice(-4)}`,
        };
        loginAsDemoPatient(pat);
      }

      setIsLoading(false);
      return { success: true, message: 'Demo account registered and activated.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setAuthError(msg);
      setIsLoading(false);
      return { success: false, message: msg };
    }
  };

  // 1-Click Instant Demo Patient Login
  const loginAsDemoPatient = (patient: SyntheticPatient) => {
    setActivePatientId(patient.id);
    const fresh = getStoredPatientById(patient.id) || patient;
    setActivePatient(fresh);
    setCurrentRole('PATIENT');
    setCurrentUser({
      id: fresh.id,
      email: `${fresh.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@demo.docgenie.in`,
      fullName: fresh.fullName,
      role: 'PATIENT',
      uhid: fresh.uhid,
      phone: fresh.phone,
      isDemoUser: true,
    });
    setAuthError(null);
  };

  // 1-Click Instant Demo Doctor Login
  const loginAsDemoDoctor = (doctor: SyntheticDoctor) => {
    setActiveDoctor(doctor);
    setCurrentRole('DOCTOR');
    setCurrentUser({
      id: doctor.id,
      email: `${doctor.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@hospital.demo`,
      fullName: doctor.fullName,
      role: 'DOCTOR',
      department: doctor.department,
      specialization: doctor.specialization,
      medicalRegNumber: doctor.medicalRegNumber,
      isDemoUser: true,
    });
    setAuthError(null);
  };

  // Update Patient Profile Handler (Persists reliably to localStorage & Supabase)
  const updatePatientProfile = async (updatedProfile: Partial<SyntheticPatient>) => {
    if (!activePatient) return;
    
    // Save to durable localStorage persistence layer
    const saved = saveStoredPatient(activePatient.id, updatedProfile);
    
    // Update active patient in state
    setActivePatient(saved);

    // Sync name & phone with currentUser if changed
    setCurrentUser((prevUser) => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        fullName: saved.fullName,
        phone: saved.phone,
      };
    });

    // If Supabase is configured and not in isolated demo mode, persist to database
    if (isConfigured && supabase && !isDemoMode) {
      try {
        const todayDate = new Date().toISOString();

        // 1. Update profiles table
        const profileUpdates: Record<string, unknown> = {
          full_name: saved.fullName,
          phone: saved.phone,
          uhid: saved.uhid,
          updated_at: todayDate,
        };

        if (saved.age !== undefined) profileUpdates.age = saved.age;
        if (saved.dateOfBirth !== undefined) profileUpdates.date_of_birth = saved.dateOfBirth;
        if (saved.gender !== undefined) profileUpdates.gender = saved.gender;
        if (saved.bloodGroup !== undefined) profileUpdates.blood_group = saved.bloodGroup;
        if (saved.address !== undefined) profileUpdates.address = saved.address;
        if (saved.allergies !== undefined) profileUpdates.allergies = saved.allergies;
        if (saved.medications !== undefined) profileUpdates.medications = saved.medications;
        if (saved.chronicConditions !== undefined) profileUpdates.chronic_conditions = saved.chronicConditions;
        if (saved.relevantHistory !== undefined) profileUpdates.relevant_history = saved.relevantHistory;
        if (saved.emergencyContact !== undefined) profileUpdates.emergency_contact = saved.emergencyContact;

        const { error: pErr } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', activePatient.id);

        if (pErr) {
          // Fallback to updating known core columns
          await supabase
            .from('profiles')
            .update({
              full_name: saved.fullName,
              phone: saved.phone,
              uhid: saved.uhid,
              updated_at: todayDate,
            })
            .eq('id', activePatient.id);
        }

        // 2. Also try updating or upserting to patients table if available
        try {
          await supabase.from('patients').upsert({
            id: activePatient.id,
            uhid: saved.uhid,
            full_name: saved.fullName,
            phone: saved.phone,
            email: saved.email,
            age: saved.age,
            date_of_birth: saved.dateOfBirth,
            gender: saved.gender,
            blood_group: saved.bloodGroup,
            address: saved.address,
            allergies: saved.allergies,
            medications: saved.medications,
            chronic_conditions: saved.chronicConditions,
            relevant_history: saved.relevantHistory,
            emergency_contact: saved.emergencyContact,
            updated_at: todayDate,
          });
        } catch {
          // patients table is optional
        }
      } catch (err) {
        console.warn('Supabase profile update warning (localStorage preserved):', err);
      }
    }
  };

  // Keep activePatient synced across views and storage updates
  useEffect(() => {
    const handlePatientUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ patient: SyntheticPatient }>;
      if (customEvent?.detail?.patient) {
        const updated = customEvent.detail.patient;
        setActivePatient((prev) => {
          if (prev && (prev.id === updated.id || prev.uhid === updated.uhid)) {
            return updated;
          }
          return prev;
        });
      }
    };

    window.addEventListener('docgenie_patient_updated', handlePatientUpdate);
    return () => {
      window.removeEventListener('docgenie_patient_updated', handlePatientUpdate);
    };
  }, []);

  // Logout Handler
  const signOut = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      if (isConfigured && supabase && !isDemoMode) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setCurrentUser(null);
      setCurrentRole('GUEST');
      setActivePatient(null);
      setActiveDoctor(null);
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        activePatient,
        activeDoctor,
        isSupabaseConfigured: isConfigured,
        isDemoMode,
        isLoading,
        authError,
        signInWithEmail,
        signUpWithEmail,
        loginAsDemoPatient,
        loginAsDemoDoctor,
        updatePatientProfile,
        signOut,
        clearError,
        setDemoMode: setIsDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
