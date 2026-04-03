import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { Save, Loader2, Info } from 'lucide-react';
import api from '../../services/api';

const EventoFormModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [categorias, setCategorias] = useState([]);
    
    const [formData, setFormData] = useState({
        titulo: '',
        tipo: 'PARTIDO_OFICIAL',
        categoria: '',
        fecha_hora_inicio: '',
        fecha_hora_fin: '',
        lugar: '',
        rival: '',
        competencia: '',
        condicion_partido: 'LOCAL',
        descripcion: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchCategorias();
            
            // Set default dates based on now
            const now = new Date();
            const startStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0,16);
            const endStr = new Date(now.getTime() + (2*60*60*1000) - (now.getTimezoneOffset() * 60000)).toISOString().slice(0,16);
            
            setFormData(prev => ({
                ...prev,
                fecha_hora_inicio: startStr,
                fecha_hora_fin: endStr
            }));
        }
    }, [isOpen]);

    const fetchCategorias = async () => {
        try {
            const response = await api.get('deportes/categorias/');
            setCategorias(response.data);
            if (response.data.length > 0) {
                setFormData(prev => ({ ...prev, categoria: response.data[0].id }));
            }
        } catch (error) {
            console.error("Error fetching categorias:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const dataToSubmit = { ...formData };
            if (!dataToSubmit.categoria) {
                dataToSubmit.categoria = null;
            }
            await api.post('actividad/eventos/', dataToSubmit);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar el evento.');
            console.error(err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Evento Deportivo">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start gap-2">
                        <Info size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título del Evento</label>
                        <input
                            required
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            placeholder="Ej: Final de Liga contra Jockey"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</label>
                        <select
                            name="tipo"
                            value={formData.tipo}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="PARTIDO_OFICIAL">Partido Oficial</option>
                            <option value="AMISTOSO">Partido Amistoso</option>
                            <option value="ENTRENAMIENTO">Entrenamiento</option>
                            <option value="TORNEO_CLUB">Torneo Interno</option>
                            <option value="TERCER_TIEMPO">Tercer Tiempo</option>
                            <option value="OTRO">Otro Evento</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría Titular</label>
                        <select
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">(Sin categoría específica)</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombre} ({cat.genero})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inicio</label>
                        <input
                            required
                            type="datetime-local"
                            name="fecha_hora_inicio"
                            value={formData.fecha_hora_inicio}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fin Estimado</label>
                        <input
                            required
                            type="datetime-local"
                            name="fecha_hora_fin"
                            value={formData.fecha_hora_fin}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                        />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lugar / Cancha</label>
                        <input
                            name="lugar"
                            value={formData.lugar}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            placeholder="Sede Central, Club Visitante, Cancha 2..."
                        />
                    </div>

                    {(formData.tipo === 'PARTIDO_OFICIAL' || formData.tipo === 'AMISTOSO') && (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rival</label>
                                <input
                                    name="rival"
                                    value={formData.rival}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 border-emerald-900/50"
                                    placeholder="Nombre del rival"
                                />
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Condición</label>
                                <select
                                    name="condicion_partido"
                                    value={formData.condicion_partido}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 border-emerald-900/50"
                                >
                                    <option value="LOCAL">En Casa (Local)</option>
                                    <option value="VISITANTE">Visitante</option>
                                    <option value="NEUTRAL">Cancha Neutral</option>
                                </select>
                            </div>
                            
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Torneo / Competencia</label>
                                <input
                                    name="competencia"
                                    value={formData.competencia}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 border-emerald-900/50"
                                    placeholder="Ej: Apertura AMeBal"
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Observaciones</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            placeholder="Detalles sobre el viaje, convocatoria, etc..."
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        Guardar Evento
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EventoFormModal;
