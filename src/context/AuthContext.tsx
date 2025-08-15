// src/context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ensureProfileId } from '../utils/db';

/** Utils */
function slugFromEmail(email: string) {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
}
function pickUniqueUsername(
  base: string,
  users: Record<string, { password: string; user: User }>
) {
  let candidate = base || 'user';
  let i = 1;
  while (users[candidate]) candidate = `${base}${i++}`;
  return candidate;
}

/** Tipos */
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  role: 'admin' | 'user';
  lastLoginAt?: string;
  suspended?: boolean;
}
interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  users: Record<string, { password: string; user: User }>;
}
type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'CREATE_USER'; payload: { username: string; email: string; password: string; role?: 'admin' | 'user' } }
  | { type: 'LOAD_USERS'; payload: Record<string, { password: string; user: User }> }
  | { type: 'UPDATE_USER'; payload: { usernameKey: string; user: User; password?: string } }
  | { type: 'SUSPEND_USER'; payload: { userId: string; suspended: boolean } };

/** Estado inicial */
const initialState: AuthState = { isAuthenticated: false, currentUser: null, users: {} };

/** Reducer */
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isAuthenticated: true, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, currentUser: null };
    case 'CREATE_USER': {
      const newUser: User = {
        id: Date.now().toString(),
        username: action.payload.username,
        email: action.payload.email,
        createdAt: new Date().toISOString(),
        role: action.payload.role ?? 'user',
      };
      const key = action.payload.username.toLowerCase();
      return {
        ...state,
        users: {
          ...state.users,
          [key]: { password: action.payload.password, user: newUser },
        },
      };
    }
    case 'LOAD_USERS':
      return { ...state, users: action.payload };
    case 'UPDATE_USER': {
      const { usernameKey, user, password } = action.payload;
      return {
        ...state,
        users: {
          ...state.users,
          [usernameKey]: {
            password: password ?? state.users[usernameKey].password,
            user,
          },
        },
        currentUser: state.currentUser?.id === user.id ? user : state.currentUser,
      };
    }
    case 'SUSPEND_USER': {
      const { userId, suspended } = action.payload;
      const updatedUsers = { ...state.users };
      for (const key in updatedUsers) {
        if (updatedUsers[key].user.id === userId) {
          updatedUsers[key] = {
            ...updatedUsers[key],
            user: { ...updatedUsers[key].user, suspended },
          };
          break;
        }
      }
      const shouldLogout = state.currentUser?.id === userId && suspended;
      return {
        ...state,
        users: updatedUsers,
        isAuthenticated: shouldLogout ? false : state.isAuthenticated,
        currentUser: shouldLogout ? null : state.currentUser,
      };
    }
    default:
      return state;
  }
}

/** Contexto */
const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (data: {
    email: string;
    password: string;
    role?: 'admin' | 'user';
    username?: string;
  }) => Promise<boolean>;
  updateProfile: (data: {
    username?: string;
    email?: string;
    newPassword?: string;
  }) => { ok: boolean; reason?: string };
  suspendUser: (userId: string, suspended: boolean) => boolean;
} | null>(null);

/** Provider */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /** Boot: carrega users/sessão e cria seed admin se não existir */
  useEffect(() => {
    const savedUsersRaw = localStorage.getItem('3d-printing-users');
    let usersMap: Record<string, { password: string; user: User }> = {};

    if (savedUsersRaw) {
      try {
        const loaded = JSON.parse(savedUsersRaw) as typeof usersMap;
        for (const k of Object.keys(loaded)) {
          const entry = loaded[k];
          if (entry && entry.user) {
            const keyLower = (entry.user.username || k).toLowerCase();
            const role = entry.user.role || 'user';
            usersMap[keyLower] = {
              password: entry.password,
              user: { ...entry.user, role } as User,
            };
          }
        }
      } catch {
        // ignore
      }
    }

    // Seed ADMIN (ENV → Vercel)
    const hasAdmin = Object.values(usersMap).some((u) => u.user.role === 'admin');
    if (!hasAdmin) {
      const adminUser = import.meta.env.VITE_ADMIN_USER || 'admin';
      const adminPass = import.meta.env.VITE_ADMIN_PASS || 'admin123';
      const adminKey = adminUser.toLowerCase();
      if (!usersMap[adminKey]) {
        usersMap[adminKey] = {
          password: adminPass,
          user: {
            id: Date.now().toString(),
            username: adminUser,
            email: 'admin@local',
            createdAt: new Date().toISOString(),
            role: 'admin',
          },
        };
      }
    }

    const currentSaved = localStorage.getItem('3d-printing-users');
    const newSaved = JSON.stringify(usersMap);
    if (currentSaved !== newSaved) localStorage.setItem('3d-printing-users', newSaved);

    dispatch({ type: 'LOAD_USERS', payload: usersMap });

    // Restaura sessão
    const savedCurrentUser = localStorage.getItem('3d-printing-current-user');
    if (savedCurrentUser) {
      try {
        const user = JSON.parse(savedCurrentUser) as User;
        const userWithRole = { ...user, role: (user.role ?? 'user') as const };
        dispatch({ type: 'LOGIN', payload: userWithRole });
      } catch {
        // ignore
      }
    }
  }, []);

  /** Persiste users */
  useEffect(() => {
    if (Object.keys(state.users).length > 0) {
      localStorage.setItem('3d-printing-users', JSON.stringify(state.users));
    }
  }, [state.users]);

  /** Persiste sessão */
  useEffect(() => {
    if (state.currentUser) {
      localStorage.setItem('3d-printing-current-user', JSON.stringify(state.currentUser));
    } else {
      localStorage.removeItem('3d-printing-current-user');
    }
  }, [state.currentUser]);

  /** Helper de timeout (Supabase sync em background) */
  const withTimeout = <T,>(p: Promise<T>, ms = 4000) =>
    Promise.race<T>([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error('ensureProfileId: timeout')), ms)),
    ]);

  /** LOGIN (autentica já pelo local e sincroniza Supabase em background) */
  const login = async (username: string, password: string): Promise<boolean> => {
    const id = username.trim().toLowerCase();

    let userData = state.users[id];
    if (!userData) {
      const byEmail = Object.values(state.users).find(
        (u) => (u.user.email || '').toLowerCase() === id
      );
      if (byEmail) userData = byEmail;
    }

    if (!userData) return false;
    if (userData.user.suspended) return false;
    if (userData.password !== password) return false;

    const key = userData.user.username.toLowerCase();
    const localId = userData.user.id || Date.now().toString();
    const updatedUserImmediate: User = {
      ...userData.user,
      id: localId,
      lastLoginAt: new Date().toISOString(),
    };

    // Autentica imediatamente
    dispatch({ type: 'UPDATE_USER', payload: { usernameKey: key, user: updatedUserImmediate } });
    dispatch({ type: 'LOGIN', payload: updatedUserImmediate });

    // Sincroniza ID com Supabase em background (sem travar a UI)
    (async () => {
      try {
        const supaId = await withTimeout(
          ensureProfileId(userData!.user.email, userData!.user.role),
          4000
        );
        if (supaId && supaId !== localId) {
          const syncedUser: User = { ...updatedUserImmediate, id: supaId };
          dispatch({ type: 'UPDATE_USER', payload: { usernameKey: key, user: syncedUser } });
          dispatch({ type: 'LOGIN', payload: syncedUser });
        }
      } catch (err) {
        console.warn('[ensureProfileId skip]', (err as Error)?.message || err);
      }
    })();

    return true;
  };

  /** CREATE USER (somente admin) */
  const createUser = async (data: {
    email: string;
    password: string;
    role?: 'admin' | 'user';
    username?: string;
  }): Promise<boolean> => {
    if (!state.currentUser || state.currentUser.role !== 'admin') return false;

    const email = data.email.trim();
    const role = data.role ?? 'user';

    // e-mail duplicado
    const existsByEmail = Object.values(state.users).some(
      (u) => (u.user.email || '').toLowerCase() === email.toLowerCase()
    );
    if (existsByEmail) return false;

    // username único (chave do mapa)
    const base = (data.username?.trim().toLowerCase()) || slugFromEmail(email);
    const username = pickUniqueUsername(base, state.users);

    // tenta garantir/obter o id no Supabase (sem quebrar fluxo local)
    let supaId = '';
    try {
      supaId = await withTimeout(ensureProfileId(email, role), 4000);
    } catch {
      // segue com id local se Supabase indisponível
    }

    const newUser: User = {
      id: supaId || Date.now().toString(),
      username,
      email,
      createdAt: new Date().toISOString(),
      role,
    };
    const key = username.toLowerCase();

    dispatch({
      type: 'LOAD_USERS',
      payload: { ...state.users, [key]: { password: data.password, user: newUser } },
    });
    return true;
  };

  /** UPDATE PROFILE (usuário altera seus dados locais) */
  const updateProfile = (data: {
    username?: string;
    email?: string;
    newPassword?: string;
  }): { ok: boolean; reason?: string } => {
    const me = state.currentUser;
    if (!me) return { ok: false, reason: 'not-authenticated' };

    // e-mail duplicado (exceto eu)
    if (data.email) {
      const dup = Object.values(state.users).some(
        (u) => (u.user.email || '').toLowerCase() === data.email!.toLowerCase() && u.user.id !== me.id
      );
      if (dup) return { ok: false, reason: 'email-taken' };
    }

    const oldKey = me.username.toLowerCase();
    const newUsername = (data.username?.trim() || me.username);
    const newKey = newUsername.toLowerCase();

    if (newKey !== oldKey && state.users[newKey]) return { ok: false, reason: 'username-taken' };

    const newUser: User = { ...me, username: newUsername, email: data.email ?? me.email };

    const users = { ...state.users };
    const currentPwd = users[oldKey].password;
    delete users[oldKey];
    users[newKey] = { password: data.newPassword ?? currentPwd, user: newUser };

    dispatch({ type: 'LOAD_USERS', payload: users });
    dispatch({ type: 'LOGIN', payload: newUser });
    return { ok: true };
  };

  /** SUSPENDER usuário (somente admin) */
  const suspendUser = (userId: string, suspended: boolean): boolean => {
    if (!state.currentUser || state.currentUser.role !== 'admin') return false;
    if (state.currentUser.id === userId) return false; // não suspende a si mesmo
    dispatch({ type: 'SUSPEND_USER', payload: { userId, suspended } });
    return true;
  };

  /** LOGOUT */
  const logout = () => dispatch({ type: 'LOGOUT' });

  return (
    <AuthContext.Provider
      value={{ state, dispatch, login, logout, createUser, updateProfile, suspendUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/** Hook */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
