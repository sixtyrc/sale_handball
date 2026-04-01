import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PwaInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show the install banner after a few seconds
            setTimeout(() => setIsVisible(true), 5000);
        });

        window.addEventListener('appinstalled', () => {
            setIsVisible(false);
            setDeferredPrompt(null);
            console.log('PWA instalada satisfactoriamente.');
        });
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-blue-500/20 p-5 z-[100] animate-slide-up flex flex-col space-y-4">
            <button 
                onClick={() => setIsVisible(false)}
                className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
                <X size={16} />
            </button>
            <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <Download size={24} />
                </div>
                <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Instalar App</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Usa la plataforma sin navegador y offline.</p>
                </div>
            </div>
            <button
                onClick={handleInstallClick}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
                Agregar a Pantalla de Inicio
            </button>
        </div>
    );
};

export default PwaInstallPrompt;
