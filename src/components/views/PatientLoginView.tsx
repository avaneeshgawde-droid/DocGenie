import React, { useState } from 'react';
import {
  User,
  ArrowRight,
  ShieldCheck,
  Database,
  KeyRound,
  Sparkles,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Server,
  UserPlus
} from 'lucide-react';
import { SyntheticPatient } from '../../types';
import { SYNTHETIC_PATIENTS } from '../../data/mockData';
import { getStoredPatients } from '../../lib/patientStorage';
import { Card, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

interface PatientLoginViewProps {
  onLoginSuccess: (patient: SyntheticPatient) => void;
  onNavigateToDoctorLogin: () => void;
  onOpenSupabaseGuide?: () => void;
}

export const PatientLoginView: React.FC<PatientLoginViewProps> = ({
  onLoginSuccess,
  onNavigateToDoctorLogin,
  onOpenSupabaseGuide,
}) => {
  const {
    loginAsDemoPatient,
    signInWithEmail,
    signUpWithEmail,
    isLoading,
    authError,
    clearError,
    isSupabaseConfigured,
  } = useAuth();

  const [authTab, setAuthTab] = useState<'demo' | 'email'>('demo');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [uhidInput, setUhidInput] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // 1-Click Instant Demo Selection
  const handleDemoSelect = (patient: SyntheticPatient) => {
    loginAsDemoPatient(patient);
    onLoginSuccess(patient);
  };

  // Live Supabase or Demo Email/Password Submission
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessNotice(null);

    if (isSignUp) {
      if (!fullName.trim()) {
        return;
      }
      const res = await signUpWithEmail(email, password, fullName, 'PATIENT', {
        uhid: uhidInput.trim() || `UHID-PAT-${Date.now().toString().slice(-4)}`,
      });
      if (res.success) {
        setSuccessNotice(res.message || 'Registration complete! You may now sign in.');
        if (!isSupabaseConfigured) {
          // In demo mode, log them in straight away
          const newPat: SyntheticPatient = {
            ...SYNTHETIC_PATIENTS[0],
            id: `pat-${Date.now()}`,
            fullName,
            uhid: uhidInput || `UHID-${Date.now().toString().slice(-4)}`,
          };
          onLoginSuccess(newPat);
        }
      }
    } else {
      const ok = await signInWithEmail(email, password, 'PATIENT');
      if (ok) {
        onLoginSuccess(SYNTHETIC_PATIENTS[0]);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Smart Pre-Consultation Intake Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Patient Portal Sign In
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Prepare your medical pre-consultation before entering the hospital. Protected by role-based authorization.
        </p>

        {/* Auth Mode Pill */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs">
          <span className="text-slate-500">Authentication Mode:</span>
          <span
            className={`font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
              isSupabaseConfigured
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            <Server className="w-3 h-3" />
            <span>{isSupabaseConfigured ? 'Live Supabase Auth (Active)' : 'Isolated Demo Mode (Synthetic RBAC)'}</span>
          </span>
        </div>
      </div>

      {/* Error Alert Display */}
      {authError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Authentication Error</p>
              <p className="mt-0.5 leading-relaxed">{authError}</p>
            </div>
          </div>
          <button
            onClick={clearError}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Alert Display */}
      {successNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Auth Method Selector Tabs */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          id="patient-tab-demo"
          type="button"
          onClick={() => {
            setAuthTab('demo');
            clearError();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            authTab === 'demo'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Instant Demo Profiles (1-Click)</span>
        </button>

        <button
          id="patient-tab-email"
          type="button"
          onClick={() => {
            setAuthTab('email');
            clearError();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            authTab === 'email'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Supabase Email Auth ({isSupabaseConfigured ? 'Live' : 'Simulated'})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Primary Auth form depending on tab */}
        <div className="md:col-span-7 space-y-4">
          {authTab === 'demo' ? (
            <Card className="border-teal-200 shadow-sm">
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50/70 to-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-teal-700" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Instant Demo Patient Profiles
                    </h2>
                  </div>
                  <span className="text-[11px] font-medium bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                    1-Click Sign In
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Select any synthetic patient persona to explore the intake journey with locked <strong>PATIENT</strong> role.
                </p>
              </div>

              <CardContent className="p-4 space-y-3">
                {getStoredPatients().map((patient) => (
                  <div
                    key={patient.id}
                    id={`select-patient-${patient.id}`}
                    onClick={() => handleDemoSelect(patient)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm group-hover:bg-teal-100 group-hover:text-teal-800 transition-colors">
                        {patient.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-900">
                            {patient.fullName}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({patient.age}y, {patient.gender})
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {patient.uhid} • Blood: {patient.bloodGroup}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="group-hover:bg-teal-700 group-hover:text-white group-hover:border-teal-700">
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-teal-200 shadow-sm">
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50/70 to-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-teal-700" />
                    <h2 className="text-sm font-bold text-slate-900">
                      {isSignUp ? 'Register New Patient Account' : 'Sign In with Email'}
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full uppercase">
                    Role: PATIENT
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isSupabaseConfigured
                    ? 'Authenticates via Supabase Auth. Verified against public.profiles for role PATIENT.'
                    : 'Supabase credentials not detected in .env. Runs in isolated demo authentication mode.'}
                </p>
              </div>

              <CardContent className="p-5">
                <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Patient Name
                      </label>
                      <input
                        id="patient-signup-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g., Meera Deshmukh"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      id="patient-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="patient@example.com"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      id="patient-password-input"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>

                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        UHID Number (Optional)
                      </label>
                      <input
                        id="patient-signup-uhid"
                        type="text"
                        value={uhidInput}
                        onChange={(e) => setUhidInput(e.target.value)}
                        placeholder="UHID-SYN-2026-XXXX"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      id="patient-submit-auth-btn"
                      type="submit"
                      variant="primary"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>Verifying Credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>{isSignUp ? 'Create Patient Account' : 'Sign In as Patient'}</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        clearError();
                        setSuccessNotice(null);
                      }}
                      className="text-xs text-teal-700 hover:text-teal-800 font-semibold cursor-pointer underline"
                    >
                      {isSignUp
                        ? 'Already have an account? Sign in here'
                        : "Don't have a patient account? Register here"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Privacy & Synthetic Data Guardrail Notice */}
          <div className="flex items-start gap-3 p-3.5 bg-slate-100/80 rounded-xl text-xs text-slate-600 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Privacy & Role Security:</span>
              <p className="mt-0.5">
                DocGenie isolates all patient intake records. Patient accounts cannot view physician triage review screens or sign medical records.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Information & Doctor Switch */}
        <div className="md:col-span-5 space-y-4">
          <Card>
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-600" />
                <span>Patient Portal Features</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Access your pre-consultation OPD health passport.
              </p>
            </div>
            <CardContent className="p-5 space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center font-bold">1</div>
                <span>Guided chief complaint & symptom duration capture</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center font-bold">2</div>
                <span>Automatic completeness scoring before OPD entry</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center font-bold">3</div>
                <span>Seamless handoff to hospital physician dashboard</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Doctor Portal Switch */}
          <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl text-center">
            <p className="text-xs text-slate-600 mb-2">
              Are you a clinician or hospital staff member?
            </p>
            <Button
              id="goto-doctor-login-btn"
              variant="outline"
              size="sm"
              onClick={onNavigateToDoctorLogin}
              className="w-full bg-white text-teal-800 border-teal-300 hover:bg-teal-50"
            >
              <User className="w-3.5 h-3.5 mr-1" />
              <span>Switch to Doctor Login (OPD Station)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
