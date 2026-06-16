import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function hasRealSupabaseConfig(url?: string, key?: string) {
  return Boolean(
    url &&
      key &&
      url.startsWith('https://') &&
      !url.includes('https://hrmxsggmbrotvkgirgqe.supabase.co') &&
      !key.includes('sb_publishable_ZoGmaLV5F69ihyCB1iaM2A_lQ6OP2Uo')
  );
}

export const isSupabaseConfigured = hasRealSupabaseConfig(supabaseUrl, supabaseAnonKey);

// IMPORTANT:
// Do not throw when Supabase env values are still placeholders.
// Throwing here makes the whole React app render a blank screen before the user has connected Supabase.
// The placeholder client keeps the existing design visible; real database actions start working after .env is configured.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://hrmxsggmbrotvkgirgqe.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'sb_publishable_ZoGmaLV5F69ihyCB1iaM2A_lQ6OP2Uo'
);
