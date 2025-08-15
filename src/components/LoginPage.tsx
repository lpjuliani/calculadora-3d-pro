import React, { useState } from 'react';
import { LogIn, Lock, User, Calculator } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login, state: authState } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await login(formData.username, formData.password);
      if (!ok) {
        const identifier = formData.username.trim().toLowerCase();
        const userData = Object.values(authState.users).find(
          (u) =>
            u.user.username.toLowerCase() === identifier ||
            (u.user.email || '').toLowerCase() === identifier
        );
        if (!userData) setError('Usuário não encontrado. Verifique se digitou corretamente.');
        else if (userData.user.suspended) setError('Acesso suspenso. Entre em contato com o administrador.');
        else setError('Senha incorreta. Tente novamente.');
        return;
      }
      // IMPORTANTE: não faça redirect/reload aqui.
      // O App.tsx vai re-renderizar mostrando o painel ao ver isAuthenticated=true.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calculadora 3D Pro</h1>
          <p className="text-gray-600">Entre na sua conta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuário ou E-mail *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ex.: admin ou email@dominio.com"
                  autoComplete="username email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-blue-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (<><LogIn className="w-5 h-5" /><span>Entrar</span></>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
