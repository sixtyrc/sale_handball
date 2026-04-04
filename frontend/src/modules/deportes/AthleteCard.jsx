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
    Upload,
    Info,
    CalendarCheck2
} from 'lucide-react';
import CargarDocumentoModal from './CargarDocumentoModal';
import CargarSeguroModal from './CargarSeguroModal';

const AthleteCard = ({ athlete }) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSeguroModalOpen, setIsSeguroModalOpen] = useState(false);
    const { eligibility, socio_detalle, categoria_nombre, stats_acumuladas } = athlete;
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
    const hasSeguroWarning = warnings.some(w => w.tipo === 'ADMINISTRATIVO');
    const financialWarning = warnings.find(w => w.tipo === 'MOROSIDAD');

    const renderStats = () => {
        if (!stats_acumuladas) return null;
        return (
            <div className="grid grid-cols-4 gap-2 mt-6">
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-3 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">P.J.</span>
                    <span className="text-xl font-black text-white">{stats_acumuladas.partidos_jugados || 0}</span>
                </div>
                <div className="bg-blue-900/10 rounded-xl border border-blue-500/20 p-3 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Goles</span>
                    <span className="text-xl font-black text-blue-400">{stats_acumuladas.goles_totales || 0}</span>
                </div>
                <div className="bg-amber-900/10 rounded-xl border border-amber-500/20 p-3 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">2 Min</span>
                    <span className="text-xl font-black text-amber-400">{stats_acumuladas.suspensiones_2min || 0}</span>
                </div>
                <div className="bg-red-900/10 rounded-xl border border-red-500/20 p-3 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Rojas</span>
                    <span className="text-xl font-black text-red-400">{stats_acumuladas.tarjetas_rojas || 0}</span>
                </div>
            </div>
        );
    };

    return (
        <div className={`group bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl overflow-hidden ${
            habilitado 
            ? 'border-emerald-500/10 hover:border-emerald-500/30' 
            : 'border-red-500/10 hover:border-red-500/40 shadow-red-900/5'
        }`}>
            {/* Header Status Bar */}
            <div className={`h-2 w-full ${habilitado ? 'bg-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`} />
            
            <div className="p-7">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-5">
                        {/* Avatar */}
                        <div className="relative">
                            <div className={`w-20 h-20 rounded-[1.8rem] bg-slate-800 flex items-center justify-center text-3xl font-black text-white/10 border-2 transition-transform duration-500 group-hover:scale-105 ${
                                !habilitado ? 'border-red-500/50 shadow-lg shadow-red-500/20' : 'border-slate-700'
                            }`}>
                                {socio_detalle.apellidos[0]}
                            </div>
                            {!habilitado && (
                                <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1.5 border-4 border-slate-900 shadow-xl animate-pulse">
                                    <AlertCircle size={16} strokeWidth={3} />
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="font-exrabold text-white text-xl tracking-tight leading-tight">
                                {socio_detalle.apellidos}, <span className="text-slate-400 font-light">{socio_detalle.nombres}</span>
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest border ${
                                    habilitado ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' : 'bg-red-600/10 text-red-400 border-red-500/20'
                                }`}>
                                    {habilitado ? 'Habilitado' : 'Bloqueado'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 px-2 border-l border-slate-800">
                                    ID {socio_detalle.nro_socio || 'S/N'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Pills */}
                <div className="flex flex-wrap gap-2 mt-6">
                    <div className="px-3 py-1.5 bg-slate-950/50 rounded-xl border border-slate-800 text-[10px] font-bold text-slate-400 flex items-center gap-2">
                        <Info size={12} className="text-blue-500" />
                        {categoria_nombre}
                    </div>
                </div>

                {/* Performance Stats */}
                {renderStats()}

                {/* Dynamic Warnings Section */}
                <div className="mt-8 space-y-4">
                    {warnings.length > 0 ? warnings.map((w, i) => (
                        <div key={i} className={`p-4 rounded-2xl border-l-4 bg-slate-950/40 relative group/msg transition-all ${
                            w.severidad === 'CRITICAL' ? 'border-red-500' : 'border-orange-400'
                        }`}>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">{getWarningIcon(w.tipo)}</div>
                                <div className="space-y-1">
                                    <p className={`text-xs font-black uppercase tracking-tight ${
                                        w.severidad === 'CRITICAL' ? 'text-red-400' : 'text-orange-400'
                                    }`}>
                                        {w.mensaje}
                                    </p>
                                    {w.detalles && (
                                        <p className="text-[10px] font-medium text-slate-500 italic">
                                            {w.detalles}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-4 rounded-2xl border-l-4 border-emerald-500 bg-emerald-500/5 flex items-center gap-3">
                            <ShieldCheck size={20} className="text-emerald-500" />
                            <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Documentación al Día</span>
                        </div>
                    )}
                </div>

                {/* Actions / Buttons */}
                <div className="grid grid-cols-1 gap-3 mt-8">
                    {!hasMedicalWarning ? (
                        <div className="flex items-center justify-center gap-3 py-3 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                            <Heart size={16} className="fill-emerald-500/20" />
                            Apto Médico OK
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsUploadModalOpen(true)}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 active:scale-95 group-hover:scale-[1.02]"
                        >
                            <Upload size={16} className="animate-bounce" />
                            Cargar Apto Médico
                        </button>
                    )}

                    {!hasSeguroWarning ? (
                        <div className="flex items-center justify-center gap-3 py-3 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                            <CalendarCheck2 size={16} />
                            Seguro Vigente
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsSeguroModalOpen(true)}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20 active:scale-95"
                        >
                            <Banknote size={16} />
                            Pagar Seguro Deportivo
                        </button>
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
