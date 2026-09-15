import React, { useState } from 'react';
import {
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Hospital,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Server,
  User
} from 'lucide-react';
import { SyntheticDoctor } from '../../types';
import { SYNTHETIC_DOCTORS } from '../../data/mockData';
import { Card, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { config } from '../../config/env';

interface DoctorLoginViewProps {
  onLoginSuccess: (doctor: SyntheticDoctor) => void;
  onNavigateToPatientLogin: () => void;
}

export const DoctorLoginView: React.FC<DoctorLoginViewProps> = ({
  onLoginSuccess,
  onNavigateToPatientLogin,
}) => {
  const {
    loginAsDemoDoctor,
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
  const [specialization, setSpecialization] = useState('Internal Medicine');
  const [department, setDepartment] = useState('General Medicine OPD');
  const [medicalRegNumber, setMedicalRegNumber] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // 1-Click Instant Demo Selection
  const handleSelectDoctor = (doctor: SyntheticDoctor) => {
    loginAsDemoDoctor(doctor);
    onLoginSuccess(doctor);
  };

  // Supabase or Demo Email/Password Submission
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessNotice(null);

    if (isSignUp) {
      if (!fullName.trim()) return;
      const res = await signUpWithEmail(email, password, fullName, 'DOCTOR', {
        department,
        specialization,
        medicalRegNumber: medicalRegNumber || `MCI-REG-${Date.now().toString().slice(-5)}`,
      });
      if (res.success) {
        setSuccessNotice(res.message || 'Physician account registered! Please sign in.');
        if (!isSupabaseConfigured) {
          const newDoc: SyntheticDoctor = {
            ...SYNTHETIC_DOCTORS[0],
            id: `doc-${Date.now()}`,
            fullName,
            department,
            specialization,
            medicalRegNumber: medicalRegNumber || 'MCI-REG-DEMO',
          };
          onLoginSuccess(newDoc);
        }
      }
    } else {
      const ok = await signInWithEmail(email, password, 'DOCTOR');
      if (ok) {
        onLoginSuccess(SYNTHETIC_DOCTORS[0]);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold mb-3">
          <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
          <span>Doctor OPD & Clinical Review Station</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Physician & Clinician Portal
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Review AI-assisted structured intake summaries, audit patient histories, and validate triage priority.
        </p>

        {/* Auth Mode Pill */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs">
          <span className="text-slate-500">Security Gateway:</span>
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
              <p className="font-bold">Role Authorization Error</p>
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
          id="doctor-tab-demo"
          type="button"
          onClick={() => {
            setAuthTab('demo');
            clearError();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            authTab === 'demo'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Instant Clinician Profiles (1-Click)</span>
        </button>

        <button
          id="doctor-tab-email"
          type="button"
          onClick={() => {
            setAuthTab('email');
            clearError();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            authTab === 'email'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Hospital Staff SSO ({isSupabaseConfigured ? 'Live Supabase' : 'Simulated'})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="md:col-span-7 space-y-4">
          {authTab === 'demo' ? (
            <Card className="border-teal-200">
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50/70 to-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-teal-700" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Synthetic Clinician Profiles
                    </h2>
                  </div>
                  <span className="text-[11px] font-medium bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                    1-Click Access
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Select a simulated physician profile with locked <strong>DOCTOR</strong> role permissions.
                </p>
              </div>

              <CardContent className="p-4 space-y-3">
                {SYNTHETIC_DOCTORS.map((doc) => (
                  <div
                    key={doc.id}
                    id={`select-doctor-${doc.id}`}
                    onClick={() => handleSelectDoctor(doc)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-teal-800">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-teal-900">
                            {doc.fullName}
                          </span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {doc.roomNumber}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">
                          {doc.specialization} • {doc.department}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Registration: {doc.medicalRegNumber}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="group-hover:bg-teal-700 group-hover:text-white group-hover:border-teal-700">
                      <span>Enter OPD</span>
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
                      {isSignUp ? 'Register Physician Credentials' : 'Staff SSO / Email Sign In'}
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full uppercase">
                    Role: DOCTOR
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isSupabaseConfigured
                    ? 'Authenticates against Supabase. Enforces strict DOCTOR role validation.'
                    : 'Running in isolated demo authentication mode with simulated staff validation.'}
                </p>
              </div>

              <CardContent className="p-5">
                <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Doctor Full Name
                      </label>
                      <input
                        id="doctor-signup-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g., Dr. Ramesh Kulkarni"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hospital Email Address
                    </label>
                    <input
                      id="doctor-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@hospital.in"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      id="doctor-password-input"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>

                  {isSignUp && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Medical Reg. No.
                        </label>
                        <input
                          id="doctor-signup-reg"
                          type="text"
                          value={medicalRegNumber}
                          onChange={(e) => setMedicalRegNumber(e.target.value)}
                          placeholder="MCI-2026-XXXX"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Department
                        </label>
                        <select
                          id="doctor-signup-dept"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
                        >
                          <option value="General Medicine OPD">General Medicine OPD</option>
                          <option value="Cardiology OPD">Cardiology OPD</option>
                          <option value="Pediatrics OPD">Pediatrics OPD</option>
                          <option value="Orthopedics OPD">Orthopedics OPD</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      id="doctor-submit-auth-btn"
                      type="submit"
                      variant="primary"
                      disabled={isLoading}
                      className="w-full bg-slate-900 hover:bg-slate-800"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>Verifying Clinician Authorization...</span>
                        </>
                      ) : (
                        <>
                          <span>{isSignUp ? 'Register Doctor Account' : 'Log In to Doctor Workstation'}</span>
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
                        ? 'Already registered? Sign in here'
                        : 'Register new clinician credentials'}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Clinician in Control Mandate */}
          <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-xl text-xs text-teal-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Safety Protocol: Clinician-in-the-Loop</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700">
              DocGenie does not perform autonomous diagnosis or prescribe medications. All pre-consultation summaries generated by the platform serve strictly as clinical decision-support aids for licensed medical practitioners.
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-5 space-y-4">
          <Card>
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-600" />
                <span>Hospital Staff SSO & Security</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Role-based access control (RBAC) security demonstration.
              </p>
            </div>
            <CardContent className="p-5 space-y-3 text-xs text-slate-600">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital Facility
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                  <Hospital className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{config.hospitalName}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Strict Role Protection:</span> Patients attempting to access Doctor review routes or sign patient records are intercepted and redirected.
              </div>
            </CardContent>
          </Card>

          {/* Switch to Patient Link */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <p className="text-xs text-slate-600 mb-2">
              Looking for the Patient Pre-Consultation Portal?
            </p>
            <Button
              id="switch-back-patient-login-btn"
              variant="outline"
              size="sm"
              onClick={onNavigateToPatientLogin}
              className="w-full bg-white text-slate-700"
            >
              <User className="w-3.5 h-3.5 mr-1" />
              <span>Switch to Patient Login</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
