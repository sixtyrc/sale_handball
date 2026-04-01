import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PinEntry from './modules/locales/PinEntry';
import CanteenOperator from './modules/locales/CanteenOperator';
import ManualPage from './modules/manual/ManualPage';
import MainLayout from './components/layout/MainLayout';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        {/* Rutas Públicas de Locales (Acceso por PIN) */}
        <Route path="/locales/:slug/login" element={<PinEntry />} />
        <Route path="/locales/:slug/pos" element={<CanteenOperator />} />

        {/* Login Central */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} 
        />

        {/* Rutas Protegidas de Administración */}
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? (
              <MainLayout>
                <div>Dashboard coming soon... (Historial de Jornadas estará aquí)</div>
              </MainLayout>
            ) : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/ayuda" 
          element={
            isAuthenticated ? (
              <ManualPage />
            ) : <Navigate to="/login" />
          } 
        />
        
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
