import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import { UserPlus, Loader2, Info, MapPin } from 'lucide-react';
import api from '../../services/api';
import { useUIStore } from '../../store/uiStore';

const SocioFormModal = ({ isOpen, onClose, onSuccess }) => {
    const { addToast } = useUIStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [formData, setFormData] = useState({
        dni: '',
        nombres: '',
        apellidos: '',
        fecha_nacimiento: '',
        email_contacto: '',
        telefono: '',
        domicilio: '',
        sexo: '',
        grupo_sanguineo: '',
        porcentaje_beca: 0,
        foto: null,
        estado: 'ACTIVO',
        nro_socio: '',
        altura: '',
        mano_habil: 'DER',
        posicion_habitual: '',
        nombre_tutor: '',
        dni_tutor: '',
        tel_tutor: '',
        parentesco_tutor: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'telefono' || name === 'tel_tutor') {
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
                title: 'Socio Registrado',
                message: `${formData.nombres} ${formData.apellidos} ya es parte del club.`
            });

            onSuccess();
            setFormData({
                dni: '', nombres: '', apellidos: '', fecha_nacimiento: '',
                email_contacto: '', telefono: '', domicilio: '', sexo: '', grupo_sanguineo: '',
                porcentaje_beca: 0, foto: null, estado: 'ACTIVO', nro_socio: '',
                altura: '', mano_habil: 'DER', posicion_habitual: '',
                nombre_tutor: '', dni_tutor: '', tel_tutor: '', parentesco_tutor: ''
            });
            onClose();
        } catch (err) {
            const errData = err.response?.data;
            const msg = typeof errData === 'object'
                ? Object.entries(errData).map(([f, m]) => `${f.toUpperCase()}: ${m}`).join(' | ')
                : 'Error al registrar el socio.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Alta de Nuevo Socio">
            {/* Tabs Selector - Mobile Optimized */}
            <div className="flex border-b border-slate-800 mb-6 bg-slate-950/20 p-1.5 rounded-2xl sticky top-0 z-10 backdrop-blur-md">
                <button 
                    type="button"
                    onClick={() => setActiveTab('personal')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'personal' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-500 hover:text-white'}`}
                >
                    Personal
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab('deportivo')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'deportivo' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-500 hover:text-white'}`}
                >
                    Deportivo
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab('tutor')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'tutor' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'text-slate-500 hover:text-white'}`}
                >
                    Tutor
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-20 sm:pb-0">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold uppercase flex items-center gap-3">
                        <Info size={16} /> {error}
                    </div>
                )}

                {activeTab === 'personal' && (
                    <div className="animate-in fade-in duration-500 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nombres</label>
                            <input required name="nombres" value={formData.nombres} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Apellidos</label>
                            <input required name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">DNI</label>
                            <input required name="dni" value={formData.dni} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono shadow-inner" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest pl-1">Fecha Nacimiento</label>
                            <input required type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner" />
                        </div>

                        {/* DOMICILIO */}
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                <MapPin size={10} className="text-blue-500" /> Domicilio Laboral / Particular
                            </label>
                            <input name="domicilio" value={formData.domicilio} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner" placeholder="Calle, Nro, Piso, Depto..." />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-1">Beca (%)</label>
                            <input type="number" min="0" max="100" name="porcentaje_beca" value={formData.porcentaje_beca} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest pl-1">Foto 4x4 (Opcional)</label>
                            <input type="file" accept="image/*" name="foto" onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all" />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Sexo / Género</label>
                            <select name="sexo" value={formData.sexo} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none">
                                <option value="">Seleccionar...</option>
                                <option value="MASCULINO">Masculino</option>
                                <option value="FEMENINO">Femenino</option>
                                <option value="OTRO">Otro / No especifica</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Grupo Sanguíneo</label>
                            <select name="grupo_sanguineo" value={formData.grupo_sanguineo} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none appearance-none">
                                <option value="">No sabe / No informa</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <div className="flex justify-between items-center mb-1 px-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp / Celular</label>
                                <span className="text-[8px] font-black text-blue-500/70">SOLO DÍGITOS (SIN 0/15)</span>
                            </div>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 text-sm font-bold border-r border-slate-800 pr-4">+54 9</span>
                                <input name="telefono" value={formData.telefono} onChange={handleChange} className="w-full pl-20 pr-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono" placeholder="3624617511" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'deportivo' && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Altura (Metros)</label>
                            <input type="number" step="0.01" name="altura" value={formData.altura} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none" placeholder="Ej: 1.85" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Mano Hábil</label>
                            <select name="mano_habil" value={formData.mano_habil} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none">
                                <option value="DER">Diestro</option>
                                <option value="IZQ">Zurdo</option>
                            </select>
                        </div>
                    </div>
                )}

                {activeTab === 'tutor' && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nombre Completo Tutor</label>
                            <input name="nombre_tutor" value={formData.nombre_tutor} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none" placeholder="Padre/Madre/Tutor" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">DNI Tutor</label>
                            <input name="dni_tutor" value={formData.dni_tutor} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none" placeholder="Identificación" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">WhatsApp Tutor</label>
                            <input name="tel_tutor" value={formData.tel_tutor} onChange={handleChange} className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:outline-none font-mono" placeholder="Ej: 3624617511" />
                        </div>
                    </div>
                )}

                {/* Submit Section - Sticky Mobile */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 sm:relative sm:bg-transparent sm:border-0 sm:p-0 sm:pt-10 flex flex-col sm:flex-row justify-end gap-3 z-20">
                    <button type="button" onClick={onClose} className="hidden sm:block px-8 py-4 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Cancelar</button>
                    <button type="submit" disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-4 active:scale-[0.98]">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                        Registrar Socio Nuevo
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default SocioFormModal;
