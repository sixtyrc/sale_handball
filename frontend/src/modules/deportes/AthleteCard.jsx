import React, { useState } from 'react';
import { 
    AlertCircle, 
    ShieldCheck, 
    Heart, 
    Banknote, 
    HelpCircle, 
    ChevronRight,
    Ruler,
    MoveUp,
    Upload
} from 'lucide-react';
import CargarDocumentoModal from './CargarDocumentoModal';
import CargarSeguroModal from './CargarSeguroModal';

const AthleteCard = ({ athlete }) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSeguroModalOpen, setIsSeguroModalOpen] = useState(false);
    const { eligibility, socio_detalle, categoria_nombre, nro_camiseta } = athlete;
    const { habilitado, warnings } = eligibility;

    const getWarningIcon = (tipo) => {
        switch (tipo) {
            case 'MOROSIDAD': return <Banknote size={16} className="text-red-400" />;
            case 'MEDICO': return <Heart size={16} className="text-red-500 fill-red-500/20" />;
            case 'ADMINISTRATIVO': return <ShieldCheck size={16} className="text-orange-400" />;
            default: return <HelpCircle size={16} className="text-slate-500" />;
        }
    };

    const hasMedicalWarning = warnings.some(w => w.tipo === 'MEDICO');
    const hasSeguroWarning = warnings.some(w => w.tipo === 'ADMINISTRATIVO' && w.mensaje.includes('Seguro'));

    return (
        <div className={`group bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl overflow-hidden ${
            habilitado 
            ? 'border-emerald-500/10 hover:border-emerald-500/30' 
            : 'border-red-500/10 hover:border-red-500/40'
        }`}>
            {/* Glossy Header Effect */}
            <div className={`h-1.5 w-full ${habilitado ? 'bg-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`} />
            
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-5">
                        {/* Avatar */}
                        <div className="relative">
                            <div className={`w-16 h-16 rounded-[1.5rem] bg-slate-800 flex items-center justify-center text-2xl font-black text-white/20 border-2 transition-transform duration-500 group-hover:scale-105 ${
                                !habilitado ? 'border-red-500/50 shadow-lg shadow-red-500/20' : 'border-slate-700'
                            }`}>
                                {socio_detalle.apellidos[0]}
                            </div>
                            {!habilitado && (
                                <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 border-2 border-slate-900 shadow-xl">
                                    <AlertCircle size={14} strokeWidth={3} />
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="font-extrabold text-white text-lg tracking-tight">
                                {socio_detalle.apellidos}, <span className="text-slate-400">{socio_detalle.nombres}</span>
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="px-2.5 py-1 bg-blue-600/10 text-blue-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-blue-500/20">
                                    {categoria_nombre}
                                </span>
                                {socio_detalle.nro_socio && (
                                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                                        ID {socio_detalle.nro_socio}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sports Stats Bar */}
                <div className="grid grid-cols-3 gap-2 mt-6">
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800 flex flex-col items-center justify-center group-hover:border-slate-700 transition-colors">
                        <Ruler size={14} className="text-slate-600 mb-1" />
                        <span className="text-xs font-black text-white">{socio_detalle.altura || '--'}</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">METROS</span>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800 flex flex-col items-center justify-center group-hover:border-slate-700 transition-colors">
                        <MoveUp size={14} className={`mb-1 ${socio_detalle.mano_habil === 'IZQ' ? '-rotate-90 text-blue-400' : 'rotate-90 text-emerald-400'}`} />
                        <span className="text-xs font-black text-white">{socio_detalle.mano_habil === 'IZQ' ? 'ZURDO' : 'DIESTRO'}</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">LATERAL</span>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800 flex flex-col items-center justify-center group-hover:border-slate-700 transition-colors">
                        <ShieldCheck size={14} className="text-slate-600 mb-1" />
                        <span className="text-xs font-black text-white truncate w-full text-center">{socio_detalle.posicion_habitual || 'GRAL'}</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">POSICIÓN</span>
                    </div>
                </div>

                {/* Warnings / Action Area */}
                <div className="mt-6 space-y-3">
                    {warnings.map((w, i) => (
                        <div key={i} className="flex items-center justify-between group/warn p-2 border-l-2 border-red-500/30 bg-red-500/5 rounded-r-xl">
                            <div className="flex items-center gap-3">
                                {getWarningIcon(w.tipo)}
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">{w.mensaje}</span>
                            </div>
                        </div>
                    ))}
                    
                    {habilitado && (
                        <div className="flex items-center justify-between p-2 border-l-2 border-emerald-500/30 bg-emerald-500/5 rounded-r-xl">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={16} className="text-emerald-500" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Jugador Habilitado</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons / Status */}
                <div className="flex flex-col gap-2 mt-6">
                    {hasMedicalWarning ? (
                        <button 
                            onClick={() => setIsUploadModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 active:scale-95"
                        >
                            <Upload size={14} />
                            Cargar Apto Médico
                        </button>
                    ) : (
                        <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 font-black text-[10px] uppercase tracking-widest text-emerald-400">
                            <Heart size={14} className="fill-emerald-500/20" />
                            Apto Médico Vigente
                        </div>
                    )}

                    {hasSeguroWarning ? (
                        <button 
                            onClick={() => setIsSeguroModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20 active:scale-95"
                        >
                            <Banknote size={14} />
                            Pagar Seguro Deportivo
                        </button>
                    ) : (
                        <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 font-black text-[10px] uppercase tracking-widest text-emerald-400">
                            <ShieldCheck size={14} />
                            Seguro Pagado / Vigente
                        </div>
                    )}
                </div>
            </div>

            <CargarDocumentoModal 
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                socioId={socio_detalle.id}
                onSuccess={() => window.location.reload()}
            />

            <CargarSeguroModal 
                isOpen={isSeguroModalOpen}
                onClose={() => setIsSeguroModalOpen(false)}
                socioId={socio_detalle.id}
                onSuccess={() => window.location.reload()}
            />
        </div>
    );
};

export default AthleteCard;
