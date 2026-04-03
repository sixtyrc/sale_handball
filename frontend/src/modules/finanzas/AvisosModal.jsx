import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { Loader2, CheckCircle2, XCircle, Clock, Eye, AlertCircle, FileText } from 'lucide-react';
import api from '../../services/api';
import { useUIStore } from '../../store/uiStore';

const AvisosModal = ({ isOpen, onClose, onSuccess }) => {
    const { addToast } = useUIStore();
    const [avisos, setAvisos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [estadoTab, setEstadoTab] = useState('PENDIENTE'); // PENDIENTE | VALIDADO | RECHAZADO
    
    // Detalle / Acción
    const [selectedAviso, setSelectedAviso] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [rechazoMotivo, setRechazoMotivo] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchAvisos();
            setSelectedAviso(null);
        }
    }, [isOpen, estadoTab]);

    const fetchAvisos = async () => {
        setLoading(true);
        try {
            const res = await api.get(`finanzas/avisos/?estado=${estadoTab}`);
            setAvisos(res.data);
        } catch (error) {
            console.error('Error fetching avisos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleValidar = async () => {
        if (!selectedAviso) return;
        setActionLoading(true);
        try {
            await api.post(`finanzas/avisos/${selectedAviso.id}/validar/`, {
                monto_real: selectedAviso.monto_declarado,
                descripcion: selectedAviso.descripcion
            });
            addToast({ type: 'success', title: 'Pago Validado', message: 'El recibo ha sido generado exitosamente.' });
            setSelectedAviso(null);
            fetchAvisos();
            if (onSuccess) onSuccess();
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: error.response?.data?.error || 'No se pudo validar el pago.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRechazar = async () => {
        if (!selectedAviso) return;
        if (!rechazoMotivo.trim()) {
            addToast({ type: 'error', title: 'Error', message: 'Debe indicar un motivo de rechazo.' });
            return;
        }
        setActionLoading(true);
        try {
            await api.post(`finanzas/avisos/${selectedAviso.id}/rechazar/`, {
                motivo: rechazoMotivo
            });
            addToast({ type: 'success', title: 'Aviso Rechazado', message: 'El socio fue notificado.' });
            setSelectedAviso(null);
            setRechazoMotivo('');
            fetchAvisos();
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: error.response?.data?.error || 'No se pudo rechazar.' });
        } finally {
            setActionLoading(false);
        }
    };

    const renderDetail = () => {
        if (!selectedAviso) return null;
        
        return (
            <div className="mt-6 border-t border-slate-800 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Detalle del Aviso</h3>
                    <button onClick={() => setSelectedAviso(null)} className="text-slate-400 hover:text-white text-sm">
                        Cerrar Detalle
                    </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                        <p className="text-slate-500 mb-1">Socio</p>
                        <p className="text-white font-medium">{selectedAviso.socio_nombre}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-1">Monto Declarado</p>
                        <p className="text-amber-400 font-bold tracking-tight text-lg">
                            ${parseFloat(selectedAviso.monto_declarado).toLocaleString('es-AR')}
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-1">Fecha Declarada</p>
                        <p className="text-white">{selectedAviso.fecha_declarada}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-1">Concepto</p>
                        <p className="text-white">{selectedAviso.descripcion}</p>
                    </div>
                </div>

                {selectedAviso.comprobante && (
                    <div className="mb-6">
                        <p className="text-slate-500 mb-2 text-sm">Comprobante Adjunto</p>
                        <a 
                            href={`http://localhost:8000${selectedAviso.comprobante}`} 
                            target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors text-sm"
                        >
                            <FileText size={16} /> Ver Comprobante
                        </a>
                    </div>
                )}

                {selectedAviso.estado === 'PENDIENTE' && (
                    <div className="space-y-4">
                        <textarea
                            value={rechazoMotivo}
                            onChange={(e) => setRechazoMotivo(e.target.value)}
                            placeholder="Motivo de rechazo (solo si se rechaza)"
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
                            rows={2}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleRechazar}
                                disabled={actionLoading || !rechazoMotivo.trim()}
                                className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold transition-colors disabled:opacity-50"
                            >
                                Rechazar Pago
                            </button>
                            <button
                                onClick={handleValidar}
                                disabled={actionLoading}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                Validar Pago
                            </button>
                        </div>
                    </div>
                )}

                {selectedAviso.estado === 'RECHAZADO' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-red-400 text-sm font-bold mb-1">Motivo del rechazo:</p>
                        <p className="text-red-300 text-sm">{selectedAviso.observacion_rechazo}</p>
                    </div>
                )}
                
                {selectedAviso.estado === 'VALIDADO' && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <p className="text-emerald-400 text-sm font-bold flex items-center gap-2">
                            <CheckCircle2 size={16} /> Pago verificado y acreditado
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bandeja de Avisos de Pago" size="3xl">
            <div className="flex gap-2 mb-6 border-b border-slate-800 pb-2">
                {[
                    { id: 'PENDIENTE', label: 'Pendientes', icon: <Clock size={16} /> },
                    { id: 'VALIDADO', label: 'Validados', icon: <CheckCircle2 size={16} /> },
                    { id: 'RECHAZADO', label: 'Rechazados', icon: <XCircle size={16} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setEstadoTab(tab.id); setSelectedAviso(null); }}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                            estadoTab === tab.id 
                            ? 'bg-slate-800 text-white' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="py-12 flex justify-center"><Loader2 size={32} className="text-blue-500 animate-spin" /></div>
            ) : avisos.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                    <AlertCircle size={32} className="mx-auto mb-3 opacity-50" />
                    <p>No hay avisos en este estado.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6 items-start">
                    {/* Lista de Avisos */}
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {avisos.map(aviso => (
                            <div 
                                key={aviso.id} 
                                onClick={() => setSelectedAviso(aviso)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    selectedAviso?.id === aviso.id 
                                    ? 'bg-blue-600/10 border-blue-500/50' 
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-white text-sm">{aviso.socio_nombre}</p>
                                    <p className="text-amber-400 font-bold text-sm tracking-tight">
                                        ${parseFloat(aviso.monto_declarado).toLocaleString('es-AR')}
                                    </p>
                                </div>
                                <p className="text-slate-400 text-xs mb-2 truncate">{aviso.descripcion}</p>
                                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                                    <span>{aviso.fecha_declarada}</span>
                                    {aviso.comprobante && <span className="flex items-center gap-1 text-blue-400"><Eye size={12} /> Comprobante</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Panel de Detalle Derecho (solo visible en md+) */}
                    <div className="hidden md:block sticky top-0">
                        {selectedAviso ? renderDetail() : (
                            <div className="h-full flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-8" style={{ minHeight: '300px' }}>
                                <p>Seleccione un aviso para ver el detalle y operar.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Detalle en mobile (abajo de la lista) */}
            <div className="md:hidden">
                {renderDetail()}
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
                <button onClick={onClose} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold">
                    Cerrar
                </button>
            </div>
        </Modal>
    );
};

export default AvisosModal;
