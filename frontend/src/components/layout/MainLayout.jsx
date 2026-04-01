import React from 'react';
import Footer from './Footer';

const MainLayout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Header / Navbar vendrá en futuras fases (Fase 8) */}
            
            <main className="flex-grow">
                <div className="container px-4 py-8 mx-auto">
                    {children}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default MainLayout;
