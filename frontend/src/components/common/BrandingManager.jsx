import React, { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

const BrandingManager = () => {
  const { branding, user, fetchBranding } = useAuthStore();

  useEffect(() => {
    if (!branding) {
      fetchBranding(user?.club_slug || 'salesianos');
    }
  }, [user]);

  useEffect(() => {
    if (branding) {
      // 1. Actualizar Título
      document.title = branding.nombre_institucional || branding.club_nombre || 'Sistema de Gestión';

      // 2. Actualizar Favicon
      if (branding.logo) {
        const favicon = document.getElementById('favicon');
        if (favicon) {
          const fullLogoUrl = branding.logo.startsWith('http') 
            ? branding.logo 
            : `http://localhost:8000${branding.logo}`;
          favicon.href = fullLogoUrl;
        }
      }
    }
  }, [branding]);

  return null;
};

export default BrandingManager;
