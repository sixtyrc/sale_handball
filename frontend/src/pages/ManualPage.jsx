import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { BookOpen, Users, Trophy, Settings, ShieldCheck, CreditCard, ChevronRight, Store, FileText } from 'lucide-react';

const ManualPage = () => {
    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto space-y-12 pb-20">
                
                {/* Header Premium */}
                <div className="relative bg-slate-900 overflow-hidden rounded-3xl border border-slate-800 p-10 md:p-14 shadow-2xl">
                    <div className="absolute top-0 right-0 -m-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -m-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black tracking-widest uppercase text-[10px] rounded-lg flex items-center gap-1.5">
                                <BookOpen size={12} />
                                Documentación Oficial
                            </span>
                            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold tracking-widest uppercase text-[10px] rounded-lg">
                                Versión 1.8
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
                            Manual de Usuario
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl font-light max-w-2xl leading-relaxed">
                            Guía paso a paso para la gestión integral del club. Desde la administración de cuotas hasta las plantillas deportivas y roles dentro del sistema SaaS.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Indice lateral (Sticky) */}
                    <div className="hidden md:block col-span-1">
                        <div className="sticky top-24 space-y-2 border-l-2 border-slate-800 pl-4 py-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-2">Navegación Rápida</p>
                            <a href="#admin" className="block px-3 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">1. Administradores</a>
                            <a href="#profe" className="block px-3 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">2. Cuerpo Técnico</a>
                            <a href="#tesoreria" className="block px-3 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">3. Secretaría & Finanzas</a>
                            <a href="#kiosco" className="block px-3 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">4. Somos Locales</a>
                        </div>
                    </div>

                    {/* Contenido Principal */}
                    <div className="col-span-1 md:col-span-3 space-y-16">
                        
                        {/* Seccion 1: Admin */}
                        <section id="admin" className="scroll-mt-24">
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-800">
                                <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                    <Settings size={28} />
                                </div>
                                <h2 className="text-2xl font-black text-white">1. Rol: Administrador Directivo</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                                        <ChevronRight size={18} className="text-orange-500" />
                                        Configuración Inicial del Club
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                        El administrador tiene el control total sobre la estética y los parámetros globales del club. Dirígete a <strong>Configuración</strong> en el menú lateral.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm pl-2">
                                        <li><strong className="text-white">Branding:</strong> Sube el Escudo del Club en PNG transparente (Automáticamente refleja la estética visual).</li>
                                        <li><strong className="text-white">Parámetros Financieros:</strong> Establece el valor de la Cuota Base Mensual y configura los intereses de mora.</li>
                                        <li><strong className="text-white">Categorías Deportivas:</strong> Crea las categorías habilitadas para el año (ej. Infantiles, Juveniles).</li>
                                    </ul>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                                        <ChevronRight size={18} className="text-orange-500" />
                                        Gestión de Usuarios (Staff)
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-3">
                                        Desde el apartado <strong>Staff Técnico</strong> crearás los accesos para profesores, miembros de mesa y cajeros. Es fundamental asignar el <strong className="text-orange-400 bg-orange-500/10 px-1 py-0.5 rounded">ROL</strong> adecuado para restringir accesos.
                                    </p>
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-400 font-mono">
                                        Tip: Un profesor NO puede ver tesorería ni caja central.
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Seccion 2: Profesor */}
                        <section id="profe" className="scroll-mt-24">
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-800">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    <Trophy size={28} />
                                </div>
                                <h2 className="text-2xl font-black text-white">2. Rol: Cuerpo Técnico (Profes)</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                                        <ChevronRight size={18} className="text-blue-500" />
                                        Gestión de Planteles y Jugadores
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                        Al ingresar al módulo de <strong>Categorías</strong>, verás exclusivamente los equipos que tienes asignados.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm pl-2">
                                        <li>Haciendo clic en la categoría, verás todos los jugadores habilitados (Ficha Deportiva).</li>
                                        <li>Los jugadores bloqueados (por apto médico vencido o deudas graves) tendrán un contorno rojo y alertas claras (Soft Warnings).</li>
                                        <li>Puedes cargar documentos digitalizados (Apto Médico en PDF) desde la ficha de cualquier jugador para habilitarlo inmediatamente.</li>
                                    </ul>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                                        <ChevronRight size={18} className="text-blue-500" />
                                        Partidos y Estadísticas (En Vivo)
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-4">
                                        Desde el apartado <strong>Partidos</strong>, organizas eventos, convocas jugadores (incluso refuerzos de categorías mayores) y manejas la Planilla Técnica.
                                    </p>
                                    <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-500/20">
                                        <p className="text-xs text-blue-400 font-bold mb-2">FLUJO DE PARTIDO OFICIAL:</p>
                                        <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1.5 ml-1">
                                            <li>Crear evento (Partido).</li>
                                            <li>Realizar Convocatoria de Jugadores.</li>
                                            <li>El día del partido: Abrir <strong>Planilla Técnica</strong>.</li>
                                            <li>Anotar en vivo Goles, Sanciones de 2 MIN, Tarjetas.</li>
                                            <li>Finalizar y <strong className="text-white">CERRAR PLANILLA</strong> (las estadísticas irán directo a la ficha del jugador).</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Seccion 3: Secretaria */}
                        <section id="tesoreria" className="scroll-mt-24">
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-800">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <CreditCard size={28} />
                                </div>
                                <h2 className="text-2xl font-black text-white">3. Rol: Secretaría y Tesorería</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <ShieldCheck size={100} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3 relative z-10">
                                        <ChevronRight size={18} className="text-emerald-500" />
                                        La Regla de Oro Financiera
                                    </h3>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4 relative z-10">
                                        El sistema financiero maneja una <strong className="text-white">Cuenta Corriente Atómica</strong> por Socio. Ningún movimiento se puede eliminar, si te equivocas en un ingreso, deberás crear un movimiento "Cancelatorio" o re-ajuste. Esto garantiza auditoría directa.
                                    </p>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                                        <ChevronRight size={18} className="text-emerald-500" />
                                        Cobro de Cuotas y Generación Activa
                                    </h3>
                                    <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm pl-2">
                                        <li>Dirígete a <strong>Finanzas</strong>. Con 1 clic puedes correr la generación de cuotas mensuales de todos los socios activos.</li>
                                        <li>Al cobrar a un socio (sea por Tranferencia o Efectivo), el sistema cancelará la deuda más vieja primero.</li>
                                        <li>Todos los cobros generan automáticamente un Ticket Recibo PDF Membretado oficial del club descargable.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>
                        
                        {/* Seccion 4: Kiosco */}
                        <section id="kiosco" className="scroll-mt-24">
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-800">
                                <div className="p-3 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
                                    <Store size={28} />
                                </div>
                                <h2 className="text-2xl font-black text-white">4. Módulo: Somos Local (Cantina / Entradas)</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                        Módulo de alta concurrencia ideado para ser manejado por padres o voluntarios a través del celular durante las jornadas del fin de semana de partidos de local (sin darles acceso al sistema central).
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="border border-slate-800 rounded-xl p-4 bg-slate-950">
                                            <h4 className="text-pink-400 font-bold mb-2 text-sm">Paso 1: Apertura</h4>
                                            <p className="text-xs text-slate-400">El Admin va a "Somos Local", crea la Jornada y le genera el <strong>PIN DE ACCESO</strong> temporal del día.</p>
                                        </div>
                                        <div className="border border-slate-800 rounded-xl p-4 bg-slate-950">
                                            <h4 className="text-pink-400 font-bold mb-2 text-sm">Paso 2: Compartir a Voluntarios</h4>
                                            <p className="text-xs text-slate-400">Pasa la URL pública y el PIN a los voluntarios. Estos ingresan desde sus celulares indicando DNI para control presencial.</p>
                                        </div>
                                        <div className="border border-slate-800 rounded-xl p-4 bg-slate-950">
                                            <h4 className="text-pink-400 font-bold mb-2 text-sm">Paso 3: Operación POS</h4>
                                            <p className="text-xs text-slate-400">El sistema se vuelve una calculadora táctil ultra-rápida. Marcan ENTRADA o BUFFET. El Admin ve los montos en tiempo real en la oficina.</p>
                                        </div>
                                        <div className="border border-slate-800 rounded-xl p-4 bg-slate-950">
                                            <h4 className="text-pink-400 font-bold mb-2 text-sm">Paso 4: Arqueo</h4>
                                            <p className="text-xs text-slate-400">Al terminar el día, desde administración se añaden los gastos de tickets (ej: hilo, pan, viáticos) y el sistema consolida la ganancia neta.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ManualPage;
