import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import api from '../services/api';
import StaffFormModal from '../modules/socios/StaffFormModal';
import SocioEditModal from '../modules/socios/SocioEditModal'; // Reusable for editing
import CarnetVirtual from '../modules/socios/CarnetVirtual';
import Modal from '../components/common/Modal'; 
import { generateSocioPDF } from '../utils/pdfGenerator';
import { useUIStore } from '../store/uiStore';

import { 
    Search, 
    UserPlus, 
    Phone, 
    Mail, 
    MoreVertical, 
    User,
    Loader2,
    Edit,
    Ban,
    MessageCircle,
    Contact,
    Download,
    ShieldCheck
} from 'lucide-react';

const StaffPage = () => {
    const { addToast } = useUIStore();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCarnetModalOpen, setIsCarnetModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [clubConfig, setClubConfig] = useState(null);

    useEffect(() => {
        fetchStaff();
        fetchClubConfig();
    }, []);

    const fetchClubConfig = async () => {
        try {
            const response = await api.get('admin-club/config/');
            setClubConfig(response.data);
        } catch (error) {
            console.error('Error fetching club config:', error);
        }
    };

    const fetchStaff = async () => {
        try {
            const response = await api.get('socios/?es_profesor=true');
            setStaff(response.data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStaff = staff.filter(s => 
        `${s.nombres} ${s.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dni.includes(searchTerm)
    );

    const handleEditClick = (member) => {
        setSelectedMember(member);
        setIsEditModalOpen(true);
        setOpenMenuId(null);
    };

    const handleToggleStatus = async (member) => {
        try {
            const newStatus = member.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
            await api.patch(`socios/${member.id}/`, { estado: newStatus });
            fetchStaff();
            setOpenMenuId(null);
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'No se pudo cambiar el estado.' });
        }
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
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="text-amber-500" size={32} />
                        <h2 className="text-4xl font-extrabold text-white tracking-tight">Staff Técnico</h2>
                    </div>
                    <p className="text-slate-400 font-medium">Gestión de profesores, entrenadores y equipo administrativo</p>
                </div>
                
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                    <UserPlus size={18} />
                    Dar de Alta Staff
                </button>
            </div>

            <StaffFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchStaff} 
            />

            <SocioEditModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedMember(null); }}
                onSuccess={fetchStaff}
                socio={selectedMember}
            />

            {/* Filters */}
            <div className="mb-8 relative w-full sm:max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o DNI de profesor..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-light shadow-inner shadow-black/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
                    <Loader2 className="animate-spin text-amber-500" size={40} />
                    <p className="text-sm font-black uppercase tracking-widest">Sincronizando Staff...</p>
                </div>
            ) : filteredStaff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 sm:pb-0">
                    {filteredStaff.map((member) => {
                        return (
                            <div key={member.id} className="bg-slate-900 border border-slate-800/50 hover:border-amber-500/30 transition-all p-5 rounded-[2.5rem] group relative overflow-hidden flex flex-col shadow-2xl">
                                {/* Accent Glow */}
                                <div className={`absolute -right-12 -top-12 w-24 h-24 blur-3xl opacity-10 transition-all group-hover:opacity-30 ${
                                    member.estado === 'ACTIVO' ? 'bg-amber-500' : 'bg-red-500'
                                }`} />
                                
                                <div className="flex items-start justify-between mb-5 relative">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-all duration-500 overflow-hidden">
                                            {member.foto ? (
                                                <img src={member.foto} alt="Staff" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={28} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white leading-tight group-hover:text-amber-500 transition-colors uppercase tracking-tight">
                                                {member.apellidos}, <span className="font-medium text-slate-400">{member.nombres}</span>
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                <span className="text-[9px] text-amber-500 font-black tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 uppercase">
                                                    PROFESOR / STAFF
                                                </span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                                    member.estado === 'ACTIVO' 
                                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                                    : 'bg-slate-500/10 text-slate-500 border border-slate-500/10'
                                                }`}>
                                                    {member.estado}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button 
                                            onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                                            className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                        
                                        {openMenuId === member.id && (
                                            <div className="absolute right-0 top-11 w-48 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/80 z-20 overflow-hidden">
                                                <button 
                                                    onClick={() => handleEditClick(member)}
                                                    className="w-full flex items-center gap-3 px-4 py-4 text-xs font-bold text-white hover:bg-slate-800 transition-colors text-left"
                                                >
                                                    <Edit size={16} className="text-blue-400" /> Editar Perfil
                                                </button>
                                                <button 
                                                    onClick={async () => { 
                                                        setOpenMenuId(null);
                                                        await generateSocioPDF(member, clubConfig);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-4 text-xs font-bold text-white hover:bg-slate-800 transition-colors text-left border-t border-slate-800"
                                                >
                                                    <Download size={16} className="text-violet-400" /> Descargar Ficha
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedMember(member); setIsCarnetModalOpen(true); setOpenMenuId(null); }}
                                                    className="w-full flex items-center gap-3 px-4 py-4 text-xs font-bold text-white hover:bg-slate-800 transition-colors text-left border-t border-slate-800"
                                                >
                                                    <Contact size={16} className="text-amber-500" /> Credencial Virtual
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleStatus(member)}
                                                    className="w-full flex items-center gap-3 px-4 py-4 text-xs font-bold text-white hover:bg-slate-800 transition-colors text-left border-t border-slate-800"
                                                >
                                                    <Ban size={16} className={member.estado === 'ACTIVO' ? 'text-amber-500' : 'text-emerald-500'} /> 
                                                    {member.estado === 'ACTIVO' ? 'Dar de Baja' : 'Re-Activar'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3.5 mb-6 px-1 mt-auto">
                                    <div className="flex items-center justify-between text-slate-400">
                                        <div className="flex items-center gap-3">
                                            <Phone size={14} className="text-slate-600 shrink-0" />
                                            <span className="text-xs font-medium tracking-tight">
                                                {member.telefono ? `+54 9 ${member.telefono}` : 'Sin teléfono'}
                                            </span>
                                        </div>
                                        {member.telefono && (
                                            <a 
                                                href={`https://wa.me/${formatWhatsAppNumber(member.telefono)}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 p-2 rounded-xl transition-all"
                                            >
                                                <MessageCircle size={14} />
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Mail size={14} className="text-slate-600" />
                                        <span className="text-xs font-medium truncate">{member.email_contacto || 'Sin email'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <div className="flex justify-center text-[8px] font-black text-slate-600 bg-slate-950 px-1 py-0.5 rounded border border-slate-800 uppercase">DNI</div>
                                        <span className="text-xs font-bold font-mono tracking-tighter opacity-80">{member.dni}</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleEditClick(member)}
                                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500 transition-all active:scale-95"
                                >
                                    Ver Ficha de Personal
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                    <p className="text-slate-500 mb-2">No hay personal registrado en el staff técnico aún.</p>
                    <button className="text-amber-500 font-bold hover:underline" onClick={() => setIsModalOpen(true)}>Registrar primer profesor</button>
                </div>
            )}
            <Modal 
                isOpen={isCarnetModalOpen} 
                onClose={() => { setIsCarnetModalOpen(false); setSelectedMember(null); }} 
                title="Credencial Digital Staff"
            >
                {selectedMember && (
                    <div className="flex flex-col items-center">
                        <CarnetVirtual socio={selectedMember} club={clubConfig} />
                        <p className="mt-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">Personal Autorizado</p>
                    </div>
                )}
            </Modal>
        </MainLayout>
    );
};

export default StaffPage;
