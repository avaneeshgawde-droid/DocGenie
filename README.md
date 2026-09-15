# DocGenie — AI-Driven Hospital Appointment Allocation & Real-Time Patient-Flow Optimization

**Smart India Hackathon 2026** | **Problem Statement**: PS-24 (Optimizing Doctor Availability and Appointment Allocation in Hospitals through Digital Technology & AI Integration)

> *"Optimize the patient journey — not merely the appointment."*

---

## 📌 Active Module: Supabase Authentication & Role-Based Access Control (RBAC)

This module implements authenticated user sessions and bidirectional role isolation for **DocGenie**:

1. **Dual Authentication Modes**:
   - **Live Supabase Authentication**: When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided, real user accounts authenticate via Supabase Auth with JWT session persistence.
   - **Isolated Demo Mode**: When Supabase environment variables are omitted (or toggled in demo mode), DocGenie operates seamlessly without requiring external network access, utilizing synthetic patient and doctor personas.
2. **Strict Bidirectional Role Isolation**:
   - **PATIENT role**: Can access the Patient Dashboard, view personal case histories, and initiate pre-consultation intakes. **Blocked** from accessing Doctor OPD review stations, triage queues, and case verification screens.
   - **DOCTOR role**: Can access the Doctor OPD Station, review clinical intake summaries, and sign verified records. **Blocked** from submitting pre-consultation patient intakes directly.
   - **GUEST role**: Unauthenticated visitors are intercepted with an authentication challenge when attempting to navigate to protected routes.
3. **Dedicated Logout & Session Lifecycle**:
   - One-click logout clears Supabase session tokens, resets active profiles to `GUEST`, and safely returns the user to the portal login screen.
4. **Loading & Error States**:
   - Responsive spinners during authentication and token verification.
   - User-friendly error banners for credential failures or role mismatches.

> ⚠️ **CLINICAL SAFETY NOTICE:**
> DocGenie is an administrative and clinical pre-consultation triage workflow system designed to assist healthcare professionals. **It does not provide autonomous clinical diagnoses, nor does it prescribe treatment or replace the judgment of licensed medical practitioners.** All structured intake records require physician review and verification.

---

## 🔑 Required Environment Variables

To connect DocGenie to your Supabase project, define the following variables in your `.env` file or deployment settings:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | The Project URL found in Supabase **Project Settings > API** | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | The public Anon/Client API key found in Supabase **Project Settings > API** | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `VITE_APP_ENV` | Application environment mode (`development`, `staging`, `production`) | `"development"` |
| `VITE_ENABLE_SYNTHETIC_DATA` | Flag ensuring synthetic patient datasets are used for demonstrations | `"true"` |
| `VITE_HOSPITAL_NAME` | Hospital branding displayed across OPD intake workflows | `"City Health Medical Center — Smart OPD"` |
| `GEMINI_API_KEY` | Reserved for upcoming AI intake modules (server-side only) | `""` |

> 💡 **Graceful Fallback:** If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are left empty, DocGenie automatically runs in **Isolated Demo Mode** without throwing unhandled exceptions or breaking the UI.

---

## 🗄️ Required Supabase Database Tables & SQL Schema

Run the following SQL in your **Supabase Dashboard > SQL Editor** to set up the necessary tables, Row-Level Security (RLS) policies, and user creation triggers:

```sql
-- =========================================================
-- DocGenie - Supabase Database Schema & RLS Policies
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
  insert into public.profiles (
    id, email, full_name, role, uhid, department, specialization, medical_reg_number
  )
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
```

---

## 📂 Project Structure & Changed Files

```
/
├── .env.example                               # Documented Supabase & App env vars
├── metadata.json                              # Applet metadata
├── package.json                               # Added @supabase/supabase-js
├── README.md                                  # Complete schema, env, and test docs
└── src/
    ├── config/
    │   └── env.ts                             # Validated Supabase & app configuration
    ├── context/
    │   └── AuthContext.tsx                    # Supabase Auth, roles, loading/error states
    ├── lib/
    │   └── supabase.ts                        # Safe Supabase client initialization
    ├── types/
    │   └── index.ts                           # Added AuthRole & UserProfile types
    ├── components/
    │   ├── common/
    │   │   ├── Navbar.tsx                     # Auth status, user badge, logout & RBAC nav
    │   │   ├── ProtectedRoute.tsx             # Strict bidirectional route guard
    │   │   └── SupabaseConfigModal.tsx        # In-app SQL schema & env viewer
    │   └── views/
    │       ├── PatientLoginView.tsx           # Instant demo & Supabase patient login/signup
    │       └── DoctorLoginView.tsx            # Instant demo & Supabase staff login/signup
    └── App.tsx                                # AuthProvider wrapper & protected route tree
```

---

## 🧪 Comprehensive Verification & Test Procedure

### Test 1: Verify Supabase Status & Schema Modal
1. Observe the top navigation bar.
2. Note the **Auth Status Pill**:
   - If `VITE_SUPABASE_URL` is omitted, it displays **`Auth: Isolated Demo`**.
   - If Supabase is configured, it displays **`Supabase Auth: Live`**.
3. Click the status pill or the footer link **"Supabase Schema & Env"**:
   - Verify that the **Supabase Auth & Database Architecture** dialog appears.
   - Review the required environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
   - Click **"Copy SQL Script"** and confirm that the SQL schema for `public.profiles` and RLS is copied to your clipboard.
   - Click "Close Guide".

### Test 2: Verify Patient Login & Route Access
1. Navigate to **Patient Portal** (or click **Patient Login** in the nav).
2. Note the two authentication tabs:
   - **Instant Demo Profiles (1-Click)**
   - **Supabase Email Auth**
3. Under Instant Demo Profiles, click **Aarav Sharma**:
   - Confirm you are logged in with role `PATIENT`.
   - Verify the navigation displays `Patient Dashboard` and `Start New Intake`.
   - Verify that the active profile pill shows **PATIENT: Aarav Sharma**.

### Test 3: Test Strict Role Isolation (Patient attempting Doctor screen)
1. While logged in as **Aarav Sharma (Patient)**, attempt to access the Doctor OPD Station by:
   - Selecting **Doctor: Dr. Ananya Roy** from the quick role switcher, OR
   - Manually navigating to `doctor_dashboard`.
2. Observe that **ProtectedRoute** intercepts the request and displays the **Role Isolation Breach** screen:
   - Banner: *"Access Restricted — Physician Only"*
   - Explanation: *"You are currently authenticated with a PATIENT role (Aarav Sharma). Patients are strictly restricted from accessing Doctor OPD Stations, clinical auditing, and medical verification screens."*
   - Button **"Return to My Patient Dashboard"** redirects cleanly back to the patient portal.

### Test 4: Test Doctor Login & Strict Patient Isolation
1. Click the profile menu and click **Sign Out (Logout)** or click the **Logout** button in the header.
2. Confirm you are logged out and returned to the guest state (`currentRole: 'GUEST'`).
3. Click **Doctor Station** in the nav to open the Doctor Login view.
4. Click **Dr. Ananya Roy** to log in as a Doctor.
5. Verify that your role is set to `DOCTOR` and you are on the **Doctor OPD Station**.
6. While logged in as Doctor, attempt to navigate to a Patient intake route (`start_case` or `patient_dashboard`):
   - Confirm **ProtectedRoute** intercepts and blocks access with:
     *"Access Restricted — Patient Portal Only: You are currently authenticated with a DOCTOR role. Doctor accounts cannot submit pre-consultation patient intakes directly."*

### Test 5: Test Supabase Email Auth Tab & Form Validation
1. Log out to return to Guest mode.
2. Click **Patient Login** and select the **Supabase Email Auth** tab.
3. Click *"Don't have a patient account? Register here"*:
   - Enter Full Name (*e.g. Meera Deshmukh*), Email (*meera@example.com*), and Password.
   - Click **Create Patient Account**.
   - Observe the loading state (*"Verifying Credentials..."*), followed by confirmation and activation.
4. Test the same under **Doctor Login > Hospital Staff SSO**:
   - Register a doctor account with Department and Medical Registration number.
   - Confirm proper role tagging and isolation.

### Test 6: Test Logout
1. From any authenticated screen, click the **Logout** button in the navigation header.
2. Confirm that the user session is terminated, role is set to `GUEST`, and the user is redirected to the login view.
