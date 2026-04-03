import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { KeyRound, Loader2, Info, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const api = axios.create({ baseURL: 'http://localhost:8000/api/v1/' });

const SocioCambiarClavePage = () => {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNueva, setShowNueva] = useState(false);
  const navigate = useNavigate();

  const token = sessionStorage.getItem('socio_token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nueva !== confirmar) { setError('Las contraseñas nuevas no coinciden.'); return; }
    if (nueva.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }

    setLoading(true);
    setError('');
    try {
      await api.post('auth/cambiar-password/', {
        password_actual: actual,
        password_nuevo: nueva,
        password_confirmar: confirmar,
      }, { headers: { Authorization: `Bearer ${token}` } });

      // Éxito → ir al dashboard
      navigate('/socio/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-950 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <KeyRound size={32} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Primer Ingreso</h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-xs mx-auto">
            Por seguridad, necesitás cambiar tu contraseña antes de continuar.
          </p>
        </div>

        <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          {/* Aviso de email */}
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6 text-sm text-blue-300">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>Configurá también tu email para poder recuperar tu contraseña en el futuro.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Contraseña actual (tu DNI)</label>
              <input
                type="password"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNueva ? 'text' : 'password'}
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all pr-12"
                  required
                />
                <button type="button" onClick={() => setShowNueva(!showNueva)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showNueva ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                <Info size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <><Loader2 className="animate-spin" size={18} /> Guardando...</> : <><CheckCircle2 size={18} /> Cambiar contraseña</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SocioCambiarClavePage;
