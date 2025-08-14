// DEBUG: expõe ENV no browser sem usar import.meta no console
;(window as any).__ENV__ = {
  URL_OK: !!import.meta.env.VITE_SUPABASE_URL,
  KEY_OK: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  URL_PREFIX: String(import.meta.env.VITE_SUPABASE_URL || '').slice(0, 30),
  KEY_PREFIX: String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').slice(0, 12)
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
