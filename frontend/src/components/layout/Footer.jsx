import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full py-6 mt-12 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="container px-4 mx-auto">
                <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        © {currentYear} Todos los derechos reservados.
                    </p>
                    <p className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-300">
                        Desarrollado por{' '}
                        <a 
                            href="https://ctsoft.com.ar" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 underline decoration-blue-500/30 underline-offset-4"
                        >
                            CTSoft
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
