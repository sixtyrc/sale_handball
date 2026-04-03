import React from 'react';
import { X, Activity, Users, CheckCircle, AlertTriangle, TrendingUp, PieChart } from 'lucide-react';

const StatsGlobalesModal = ({ isOpen, onClose, categorias, athletes }) => {
    if (!isOpen) return null;

    // Calcular estadísticas globales
    const totalAthletes = athletes.length;
    const habilitados = athletes.filter(a => a.puede_jugar).length;
    const enRiesgo = totalAthletes - habilitados;
    
    // Distribución por Género
    const generoStats = categorias.reduce((acc, cat) => {
        const catAthletesCount = athletes.filter(a => a.categoria_actual === cat.id).length;
        if (cat.genero === 'MASCULINO') acc.M += catAthletesCount;
        else if (cat.genero === 'FEMENINO') acc.F += catAthletesCount;
        else acc.X += catAthletesCount;
        return acc;
    }, { M: 0, F: 0, X: 0 });

    const porcentajeHabilitados = totalAthletes > 0 ? Math.round((habilitados / totalAthletes) * 100) : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Estadísticas Globales</h2>
                            <p className="text-xs text-slate-400">Resumen integral del plantel deportivo del club</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                    
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 text-center">
                            <Users className="mx-auto mb-2 text-slate-400" size={24} />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Planteles</p>
                            <p className="text-3xl font-black text-white">{totalAthletes}</p>
                        </div>
                        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-center">
                            <CheckCircle className="mx-auto mb-2 text-emerald-500" size={24} />
                            <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mb-1">Habilitados</p>
                            <p className="text-3xl font-black text-emerald-500">{habilitados}</p>
                        </div>
                        <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-center">
                            <AlertTriangle className="mx-auto mb-2 text-red-500" size={24} />
                            <p className="text-[10px] font-bold text-red-600/70 uppercase tracking-widest mb-1">En Riesgo / Deuda</p>
                            <p className="text-3xl font-black text-red-500">{enRiesgo}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-800">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-blue-400" />
                                <span className="text-sm font-semibold text-slate-300">Índice de Elegibilidad</span>
                            </div>
                            <span className="text-xl font-black text-white">{porcentajeHabilitados}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                    porcentajeHabilitados >= 80 ? 'bg-emerald-500' : 
                                    porcentajeHabilitados >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${porcentajeHabilitados}%` }}
                            />
                        </div>
                    </div>

                    {/* Distribucion */}
                    <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-2 mb-4">
                            <PieChart size={16} className="text-indigo-400" />
                            <span className="text-sm font-semibold text-slate-300">Distribución por Rama</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 bg-slate-900 p-3 rounded-xl border border-slate-700/50 text-center">
                                <p className="text-xs text-blue-400 font-bold mb-1">Masculina</p>
                                <p className="text-xl font-black text-white">{generoStats.M}</p>
                            </div>
                            <div className="flex-1 bg-slate-900 p-3 rounded-xl border border-slate-700/50 text-center">
                                <p className="text-xs text-pink-400 font-bold mb-1">Femenina</p>
                                <p className="text-xl font-black text-white">{generoStats.F}</p>
                            </div>
                            <div className="flex-1 bg-slate-900 p-3 rounded-xl border border-slate-700/50 text-center">
                                <p className="text-xs text-purple-400 font-bold mb-1">Mixta</p>
                                <p className="text-xl font-black text-white">{generoStats.X}</p>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default StatsGlobalesModal;
