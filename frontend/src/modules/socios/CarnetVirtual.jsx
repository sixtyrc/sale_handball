import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Clock, User, Award, CheckCircle2, AlertCircle } from 'lucide-react';

const CarnetVirtual = ({ socio, club }) => {
    // El QR ahora apunta al endpoint de validación REAL del backend
    // Usamos el ID del socio para que el scanner abra la ficha de validación pública
    const validationUrl = `${window.location.origin.replace('3051', '8000')}/api/v1/validar-carnet/${socio.id}/`;

    const calculateAge = (birthDate) => {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const getCategory = (age) => {
        if (age <= 10) return 'MINI';
        if (age <= 12) return 'INFANTILES';
        if (age <= 14) return 'MENORES';
        if (age <= 16) return 'CADETES';
        if (age <= 18) return 'JUVENILES';
        return 'MAYORES';
    };

    const age = calculateAge(socio.fecha_nacimiento);
    const categoryName = socio.es_profesor ? 'PERSONAL AUTORIZADO' : getCategory(age);

    const isVencido = !socio.es_profesor && (socio.vencimiento_carnet.includes('VENCIDO') || socio.vencimiento_carnet.includes('RENOVAR'));
    const isVitalicio = !socio.es_profesor && socio.vencimiento_carnet.includes('VITALICIO');
    const isStaff = socio.es_profesor;

    return (
        <div className="flex justify-center items-center py-6 sm:py-10 scale-100 sm:scale-110 print:scale-100 print:py-0">
            {/* Contenedor Principal Horizontal - Aspect Ratio Tarjeta */}
            <div className="w-[340px] h-[210px] sm:w-[500px] sm:h-[300px] bg-slate-950 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative group flex print:shadow-none print:border-slate-200 print:bg-white print:text-slate-950" 
                 style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                
                {/* Lado Izquierdo: Foto y Nivel */}
                <div className="w-[120px] sm:w-[180px] h-full bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 border-r border-white/5 relative overflow-hidden print:bg-slate-100 print:border-r-slate-200">
                    {/* Efecto de luz de fondo - Oculto en impresión */}
                    <div className="absolute top-0 left-0 w-full h-full bg-blue-600/5 blur-3xl rounded-full print:hidden" />
                    
                    <div className="relative z-10">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl bg-slate-800 border-2 border-blue-500/30 overflow-hidden shadow-2xl relative print:border-slate-300">
                            {socio.foto ? (
                                <img src={socio.foto} className="w-full h-full object-cover" alt="Socio" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900 print:bg-slate-200 print:text-slate-400">
                                    <User size={48} sm:size={64} strokeWidth={1} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent print:hidden" />
                        </div>
                        
                        {/* Nro de Socio Flotante */}
                        <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-full shadow-lg border border-blue-400/50 uppercase tracking-wider print:bg-slate-800 print:border-none">
                            #{socio.nro_socio || socio.dni.toString().slice(-5)}
                        </div>
                    </div>

                    <div className="mt-4 sm:mt-6 text-center space-y-2">
                        <div>
                            <p className="text-[7px] sm:text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5 print:text-slate-400">Estado</p>
                            <p className={`${isStaff ? 'text-amber-500' : 'text-white'} font-bold text-[9px] sm:text-[11px] uppercase italic tracking-widest print:text-slate-800`}>
                                {isStaff ? 'Staff Oficial' : (isVitalicio ? 'Socio Vitalicio' : 'Socio Activo')}
                            </p>
                        </div>
                        <div className="pt-2 border-t border-white/5 print:border-slate-200">
                            <p className="text-[7px] sm:text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5 print:text-slate-400">
                                {isStaff ? 'Rol' : 'Categoría'}
                            </p>
                            <p className={`${isStaff ? 'text-amber-500' : 'text-blue-500'} font-extrabold text-[10px] sm:text-xs uppercase tracking-tight print:text-blue-700`}>
                                {isStaff ? 'PROFESOR / DT' : categoryName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Información Core */}
                <div className="flex-1 h-full bg-slate-950 p-4 sm:p-6 flex flex-col relative print:bg-white">
                    {/* Header: Logo y Nombre del Club */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                        {club?.logo ? (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-white/10 shrink-0 shadow-inner print:bg-white print:border-slate-200">
                                <img src={club.logo} className="w-full h-full object-contain" alt="Logo" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600/10 rounded-lg sm:rounded-xl flex items-center justify-center border border-blue-500/20 shrink-0 print:border-slate-200">
                                <Shield className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h2 className="text-white font-black uppercase text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] truncate drop-shadow-sm print:text-slate-950 print:drop-none">
                                {club?.nombre_institucional || club?.club_nombre || 'CLUB SALESIANOS'}
                            </h2>
                            <p className="text-[7px] sm:text-[8px] text-slate-500 font-extrabold uppercase tracking-widest print:text-slate-400">
                                Carnet de Identidad Digital
                            </p>
                        </div>
                    </div>

                    {/* Datos Personales */}
                    <div className="flex-1">
                        <div className="space-y-0">
                            <h3 className="text-white font-black text-xl sm:text-2xl uppercase tracking-tighter leading-none print:text-slate-950">
                                {socio.apellidos}
                            </h3>
                            <p className={`${isStaff ? 'text-amber-500' : 'text-blue-400'} font-black uppercase text-xs sm:text-sm tracking-wider print:text-blue-700`}>
                                {socio.nombres}
                            </p>
                        </div>

                        <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <p className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-0.5 print:text-slate-400">Documento</p>
                                <p className="text-white font-bold text-[12px] sm:text-sm tracking-widest tabular-nums font-mono print:text-slate-950">{socio.dni}</p>
                            </div>
                            <div>
                                <p className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-0.5 print:text-slate-400">Factor Sang.</p>
                                <p className="text-white font-bold text-[12px] sm:text-sm uppercase print:text-slate-950">{socio.grupo_sanguineo || '—'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer: Validez y QR */}
                    <div className="flex items-end justify-between mt-2 sm:mt-4">
                        <div className="mb-1">
                            <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border transition-all ${
                                isStaff 
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 print:border-amber-500 print:text-amber-700'
                                : isVencido 
                                ? 'bg-red-500/10 border-red-500/20 text-red-500 print:border-red-500 print:text-red-700' 
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 print:border-emerald-500 print:text-emerald-700'
                            }`}>
                                {(isVencido && !isStaff) ? <AlertCircle size={8} sm:size={10} /> : <CheckCircle2 size={8} sm:size={10} />}
                                <div className="text-left leading-none">
                                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-tight">
                                        {isStaff ? 'VIGENCIA ILIMITADA' : socio.vencimiento_carnet}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* QR sutil en la esquina */}
                        <div className="relative p-1 bg-white rounded-lg shadow-2xl transform hover:scale-150 transition-all origin-bottom-right duration-300 print:shadow-none print:border print:border-slate-200">
                            <QRCodeSVG 
                                value={validationUrl} 
                                size={44}
                                sm:size={54}
                                level="M"
                                includeMargin={false}
                                bgColor="#FFFFFF"
                                fgColor="#0F172A"
                            />
                        </div>
                    </div>
                </div>

                {/* Elementos Estéticos: Línea de acento inferior */}
                <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r print:hidden ${
                    isStaff ? 'from-amber-400 via-amber-500 to-yellow-600' :
                    isVencido ? 'from-red-500 via-rose-500 to-orange-500' : 'from-blue-600 via-indigo-500 to-emerald-500'
                }`} />

                {/* Marca de agua / Brillo glassmorphism - Oculto en impresión */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 skew-x-[-30deg] translate-x-16 -translate-y-16 pointer-events-none print:hidden uppercase font-black text-black/5 text-[50px] flex items-center justify-center overflow-hidden">
                    CLUB
                </div>
            </div>
        </div>
    );
};

export default CarnetVirtual;
