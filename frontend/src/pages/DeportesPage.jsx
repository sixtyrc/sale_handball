import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import AthleteCard from '../modules/deportes/AthleteCard';
import { 
    Trophy, 
    Filter, 
    ChevronRight, 
    Users, 
    Plus, 
    Loader2,
    Activity,
    Layers,
    UserPlus,
    Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import CategoriaFormModal from '../modules/deportes/CategoriaFormModal';
import VincularSocioModal from '../modules/deportes/VincularSocioModal';

const DeportesPage = () => {
    const { user } = useAuthStore();
    const [categorias, setCategorias] = useState([]);
    const [athletes, setAthletes] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isVincularModalOpen, setIsVincularModalOpen] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [catRes, athRes] = await Promise.all([
                api.get('deportes/categorias/'),
                api.get('deportes/perfiles/')
            ]);
            setCategorias(catRes.data);
            setAthletes(athRes.data);
            if (catRes.data.length > 0 && !activeCategory) setActiveCategory(catRes.data[0].id);
        } catch (error) {
            console.error('Error fetching sports data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (catId, e) => {
        e.stopPropagation(); // Evitar que se seleccione la categoría al borrar
        if (!window.confirm('¿Realmente deseas eliminar esta categoría? Se desvincularán todos los jugadores.')) return;
        
        try {
            await api.delete(`deportes/categorias/${catId}/`);
            if (activeCategory === catId) setActiveCategory(null);
            fetchInitialData();
        } catch (error) {
            alert('Error al eliminar la categoría. Asegúrate de tener permisos de Admin.');
        }
    };

    const filteredAthletes = athletes.filter(a => a.categoria_actual === activeCategory);
    const currentCategory = categorias.find(c => c.id === activeCategory);

    return (
        <MainLayout>
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Deportes</h2>
                    <p className="text-slate-400">Categorías, perfiles deportivos y elegibilidad</p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => alert('Estadísticas globales en construcción')}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold transition-all border border-slate-700"
                    >
                        <Activity size={18} />
                        Stats Globales
                    </button>
                    {(user?.role === 'ADMIN' || user?.role === 'DIRIGENTE') && (
                        <button 
                            onClick={() => setIsCatModalOpen(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                            <Plus size={18} />
                            Nueva Categoría
                        </button>
                    )}
                </div>
            </div>

            <CategoriaFormModal 
                isOpen={isCatModalOpen} 
                onClose={() => setIsCatModalOpen(false)} 
                onSuccess={fetchInitialData} 
            />

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Categorías Sidebar */}
                <div className="w-full lg:w-72 space-y-4">
                    <h4 className="text-slate-500 uppercase tracking-widest text-[10px] font-black px-4 flex items-center gap-2">
                        <Layers size={14} />
                        Categorías Vigentes
                    </h4>
                    
                    <div className="space-y-1">
                        {loading ? (
                            <div className="p-4 space-y-4">
                                {[1, 2, 3].map(n => <div key={n} className="h-12 bg-slate-900/50 rounded-xl animate-pulse" />)}
                            </div>
                        ) : categorias.map((cat) => (
                            <div key={cat.id} className="relative group/item">
                                <button
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 ${
                                        activeCategory === cat.id 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-2' 
                                        : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${
                                            activeCategory === cat.id ? 'bg-white' : 'bg-slate-700 group-hover:bg-blue-400'
                                        }`} />
                                        <span className="font-extrabold tracking-tight text-sm uppercase">{cat.nombre}</span>
                                    </div>
                                    <ChevronRight size={16} className={`${activeCategory === cat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />
                                </button>
                                
                                {/* Admin Trash Button */}
                                {user?.role === 'ADMIN' && (
                                    <button 
                                        onClick={(e) => handleDeleteCategory(cat.id, e)}
                                        className="absolute right-10 top-1/2 -translate-y-1/2 p-2 text-red-500/50 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                        title="Eliminar Categoría"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Athletes View */}
                <div className="flex-grow">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando Planteles...</p>
                        </div>
                    ) : (
                        <div>
                            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 mb-8 backdrop-blur-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-3xl -z-10" />
                                
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-blue-600/10 text-blue-500 text-[10px] font-black rounded-lg uppercase tracking-widest">Rama {currentCategory?.genero}</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-white mb-2">{currentCategory?.nombre}</h3>
                                        <p className="text-slate-400 font-light text-sm italic">{currentCategory?.descripcion || 'Sin descripción para esta categoría'}</p>
                                    </div>
                                    
                                    <div className="flex gap-8">
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Plantel</p>
                                            <p className="text-2xl font-black text-white">{filteredAthletes.length}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Habilitados</p>
                                            <p className="text-2xl font-black text-emerald-500">{filteredAthletes.filter(a => a.puede_jugar).length}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Riesgo</p>
                                            <p className="text-2xl font-black text-red-500">{filteredAthletes.filter(a => !a.puede_jugar).length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredAthletes.length > 0 ? filteredAthletes.map((athlete) => (
                                    <AthleteCard key={athlete.id} athlete={athlete} />
                                )) : (
                                    <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                                            <Users size={24} className="text-slate-700" />
                                        </div>
                                        <p className="text-slate-500">No hay jugadores cargados en esta categoría aún.</p>
                                        <button 
                                            onClick={() => setIsVincularModalOpen(true)}
                                            className="mt-4 flex items-center justify-center gap-2 mx-auto bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-500 hover:text-white px-6 py-2 rounded-xl font-bold transition-all"
                                        >
                                            <UserPlus size={18} />
                                            Vincular Socios
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <VincularSocioModal 
                isOpen={isVincularModalOpen} 
                onClose={() => setIsVincularModalOpen(false)} 
                onSuccess={fetchInitialData}
                categoriaId={activeCategory}
            />
        </MainLayout>
    );
};

export default DeportesPage;
