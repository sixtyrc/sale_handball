import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    CreditCard, 
    Trophy, 
    Settings, 
    LogOut,
    Store,
    Calendar,
    FileText,
    ShieldCheck,
    X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import logoFallback from '../../assets/logo_club.png';
import { useEffect } from 'react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { logout, user, branding, fetchBranding } = useAuthStore();

    useEffect(() => {
        if (!branding) {
            fetchBranding(user?.club_slug || 'salesianos');
        }
    }, [branding, user]);

    const currentLogo = branding?.logo 
        ? (branding.logo.startsWith('http') ? branding.logo : `${window.location.hostname === 'localhost' ? 'http://localhost:8002' : ''}${branding.logo}`) 
        : logoFallback;

    const allNavItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'PROFESOR', 'SOCIO_TUTOR', 'DIRIGENTE'] },
        { to: '/socios', icon: Users, label: 'Socios', roles: ['ADMIN', 'DIRIGENTE'] },
        { to: '/staff', icon: ShieldCheck, label: 'Staff Técnico', roles: ['ADMIN', 'DIRIGENTE'] },
        { to: '/finanzas', icon: CreditCard, label: 'Finanzas', roles: ['ADMIN', 'DIRIGENTE'] },
        { to: '/deportes', icon: Trophy, label: 'Categorías', roles: ['ADMIN', 'PROFESOR', 'DIRIGENTE'] },
        { to: '/eventos', icon: Calendar, label: 'Partidos', roles: ['ADMIN', 'PROFESOR', 'DIRIGENTE'] },
        { to: '/locales', icon: Store, label: 'Somos Local', roles: ['ADMIN', 'DIRIGENTE'] },
        { to: '/config', icon: Settings, label: 'Configuración', roles: ['ADMIN'] },
        { to: '/ayuda', icon: FileText, label: 'Manual & Ayuda', roles: ['ADMIN', 'PROFESOR', 'DIRIGENTE'] },
    ];

    // Filtrar items según el rol del usuario actual (insensible a mayúsculas)
    const navItems = allNavItems.filter(item => {
        const userRole = (user?.role || 'SOCIO_TUTOR').toUpperCase();
        return item.roles.includes(userRole);
    });

    return (
        <aside className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-[100dvh] fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="relative">
                    <div className="absolute -inset-1 bg-blue-500/20 rounded-full blur-sm"></div>
                    <img 
                        src={currentLogo} 
                        alt="Logo" 
                        className="relative w-10 h-10 object-contain rounded-lg"
                    />
                </div>
                <div className="overflow-hidden">
                    <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent truncate tracking-tighter leading-none">
                        {branding?.club_nombre?.split(' ')[1] || 'Handball'}
                    </h1>
                    <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest font-bold truncate">
                        {branding?.club_nombre?.split(' ')[0] || 'Salesianos'}
                    </p>
                </div>
                {/* Mobile close button */}
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-slate-800 rounded-xl text-slate-400 lg:hidden"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsOpen && setIsOpen(false)}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${isActive 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                        `}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800 mt-auto">
                <div className="flex items-center gap-3 px-4 py-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold">
                        {user?.username?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{user?.username || 'Administrador'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.role || 'Admin'}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium"
                >
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
