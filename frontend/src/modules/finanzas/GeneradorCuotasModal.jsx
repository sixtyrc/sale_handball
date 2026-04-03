import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import { Save, Loader2, Info, Users, CreditCard, AlertTriangle, CheckCircle2, SkipForward } from 'lucide-react';
import api from '../../services/api';
import { useUIStore } from '../../store/uiStore';

const GeneradorCuotasModal = ({ isOpen, onClose, onSuccess, socios }) => {
    const { addToast } = useUIStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resultado, setResultado] = useState(null); // ← resultado de la operación
    const [formData, setFormData] = useState({
        socio_id: 'ALL',
        monto: '',
        descripcion: 'Cuota Mensual',
        fecha: new Date().toISOString().split('T')[0] // fecha seleccionable
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResultado(null);

        if (!formData.monto) {
            setError('Debe definir un monto válido para la cuota.');
            setLoading(false);
            return;
        }

        try {
            let res;
            if (formData.socio_id === 'ALL') {
                addToast({ type: 'info', title: 'Procesando', message: 'Iniciando generación masiva de cuotas...' });
                res = await api.post(`finanzas/cuotas/generar/`, {
                    monto: parseFloat(formData.monto),
                    descripcion: formData.descripcion,
                    fecha: formData.fecha
                });
                setResultado(res.data);
                addToast({ 
                    type: 'success', 
                    title: 'Proceso Finalizado', 
                    message: `Se procesaron ${res.data.socios_procesados} cuotas correctamente.` 
                });
            } else {
                await api.post(`finanzas/movimientos/`, {
                    socio_id: formData.socio_id,
                    tipo: 'CUOTA',
                    monto: -parseFloat(formData.monto),
                    descripcion: formData.descripcion,
                    fecha: formData.fecha
                });
                setResultado({ message: 'Cuota generada correctamente para el socio seleccionado.', socios_procesados: 1, socios_saltados_count: 0 });
                addToast({ type: 'success', title: 'Cuota Generada', message: 'La cuota individual fue registrada con éxito.' });
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al generar la/s cuota/s.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setResultado(null);
        setError(null);
        setFormData({ socio_id: 'ALL', monto: '', descripcion: 'Cuota Mensual', fecha: new Date().toISOString().split('T')[0] });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Generar Cuotas">
            {resultado ? (
                // ── PANTALLA DE RESULTADO ──────────────────────────────
                <div className="space-y-5 py-2">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <CheckCircle2 size={48} className="text-emerald-500" />
                        <h3 className="text-lg font-black text-white">Proceso Completado</h3>
                        <p className="text-slate-400 text-sm">{resultado.message}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                            <p className="text-3xl font-black text-emerald-400">{resultado.socios_procesados}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Socios procesados</p>
                        </div>
                        <div className={`rounded-2xl p-4 text-center border ${resultado.socios_saltados_count > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800/50 border-slate-700/30'}`}>
                            <p className={`text-3xl font-black ${resultado.socios_saltados_count > 0 ? 'text-amber-400' : 'text-slate-600'}`}>{resultado.socios_saltados_count || 0}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Omitidos (ya tenían cuota)</p>
                        </div>
                    </div>

                    {resultado.socios_saltados_count > 0 && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <SkipForward size={14} className="text-amber-400" />
                                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Socios omitidos • ya tenían cuota para {resultado.periodo}</span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono">
                                {resultado.socios_saltados_detalle?.join(', ') || '—'}
                            </p>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-800 flex justify-end">
                        <button onClick={handleClose} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all">
                            Cerrar
                        </button>
                    </div>
                </div>
            ) : (
                // ── FORMULARIO ─────────────────────────────────────────
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start gap-2">
                            <Info size={16} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                        <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                            <div className="text-sm text-slate-300 space-y-1">
                                <p>Esta acción debitará el monto en las cuentas de los socios seleccionados.</p>
                                <p className="text-slate-500 text-xs">El sistema <strong className="text-amber-400">omitirá automáticamente</strong> socios que ya tengan cuota generada para el mes/año de la fecha seleccionada. No habrá duplicados.</p>
                            </div>
                        </div>
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
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Fecha del Movimiento
                        </label>
                        <input
                            required
                            type="date"
                            name="fecha"
                            value={formData.fecha}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-xs text-slate-600">El mes y año de esta fecha se usa para el control de duplicados.</p>
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
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
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
                            onClick={handleClose}
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
            )}
        </Modal>
    );
};

export default GeneradorCuotasModal;
