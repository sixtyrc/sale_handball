import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import { Upload, Calendar, FileText, Loader2, CheckCircle2, Save, AlertCircle, FileX, X } from 'lucide-react';
import api from '../../services/api';

const CargarDocumentoModal = ({ isOpen, onClose, socioId, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        tipo: 'APTO_FISICO',
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_vencimiento: '',
        observaciones: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && !ALLOWED_TYPES.includes(selected.type)) {
            setError('❌ Formato no permitido. Solo PNG, JPG o PDF.');
            setFile(null);
            e.target.value = null; // Reset input
            return;
        }
        setError(null);
        setFile(selected || null);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        console.log('🚀 Iniciando guardado...');
        
        if (!formData.fecha_vencimiento) {
            setError('❌ Indica la fecha de vencimiento.');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        const data = new FormData();
        data.append('socio', socioId);
        
        // El archivo es OPCIONAL ahora
        if (file) {
            data.append('archivo', file);
        }
        
        data.append('tipo', formData.tipo);
        data.append('fecha_emision', formData.fecha_emision);
        data.append('fecha_vencimiento', formData.fecha_vencimiento);

        try {
            const res = await api.post('deportes/documentos/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('✅ Éxito:', res.data);
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
                setSuccess(false);
                setFile(null);
            }, 1200);
        } catch (err) {
            console.error('❌ Error API:', err.response?.data || err.message);
            const detail = err.response?.data ? JSON.stringify(err.response.data) : 'Error de comunicación.';
            setError(`Falló el guardado: ${detail}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Documentación">
            <div className="p-4 space-y-4">
                {success ? (
                    <div className="py-10 text-center">
                        <CheckCircle2 className="text-emerald-500 mx-auto mb-4 animate-bounce" size={48} />
                        <h3 className="text-xl font-bold text-white tracking-widest uppercase">¡Actualizado!</h3>
                    </div>
                ) : (
                    <>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Seleccionar Trámite</label>
                            <select 
                                value={formData.tipo}
                                onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white font-bold text-sm focus:border-blue-500 outline-none"
                            >
                                <option value="APTO_FISICO">Apto Médico Anual</option>
                                <option value="FICHA_FEDERATIVA">Ficha de Federación</option>
                                <option value="OTRO">Otros Documentos</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Vencimiento</label>
                                <input 
                                    type="date"
                                    required
                                    value={formData.fecha_vencimiento}
                                    onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
                                    className={`w-full bg-slate-950 border p-3 rounded-xl text-white text-center font-bold text-xs focus:outline-none [color-scheme:dark] ${
                                        !formData.fecha_vencimiento ? 'border-amber-500/50 text-amber-500' : 'border-slate-800 text-emerald-400'
                                    }`}
                                />
                            </div>
                            <div className="space-y-1 opacity-60">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Emisión</label>
                                <input 
                                    type="date"
                                    value={formData.fecha_emision}
                                    onChange={(e) => setFormData({...formData, fecha_emision: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white text-center font-bold text-xs focus:outline-none [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between items-center pr-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Archivo (Opcional)</label>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">PDF, JPG, PNG</span>
                            </div>
                            <input 
                                type="file" 
                                id="file-medical-opt" 
                                className="hidden" 
                                accept=".jpg,.jpeg,.png,.pdf" 
                                onChange={handleFileChange}
                            />
                            <label 
                                htmlFor="file-medical-opt"
                                className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                    file ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-800 bg-slate-950/40 hover:border-blue-500/50'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${file ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-900 text-slate-600'}`}>
                                    {file ? <FileText size={16} /> : <Upload size={16} />}
                                </div>
                                <span className="text-[11px] font-bold text-white truncate flex-grow">
                                    {file ? file.name : 'Vincular Comprobante (Opcional)'}
                                </span>
                                {file && (
                                    <button 
                                        type="button" 
                                        onClick={(e) => { e.preventDefault(); setFile(null); }}
                                        className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </label>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-1">
                                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-wide leading-tight">{error}</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <button 
                                onClick={handleSubmit}
                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
                                    !formData.fecha_vencimiento 
                                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                                }`}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        <Save size={18} />
                                        GUARDAR CAMBIOS
                                    </>
                                )}
                            </button>
                            <button onClick={onClose} className="w-full text-[10px] font-black text-slate-700 hover:text-slate-500 py-3 uppercase tracking-tighter">
                                Quizás luego
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default CargarDocumentoModal;
