import axios from 'axios';
import { getApiBaseUrl } from './api';

// Detecta automáticamente la URL del backend
const API_BASE_URL = getApiBaseUrl();

// Interfaz para los datos de APACHE II
export interface Apache2Data {
  id?: number;
  pacienteRut?: string;
  temperatura: number;
  presionArterial: number;
  frecuenciaCardiaca: number;
  frecuenciaRespiratoria: number;
  oxigenacion: number;
  phArterial: number;
  sodio: number;
  potasio: number;
  creatinina: number;
  hematocrito: number;
  leucocitos: number;
  glasgow: number;
  edad: number;
  enfermedadCronica: number;
  puntajeTotal?: number;
  riesgoMortalidad?: string;
  nivelRiesgo?: string;
  rangosSeleccionados?: {[key: string]: string};
  observaciones?: string;
  usuarioId?: number;
  fechaEvaluacion?: string;
}

// Interfaz para la respuesta de la API
export interface Apache2Response {
  success: boolean;
  message?: string;
  data?: Apache2Data;
  error?: string;
}

// Interfaz para listado de evaluaciones
export interface Apache2ListResponse {
  success: boolean;
  data?: Apache2Data[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
  error?: string;
}

const apache2API = axios.create({
  baseURL: `${API_BASE_URL}/apache2`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
apache2API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar respuestas y errores
apache2API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en API APACHE II:', error.response?.data || error.message);
    
    // Si hay error 401, redirigir al login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const apache2Service = {
  // Crear nueva evaluación APACHE II
  crear: async (data: Apache2Data): Promise<Apache2Response> => {
    try {
      const response = await apache2API.post('/', data);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear evaluación APACHE II:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error al guardar la evaluación APACHE II'
      );
    }
  },

  // Obtener todas las evaluaciones
  obtenerTodas: async (params?: {
    pacienteRut?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: 'ASC' | 'DESC';
  }): Promise<Apache2ListResponse> => {
    try {
      const response = await apache2API.get('/', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener evaluaciones APACHE II:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error al obtener las evaluaciones APACHE II'
      );
    }
  },

  // Obtener evaluación por ID
  obtenerPorId: async (id: number): Promise<Apache2Response> => {
    try {
      const response = await apache2API.get(`/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener evaluación APACHE II:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error al obtener la evaluación APACHE II'
      );
    }
  },

  // Obtener evaluaciones por RUT de paciente
  obtenerPorPaciente: async (rut: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    paciente?: any;
    evaluaciones?: Apache2Data[];
    pagination?: any;
    error?: string;
  }> => {
    try {
      const response = await apache2API.get(`/paciente/${rut}`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener evaluaciones del paciente:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error al obtener las evaluaciones del paciente'
      );
    }
  },

  // Actualizar evaluación existente
  actualizar: async (id: number, data: Partial<Apache2Data>): Promise<Apache2Response> => {
    try {
      const response = await apache2API.put(`/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error al actualizar evaluación APACHE II:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error al actualizar la evaluación APACHE II'
      );
    }
  },

  // Eliminar evaluación
  eliminar: async (id: number): Promise<{success: boolean; message?: string}> => {
    try {
      const response = await apache2API.delete(`/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error al eliminar evaluación APACHE II:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error al eliminar la evaluación APACHE II'
      );
    }
  },

  // Obtener estadísticas generales
  obtenerEstadisticas: async (): Promise<{
    success: boolean;
    data?: {
      totalEvaluaciones: number;
      estadisticasRiesgo: Array<{nivelRiesgo: string; cantidad: number}>;
      promedioScore: {promedio: number; minimo: number; maximo: number};
    };
    error?: string;
  }> => {
    try {
      const response = await apache2API.get('/estadisticas/general');
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error al obtener las estadísticas'
      );
    }
  }
};

export default apache2Service;