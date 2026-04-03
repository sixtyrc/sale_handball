import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { Loader2, Trophy, Medal, Search, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const RankingFamiliasModal = ({ isOpen, onClose }) => {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchRanking();
        }
    }, [isOpen]);

    const fetchRanking = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('locales/jornadas/ranking/');
            setRanking(response.data);
        } catch (err) {
            console.error("Error fetching ranking:", err);
            setError("No se pudo cargar el ranking institucional.");
        } finally {
            setLoading(false);
        }
    };

    const getMedalColor = (index) => {
        if (index === 0) return 'text-amber-400';
        if (index === 1) return 'text-slate-300';
        if (index === 2) return 'text-amber-700';
        return 'text-blue-500';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ranking Institucional de Familias">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-blue-600/10 border border-blue-600/20 p-4 rounded-2xl flex items-start gap-4">
                    <Trophy className="text-blue-500 shrink-0 mt-1" size={24} />
                    <div>
                        <h4 className="text-white font-bold text-sm mb-1">¿Cómo sumar puntos?</h4>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            El ranking se calcula en base al compromiso de cada grupo familiar con el club: 
                            <span className="font-bold text-slate-300"> 10 puntos</span> por cada jornada asistida como voluntario y 
                            <span className="font-bold text-slate-300"> 1 punto</span> por cada $1000 en donaciones o compras identificadas en cantina.
                        </p>
                    </div>
                </div>

                {error ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle size={18} /> {error}
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Calculando Posiciones...</p>
                    </div>
                ) : ranking.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy size={24} className="text-slate-600" />
                        </div>
                        <p className="text-slate-400">Aún no hay puntos registrados en esta temporada.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ranking.map((familia, idx) => (
                            <div key={familia.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${idx < 3 ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-900/40 border-slate-800/50'}`}>
                                <div className="w-10 text-center">
                                    {idx < 3 ? (
                                        <Medal size={28} className={`mx-auto ${getMedalColor(idx)} drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                                    ) : (
                                        <span className="text-xl font-black text-slate-600">#{idx + 1}</span>
                                    )}
                                </div>
                                
                                <div className="flex-grow">
                                    <h4 className="text-lg font-bold text-white">{familia.nombre}</h4>
                                    <p className="text-xs text-slate-500">{familia.detalle}</p>
                                </div>
                                
                                <div className="text-right">
                                    <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl">
                                        <span className={`text-xl font-black ${idx === 0 ? 'text-amber-400' : 'text-white'}`}>
                                            {familia.puntos}
                                        </span>
                                        <span className="text-xs font-bold text-slate-500 ml-1">pts</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all w-full md:w-auto"
                >
                    Cerrar Ranking
                </button>
            </div>
        </Modal>
    );
};

export default RankingFamiliasModal;
