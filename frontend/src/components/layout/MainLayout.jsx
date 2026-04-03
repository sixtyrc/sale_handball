import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { Menu, X } from 'lucide-react';
import { APP_VERSION } from '../../version';

import ToastContainer from '../common/ToastContainer';

const MainLayout = ({ children }) => {
    const { user } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-900 overflow-hidden font-inter">
            <ToastContainer />
            
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            <main className="flex-grow lg:ml-64 w-full lg:w-auto h-[100dvh] overflow-y-auto bg-slate-950 transition-all duration-300 relative">
                {/* Mobile Header Topbar */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-30">
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Handball</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">{user?.club_name || 'Club'}</p>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 bg-slate-800 rounded-xl text-slate-300 active:scale-95"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-fade-in">
                    {children}
                </div>
                
                <footer className="mt-12 pt-8 border-t border-slate-800 pb-8 text-center bg-slate-950/50">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex items-center justify-center gap-2">
                        <span>{user?.club_name || 'Salesianos'} Handball</span>
                        <span className="text-slate-800">|</span> 
                        <span>Potenciado por</span>
                        <a 
                            href="https://ctsoft.com.ar" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-400 transition-colors underline underline-offset-4 decoration-blue-500/30"
                        >
                            CTSoft
                        </a>
                        <span className="text-slate-800 ml-2">v{APP_VERSION}</span>
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default MainLayout;

