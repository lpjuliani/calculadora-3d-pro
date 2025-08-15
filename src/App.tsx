import React from 'react';
import { useAuth } from './context/AuthContext';

// ajuste o import abaixo para a “home” da sua aplicação
import AdminPanel from './components/tabs/AdminPanel'; 
import LoginPage from './components/LoginPage';

export default function App() {
  const { state } = useAuth();
  // se autenticado -> mostra app; senão -> login
  return state.isAuthenticated ? <AdminPanel /> : <LoginPage />;
}
