import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, CreditCard, Banknote, ListCheck, LogOut, Trash2, Send, TrendingUp, Ticket, Coffee } from 'lucide-react';
import axios from 'axios';

const CanteenOperator = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [auth, setAuth] = useState(null);
    const [monto, setMonto] = useState('');
    // Lee el rol elegido en PinEntry via query param ?tipo=ENTRADA|BUFFET
    const [tipo, setTipo] = useState(searchParams.get('tipo') || 'BUFFET');
    const [metodoPago, setMetodoPago] = useState('EFECTIVO');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [recentSales, setRecentSales] = useState([]);

    // Totalizador en tiempo real (solo sesión actual)
    const totales = useMemo(() => {
        const entradas = recentSales.filter(s => s.tipo === 'ENTRADA').reduce((sum, s) => sum + parseFloat(s.monto), 0);
        const buffet = recentSales.filter(s => s.tipo === 'BUFFET').reduce((sum, s) => sum + parseFloat(s.monto), 0);
        return { entradas, buffet, total: entradas + buffet };
    }, [recentSales]);

    useEffect(() => {
        const storedAuth = sessionStorage.getItem(`kiosco_auth_${slug}`);
        if (!storedAuth) {
            navigate(`/locales/${slug}/login`);
            return;
        }
        setAuth(JSON.parse(storedAuth));
    }, [slug, navigate]);

    const handleNumberClick = (num) => {
        if (monto.length < 9) setMonto(prev => prev + num);
    };

    const handleReset = () => {
        setMonto('');
        setSuccess(false);
    };

    const handleSubmit = async () => {
        if (!monto || parseFloat(monto) <= 0) return;
        setLoading(true);
        try {
            const response = await axios.post(`/api/v1/locales/kiosco/${auth.jornada.id}/cargar-venta/`, {
                monto: parseFloat(monto),
                tipo,
                metodo_pago: metodoPago,
                pin: auth.pin
            });
            
            setRecentSales(prev => [response.data, ...prev].slice(0, 5));
            setMonto('');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (err) {
            alert('Error al registrar venta. Verifique conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!auth?.voluntario?.dni_declarado) {
            sessionStorage.removeItem(`kiosco_auth_${slug}`);
            navigate(`/locales/${slug}/login`);
            return;
        }

        try {
            // Intentamos cerrar la asistencia en el backend
            await axios.post(`/api/v1/locales/kiosco/${auth.jornada.id}/cerrar-asistencia/`, {
                dni_declarado: auth.voluntario.dni_declarado
            });
        } catch (err) {
            console.error("Error al cerrar asistencia:", err);
        } finally {
            sessionStorage.removeItem(`kiosco_auth_${slug}`);
            navigate(`/locales/${slug}/login`);
        }
    };

    if (!auth) return null;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
            {/* Header Mobile Header */}
            <div className="bg-white dark:bg-slate-900 px-4 py-4 pt-8 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
                <div className="flex items-center space-x-3">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg ${tipo === 'ENTRADA' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-orange-500 shadow-orange-500/20'}`}>
                        {tipo === 'ENTRADA' ? <Ticket size={24} /> : <Coffee size={24} />}
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-sm font-black truncate max-w-[150px] dark:text-white uppercase tracking-tight leading-none mb-1">
                            {auth.voluntario?.nombre_declarado || 'Voluntario'}
                        </h2>
                        <p className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded inline-block w-fit ${tipo === 'ENTRADA' ? 'bg-blue-600/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                             {auth.jornada.titulo} • {tipo === 'ENTRADA' ? '🎟️ Entradas' : '☕ Cantina'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center p-2 text-slate-400 hover:text-red-500 transition-colors group"
                >
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl group-hover:bg-red-500/10 transition-colors">
                        <LogOut size={18} />
                    </div>
                    <span className="text-[8px] font-bold mt-1 uppercase">Salir</span>
                </button>
            </div>
            {/* Barra de Totales en Tiempo Real - Mobile First */}
            {recentSales.length > 0 && (
                <div className="bg-slate-900 dark:bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-1 text-slate-500">
                        <TrendingUp size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Esta Sesión</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[9px] text-blue-400 font-bold uppercase">Entradas</p>
                            <p className="text-sm font-black text-white">${totales.entradas.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-orange-400 font-bold uppercase">Buffet</p>
                            <p className="text-sm font-black text-white">${totales.buffet.toLocaleString()}</p>
                        </div>
                        <div className="text-right bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-1">
                            <p className="text-[9px] text-emerald-400 font-bold uppercase">Total</p>
                            <p className="text-sm font-black text-emerald-400">${totales.total.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-grow p-4 space-y-6">
                {/* Result Display */}
                <div className={`p-8 rounded-3xl text-center border-4 border-dashed transition-all duration-300 ${
                    success 
                    ? 'bg-emerald-100 border-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-500/50 scale-[1.02]' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none'
                }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${success ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {success ? '¡Venta Registrada!' : 'Monto a Cobrar'}
                    </p>
                    <div className={`text-5xl font-black transition-colors ${success ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                        ${monto || '0'}<span className="text-blue-500 animate-pulse">|</span>
                    </div>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Payment Toggles */}
                    <div className="col-span-2 flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                        <button 
                            onClick={() => setMetodoPago('EFECTIVO')}
                            className={`flex-1 py-4 px-4 rounded-xl flex items-center justify-center space-x-2 font-bold text-sm transition-all ${metodoPago === 'EFECTIVO' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-md scale-[1.02]' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <Banknote size={20} className={metodoPago === 'EFECTIVO' ? 'text-emerald-500' : ''} />
                            <span>EFECTIVO</span>
                        </button>
                        <button 
                            onClick={() => setMetodoPago('TRANSFERENCIA')}
                            className={`flex-1 py-4 px-4 rounded-xl flex items-center justify-center space-x-2 font-bold text-sm transition-all ${metodoPago === 'TRANSFERENCIA' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-md scale-[1.02]' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <CreditCard size={20} className={metodoPago === 'TRANSFERENCIA' ? 'text-blue-500' : ''} />
                            <span>TRANSF.</span>
                        </button>
                    </div>

                    {/* Category Buttons */}
                    <button 
                        onClick={() => setTipo('BUFFET')}
                        className={`h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${tipo === 'BUFFET' ? 'bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400 shadow-lg shadow-orange-500/10' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'}`}
                    >
                        <ShoppingBag className="mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-widest">BUFFET</span>
                    </button>
                    <button 
                        onClick={() => setTipo('ENTRADA')}
                        className={`h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${tipo === 'ENTRADA' ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400 shadow-lg shadow-blue-500/10' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'}`}
                    >
                        <ListCheck className="mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-widest">ENTRADA</span>
                    </button>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 'ENT', 4, 5, 6, 'CAN', 7, 8, 9, 'OK', 'DEL', 0, '00', 'SEND'].map((item) => {
                        if (['ENT', 'CAN', 'OK', 'SEND'].includes(item)) return null; // Placeholder for future or custom mapping
                        return (
                            <button
                                key={item}
                                onClick={() => item === 'DEL' ? handleReset() : item === '00' ? handleNumberClick('00') : handleNumberClick(item.toString())}
                                className={`h-14 rounded-xl font-bold flex items-center justify-center shadow-sm transition-all active:scale-95 ${
                                    item === 'DEL' 
                                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' 
                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-700'
                                }`}
                            >
                                {item === 'DEL' ? <Trash2 size={18} /> : item}
                            </button>
                        );
                    })}
                </div>

                {/* Confirm Sale Button */}
                <button
                    onClick={handleSubmit}
                    disabled={loading || !monto || parseFloat(monto) <= 0}
                    className={`w-full py-6 rounded-3xl font-black text-xl flex items-center justify-center space-x-3 transition-all transform active:scale-[0.98] ${
                        loading || !monto 
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 grayscale' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-600/30'
                    }`}
                >
                    {loading ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : <><Send size={24} /> <span>REGISTRAR VENTA</span></>}
                </button>

                {/* History */}
                <div className="space-y-3 pt-6 pb-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Últimas Ventas</p>
                    {recentSales.length > 0 ? recentSales.map((sale, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800 animate-slide-in">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${sale.metodo_pago === 'EFECTIVO' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'}`}>
                                    {sale.metodo_pago === 'EFECTIVO' ? <Banknote size={16}/> : <CreditCard size={16}/>}
                                </div>
                                <div>
                                    <p className="text-xs font-bold dark:text-white">{sale.tipo_display}</p>
                                    <p className="text-[9px] text-slate-500 uppercase">{new Date(sale.created_at).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            <p className="text-sm font-black dark:text-white">${sale.monto}</p>
                        </div>
                    )) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                            <p className="text-xs text-slate-400">Sin ventas registradas en esta sesión.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Minimal Footer Branding */}
            <div className="py-6 text-center">
                <a href="https://ctsoft.com.ar" target="_blank" className="text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-blue-500">
                    Desarrollado por <span className="underline underline-offset-2">CTSoft.com.ar</span>
                </a>
            </div>
        </div>
    );
};

export default CanteenOperator;
