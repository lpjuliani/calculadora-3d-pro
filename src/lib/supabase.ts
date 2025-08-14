// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

if (!url || !anon) {
  // ajuda a diagnosticar caso .env não tenha sido lido
  console.error('Supabase env vars missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_[PUBLISHABLE|ANON]_KEY');
}

export const supabase = createClient(url, anon);
