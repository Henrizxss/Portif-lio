const environment = import.meta.env;

export const supabaseUrl = environment.VITE_SUPABASE_URL?.trim() || "";
export const supabasePublishableKey =
  environment.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  environment.VITE_SUPABASE_ANON_KEY?.trim() ||
  "";
