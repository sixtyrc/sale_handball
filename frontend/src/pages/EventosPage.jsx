import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import { useUIStore } from '../store/uiStore';
import { Calendar, MapPin, Clock, Users, Plus, Loader2, ChevronRight, Trophy } from 'lucide-react';

const EventosPage = () => {
    const { addToast } = useUIStore();
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEventos();
    }, []);

    const fetchEventos = async () => {
        try {
            setLoading(true);
            const response = await api.get('actividad/eventos/');
            setEventos(response.data);
        } catch (error) {
            console.error('Error fetching eventos:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Eventos y Partidos</h2>
                    <p className="text-slate-400">Fixture, amistosos y convocatoria de jugadores</p>
                </div>
                <button 
                    onClick={() => addToast({
                        type: 'info',
                        title: 'Módulo en Desarrollo',
                        message: 'La creación de eventos oficiales estará disponible en la próxima actualización.'
                    })}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={18} />
                    Nuevo Partido
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cargando Calendario...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Fixture List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Calendar size={20} className="text-blue-500" /> Próximos Encuentros</h3>
                        </div>
                        
                        {eventos.map(evento => (
                            <div key={evento.id} className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 p-6 rounded-3xl transition-all group flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex flex-col items-center justify-center text-slate-400 group-hover:bg-blue-600/20 group-hover:text-blue-500 transition-all">
                                        <span className="text-xs font-black uppercase tracking-widest">{new Date(evento.fecha).toLocaleString('es-ES', { month: 'short' })}</span>
                                        <span className="text-2xl font-black">{new Date(evento.fecha).getDate() + 1}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">{evento.categoria}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-white">{evento.titulo}</h4>
                                        <p className="text-slate-500 font-medium text-sm">vs {evento.rival}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right text-slate-400 space-y-1">
                                        <p className="flex items-center gap-2 text-sm justify-end"><Clock size={14} /> {evento.hora} hs</p>
                                        <p className="flex items-center gap-2 text-sm justify-end"><MapPin size={14} /> {evento.lugar}</p>
                                    </div>
                                    <button className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-colors">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Resumen Temporada</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl">
                                    <div className="flex items-center gap-3 text-slate-300">
                                        <Trophy size={18} className="text-amber-500" /> Partidos Jugados
                                    </div>
                                    <span className="text-xl font-black text-white">24</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                    <div className="flex items-center gap-3 text-emerald-500 font-bold">
                                         Victorias
                                    </div>
                                    <span className="text-xl font-black text-emerald-500">18</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-3xl text-center">
                            <Users size={32} className="mx-auto mb-4 text-blue-500" />
                            <h4 className="text-white font-bold mb-2">Convocatorias</h4>
                            <p className="text-sm text-slate-400 mb-4">Abre un partido para convocar jugadores de distintas categorías (Regla de Refuerzos Libre).</p>
                            <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors">
                                Ver Reglas Deportivas
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default EventosPage;
