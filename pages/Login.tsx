
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { stackAuth } from '../services/stack-auth';
import { Mail, Lock, Layout, ShieldCheck } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const user = stackAuth.useUser();

  if (user) return <Navigate to="/app" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      stackAuth.login(email);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200 mb-4 transform -rotate-3">
            <Layout className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kanban & Pages</h1>
          <p className="text-slate-500 mt-2 font-medium">Sua produtividade em um só lugar.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="voce@empresa.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">Senha</label>
                <a href="#" className="text-xs text-blue-600 font-bold hover:underline">Esqueceu?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  disabled
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl outline-none opacity-50 cursor-not-allowed font-medium"
                  value="password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Entrar Agora'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-xs justify-center font-medium">
              <ShieldCheck className="w-4 h-4" />
              Autenticado via <span className="text-slate-900 font-bold">Stack Auth</span>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-8">
          Novo por aqui? <span className="text-blue-600 font-bold hover:underline cursor-pointer">Crie uma conta gratuita</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
