// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
// Use SOMENTE a ANON no frontend (a "Publishable" nova do painel ↓ é equivalente,
// mas padronize no projeto com ANON para não confundir).
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anon) {
  // log claro para identificar env faltando no Vercel
  console.error('[ENV FALTANDO] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes.')
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
