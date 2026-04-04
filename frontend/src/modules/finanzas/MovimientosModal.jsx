import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { CreditCard, TrendingDown, TrendingUp, Calendar, FileDown, Loader2 } from 'lucide-react';
import api from '../../services/api';

const MovimientosModal = ({ isOpen, onClose, cuenta, selectedYear = 'ALL' }) => {
    const [movimientosList, setMovimientosList] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [saldoPeriodo, setSaldoPeriodo] = useState(0);

    useEffect(() => {
        if (isOpen && cuenta) {
            fetchMovimientos();
        } else {
            setMovimientosList([]);
        }
    }, [isOpen, cuenta, selectedYear]);

    const fetchMovimientos = async () => {
        setCargando(true);
        try {
            // Buscamos el detalle completo de la cuenta, pasando el año para filtrar movimientos
            const res = await api.get(`finanzas/socios/${cuenta.socio.id}/cuenta/`, {
                params: { anio: selectedYear }
            });
            setMovimientosList(res.data.movimientos || []);
            setSaldoPeriodo(res.data.saldo_periodo || 0);
        } catch (error) {
            console.error('Error fetching movimientos al abrir modal:', error);
        } finally {
            setCargando(false);
        }
    };

    if (!cuenta) return null;

    const { socio, saldo } = cuenta;

    const downloadPDF = async (movimientoId) => {
        try {
            const response = await api.get(`finanzas/movimientos/${movimientoId}/pdf/`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            const socioName = `${socio.apellidos}_${socio.nombres}`.replace(/\s+/g, '_').toUpperCase();
            const dateStr = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `RECIBO_${socioName}_${dateStr}_${movimientoId.substring(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            alert('Error al descargar el recibo.');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Historial de Movimientos">
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                            {socio.nombres[0]}{socio.apellidos[0]}
                        </div>
                        <div>
                            <p className="font-bold text-white leading-tight">{socio.apellidos}, {socio.nombres}</p>
                            <p className="text-xs text-slate-500 font-mono">DNI: {socio.dni}</p>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                        {selectedYear !== 'ALL' && (
                             <div className="text-right border-r border-slate-800 pr-6">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cierre {selectedYear}</p>
                                <p className={`font-bold text-lg ${parseFloat(saldoPeriodo) < 0 ? 'text-red-400' : parseFloat(saldoPeriodo) > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    $ {Math.abs(parseFloat(saldoPeriodo)).toLocaleString('es-AR')}
                                </p>
                            </div>
                        )}
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Saldo Total</p>
                            <p className={`font-black tracking-tight text-xl ${parseFloat(saldo) < 0 ? 'text-red-400' : parseFloat(saldo) > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                $ {Math.abs(parseFloat(saldo)).toLocaleString('es-AR')}
                                {parseFloat(saldo) < 0 && <TrendingDown size={16} className="inline ml-1" />}
                                {parseFloat(saldo) > 0 && <TrendingUp size={16} className="inline ml-1" />}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="overflow-y-auto overflow-x-auto max-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-slate-500">Fecha</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-slate-500">Concepto</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-slate-500 text-right">Monto</th>
                                    <th className="px-6 py-4 text-xs uppercase tracking-widest font-bold text-slate-500 text-center">Recibo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {cargando ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
                                            <p className="mt-4 text-sm text-slate-500 uppercase tracking-widest font-medium">Buscando movimientos...</p>
                                        </td>
                                    </tr>
                                ) : movimientosList.length > 0 ? (
                                    movimientosList.map((m) => (
                                        <tr key={m.id} className="hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Calendar size={14} />
                                                    <span className="text-sm font-medium">{new Date(m.creado_en || m.fecha).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-white font-medium">{m.descripcion || m.concepto}</span>
                                                <span className="ml-2 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-widest">{m.tipo}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-sm font-black font-mono ${parseFloat(m.monto) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {parseFloat(m.monto) > 0 ? '+' : ''}{parseFloat(m.monto).toLocaleString('es-AR')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {parseFloat(m.monto) > 0 && (
                                                    <button 
                                                        onClick={() => downloadPDF(m.id)}
                                                        className="p-2 bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-500 rounded-lg transition-all mx-auto"
                                                        title="Descargar Recibo PDF"
                                                    >
                                                        <FileDown size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No hay movimientos registrados para esta cuenta.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                        Cerrar Historial
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default MovimientosModal;
