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
  Server,
  Lock,
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
  const { currentRole, currentUser, signOut, isSupabaseConfigured } = useAuth();
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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="brand-home-btn"
              onClick={() => handleNavClick(currentRole === 'DOCTOR' ? 'doctor_dashboard' : 'patient_dashboard')}
              className="flex items-center gap-2.5 text-left group focus-visible:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-800 flex items-center justify-center text-white shrink-0 shadow-2xs">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold tracking-tight text-slate-900">
                    Doc<span className="text-teal-700">Genie</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    OPD Suite
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1">
                  <Hospital className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[200px]">{config.hospitalName}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Text Links with Clean Active Indicator) */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Main Navigation">
            {currentRole === 'PATIENT' && (
              <>
                <button
                  id="nav-link-patient_dashboard"
                  onClick={() => handleNavClick('patient_dashboard')}
                  className={`text-xs font-semibold py-1 transition-colors cursor-pointer border-b-2 ${
                    currentRoute === 'patient_dashboard'
                      ? 'border-teal-700 text-teal-800 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Patient Dashboard
                </button>
                <button
                  id="nav-link-start_case"
                  onClick={() => handleNavClick('start_case')}
                  className={`text-xs font-semibold py-1 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                    currentRoute === 'start_case'
                      ? 'border-teal-700 text-teal-800 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-teal-700" />
                  <span>Start Pre-Intake</span>
                </button>
              </>
            )}

            {currentRole === 'DOCTOR' && (
              <button
                id="nav-link-doctor_dashboard"
                onClick={() => handleNavClick('doctor_dashboard')}
                className={`text-xs font-semibold py-1 transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  currentRoute === 'doctor_dashboard'
                    ? 'border-teal-700 text-teal-800 font-bold'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                <span>Doctor OPD Queue</span>
              </button>
            )}

            {currentRole === 'GUEST' && (
              <>
                <button
                  id="nav-link-patient_login"
                  onClick={() => handleNavClick('patient_login')}
                  className={`text-xs font-semibold py-1 transition-colors cursor-pointer border-b-2 ${
                    currentRoute === 'patient_login'
                      ? 'border-teal-700 text-teal-800 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Patient Portal
                </button>
                <button
                  id="nav-link-doctor_login"
                  onClick={() => handleNavClick('doctor_login')}
                  className={`text-xs font-semibold py-1 transition-colors cursor-pointer border-b-2 ${
                    currentRoute === 'doctor_login'
                      ? 'border-teal-700 text-teal-800 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Doctor Station
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Actions & Controls */}
          <div className="flex items-center gap-2">
            
            {/* System Config & Synthetic Data Indicators (Quiet Unboxed Controls) */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 border-r border-slate-200 pr-3 mr-1">
              <button
                id="supabase-status-pill-btn"
                onClick={onOpenSupabaseModal}
                className="hover:text-slate-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
                title="Supabase Authentication & Database Configuration"
              >
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>{isSupabaseConfigured ? 'Supabase Live' : 'Demo Auth'}</span>
              </button>
              <span className="text-slate-300">·</span>
              <button
                id="synthetic-data-indicator-btn"
                onClick={onOpenSyntheticModal}
                className="hover:text-slate-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
                title="Synthetic Healthcare Data Disclaimer"
              >
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Demo Data</span>
              </button>
            </div>

            {/* Current Active Role Dropdown */}
            <div className="relative">
              <button
                id="role-switcher-dropdown-btn"
                onClick={() => setSwitchDropdownOpen(!switchDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  currentRole === 'DOCTOR' ? 'bg-teal-700' : currentRole === 'PATIENT' ? 'bg-cyan-700' : 'bg-slate-400'
                }`} />
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] text-slate-400 uppercase font-bold leading-none">
                    {currentRole}
                  </div>
                  <div className="text-xs font-semibold leading-tight text-slate-800 max-w-[120px] truncate">
                    {currentUser?.fullName || (currentRole === 'GUEST' ? 'Guest Visitor' : 'Signed In')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {switchDropdownOpen && (
                <div
                  id="role-switcher-menu"
                  className="absolute right-0 mt-1.5 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in duration-100"
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Active User Session
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-bold text-slate-900">
                        {currentUser?.fullName || 'Not Signed In'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {currentRole}
                      </span>
                    </div>
                    {currentUser?.email && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                    )}
                  </div>

                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Quick Role Switch
                  </div>

                  <button
                    id="switch-to-patient-btn"
                    onClick={() => {
                      onQuickSwitchRole('patient');
                      setSwitchDropdownOpen(false);
                      onRouteChange('patient_dashboard');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 cursor-pointer ${
                      currentRole === 'PATIENT' ? 'text-teal-800 font-semibold bg-teal-50/50' : 'text-slate-700'
                    }`}
                  >
                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="truncate">
                      <div>Patient: {activePatient?.fullName || 'Aarav Sharma'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{activePatient?.uhid || 'UHID-SYN-2026-8812'}</div>
                    </div>
                  </button>

                  <button
                    id="switch-to-doctor-btn"
                    onClick={() => {
                      onQuickSwitchRole('doctor');
                      setSwitchDropdownOpen(false);
                      onRouteChange('doctor_dashboard');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 cursor-pointer ${
                      currentRole === 'DOCTOR' ? 'text-teal-800 font-semibold bg-teal-50/50' : 'text-slate-700'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-teal-700 shrink-0" />
                    <div className="truncate">
                      <div>Doctor: Dr. Ananya Roy</div>
                      <div className="text-[10px] text-slate-400">Internal Medicine OPD (Room 104)</div>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    id="open-schema-guide-dropdown-btn"
                    onClick={() => {
                      setSwitchDropdownOpen(false);
                      onOpenSupabaseModal();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    <span>Supabase Schema &amp; Environment</span>
                  </button>

                  {currentRole !== 'GUEST' ? (
                    <button
                      id="navbar-logout-btn"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium border-t border-slate-100 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      id="navbar-guest-login-btn"
                      onClick={() => {
                        setSwitchDropdownOpen(false);
                        onRouteChange('patient_login');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-teal-700 hover:bg-teal-50 flex items-center gap-2 cursor-pointer font-medium border-t border-slate-100 mt-1"
                    >
                      <LogIn className="w-3.5 h-3.5 text-teal-600" />
                      <span>Sign In</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Logout Shortcut */}
            {currentRole !== 'GUEST' && (
              <button
                id="header-logout-btn"
                onClick={handleLogout}
                title="Log out of current session"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-medium cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div id="mobile-nav-panel" className="lg:hidden border-t border-slate-200 py-3 space-y-2">
            <div className="p-3 bg-slate-50 rounded-lg mb-2 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Authenticated As</div>
                <div className="text-xs font-bold text-slate-800">{currentUser?.fullName || 'Guest'}</div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {currentRole}
              </span>
            </div>

            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">Navigation</div>
            <button
              onClick={() => handleNavClick('patient_dashboard')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium cursor-pointer ${
                currentRoute === 'patient_dashboard' ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-teal-700" />
              <span>Patient Dashboard</span>
            </button>
            <button
              onClick={() => handleNavClick('start_case')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium cursor-pointer ${
                currentRoute === 'start_case' ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-teal-700" />
              <span>Start Pre-Intake</span>
            </button>
            <button
              onClick={() => handleNavClick('doctor_dashboard')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium cursor-pointer ${
                currentRoute === 'doctor_dashboard' ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <span>Doctor OPD Station</span>
            </button>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSupabaseModal();
                }}
                className="w-full py-2 px-3 text-xs text-slate-700 bg-slate-100 rounded-md font-medium flex items-center justify-center gap-1.5"
              >
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span>Supabase Schema &amp; Environment</span>
              </button>
              {currentRole !== 'GUEST' && (
                <button
                  onClick={handleLogout}
                  className="w-full py-2 px-3 text-xs text-rose-700 bg-rose-50 rounded-md font-semibold flex items-center justify-center gap-1.5"
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
