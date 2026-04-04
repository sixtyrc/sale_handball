import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, Info, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import clubLogoFallback from '../../assets/logo_club.png';

const api = axios.create({ baseURL: '${window.location.hostname === 'localhost' ? 'http://localhost:8002' : ''}/api/v1/' });

const SocioLoginPage = () => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { branding, fetchBranding } = useAuthStore();

  useEffect(() => {
    if (!branding) fetchBranding('salesianos');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('login/', { username: dni, password });
      const { access, user, primer_ingreso } = res.data;

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

  const currentLogo = branding?.logo 
    ? (branding.logo.startsWith('http') ? branding.logo : `${window.location.hostname === 'localhost' ? 'http://localhost:8002' : ''}${branding.logo}`) 
    : clubLogoFallback;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] px-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px] animate-pulse" />

      <div className="relative w-full max-w-[400px] z-10">
        {/* Branding Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <img 
                src={currentLogo} 
                alt="Logo" 
                className="relative w-24 h-24 object-contain drop-shadow-2xl brightness-110"
              />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">
            Portal <span className="text-red-600">Socio</span>
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">
            Gestión de Autogestión
          </p>
        </div>

        {/* Card Glassmorphism */}
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">
                Documento de Identidad
              </label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full px-5 py-4 bg-black/40 border border-zinc-800 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600/50 transition-all font-medium"
                placeholder="Ingresá tu DNI"
                required
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3 ml-1">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Contraseña
                </label>
                <Link to="/socio/recuperar-clave" className="text-[10px] font-bold text-zinc-600 hover:text-red-500 transition-colors uppercase tracking-widest">
                  ¿Olvidaste?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-black/40 border border-zinc-800 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600/50 transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold flex items-center gap-3 animate-shake">
                <Info size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-red-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={18} /> Procesando...</>
              ) : (
                <><LogIn size={18} /> Iniciar Sesión</>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="text-center mt-8">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <ShieldCheck size={14} /> Acceso Staff Administrativo
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SocioLoginPage;
