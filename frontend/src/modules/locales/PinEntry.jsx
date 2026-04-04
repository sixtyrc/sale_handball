import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Ticket, Coffee, ChevronLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';

const ROLES = [
    {
        id: 'ENTRADA',
        label: 'Cobrar Entradas',
        icon: Ticket,
        desc: 'Registro de ingresos al evento',
        color: 'blue',
        bg: 'bg-blue-600',
        border: 'border-blue-500',
        glow: 'shadow-blue-600/40',
        text: 'text-blue-400',
        light: 'bg-blue-600/10',
    },
    {
        id: 'BUFFET',
        label: 'Atención Cantina',
        icon: Coffee,
        desc: 'Ventas de buffet y productos',
        color: 'orange',
        bg: 'bg-orange-500',
        border: 'border-orange-500',
        glow: 'shadow-orange-500/40',
        text: 'text-orange-400',
        light: 'bg-orange-500/10',
    },
];

const PinEntry = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState('PIN'); // 'PIN' | 'IDENT' | 'ROLE'
    const [pin, setPin] = useState('');
    const [nombre, setNombre] = useState('');
    const [dni, setDni] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [jornadaInfo, setJornadaInfo] = useState(null);

    const handleNumberClick = (num) => {
        if (pin.length < 4) setPin(prev => prev + num);
    };

    const handleDelete = () => setPin(prev => prev.slice(0, -1));

    const handleValidatePin = async () => {
        if (pin.length < 4) return;
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`/api/v1/locales/kiosco/validar-pin/`, { slug, pin });
            setJornadaInfo(response.data);
            setStep('IDENT'); // PIN ok → Identificación
        } catch (err) {
            setError('PIN incorrecto o jornada finalizada.');
            setPin('');
        } finally {
            setLoading(false);
        }
    };

    const handleIdentify = (e) => {
        e.preventDefault();
        if (!nombre || !dni) return;
        setStep('ROLE');
    };

    const handleSelectRole = async (rolId) => {
        setLoading(true);
        try {
            // Registrar asistencia nominal en el backend
            const response = await axios.post(`/api/v1/locales/kiosco/${jornadaInfo.id}/registrar-asistencia/`, {
                pin,
                nombre_declarado: nombre,
                dni_declarado: dni,
                tarea: rolId === 'ENTRADA' ? 'ENTRADAS' : 'CANTINA'
            });

            // Guardamos sesión temporal para el kiosco
            sessionStorage.setItem(`kiosco_auth_${slug}`, JSON.stringify({
                pin,
                jornada: jornadaInfo,
                voluntario: response.data
            }));

            navigate(`/locales/${slug}/pos?tipo=${rolId}`);
        } catch (err) {
            setError('Error al iniciar turno. Intente nuevamente.');
            setStep('IDENT');
        } finally {
            setLoading(false);
        }
    };

    // ── PASO 1: Ingreso de PIN ──────────────────────────────────────────────
    if (step === 'PIN') return (
        <div className="min-h-screen flex flex-col bg-slate-900 text-white font-sans">
            <div className="flex-grow flex flex-col items-center justify-center p-6 space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="text-blue-500 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Acceso Voluntario</h1>
                    <p className="text-slate-400 text-sm">Ingresá el PIN del día para operar</p>
                </div>

                {/* PIN Display */}
                <div className="flex space-x-4 h-12 items-center">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                                pin.length > i
                                ? 'bg-blue-500 border-blue-500 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                : 'border-slate-700'
                            }`}
                        />
                    ))}
                </div>

                {error && <p className="text-red-400 text-sm font-medium animate-pulse">{error}</p>}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-2xl font-bold flex items-center justify-center shadow-lg"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleDelete}
                        className="h-16 rounded-2xl bg-slate-800/50 text-slate-400 hover:bg-slate-700 transition-all flex items-center justify-center font-medium"
                    >
                        ⌫
                    </button>
                    <button
                        onClick={() => handleNumberClick('0')}
                        className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center text-2xl font-bold shadow-lg"
                    >
                        0
                    </button>
                    <button
                        onClick={handleValidatePin}
                        disabled={loading || pin.length < 4}
                        className={`h-16 rounded-2xl flex items-center justify-center transition-all ${
                            pin.length >= 4
                            ? 'bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-600/30'
                            : 'bg-slate-800/30 text-slate-600'
                        }`}
                    >
                        {loading
                            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <ArrowRight className="w-8 h-8" />
                        }
                    </button>
                </div>
            </div>

            <div className="p-8 text-center border-t border-slate-800/50">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    Potenciado por <span className="text-blue-500/50">CTSoft</span>
                </p>
            </div>
        </div>
    );

    // ── PASO 2: Identificación Nominal ───────────────────────────────────────
    if (step === 'IDENT') return (
        <div className="min-h-screen flex flex-col bg-slate-900 text-white font-sans">
            <div className="flex-grow flex flex-col items-center justify-center p-6 space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="text-emerald-500 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">PIN Validado ✓</h1>
                    <p className="text-slate-400 text-sm">Contanos quién está ayudando hoy</p>
                </div>

                <form onSubmit={handleIdentify} className="w-full max-w-xs space-y-4">
                    <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform duration-200">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Tu Nombre Completo</label>
                        <input
                            required
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Juan Pérez"
                            className="w-full h-14 bg-slate-800/50 border border-slate-700 rounded-2xl px-6 font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600 transition-all"
                        />
                    </div>

                    <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform duration-200">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">DNI (para sumar puntos)</label>
                        <input
                            required
                            type="number"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            value={dni}
                            onChange={(e) => setDni(e.target.value)}
                            placeholder="Solo números"
                            className="w-full h-14 bg-slate-800/50 border border-slate-700 rounded-2xl px-6 font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-600 transition-all"
                        />
                    </div>

                    {error && <p className="text-red-400 text-xs text-center font-medium">{error}</p>}

                    <button
                        type="submit"
                        className="w-full h-16 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black text-lg shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all mt-4"
                    >
                        Continuar
                        <ArrowRight size={20} />
                    </button>

                    <button
                        type="button"
                        onClick={() => { setStep('PIN'); setPin(''); setNombre(''); setDni(''); }}
                        className="w-full text-slate-500 text-sm font-medium hover:text-slate-400 py-2 transition-colors"
                    >
                        Volver a ingresar PIN
                    </button>
                </form>
            </div>

            <div className="p-8 text-center border-t border-slate-800/50">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    Potenciado por <span className="text-blue-500/50">CTSoft</span>
                </p>
            </div>
        </div>
    );
    return (
        <div className="min-h-screen flex flex-col bg-slate-900 text-white font-sans">
            <div className="flex-grow flex flex-col items-center justify-center p-6 space-y-8">
                {/* Header con check de éxito */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="text-emerald-400 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">PIN Correcto ✓</h1>
                    <p className="text-slate-300 font-semibold">{jornadaInfo?.titulo}</p>
                    <p className="text-slate-500 text-sm">¿En qué vas a colaborar hoy?</p>
                </div>

                {/* Botones de rol — grandes y táctiles, mobile-first */}
                <div className="w-full max-w-xs space-y-4">
                    {ROLES.map((rol) => {
                        const Icon = rol.icon;
                        return (
                            <button
                                key={rol.id}
                                onClick={() => handleSelectRole(rol.id)}
                                className={`w-full p-6 rounded-3xl border-2 ${rol.border} ${rol.light} 
                                    flex items-center gap-5 text-left 
                                    active:scale-95 transition-all duration-150 
                                    shadow-xl ${rol.glow}`}
                            >
                                <div className={`w-14 h-14 ${rol.bg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-white">{rol.label}</p>
                                    <p className={`text-xs ${rol.text} mt-0.5`}>{rol.desc}</p>
                                </div>
                                <ArrowRight className="ml-auto text-slate-500" size={20} />
                            </button>
                        );
                    })}
                </div>

                {/* Volver a ingresar PIN */}
                <button
                    onClick={() => { setStep('PIN'); setPin(''); setError(''); }}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
                >
                    <ChevronLeft size={16} />
                    Ingresar otro PIN
                </button>
            </div>

            <div className="p-8 text-center border-t border-slate-800/50">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    Potenciado por <span className="text-blue-500/50">CTSoft</span>
                </p>
            </div>
        </div>
    );
};

export default PinEntry;
