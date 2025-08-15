// src/App.tsx
import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import MainPage from './components/MainPage'; // troque pro seu componente logado

export default function App() {
  const { state } = useAuth();
  return state.isAuthenticated ? <MainPage /> : <LoginPage />;
}
