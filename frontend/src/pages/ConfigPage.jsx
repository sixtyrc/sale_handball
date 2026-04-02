import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import { 
    Settings, 
    Palette, 
    Building2, 
    ShieldCheck, 
    Smartphone, 
    Loader2, 
    Save, 
    Globe, 
    Upload,
    Mail,
    Phone,
    MapPin,
    SmartphoneNfc,
    Bell,
    ExternalLink,
    Lock
} from 'lucide-react';

const ConfigPage = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('branding');

    const [logoFile, setLogoFile] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await api.get('admin-club/config/');
            setConfig(response.data);
        } catch (error) {
            console.error('Error fetching club config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const formData = new FormData();
            
            if (config.color_primario) formData.append('color_primario', config.color_primario);
            if (config.color_secundario) formData.append('color_secundario', config.color_secundario);
            
            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const response = await api.put('admin-club/config/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setConfig(response.data);
            setLogoFile(null); // Clean the temp file state
            alert('Configuración guardada exitosamente. \n\nRecargá la página para ver impactado el Logo en los PDFs.');
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Error al guardar la configuración.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setLogoFile(e.target.files[0]);
        }
    };

    const handleColorChange = (name, val) => {
        setConfig(prev => ({ ...prev, [name]: val }));
    };

    const tabs = [
        { id: 'branding', label: 'Branding & Diseño', icon: Palette },
        { id: 'institucion', label: 'Institucional', icon: Building2 },
        { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
        { id: 'integraciones', label: 'Integraciones', icon: SmartphoneNfc },
    ];

    if (loading) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center py-40 gap-4 text-slate-500">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Consultando Configuración...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Configuración</h2>
                    <p className="text-slate-400">Personalización del Club y del Sistema de Gestión</p>
                </div>
                
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-black transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    Guardar Cambios
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Tabs Sidebar */}
                <div className="w-full lg:w-72 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold ${
                                activeTab === tab.id 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                : 'text-slate-500 hover:bg-slate-900 hover:text-white'
                            }`}
                        >
                            <tab.icon size={20} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Panel */}
                <div className="flex-grow bg-slate-900/50 border border-slate-800 rounded-[2rem] p-10 backdrop-blur-xl relative">
                    <div className="absolute top-0 right-0 p-10 opacity-5 -z-10 text-slate-500 overflow-hidden"><Settings size={300} strokeWidth={0.5} /></div>
                    
                    {activeTab === 'branding' && (
                        <div className="space-y-12">
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2">Identidad Visual</h3>
                                <p className="text-slate-400 text-sm">Personaliza cómo se ven tus pantallas de gestión y la PWA de los socios.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Logo Principal</label>
                                    <label className="bg-slate-900 border-2 border-dashed border-slate-800 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 group hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden">
                                        <input 
                                            type="file" 
                                            accept="image/png, image/jpeg" 
                                            onChange={handleFileChange} 
                                            className="hidden" 
                                        />
                                        
                                        {logoFile ? (
                                            <div className="text-center">
                                                <div className="w-20 h-20 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-2 border border-blue-500/30">
                                                    <Upload size={32} />
                                                </div>
                                                <p className="text-xs font-bold text-blue-400">{logoFile.name}</p>
                                            </div>
                                        ) : config?.logo ? (
                                            <div className="text-center group-hover:opacity-50 transition-all">
                                                <img src={`${config.logo}?t=${new Date().getTime()}`} alt="Logo Club" className="w-20 h-20 object-contain mx-auto mb-2 bg-white/5 rounded-xl p-2" />
                                                <p className="text-[10px] uppercase font-bold text-slate-500">Logo Actual</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 group-hover:text-blue-500 transition-all"><Upload size={32} /></div>
                                                <p className="text-xs text-slate-500 font-medium italic text-center">Sube tu logo en PNG<br/>(fondo transparente recomendado)</p>
                                            </>
                                        )}
                                        
                                        {config?.logo && !logoFile && (
                                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                <p className="text-sm font-bold text-white flex items-center gap-2"><Upload size={18} /> Cambiar Logo</p>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Esquema de Colores</label>
                                        
                                        {/* Selector de Color Primario */}
                                        <div className="space-y-3 p-5 bg-slate-900 border border-slate-800 rounded-3xl">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                                                <span>Color Primario (Énfasis)</span>
                                                <span className="font-mono bg-slate-800 px-2 rounded">{config?.color_primario || '#2563EB'}</span>
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {['#2563EB', '#DC2626', '#16A34A', '#EA580C', '#9333EA', '#0F172A', '#D97706', '#DB2777'].map(color => (
                                                    <button 
                                                        key={`pri-${color}`}
                                                        onClick={() => handleColorChange('color_primario', color)}
                                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 shadow-lg shadow-black/20 ${config?.color_primario === color ? 'border-white scale-110' : 'border-transparent'}`}
                                                        style={{ backgroundColor: color }}
                                                        title={color}
                                                    />
                                                ))}
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-slate-700 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center" title="Personalizado">
                                                    <input 
                                                        type="color" 
                                                        name="color_primario"
                                                        value={config?.color_primario || '#2563EB'} 
                                                        onChange={(e) => handleColorChange('color_primario', e.target.value)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" 
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selector de Color Secundario */}
                                        <div className="space-y-3 p-5 bg-slate-900 border border-slate-800 rounded-3xl">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                                                <span>Color Secundario (Detalles)</span>
                                                <span className="font-mono bg-slate-800 px-2 rounded">{config?.color_secundario || '#1E40AF'}</span>
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {['#1E40AF', '#991B1B', '#15803D', '#C2410C', '#7E22CE', '#1E293B', '#B45309', '#BE185D'].map(color => (
                                                    <button 
                                                        key={`sec-${color}`}
                                                        onClick={() => handleColorChange('color_secundario', color)}
                                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 shadow-lg shadow-black/20 ${config?.color_secundario === color ? 'border-white scale-110' : 'border-transparent'}`}
                                                        style={{ backgroundColor: color }}
                                                        title={color}
                                                    />
                                                ))}
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-slate-700 bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center" title="Personalizado">
                                                    <input 
                                                        type="color" 
                                                        name="color_secundario"
                                                        value={config?.color_secundario || '#1E40AF'} 
                                                        onChange={(e) => handleColorChange('color_secundario', e.target.value)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-600/5 border border-blue-600/20 rounded-2xl">
                                        <div className="flex items-center gap-3 mb-2 text-blue-500">
                                            <Palette size={18} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Vista Previa Premium</span>
                                        </div>
                                        <p className="text-xs text-slate-400">Los cambios de branding se aplican automáticamente en PDFs de recibos, logins y carnets digitales de socios.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'institucion' && (
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2">Datos del Club</h3>
                                <p className="text-slate-400 text-sm">Información legal e institucional para encabezados oficiales.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest px-2">Nombre Institucional</label>
                                    <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white hover:border-slate-700 transition-all focus-within:border-blue-500">
                                        <Building2 size={20} className="text-slate-600" />
                                        <input type="text" name="nombre" value={config?.nombre || ''} onChange={handleChange} className="bg-transparent w-full focus:outline-none font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest px-2">Web / Social</label>
                                    <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white hover:border-slate-700 transition-all focus-within:border-blue-500">
                                        <Globe size={20} className="text-slate-600" />
                                        <input type="text" name="web" value={config?.web || ''} onChange={handleChange} className="bg-transparent w-full focus:outline-none font-light" placeholder="www.midominio.com" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest px-2">Email Oficial</label>
                                    <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white hover:border-slate-700 transition-all focus-within:border-blue-500">
                                        <Mail size={20} className="text-slate-600" />
                                        <input type="text" name="email_contacto" value={config?.email_contacto || ''} onChange={handleChange} className="bg-transparent w-full focus:outline-none font-light" placeholder="correo@ejemplo.com" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest px-2">Teléfono Sede</label>
                                    <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white hover:border-slate-700 transition-all focus-within:border-blue-500">
                                        <Phone size={20} className="text-slate-600" />
                                        <input type="text" name="telefono" value={config?.telefono || ''} onChange={handleChange} className="bg-transparent w-full focus:outline-none font-light" placeholder="+54 9..." />
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest px-2">Dirección Sede / Estadio</label>
                                    <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white hover:border-slate-700 transition-all focus-within:border-blue-500">
                                        <MapPin size={20} className="text-slate-600" />
                                        <input type="text" name="direccion" value={config?.direccion || ''} onChange={handleChange} className="bg-transparent w-full focus:outline-none font-light" placeholder="Calle, Número, Ciudad" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'integraciones' && (
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2">Módulos Externos</h3>
                                <p className="text-slate-400 text-sm">Conecta tu club con pasarelas de pago y servicios de mensajería.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex items-center justify-between group hover:border-emerald-600/30 transition-all">
                                    <div className="flex items-center gap-6 text-white">
                                        <div className="w-16 h-16 bg-white rounded-2xl border border-slate-700 flex items-center justify-center p-2 invert group-hover:scale-110 transition-transform">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mercado_Pago_logo.svg/1024px-Mercado_Pago_logo.svg.png" alt="MP Logo" className="w-full grayscale" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black">Mercado Pago</h4>
                                            <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full uppercase tracking-tighter">Conectado vía OAuth</span>
                                        </div>
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-all underline underline-offset-4 decoration-blue-500/50">
                                        Configurar Llaves <ExternalLink size={14} />
                                    </button>
                                </div>

                                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex items-center justify-between group hover:border-blue-600/30 transition-all">
                                    <div className="flex items-center gap-6 text-white">
                                        <div className="w-16 h-16 bg-blue-600/10 rounded-2xl border border-blue-600/20 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                                            <Mail size={32} className="text-blue-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black">SMTP Resend</h4>
                                            <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full uppercase tracking-tighter">Estado: Servidor Activo</span>
                                        </div>
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-all underline underline-offset-4 decoration-blue-500/50">
                                        Test Envío <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Security Note */}
            <div className="mt-12 flex items-center gap-4 text-slate-600 p-8 border border-slate-800 rounded-3xl bg-slate-900/10">
                <ShieldCheck size={40} className="text-emerald-900" />
                <div className="text-xs space-y-1">
                    <p className="font-black text-slate-500 uppercase tracking-widest mb-1 items-center flex gap-1"><Lock size={12} /> Zona Segura</p>
                    <p className="max-w-2xl leading-relaxed">Esta zona es exclusiva para administradores del club de nivel 1. Todos los cambios realizados se auditan permanentemente conforme a la Ley de Protección de Datos Personales.</p>
                </div>
            </div>
        </MainLayout>
    );
};

export default ConfigPage;
