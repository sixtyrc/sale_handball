import React from 'react';
import { AlertCircle, ShieldCheck, Heart, Banknote, HelpCircle } from 'lucide-react';

const AthleteCard = ({ athlete }) => {
    const { eligibility, socio_detalle, categoria_nombre, nro_camiseta } = athlete;
    const { habilitado, warnings } = eligibility;

    const getWarningIcon = (tipo) => {
        switch (tipo) {
            case 'MOROSIDAD': return <Banknote size={14} className="text-red-500" />;
            case 'MEDICO': return <Heart size={14} className="text-red-500" />;
            case 'ADMINISTRATIVO': return <ShieldCheck size={14} className="text-orange-500" />;
            default: return <HelpCircle size={14} className="text-slate-400" />;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 relative overflow-hidden transition-all hover:shadow-xl active:scale-[0.98]">
            {/* Status Bar */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${habilitado ? 'bg-emerald-500' : 'bg-red-500'}`} />
            
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    {/* Avatar con Alerta Visual */}
                    <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-400 border-2 ${!habilitado ? 'border-red-400 animate-pulse' : 'border-transparent'}`}>
                            {socio_detalle.apellidos[0]}
                        </div>
                        {!habilitado && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-lg">
                                <AlertCircle size={12} />
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">
                            {socio_detalle.apellidos}, {socio_detalle.nombres}
                        </h3>
                        <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded uppercase tracking-widest">
                                {categoria_nombre}
                            </span>
                            {nro_camiseta && (
                                <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                    #{nro_camiseta}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Badges de Warnings */}
                <div className="flex flex-col space-y-1">
                    {warnings.map((w, i) => (
                        <div 
                            key={i} 
                            title={w.mensaje}
                            className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                                w.severidad === 'CRITICAL' 
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600' 
                                : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'
                            }`}
                        >
                            {getWarningIcon(w.tipo)}
                            <span className="truncate max-w-[60px]">{w.tipo}</span>
                        </div>
                    ))}
                    {warnings.length === 0 && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 p-2 rounded-xl flex items-center justify-center">
                            <ShieldCheck size={16} />
                        </div>
                    )}
                </div>
            </div>

            {/* Expired / Due Warnings Detail (Mini) */}
            {warnings.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                    <p className="text-[10px] text-slate-500 font-medium italic truncate">
                        {warnings[0].mensaje}
                        {warnings.length > 1 && ` (+${warnings.length - 1} más)`}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AthleteCard;
