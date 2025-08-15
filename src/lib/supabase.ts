// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// 🔍 Debug no build/produção
console.log('SUPABASE URL =>', url);
console.log('SUPABASE KEY =>', anon?.slice(0, 10) + '...');

if (!url || !anon) {
  console.error('[ENV FALTANDO] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes.');
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
