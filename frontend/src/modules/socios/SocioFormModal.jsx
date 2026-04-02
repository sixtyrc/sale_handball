import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import { Save, Loader2, Info } from 'lucide-react';
import api from '../../services/api';

const SocioFormModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [formData, setFormData] = useState({
        dni: '',
        nro_socio: '',
        nombres: '',
        apellidos: '',
        fecha_nacimiento: '',
        email_contacto: '',
        telefono: '',
        altura: '',
        mano_habil: 'DER',
        posicion_habitual: '',
        nombre_tutor: '',
        dni_tutor: '',
        tel_tutor: '',
        parentesco_tutor: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post('socios/', formData);
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                dni: '', nro_socio: '', nombres: '', apellidos: '', fecha_nacimiento: '', 
                email_contacto: '', telefono: '', altura: '', mano_habil: 'DER', 
                posicion_habitual: '', nombre_tutor: '', dni_tutor: '', tel_tutor: '', parentesco_tutor: ''
            });
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                const messages = Object.entries(data).map(([field, msgs]) => 
                    `${field.toUpperCase()}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
                );
                setError(messages.join(' | '));
            } else if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
                setError('❌ ERROR 500: El servidor falló (ver logs de terminal backend).');
            } else {
                setError('❌ Error crítico de comunicación con el servidor.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Socio">
            {/* Tabs Selector */}
            <div className="flex border-b border-slate-800 mb-6 bg-slate-950/20 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveTab('personal')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'personal' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
                >
                    Datos Personales
                </button>
                <button 
                    onClick={() => setActiveTab('deportivo')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'deportivo' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
                >
                    Perfil Deportivo
                </button>
                <button 
                    onClick={() => setActiveTab('tutor')}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'tutor' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
                >
                    Tutor / Responsable
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] uppercase font-bold flex items-center gap-2">
                        <Info size={14} /> {error}
                    </div>
                )}

                {activeTab === 'personal' && (
                    <div className="animate-in fade-in duration-300 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombres</label>
                                <input required name="nombres" value={formData.nombres} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500" placeholder="Ej: Juan" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Apellidos</label>
                                <input required name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500" placeholder="Ej: Perez" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DNI</label>
                                <input required name="dni" value={formData.dni} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500" placeholder="20.xxx.xxx" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Nro de Socio</label>
                                <input name="nro_socio" value={formData.nro_socio} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-blue-500/30 rounded-xl text-white focus:outline-none focus:border-blue-500" placeholder="ID Interno" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between items-center">
                                <span>Fecha Nacimiento</span>
                                {formData.fecha_nacimiento && (
                                    <span className="text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">
                                        {(() => {
                                            const today = new Date();
                                            const birthDate = new Date(formData.fecha_nacimiento);
                                            let age = today.getFullYear() - birthDate.getFullYear();
                                            const m = today.getMonth() - birthDate.getMonth();
                                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                                age--;
                                            }
                                            return `${age} AÑOS`;
                                        })()}
                                    </span>
                                )}
                            </label>
                            <input required type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</label>
                                <input name="email_contacto" value={formData.email_contacto} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500" placeholder="contacto@club.com" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Teléfono</label>
                                <input name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500" placeholder="+54 9 11..." />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'deportivo' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Altura (Metros)</label>
                                <input type="number" step="0.01" name="altura" value={formData.altura} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500" placeholder="Ej: 1.85" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mano Hábil</label>
                                <select name="mano_habil" value={formData.mano_habil} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500">
                                    <option value="DER">Diestro</option>
                                    <option value="IZQ">Zurdo</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Posición Habitual</label>
                            <input name="posicion_habitual" value={formData.posicion_habitual} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500" placeholder="Pivot, Extremo, etc." />
                        </div>
                    </div>
                )}

                {activeTab === 'tutor' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre Completo Tutor</label>
                            <input name="nombre_tutor" value={formData.nombre_tutor} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500" placeholder="Padre/Madre/Tutor" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DNI Tutor</label>
                                <input name="dni_tutor" value={formData.dni_tutor} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500" placeholder="Identificación" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tel. Tutor</label>
                                <input name="tel_tutor" value={formData.tel_tutor} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500" placeholder="Contacto tutor" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Parentesco</label>
                            <input name="parentesco_tutor" value={formData.parentesco_tutor} onChange={handleChange} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500" placeholder="Padre, Madre, etc." />
                        </div>
                    </div>
                )}

                <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-black uppercase text-slate-500 hover:text-white transition-colors">Cancelar</button>
                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-3">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar Ficha Profesional
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default SocioFormModal;
