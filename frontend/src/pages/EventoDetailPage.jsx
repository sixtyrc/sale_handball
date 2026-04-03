import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import { useUIStore } from '../store/uiStore';
import { 
    ArrowLeft, Clock, MapPin, Users, CheckSquare, Banknote, ShieldAlert, CheckCircle2, 
    UserPlus, Loader2, Info, InfoIcon, HelpingHand, Lightbulb, Search, Plus
} from 'lucide-react';

const EventoDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useUIStore();
    
    const [evento, setEvento] = useState(null);
    const [convocables, setConvocables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('CONVOCATORIA'); // CONVOCATORIA, ASISTENCIA, FINANZAS
    
    // State for Convocatoria
    const [selectedConvocables, setSelectedConvocables] = useState([]);
    const [reinforcementSearch, setReinforcementSearch] = useState('');
    const [reinforcementResults, setReinforcementResults] = useState([]);
    const [searchingReinforcement, setSearchingReinforcement] = useState(false);
    
    // State for Asistencia
    const [asistencias, setAsistencias] = useState({});
    
    // State for Finanzas / Stats
    const [costoArbitro, setCostoArbitro] = useState('');
    const [monto3T, setMonto3T] = useState('');
    const [concepto3T, setConcepto3T] = useState('Sándwich + Gaseosa');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const evRes = await api.get(`actividad/eventos/${id}/`);
            setEvento(evRes.data);

            const convRes = await api.get(`actividad/eventos/${id}/convocables/`);
            setConvocables(convRes.data);
            
            // INTELIGENCIA: Los que vienen de la categoría titular ya vienen pre-tildados
            const preSelected = convRes.data
                .filter(p => p.pre_seleccionado)
                .map(p => p.id);
            
            setSelectedConvocables(preSelected);

            setAsistencias(
                convRes.data.reduce((acc, p) => ({ ...acc, [p.id]: 'PRESENTE' }), {})
            );
        } catch (err) {
            console.error("Error fetching event data", err);
            const msg = err.response?.data?.error || err.response?.data?.detail || 'No se pudo cargar la planilla del evento.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const searchReinforcements = async (query) => {
        if (query.length < 3) {
            setReinforcementResults([]);
            return;
        }
        setSearchingReinforcement(true);
        try {
            const res = await api.get(`actividad/eventos/${id}/convocables/?search=${query}`);
            // Evitar duplicados con los que ya están en la lista principal
            const existingIds = convocables.map(c => c.id);
            const results = res.data.filter(r => !existingIds.includes(r.id));
            setReinforcementResults(results);
        } catch (err) {
            console.error("Error searching reinforcements", err);
        } finally {
            setSearchingReinforcement(false);
        }
    };

    const addReinforcement = (player) => {
        if (!convocables.find(c => c.id === player.id)) {
            setConvocables([...convocables, { ...player, es_refuerzo: true }]);
            setSelectedConvocables([...selectedConvocables, player.id]);
        }
        setReinforcementSearch('');
        setReinforcementResults([]);
    };

    const handleSaveConvocatoria = async () => {
        if (selectedConvocables.length === 0) {
            addToast({ type: 'warning', title: 'Atención', message: 'Seleccione al menos un jugador para convocar.' });
            return;
        }
        setLoading(true);
        try {
            const res = await api.post(`actividad/eventos/${id}/convocar/`, {
                jugadores_ids: selectedConvocables
            });
            addToast({ type: 'success', title: 'Citación Guardada', message: 'La lista de buena fe ha sido actualizada.' });
        } catch (err) {
            console.error(err);
            addToast({ type: 'error', title: 'Error', message: 'No se pudo guardar la convocatoria.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAsistencia = async () => {
        const payload = Object.keys(asistencias).map(jid => ({
            jugador_id: jid,
            estado: asistencias[jid]
        }));
        
        if (payload.length === 0) {
            addToast({ type: 'warning', title: 'Atención', message: 'No hay jugadores en la planilla para tomar asistencia.' });
            return;
        }

        setLoading(true);
        try {
            await api.post(`actividad/eventos/${id}/asistencia/`, { asistencias: payload });
            addToast({ type: 'success', title: 'Asistencia Guardada', message: 'Estado de presencia actualizado en la nube.' });
        } catch (err) {
            addToast({ type: 'error', title: 'Error', message: 'Fallo al guardar asistencia.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCobrarArbitraje = async () => {
        if (!costoArbitro || parseFloat(costoArbitro) <= 0) {
            addToast({ type: 'warning', title: 'Monto Requerido', message: 'Ingrese el total del árbitro.' });
            return;
        }

        const presentesIds = Object.keys(asistencias).filter(id => asistencias[id] === 'PRESENTE' || asistencias[id] === 'TARDE');
        
        if (presentesIds.length === 0) {
            addToast({ type: 'error', title: 'Sin Jugadores', message: 'Debe haber jugadores presentes para prorratear el costo.' });
            return;
        }

        setLoading(true);
        try {
            // Nota: El backend espera monto_total o costo_total_arbitro según la versión, usamos el estándar de la fase
            await api.post(`actividad/eventos/${id}/cobrar-arbitraje/`, { 
                monto_total: parseFloat(costoArbitro),
                jugadores_ids: presentesIds 
            });
            addToast({ type: 'success', title: 'Arbitraje Cobrado', message: `Se debitó el proporcional a cada jugador presente.` });
            setCostoArbitro('');
        } catch (err) {
            addToast({ type: 'error', title: 'Error', message: 'Error al procesar el cobro de árbitro.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCobrar3T = async () => {
        if (!monto3T || parseFloat(monto3T) <= 0) {
            addToast({ type: 'warning', title: 'Monto Requerido', message: 'Ingrese un monto para el 3T.' });
            return;
        }
        
        const presentesIds = Object.keys(asistencias).filter(id => asistencias[id] === 'PRESENTE' || asistencias[id] === 'TARDE');
        
        if (presentesIds.length === 0) {
            addToast({ type: 'error', title: 'Sin Jugadores', message: 'No hay jugadores presentes.' });
            return;
        }

        setLoading(true);
        try {
            await api.post(`actividad/eventos/${id}/cobrar-tercer-tiempo/`, { 
                monto: parseFloat(monto3T), 
                concepto: concepto3T,
                jugadores_ids: presentesIds
            });
            addToast({ type: 'success', title: '3T Cobrado', message: 'Débitos generados correctamente.' });
            setMonto3T('');
        } catch (err) {
            addToast({ type: 'error', title: 'Error', message: 'Error al procesar el cobro.' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <MainLayout>
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando Planilla del Evento...</p>
            </div>
        </MainLayout>
    );

    if (!evento) return (
        <MainLayout>
            <div className="flex flex-col items-center justify-center py-40 gap-6 text-center">
                <div className="p-6 bg-red-500/10 text-red-500 rounded-3xl">
                    <ShieldAlert size={48} />
                </div>
                <h2 className="text-2xl font-black text-white">Error cargando planilla</h2>
                <p className="text-slate-400 max-w-md">{error || 'No se encontró el evento solicitado.'}</p>
                <button onClick={() => navigate('/eventos')} className="mt-4 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">
                    ← Volver a la Agenda
                </button>
            </div>
        </MainLayout>
    );

    return (
        <MainLayout>
            {/* Header section with back button and basic event info */}
            <div className="mb-6 pb-6 border-b border-slate-800">
                <button 
                    onClick={() => navigate('/eventos')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group"
                >
                    <div className="p-2 bg-slate-900 rounded-xl group-hover:bg-slate-800 transition-all"><ArrowLeft size={16} /></div>
                    <span className="font-bold">Volver a la Agenda</span>
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/10 shadow-sm">{evento.tipo.replace('_', ' ')}</span>
                            {evento.categoria_nombre ? (
                                <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700">{evento.categoria_nombre}</span>
                            ) : (
                                <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-emerald-900/20 text-emerald-400 rounded-full border border-emerald-500/10 tracking-widest">Actividad General</span>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-2">{evento.titulo}</h1>
                        <p className="text-slate-400 font-medium text-lg italic">{evento.rival ? `vs ${evento.rival}` : (evento.descripcion || 'Sin descripción adicional')}</p>
                    </div>
                    <div className="bg-slate-900/80 border-slate-800 border p-5 rounded-3xl flex flex-col gap-3 shadow-xl backdrop-blur-md min-w-[200px]">
                        <div className="flex items-center gap-3 text-slate-200 font-bold">
                            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg"><Clock size={16} /></div>
                            {new Date(evento.fecha_hora_inicio).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})} hs | {new Date(evento.fecha_hora_inicio).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})}
                        </div>
                        <div className="flex items-center gap-3 text-slate-200 font-bold">
                            <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg"><MapPin size={16} /></div>
                            {evento.lugar || 'Club Salesianos (Local)'}
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION with context tooltips (visual) */}
            <div className="flex flex-col gap-4 mb-4">
                 <div className="flex flex-wrap gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 w-full overflow-hidden">
                    <button onClick={() => setActiveTab('CONVOCATORIA')} className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all flex-grow md:flex-grow-0 justify-center group ${activeTab === 'CONVOCATORIA' ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <UserPlus size={18} /> Planilla de Convocados
                    </button>
                    <button onClick={() => setActiveTab('ASISTENCIA')} className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all flex-grow md:flex-grow-0 justify-center group ${activeTab === 'ASISTENCIA' ? 'bg-blue-600 text-white shadow-xl scale-[1.02]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <CheckSquare size={18} /> Toma de Asistencia
                    </button>
                    <button onClick={() => setActiveTab('FINANZAS')} className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all flex-grow md:flex-grow-0 justify-center group ${activeTab === 'FINANZAS' ? 'bg-amber-600 text-white shadow-xl scale-[1.02]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Banknote size={18} /> Árbitros & Tercer Tiempo
                    </button>
                </div>
            </div>

            {/* QUICK HELP TIPS SECTION (Premium UI) */}
            <div className="mb-8 p-4 bg-slate-950 border-l-4 border-l-blue-600 rounded-2xl flex gap-4 items-start shadow-inner">
                <div className="p-2 bg-blue-600/10 text-blue-500 rounded-full animate-pulse"><Lightbulb size={20} /></div>
                <div>
                     <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Tip de Uso del Profe:</p>
                     <p className="text-sm text-slate-300 font-medium italic">
                        {activeTab === 'CONVOCATORIA' && "Seleccioná a los jugadores que citaste. Si ves un ícono de alerta roja ⚠️ significa que el jugador tiene deuda o apto médico vencido. Podés convocarlo igual, pero avisale!"}
                        {activeTab === 'ASISTENCIA' && "Marcá quiénes están en la cancha. Al terminar, dale a 'Cerrar Planilla'. Solo los Presentes (P) o Tardes (T) podrán ser incluidos en los cobros de árbitros y comida."}
                        {activeTab === 'FINANZAS' && "Cargá el monto del árbitro y el sistema debitará automáticamente la parte proporcional de cada jugador presente. ¡Olvidate de andar cobrando en mano!"}
                     </p>
                </div>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
                
                {/* 1. TAB: CONVOCATORIA (PLANTEL) */}
                {activeTab === 'CONVOCATORIA' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
                            <div>
                                <h3 className="text-2xl font-black text-white leading-none mb-2">Citación de Jugadores</h3>
                                <p className="text-slate-400 text-sm max-w-2xl font-medium">Auto-seleccionados: Socios de la categoría. Reinicia el listado o busca refuerzos abajo.</p>
                            </div>
                            <button onClick={handleSaveConvocatoria} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg active:scale-95 flex items-center gap-3 w-full md:w-auto justify-center">
                                <CheckCircle2 size={20} /> Guardar Convocatoria
                            </button>
                        </div>

                        {/* BUSCADOR DE REFUERZOS */}
                        <div className="relative group max-w-md">
                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-2 ml-1">Sumar Refuerzo (Categorías Menores)</label>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <Search size={18} className="absolute left-4 top-4 text-slate-500" />
                                    <input 
                                        type="text"
                                        value={reinforcementSearch}
                                        onChange={(e) => {
                                            setReinforcementSearch(e.target.value);
                                            searchReinforcements(e.target.value);
                                        }}
                                        placeholder="Nombre o Apellido del refuerzo..."
                                        className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                                    />
                                    {searchingReinforcement && <Loader2 size={16} className="absolute right-4 top-4 animate-spin text-blue-500" />}
                                </div>
                            </div>

                            {/* Resultados de búsqueda flotantes */}
                            {reinforcementResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                                    {reinforcementResults.map(r => (
                                        <button 
                                            key={r.id}
                                            onClick={() => addReinforcement(r)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                        >
                                            <div className="text-left">
                                                <p className="font-black text-white">{r.nombre_completo}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">{r.categoria}</p>
                                            </div>
                                            <div className="p-2 bg-blue-600/10 text-blue-500 rounded-xl"><Plus size={16} /></div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {convocables.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <Users size={48} className="mx-auto text-slate-700" />
                                <p className="text-slate-500 font-bold">No hay socios cargados con perfil deportivo en esta rama.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {convocables.map(j => {
                                    const selected = selectedConvocables.includes(j.id);
                                    const isWarning = j.eligibility?.warnings?.length > 0;
                                    return (
                                        <div 
                                            key={j.id} 
                                            onClick={() => {
                                                if (selected) setSelectedConvocables(selectedConvocables.filter(id => id !== j.id));
                                                else setSelectedConvocables([...selectedConvocables, j.id]);
                                            }} 
                                            className={`relative border p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4 group ${selected ? 'border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-500/5' : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-700'}`}>
                                                {selected && <CheckCircle2 size={14} />}
                                            </div>
                                            <div className="flex-grow">
                                                <p className={`font-black tracking-tight ${selected ? 'text-blue-400' : 'text-white'}`}>{j.nombre_completo}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${j.es_refuerzo ? 'bg-purple-900/40 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                                                        {j.es_refuerzo ? 'Refuerzo' : 'Oficial'}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{j.categoria}</span>
                                                </div>
                                            </div>
                                            {isWarning && (
                                                <div className="p-2 bg-red-500/10 text-red-500 rounded-xl" title={j.eligibility.warnings.map(w => w.mensaje).join(' / ')}>
                                                    <ShieldAlert size={18} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. TAB: ASISTENCIA (DE CANCHA) */}
                {activeTab === 'ASISTENCIA' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
                            <div>
                                <h3 className="text-2xl font-black text-white leading-none mb-2">Control de Presencia</h3>
                                <p className="text-slate-400 text-sm max-w-2xl font-medium italic">"Lo que no se mide, no se mejora". Marcá la asistencia real del equipo en este encuentro.</p>
                            </div>
                            <button onClick={handleSaveAsistencia} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg active:scale-95 flex items-center gap-3">
                                <CheckSquare size={20} /> Guardar & Cerrar Planilla
                            </button>
                        </div>

                        {selectedConvocables.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <ShieldAlert size={48} className="mx-auto text-amber-500" />
                                <p className="text-slate-400 font-bold max-w-xs mx-auto">Primero debés seleccionar a los jugadores en la pestaña de **Convocatoria** para abrir la planilla de toma de asistencia.</p>
                                <button onClick={() => setActiveTab('CONVOCATORIA')} className="text-blue-500 font-black text-sm uppercase tracking-widest hover:underline">Ir a convocar jugadores</button>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5 bg-slate-950/30 rounded-3xl overflow-hidden border border-white/5">
                                {convocables.filter(j => selectedConvocables.includes(j.id)).map(j => (
                                    <div key={j.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-4 w-full md:w-1/3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-500 border border-slate-700">{j.nombre_completo.charAt(0)}</div>
                                            <div>
                                                <h4 className="text-xl font-black text-white">{j.nombre_completo}</h4>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{j.categoria}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl w-full md:w-auto justify-between shadow-inner">
                                            <button 
                                                onClick={() => setAsistencias({...asistencias, [j.id]: 'PRESENTE'})} 
                                                className={`flex-grow md:flex-grow-0 px-8 py-3 rounded-xl font-black transition-all ${asistencias[j.id] === 'PRESENTE' ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'text-slate-600 hover:text-slate-400'}`}
                                            >
                                                PRESENTE
                                            </button>
                                            <button 
                                                onClick={() => setAsistencias({...asistencias, [j.id]: 'TARDE'})} 
                                                className={`flex-grow md:flex-grow-0 px-8 py-3 rounded-xl font-black transition-all ${asistencias[j.id] === 'TARDE' ? 'bg-amber-500 text-white shadow-lg scale-105' : 'text-slate-600 hover:text-slate-400'}`}
                                            >
                                                TARDE
                                            </button>
                                            <button 
                                                onClick={() => setAsistencias({...asistencias, [j.id]: 'AUSENTE'})} 
                                                className={`flex-grow md:flex-grow-0 px-8 py-3 rounded-xl font-black transition-all ${asistencias[j.id] === 'AUSENTE' ? 'bg-red-600 text-white shadow-lg scale-105' : 'text-slate-600 hover:text-slate-400'}`}
                                            >
                                                AUSENTE
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. TAB: GESTIÓN DE FINANZAS (ARBITROS & TERCER TIEMPO) */}
                {activeTab === 'FINANZAS' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="border-b border-white/5 pb-6">
                             <h3 className="text-2xl font-black text-white leading-none mb-2">Liquidación de Gastos</h3>
                             <p className="text-slate-400 text-sm max-w-2xl font-medium italic">Automatizá el cobro de arbitraje y comida. Los débitos se generan al instante en la Cta. Cta. del socio.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* BLOCK: ARBITRAJE */}
                            <div className="bg-slate-950/50 border border-slate-800 p-8 rounded-[32px] flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-xl">
                                <div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-4 bg-amber-600/10 text-amber-500 rounded-2xl"><Banknote size={32} /></div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1 text-amber-400">Prorrateo de Árbitros</h3>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-none">Costo compartido</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6 mb-10">
                                        <div className="p-5 bg-blue-900/10 border border-blue-500/20 rounded-2xl">
                                            <div className="flex items-start gap-3">
                                                <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-blue-300 font-bold leading-relaxed">
                                                        El sistema dividirá el total ingresado entre todos los jugadores marcados hoy como **Presentes** o **Tardes**.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block ml-1">Importe Total del Árbitro ($)</label>
                                            <div className="relative group">
                                                <span className="absolute left-6 top-5 text-slate-500 font-black text-xl group-focus-within:text-amber-500 transition-colors">$</span>
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    value={costoArbitro}
                                                    onChange={(e) => setCostoArbitro(e.target.value)}
                                                    className="w-full pl-12 pr-6 py-5 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-amber-500 text-2xl font-black transition-all placeholder:text-slate-800"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleCobrarArbitraje} className="w-full bg-amber-600 hover:bg-amber-500 text-white py-5 rounded-2xl font-black transition-all shadow-lg shadow-amber-900/20 active:scale-95 text-lg">
                                    Generar Prorrateo & Cobro
                                </button>
                            </div>

                            {/* BLOCK: TERCER TIEMPO */}
                            <div className="bg-slate-950/50 border border-slate-800 p-8 rounded-[32px] flex flex-col justify-between hover:border-emerald-500/30 transition-all shadow-xl">
                                <div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-4 bg-emerald-600/10 text-emerald-500 rounded-2xl"><Users size={32} /></div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1 text-emerald-400">Consumos (3T)</h3>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-none">Hamburguesas y Buffet</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6 mb-10">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block ml-1 text-emerald-900">Concepto del Consumo</label>
                                            <input
                                                type="text"
                                                value={concepto3T}
                                                onChange={(e) => setConcepto3T(e.target.value)}
                                                className="w-full px-6 py-5 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500 font-bold text-lg transition-all"
                                                placeholder="Ej: Sándwich + Agua"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block ml-1 text-emerald-900">Monto Individual x Persona ($)</label>
                                            <div className="relative group">
                                                <span className="absolute left-6 top-5 text-slate-500 font-black text-xl group-focus-within:text-emerald-500 transition-colors">$</span>
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    value={monto3T}
                                                    onChange={(e) => setMonto3T(e.target.value)}
                                                    className="w-full pl-12 pr-6 py-5 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500 text-2xl font-black transition-all placeholder:text-slate-800"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleCobrar3T} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black transition-all shadow-lg shadow-emerald-900/20 active:scale-95 text-lg">
                                    Debitar Gasto Individual
                                </button>
                            </div>
                        </div>

                        {/* FINAL STEP REMINDER */}
                        <div className="text-center py-6 text-slate-600 text-xs font-bold uppercase tracking-widest border-t border-white/5">
                            Los movimientos generados aquí son auditables y aparecen como débitos en el detalle del socio.
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default EventoDetailPage;
