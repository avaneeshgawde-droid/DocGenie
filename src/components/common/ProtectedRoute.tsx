import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppRoute } from '../../types';
import { ShieldAlert, LogIn, ArrowRight, Loader2, Stethoscope, User, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Button } from './Button';

interface ProtectedRouteProps {
  allowedRole: 'PATIENT' | 'DOCTOR';
  children: React.ReactNode;
  onNavigate: (route: AppRoute) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRole,
  children,
  onNavigate,
}) => {
  const { currentRole, currentUser, isLoading, signOut } = useAuth();

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-sm mb-4">
          <Loader2 className="w-7 h-7 animate-spin text-teal-700" />
        </div>
        <h2 className="text-base font-bold text-slate-800">Verifying Security & Role Permissions</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
          Checking Supabase role-based authorization tokens and patient privacy isolation...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated (GUEST)
  if (currentRole === 'GUEST' || !currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <Card className="border-amber-200 shadow-sm text-center">
          <div className="p-6 bg-gradient-to-b from-amber-50/70 to-white">
            <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 mx-auto mb-3">
              <LogIn className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Authentication Required</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Please sign in to access the{' '}
              <strong className="text-slate-800">
                {allowedRole === 'DOCTOR' ? 'Doctor OPD Review Station' : 'Patient Pre-Consultation Portal'}
              </strong>
              .
            </p>
          </div>
          <CardContent className="p-6 pt-0 space-y-3">
            <Button
              id="auth-required-login-btn"
              variant="primary"
              className="w-full"
              onClick={() => onNavigate(allowedRole === 'DOCTOR' ? 'doctor_login' : 'patient_login')}
            >
              <span>Go to {allowedRole === 'DOCTOR' ? 'Doctor Login' : 'Patient Login'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <div className="text-[11px] text-slate-400">
              Demo synthetic accounts and Supabase authentication supported.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Strict Role Isolation Check
  if (currentRole !== allowedRole) {
    const isPatientAttemptingDoctor = currentRole === 'PATIENT' && allowedRole === 'DOCTOR';
    const isDoctorAttemptingPatient = currentRole === 'DOCTOR' && allowedRole === 'PATIENT';

    return (
      <div className="max-w-lg mx-auto my-12 px-4">
        <Card className="border-rose-200 shadow-md">
          <div className="p-6 bg-gradient-to-b from-rose-50/80 to-white border-b border-rose-100 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 mx-auto mb-3">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Role Isolation Policy</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Access Restricted — {allowedRole === 'DOCTOR' ? 'Physician Only' : 'Patient Portal Only'}
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {isPatientAttemptingDoctor && (
                <>
                  You are currently authenticated with a <strong>PATIENT</strong> role ({currentUser.fullName}).
                  Patients are strictly restricted from accessing Doctor OPD Stations, clinical auditing, and medical verification screens.
                </>
              )}
              {isDoctorAttemptingPatient && (
                <>
                  You are currently authenticated with a <strong>DOCTOR</strong> role ({currentUser.fullName}).
                  Doctor accounts cannot submit pre-consultation patient intakes directly. Please use a patient account.
                </>
              )}
            </p>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-500">Current Role:</span>
              <span className="font-bold px-2 py-0.5 rounded text-[11px] bg-slate-200 text-slate-800">
                {currentRole} ({currentUser.role})
              </span>
            </div>

            <div className="space-y-2">
              <Button
                id="unauthorized-return-home-btn"
                variant="primary"
                className="w-full"
                onClick={() =>
                  onNavigate(currentRole === 'PATIENT' ? 'patient_dashboard' : 'doctor_dashboard')
                }
              >
                <span>
                  Return to My {currentRole === 'PATIENT' ? 'Patient Dashboard' : 'Doctor Dashboard'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              <Button
                id="unauthorized-switch-role-btn"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await signOut();
                  onNavigate(allowedRole === 'DOCTOR' ? 'doctor_login' : 'patient_login');
                }}
              >
                <span>
                  Sign Out & Log In as {allowedRole === 'DOCTOR' ? 'Doctor' : 'Patient'}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. Authorized Role Passed
  return <>{children}</>;
};
