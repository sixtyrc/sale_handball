import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { Users, UserPlus, Trash2, Loader2, Info, Check } from 'lucide-react';
import api from '../../services/api';
import { useUIStore } from '../../store/uiStore';

const AsignarProfeModal = ({ isOpen, onClose, categoriaId, categoriaNombre }) => {
    const { addToast } = useUIStore();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [disponibles, setDisponibles] = useState([]);
    const [asignados, setAsignados] = useState([]);

    useEffect(() => {
        if (isOpen && categoriaId) {
            fetchStaff();
        }
    }, [isOpen, categoriaId]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const [dispRes, asigRes] = await Promise.all([
                api.get('deportes/categorias/disponibles_profes/'),
                api.get(`deportes/categorias/${categoriaId}/profesores/`)
            ]);
            setDisponibles(dispRes.data);
            setAsignados(asigRes.data.map(a => a.id));
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'No se pudo cargar el cuerpo técnico.' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAsignacion = async (profeId) => {
        setActionLoading(profeId);
        try {
            const res = await api.post(`deportes/categorias/${categoriaId}/asignar_profe/`, { profe_id: profeId });
            if (res.data.status === 'asignado') {
                setAsignados([...asignados, profeId]);
                addToast({ type: 'success', title: 'Profesor Asignado', message: 'Se vinculó correctamente.' });
            } else {
                setAsignados(asignados.filter(id => id !== profeId));
                addToast({ type: 'info', title: 'Asignación Removida', message: 'Se desvinculó de la categoría.' });
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'No se pudo procesar la asignación.' });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Cuerpo Técnico: ${categoriaNombre}`}>
            <div className="space-y-6">
                <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex gap-4 items-start">
                    <Info className="text-blue-500 shrink-0" size={20} />
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Aquí puedes asignar qué profesores tienen acceso a esta categoría. Los profesores asignados podrán registrar asistencia, convocatorias y ver estadísticas de estos jugadores.
                    </p>
                </div>

                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-blue-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando Profesores...</span>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {disponibles.length > 0 ? disponibles.map((profe) => {
                            const isAsignado = asignados.includes(profe.id);
                            return (
                                <div key={profe.id} className="group flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-950 border border-slate-800 rounded-2xl transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isAsignado ? 'bg-blue-600/20 border-blue-500/30 text-blue-500' : 'bg-slate-800/50 border-slate-700/50 text-slate-600'}`}>
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white tracking-tight">{profe.nombre}</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isAsignado ? 'Asignado' : 'Sin asignar'}</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleToggleAsignacion(profe.id)}
                                        disabled={actionLoading === profe.id}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            isAsignado 
                                            ? 'bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-500 hover:text-white' 
                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                                        } disabled:opacity-50 disabled:cursor-wait`}
                                    >
                                        {actionLoading === profe.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : 
                                         isAsignado ? <Trash2 size={14} /> : <UserPlus size={14} />}
                                    </button>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-12 px-6 border border-dashed border-slate-800 rounded-3xl">
                                <Users size={32} className="mx-auto text-slate-700 mb-3" />
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No hay usuarios con el rol "Profesor"</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold transition-all text-sm"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AsignarProfeModal;
