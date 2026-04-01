import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { LogIn, Info } from 'lucide-react';
import Footer from '../components/layout/Footer';
import clubLogo from '../assets/logo_club.png';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, env, version } = useAuthStore();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 shadow-2xl relative overflow-hidden">
          {/* Glow Effects */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">
                Salesianos <span className="text-red-600">Handball</span>
              </h2>
              <p className="text-gray-400">Gestión Institucional de Alto Rendimiento</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-light"
                  placeholder="Ingresa tu usuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-light"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <Info size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Iniciar sesión
              </button>
            </form>

            {/* Version Footer */}
            <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
              <span className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${env === 'dev' ? 'bg-amber-500/50' : 'bg-blue-500/50'}`}></div>
                Entorno: {env}
              </span>
              <span>Handball v{version}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Global Branding Footer */}
      <Footer />
    </div>
  );
};

export default LoginPage;
