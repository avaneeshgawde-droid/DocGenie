/**
 * DocGenie Environment Configuration
 * Centralized, validated environment variable access.
 * Strictly enforces synthetic data guardrails and ensures no secrets are leaked to the client.
 */

export interface AppConfig {
  env: 'development' | 'staging' | 'production' | 'test';
  isSyntheticDataEnabled: boolean;
  hospitalName: string;
  appTitle: string;
  appVersion: string;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  isSupabaseConfigured: boolean;
}

const safeGetEnv = (key: string, fallback: string): string => {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
    if (metaEnv && metaEnv[key] !== undefined && metaEnv[key] !== '') {
      return String(metaEnv[key]);
    }
  } catch {
    // ignore in environments where import.meta is unavailable
  }
  return fallback;
};

const supabaseUrlRaw = safeGetEnv('VITE_SUPABASE_URL', '');
const supabaseAnonKeyRaw = safeGetEnv('VITE_SUPABASE_ANON_KEY', '');
const hasValidSupabase =
  Boolean(supabaseUrlRaw) &&
  Boolean(supabaseAnonKeyRaw) &&
  supabaseUrlRaw !== 'MY_SUPABASE_URL' &&
  !supabaseUrlRaw.includes('placeholder');

export const config: AppConfig = {
  env: (safeGetEnv('VITE_APP_ENV', 'development') as AppConfig['env']),
  isSyntheticDataEnabled: safeGetEnv('VITE_ENABLE_SYNTHETIC_DATA', 'true') === 'true',
  hospitalName: safeGetEnv('VITE_HOSPITAL_NAME', 'City Health Medical Center — Smart OPD'),
  appTitle: 'DocGenie',
  appVersion: '1.1.0-auth.module',
  supabaseUrl: hasValidSupabase ? supabaseUrlRaw : null,
  supabaseAnonKey: hasValidSupabase ? supabaseAnonKeyRaw : null,
  isSupabaseConfigured: hasValidSupabase,
};

/**
 * Validates that the runtime environment is adhering to synthetic data requirements.
 */
export function validateEnvironment(): { isValid: boolean; messages: string[] } {
  const messages: string[] = [];

  if (!config.isSyntheticDataEnabled) {
    messages.push('Warning: Synthetic data flag is disabled. DocGenie Module 1 mandates demo/synthetic data mode.');
  }

  return {
    isValid: messages.length === 0,
    messages,
  };
}
