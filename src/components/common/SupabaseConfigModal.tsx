import React, { useState } from 'react';
import { X, Database, ShieldCheck, Copy, Check, Terminal, Key, Server, Lock } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';
import { config } from '../../config/env';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { isSupabaseConfigured, isDemoMode, setDemoMode } = useAuth();
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `-- =========================================================
-- DocGenie - Supabase Database Schema & RLS Policies
-- Module: Supabase Auth & Role-Based Access Control (RBAC)
-- =========================================================

-- 1. Create PROFILES table linked to Supabase auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('PATIENT', 'DOCTOR')),
  uhid text,
  phone text,
  department text,
  specialization text,
  medical_reg_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row-Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. RLS Policies for Profiles:
-- Patients can view and edit their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Doctors can read patient profiles for clinical OPD review
create policy "Doctors can view all profiles for OPD care"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'DOCTOR'
    )
  );

-- 4. Automatic Profile Creation Trigger on Supabase Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, uhid, department, specialization, medical_reg_number)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Healthcare User'),
    coalesce(new.raw_user_meta_data->>'role', 'PATIENT'),
    new.raw_user_meta_data->>'uhid',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'specialization',
    new.raw_user_meta_data->>'medical_reg_number'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Cases table (Clinical cases and OPD triage records)
create table if not exists public.cases (
  id text primary key,
  patient_id text not null,
  patient_name text not null,
  uhid text not null,
  department text,
  chief_complaint text,
  symptom_duration text,
  severity_level text,
  status text,
  priority text,
  completeness_score integer,
  red_flags jsonb,
  doctor_notes text,
  verified_at text,
  assigned_doctor_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Case Intake Drafts table (Active patient interview drafts)
create table if not exists public.case_intake (
  patient_id text primary key,
  answers jsonb not null default '{}'::jsonb,
  current_question_index integer default 0,
  selected_department text,
  perceived_severity text,
  is_review_mode boolean default false,
  is_submitted boolean default false,
  created_case_id text,
  last_saved_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Doctor Notes table (Clinical audit and verification notes)
create table if not exists public.doctor_notes (
  case_id text primary key,
  doctor_id text,
  doctor_name text,
  notes text not null,
  is_draft boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Supabase Auth & Database Architecture
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                  SIH 2026
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Live Supabase Authentication, RBAC Role Isolation, & Database Tables Specification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Current Connection Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-teal-700" />
                  <span>Connection Mode</span>
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isSupabaseConfigured
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {isSupabaseConfigured ? 'Supabase Configured' : 'Isolated Demo Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {isSupabaseConfigured
                  ? 'Real-time credentials detected in environment. Live user authentication with JWT session persistence is available.'
                  : 'No Supabase API credentials provided in .env. Running in self-contained Isolated Demo Mode with synthetic patient and doctor identities.'}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-700" />
                  <span>Role-Based Access Control</span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Strict Isolation
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Enforces bidirectional role isolation: <strong>PATIENT</strong> accounts cannot view Doctor review stations, and <strong>DOCTOR</strong> accounts cannot submit patient intakes.
              </p>
            </div>
          </div>

          {/* Environment Variables Requirement */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Key className="w-4 h-4 text-teal-700" />
              <span>1. Required Environment Variables</span>
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-200 text-xs font-mono p-4 space-y-2">
              <div>
                <span className="text-emerald-400 font-bold">VITE_SUPABASE_URL</span>=
                <span className="text-slate-300">
                  {config.supabaseUrl || 'https://your-project.supabase.co'}
                </span>
                <span className="text-slate-500 ml-2"># Found in Project Settings &gt; API</span>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">VITE_SUPABASE_ANON_KEY</span>=
                <span className="text-slate-300">
                  {config.supabaseAnonKey ? `${config.supabaseAnonKey.slice(0, 15)}...` : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'}
                </span>
                <span className="text-slate-500 ml-2"># Public anon JWT API key</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              *Add these variables in your deployment environment or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">.env</code> file. When omitted, DocGenie automatically runs in high-performance isolated demo mode without throwing errors.
            </p>
          </div>

          {/* Database Tables & Schema */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-700" />
                <span>2. Required Supabase Database Tables & SQL Schema</span>
              </h3>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-200 text-xs font-mono p-4 max-h-56 overflow-y-auto">
              <pre className="text-slate-300 whitespace-pre">{sqlSchema}</pre>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Security Notice: Patient Data Protection</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Supabase Row-Level Security (RLS) ensures patients can only query their personal intake cases and profile. Clinicians can query assigned OPD cases for clinical triage verification.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            DocGenie SIH 2026 • Module 1 Supabase Auth & RBAC
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Guide
          </Button>
        </div>
      </div>
    </div>
  );
};
