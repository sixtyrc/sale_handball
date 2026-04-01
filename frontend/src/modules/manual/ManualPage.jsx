import React, { useState } from 'react';
import { 
    BookOpen, Users, Banknote, Trophy, Store, ShieldCheck, 
    Smartphone, Download, ChevronRight, Menu, X, Info 
} from 'lucide-react';

const ManualPage = () => {
    const [selectedSection, setSelectedSection] = useState('intro');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const sections = [
        { id: 'intro', title: 'Bienvenidos', icon: <Info size={18} /> },
        { id: 'socios', title: 'Gestión de Socios', icon: <Users size={18} /> },
        { id: 'finanzas', title: 'Finanzas y Pagos', icon: <Banknote size={18} /> },
        { id: 'deportivo', title: 'Módulo Deportivo', icon: <Trophy size={18} /> },
        { id: 'locales', title: 'Somos Locales (Buffet)', icon: <Store size={18} /> },
        { id: 'pwa', title: 'PWA e Instalación', icon: <Smartphone size={18} /> },
        { id: 'seguridad', title: 'Seguridad y Auditoría', icon: <ShieldCheck size={18} /> },
    ];

    const renderContent = () => {
        switch (selectedSection) {
            case 'intro':
                return (
                    <div className="space-y-6 animate-fade-in relative">
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/20">
                            <h1 className="text-3xl font-black uppercase mb-4 tracking-tighter">Handball SaaS</h1>
                            <p className="text-blue-100 font-medium leading-relaxed">
                                Bienvenido a la plataforma definitiva para la gestión de clubes de handball. 
                                Diseñada para ser 101% mobile-first, nuestra herramienta integra la administración 
                                financiera con la realidad del campo de juego.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm mb-3">Visión Administrativa</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Control total de cuotas, morosidad y auditoría desde cualquier lugar.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm mb-3">Presencia en el Campo</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Agilidad para profesores en la toma de asistencia y para padres en la cantina.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'socios':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center space-x-3">
                            <Users className="text-blue-600" /> <span>Gestión de Socios</span>
                        </h2>
                        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 text-sm space-y-4">
                            <p>El núcleo del sistema es el Socio. Cada registro vincula la información personal con su cuenta corriente y su perfil deportivo.</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Documentación Digital:</strong> No más carpetas de papel. Sube DNI, Apto Médico y Seguros directamente al perfil.</li>
                                <li><strong>Carnet Digital:</strong> El socio tiene un carnet con código QR y foto (en construcción) para validación rápida en eventos.</li>
                                <li><strong>Validación Administrativa:</strong> Los administradores deben revisar y aprobar los aptos médicos para habilitar el juego.</li>
                            </ul>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/50">
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Tip CTSoft:</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-500">Mantener los aptos médicos al día genera alertas automáticas para los profesores.</p>
                        </div>
                    </div>
                );
            case 'finanzas':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center space-x-3">
                            <Banknote className="text-emerald-600" /> <span>Finanzas y Pagos</span>
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                                <h3 className="font-black text-sm uppercase">Cuentas Corrientes</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Todo socio tiene una CC histórica. No se permite borrar movimientos, solo anular. Esto garantiza transparencia total ante la comisión directiva.</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                                <h3 className="font-black text-sm uppercase">Cajeros y Tesorería</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Los cobros registran el cajero que los recibió y generan un recibo numerado con validación multi-tenant única por club.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'deportivo':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center space-x-3">
                            <Trophy className="text-orange-500" /> <span>Módulo Deportivo</span>
                        </h2>
                        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-3xl space-y-4">
                            <div className="flex items-start space-x-4">
                                <div className="h-8 w-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">1</div>
                                <div>
                                    <p className="text-sm font-bold dark:text-white">Convocatorias</p>
                                    <p className="text-xs text-slate-500">Convoca a tus jugadores y sugiere refuerzos de categorías inferiores automáticamente.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="h-8 w-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">2</div>
                                <div>
                                    <p className="text-sm font-bold dark:text-white">Soft Warnings</p>
                                    <p className="text-xs text-slate-500">El sistema te avisa si un jugador debe cuotas o tiene el apto médico vencido antes de que juegue.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'locales':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center space-x-3">
                            <Store className="text-indigo-600" /> <span>Somos Locales (Buffet)</span>
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Logística autónoma para los días de partido en casa.</p>
                        <ul className="space-y-3">
                            <li className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <ChevronRight size={14} className="text-blue-500" />
                                <span className="text-xs font-bold uppercase tracking-tight">Acceso por PIN para padres voluntarios</span>
                            </li>
                            <li className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <ChevronRight size={14} className="text-blue-500" />
                                <span className="text-xs font-bold uppercase tracking-tight">Venta rápida en Cantina (Mobile POS)</span>
                            </li>
                            <li className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <ChevronRight size={14} className="text-blue-500" />
                                <span className="text-xs font-bold uppercase tracking-tight">Cierre de caja con balance Efectivo vs Digital</span>
                            </li>
                        </ul>
                    </div>
                );
            case 'pwa':
                return (
                    <div className="space-y-6 animate-fade-in relative bg-blue-600/5 dark:bg-blue-900/10 p-8 rounded-[40px] border border-blue-500/10">
                        <h2 className="text-2xl font-black text-blue-600 uppercase tracking-tight flex items-center space-x-3">
                            <Smartphone /> <span>App Instalable (PWA)</span>
                        </h2>
                        <p className="text-sm text-slate-700 dark:text-slate-300">Convertir la web en una aplicación nativa es sencillo:</p>
                        <ol className="list-decimal pl-5 text-xs space-y-4 font-medium text-slate-600 dark:text-slate-400">
                            <li><strong>En Android/Chrome:</strong> Haz clic en el banner "Instalar App" o ve al menú del navegador y selecciona "Instalar Aplicación".</li>
                            <li><strong>En iOS (Safari):</strong> Pulsa el botón "Compartir" (el cuadrado con la flecha) y elige "Añadir a pantalla de inicio".</li>
                        </ol>
                        <div className="mt-6 flex items-center space-x-3 bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-600/20">
                            <Download size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Soporte Offline Activado</span>
                        </div>
                    </div>
                );
            case 'seguridad':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center space-x-3">
                            <ShieldCheck className="text-slate-500" /> <span>Seguridad y Auditoría</span>
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Trazabilidad absoluta de cada acción realizada en la plataforma.</p>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400 mb-1">Módulo de Auditoría (Fase 6)</p>
                                <p className="text-xs font-medium dark:text-white">Cada movimiento financiero queda grabado con IP, Fecha y Responsable.</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans transition-colors duration-300">
            {/* Sidebar Desktop / Mobile Header */}
            <div className="w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 z-40 sticky top-0 md:h-screen">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg">
                            <BookOpen size={20} />
                        </div>
                        <h2 className="text-lg font-black uppercase tracking-tighter dark:text-white">Centro de Ayuda</h2>
                    </div>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 dark:text-white">
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block space-y-2`}>
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => { setSelectedSection(section.id); setMobileMenuOpen(false); }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group ${
                                selectedSection === section.id 
                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                {section.icon}
                                <span className={`text-xs font-bold uppercase tracking-tight ${selectedSection === section.id ? 'opacity-100' : 'opacity-80'}`}>
                                    {section.title}
                                </span>
                            </div>
                            <ChevronRight size={14} className={`${selectedSection === section.id ? 'opacity-100 translate-x-1' : 'opacity-0'}`} />
                        </button>
                    ))}
                </nav>
                
                {/* Branding Sidebar Footer */}
                <div className="hidden md:block absolute bottom-8 left-0 right-0 px-8 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Handball v1.2 <span className="mx-2">|</span> 
                        <a href="https://ctsoft.com.ar" className="text-blue-500 hover:underline">CTSoft</a>
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-grow p-8 md:p-12 lg:p-20 overflow-y-auto max-w-5xl mx-auto w-full">
                {renderContent()}
                
                {/* Global Footer (Internal Manuel) */}
                <footer className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-800" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fin del Manual</p>
                        <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                        Si necesita soporte técnico avanzado, contacte a <a href="mailto:soporte@ctsoft.com.ar" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">soporte@ctsoft.com.ar</a>
                    </p>
                    <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 mt-4">
                        © 2026 CTSoft - Software con Valor Agregado
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default ManualPage;
