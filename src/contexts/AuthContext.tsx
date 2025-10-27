import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

export interface User {
  id: number;
  nombres: string;
  apellidos: string;
  usuario: string;
  correo: string;
  estamento: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (usuario: string, contraseña: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        const hasToken = authService.isAuthenticated();
        
        if (currentUser && hasToken) {
          try {
            // Verificar si el token sigue siendo válido
            const profile = await authService.getProfile();
            setUser(profile);
          } catch (error) {
            console.warn('Token inválido, limpiando datos:', error);
            // Token inválido, limpiar datos
            authService.logout();
            setUser(null);
          }
        } else {
          // No hay usuario o token, asegurar que esté limpio
          setUser(null);
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (usuario: string, contraseña: string) => {
    try {
      // Usar axios directamente como en TestLogin para evitar problemas del interceptor
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario, contraseña }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al iniciar sesión');
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.usuario));
        setUser(data.usuario);
      } else {
        throw new Error('No se recibió token del servidor');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};