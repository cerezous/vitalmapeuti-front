import axios from 'axios';
import { getApiBaseUrl } from './api';

// Detecta automáticamente la URL del backend
const API_URL = getApiBaseUrl();

// Obtener token del localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface ProcedimientoRegistroData {
  nombre: string;
  tiempo: string;
  pacienteRut?: string;
}

export interface RegistroProcedimientosRequest {
  turno: 'Día' | 'Noche' | '24 h';
  fecha: string;
  procedimientos: ProcedimientoRegistroData[];
  estamento?: 'Kinesiología' | 'Enfermería' | 'Medicina' | 'Auxiliares'; // Opcional, para compatibilidad
}

export interface RegistroProcedimiento {
  id: number;
  usuarioId: number;
  turno: 'Día' | 'Noche' | '24 h';
  fecha: string;
  tiempoTotal: number;
  createdAt: string;
  updatedAt: string;
  usuario: {
    nombres: string;
    apellidos: string;
    usuario: string;
  };
  procedimientos?: ProcedimientoRegistroItem[];
}

export interface ProcedimientoRegistroItem {
  id: number;
  registroId: number;
  nombre: string;
  tiempo: string;
  pacienteRut?: string;
  createdAt: string;
  updatedAt: string;
  paciente?: {
    nombreCompleto: string;
    rut: string;
    numeroFicha: string;
    camaAsignada?: number;
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const registroProcedimientosAPI = {
  // Crear nuevo registro
  crear: async (data: RegistroProcedimientosRequest): Promise<RegistroProcedimiento> => {
    try {
      const response = await axios.post(
        `${API_URL}/registro-procedimientos`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error completo:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Error del servidor:', error.response.data);
          throw new Error(error.response.data.message || error.response.data.error || 'Error al crear el registro');
        } else if (error.request) {
          console.error('No se recibió respuesta del servidor');
          throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
        }
      }
      throw error;
    }
  },

  // Obtener todos los registros con paginación y filtros
  obtenerTodos: async (params?: {
    page?: number;
    limit?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    turno?: 'Día' | 'Noche' | '24 h';
    incluirProcedimientos?: boolean | string;
  }): Promise<{ registros: RegistroProcedimiento[]; pagination: PaginationInfo }> => {
    try {
      const response = await axios.get(
        `${API_URL}/registro-procedimientos`,
        {
          headers: getAuthHeader(),
          params
        }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener los registros');
      }
      throw error;
    }
  },

  // Obtener registro específico por ID
  obtenerPorId: async (id: number): Promise<RegistroProcedimiento> => {
    try {
      const response = await axios.get(
        `${API_URL}/registro-procedimientos/${id}`,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener el registro');
      }
      throw error;
    }
  },

  // Eliminar registro
  eliminar: async (id: number): Promise<void> => {
    try {
      await axios.delete(
        `${API_URL}/registro-procedimientos/${id}`,
        { headers: getAuthHeader() }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al eliminar el registro');
      }
      throw error;
    }
  },

  // Agregar procedimientos a un registro existente
  agregarProcedimientos: async (registroId: number, procedimientos: ProcedimientoRegistroData[]): Promise<ProcedimientoRegistroItem[]> => {
    try {
      const response = await axios.post(
        `${API_URL}/registro-procedimientos/${registroId}/procedimientos`,
        { procedimientos },
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al agregar procedimientos');
      }
      throw error;
    }
  },

  // Eliminar procedimiento específico de un registro
  eliminarProcedimiento: async (registroId: number, procedimientoId: number): Promise<void> => {
    try {
      await axios.delete(
        `${API_URL}/registro-procedimientos/${registroId}/procedimientos/${procedimientoId}`,
        { headers: getAuthHeader() }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al eliminar el procedimiento');
      }
      throw error;
    }
  },

  // Obtener métricas del dashboard
  obtenerMetricas: async (): Promise<{
    tiempoTotal: {
      minutos: number;
      horas: number;
      minutosRestantes: number;
      texto: string;
    };
    pacientesCriticos: {
      total: number;
      porcentaje: number;
      de: number;
    };
    promedioProcedimientos: {
      promedio: number;
      totalProcedimientos: number;
      totalTurnos: number;
    };
    ratioKinesiologo: {
      ratio: string;
      totalPacientes: number;
      kinesiologosActivos: number;
      nivel: 'optimo' | 'aceptable' | 'critico';
    };
  }> => {
    try {
      const response = await axios.get(
        `${API_URL}/registro-procedimientos/metricas/dashboard`,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener las métricas');
      }
      throw error;
    }
  },

  // Obtener métricas del usuario actual
  obtenerMetricasUsuario: async (): Promise<{
    totalProcedimientos: number;
    tiempoTotal: {
      minutos: number;
      horas: number;
      minutosRestantes: number;
      texto: string;
    };
    totalCategorizaciones: number;
    pacientesAtendidos: number;
  }> => {
    try {
      const response = await axios.get(
        `${API_URL}/registro-procedimientos/metricas/usuario`,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener las métricas del usuario');
      }
      throw error;
    }
  },

  // Actualizar procedimiento individual
  actualizarProcedimiento: async (registroId: number, procedimientoId: number, data: ProcedimientoRegistroData): Promise<void> => {
    try {
      await axios.put(
        `${API_URL}/registro-procedimientos/${registroId}/procedimientos/${procedimientoId}`,
        data,
        { headers: getAuthHeader() }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al actualizar el procedimiento');
      }
      throw error;
    }
  }
};

export default registroProcedimientosAPI;

