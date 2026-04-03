import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import SocioFormModal from '../modules/socios/SocioFormModal';
import SocioEditModal from '../modules/socios/SocioEditModal';
import CarnetVirtual from '../modules/socios/CarnetVirtual';
import Modal from '../components/common/Modal'; // Asumiento que existe
import { 
    Search, 
    UserPlus, 
    Phone, 
    Mail, 
    MoreVertical, 
    User,
    CheckCircle2,
    XCircle,
    Loader2,
    Edit,
    Trash2,
    Ban,
    MessageCircle,
    Contact
} from 'lucide-react';

const SociosPage = () => {
    const [socios, setSocios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCarnetModalOpen, setIsCarnetModalOpen] = useState(false);
    const [selectedSocio, setSelectedSocio] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [clubConfig, setClubConfig] = useState(null);

    useEffect(() => {
        fetchSocios();
        fetchClubConfig();
    }, []);

    const fetchClubConfig = async () => {
        try {
            // Unificamos la obtención de marca para administradores
            const response = await api.get('admin-club/config/');
            setClubConfig(response.data);
        } catch (error) {
            console.error('Error fetching club config:', error);
        }
    };

    const fetchSocios = async () => {
        try {
            const response = await api.get('socios/');
            setSocios(response.data);
        } catch (error) {
            console.error('Error fetching socios:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSocios = socios.filter(s => 
        `${s.nombres} ${s.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dni.includes(searchTerm) ||
        (s.nro_socio && s.nro_socio.includes(searchTerm))
    );

    const handleEditClick = (socio) => {
        setSelectedSocio(socio);
        setIsEditModalOpen(true);
        setOpenMenuId(null);
    };

    const handleToggleStatus = async (socio) => {
        try {
            const newStatus = socio.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
            await api.patch(`socios/${socio.id}/`, { estado: newStatus });
            fetchSocios();
            setOpenMenuId(null);
        } catch (error) {
        }
    };

    const formatWhatsAppNumber = (phone) => {
        if (!phone) return null;
        let numbersOnly = phone.replace(/\D/g, '');
        // Remove 54 or 549 prefixes if user accidentally pasted them, to normalize.
        if (numbersOnly.startsWith('549') && numbersOnly.length > 10) numbersOnly = numbersOnly.substring(3);
        else if (numbersOnly.startsWith('54') && numbersOnly.length > 10) numbersOnly = numbersOnly.substring(2);
        
        return `549${numbersOnly}`;
    };

    return (
        <MainLayout>
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Socios</h2>
                    <p className="text-slate-400">Gestión de la base societaria del club</p>
                </div>
                
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <UserPlus size={20} />
                    Nuevo Socio
                </button>
            </div>

            <SocioFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchSocios} 
            />

            <SocioEditModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedSocio(null); }}
                onSuccess={fetchSocios}
                socio={selectedSocio}
            />

            {/* Filters */}
            <div className="mb-8 relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, DNI o Nro. de Socio..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-light"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
                    <Loader2 className="animate-spin" size={40} />
                    <p className="text-sm font-medium uppercase tracking-widest">Cargando Socios...</p>
                </div>
            ) : filteredSocios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSocios.map((socio) => (
                        <div key={socio.id} className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all p-6 rounded-3xl group relative overflow-hidden">
                            {/* Accent Glow */}
                            <div className={`absolute -right-12 -top-12 w-24 h-24 blur-3xl opacity-10 transition-all group-hover:opacity-20 ${
                                socio.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-red-500'
                            }`} />
                            
                            <div className="flex items-start justify-between mb-6 relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600/20 group-hover:text-blue-500 transition-colors duration-300">
                                        <User size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {socio.apellidos}, {socio.nombres}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500 font-mono tracking-tight bg-slate-800 pr-2 pl-2 py-1 rounded border border-slate-700 font-bold">
                                                {socio.nro_socio ? `SOCIO: ${socio.nro_socio}` : `DNI: ${socio.dni}`}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                socio.estado === 'ACTIVO' 
                                                ? 'bg-emerald-500/10 text-emerald-500' 
                                                : socio.estado === 'INACTIVO' 
                                                ? 'bg-slate-500/10 text-slate-500' 
                                                : 'bg-red-500/10 text-red-500'
                                            }`}>
                                                {socio.estado}
                                            </span>
                                            {(!socio.telefono || !socio.email_contacto || !socio.grupo_sanguineo || !socio.sexo) && (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/10 animate-pulse">
                                                    FICHA INCOMPLETA
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button 
                                        onClick={() => setOpenMenuId(openMenuId === socio.id ? null : socio.id)}
                                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all"
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                    
                                    {openMenuId === socio.id && (
                                        <div className="absolute right-0 top-10 w-48 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden">
                                            <button 
                                                onClick={() => handleEditClick(socio)}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-slate-700 transition-colors text-left"
                                            >
                                                <Edit size={16} className="text-blue-400" /> Editar Datos
                                            </button>
                                            <button 
                                                onClick={() => { setSelectedSocio(socio); setIsCarnetModalOpen(true); setOpenMenuId(null); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-slate-700 transition-colors text-left border-t border-slate-700"
                                            >
                                                <Contact size={16} className="text-emerald-400" /> Ver Carnet Virtual
                                            </button>
                                            <button 
                                                onClick={() => handleToggleStatus(socio)}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-slate-700 transition-colors text-left border-t border-slate-700"
                                            >
                                                <Ban size={16} className={socio.estado === 'ACTIVO' ? 'text-amber-500' : 'text-emerald-500'} /> 
                                                {socio.estado === 'ACTIVO' ? 'Desactivar Socio' : 'Activar Socio'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3.5 mb-6">
                                <div className="flex items-center justify-between text-slate-400 group-hover:text-slate-300">
                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-slate-600 shrink-0" />
                                        <span className="text-sm font-light">
                                            {socio.telefono ? `+54 9 ${socio.telefono}` : 'Sin teléfono'}
                                        </span>
                                    </div>
                                    {socio.telefono && (
                                        <a 
                                            href={`https://wa.me/${formatWhatsAppNumber(socio.telefono)}?text=Hola%20${encodeURIComponent(socio.nombres)}!`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 p-1.5 rounded-full transition-all flex items-center justify-center shrink-0"
                                            title="Enviar WhatsApp"
                                        >
                                            <MessageCircle size={16} />
                                        </a>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-300">
                                    <Mail size={16} className="text-slate-600" />
                                    <span className="text-sm font-light truncate">{socio.email_contacto || 'Sin email'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-300">
                                    <div className="w-4 flex justify-center text-slate-600 font-bold text-[10px]">DNI</div>
                                    <span className="text-sm font-light font-mono pr-2 pl-2 py-0.5 bg-slate-800/30 rounded">{socio.dni}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                <button 
                                    onClick={() => handleEditClick(socio)}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white transition-all"
                                >
                                    Ficha
                                </button>
                                <button 
                                    onClick={() => window.location.href = '/finanzas'}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-sm font-bold text-blue-500 transition-all"
                                >
                                    Cuenta
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                    <p className="text-slate-500 mb-2">No se encontraron socios que coincidan con la búsqueda.</p>
                    <button className="text-blue-500 font-bold hover:underline" onClick={() => setSearchTerm('')}>Limpiar búsqueda</button>
                </div>
            )}
            <Modal 
                isOpen={isCarnetModalOpen} 
                onClose={() => { setIsCarnetModalOpen(false); setSelectedSocio(null); }} 
                title="Carnet de Socio Virtual"
            >
                {selectedSocio && (
                    <div className="flex flex-col items-center">
                        <CarnetVirtual socio={selectedSocio} club={clubConfig} />
                        <button 
                            onClick={() => window.print()} 
                            className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700"
                        >
                            Imprimir / Descargar
                        </button>
                    </div>
                )}
            </Modal>
        </MainLayout>
    );
};

export default SociosPage;
