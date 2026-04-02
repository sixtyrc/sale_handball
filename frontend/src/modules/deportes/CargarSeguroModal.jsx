import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import { Shield, Loader2, CheckCircle2, Save, AlertCircle, DollarSign } from 'lucide-react';
import api from '../../services/api';

const CargarSeguroModal = ({ isOpen, onClose, socioId, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [movimientoId, setMovimientoId] = useState(null);
    const [montoSeguro, setMontoSeguro] = useState('');

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!montoSeguro || parseFloat(montoSeguro) <= 0) {
            setError('Por favor ingrese un monto válido mayor a 0');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const fechaActual = new Date().toISOString().split('T')[0];
            const monto = parseFloat(montoSeguro);

            // 1. Primero registramos el CARGO (Deuda) del seguro para que la cuenta cuadre contablemente.
            await api.post('finanzas/movimientos/', {
                socio_id: socioId,
                tipo: 'SEGURO',
                monto: -monto, // Deuda = Negativo
                descripcion: 'Cargo Anual Seguro Deportivo',
                fecha: fechaActual
            });

            // 2. Ahora registramos el PAGO efectivo de esa deuda (Saldo a favor que neutraliza la deuda).
            const resPago = await api.post('finanzas/movimientos/', {
                socio_id: socioId,
                tipo: 'PAGO', 
                monto: monto, // Pago = Positivo
                descripcion: 'Pago Seguro Federativo',
                fecha: fechaActual
            });

            console.log('✅ Seguro pagado y registrado:', resPago.data);
            setSuccess(true);
            setMovimientoId(resPago.data.id);
        } catch (err) {
            console.error('❌ Error API:', err.response?.data || err.message);
            setError('Error al registrar el pago del seguro.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const response = await api.get(`finanzas/movimientos/${movimientoId}/pdf/`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Seguro_Deportivo_${socioId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Error al descargar el PDF:', err);
            alert('No se pudo generar el comprobante PDF. Por favor, intente nuevamente.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Seguro Deportivo">
            <div className="p-4 space-y-4">
                {success ? (
                    <div className="py-10 text-center animate-in zoom-in duration-300 flex flex-col items-center">
                        <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={48} />
                        <h3 className="text-xl font-bold text-white tracking-widest uppercase mb-4">¡Pago Registrado!</h3>
                        
                        {movimientoId && (
                            <button 
                                onClick={handleDownload}
                                disabled={downloading}
                                className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {downloading ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                                Descargar Comprobante PDF
                            </button>
                        )}

                        <button 
                            onClick={() => {
                                onSuccess();
                                onClose();
                                setSuccess(false);
                                setMovimientoId(null);
                                setMontoSeguro('');
                            }}
                            className="mt-6 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest"
                        >
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                            <Shield className="text-blue-400 shrink-0 mt-1" size={20} />
                            <div>
                                <h4 className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-1">Pago de Seguro</h4>
                                <p className="text-xs text-blue-300">
                                    Esta acción registrará el cobro y pago simultáneo del seguro deportivo anual, neutralizando el balance.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2">
                                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-wide leading-tight">{error}</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                                Monto Abonado ($)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={montoSeguro}
                                    onChange={(e) => setMontoSeguro(e.target.value)}
                                    placeholder="Ej: 8500.00"
                                    className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl font-mono focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                onClick={handleSubmit}
                                disabled={loading || !montoSeguro}
                                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-900/30 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        GENERAR PAGO Y COMPROBANTE
                                    </>
                                )}
                            </button>
                            <button onClick={onClose} className="w-full text-[10px] font-black text-slate-700 hover:text-slate-500 py-3 mt-2 uppercase tracking-tighter">
                                Cancelar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default CargarSeguroModal;
