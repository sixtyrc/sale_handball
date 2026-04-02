import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import { Save, Loader2, Info, Users, CreditCard } from 'lucide-react';
import api from '../../services/api';

const GeneradorCuotasModal = ({ isOpen, onClose, onSuccess, socios }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        socio_id: 'ALL', // 'ALL' para generar masivo, o ID específico
        monto: '',
        descripcion: 'Cuota Mensual'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.monto) {
            setError('Debe definir un monto válido para la cuota.');
            setLoading(false);
            return;
        }

        try {
            const fechaActual = new Date().toISOString().split('T')[0];
            
            if (formData.socio_id === 'ALL') {
                // Endpoint real para generación masiva (GenerarCuotasMasivasView)
                await api.post(`finanzas/cuotas/generar/`, {
                    monto: parseFloat(formData.monto),
                    descripcion: formData.descripcion,
                    fecha: fechaActual
                });
            } else {
                // Endpoint real para generar a socio individual (RegistrarMovimientoView)
                // Se envía el monto en negativo desde el backend si es una cuota, pero por las dudas enviamos el valor bruto
                // según lo que entienda el backend. Finanzas registra CUOTA como cargo.
                await api.post(`finanzas/movimientos/`, {
                    socio_id: formData.socio_id,
                    tipo: 'CUOTA',
                    monto: -parseFloat(formData.monto), // Cargo es negativo
                    descripcion: formData.descripcion,
                    fecha: fechaActual
                });
            }
            
            onSuccess();
            onClose();
            setFormData({ socio_id: 'ALL', monto: '', descripcion: 'Cuota Mensual' });
        } catch (err) {
            setError(err.response?.data?.error || 'Error al generar la/s cuota/s.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generar Cuotas">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start gap-2">
                        <Info size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <p className="text-sm font-medium text-slate-300">
                        Esta acción debitará el monto especificado en las cuentas corrientes, aumentando la deuda de manera automática.
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Users size={14} /> Aplicar a...
                    </label>
                    <select
                        required
                        name="socio_id"
                        value={formData.socio_id}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    >
                        <option value="ALL">Aplicar Masivamente a TODOS los socios activos</option>
                        <optgroup label="Socio Específico">
                            {socios.map(socio => (
                                <option key={socio.id} value={socio.id}>
                                    {socio.apellidos}, {socio.nombres} - DNI: {socio.dni}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <CreditCard size={14} /> Monto a Debitar ($)
                    </label>
                    <input
                        required
                        type="number"
                        min="1"
                        step="0.01"
                        name="monto"
                        value={formData.monto}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-lg focus:outline-none focus:border-blue-500"
                        placeholder="Ej: 5000.00"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        Concepto de la Cuota
                    </label>
                    <input
                        required
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        placeholder="Ej: Cuota Abril 2026"
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
                        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        Confirmar y Debitar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default GeneradorCuotasModal;
