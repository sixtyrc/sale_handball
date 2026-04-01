import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Keypad, ArrowRight, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const PinEntry = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNumberClick = (num) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleLogin = async () => {
        if (pin.length < 4) return;
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`/api/v1/locales/kiosco/validar-pin/`, {
                slug,
                pin
            });
            // Guardamos sesión temporal para el kiosco
            sessionStorage.setItem(`kiosco_auth_${slug}`, JSON.stringify({
                pin,
                jornada: response.data
            }));
            navigate(`/locales/${slug}/pos`);
        } catch (err) {
            setError('PIN incorrecto o jornada finalizada.');
            setPin('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-900 text-white font-sans overflow-hidden">
            <div className="flex-grow flex flex-col items-center justify-center p-6 space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="text-blue-500 w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Acceso Voluntario</h1>
                    <p className="text-slate-400 text-sm">Ingresa el PIN del día para operar</p>
                </div>

                {/* PIN Display */}
                <div className="flex space-x-3 h-12 items-center">
                    {[...Array(6)].map((_, i) => (
                        <div 
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                                pin.length > i 
                                ? 'bg-blue-500 border-blue-500 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                                : 'border-slate-700'
                            }`}
                        />
                    ))}
                </div>

                {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

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
                        className="h-16 rounded-2xl bg-slate-800/50 text-slate-400 flex items-center justify-center"
                    >
                        Borrar
                    </button>
                    <button
                        onClick={() => handleNumberClick('0')}
                        className="h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl font-bold shadow-lg"
                    >
                        0
                    </button>
                    <button
                        onClick={handleLogin}
                        disabled={loading || pin.length < 4}
                        className={`h-16 rounded-2xl flex items-center justify-center transition-all ${
                            pin.length >= 4 
                            ? 'bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-600/30' 
                            : 'bg-slate-800/30 text-slate-600 grayscale'
                        }`}
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight className="w-8 h-8" />}
                    </button>
                </div>
            </div>
            
            {/* Branding Minimalista */}
            <div className="p-8 text-center border-t border-slate-800/50">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    Potenciado por <span className="text-blue-500/50">CTSoft</span>
                </p>
            </div>
        </div>
    );
};

export default PinEntry;
