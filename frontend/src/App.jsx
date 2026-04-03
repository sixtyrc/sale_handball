import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Loader2 } from 'lucide-react';
import BrandingManager from './components/common/BrandingManager';

// Eager load for Login to ensure it appears fast for non-auth users
import LoginPage from './pages/LoginPage';

// Lazy loading the rest of the application
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SociosPage = lazy(() => import('./pages/SociosPage'));
const FinanzasPage = lazy(() => import('./pages/FinanzasPage'));
const DeportesPage = lazy(() => import('./pages/DeportesPage'));
const LocalesPage = lazy(() => import('./pages/LocalesPage'));
const ConfigPage = lazy(() => import('./pages/ConfigPage'));
const PinEntry = lazy(() => import('./modules/locales/PinEntry'));
const CanteenOperator = lazy(() => import('./modules/locales/CanteenOperator'));
const ManualPage = lazy(() => import('./modules/manual/ManualPage'));
const EventosPage = lazy(() => import('./pages/EventosPage'));
const EventoDetailPage = lazy(() => import('./pages/EventoDetailPage'));

// Portal del Socio (autogestión — autenticación propia via sessionStorage)
const SocioLoginPage = lazy(() => import('./pages/socio/SocioLoginPage'));
const SocioCambiarClavePage = lazy(() => import('./pages/socio/SocioCambiarClavePage'));
const SocioDashboardPage = lazy(() => import('./pages/socio/SocioDashboardPage'));


const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500">
    <Loader2 className="animate-spin" size={48} />
  </div>
);

function App() {
  return (
    <Router>
      <BrandingManager />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Rutas Públicas de Locales (Acceso por PIN) */}
          <Route path="/locales/:slug/login" element={<PinEntry />} />
          <Route path="/locales/:slug/pos" element={<CanteenOperator />} />

          {/* Portal del Socio (autenticación propia) */}
          <Route path="/socio/login" element={<SocioLoginPage />} />
          <Route path="/socio/cambiar-clave" element={<SocioCambiarClavePage />} />
          <Route path="/socio/dashboard" element={<SocioDashboardPage />} />

          {/* Login Central (Admin/Staff) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Protegidas de Administración */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/socios" element={<ProtectedRoute><SociosPage /></ProtectedRoute>} />
          <Route path="/finanzas" element={<ProtectedRoute><FinanzasPage /></ProtectedRoute>} />
          <Route path="/deportes" element={<ProtectedRoute><DeportesPage /></ProtectedRoute>} />
          <Route path="/locales" element={<ProtectedRoute><LocalesPage /></ProtectedRoute>} />
          <Route path="/config" element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />
          <Route path="/ayuda" element={<ProtectedRoute><ManualPage /></ProtectedRoute>} />
          <Route path="/eventos" element={<ProtectedRoute><EventosPage /></ProtectedRoute>} />
          <Route path="/eventos/:id" element={<ProtectedRoute><EventoDetailPage /></ProtectedRoute>} />
          
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

