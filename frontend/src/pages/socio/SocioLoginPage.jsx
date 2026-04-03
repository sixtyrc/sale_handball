import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, Info, Loader2, ShieldCheck } from 'lucide-react';

const api = axios.create({ baseURL: 'http://localhost:8000/api/v1/' });

const SocioLoginPage = () => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('login/', { username: dni, password });
      const { access, user, primer_ingreso } = res.data;

      // Guardar token en sessionStorage (no localStorage — más seguro para socios)
      sessionStorage.setItem('socio_token', access);
      sessionStorage.setItem('socio_user', JSON.stringify(user));

      if (primer_ingreso) {
        navigate('/socio/cambiar-clave');
      } else {
        navigate('/socio/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'DNI o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-950 px-4">
      {/* Glow de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/20 mb-4">
            <ShieldCheck size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Portal del Socio</h1>
          <p className="text-zinc-400 text-sm mt-1">Ingresá con tu DNI y contraseña</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">DNI (Usuario)</label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all"
                placeholder="Ej: 38291847"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all"
                placeholder="••••••••"
                required
              />
              <div className="text-right mt-1">
                <Link to="/socio/recuperar-clave" className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <Info size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-semibold rounded-xl shadow-lg shadow-red-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="animate-spin" size={18} /> Ingresando...</> : <><LogIn size={18} /> Ingresar</>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          ¿Sos del staff? <Link to="/login" className="text-zinc-400 hover:text-white transition-colors">Ir al panel admin</Link>
        </p>
      </div>
    </div>
  );
};

export default SocioLoginPage;
