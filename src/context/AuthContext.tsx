// src/context/AuthContext.tsx (trecho essencial da função login)
import { supabase } from '../lib/supabase';

const login = async (identifier: string, password: string): Promise<boolean> => {
  // Por enquanto, exija e-mail aqui. (Se quiser manter "username", dá pra resolver buscando e-mail pelo username na tabela profiles.)
  const email = identifier.includes('@') ? identifier.trim() : `${identifier.trim()}`; // ajuste se quiser mapear
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.log('❌ supabase login error', error);
    return false;
  }

  // Garante perfil e pega role
  const { data: prof } = await supabase.from('profiles').select('id, email, role, username').eq('id', data.user.id).maybeSingle();

  const userForLocal = {
    id: data.user.id,
    username: prof?.username || (email.split('@')[0]),
    email: prof?.email || email,
    createdAt: new Date().toISOString(),
    role: (prof?.role as 'admin' | 'user') || 'user',
  };

  dispatch({ type: 'LOGIN', payload: userForLocal });
  localStorage.setItem('3d-printing-current-user', JSON.stringify(userForLocal));
  return true;
};

const logout = async () => {
  await supabase.auth.signOut();
  dispatch({ type: 'LOGOUT' });
};
