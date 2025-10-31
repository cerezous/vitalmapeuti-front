import axios from 'axios';

// Detecta automáticamente la URL del backend
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  
  return `http://${window.location.hostname}:3001/api`;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ProcedimientoSistema {
  id: number;
  nombre: string;
  descripcion?: string;
  estamento: 'Enfermería' | 'Kinesiología' | 'Medicina' | 'TENS' | 'Auxiliar';
  tiempoEstimado?: number;
  requierePaciente: boolean;
  activo: boolean;
  orden?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProcedimientoSistemaInput {
  nombre: string;
  descripcion?: string;
  estamento: 'Enfermería' | 'Kinesiología' | 'Medicina' | 'TENS' | 'Auxiliar';
  tiempoEstimado?: number;
  requierePaciente?: boolean;
  activo?: boolean;
  orden?: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface ProcedimientosResponse {
  procedimientos: ProcedimientoSistema[];
  pagination: PaginationInfo;
}

export interface EstadisticasProcedimientos {
  total: number;
  activos: number;
  inactivos: number;
  porEstamento: Array<{
    estamento: string;
    cantidad: number;
  }>;
}

class ProcedimientosSistemaService {
  // Obtener todos los procedimientos con filtros y paginación
  async obtenerProcedimientos(params?: {
    page?: number;
    limit?: number;
    estamento?: string;
    activo?: boolean;
    search?: string;
    requierePaciente?: boolean;
  }): Promise<ProcedimientosResponse> {
    try {
      const response = await api.get('/procedimientos-sistema', { params });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener los procedimientos');
      }
      throw error;
    }
  }

  // Obtener procedimientos por estamento (para los selects de los modales)
  async obtenerProcedimientosPorEstamento(
    estamento: string, 
    requierePaciente?: boolean
  ): Promise<ProcedimientoSistema[]> {
    try {
      const params: any = {};
      if (requierePaciente !== undefined) {
        params.requierePaciente = requierePaciente;
      }
      
      const response = await api.get(`/procedimientos-sistema/por-estamento/${estamento}`, { params });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener los procedimientos del estamento');
      }
      throw error;
    }
  }

  // Obtener un procedimiento por ID
  async obtenerProcedimiento(id: number): Promise<ProcedimientoSistema> {
    try {
      const response = await api.get(`/procedimientos-sistema/${id}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener el procedimiento');
      }
      throw error;
    }
  }

  // Crear nuevo procedimiento
  async crearProcedimiento(data: ProcedimientoSistemaInput): Promise<ProcedimientoSistema> {
    try {
      const response = await api.post('/procedimientos-sistema', data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al crear el procedimiento');
      }
      throw error;
    }
  }

  // Actualizar procedimiento
  async actualizarProcedimiento(id: number, data: Partial<ProcedimientoSistemaInput>): Promise<ProcedimientoSistema> {
    try {
      const response = await api.put(`/procedimientos-sistema/${id}`, data);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al actualizar el procedimiento');
      }
      throw error;
    }
  }

  // Eliminar procedimiento
  async eliminarProcedimiento(id: number): Promise<void> {
    try {
      await api.delete(`/procedimientos-sistema/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al eliminar el procedimiento');
      }
      throw error;
    }
  }

  // Activar/Desactivar procedimiento
  async toggleActivo(id: number): Promise<ProcedimientoSistema> {
    try {
      const response = await api.patch(`/procedimientos-sistema/${id}/toggle-activo`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al cambiar el estado del procedimiento');
      }
      throw error;
    }
  }

  // Obtener estadísticas
  async obtenerEstadisticas(): Promise<EstadisticasProcedimientos> {
    try {
      const response = await api.get('/procedimientos-sistema/estadisticas/generales');
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener las estadísticas');
      }
      throw error;
    }
  }

  // Cache local para procedimientos por estamento
  private cache: Map<string, { data: ProcedimientoSistema[], timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Obtener procedimientos por estamento con cache
  async obtenerProcedimientosPorEstamentoConCache(
    estamento: string, 
    requierePaciente?: boolean,
    forceRefresh: boolean = false
  ): Promise<ProcedimientoSistema[]> {
    const cacheKey = `${estamento}-${requierePaciente}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    // Si hay cache válido y no se fuerza refresh, devolver cache
    if (!forceRefresh && cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    // Obtener datos frescos
    const data = await this.obtenerProcedimientosPorEstamento(estamento, requierePaciente);
    
    // Actualizar cache
    this.cache.set(cacheKey, { data, timestamp: now });
    
    return data;
  }

  // Limpiar cache
  limpiarCache(): void {
    this.cache.clear();
  }

  // Limpiar cache de un estamento específico
  limpiarCacheEstamento(estamento: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(estamento)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export default new ProcedimientosSistemaService();
