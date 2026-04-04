import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import { useUIStore } from '../store/uiStore';
import { 
    Calendar, MapPin, Clock, Users, Plus, Loader2, 
    ChevronRight, Trophy, Filter, ListFilter, Search 
} from 'lucide-react';
import EventoFormModal from '../modules/deportes/EventoFormModal';
import PlanillaCargaModal from '../modules/deportes/PlanillaCargaModal';
import { useNavigate } from 'react-router-dom';

const EventosPage = () => {
    const { addToast } = useUIStore();
    const navigate = useNavigate();
    
    // Data states
    const [eventos, setEventos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI states
    const [isEventoModalOpen, setIsEventoModalOpen] = useState(false);
    const [isPlanillaModalOpen, setIsPlanillaModalOpen] = useState(false);
    const [selectedEventoId, setSelectedEventoId] = useState(null);
    
    // Filter states
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [evRes, catRes] = await Promise.all([
                api.get('actividad/eventos/'),
                api.get('deportes/categorias/')
            ]);
            
            // Ordenar por fecha_hora_inicio (descendente para mostrar siempre el último/próximo arriba)
            const sortedEvents = evRes.data.sort((a, b) => 
                new Date(b.fecha_hora_inicio) - new Date(a.fecha_hora_inicio)
            );
            
            setEventos(sortedEvents);
            setCategorias(catRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            addToast({ type: 'error', title: 'Error', message: 'No se pudieron cargar los eventos.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchEventos = async () => {
        try {
            const response = await api.get('actividad/eventos/');
            const sortedEvents = response.data.sort((a, b) => 
                new Date(b.fecha_hora_inicio) - new Date(a.fecha_hora_inicio)
            );
            setEventos(sortedEvents);
        } catch (error) {
            console.error('Error fetching eventos:', error);
        }
    };

    // Logic to filter the displayed events
    const filteredEventos = eventos.filter(evento => {
        // Filter by Category
        const matchCategory = filterCategory === 'ALL' || evento.categoria === filterCategory;
        
        // Filter by Date
        const eventDate = new Date(evento.fecha_hora_inicio);
        const matchFrom = !filterDateFrom || eventDate >= new Date(filterDateFrom);
        const matchTo = !filterDateTo || eventDate <= new Date(filterDateTo + 'T23:59:59');

        return matchCategory && matchFrom && matchTo;
    });

    return (
        <MainLayout>
            {/* ENCABEZADO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-2">Partidos</h2>
                    <p className="text-slate-400 font-medium">Fixture, entrenamientos y carga de planillas dinámicas</p>
                </div>
                <button 
                    onClick={() => setIsEventoModalOpen(true)}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={20} />
                    Agendar nuevo Partido
                </button>
            </div>

            {/* BARRA DE FILTROS PREMIUM */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[32px] mb-8 backdrop-blur-md">
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl">
                            <Filter size={20} />
                        </div>
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Filtros de Búsqueda</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                        {/* Filtro Categoría */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Categoría Deportiva</label>
                            <div className="relative">
                                <Users size={16} className="absolute left-4 top-3.5 text-slate-600" />
                                <select 
                                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-blue-600 appearance-none transition-all"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="ALL">Todas las Categorías</option>
                                    {categorias.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.nombre} ({cat.genero})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Filtro Fecha Desde */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha Desde</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-4 top-3.5 text-slate-600" />
                                <input 
                                    type="date" 
                                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-blue-600 transition-all [color-scheme:dark]"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Filtro Fecha Hasta */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha Hasta</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-4 top-3.5 text-slate-600" />
                                <input 
                                    type="date" 
                                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-blue-600 transition-all [color-scheme:dark]"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Botón reset (opuesto a los otros) */}
                    {(filterCategory !== 'ALL' || filterDateFrom || filterDateTo) && (
                        <button 
                            onClick={() => {
                                setFilterCategory('ALL');
                                setFilterDateFrom('');
                                setFilterDateTo('');
                            }}
                            className="shrink-0 text-[10px] font-black text-blue-500 border-b border-blue-500/20 hover:border-blue-500 transition-all uppercase tracking-tighter"
                        >
                            Limpiar Filtros
                        </button>
                    )}
                </div>
            </div>

            <PlanillaCargaModal 
                isOpen={isPlanillaModalOpen} 
                onClose={() => setIsPlanillaModalOpen(false)} 
                eventoId={selectedEventoId}
                onSuccess={fetchInitialData} 
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando Agenda...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* MAIN EVENTS LIST */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between pb-2">
                             <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                <ListFilter size={16} /> 
                                {filteredEventos.length} Encuentros Encontrados
                            </h3>
                        </div>
                        
                        {filteredEventos.length === 0 ? (
                            <div className="bg-slate-900/30 border border-slate-800 border-dashed p-20 rounded-[40px] text-center">
                                <Search size={48} className="mx-auto text-slate-700 mb-4" />
                                <p className="text-slate-500 font-bold">No hay eventos que coincidan con los filtros aplicados.</p>
                                <button onClick={() => { setFilterCategory('ALL'); setFilterDateFrom(''); setFilterDateTo(''); }} className="text-blue-500 mt-2 text-sm font-bold hover:underline">Ver todos los eventos</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredEventos.map(evento => (
                                    <div 
                                        key={evento.id} 
                                        onClick={() => navigate(`/eventos/${evento.id}`)}
                                        className="bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 hover:bg-slate-800/80 p-6 rounded-[32px] transition-all group flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer shadow-lg hover:shadow-blue-500/5 relative overflow-hidden"
                                    >
                                        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex flex-col items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner border border-white/5">
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">{new Date(evento.fecha_hora_inicio).toLocaleString('es-ES', { month: 'short' })}</span>
                                                    <span className="text-2xl font-black leading-none">{new Date(evento.fecha_hora_inicio).getDate()}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[9px] font-black px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/10 uppercase tracking-widest">{evento.categoria_nombre || 'GENERAL'}</span>
                                                        <span className="text-[9px] font-black px-3 py-1 bg-slate-800 text-slate-500 rounded-full border border-white/5 uppercase tracking-widest">{evento.tipo.replace('_', ' ')}</span>
                                                        
                                                        {['PARTIDO_OFICIAL', 'AMISTOSO'].includes(evento.tipo) && (
                                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${
                                                                evento.estado_planilla === 'CERRADA' 
                                                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' 
                                                                    : 'bg-amber-500/20 text-amber-500 border-amber-500/20'
                                                            }`}>
                                                                {evento.estado_planilla === 'CERRADA' ? `Planilla Cerrada (${evento.score_final})` : 'Planilla Pendiente'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors leading-tight mb-1">{evento.titulo}</h4>
                                                    <p className="text-slate-500 font-bold text-sm italic">{evento.rival ? `vs ${evento.rival}` : 'Actividad Interna'}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row items-center gap-8">
                                                <div className="text-right space-y-2 hidden sm:block">
                                                    <p className="flex items-center gap-2 text-sm font-black text-slate-300 justify-end"><Clock size={16} className="text-amber-500" /> {new Date(evento.fecha_hora_inicio).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})} hs</p>
                                                    <p className="flex items-center gap-2 text-sm font-bold text-slate-500 justify-end"><MapPin size={16} className="text-emerald-500" /> {evento.lugar || 'Local'}</p>
                                                </div>

                                                <div className="flex gap-2">
                                                    {['PARTIDO_OFICIAL', 'AMISTOSO'].includes(evento.tipo) && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedEventoId(evento.id);
                                                                setIsPlanillaModalOpen(true);
                                                            }}
                                                            className={`px-5 py-3 rounded-xl font-bold text-xs transition-all border shadow-lg ${
                                                                evento.estado_planilla === 'CERRADA'
                                                                    ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                                                    : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-blue-600/20'
                                                            }`}
                                                        >
                                                            {evento.estado_planilla === 'CERRADA' ? 'Editar Planilla' : 'Cargar Planilla'}
                                                        </button>
                                                    )}
                                                    <div className="p-4 bg-slate-800 group-hover:bg-blue-600 text-white rounded-2xl transition-all shadow-xl scale-90 group-hover:scale-100 flex items-center justify-center">
                                                        <ChevronRight size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SIDEBAR PANEL */}
                    <div className="space-y-8">
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] pointer-events-none"></div>
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3"><Trophy size={16} className="text-amber-500" /> Resumen Global</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-5 bg-slate-950/80 rounded-3xl border border-white/5 shadow-inner">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Encuentros</span>
                                        <span className="text-slate-300 font-bold">Temporada 2026</span>
                                    </div>
                                    <span className="text-4xl font-black text-white">{eventos.length}</span>
                                </div>
                                <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl group transition-all hover:bg-emerald-500/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Rendimiento</span>
                                        <TrendingUp size={16} className="text-emerald-500" />
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-black text-emerald-500 italic">82%</span>
                                        <span className="text-emerald-900 font-black text-[10px] uppercase tracking-widest mb-2">Efectividad</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/5 border border-blue-500/20 p-10 rounded-[40px] text-center shadow-xl group relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:rotate-12 transition-all">
                                    <Users size={32} />
                                </div>
                                <h4 className="text-2xl font-black text-white mb-3">Citaciones</h4>
                                <p className="text-sm text-slate-400 font-medium mb-6 leading-relaxed">Entrá a un partido para gestionar la planilla de citados y tomar asistencia en tiempo real.</p>
                                <button onClick={() => navigate('/socios')} className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black transition-all hover:bg-blue-300 active:scale-95 shadow-lg shadow-white/5">
                                    Explorar Padrones
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

// Simple export helper for the summary on the right
const TrendingUp = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);

export default EventosPage;
