import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import SocioFormModal from '../modules/socios/SocioFormModal';
import SocioEditModal from '../modules/socios/SocioEditModal';
import CarnetVirtual from '../modules/socios/CarnetVirtual';
import HistorialLesionesModal from '../modules/deportes/HistorialLesionesModal';
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
    Contact,
    Users,
    Activity,
    Stethoscope
} from 'lucide-react';

const SociosPage = () => {
    const [socios, setSocios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCarnetModalOpen, setIsCarnetModalOpen] = useState(false);
    const [isLesionesModalOpen, setIsLesionesModalOpen] = useState(false);
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

    const navigate = useNavigate();

    const calculateAge = (birthDate) => {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const getCategory = (age) => {
        if (age <= 10) return 'MINI';
        if (age <= 12) return 'INFANTILES';
        if (age <= 14) return 'MENORES';
        if (age <= 16) return 'CADETES';
        if (age <= 18) return 'JUVENILES';
        if (age <= 21) return 'JUNIORS';
        if (age <= 30) return 'MAYORES';
        return 'PAPIS_Y_MAMIS';
    };

    const formatWhatsAppNumber = (phone) => {
        if (!phone) return null;
        let numbersOnly = phone.replace(/\D/g, '');
        if (numbersOnly.startsWith('549') && numbersOnly.length > 10) numbersOnly = numbersOnly.substring(3);
        else if (numbersOnly.startsWith('54') && numbersOnly.length > 10) numbersOnly = numbersOnly.substring(2);
        return `549${numbersOnly}`;
    };

    return (
        <MainLayout>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-10">
                <div>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Socios</h2>
                    <p className="text-slate-400">Gestión de la base societaria del club</p>
                </div>
                
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <UserPlus size={18} />
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
            <div className="mb-8 relative w-full sm:max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, DNI o Nro. de Socio..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-light shadow-inner shadow-black/20"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 sm:pb-0">
                    {filteredSocios.map((socio) => {
                        const age = calculateAge(socio.fecha_nacimiento);
                        const category = getCategory(age);
                        const isMinor = age < 18;

                        return (
                            <div key={socio.id} className="bg-slate-900 border border-slate-800/50 hover:border-slate-700 transition-all p-5 rounded-[2.5rem] group relative overflow-hidden flex flex-col shadow-2xl">
                                {/* Accent Glow */}
                                <div className={`absolute -right-12 -top-12 w-24 h-24 blur-3xl opacity-10 transition-all group-hover:opacity-20 ${
                                    socio.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-red-500'
                                }`} />
                                
                                <div className="flex items-start justify-between mb-5 relative">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-all duration-500 overflow-hidden">
                                            {socio.foto ? (
                                                <img src={socio.foto} alt="Socio" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={28} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                                {socio.apellidos}, <span className="font-medium">{socio.nombres}</span>
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                <span className="text-[9px] text-slate-500 font-bold tracking-tight bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                                    #{socio.nro_socio || socio.dni}
                                                </span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                                    socio.estado === 'ACTIVO' 
                                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                                    : 'bg-slate-500/10 text-slate-500 border border-slate-500/10'
                                                }`}>
                                                    {socio.estado}
                                                </span>
                                                {socio.lesionado_activo && (
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                                                        <Activity size={10} /> LESIONADO
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button 
                                            onClick={() => setOpenMenuId(openMenuId === socio.id ? null : socio.id)}
                                            className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                        
                                        {openMenuId === socio.id && (
                                            <div className="absolute right-0 top-11 w-48 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/80 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <button 
                                                    onClick={() => handleEditClick(socio)}
                                                    className="w-full flex items-center gap-3 px-4 py-4 text-xs font-bold text-white hover:bg-slate-800 transition-colors text-left"
                                                >
                                                    <Edit size={16} className="text-blue-400" /> Editar Datos
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedSocio(socio); setIsCarnetModalOpen(true); setOpenMenuId(null); }}
                                                    className="w-full flex items-center gap-3 px-4 py-4 text-xs font-bold text-white hover:bg-slate-800 transition-colors text-left border-t border-slate-800"
                                                >
                                                    <Contact size={16} className="text-emerald-400" /> Ver Carnet Virtual
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedSocio(socio); setIsLesionesModalOpen(true); setOpenMenuId(null); }}
                                                    className="w-full flex items-center gap-3 px-4 py-4 text-xs font-bold text-white hover:bg-slate-800 transition-colors text-left border-t border-slate-800"
                                                >
                                                    <Stethoscope size={16} className="text-rose-400" /> Historial Lesiones
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleStatus(socio)}
                                                    className="w-full flex items-center gap-3 px-4 py-4 text-xs font-bold text-white hover:bg-slate-800 transition-colors text-left border-t border-slate-800"
                                                >
                                                    <Ban size={16} className={socio.estado === 'ACTIVO' ? 'text-amber-500' : 'text-emerald-500'} /> 
                                                    {socio.estado === 'ACTIVO' ? 'Desactivar Socio' : 'Activar Socio'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Category & Age Section */}
                                <div className="flex gap-2 mb-3">
                                    <div className="flex-1 bg-slate-950/50 border border-slate-800/80 p-2.5 rounded-2xl text-center">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Categoría</p>
                                        <p className="text-[11px] font-black text-blue-500 truncate">{category}</p>
                                    </div>
                                    <div className="w-16 bg-slate-950/50 border border-slate-800/80 p-2.5 rounded-2xl text-center">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Edad</p>
                                        <p className="text-[11px] font-black text-white">{age} <span className="text-[8px] text-slate-600">Años</span></p>
                                    </div>
                                </div>

                                {/* Descuentos Badge */}
                                {(socio.grupo_familiar_nombre || socio.porcentaje_beca > 0) && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {socio.grupo_familiar_nombre && (
                                            <div className="flex items-center gap-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2.5 py-1 rounded-full">
                                                <Users size={10} />
                                                <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[120px]">{socio.grupo_familiar_nombre}</span>
                                                {socio.descuento_familiar > 0 && (
                                                    <span className="text-[10px] font-black text-violet-300 ml-0.5">−{socio.descuento_familiar}%</span>
                                                )}
                                            </div>
                                        )}
                                        {socio.porcentaje_beca > 0 && (
                                            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">
                                                <span className="text-[10px] font-black uppercase tracking-tight">Beca {socio.porcentaje_beca}%</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-3.5 mb-6 px-1">
                                    <div className="flex items-center justify-between text-slate-400">
                                        <div className="flex items-center gap-3">
                                            <Phone size={14} className="text-slate-600 shrink-0" />
                                            <span className="text-xs font-medium tracking-tight">
                                                {socio.telefono ? `+54 9 ${socio.telefono}` : 'Sin teléfono'}
                                            </span>
                                        </div>
                                        {socio.telefono && (
                                            <a 
                                                href={`https://wa.me/${formatWhatsAppNumber(socio.telefono)}?text=Hola%20${encodeURIComponent(socio.nombres)}!`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 p-2 rounded-xl transition-all"
                                                title="WhatsApp Socio"
                                            >
                                                <MessageCircle size={14} />
                                            </a>
                                        )}
                                    </div>

                                    {isMinor && socio.tel_tutor && (
                                        <div className="flex items-center justify-between p-3 bg-blue-600/5 rounded-2xl border border-blue-600/10 animate-in fade-in slide-in-from-top-2 duration-700">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0">
                                                    <Contact size={14} className="text-blue-500" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest truncate">A cargo de: {socio.parentesco_tutor || 'Tutor'}</p>
                                                    <p className="text-[10px] font-bold text-slate-300 truncate">{socio.nombre_tutor}</p>
                                                </div>
                                            </div>
                                            <a 
                                                href={`https://wa.me/${formatWhatsAppNumber(socio.tel_tutor)}?text=Hola%20${encodeURIComponent(socio.nombre_tutor)},%20te%20contacto%20del%20Club%20por%20${encodeURIComponent(socio.nombres)}...`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                                                title="WhatsApp Tutor"
                                            >
                                                <MessageCircle size={14} />
                                            </a>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Mail size={14} className="text-slate-600" />
                                        <span className="text-xs font-medium truncate">{socio.email_contacto || 'Sin email'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <div className="flex justify-center text-[8px] font-black text-slate-600 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">DNI</div>
                                        <span className="text-xs font-bold font-mono tracking-tighter opacity-80">{socio.dni}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <button 
                                        onClick={() => handleEditClick(socio)}
                                        className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all active:scale-95"
                                    >
                                        Ficha
                                    </button>
                                    <button 
                                        onClick={() => navigate(`/finanzas?dni=${socio.dni}`)}
                                        className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600/10 hover:bg-blue-600 hover:text-white text-[10px] font-black uppercase tracking-widest text-blue-500 transition-all shadow-xl shadow-blue-600/5 active:scale-95 border border-blue-600/20"
                                    >
                                        Cuenta
                                    </button>
                                </div>
                            </div>
                        );
                    })}
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

            {isLesionesModalOpen && selectedSocio && (
                <HistorialLesionesModal 
                    isOpen={isLesionesModalOpen}
                    onClose={() => { setIsLesionesModalOpen(false); setSelectedSocio(null); fetchSocios(); }}
                    socio={selectedSocio}
                />
            )}
        </MainLayout>
    );
};

export default SociosPage;
