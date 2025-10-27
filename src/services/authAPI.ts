import axios from 'axios';
import { getApiBaseUrl } from './api';

// Detecta automáticamente la URL del backend
const API_URL = getApiBaseUrl(); // URL del backend

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token (excluyendo rutas públicas)
api.interceptors.request.use(
  (config) => {
    // Rutas que NO necesitan token
    const rutasPublicas = ['/api/auth/login', '/api/auth/register'];
    const esRutaPublica = rutasPublicas.some(ruta => config.url?.includes(ruta));
    
    if (!esRutaPublica) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const authAPI = {
  login: async (usuario: string, contraseña: string) => {
    const response = await api.post('/api/auth/login', {
      usuario,
      contraseña,
    });
    return response.data;
  },

  register: async (userData: {
    nombres: string;
    apellidos: string;
    usuario: string;
    correo: string;
    contraseña: string;
    estamento: string;
  }) => {
    // Datos correctos para el backend (campos corregidos)
    const backendData = {
      nombres: userData.nombres,
      apellidos: userData.apellidos,
      usuario: userData.usuario,
      correo: userData.correo,  // Cambiado de 'email' a 'correo'
      contraseña: userData.contraseña,
      estamento: userData.estamento  // Cambiado de 'rol' a 'estamento'
    };
    const response = await api.post('/api/auth/register', backendData);  // Nueva ruta
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  refreshToken: async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        throw new Error('No hay token para renovar');
      }

      const response = await api.post('/api/auth/refresh-token');
      const { token } = response.data;
      
      // Actualizar el token en localStorage
      localStorage.setItem('token', token);
      
      return response.data;
    } catch (error) {
      // Si falla la renovación, limpiar el almacenamiento
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  forgotPassword: async (correo: string) => {
    const response = await api.post('/api/auth/forgot-password', { correo });
    return response.data;
  },

  resetPassword: async (token: string, nuevaContraseña: string) => {
    const response = await api.post('/api/auth/reset-password', { 
      token, 
      nuevaContraseña 
    });
    return response.data;
  },
};

export default authAPI;