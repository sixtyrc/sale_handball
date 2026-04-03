import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import { Save, Loader2, Info } from 'lucide-react';
import api from '../../services/api';

const JornadaFormModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        titulo: '',
        fecha: '',
        observaciones: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post('locales/jornadas/', formData);
            onSuccess();
            onClose();
            setFormData({ titulo: '', fecha: '', observaciones: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar la jornada.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nueva Jornada Local">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start gap-2">
                        <Info size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título (Rival o Evento)</label>
                    <input
                        required
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        placeholder="Ej: vs Club Barrio Parque"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</label>
                    <input
                        required
                        type="date"
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción Breve / Observaciones</label>
                    <textarea
                        name="observaciones"
                        value={formData.observaciones}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        placeholder="Torneo apertura fecha 5..."
                    />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
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
                        Guardar Jornada
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default JornadaFormModal;
