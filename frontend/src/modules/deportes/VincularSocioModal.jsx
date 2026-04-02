import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { Search, UserPlus, Loader2, Check } from 'lucide-react';
import api from '../../services/api';

const VincularSocioModal = ({ isOpen, onClose, onSuccess, categoriaId }) => {
    const [socios, setSocios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSociosDisponibles();
        }
    }, [isOpen]);

    const fetchSociosDisponibles = async () => {
        try {
            setLoading(true);
            // Traemos todos los socios. En una versión más pro, filtraríamos los que ya tienen perfil.
            const response = await api.get('socios/');
            setSocios(response.data);
        } catch (error) {
            console.error('Error fetching socios para vinculación:', error);
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
            // Creamos un perfil deportivo para cada socio seleccionado en esta categoría
            await Promise.all(selectedIds.map(socioId => 
                api.post('deportes/perfiles/', {
                    socio: socioId,
                    categoria_actual: categoriaId,
                    estado_federativo: 'HABILITADO'
                })
            ));
            onSuccess();
            onClose();
            setSelectedIds([]);
        } catch (error) {
            console.error('Error vinculando socios:', error);
            alert('Error al vincular socios. Es posible que alguno ya tenga un perfil creado.');
        } finally {
            setSaving(false);
        }
    };

    const filteredSocios = socios.filter(s => 
        `${s.nombres} ${s.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dni.includes(searchTerm)
    );

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

                <div className="max-h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
                    ) : filteredSocios.length > 0 ? filteredSocios.map(socio => (
                        <div 
                            key={socio.id}
                            onClick={() => toggleSelection(socio.id)}
                            className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                                selectedIds.includes(socio.id) 
                                ? 'bg-blue-600/20 border-blue-500/50' 
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                    selectedIds.includes(socio.id) ? 'bg-blue-500 border-blue-500' : 'border-slate-700 bg-slate-950'
                                }`}>
                                    {selectedIds.includes(socio.id) && <Check size={14} className="text-white" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{socio.apellidos}, {socio.nombres}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">DNI: {socio.dni}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center py-10 text-slate-500 text-sm italic">No se encontraron socios disponibles.</p>
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
