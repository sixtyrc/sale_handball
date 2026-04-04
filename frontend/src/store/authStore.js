import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1/',
});

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  env: import.meta.env.VITE_APP_ENV || 'dev',
  version: import.meta.env.VITE_APP_VERSION || 'v1.0.0',
  branding: null,

  fetchBranding: async (slug) => {
    // FORZADO DE LOCALHOST: Si estamos en dev local, forzamos 'salesianos'
    const cleanSlug = (slug === 'localhost' || slug === '127.0.0.1') ? 'salesianos' : slug;
    
    try {
      const response = await api.get(`admin-club/branding/${cleanSlug || 'salesianos'}/`);
      set({ branding: response.data });
      
      // Dinamizar favicon y título de la pestaña
      if (response.data.club_nombre) {
        document.title = response.data.club_nombre;
      }
      if (response.data.logo) {
        const link = document.querySelector("link[rel~='icon']");
        if (link) {
          link.href = response.data.logo.startsWith('http') 
            ? response.data.logo 
            : `http://localhost:8000${response.data.logo}`;
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Branding fetch failed:', error);
      return null;
    }
  },

  login: async (username, password) => {
    try {
      const response = await api.post('login/', { username, password });
      const { access, user, primer_ingreso } = response.data;
      
      // SOLO si no es SOCIO guardamos en localStorage general (Admin/Staff/Profe)
      // Si es SOCIO, lo manejamos por sesión o redirect, para que no ensucie el Dashboard pro
      if (user.role !== 'SOCIO') {
        localStorage.setItem('token', access);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token: access, isAuthenticated: true });
      }
      
      return { 
        success: true, 
        user, 
        token: access, 
        primer_ingreso 
      };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
