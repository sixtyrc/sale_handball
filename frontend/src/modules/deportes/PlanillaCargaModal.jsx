import React, { useState, useEffect } from 'react';
import { 
    X, Trophy, User, Shield, 
    Plus, Minus, Hash, AlertTriangle, 
    CheckCircle2, Loader2, Save, Info
} from 'lucide-react';
import api from '../../services/api';
import { useUIStore } from '../../store/uiStore';

const PlanillaCargaModal = ({ isOpen, onClose, eventoId, onSuccess }) => {
    const { addToast } = useUIStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Planilla data
    const [planilla, setPlanilla] = useState(null);
    const [formData, setFormData] = useState({
        goles_local: 0,
        goles_visitante: 0,
        sede_final: '',
        observaciones: '',
        amarilla_banco: false,
        suspension_banco: false,
        roja_banco: false,
        azul_banco: false
    });
    const [statsJugadores, setStatsJugadores] = useState([]);

    useEffect(() => {
        if (isOpen && eventoId) {
            fetchPlanilla();
        }
    }, [isOpen, eventoId]);

    const fetchPlanilla = async () => {
        try {
            setLoading(true);
            const response = await api.get(`actividad/eventos/${eventoId}/planilla/`);
            setPlanilla(response.data);
            setFormData({
                goles_local: response.data.goles_local || 0,
                goles_visitante: response.data.goles_visitante || 0,
                sede_final: response.data.sede_final || '',
                observaciones: response.data.observaciones_arbitro || '',
                amarilla_banco: response.data.amarilla_banco || false,
                suspension_banco: response.data.suspension_banco || false,
                roja_banco: response.data.roja_banco || false,
                azul_banco: response.data.azul_banco || false
            });
            setStatsJugadores(response.data.jugadores_stats || []);
        } catch (error) {
            console.error('Error fetching planilla:', error);
            addToast({ type: 'error', title: 'Error', message: 'No se pudo cargar la planilla técnica.' });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleStatChange = (socioId, field, value) => {
        setStatsJugadores(prev => prev.map(s => {
            if (s.socio === socioId) {
                // Lógica de topes para 2min
                if (field === 'suspensiones_2min') {
                    const newValue = Math.max(0, Math.min(3, value));
                    return { ...s, [field]: newValue };
                }
                return { ...s, [field]: value };
            }
            return s;
        }));
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            const payload = {
                ...formData,
                stats_jugadores: statsJugadores
            };
            
            await api.post(`actividad/eventos/${eventoId}/asociar-planilla/`, payload);
            
            addToast({ 
                type: 'success', 
                title: 'Planilla Cerrada', 
                message: 'Las estadísticas han sido vinculadas correctamente.' 
            });
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving planilla:', error);
            addToast({ type: 'error', title: 'Error al Guardar', message: 'Verifique los datos e intente nuevamente.' });
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
            
            <div className="relative bg-slate-900 border border-slate-800 w-full max-w-5xl max-h-[90dvh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Trophy className="text-white" size={30} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Planilla Técnica de Partido</h3>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Carga de Resultados y Estadísticas</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-blue-500" size={40} />
                            <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Sincronizando Mesa de Control...</p>
                        </div>
                    ) : (
                        <>
                            {/* RESULTADO Y SEDE */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-slate-950/50 border border-slate-800 p-8 rounded-[32px] flex items-center justify-around">
                                    <div className="text-center space-y-4">
                                        <p className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">LOCAL</p>
                                        <div className="flex items-center gap-6">
                                            <button 
                                                onClick={() => setFormData(p => ({ ...p, goles_local: Math.max(0, p.goles_local - 1) }))}
                                                className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-xl text-white flex items-center justify-center transition-all active:scale-90"
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <span className="text-7xl font-black text-white lining-nums transition-all w-24">{formData.goles_local}</span>
                                            <button 
                                                onClick={() => setFormData(p => ({ ...p, goles_local: p.goles_local + 1 }))}
                                                className="w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-xl text-white flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-blue-600/20"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-4xl font-black text-slate-700">VS</div>

                                    <div className="text-center space-y-4">
                                        <p className="text-xs font-black text-pink-500 uppercase tracking-[0.2em]">RIVAL</p>
                                        <div className="flex items-center gap-6">
                                            <button 
                                                onClick={() => setFormData(p => ({ ...p, goles_visitante: Math.max(0, p.goles_visitante - 1) }))}
                                                className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-xl text-white flex items-center justify-center transition-all active:scale-90"
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <span className="text-7xl font-black text-white lining-nums transition-all w-24">{formData.goles_visitante}</span>
                                            <button 
                                                onClick={() => setFormData(p => ({ ...p, goles_visitante: p.goles_visitante + 1 }))}
                                                className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-xl text-white flex items-center justify-center transition-all active:scale-90"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Sede / Gimnasio</label>
                                        <input 
                                            type="text"
                                            value={formData.sede_final}
                                            onChange={(e) => setFormData(p => ({ ...p, sede_final: e.target.value }))}
                                            placeholder="Sede de juego..."
                                            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold focus:outline-none focus:border-blue-600 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[28px]">
                                        <div className="flex items-start gap-4">
                                            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                                            <p className="text-xs text-amber-200/70 font-medium leading-relaxed">
                                                Al cerrar la planilla, el resultado se bloqueará y se impactarán los promedios en la ficha de cada socio vinculado.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TABLA DE JUGADORES */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Shield size={16} /> 
                                    Personal Club y Estadísticas Individuales
                                </h4>
                                
                                <div className="bg-slate-950/50 border border-slate-800 rounded-[32px] overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-800/30">
                                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">#</th>
                                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">Jugador</th>
                                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 text-center">Goles</th>
                                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 text-center">Sanciones</th>
                                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 text-center w-10">Mesa</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {statsJugadores.map(s => (
                                                <tr key={s.id} className="hover:bg-slate-800/20 transition-colors group">
                                                    <td className="p-5">
                                                        <input 
                                                            type="text" 
                                                            maxLength="3"
                                                            value={s.dorsal || ''}
                                                            onChange={(e) => handleStatChange(s.socio, 'dorsal', e.target.value)}
                                                            className="w-12 bg-slate-900 border border-slate-700/50 rounded-lg p-2 text-center text-white font-black text-sm focus:border-blue-600 outline-none"
                                                            placeholder="00"
                                                        />
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-500 flex items-center justify-center">
                                                                <User size={14} />
                                                            </div>
                                                            <span className="text-white font-bold">{s.jugador_nombre}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex items-center justify-center gap-4">
                                                            <button 
                                                                onClick={() => handleStatChange(s.socio, 'goles', Math.max(0, s.goles - 1))}
                                                                className="p-1 hover:text-white text-slate-600"
                                                            >
                                                                <Minus size={16} />
                                                            </button>
                                                            <span className={`text-xl font-black w-8 text-center ${s.goles > 0 ? 'text-blue-400' : 'text-slate-600'}`}>{s.goles}</span>
                                                            <button 
                                                                onClick={() => handleStatChange(s.socio, 'goles', s.goles + 1)}
                                                                className="p-1 hover:text-white text-slate-600"
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex items-center justify-center gap-3">
                                                            {/* Amarilla */}
                                                            <button 
                                                                onClick={() => handleStatChange(s.socio, 'amarilla', !s.amarilla)}
                                                                className={`w-8 h-10 rounded-md border-2 transition-all ${s.amarilla ? 'bg-amber-400 border-amber-300' : 'border-slate-800 bg-slate-900 opacity-20'}`}
                                                                title="Amarilla"
                                                            ></button>
                                                            
                                                            {/* 2 Min */}
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="flex gap-1">
                                                                    {[1,2,3].map(n => (
                                                                        <div 
                                                                            key={n} 
                                                                            className={`w-2 h-4 rounded-full ${s.suspensiones_2min >= n ? 'bg-emerald-500' : 'bg-slate-800'}`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => handleStatChange(s.socio, 'suspensiones_2min', s.suspensiones_2min - 1)} className="text-[10px] text-slate-500 hover:text-white">Less</button>
                                                                    <button onClick={() => handleStatChange(s.socio, 'suspensiones_2min', s.suspensiones_2min + 1)} className="text-[10px] text-slate-500 hover:text-white">2'</button>
                                                                </div>
                                                            </div>

                                                            {/* Roja */}
                                                            <button 
                                                                onClick={() => handleStatChange(s.socio, 'roja', !s.roja)}
                                                                className={`w-8 h-10 rounded-md border-2 transition-all ${s.roja ? 'bg-red-600 border-red-500' : 'border-slate-800 bg-slate-900 opacity-20'}`}
                                                                title="Roja"
                                                            ></button>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        {s.roja || s.suspensiones_2min === 3 ? (
                                                            <AlertTriangle className="text-red-500 mx-auto" size={18} />
                                                        ) : (
                                                            <CheckCircle2 className="text-slate-800 mx-auto" size={18} />
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* BANCO Y OBSERVACIONES */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 bg-slate-950/50 border border-slate-800 rounded-[32px] space-y-6">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Info size={14} /> Sanciones de Banco (CT)
                                    </h5>
                                    <div className="flex flex-wrap gap-6">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input 
                                                type="checkbox"
                                                checked={formData.amarilla_banco}
                                                onChange={(e) => setFormData(p => ({ ...p, amarilla_banco: e.target.checked }))}
                                                className="w-5 h-5 rounded-lg border-slate-700 bg-slate-900 checked:bg-amber-400 transition-all font-black text-slate-400"
                                            />
                                            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Amarilla Banco</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input 
                                                type="checkbox"
                                                checked={formData.suspension_banco}
                                                onChange={(e) => setFormData(p => ({ ...p, suspension_banco: e.target.checked }))}
                                                className="w-5 h-5 rounded-lg border-slate-700 bg-slate-900 checked:bg-emerald-500 transition-all"
                                            />
                                            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">2 Min Banco</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input 
                                                type="checkbox"
                                                checked={formData.roja_banco}
                                                onChange={(e) => setFormData(p => ({ ...p, roja_banco: e.target.checked }))}
                                                className="w-5 h-5 rounded-lg border-slate-700 bg-slate-900 checked:bg-red-600 transition-all"
                                            />
                                            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Roja Banco</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Bitácora del Árbitro / Observaciones</label>
                                    <textarea 
                                        rows="4"
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData(p => ({ ...p, observaciones: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white text-sm font-medium focus:outline-none focus:border-blue-600 transition-all shadow-inner resize-none"
                                        placeholder="Ej: Descalificación por conducta antideportiva..."
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-slate-800 flex justify-end gap-4 bg-slate-900/80 backdrop-blur-md">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 rounded-2xl text-slate-400 font-bold hover:bg-slate-800 transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={saving || loading}
                        className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Confirmar y Asociar Planilla
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanillaCargaModal;
