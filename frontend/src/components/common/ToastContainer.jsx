import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { 
    CheckCircle2, 
    AlertCircle, 
    Info, 
    XCircle,
    X
} from 'lucide-react';

const Toast = ({ toast }) => {
    const { removeToast } = useUIStore();
    
    const getIcon = () => {
        switch (toast.type) {
            case 'success': return <CheckCircle2 className="text-emerald-400" size={20} />;
            case 'error': return <XCircle className="text-red-400" size={20} />;
            case 'warning': return <AlertCircle className="text-amber-400" size={20} />;
            default: return <Info className="text-blue-400" size={20} />;
        }
    };

    const getBgColor = () => {
        switch (toast.type) {
            case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
            case 'error': return 'bg-red-500/10 border-red-500/20';
            case 'warning': return 'bg-amber-500/10 border-amber-500/20';
            default: return 'bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`flex items-center gap-4 p-4 pr-3 rounded-[1.25rem] border backdrop-blur-xl shadow-2xl min-w-[320px] max-w-md ${getBgColor()}`}
        >
            <div className="shrink-0">{getIcon()}</div>
            
            <div className="flex-grow">
                <p className="text-xs font-black text-white uppercase tracking-widest leading-tight">
                    {toast.title || (toast.type === 'error' ? 'Error' : 'Notificación')}
                </p>
                <p className="text-xs text-slate-300 mt-1 font-medium italic leading-relaxed">
                    {toast.message}
                </p>
            </div>

            <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-white"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

const ToastContainer = () => {
    const { toasts } = useUIStore();
    
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
            <div className="pointer-events-auto flex flex-col gap-3">
                <AnimatePresence initial={false}>
                    {toasts.map((toast) => (
                        <Toast key={toast.id} toast={toast} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ToastContainer;
