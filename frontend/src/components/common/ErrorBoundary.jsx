import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        // Aquí se podría enviar a un log services
        console.error("ErrorBoundary atrapó un error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full" />
                        
                        <div className="mx-auto w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                            <AlertOctagon size={32} />
                        </div>
                        
                        <h1 className="text-2xl font-black mb-2 text-white tracking-tight">Error de Interfaz</h1>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Hubo un problema imprevisto al cargar este módulo. No te preocupes, el resto del sistema sigue funcionando.
                        </p>
                        
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="text-left bg-slate-950 border border-slate-800 p-4 rounded-xl mb-8 overflow-auto max-h-48 text-xs font-mono text-rose-400/80">
                                <p className="font-bold text-rose-500 mb-1">{this.state.error.toString()}</p>
                                <p className="whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</p>
                            </div>
                        )}
                        
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-500 text-white w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                        >
                            <RotateCcw size={18} />
                            Recargar Pantalla
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
