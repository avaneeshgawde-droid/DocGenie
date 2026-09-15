import React, { useState } from 'react';
import {
  Activity,
  User,
  Stethoscope,
  Database,
  Menu,
  X,
  PlusCircle,
  LayoutDashboard,
  LogIn,
  LogOut,
  Hospital,
  ChevronDown,
  ShieldCheck,
  Server,
  Lock
} from 'lucide-react';
import { AppRoute, SyntheticPatient, SyntheticDoctor, UserRole } from '../../types';
import { config } from '../../config/env';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  activePatient: SyntheticPatient | null;
  activeDoctor: SyntheticDoctor | null;
  userRole: UserRole;
  onOpenSyntheticModal: () => void;
  onOpenSupabaseModal: () => void;
  onQuickSwitchRole: (role: 'patient' | 'doctor' | 'guest') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onRouteChange,
  activePatient,
  activeDoctor,
  onOpenSyntheticModal,
  onOpenSupabaseModal,
  onQuickSwitchRole,
}) => {
  const { currentRole, currentUser, signOut, isSupabaseConfigured, isDemoMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switchDropdownOpen, setSwitchDropdownOpen] = useState(false);

  const handleNavClick = (route: AppRoute) => {
    onRouteChange(route);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    onRouteChange('patient_login');
    setSwitchDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="brand-home-btn"
              onClick={() => handleNavClick(currentRole === 'DOCTOR' ? 'doctor_dashboard' : 'patient_dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-slate-900">
                    Doc<span className="text-teal-700">Genie</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                    SIH 2026
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1">
                  <Hospital className="w-3 h-3 text-slate-400" />
                  <span>{config.hospitalName}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {/* Patient Section */}
            {currentRole === 'PATIENT' && (
              <>
                <button
                  id="nav-link-patient_dashboard"
                  onClick={() => handleNavClick('patient_dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentRoute === 'patient_dashboard'
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-teal-700" />
                  <span>Patient Dashboard</span>
                </button>
                <button
                  id="nav-link-start_case"
                  onClick={() => handleNavClick('start_case')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentRoute === 'start_case'
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-teal-700" />
                  <span>Start New Intake</span>
                </button>
              </>
            )}

            {/* Doctor Section */}
            {currentRole === 'DOCTOR' && (
              <button
                id="nav-link-doctor_dashboard"
                onClick={() => handleNavClick('doctor_dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  currentRoute === 'doctor_dashboard'
                    ? 'bg-teal-50 text-teal-800 border border-teal-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-teal-700" />
                <span>Doctor OPD Queue</span>
              </button>
            )}

            {/* Guest / Public Links */}
            {currentRole === 'GUEST' && (
              <>
                <button
                  id="nav-link-patient_login"
                  onClick={() => handleNavClick('patient_login')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentRoute === 'patient_login'
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Patient Portal</span>
                </button>
                <button
                  id="nav-link-doctor_login"
                  onClick={() => handleNavClick('doctor_login')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    currentRoute === 'doctor_login'
                      ? 'bg-teal-50 text-teal-800 border border-teal-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 text-slate-500" />
                  <span>Doctor Station</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Supabase Status Pill / Schema Modal Trigger */}
            <button
              id="supabase-status-pill-btn"
              onClick={onOpenSupabaseModal}
              title="Click to view Supabase Auth, DB Schema & RLS Policies"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors shadow-xs cursor-pointer ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                  : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-indigo-700" />
              <span className="hidden md:inline">
                {isSupabaseConfigured ? 'Supabase Auth' : 'Auth:'}
              </span>
              <span>{isSupabaseConfigured ? 'Live' : 'Isolated Demo'}</span>
            </button>

            {/* Visible Demo / Synthetic Data Indicator */}
            <button
              id="synthetic-data-indicator-btn"
              onClick={onOpenSyntheticModal}
              title="Click to view Synthetic Data compliance details"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors shadow-xs cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
              </span>
              <Database className="w-3.5 h-3.5 text-amber-700 hidden sm:inline" />
              <span>Demo Data</span>
            </button>

            {/* Current Active Role / User Dropdown */}
            <div className="relative">
              <button
                id="role-switcher-dropdown-btn"
                onClick={() => setSwitchDropdownOpen(!switchDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  currentRole === 'DOCTOR'
                    ? 'border-teal-300 bg-teal-50/70 text-teal-900 hover:bg-teal-100/70'
                    : currentRole === 'PATIENT'
                    ? 'border-cyan-200 bg-cyan-50/50 text-cyan-950 hover:bg-cyan-100/60'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {currentRole === 'DOCTOR' ? (
                  <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                ) : currentRole === 'PATIENT' ? (
                  <User className="w-3.5 h-3.5 text-cyan-700" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                )}
                
                <div className="text-left hidden md:block">
                  <div className="text-[10px] uppercase font-bold tracking-wider leading-none text-slate-500">
                    {currentRole}
                  </div>
                  <div className="text-xs font-semibold leading-tight max-w-[110px] truncate">
                    {currentUser?.fullName || (currentRole === 'GUEST' ? 'Guest Visitor' : 'Signed In')}
                  </div>
                </div>

                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {switchDropdownOpen && (
                <div
                  id="role-switcher-menu"
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in"
                >
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Current Session Status
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-bold text-slate-800">
                        {currentUser?.fullName || 'Not Signed In'}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        currentRole === 'DOCTOR'
                          ? 'bg-teal-100 text-teal-800'
                          : currentRole === 'PATIENT'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {currentRole}
                      </span>
                    </div>
                    {currentUser?.email && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                    )}
                  </div>

                  {/* Isolated Demo Switchers */}
                  <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Demo Mode Quick Switch
                  </div>

                  <button
                    id="switch-to-patient-btn"
                    onClick={() => {
                      onQuickSwitchRole('patient');
                      setSwitchDropdownOpen(false);
                      onRouteChange('patient_dashboard');
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 cursor-pointer ${
                      currentRole === 'PATIENT' ? 'text-teal-800 font-semibold bg-teal-50/50' : 'text-slate-700'
                    }`}
                  >
                    <User className="w-4 h-4 text-cyan-600 shrink-0" />
                    <div className="truncate">
                      <div>Patient: {activePatient?.fullName || 'Aarav Sharma'}</div>
                      <div className="text-[10px] text-slate-400">{activePatient?.uhid || 'UHID-SYN-2026-8812'} (Patient Role)</div>
                    </div>
                  </button>

                  <button
                    id="switch-to-doctor-btn"
                    onClick={() => {
                      onQuickSwitchRole('doctor');
                      setSwitchDropdownOpen(false);
                      onRouteChange('doctor_dashboard');
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 cursor-pointer ${
                      currentRole === 'DOCTOR' ? 'text-teal-800 font-semibold bg-teal-50/50' : 'text-slate-700'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
                    <div className="truncate">
                      <div>Doctor: Dr. Ananya Roy</div>
                      <div className="text-[10px] text-slate-400">Internal Medicine OPD (Doctor Role)</div>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    id="open-schema-guide-dropdown-btn"
                    onClick={() => {
                      setSwitchDropdownOpen(false);
                      onOpenSupabaseModal();
                    }}
                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    <span>Supabase Schema & Env Guide</span>
                  </button>

                  {currentRole !== 'GUEST' ? (
                    <button
                      id="navbar-logout-btn"
                      onClick={handleLogout}
                      className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium border-t border-slate-100 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out (Logout)</span>
                    </button>
                  ) : (
                    <button
                      id="navbar-guest-login-btn"
                      onClick={() => {
                        setSwitchDropdownOpen(false);
                        onRouteChange('patient_login');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-teal-700 hover:bg-teal-50 flex items-center gap-2 cursor-pointer font-medium border-t border-slate-100 mt-1"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Go to Sign In</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dedicated Logout Button when logged in */}
            {currentRole !== 'GUEST' && (
              <button
                id="header-logout-btn"
                onClick={handleLogout}
                title="Log out of current session"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div id="mobile-nav-panel" className="lg:hidden border-t border-slate-200 py-3 space-y-2">
            <div className="p-3 bg-slate-50 rounded-xl mb-2 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Authenticated As</div>
                <div className="text-xs font-bold text-slate-800">{currentUser?.fullName || 'Guest'}</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {currentRole}
              </span>
            </div>

            {/* Patient Links */}
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase">Patient Workflows</div>
            <button
              onClick={() => handleNavClick('patient_dashboard')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                currentRoute === 'patient_dashboard' ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-teal-700" />
              <span>Patient Dashboard</span>
            </button>
            <button
              onClick={() => handleNavClick('start_case')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                currentRoute === 'start_case' ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-teal-700" />
              <span>Start New Intake</span>
            </button>
            <button
              onClick={() => handleNavClick('patient_login')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                currentRoute === 'patient_login' ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LogIn className="w-4 h-4 text-slate-500" />
              <span>Patient Sign In</span>
            </button>

            {/* Doctor Links */}
            <div className="px-3 pt-2 py-1 text-[11px] font-semibold text-slate-400 uppercase border-t border-slate-100">
              Doctor Workflows
            </div>
            <button
              onClick={() => handleNavClick('doctor_dashboard')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                currentRoute === 'doctor_dashboard' ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <span>Doctor OPD Station</span>
            </button>
            <button
              onClick={() => handleNavClick('doctor_login')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                currentRoute === 'doctor_login' ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LogIn className="w-4 h-4 text-slate-500" />
              <span>Doctor Sign In</span>
            </button>

            {/* Mobile Actions */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSupabaseModal();
                }}
                className="w-full py-2 px-3 text-xs text-indigo-700 bg-indigo-50 rounded-lg font-semibold flex items-center justify-center gap-1.5"
              >
                <Server className="w-3.5 h-3.5" />
                <span>Supabase Schema & Environment Info</span>
              </button>
              {currentRole !== 'GUEST' && (
                <button
                  onClick={handleLogout}
                  className="w-full py-2 px-3 text-xs text-rose-700 bg-rose-50 rounded-lg font-semibold flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
