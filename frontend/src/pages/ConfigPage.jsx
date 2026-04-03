import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import { useUIStore } from '../store/uiStore';
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
    Lock,
    Banknote,
    CalendarDays,
    PercentCircle
} from 'lucide-react';

const ConfigPage = () => {
    const { addToast } = useUIStore();
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
            
            // Agregamos todos los campos de texto/número dinámicamente
            Object.keys(config).forEach(key => {
                if (config[key] !== null && key !== 'logo' && typeof config[key] !== 'object') {
                    formData.append(key, config[key]);
                }
            });

            if (logoFile) {
                formData.append('logo', logoFile);
            }

            const response = await api.put('admin-club/config/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setConfig(response.data);
            setLogoFile(null); // Clean the temp file state
            
            addToast({
                type: 'success',
                title: 'Configuración Actualizada',
                message: 'Los ajustes del club se han guardado correctamente.'
            });
        } catch (error) {
            console.error('Error saving config:', error);
            addToast({
                type: 'error',
                title: 'Error de Guardado',
                message: 'No se pudieron sincronizar los cambios. Intenta de nuevo.'
            });
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
        { id: 'finanzas', label: 'Finanzas & Ciclos', icon: Banknote },
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
            <div className="flex justify-between items-end mb-10 px-4">
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

            <div className="flex flex-col lg:flex-row gap-8 px-4">
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
                <div className="flex-grow bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-6 lg:p-10 backdrop-blur-xl relative min-h-[600px]">
                    <div className="absolute top-0 right-0 p-10 opacity-5 -z-10 text-slate-500 overflow-hidden"><Settings size={300} strokeWidth={0.5} /></div>
                    
                    {activeTab === 'branding' && (
                        <div className="space-y-12 animate-in fade-in duration-500">
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Identidad Visual</h3>
                                <p className="text-slate-400 text-sm">Personaliza cómo se ven tus pantallas de gestión y la PWA de los socios.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Logo Principal del Club</label>
                                    <label className="bg-slate-950 border-2 border-dashed border-slate-800 p-10 rounded-[2rem] flex flex-col items-center justify-center gap-4 group hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden h-64 shadow-inner">
                                        <input 
                                            type="file" 
                                            accept="image/png, image/jpeg" 
                                            onChange={handleFileChange} 
                                            className="hidden" 
                                        />
                                        
                                        {logoFile ? (
                                            <div className="text-center">
                                                <div className="w-24 h-24 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-2 border border-blue-500/30">
                                                    <Upload size={32} />
                                                </div>
                                                <p className="text-xs font-bold text-blue-400 mt-2">{logoFile.name}</p>
                                            </div>
                                        ) : config?.logo ? (
                                            <div className="text-center group-hover:opacity-40 transition-all">
                                                <img src={`${config.logo}`} alt="Logo Club" className="w-32 h-32 object-contain mx-auto mb-2 drop-shadow-2xl" />
                                                <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest mt-4">Tocar para cambiar</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-700 group-hover:text-blue-500 transition-all border border-slate-800"><Upload size={32} /></div>
                                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.1em] text-center mt-2">Formatos PNG o JPG</p>
                                            </>
                                        )}
                                        
                                        {config?.logo && !logoFile && (
                                            <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                <p className="text-sm font-black text-white flex items-center gap-3 uppercase tracking-widest"><Upload size={18} /> Cargar Nuevo</p>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Colores Institucionales</label>
                                        

                                        <div className="space-y-4 p-8 bg-slate-950 border border-slate-800 rounded-[2rem] shadow-inner">
                                            <div className="flex flex-col gap-6">
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                                                        <span>Color de Énfasis (Principal)</span>
                                                        <span className="font-mono bg-slate-900 px-2 rounded text-blue-400">{config?.color_primario || '#2563EB'}</span>
                                                    </p>
                                                    <div className="flex flex-wrap gap-2.5">
                                                        {['#2563EB', '#DC2626', '#16A34A', '#EA580C', '#9333EA', '#0F172A', '#D97706', '#DB2777'].map(color => (
                                                            <button 
                                                                key={`pri-${color}`}
                                                                type="button"
                                                                onClick={() => handleColorChange('color_primario', color)}
                                                                className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 active:scale-95 shadow-xl ${config?.color_primario === color ? 'border-white scale-110 shadow-blue-500/20' : 'border-transparent'}`}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-slate-800 bg-slate-950 flex items-center justify-center group/picker" title="Personalizado">
                                                            <Palette size={16} className="text-slate-600 group-hover/picker:text-white transition-colors" />
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

                                                <div className="h-px bg-slate-800" />

                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                                                        <span>Color Secundario</span>
                                                        <span className="font-mono bg-slate-900 px-2 rounded text-blue-400">{config?.color_secundario || '#1E40AF'}</span>
                                                    </p>
                                                    <div className="flex flex-wrap gap-2.5">
                                                        {['#1E40AF', '#991B1B', '#15803D', '#C2410C', '#7E22CE', '#1E293B', '#B45309', '#BE185D'].map(color => (
                                                            <button 
                                                                key={`sec-${color}`}
                                                                type="button"
                                                                onClick={() => handleColorChange('color_secundario', color)}
                                                                className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 active:scale-95 shadow-xl ${config?.color_secundario === color ? 'border-white scale-110 shadow-blue-500/20' : 'border-transparent'}`}
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'institucion' && (
                        <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Datos del Club</h3>
                                <p className="text-slate-400 text-sm">Información legal e institucional para encabezados oficiales y carnets.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-2">Nombre Institucional en Documentos</label>
                                    <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white hover:border-blue-500/50 focus-within:border-blue-500 transition-all shadow-inner">
                                        <Building2 size={24} className="text-slate-600" />
                                        <input type="text" name="nombre_institucional" value={config?.nombre_institucional || ''} onChange={handleChange} className="bg-transparent w-full focus:outline-none font-black text-lg tracking-tight" placeholder="CLUB ATLÉTICO SALESIANOS" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-2">Sitio Web Oficial</label>
                                    <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white hover:border-blue-500/50 focus-within:border-blue-500 transition-all shadow-inner">
                                        <Globe size={24} className="text-slate-600" />
                                        <input type="text" name="web" value={config?.web || ''} onChange={handleChange} className="bg-transparent w-full focus:outline-none text-blue-400" placeholder="www.salesianoshb.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-2">Email de Contacto</label>
                                    <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white focus-within:border-blue-500 transition-all">
                                        <Mail size={24} className="text-slate-600" />
                                        <input type="email" name="email_contacto" value={config?.email_contacto || ''} onChange={handleChange} className="bg-transparent w-full focus:outline-none" placeholder="secretaria@club.com" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-2">Teléfono Institucional</label>
                                    <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white focus-within:border-blue-500 transition-all">
                                        <Phone size={24} className="text-slate-600" />
                                        <input type="text" name="telefono" value={config?.telefono || ''} onChange={handleChange} className="bg-transparent w-full focus:outline-none" placeholder="+54 9 3624..." />
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-2">Sede / Dirección Física</label>
                                    <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white focus-within:border-blue-500 transition-all">
                                        <MapPin size={24} className="text-slate-600" />
                                        <input type="text" name="direccion" value={config?.direccion || ''} onChange={handleChange} className="bg-transparent w-full focus:outline-none" placeholder="Av. Italia 123, Resistencia, Chaco" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'finanzas' && (
                        <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic text-blue-500">Ciclos Financieros</h3>
                                    <p className="text-slate-400 text-sm">Control de vencimientos y motor de elegibilidad deportiva.</p>
                                </div>
                                <div className="bg-blue-600/10 p-3 rounded-2xl border border-blue-500/20">
                                    <ShieldCheck size={24} className="text-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                                {/* FECHA DE CORTE - LA MÁS IMPORTANTE PARA EL USUARIO */}
                                <div className="md:col-span-2 p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><CalendarDays size={80} /></div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="max-w-xl">
                                            <h4 className="text-white font-black text-lg uppercase tracking-tight mb-2">Inicio del Ciclo Contable 2026</h4>
                                            <p className="text-slate-400 text-xs leading-relaxed">
                                                Define la fecha desde la cual el sistema empieza a sumar deudas para el "Semáforo" de Deportes. 
                                                Las deudas anteriores a esta fecha se ignorarán, a menos que se carguen como **Saldo Inicial**.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-slate-950 border-2 border-blue-500/50 rounded-2xl px-6 py-5 text-white shadow-2xl shadow-blue-900/20">
                                            <CalendarDays size={24} className="text-blue-500" />
                                            <input 
                                                type="date" 
                                                name="inicio_ciclo_contable" 
                                                value={config?.inicio_ciclo_contable || ''} 
                                                onChange={handleChange} 
                                                className="bg-transparent w-full focus:outline-none font-black text-xl uppercase tracking-widest text-white [color-scheme:dark]" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Día Vencimiento Mensual</label>
                                    <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white">
                                        <CalendarDays size={24} className="text-slate-600" />
                                        <input type="number" min="1" max="28" name="dia_vencimiento_cuota" value={config?.dia_vencimiento_cuota || 10} onChange={handleChange} className="bg-transparent w-full focus:outline-none font-bold text-center text-xl" />
                                        <span className="text-xs font-bold text-slate-600">DE CADA MES</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Recargo por Mora (%)</label>
                                    <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white">
                                        <PercentCircle size={24} className="text-red-500/50" />
                                        <input type="number" step="0.01" name="porcentaje_mora" value={config?.porcentaje_mora || 0} onChange={handleChange} className="bg-transparent w-full focus:outline-none font-bold text-xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notificaciones' && (
                        <div className="space-y-10 animate-in fade-in duration-500 text-center py-20">
                            <Bell size={64} className="mx-auto text-slate-800 mb-6" />
                            <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest">Módulo de Notificaciones</h3>
                            <p className="text-slate-600 max-w-sm mx-auto italic">Configura recordatorios de deuda automáticos vía WhatsApp y Email (Próximamente).</p>
                        </div>
                    )}

                    {activeTab === 'integraciones' && (
                        <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                            <div>
                                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Módulos Externos</h3>
                                <p className="text-slate-400 text-sm">Conecta tu club con pasarelas de pago y servicios de mensajería (API Keys).</p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-950 p-8 rounded-[2.2rem] border border-slate-800 flex items-center justify-between group hover:border-emerald-600/30 transition-all shadow-xl">
                                    <div className="flex items-center gap-6 text-white">
                                        <div className="w-16 h-16 bg-white rounded-2xl border border-slate-700 flex items-center justify-center p-2 invert group-hover:scale-110 transition-transform">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mercado_Pago_logo.svg/1024px-Mercado_Pago_logo.svg.png" alt="MP Logo" className="w-full grayscale" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black">Mercado Pago</h4>
                                            <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full uppercase tracking-tighter">Estado: Pendiente OAuth</span>
                                        </div>
                                    </div>
                                    <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-all underline underline-offset-4 decoration-emerald-500/50 uppercase tracking-widest">
                                        Vincular Cuenta <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Security Note */}
            <div className="mt-12 mx-4 flex items-center gap-6 text-slate-600 p-10 border border-slate-800 rounded-[2.5rem] bg-slate-900/10 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000"><ShieldCheck size={200} /></div>
                <ShieldCheck size={48} className="text-emerald-900 shrink-0" />
                <div className="text-[10px] space-y-2">
                    <p className="font-black text-slate-500 uppercase tracking-[0.2em] mb-1 items-center flex gap-2"><Lock size={14} className="text-emerald-500" /> Protocolo de Seguridad Admin-Club</p>
                    <p className="max-w-3xl leading-relaxed text-slate-500 font-medium">Esta sección permite alterar reglas críticas de negocio y la identidad visual del club. Todos los cambios realizados se auditan con fecha, hora y usuario conforme a los estándares de seguridad de la plataforma. La carga de deudas históricas mediante saldo inicial no se ve afectada por la fecha de corte contable.</p>
                </div>
            </div>
        </MainLayout>
    );
};

export default ConfigPage;
