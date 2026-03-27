import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { NotificationsProvider } from './hooks/useNotifications';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import AdvertiserDashboard from './AdvertiserDashboard';
import CreatorDashboard from './CreatorDashboard';
import AdminDashboard from './AdminDashboard';

// Componente para rutas protegidas
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Componente principal de rutas
const AppRoutes = () => {
  const { user, loading } = useAuth();

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/auth" 
            element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
          />

          {/* Rutas protegidas del dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                {user?.rol === 'creador' && <CreatorDashboard />}
                {user?.rol === 'anunciante' && <AdvertiserDashboard />}
                {user?.rol === 'admin' && <AdminDashboard />}
                {!['creador', 'anunciante', 'admin'].includes(user?.rol) && (
                  <Navigate to="/" replace />
                )}
              </ProtectedRoute>
            } 
          />

          {/* Rutas específicas por rol */}
          <Route 
            path="/creator/*" 
            element={
              <ProtectedRoute allowedRoles={['creador']}>
                <CreatorDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/advertiser/*" 
            element={
              <ProtectedRoute allowedRoles={['anunciante']}>
                <AdvertiserDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Ruta catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

// Componente principal de la aplicación
function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AppRoutes />
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
