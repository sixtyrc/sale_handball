import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
    Store, 
    Calendar, 
    Users, 
    Coffee, 
    Plus, 
    Loader2, 
    ChevronRight,
    MapPin,
    Clock,
    Lock,
    MessageCircle,
    Copy,
    Check,
    AlertCircle,
    CheckCircle2,
    Trophy
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import JornadaFormModal from '../modules/locales/JornadaFormModal';
import RankingFamiliasModal from '../modules/locales/RankingFamiliasModal';

const LocalesPage = () => {
    const { addToast, branding } = useAuthStore();
    const { addToast: addToastUI } = useUIStore();
    const navigate = useNavigate();
    const [jornadas, setJornadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isJornadaModalOpen, setIsJornadaModalOpen] = useState(false);
    const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
    const [copiadoId, setCopiadoId] = useState(null);

    const generarMensajeWsp = (j) => {
        const clubNombre = branding?.club_nombre || 'El Club';
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/locales/${j.slug}/login`;
        return (
            `🏟️ *${clubNombre} — ${j.titulo}*\n` +
            `📅 *Fecha:* ${j.fecha}\n\n` +
            `¡Hola! Te invitamos a colaborar como voluntario en nuestra jornada como local.\n\n` +
            `🔗 *Acceso:* ${url}\n` +
            `🔑 *PIN de acceso:* ${j.access_pin}\n\n` +
            `(El PIN vence a las 24hs. ¡Gracias por el apoyo! 🤝)`
        );
    };

    const compartirWhatsApp = (j) => {
        const msg = generarMensajeWsp(j);
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const copiarMensaje = async (j) => {
        const msg = generarMensajeWsp(j);
        await navigator.clipboard.writeText(msg);
        setCopiadoId(j.id);
        setTimeout(() => setCopiadoId(null), 2500);
    };

    useEffect(() => {
        fetchJornadas();
    }, []);

    const fetchJornadas = async () => {
        try {
            const response = await api.get('locales/jornadas/');
            setJornadas(response.data);
        } catch (error) {
            console.error('Error fetching jornadas:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'EN_CURSO': return 'bg-emerald-500 text-white animate-pulse';
            case 'PLANEADA': return 'bg-blue-600 text-white';
            case 'FINALIZADA': return 'bg-slate-700 text-slate-300';
            case 'CANCELADA': return 'bg-red-900 text-red-300';
            default: return 'bg-slate-800 text-slate-400';
        }
    };

    return (
        <MainLayout>
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Locales</h2>
                    <p className="text-slate-400">Gestión de jornadas, cantina y voluntarios</p>
                </div>
                
                <button 
                    onClick={() => setIsJornadaModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={18} />
                    Nueva Jornada
                </button>
            </div>

            <JornadaFormModal 
                isOpen={isJornadaModalOpen} 
                onClose={() => setIsJornadaModalOpen(false)} 
                onSuccess={fetchJornadas} 
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest tracking-widest">Sincronizando Agenda...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {/* Active Jornada Highlight */}
                    {jornadas.filter(j => j.estado === 'EN_CURSO').map(j => (
                        <div key={j.id} className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/30 rounded-[2rem] p-8 shadow-2xl shadow-emerald-900/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8">
                                <span className="px-4 py-2 bg-emerald-500 text-white text-xs font-black rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                    En Curso Ahora
                                </span>
                            </div>
                            
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-emerald-500">
                                        <MapPin size={24} />
                                        <span className="font-bold tracking-tight text-lg">Salesianos Local</span>
                                    </div>
                                    <h3 className="text-5xl font-black text-white">{j.titulo}</h3>
                                    <div className="flex items-center gap-6 text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={18} />
                                            <span className="font-medium">{j.fecha}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={18} />
                                            <span className="font-medium">Desde 09:00hs</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <div className="bg-slate-900/80 border border-slate-700/50 p-6 rounded-3xl backdrop-blur-md">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg"><Users size={20} /></div>
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Voluntarios</span>
                                        </div>
                                        <p className="text-2xl font-black text-white">12 <span className="text-xs text-slate-500 font-medium">/ 15</span></p>
                                    </div>
                                    <div className="bg-slate-900/80 border border-slate-700/50 p-6 rounded-3xl backdrop-blur-md">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-amber-600/10 text-amber-500 rounded-lg"><Coffee size={20} /></div>
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Caja Cantina</span>
                                        </div>
                                        <p className="text-2xl font-black text-white">$ 45.300</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-slate-800 flex flex-wrap gap-4 relative z-10">
                                <Link 
                                    to={`/locales/${j.slug}/pos`}
                                    className="flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                                >
                                    <Store size={20} />
                                    Abrir POS Cantina
                                </Link>
                                <Link 
                                    to={`/locales/${j.id}/cierre`}
                                    className="flex items-center gap-3 bg-slate-800 text-white px-8 py-4 rounded-2xl font-black transition-all hover:bg-slate-700"
                                >
                                    Administrar / Cierre
                                </Link>
                                {/* 🟢 Bloque de Compartir por WhatsApp */}
                                <div className="ml-auto flex items-center gap-3">
                                    {/* PIN Badge */}
                                    <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 px-4 py-2 rounded-xl">
                                        <Lock size={14} className="text-amber-400" />
                                        <span className="text-xs font-mono text-slate-300">PIN: <span className="text-amber-400 font-black text-sm">{j.access_pin || '----'}</span></span>
                                    </div>
                                    {/* Copiar Mensaje */}
                                    <button
                                        onClick={() => copiarMensaje(j)}
                                        title="Copiar mensaje con PIN"
                                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-all text-sm font-medium"
                                    >
                                        {copiadoId === j.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                        {copiadoId === j.id ? 'Copiado!' : 'Copiar msg'}
                                    </button>
                                    {/* Compartir WhatsApp */}
                                    <button
                                        onClick={() => compartirWhatsApp(j)}
                                        className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white px-5 py-2 rounded-xl font-bold transition-all shadow-lg shadow-green-600/20 active:scale-95"
                                    >
                                        <MessageCircle size={18} />
                                        Compartir
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Past Journeys List */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden">
                        <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                            <h4 className="text-lg font-bold text-white tracking-tight">Historial de Jornadas</h4>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl">
                                    <Calendar size={16} className="text-slate-500" />
                                    <span className="text-xs font-bold text-slate-400">Marzo 2026</span>
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-800/50">
                            {jornadas.filter(j => j.estado !== 'EN_CURSO').length > 0 ? jornadas.filter(j => j.estado !== 'EN_CURSO').map(j => (
                                <div key={j.id} className="p-8 hover:bg-slate-800/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 group-hover:border-blue-500/50 group-hover:bg-blue-600/5 transition-all">
                                            <span className="text-[10px] font-black uppercase tracking-widest">{j.fecha.split('-')[1]}</span>
                                            <span className="text-xl font-black text-white">{j.fecha.split('-')[2]}</span>
                                        </div>
                                        <div>
                                            <h5 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{j.titulo}</h5>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${getStatusColor(j.estado)}`}>
                                                    {j.estado.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-slate-500 flex items-center gap-2">
                                                    <Users size={12} /> {j.voluntarios_count || 0} Voluntarios
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {j.estado === 'FINALIZADA' && (
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cierre Neto</p>
                                                <p className="text-xl font-bold text-emerald-500">$ {j.balance_neto || '0'}</p>
                                            </div>
                                        )}
                                        {/* WhatsApp para jornadas PLANEADAS del historial */}
                                        {j.estado === 'PLANEADA' && (
                                            <button
                                                onClick={() => compartirWhatsApp(j)}
                                                title="Compartir convocatoria por WhatsApp"
                                                className="flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white px-4 py-2 rounded-xl transition-all text-sm font-bold"
                                            >
                                                <MessageCircle size={16} />
                                                Convocatoria
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => navigate(`/locales/${j.id}/cierre`)}
                                            className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2 rounded-xl font-bold transition-all hover:bg-slate-700 active:scale-95 text-sm"
                                        >
                                            {j.estado === 'FINALIZADA' ? 'Ver Arqueo' : 'Administrar'}
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-20 text-center text-slate-500">
                                    No hay jornadas registradas anteriormente.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Muro de Ayuda Info */}
            <div className="mt-12 bg-blue-600/5 border border-blue-600/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="p-5 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20">
                    <Trophy size={40} />
                </div>
                <div className="flex-grow">
                    <h5 className="text-xl font-bold text-white mb-2 underline decoration-blue-500 underline-offset-4">Muro de Ayuda Institucional</h5>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                        El club premia la colaboración de las familias. Todas las donaciones para cantina y horas de voluntariado suman puntos para tu ranking. ¡Gracias por hacer crecer al club!
                    </p>
                </div>
                <button 
                    onClick={() => setIsRankingModalOpen(true)}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-lg active:scale-95 whitespace-nowrap"
                >
                    Ver Ranking Familias
                </button>
            </div>

            <RankingFamiliasModal 
                isOpen={isRankingModalOpen} 
                onClose={() => setIsRankingModalOpen(false)} 
            />
        </MainLayout>
    );
};

export default LocalesPage;
