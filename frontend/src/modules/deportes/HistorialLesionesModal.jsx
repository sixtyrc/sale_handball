import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, AlertTriangle, ShieldCheck, UserX, Activity, CheckCircle, Save, Edit2 } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';

const HistorialLesionesModal = ({ isOpen, onClose, socio }) => {
    const [lesiones, setLesiones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        fecha_lesion: new Date().toISOString().split('T')[0],
        fecha_probable_alta: '',
        contexto: 'PARTIDO_OFICIAL',
        diagnostico: '',
        uso_seguro: false,
        observaciones_seguro: '',
        estado: 'ACTIVA'
    });

    useEffect(() => {
        if (isOpen && socio) {
            fetchLesiones();
            setShowForm(false);
            setEditingId(null);
        }
    }, [isOpen, socio]);

    const fetchLesiones = async () => {
        try {
            setLoading(true);
            const response = await api.get(`deportes/lesiones/?socio=${socio.id}`);
            setLesiones(response.data);
        } catch (error) {
            console.error('Error fetching lesiones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (lesion) => {
        setFormData({
            fecha_lesion: lesion.fecha_lesion,
            fecha_probable_alta: lesion.fecha_probable_alta || '',
            contexto: lesion.contexto,
            diagnostico: lesion.diagnostico,
            uso_seguro: lesion.uso_seguro,
            observaciones_seguro: lesion.observaciones_seguro || '',
            estado: lesion.estado
        });
        setEditingId(lesion.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`deportes/lesiones/${editingId}/`, {
                    ...formData,
                    socio: socio.id
                });
            } else {
                await api.post('deportes/lesiones/', {
                    ...formData,
                    socio: socio.id
                });
            }
            setShowForm(false);
            setEditingId(null);
            fetchLesiones();
            // Reset form
            setFormData({
                fecha_lesion: new Date().toISOString().split('T')[0],
                fecha_probable_alta: '',
                contexto: 'PARTIDO_OFICIAL',
                diagnostico: '',
                uso_seguro: false,
                observaciones_seguro: '',
                estado: 'ACTIVA'
            });
        } catch (error) {
            console.error('Error saving lesion:', error);
            alert('Error al guardar la lesión');
        }
    };

    const handleUpdateEstado = async (lesionId, nuevoEstado) => {
        try {
            await api.patch(`deportes/lesiones/${lesionId}/`, {
                estado: nuevoEstado,
                fecha_alta_real: nuevoEstado === 'RECUPERADA' ? new Date().toISOString().split('T')[0] : null
            });
            fetchLesiones();
        } catch (error) {
            console.error('Error actualizando lesión:', error);
        }
    };

    if (!isOpen || !socio) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Historial de Lesiones">
            <div className="w-full max-w-2xl bg-slate-900 mx-auto">
                <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">{socio.apellidos}, {socio.nombres}</h3>
                            <p className="text-xs font-medium text-slate-400">Seguimiento Médico y Rehabilitación</p>
                        </div>
                    </div>
                    {!showForm && (
                        <button 
                            onClick={() => { setEditingId(null); setShowForm(true); }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> Reportar Lesión
                        </button>
                    )}
                </div>

                {showForm ? (
                    <form onSubmit={handleSubmit} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 mb-6 animate-in fade-in slide-in-from-top-4">
                        <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            {editingId ? <Edit2 size={16} /> : <AlertTriangle size={16} />} 
                            {editingId ? 'Editar Reporte' : 'Nuevo Reporte'}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Fecha de Lesión *</label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-rose-500 outline-none"
                                    value={formData.fecha_lesion}
                                    onChange={e => setFormData({...formData, fecha_lesion: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Fecha Probable de Alta</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={formData.fecha_probable_alta}
                                    onChange={e => setFormData({...formData, fecha_probable_alta: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Contexto Deportivo *</label>
                                <select 
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-rose-500 outline-none"
                                    value={formData.contexto}
                                    onChange={e => setFormData({...formData, contexto: e.target.value})}
                                >
                                    <option value="PARTIDO_OFICIAL">Partido Oficial</option>
                                    <option value="PARTIDO_AMISTOSO">Partido Amistoso</option>
                                    <option value="ENTRENAMIENTO">Entrenamiento</option>
                                    <option value="PARTICULAR">Particular (Otro ámbito)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Estado *</label>
                                <select 
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-rose-500 outline-none"
                                    value={formData.estado}
                                    onChange={e => setFormData({...formData, estado: e.target.value})}
                                >
                                    <option value="ACTIVA">Lesionado (Activa)</option>
                                    <option value="RECUPERADA">Recuperado (Alta)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-400 mb-1">Diagnóstico / Detalles *</label>
                            <textarea 
                                required
                                rows={3}
                                placeholder="Ej: Esguince de tobillo grado 2. Requiere kinesiología."
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                                value={formData.diagnostico}
                                onChange={e => setFormData({...formData, diagnostico: e.target.value})}
                            ></textarea>
                        </div>

                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck size={20} className={formData.uso_seguro ? "text-emerald-500" : "text-slate-500"} />
                                    <div>
                                        <p className="text-sm font-bold text-white">Seguro Deportivo</p>
                                        <p className="text-xs text-slate-400">¿Se activó cobertura oficial?</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={formData.uso_seguro}
                                        onChange={e => setFormData({...formData, uso_seguro: e.target.checked})}
                                    />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                            
                            {formData.uso_seguro && (
                                <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in">
                                    <input 
                                        type="text" 
                                        placeholder="Num. Siniestro, Póliza o detalle del seguro..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                                        value={formData.observaciones_seguro}
                                        onChange={e => setFormData({...formData, observaciones_seguro: e.target.value})}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors uppercase"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-rose-600/20 text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                            >
                                <Save size={16} /> Guardar
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10 text-slate-500 text-sm">Cargando historial...</div>
                        ) : lesiones.length === 0 ? (
                            <div className="text-center py-12 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
                                <ShieldCheck size={48} className="mx-auto text-slate-700 mb-3" />
                                <p className="text-slate-400 font-medium tracking-tight">Jugador sin historial de lesiones</p>
                            </div>
                        ) : (
                            lesiones.map(lesion => (
                                <div key={lesion.id} className={`p-5 rounded-2xl border transition-all ${
                                    lesion.estado === 'ACTIVA' 
                                        ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-500/50' 
                                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {lesion.estado === 'ACTIVA' ? (
                                                    <span className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-rose-500/20 text-rose-400 px-2.5 py-1 rounded-full border border-rose-500/20">
                                                        <AlertTriangle size={12} /> Activa
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full">
                                                        <CheckCircle size={12} /> Alta Médica
                                                    </span>
                                                )}
                                                
                                                <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase px-2 py-1 bg-slate-950 rounded-lg border border-slate-800">
                                                    {lesion.contexto.replace('_', ' ')}
                                                </span>

                                                {lesion.uso_seguro && (
                                                    <span className="text-[10px] flex items-center gap-1 text-blue-400 font-black tracking-widest uppercase px-2 py-1 bg-blue-900/20 rounded-lg border border-blue-800/30">
                                                        <ShieldCheck size={12} /> Seguro
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-white font-medium mt-2">{lesion.diagnostico}</h4>
                                        </div>
                                        
                                        {/* Status Toggle Button */}
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleEditClick(lesion)}
                                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700"
                                                title="Editar Lesión"
                                            >
                                                <Edit2 size={16} />
                                            </button>

                                            {lesion.estado === 'ACTIVA' ? (
                                                <button 
                                                    onClick={() => handleUpdateEstado(lesion.id, 'RECUPERADA')}
                                                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                                                >
                                                    Dar de Alta
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleUpdateEstado(lesion.id, 'ACTIVA')}
                                                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                                >
                                                    Reabrir
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-800/50 text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Calendar size={14} className="text-slate-500" /> 
                                            Fecha: <span className="text-slate-300 font-medium">{new Date(lesion.fecha_lesion).toLocaleDateString()}</span>
                                        </div>
                                        {lesion.fecha_probable_alta && lesion.estado === 'ACTIVA' && (
                                            <div className="flex items-center gap-1.5 text-rose-300">
                                                <Activity size={14} /> 
                                                Alta aprox: <span className="font-bold">{new Date(lesion.fecha_probable_alta).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {lesion.fecha_alta_real && lesion.estado === 'RECUPERADA' && (
                                            <div className="flex items-center gap-1.5 text-emerald-400">
                                                <CheckCircle size={14} /> 
                                                Alta real: <span className="font-bold">{new Date(lesion.fecha_alta_real).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default HistorialLesionesModal;
