/**
 * DocGenie — Smart India Hackathon 2026
 * Module: Supabase Auth & Role-Based Access Control (RBAC)
 * 
 * Core product flow:
 * PATIENT → Login (Supabase or Isolated Demo) → Start Case → Pre-consultation intake
 *        → Completeness/Review Flags → Patient Confirmation
 *        → DOCTOR DASHBOARD → Verify/Edit → Final Record
 * 
 * Strict Role Isolation:
 * - Patient accounts cannot view Doctor review stations or sign clinical records.
 * - Doctor accounts cannot access patient intake portals directly.
 * - Isolated Demo Mode runs seamlessly without external network requirements when Supabase keys are not provided.
 */

import React, { useState, useEffect } from 'react';
import { AppRoute, SyntheticPatient, SyntheticDoctor, ClinicalCase } from './types';
import { SYNTHETIC_CASES, SYNTHETIC_PATIENTS, SYNTHETIC_DOCTORS } from './data/mockData';
import { getStoredCases, fetchStoredCasesAsync, saveStoredCase, saveStoredCases } from './lib/caseStorage';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { Navbar } from './components/common/Navbar';
import { SyntheticDataModal } from './components/common/SyntheticDataModal';
import { SupabaseConfigModal } from './components/common/SupabaseConfigModal';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PatientLoginView } from './components/views/PatientLoginView';
import { PatientDashboardView } from './components/views/PatientDashboardView';
import { StartCaseView } from './components/views/StartCaseView';
import { DoctorLoginView } from './components/views/DoctorLoginView';
import { DoctorDashboardView } from './components/views/DoctorDashboardView';
import { Activity, Database, Server, ShieldCheck } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

function DocGenieMain() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('docgenie_active_route_v1');
        if (saved) return saved as AppRoute;
      } catch {
        // ignore
      }
    }
    return 'patient_dashboard';
  });

  const handleNavigate = (route: AppRoute) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('docgenie_active_route_v1', route);
      } catch {
        // ignore
      }
    }
  };

  const [cases, setCases] = useState<ClinicalCase[]>(() => {
    return getStoredCases();
  });
  const [isSyntheticModalOpen, setIsSyntheticModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Dual-layer: Check Supabase on mount for persisted cases
  useEffect(() => {
    fetchStoredCasesAsync().then((cloudCases) => {
      if (cloudCases && cloudCases.length > 0) {
        setCases(cloudCases);
      }
    });
  }, []);

  const {
    currentRole,
    currentUser,
    activePatient,
    activeDoctor,
    loginAsDemoPatient,
    loginAsDemoDoctor,
    signOut,
  } = useAuth();

  // Handle Patient Login completion
  const handlePatientLoginSuccess = (patient: SyntheticPatient) => {
    loginAsDemoPatient(patient);
    handleNavigate('patient_dashboard');
  };

  // Handle Doctor Login completion
  const handleDoctorLoginSuccess = (doctor: SyntheticDoctor) => {
    loginAsDemoDoctor(doctor);
    handleNavigate('doctor_dashboard');
  };

  // Handle Quick Role Switch for Demo Exploration
  const handleQuickSwitchRole = (role: 'patient' | 'doctor' | 'guest') => {
    if (role === 'patient') {
      loginAsDemoPatient(SYNTHETIC_PATIENTS[0]);
      handleNavigate('patient_dashboard');
    } else if (role === 'doctor') {
      loginAsDemoDoctor(SYNTHETIC_DOCTORS[0]);
      handleNavigate('doctor_dashboard');
    } else {
      signOut();
      handleNavigate('patient_login');
    }
  };

  // Handle New Case Creation with dual-layer persistence
  const handleCreateCase = (newCase: ClinicalCase) => {
    setCases((prev) => {
      const updated = [newCase, ...prev.filter((c) => c.id !== newCase.id)];
      saveStoredCases(updated);
      return updated;
    });
    saveStoredCase(newCase);
  };

  // Handle Doctor Verification Update with dual-layer persistence
  const handleUpdateCase = (updatedCase: ClinicalCase) => {
    setCases((prev) => {
      const updated = prev.map((c) => (c.id === updatedCase.id ? updatedCase : c));
      saveStoredCases(updated);
      return updated;
    });
    saveStoredCase(updatedCase);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-teal-100 selection:text-teal-900 font-sans">
      {/* Top Clinical Safety Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Navigation Header */}
      <Navbar
        currentRoute={currentRoute}
        onRouteChange={handleNavigate}
        activePatient={activePatient}
        activeDoctor={activeDoctor}
        userRole={currentRole === 'DOCTOR' ? 'doctor' : currentRole === 'PATIENT' ? 'patient' : 'guest'}
        onOpenSyntheticModal={() => setIsSyntheticModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onQuickSwitchRole={handleQuickSwitchRole}
      />

      {/* Primary Workspace View with Role Isolation */}
      <main className="flex-1">
        {currentRoute === 'patient_login' && (
          <PatientLoginView
            onLoginSuccess={handlePatientLoginSuccess}
            onNavigateToDoctorLogin={() => handleNavigate('doctor_login')}
            onOpenSupabaseGuide={() => setIsSupabaseModalOpen(true)}
          />
        )}

        {currentRoute === 'patient_dashboard' && (
          <ProtectedRoute allowedRole="PATIENT" onNavigate={handleNavigate}>
            {activePatient ? (
              <PatientDashboardView
                patient={activePatient}
                cases={cases}
                onStartNewCase={() => handleNavigate('start_case')}
              />
            ) : (
              <PatientLoginView
                onLoginSuccess={handlePatientLoginSuccess}
                onNavigateToDoctorLogin={() => handleNavigate('doctor_login')}
              />
            )}
          </ProtectedRoute>
        )}

        {currentRoute === 'start_case' && (
          <ProtectedRoute allowedRole="PATIENT" onNavigate={handleNavigate}>
            <StartCaseView
              patient={activePatient || SYNTHETIC_PATIENTS[0]}
              onCreateCase={handleCreateCase}
              onCancel={() => handleNavigate('patient_dashboard')}
              onNavigateToDoctorDashboard={() => {
                loginAsDemoDoctor(SYNTHETIC_DOCTORS[0]);
                handleNavigate('doctor_dashboard');
              }}
            />
          </ProtectedRoute>
        )}

        {currentRoute === 'doctor_login' && (
          <DoctorLoginView
            onLoginSuccess={handleDoctorLoginSuccess}
            onNavigateToPatientLogin={() => handleNavigate('patient_login')}
          />
        )}

        {currentRoute === 'doctor_dashboard' && (
          <ProtectedRoute allowedRole="DOCTOR" onNavigate={handleNavigate}>
            <DoctorDashboardView
              doctor={activeDoctor || SYNTHETIC_DOCTORS[0]}
              cases={cases}
              onUpdateCase={handleUpdateCase}
            />
          </ProtectedRoute>
        )}
      </main>

      {/* Footer with Hackathon Notice, RBAC, & Guardrails */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal-700 flex items-center justify-center text-white text-xs font-bold">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-700">DocGenie</span>
            <span>•</span>
            <span>SIH 2026 Problem Statement PS-24 (Doctor Availability & Hospital Intake)</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="text-indigo-700 hover:text-indigo-800 font-medium cursor-pointer underline flex items-center gap-1"
            >
              <Server className="w-3 h-3" />
              <span>Supabase Schema &amp; Env</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSyntheticModalOpen(true)}
              className="text-amber-700 hover:text-amber-800 font-medium cursor-pointer underline flex items-center gap-1"
            >
              <Database className="w-3 h-3" />
              <span>Synthetic Data Policy</span>
            </button>
            <span>•</span>
            <span className="text-slate-500">
              Role Isolation Active (PATIENT / DOCTOR)
            </span>
          </div>
        </div>
      </footer>

      {/* Synthetic Data Transparency Modal */}
      <SyntheticDataModal
        isOpen={isSyntheticModalOpen}
        onClose={() => setIsSyntheticModalOpen(false)}
      />

      {/* Supabase Schema & Configuration Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DocGenieMain />
    </AuthProvider>
  );
}
