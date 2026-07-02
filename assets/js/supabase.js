import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://hsdammyynxiblronyzbg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qpPWMuGMDjM1fOV8WajpxA_0G9daTsx";

export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) &&
  Boolean(SUPABASE_PUBLISHABLE_KEY) &&
  SUPABASE_PUBLISHABLE_KEY !== "PASTE_SUPABASE_PUBLISHABLE_KEY_HERE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
