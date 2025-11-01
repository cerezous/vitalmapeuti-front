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

export interface ProcedimientoTENSData {
  nombre: string;
  tiempo: string;
  pacienteRut?: string;
}

export interface RegistroProcedimientosTENSRequest {
  turno: 'Día' | 'Noche';
  fecha: string;
  procedimientos: ProcedimientoTENSData[];
}

export interface RegistroProcedimientoTENS {
  id: number;
  usuarioId: number;
  turno: 'Día' | 'Noche';
  fecha: string;
  tiempoTotal: number;
  createdAt: string;
  updatedAt: string;
  usuario: {
    nombres: string;
    apellidos: string;
    usuario: string;
  };
  procedimientos?: ProcedimientoTENSItem[];
}

export interface ProcedimientoTENSItem {
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

const procedimientosTENSAPI = {
  // Crear nuevo registro
  crear: async (data: RegistroProcedimientosTENSRequest): Promise<RegistroProcedimientoTENS> => {
    try {
      const response = await axios.post(
        `${API_URL}/procedimientos-tens`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error completo:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Error del servidor:', error.response.data);
          throw new Error(error.response.data.message || error.response.data.error || 'Error al crear el registro TENS');
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
    turno?: 'Día' | 'Noche';
    incluirProcedimientos?: boolean | string;
  }): Promise<{ registros: RegistroProcedimientoTENS[]; pagination: PaginationInfo }> => {
    try {
      const response = await axios.get(
        `${API_URL}/procedimientos-tens`,
        {
          headers: getAuthHeader(),
          params
        }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener los registros TENS');
      }
      throw error;
    }
  },

  // Obtener registro específico por ID
  obtenerPorId: async (id: number): Promise<RegistroProcedimientoTENS> => {
    try {
      const response = await axios.get(
        `${API_URL}/procedimientos-tens/${id}`,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener el registro TENS');
      }
      throw error;
    }
  },

  // Actualizar registro TENS
  actualizar: async (id: number, data: { fecha?: string; turno?: string }): Promise<RegistroProcedimientoTENS> => {
    try {
      const response = await axios.put(
        `${API_URL}/procedimientos-tens/${id}`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al actualizar el registro TENS');
      }
      throw error;
    }
  },

  // Eliminar registro
  eliminar: async (id: number): Promise<void> => {
    try {
      await axios.delete(
        `${API_URL}/procedimientos-tens/${id}`,
        { headers: getAuthHeader() }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al eliminar el registro TENS');
      }
      throw error;
    }
  },

  // Agregar procedimientos a un registro existente
  agregarProcedimientos: async (registroId: number, procedimientos: ProcedimientoTENSData[]): Promise<ProcedimientoTENSItem[]> => {
    try {
      const response = await axios.post(
        `${API_URL}/procedimientos-tens/${registroId}/procedimientos`,
        { procedimientos },
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al agregar procedimientos TENS');
      }
      throw error;
    }
  },

  // Eliminar procedimiento específico de un registro
  eliminarProcedimiento: async (registroId: number, procedimientoId: number): Promise<void> => {
    try {
      await axios.delete(
        `${API_URL}/procedimientos-tens/${registroId}/procedimientos/${procedimientoId}`,
        { headers: getAuthHeader() }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al eliminar el procedimiento TENS');
      }
      throw error;
    }
  },

  // Obtener métricas específicas para TENS
  obtenerMetricas: async (): Promise<{
    tiempoTotal: {
      minutos: number;
      horas: number;
      minutosRestantes: number;
      texto: string;
    };
    totalProcedimientos: {
      total: number;
      texto: string;
    };
    promedioProcedimientos: {
      promedio: number;
      totalProcedimientos: number;
      totalTurnos: number;
    };
    tiempoPromedioAseo: {
      minutos: number;
      texto: string;
    };
  }> => {
    try {
      const response = await axios.get(
        `${API_URL}/procedimientos-tens/metricas/dashboard`,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener las métricas TENS');
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
    pacientesAtendidos: number;
    registrosEsteMes: number;
  }> => {
    try {
      const response = await axios.get(
        `${API_URL}/procedimientos-tens/metricas/usuario`,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener las métricas del usuario TENS');
      }
      throw error;
    }
  }
};

export default procedimientosTENSAPI;