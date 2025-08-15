// src/App.tsx
import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';

// escolha a tela "logada" que você quer mostrar.
// Se você tem uma Home/Dashboard, importe ela.
// Pelo seu repo existe MainPage.tsx:
import MainPage from './components/MainPage';

export default function App() {
  const { state } = useAuth();
  // Se autenticado -> mostra o app; senão -> mostra login
  return state.isAuthenticated ? <MainPage /> : <LoginPage />;
}
