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

  login: async (username, password) => {
    try {
      const response = await api.post('login/', { username, password });
      const { access, user } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token: access, isAuthenticated: true });
      return { success: true };
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
