import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import { Save, Loader2, Info, User, DollarSign } from 'lucide-react';
import api from '../../services/api';
import { useUIStore } from '../../store/uiStore';

const CobroModal = ({ isOpen, onClose, onSuccess, socios, initialSocioId }) => {
    const { addToast } = useUIStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        socio_id: '',
        monto: '',
        metodo_pago: 'EFECTIVO',
        descripcion: 'Pago en EFECTIVO de cuota social/deuda'
    });

    React.useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({ ...prev, socio_id: initialSocioId || '' }));
        }
    }, [isOpen, initialSocioId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            // Auto actualizar descripción si se cambia el método
            if (name === 'metodo_pago') {
                const label = value === 'EFECTIVO' ? 'EFECTIVO' : 'TRANSFERENCIA';
                newData.descripcion = `Pago en ${label} de cuota social/deuda`;
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.socio_id || !formData.monto) {
            setError('Debe seleccionar un socio y un monto válido.');
            setLoading(false);
            return;
        }

        try {
            const fechaActual = new Date().toISOString().split('T')[0];
            await api.post('finanzas/movimientos/', {
                socio_id: formData.socio_id,
                tipo: 'PAGO',
                monto: parseFloat(formData.monto),
                metodo_pago: formData.metodo_pago,
                descripcion: formData.descripcion,
                fecha: fechaActual
            });
            onSuccess();
            onClose();
            setFormData({ socio_id: '', monto: '', descripcion: 'Pago en efectivo de cuota social/deuda' });
        } catch (err) {
            setError(err.response?.data?.error || 'Error al procesar el cobro. Verifique la conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Cobro Manual">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start gap-2">
                        <Info size={16} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                    <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200/70 leading-relaxed font-medium">
                        <span className="text-amber-400 font-bold block mb-0.5 uppercase tracking-tight">Recordatorio Importante</span>
                        Recordá que antes de registrar el cobro, la cuota mensual debe estar generada en el sistema para que coincida con el saldo del socio.
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <User size={14} /> Socio
                    </label>
                    <select
                        required
                        name="socio_id"
                        value={formData.socio_id}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    >
                        <option value="" disabled>Seleccione un socio...</option>
                        {socios.map(socio => (
                            <option key={socio.id} value={socio.id}>
                                {socio.apellidos}, {socio.nombres} - DNI: {socio.dni}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <DollarSign size={14} /> Monto a Cobrar ($)
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
                        placeholder="0.00"
                    />
                </div>
                
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        Forma de Pago
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {['EFECTIVO', 'TRANSFERENCIA'].map(metodo => (
                            <button
                                key={metodo}
                                type="button"
                                onClick={() => handleChange({ target: { name: 'metodo_pago', value: metodo } })}
                                className={`py-3 rounded-xl font-bold border transition-all ${
                                    formData.metodo_pago === metodo 
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                }`}
                            >
                                {metodo}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        Descripción (Recibo)
                    </label>
                    <textarea
                        required
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        placeholder="Ej: Pago de cuota de marzo..."
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
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        Confirmar Cobro
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CobroModal;
