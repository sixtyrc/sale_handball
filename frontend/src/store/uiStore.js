import { create } from 'zustand';

export const useUIStore = create((set) => ({
    toasts: [],
    
    /**
     * Añade una notificación tipo Toast.
     * @param {Object} toast - { message, type: 'success' | 'error' | 'info' | 'warning', duration?: number }
     */
    addToast: (toast) => {
        const id = Date.now();
        const duration = toast.duration || (toast.type === 'error' ? 5000 : 3000);
        
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }]
        }));

        // Auto-remove
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id)
            }));
        }, duration);
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }));
    }
}));
