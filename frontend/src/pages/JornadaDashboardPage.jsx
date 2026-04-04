import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import { useUIStore } from '../store/uiStore';
import { 
    Calendar, ArrowLeft, Download, Wallet, CreditCard, Banknote,
    TrendingUp, Lock, CheckCircle2, Ticket, Coffee, FileSpreadsheet
} from 'lucide-react';

const JornadaDashboardPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useUIStore();
    const [jornada, setJornada] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Formulario Arqueo
    const [efectivoDeclarado, setEfectivoDeclarado] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [cerrando, setCerrando] = useState(false);

    // Formulario Nuevo Egreso
    const [egresoMonto, setEgresoMonto] = useState('');
    const [egresoDesc, setEgresoDesc] = useState('');
    const [egresoTipo, setEgresoTipo] = useState('SUMINISTROS');
    const [agregandoEgreso, setAgregandoEgreso] = useState(false);

    useEffect(() => {
        fetchJornada();
    }, [id]);

    const fetchJornada = async () => {
        try {
            const response = await api.get(`locales/jornadas/${id}/`);
            setJornada(response.data);
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'No se pudo cargar la jornada.' });
            navigate('/locales');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEgreso = async (e) => {
        e.preventDefault();
        if (!egresoMonto || !egresoDesc) return;
        setAgregandoEgreso(true);
        try {
            await api.post('locales/egresos/', {
                jornada: id,
                monto: egresoMonto,
                descripcion: egresoDesc,
                tipo: egresoTipo
            });
            addToast({ type: 'success', title: 'Gasto Registrado', message: 'El egreso se descontó de la caja esperada.' });
            setEgresoMonto('');
            setEgresoDesc('');
            fetchJornada();
        } catch (err) {
            addToast({ type: 'error', title: 'Error', message: 'No se pudo registrar el gasto.' });
        } finally {
            setAgregandoEgreso(false);
        }
    };

    const handleDeleteEgreso = async (egresoId) => {
        if (!window.confirm("¿Eliminar este registro de gasto?")) return;
        try {
            await api.delete(`locales/egresos/${egresoId}/`);
            fetchJornada();
        } catch (err) {
            addToast({ type: 'error', title: 'Error', message: 'No se pudo eliminar el egreso.' });
        }
    };

    const handleCerrar = async () => {
        if (!efectivoDeclarado || isNaN(efectivoDeclarado)) {
            addToast({ type: 'error', title: 'Falta Monto', message: 'Debe declarar el efectivo real contado en caja.' });
            return;
        }

        if (!window.confirm("¿Está seguro de CERRAR esta jornada? Esto bloqueará futuras ventas y ventas en el kiosco.")) return;

        setCerrando(true);
        try {
            await api.post(`locales/jornadas/${id}/cerrar/`, {
                efectivo_declarado: efectivoDeclarado,
                observaciones
            });
            addToast({ type: 'success', title: 'Jornada Cerrada', message: 'La caja se ha cerrado correctamente.' });
            fetchJornada(); // recargar
        } catch (err) {
            addToast({ type: 'error', title: 'Error de cierre', message: err.response?.data?.error || 'Error al cerrar.' });
        } finally {
            setCerrando(false);
        }
    };

    const handleRendir = async () => {
        if (!window.confirm("¿Confirmar rendición de este saldo a la Tesorería General?")) return;
        try {
            await api.post(`locales/jornadas/${id}/rendir/`);
            addToast({ type: 'success', title: 'Caja Rendida', message: 'El dinero fue marcado como rendido a Tesorería.' });
            fetchJornada();
        } catch (err) {
            addToast({ type: 'error', title: 'Error', message: 'No se pudo rendir la jornada.' });
        }
    };

    const descargarCSV = () => {
        if (!jornada.ventas || jornada.ventas.length === 0) {
            addToast({ type: 'info', title: 'Sin datos', message: 'No hay ventas para exportar.' });
            return;
        }

        const headers = ['Fecha/Hora', 'Tipo', 'Metodo', 'Monto'];
        const csvRows = [headers.join(',')];

        jornada.ventas.forEach(v => {
            const row = [
                new Date(v.created_at).toLocaleString('es-AR'),
                v.tipo_display,
                v.metodo_pago,
                `"${v.monto}"`
            ];
            csvRows.push(row.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `ventas_${jornada.slug}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Cálculos dinámicos
    const totales = useMemo(() => {
        if (!jornada || !jornada.ventas) return { entradas: 0, cantina: 0, efectivo: 0, digital: 0, total: 0, egresos: 0 };
        
        const res = jornada.ventas.reduce((acc, v) => {
            const amt = parseFloat(v.monto);
            acc.total += amt;
            if (v.tipo === 'ENTRADA') acc.entradas += amt;
            else if (v.tipo === 'BUFFET') acc.cantina += amt;
            
            if (v.metodo_pago === 'EFECTIVO') acc.efectivo += amt;
            else acc.digital += amt;
            
            return acc;
        }, { entradas: 0, cantina: 0, efectivo: 0, digital: 0, total: 0, egresos: 0 });

        // Sumar egresos detallados
        res.egresos = jornada.egresos?.reduce((sum, e) => sum + parseFloat(e.monto), 0) || 0;
        return res;
    }, [jornada]);

    if (loading) return <MainLayout><div className="p-20 text-center text-slate-500">Cargando dashboard...</div></MainLayout>;
    if (!jornada) return null;

    const isFinalizada = jornada.estado === 'FINALIZADA';
    const balance = jornada.balance; // Viene del backend (CajaJornada) si está cerrada

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/locales')}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-full ${isFinalizada ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {jornada.estado_display}
                            </span>
                            <span className="text-sm font-mono text-slate-500">PIN: {jornada.access_pin}</span>
                        </div>
                        <h2 className="text-3xl font-black text-white">{jornada.titulo}</h2>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={descargarCSV}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold transition-all text-sm"
                    >
                        <FileSpreadsheet size={18} className="text-emerald-400" />
                        Exportar Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Panel de Totales de Venta */}
                <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <div className="flex items-center gap-3 text-emerald-400 mb-2">
                            <TrendingUp size={20} />
                            <p className="text-xs font-bold uppercase tracking-widest">Recaudación Total</p>
                        </div>
                        <p className="text-4xl font-black text-white">${totales.total.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <div className="flex items-center gap-3 text-slate-400 mb-2">
                            <Banknote size={20} />
                            <p className="text-xs font-bold uppercase tracking-widest">En Efectivo</p>
                        </div>
                        <p className="text-3xl font-black text-white">${totales.efectivo.toLocaleString('es-AR')}</p>
                        <p className="text-xs font-medium text-red-400 mt-2">Gastos (Egresos): -${totales.egresos.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-6">
                        <div className="flex items-center gap-3 text-blue-400 mb-2">
                            <Ticket size={20} />
                            <p className="text-xs font-bold uppercase tracking-widest">Entradas</p>
                        </div>
                        <p className="text-3xl font-black text-white">${totales.entradas.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-6">
                        <div className="flex items-center gap-3 text-orange-400 mb-2">
                            <Coffee size={20} />
                            <p className="text-xs font-bold uppercase tracking-widest">Cantina</p>
                        </div>
                        <p className="text-3xl font-black text-white">${totales.cantina.toLocaleString('es-AR')}</p>
                    </div>
                </div>

                {/* Panel de Arqueo y Cierre */}
                <div className="col-span-1">
                    {isFinalizada ? (
                        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-3xl p-6 h-full flex flex-col justify-center">
                            <div className="text-center mb-6">
                                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-1">Caja Cerrada</h3>
                                <p className="text-sm text-emerald-400/80">El arqueo ya ha sido realizado</p>
                            </div>
                            
                            <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl mb-6">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                    <span className="text-xs text-slate-400">Sistema (Efe - Gastos)</span>
                                    <span className="text-sm font-bold text-white">${(totales.efectivo - totales.egresos).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                    <span className="text-xs text-slate-400">Efectivo Real Arqueado</span>
                                    <span className="text-sm font-bold text-blue-400">${balance?.efectivo_declarado}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400">Diferencia Final</span>
                                    <span className={`text-sm font-bold ${parseFloat(balance?.resumen?.diferencia_arqueo) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        ${balance?.resumen?.diferencia_arqueo || '0.00'}
                                    </span>
                                </div>
                            </div>
                            
                            {balance?.rendida_a_tesoreria ? (
                                <div className="bg-blue-600/20 text-blue-400 px-4 py-3 rounded-xl text-center text-sm font-bold">
                                    Rendido a Tesorería Central
                                </div>
                            ) : (
                                <button 
                                    onClick={handleRendir}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all"
                                >
                                    Confirmar Rendición Tesorería
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Lock size={20} className="text-slate-500" />
                                Arqueo Final
                            </h3>
                            
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                        Efectivo Total Contado
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                        <input 
                                            type="number" 
                                            value={efectivoDeclarado}
                                            onChange={(e) => setEfectivoDeclarado(e.target.value)}
                                            placeholder={(totales.efectivo - totales.egresos).toString()}
                                            className="w-full bg-slate-950 border border-slate-700 text-white text-xl font-bold rounded-xl py-4 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Se espera <span className="text-emerald-400 font-bold">${(totales.efectivo - totales.egresos).toLocaleString()}</span> (Ventas Efe - Gastos del día).
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                        Observaciones de Cierre
                                    </label>
                                    <textarea 
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        placeholder="Cualquier aclaración sobre el balance final..."
                                        rows={2}
                                        className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    />
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleCerrar}
                                disabled={cerrando || !efectivoDeclarado}
                                className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center
                                    ${efectivoDeclarado ? 'bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/20' : 'bg-slate-800 text-slate-500'}
                                `}
                            >
                                {cerrando ? 'Procesando...' : 'Cerrar Jornada Definitivo'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Listado de Gastos (Egresos) — Dinámico durante el día */}
            {!isFinalizada && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Wallet size={20} className="text-red-400" />
                        Registrar Gasto (Egreso del día)
                    </h3>
                    
                    <form onSubmit={handleAddEgreso} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Monto</label>
                            <input 
                                type="number" 
                                value={egresoMonto}
                                onChange={(e) => setEgresoMonto(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl p-3 focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="$ 0.00"
                                required
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Tipo</label>
                            <select 
                                value={egresoTipo}
                                onChange={(e) => setEgresoTipo(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl p-3 focus:ring-2 focus:ring-red-500 outline-none"
                            >
                                <option value="SUMINISTROS">Buffet / Suministros</option>
                                <option value="VIATICOS">Viáticos</option>
                                <option value="LIMPIEZA">Limpieza</option>
                                <option value="OTRO">Otros</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Descripción</label>
                            <input 
                                type="text" 
                                value={egresoDesc}
                                onChange={(e) => setEgresoDesc(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="Ej: Compra hielo..."
                                required
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={agregandoEgreso}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold h-[50px] rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
                        >
                            {agregandoEgreso ? '...' : 'Registrar Gasto'}
                        </button>
                    </form>

                    {jornada.egresos?.length > 0 && (
                        <div className="mt-8 space-y-3">
                            {jornada.egresos.map(e => (
                                <div key={e.id} className="flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center">
                                            <Wallet size={16} className="text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{e.descripcion}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{e.tipo_display}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <p className="font-black text-red-400">-${parseFloat(e.monto).toLocaleString()}</p>
                                        <button onClick={() => handleDeleteEgreso(e.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Listado de Detalle */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h4 className="font-bold text-white">Detalle de Transacciones</h4>
                    <span className="text-xs text-slate-500 font-medium">{jornada.ventas?.length || 0} operaciones</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950/50">
                                <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Fecha / Hora</th>
                                <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Operación</th>
                                <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Método</th>
                                <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-500 font-bold text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {jornada.ventas?.map((v) => (
                                <tr key={v.id} className="hover:bg-slate-800/20 transition-colors">
                                    <td className="py-4 px-6 text-sm text-slate-400 font-mono">
                                        {new Date(v.created_at).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`text-xs font-black uppercase px-2 py-1 rounded-md ${v.tipo === 'ENTRADA' ? 'bg-blue-600/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                            {v.tipo_display}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            {v.metodo_pago === 'EFECTIVO' ? <Banknote size={14} className="text-emerald-400" /> : <CreditCard size={14} className="text-purple-400" />}
                                            <span className="text-sm font-medium text-slate-300">{v.metodo_pago}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right font-black text-white">
                                        ${parseFloat(v.monto).toLocaleString('es-AR')}
                                    </td>
                                </tr>
                            ))}
                            {(!jornada.ventas || jornada.ventas.length === 0) && (
                                <tr><td colSpan="4" className="text-center py-10 text-slate-500">Aún no hay ventas registradas.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
};

export default JornadaDashboardPage;
