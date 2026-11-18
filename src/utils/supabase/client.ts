import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;

export const createClient = (): SupabaseClient => {
  if (clientInstance) return clientInstance;

  // Compatible con Vite (import.meta.env) y Node/Next (process.env)
  const supabaseUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    'https://pthvajglmftdppgsyjba.supabase.co';

  const supabaseKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    'sb_publishable_QVcEJWAJ1_AP5cOY5dyXYg_3zJCBkAW';

  clientInstance = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return clientInstance;
};
