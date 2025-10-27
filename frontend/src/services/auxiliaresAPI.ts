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

const API_URL = getApiBaseUrl();

// Obtener token del localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface ProcedimientoAuxiliarData {
  nombre: string;
  tiempo: string; // Formato HH:MM
  observaciones?: string;
}

export interface RegistroAuxiliarRequest {
  turno: 'Día' | 'Noche' | '24 h';
  fecha: string;
  procedimientos: ProcedimientoAuxiliarData[];
}

export interface ProcedimientoAuxiliar {
  id: number;
  usuarioId: number;
  turno: 'Día' | 'Noche' | '24 h';
  fecha: string;
  nombre: string;
  tiempo: string;
  pacienteRut?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  usuario: {
    nombres: string;
    apellidos: string;
    usuario: string;
    estamento: string;
  };
  paciente?: {
    nombreCompleto: string;
    rut: string;
    numeroFicha: string;
    camaAsignada?: number;
  };
}

export interface GrupoProcedimientosAuxiliares {
  fecha: string;
  turno: string;
  procedimientos: ProcedimientoAuxiliar[];
  tiempoTotal: number; // En minutos
  cantidadProcedimientos: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface MetricasAuxiliares {
  totalProcedimientos: {
    cantidad: number;
    texto: string;
  };
  tiempoTotal: {
    minutos: number;
    horas: number;
    minutosRestantes: number;
    texto: string;
  };
  promedioDia: {
    promedio: number;
    totalTurnos: number;
    totalProcedimientos: number;
  };
  promedioNoche: {
    promedio: number;
    totalTurnos: number;
    totalProcedimientos: number;
  };
}

const auxiliaresAPI = {
  // Crear nuevo registro de procedimientos auxiliares
  crear: async (data: RegistroAuxiliarRequest): Promise<{
    procedimientos: ProcedimientoAuxiliar[];
    resumen: {
      total: number;
      turno: string;
      fecha: string;
      usuario: string;
    };
  }> => {
    try {
      const response = await axios.post(
        `${API_URL}/auxiliares`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error completo auxiliares:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Error del servidor auxiliares:', error.response.data);
          throw new Error(error.response.data.message || error.response.data.error || 'Error al crear el registro auxiliar');
        } else if (error.request) {
          console.error('No se recibió respuesta del servidor auxiliares');
          throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
        }
      }
      throw error;
    }
  },

  // Obtener todos los procedimientos auxiliares (con paginación y filtros)
  obtenerTodos: async (params?: {
    page?: number;
    limit?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    turno?: 'Día' | 'Noche' | '24 h';
    usuarioId?: number;
    pacienteRut?: string;
    nombre?: string;
  }): Promise<{ procedimientos: ProcedimientoAuxiliar[]; pagination: PaginationInfo }> => {
    try {
      const response = await axios.get(
        `${API_URL}/auxiliares`,
        {
          headers: getAuthHeader(),
          params
        }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener los procedimientos auxiliares');
      }
      throw error;
    }
  },

  // Obtener procedimientos agrupados por turno (para el menú auxiliares)
  obtenerAgrupados: async (params?: {
    fechaDesde?: string;
    fechaHasta?: string;
    limit?: number;
  }): Promise<GrupoProcedimientosAuxiliares[]> => {
    try {
      const response = await axios.get(
        `${API_URL}/auxiliares/agrupados`,
        {
          headers: getAuthHeader(),
          params
        }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener los procedimientos agrupados');
      }
      throw error;
    }
  },

  // Obtener métricas del dashboard de auxiliares
  obtenerMetricas: async (): Promise<MetricasAuxiliares> => {
    try {
      const response = await axios.get(
        `${API_URL}/auxiliares/metricas`,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener las métricas auxiliares');
      }
      throw error;
    }
  },

  // Actualizar procedimiento auxiliar
  actualizar: async (id: number, data: Partial<ProcedimientoAuxiliarData>): Promise<ProcedimientoAuxiliar> => {
    try {
      const response = await axios.put(
        `${API_URL}/auxiliares/${id}`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al actualizar el procedimiento auxiliar');
      }
      throw error;
    }
  },

  // Eliminar procedimiento auxiliar
  eliminar: async (id: number): Promise<void> => {
    try {
      await axios.delete(
        `${API_URL}/auxiliares/${id}`,
        { headers: getAuthHeader() }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al eliminar el procedimiento auxiliar');
      }
      throw error;
    }
  },

  // Obtener procedimientos auxiliares válidos
  getProcedimientosValidos: (): string[] => {
    return [
      'Entrega de turno',
      'Aseo terminal',
      'Entrega de interconsulta',
      'Entrega de exámenes',
      'Entrega de recetas / recepción de fármacos (trayecto hacia y desde farmacia)',
      'Aseo regular',
      'Recepción / entrega de ropa'
    ];
  },

  // Verificar si un procedimiento requiere paciente
  // Todos los procedimientos auxiliares ya no requieren paciente específico
  requierePaciente: (nombreProcedimiento: string): boolean => {
    return false; // Ningún procedimiento auxiliar requiere paciente
  }
};

export default auxiliaresAPI;
