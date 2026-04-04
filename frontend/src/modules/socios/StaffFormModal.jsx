import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import { UserPlus, Loader2, Info, MapPin, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { useUIStore } from '../../store/uiStore';

const StaffFormModal = ({ isOpen, onClose, onSuccess }) => {
    const { addToast } = useUIStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        dni: '',
        nombres: '',
        apellidos: '',
        fecha_nacimiento: '',
        email_contacto: '',
        telefono: '',
        domicilio: '',
        sexo: '',
        foto: null,
        estado: 'ACTIVO',
        es_profesor: true, // Siempre true para este modal
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'telefono') {
            let cleaned = value.replace(/\D/g, '');
            if (cleaned.length > 0) {
                if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
                if (cleaned.startsWith('15')) cleaned = cleaned.substring(2);
            }
            setFormData({ ...formData, [name]: cleaned });
        } else if (e.target.type === 'file') {
            setFormData({ ...formData, [name]: e.target.files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nombres || !formData.apellidos || !formData.dni || !formData.fecha_nacimiento || !formData.sexo) {
            addToast({
                type: 'warning',
                title: 'Campos Obligatorios',
                message: 'Por favor completa los datos básicos del profesor.'
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'foto') {
                    if (value instanceof File) data.append(key, value);
                } else if (value !== null && value !== '') {
                    data.append(key, value);
                }
            });

            await api.post('socios/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            addToast({
                type: 'success',
                title: 'Staff Registrado',
                message: `${formData.nombres} ${formData.apellidos} ha sido dado de alta como profesor.`
            });

            onSuccess();
            setFormData({
                dni: '', nombres: '', apellidos: '', fecha_nacimiento: '',
                email_contacto: '', telefono: '', domicilio: '', sexo: '',
                foto: null, estado: 'ACTIVO', es_profesor: true
            });
            onClose();
        } catch (err) {
            const errData = err.response?.data;
            const msg = typeof errData === 'object'
                ? Object.entries(errData).map(([f, m]) => `${f.toUpperCase()}: ${m}`).join(' | ')
                : 'Error al registrar al profesor.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Alta de Personal / Staff">
            <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="text-amber-500" size={20} />
                </div>
                <div>
                    <h4 className="text-amber-500 font-black text-[10px] uppercase tracking-widest">Cuenta de Gestión</h4>
                    <p className="text-slate-400 text-[11px] leading-tight">Al registrar un profesor, el sistema le creará automáticamente una cuenta de acceso con permisos de gestión deportiva.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-20 sm:pb-0">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold uppercase flex items-center gap-3">
                        <Info size={16} /> {error}
                    </div>
                )}

                <div className="animate-in fade-in duration-500 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nombres *</label>
                        <input required name="nombres" value={formData.nombres} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Apellidos *</label>
                        <input required name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">DNI *</label>
                        <input required name="dni" value={formData.dni} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono shadow-inner" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest pl-1">Fecha Nacimiento *</label>
                        <input required type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner" />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <MapPin size={10} className="text-blue-500" /> Domicilio
                        </label>
                        <input name="domicilio" value={formData.domicilio} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner" placeholder="Calle, Nro, Piso, Depto..." />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Sexo / Género *</label>
                        <select required name="sexo" value={formData.sexo} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 appearance-none">
                            <option value="">Seleccionar...</option>
                            <option value="MASCULINO">Masculino</option>
                            <option value="FEMENINO">Femenino</option>
                            <option value="OTRO">Otro / No especifica</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest pl-1">Foto 4x4 (Perfil)</label>
                        <input type="file" accept="image/*" name="foto" onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all" />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                        <div className="flex justify-between items-center mb-1 px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp / Celular de Contacto</label>
                        </div>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 text-sm font-bold border-r border-slate-800 pr-4">+54 9</span>
                            <input name="telefono" value={formData.telefono} onChange={handleChange} className="w-full pl-20 pr-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono" placeholder="3624617511" />
                        </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email Institucional / Contacto</label>
                        <input type="email" name="email_contacto" value={formData.email_contacto} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" placeholder="profe@ejemplo.com" />
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 sm:relative sm:bg-transparent sm:border-0 sm:p-0 sm:pt-10 flex flex-col sm:flex-row justify-end gap-3 z-20">
                    <button type="button" onClick={onClose} className="hidden sm:block px-8 py-4 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Cancelar</button>
                    <button type="submit" disabled={loading} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-amber-500/30 disabled:opacity-50 flex items-center justify-center gap-4 active:scale-[0.98]">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                        Dar de Alta Profesor
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default StaffFormModal;
