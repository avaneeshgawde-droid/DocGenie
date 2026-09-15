import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env';

/**
 * Supabase client instance.
 * Gracefully null if environment variables are not configured, enabling isolated demo mode.
 */
export const supabase: SupabaseClient | null = config.isSupabaseConfigured && config.supabaseUrl && config.supabaseAnonKey
  ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const isSupabaseReady = (): boolean => {
  return Boolean(supabase && config.isSupabaseConfigured);
};
