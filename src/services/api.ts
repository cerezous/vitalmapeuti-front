import axios from 'axios';

// Detecta automáticamente la URL del backend
// Si accedes desde tu celular o red local, usará la IP de donde se cargó el frontend
// Si accedes desde localhost, usará localhost
const getApiBaseUrl = () => {
  console.log('🔍 DEBUG API URL:', {
    'REACT_APP_API_URL': process.env.REACT_APP_API_URL,
    'window.location.hostname': window.location.hostname,
    'window.location.origin': window.location.origin,
    'NODE_ENV': process.env.NODE_ENV
  });
  
  // Si hay una variable de entorno, úsala (para producción)
  if (process.env.REACT_APP_API_URL) {
    console.log('✅ Usando REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Si estamos en localhost, usar localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🏠 Usando localhost API');
    return 'http://localhost:3001/api';
  }
  
  // Si estamos en una IP de red local, usar esa IP
  const fallbackUrl = `http://${window.location.hostname}:3001/api`;
  console.log('🌐 Usando fallback URL:', fallbackUrl);
  return fallbackUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Debug: mostrar la URL que se está usando
console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token (excluyendo rutas públicas)
api.interceptors.request.use((config) => {
  // Rutas que NO necesitan token
  const rutasPublicas = ['/auth/login', '/auth/register'];
  const esRutaPublica = rutasPublicas.some(ruta => config.url?.includes(ruta));
  
  if (!esRutaPublica) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token agregado a request:', config.url, token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No se encontró token para petición protegida:', config.url);
    }
  } else {
    console.log('🌐 Ruta pública, sin token:', config.url);
  }
  return config;
});

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response exitosa:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Error en response:', error.config?.url, error.response?.status, error.message);
    if (error.response?.status === 401) {
      console.log('🔒 Token inválido, limpiando localStorage y redirigiendo a login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.warn('⚠️ Sin autorización (403) para:', error.config?.url);
      // No redirigir automáticamente en 403, solo loguear el warning
    }
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  usuario: string;
  contraseña: string;
}

export interface RegisterData {
  nombres: string;
  apellidos: string;
  estamento: string;
  correo: string;
  contraseña: string;
}

export interface User {
  id: number;
  nombres: string;
  apellidos: string;
  usuario: string;
  correo: string;
  estamento: string;
}

export interface LoginResponse {
  token: string;
  usuario: User;
  mensaje: string;
}

export interface Paciente {
  id: number;
  nombreCompleto: string;
  rut: string;
  numeroFicha: string;
  edad: number;
  fechaIngresoUTI: string;
  fechaEgresoUTI?: string | null;
  camaAsignada?: number;
  createdAt: string;
  updatedAt: string;
  ultimoApache?: {
    puntaje: number;
    fecha: string;
  } | null;
  ultimoNAS?: {
    puntaje: number;
    fecha: string;
  } | null;
  ultimaCategorizacion?: {
    complejidad: string;
    puntaje: number;
    fecha: string;
  } | null;
}

export interface PacienteInput {
  nombreCompleto: string;
  rut: string;
  numeroFicha: string;
  edad: string;
  fechaIngresoUTI: string;
  camaAsignada?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post('/auth/login', credentials);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.usuario));
    }
    
    return response.data;
  }

  async register(userData: RegisterData): Promise<User> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data;
  }

  async refreshToken(): Promise<LoginResponse> {
    const response = await api.post('/auth/refresh-token');
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.usuario));
    }
    
    return response.data;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();

class PacienteService {
  async obtenerPacientes(): Promise<Paciente[]> {
    const response = await api.get<ApiResponse<Paciente[]>>('/pacientes');
    return response.data.data || [];
  }

  async obtenerPacientesEgresadosRecientes(): Promise<Paciente[]> {
    const response = await api.get<ApiResponse<Paciente[]>>('/pacientes/egresados-recientes');
    return response.data.data || [];
  }

  async obtenerPacientesParaProcedimientos(): Promise<{ activos: Paciente[], egresadosRecientes: Paciente[] }> {
    try {
      const [activosResponse, egresadosResponse] = await Promise.all([
        this.obtenerPacientes(),
        this.obtenerPacientesEgresadosRecientes()
      ]);
      
      return {
        activos: activosResponse,
        egresadosRecientes: egresadosResponse
      };
    } catch (error) {
      console.error('Error al obtener pacientes para procedimientos:', error);
      throw error;
    }
  }

  async obtenerPaciente(id: number): Promise<Paciente> {
    const response = await api.get<ApiResponse<Paciente>>(`/pacientes/${id}`);
    if (!response.data.data) {
      throw new Error('Paciente no encontrado');
    }
    return response.data.data;
  }

  async crearPaciente(pacienteData: PacienteInput): Promise<Paciente> {
    
    try {
      const response = await api.post<ApiResponse<Paciente>>('/pacientes', pacienteData);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Error al crear el paciente');
      }
      return response.data.data;
    } catch (error) {
      console.error('PacienteService - Error en la petición:', error);
      throw error;
    }
  }

  async actualizarPaciente(id: number, pacienteData: Partial<PacienteInput>): Promise<Paciente> {
    const response = await api.put<ApiResponse<Paciente>>(`/pacientes/${id}`, pacienteData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Error al actualizar el paciente');
    }
    return response.data.data;
  }

  async eliminarPaciente(id: number): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/pacientes/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al eliminar el paciente');
    }
  }
}

export const pacienteService = new PacienteService();
export default api;