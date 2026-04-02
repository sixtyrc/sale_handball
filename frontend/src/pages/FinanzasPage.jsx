import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import { 
    CreditCard, 
    TrendingDown, 
    TrendingUp, 
    Filter, 
    Download,
    Eye,
    Receipt,
    AlertCircle,
    Loader2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import CobroModal from '../modules/finanzas/CobroModal';
import GeneradorCuotasModal from '../modules/finanzas/GeneradorCuotasModal';
import MovimientosModal from '../modules/finanzas/MovimientosModal';

const FinanzasPage = () => {
    const [cuentas, setCuentas] = useState([]);
    const [sociosRaw, setSociosRaw] = useState([]);

    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ totalDeuda: 0, totalFavor: 0, balanceNeto: 0 });
    const [isCobroModalOpen, setIsCobroModalOpen] = useState(false);
    const [isCuotasModalOpen, setIsCuotasModalOpen] = useState(false);
    const [isMovimientosModalOpen, setIsMovimientosModalOpen] = useState(false);
    const [selectedCuenta, setSelectedCuenta] = useState(null);
    const [initialCobroSocioId, setInitialCobroSocioId] = useState(null);

    useEffect(() => {
        fetchCuentas();
    }, []);

    const fetchCuentas = async () => {
        try {
            // 1. Obtenemos la lista simple de socios para los modales (dropdowns)
            const { data: socios } = await api.get('socios/');
            setSociosRaw(socios);
            
            // 2. Usamos el nuevo endpoint optimizado para traer las cuentas con saldos pre-calculados (1 Sola Request)
            const resCuentas = await api.get('finanzas/cuentas/');
            const cuentasData = resCuentas.data;

            setCuentas(cuentasData);
            
            // 3. Calculamos saldos de resumen
            const deuda = cuentasData.reduce((acc, c) => c.saldo < 0 ? acc + Math.abs(parseFloat(c.saldo)) : acc, 0);
            const favor = cuentasData.reduce((acc, c) => c.saldo > 0 ? acc + parseFloat(c.saldo) : acc, 0);
            
            setSummary({
                totalDeuda: deuda,
                totalFavor: favor,
                balanceNeto: favor - deuda
            });

        } catch (error) {
            console.error('Error fetching finanzas:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Finanzas</h2>
                    <p className="text-slate-400">Control de estados de cuenta y cobranzas</p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsCuotasModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold transition-all border border-slate-700"
                    >
                        <Calendar size={18} />
                        Generar Cuotas
                    </button>
                    <button 
                        onClick={() => { setInitialCobroSocioId(null); setIsCobroModalOpen(true); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <Receipt size={18} />
                        Registrar Cobro
                    </button>
                </div>
            </div>

            <CobroModal 
                isOpen={isCobroModalOpen} 
                onClose={() => { setIsCobroModalOpen(false); setInitialCobroSocioId(null); }} 
                onSuccess={fetchCuentas} 
                socios={sociosRaw} 
                initialSocioId={initialCobroSocioId}
            />
            <GeneradorCuotasModal 
                isOpen={isCuotasModalOpen} 
                onClose={() => setIsCuotasModalOpen(false)} 
                onSuccess={fetchCuentas} 
                socios={sociosRaw} 
            />
            <MovimientosModal
                isOpen={isMovimientosModalOpen}
                onClose={() => { setIsMovimientosModalOpen(false); setSelectedCuenta(null); }}
                cuenta={selectedCuenta}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                            <TrendingDown size={24} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-red-500/50">Por Cobrar</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Deuda Total</p>
                    <h3 className="text-3xl font-black text-white">$ {summary.totalDeuda.toLocaleString('es-AR')}</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-500/50">A Favor</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Saldos Positivos</p>
                    <h3 className="text-3xl font-black text-white">$ {summary.totalFavor.toLocaleString('es-AR')}</h3>
                </div>

                <div className={`bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group border-b-4 ${summary.balanceNeto >= 0 ? 'border-b-emerald-600' : 'border-b-red-600'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${summary.balanceNeto >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            <CreditCard size={24} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-600">Balance Club</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Proyección Neta</p>
                    <h3 className={`text-3xl font-black ${summary.balanceNeto >= 0 ? 'text-white' : 'text-red-400'}`}>
                        $ {summary.balanceNeto.toLocaleString('es-AR')}
                    </h3>
                </div>
            </div>

            {/* List */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                    <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs">Cuentas Corrientes</h4>
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-500 hover:text-white transition-all"><Filter size={18} /></button>
                        <button className="p-2 text-slate-500 hover:text-white transition-all"><Download size={18} /></button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <p className="text-sm text-slate-500 uppercase tracking-widest font-medium">Analizando saldos...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50">
                                <tr>
                                    <th className="px-8 py-5 text-xs uppercase tracking-widest font-bold text-slate-500">Socio</th>
                                    <th className="px-6 py-5 text-xs uppercase tracking-widest font-bold text-slate-500">Estado</th>
                                    <th className="px-6 py-5 text-xs uppercase tracking-widest font-bold text-slate-500 text-right">Saldo Actual</th>
                                    <th className="px-8 py-5 text-xs uppercase tracking-widest font-bold text-slate-500 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {cuentas.map((c) => (
                                    <tr key={c.socio.id} className="hover:bg-slate-800/20 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600/20 group-hover:text-blue-500 transition-all">
                                                    {c.socio.nombres[0]}{c.socio.apellidos[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white leading-tight">{c.socio.apellidos}, {c.socio.nombres}</p>
                                                    <p className="text-xs text-slate-500 font-mono">DNI: {c.socio.dni}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${
                                                parseFloat(c.saldo) < 0 
                                                ? 'bg-red-500/10 text-red-500' 
                                                : parseFloat(c.saldo) > 0 
                                                ? 'bg-emerald-500/10 text-emerald-500' 
                                                : 'bg-slate-500/10 text-slate-500'
                                            }`}>
                                                {parseFloat(c.saldo) < 0 ? 'DEUDOR' : parseFloat(c.saldo) > 0 ? 'A FAVOR' : 'ALDÍA'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <p className={`font-black tracking-tight text-lg ${
                                                parseFloat(c.saldo) < 0 ? 'text-red-400' : parseFloat(c.saldo) > 0 ? 'text-emerald-400' : 'text-slate-500'
                                            }`}>
                                                $ {Math.abs(parseFloat(c.saldo)).toLocaleString('es-AR')}
                                                {parseFloat(c.saldo) < 0 && <ArrowDownRight size={14} className="inline ml-1" />}
                                                {parseFloat(c.saldo) > 0 && <ArrowUpRight size={14} className="inline ml-1" />}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => { setSelectedCuenta(c); setIsMovimientosModalOpen(true); }}
                                                    className="p-3 bg-slate-800 hover:bg-blue-600/20 hover:text-blue-500 rounded-2xl text-slate-500 transition-all shadow-sm"
                                                    title="Ver Movimientos"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => { setInitialCobroSocioId(c.socio.id); setIsCobroModalOpen(true); }}
                                                    className="p-3 bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-500 rounded-2xl text-slate-500 transition-all shadow-sm"
                                                    title="Registrar Cobro"
                                                >
                                                    <Receipt size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Hint */}
            <div className="mt-8 flex items-center gap-3 text-slate-600 bg-slate-900/20 p-4 rounded-2xl border border-slate-800/50 max-w-fit">
                <AlertCircle size={16} />
                <p className="text-xs">Los saldos se calculan en tiempo real sumando todos los movimientos históricos. No se permite eliminar transacciones.</p>
            </div>
        </MainLayout>
    );
};

export default FinanzasPage;
