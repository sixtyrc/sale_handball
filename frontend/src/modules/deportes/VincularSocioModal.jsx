import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { Search, UserPlus, Loader2, Check, Info, Filter } from 'lucide-react';
import api from '../../services/api';
import { useUIStore } from '../../store/uiStore';

const VincularSocioModal = ({ isOpen, onClose, onSuccess, categoriaId, categoriaNombre }) => {
    const { addToast } = useUIStore();
    const [socios, setSocios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [saving, setSaving] = useState(false);
    const [onlyMatching, setOnlyMatching] = useState(true);

    const calculateAge = (dob) => {
        if (!dob) return null;
        try {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            return age;
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchSociosDisponibles();
        }
    }, [isOpen]);

    const fetchSociosDisponibles = async () => {
        try {
            setLoading(true);
            const response = await api.get(`socios/disponibles-vincular/?categoria_id=${categoriaId}`);
            setSocios(response.data);
        } catch (error) {
            console.error('Error fetching socios para vinculación:', error);
            addToast({
                type: 'error',
                title: 'Error de Datos',
                message: 'No pudimos obtener la lista de socios disponibles.'
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleVincular = async () => {
        if (selectedIds.length === 0) return;
        setSaving(true);
        try {
            await Promise.all(selectedIds.map(socioId => 
                api.post('deportes/perfiles/', {
                    socio: socioId,
                    categoria_actual: categoriaId,
                    estado_federativo: 'HABILITADO'
                })
            ));
            
            addToast({
                type: 'success',
                title: 'Vinculación Exitosa',
                message: `Se han vinculado ${selectedIds.length} jugadores a la categoría ${categoriaNombre || ''}.`
            });

            onSuccess();
            onClose();
            setSelectedIds([]);
        } catch (error) {
            console.error('Error vinculando socios:', error);
            addToast({
                type: 'error',
                title: 'Error de Vinculación',
                message: 'Hubo un problema al crear los perfiles deportivos. Intente nuevamente.'
            });
        } finally {
            setSaving(false);
        }
    };

    const filteredSocios = socios.filter(s => {
        const matchesSearch = `${s.nombres} ${s.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) || s.dni.includes(searchTerm);
        const matchesCategory = onlyMatching ? s.coincide_categoria : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Vincular Socios a Categoría">
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-blue-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sugerir por Edad/Sexo</span>
                    </div>
                    <button 
                        onClick={() => setOnlyMatching(!onlyMatching)}
                        className={`w-12 h-6 rounded-full transition-all relative ${onlyMatching ? 'bg-blue-600' : 'bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${onlyMatching ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Analizando disponibilidad...</p>
                        </div>
                    ) : filteredSocios.length > 0 ? filteredSocios.map(socio => (
                        <div 
                            key={socio.id}
                            onClick={() => toggleSelection(socio.id)}
                            className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border group ${
                                selectedIds.includes(socio.id) 
                                ? 'bg-blue-600/10 border-blue-500/50' 
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    selectedIds.includes(socio.id) ? 'bg-blue-500 border-blue-500' : 'border-slate-700 bg-slate-950 group-hover:border-slate-500'
                                }`}>
                                    {selectedIds.includes(socio.id) && <Check size={16} className="text-white" strokeWidth={3} />}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-white leading-none">{socio.apellidos}, {socio.nombres}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">DNI {socio.dni}</span>
                                        <span className="text-[9px] font-black text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                                            {calculateAge(socio.fecha_nacimiento)} años
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {socio.categoria_sugerida && (
                                <div className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${socio.coincide_categoria ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                                    {socio.categoria_sugerida}
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-slate-950/50 rounded-3xl border border-dashed border-slate-800">
                            <Info size={32} className="text-slate-700 mb-2" />
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Socio no encontrado</p>
                            <p className="text-[10px] text-slate-600 uppercase mt-1">Quizás ya está vinculado o no coincide el perfil</p>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                    <p className="text-xs text-slate-500">
                        {selectedIds.length} socios seleccionados
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-slate-400 font-bold hover:text-white">Cancelar</button>
                        <button 
                            disabled={selectedIds.length === 0 || saving}
                            onClick={handleVincular}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                        >
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                            Vincular Seleccionados
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default VincularSocioModal;
