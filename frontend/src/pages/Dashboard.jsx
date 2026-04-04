import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import { 
    Users, 
    CreditCard, 
    Trophy, 
    Calendar, 
    ArrowRight,
    AlertTriangle,
    ShieldAlert,
    CheckCircle,
    Loader2,
    CheckSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
    const [stats, setStats] = useState({
        sociosActivos: 0,
        moraTotal: 0,
        categoriasHabilitadas: 0,
        partidosProximos: 0,
        riesgoOperativo: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [sociosRes, catRes] = await Promise.all([
                api.get('socios/'),
                api.get('deportes/categorias/')
            ]);
            
            const socios = sociosRes.data || [];
            const categorias = catRes.data || [];
            
            const activos = socios.filter(s => s.estado === 'ACTIVO' && (s.role === 'SOCIO' || s.rol === 'SOCIO')).length;
            const activas = categorias.filter(c => c.activo).length;
            
            setStats({
                sociosActivos: activos,
                moraTotal: 125430, // Mock
                categoriasHabilitadas: activas,
                partidosProximos: 4,
                riesgoOperativo: 3
            });
        } catch (error) {
            console.error('Error fetching dashboard info:', error);
        } finally {
            setLoading(false);
        }
    };

    const { user } = useAuthStore();

    const isProfesor = user?.role === 'PROFESOR';

    const fastActions = isProfesor ? [
        { label: 'Ver Mis Jugadores', icon: Users, to: '/deportes', color: 'bg-emerald-600' },
        { label: 'Planillas & Asistencia', icon: CheckSquare, to: '/eventos', color: 'bg-blue-600' },
        { label: 'Cargar Stats', icon: Trophy, to: '/eventos', color: 'bg-amber-600' }
    ] : [
        { label: 'Registrar Cobro', icon: CreditCard, to: '/finanzas', color: 'bg-emerald-600' },
        { label: 'Nuevo Socio', icon: Users, to: '/socios', color: 'bg-blue-600' },
        { label: 'Cargar Stats', icon: Trophy, to: '/deportes', color: 'bg-amber-600' },
        { label: 'Nueva Jornada', icon: Calendar, to: '/locales', color: 'bg-indigo-600' },
    ];

    if (loading) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center py-40 gap-4 text-slate-500">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                    <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Sincronizando Sistema...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="mb-10">
                <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Panel Principal</h2>
                <p className="text-slate-400 font-light">Bienvenido a la gestión centralizada de Salesianos Handball</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group hover:border-blue-500/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Users size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Activos</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Socios Activos</p>
                    <h3 className="text-3xl font-black text-white">{stats.sociosActivos}</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group hover:border-red-500/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-600/10 rounded-2xl text-red-500 group-hover:bg-red-600 group-hover:text-white transition-all">
                            <ShieldAlert size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Mora</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Deuda Total</p>
                    <h3 className="text-3xl font-black text-white">$ {stats.moraTotal.toLocaleString('es-AR')}</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group hover:border-amber-500/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-600/10 rounded-2xl text-amber-500 group-hover:bg-amber-600 group-hover:text-white transition-all">
                            <Trophy size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Torneos</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Categorías</p>
                    <h3 className="text-3xl font-black text-white">{stats.categoriasHabilitadas}</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group hover:border-emerald-500/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-600/10 rounded-2xl text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <Calendar size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Fixture</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Próximos Partidos</p>
                    <h3 className="text-3xl font-black text-white">{stats.partidosProximos}</h3>
                </div>
            </div>

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Fast Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <h4 className="text-slate-500 uppercase tracking-widest text-[10px] font-black mb-4">Acciones Rápidas</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {fastActions.map((action, i) => (
                            <Link 
                                key={i} 
                                to={action.to}
                                className="group flex items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:bg-slate-800 transition-all border-l-4 border-l-transparent hover:border-l-blue-600"
                            >
                                <div className={`p-3 rounded-xl ${action.color} text-white shadow-lg group-hover:scale-110 transition-all`}>
                                    <action.icon size={20} />
                                </div>
                                <span className="font-bold text-white group-hover:translate-x-2 transition-all flex items-center gap-2">
                                    {action.label}
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Alerts / Alerts Column */}
                <div className="lg:col-span-2 space-y-6">
                    <h4 className="text-slate-500 uppercase tracking-widest text-[10px] font-black mb-4 flex items-center gap-2">
                        Alertas y Riesgos
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full text-[8px]">{stats.riesgoOperativo} críticos</span>
                    </h4>
                    
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                        <div className="space-y-6">
                            <div className="flex gap-6 items-start">
                                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl shrink-0"><AlertTriangle size={24} /></div>
                                <div>
                                    <h5 className="font-bold text-white text-lg">Mora Crítica Detectada</h5>
                                    <p className="text-slate-400 text-sm mb-3">Hay 12 socios con más de 3 cuotas pendientes que deben ser gestionados administrativamente.</p>
                                    <Link to="/finanzas" className="text-red-400 text-xs font-bold hover:underline flex items-center gap-1">
                                        Ver listado de morosos <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                            
                            <hr className="border-slate-800" />

                            <div className="flex gap-6 items-start">
                                <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0"><ShieldAlert size={24} /></div>
                                <div>
                                    <h5 className="font-bold text-white text-lg">Documentación Vencida</h5>
                                    <p className="text-slate-400 text-sm mb-3">8 jugadores de la categoría SUB-14 no tienen el apto médico vigente para la competencia de este fin de semana.</p>
                                    <Link to="/deportes" className="text-amber-400 text-xs font-bold hover:underline flex items-center gap-1">
                                        Gestionar fichas médicas <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>

                            <hr className="border-slate-800" />

                            <div className="flex gap-6 items-start">
                                <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl shrink-0"><CheckCircle size={24} /></div>
                                <div>
                                    <h5 className="font-bold text-white text-lg">Instancia de Competencia</h5>
                                    <p className="text-slate-400 text-sm mb-0">El fixture para la temporada 2026 ha sido importado correctamente. Se puede proceder a asignar árbitros.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Dashboard;
