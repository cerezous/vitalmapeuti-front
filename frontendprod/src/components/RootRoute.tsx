import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RootRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Mostrar spinner mientras se carga la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Redirigir basado en el estado de autenticación
  if (isAuthenticated) {
    // Si ya estamos en una ruta del dashboard, no redirigir
    if (location.pathname.startsWith('/dashboard')) {
      return null; // No hacer nada, dejar que el Dashboard maneje la ruta
    }
    // Solo redirigir a inicio si estamos en la raíz exacta
    if (location.pathname === '/' || location.pathname === '') {
      return <Navigate to="/dashboard/inicio" replace />;
    }
    // Para cualquier otra ruta, no hacer nada
    return null;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default RootRoute;
