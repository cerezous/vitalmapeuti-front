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

export interface ProcedimientoMedicinaData {
  nombre: string;
  tiempo: string; // Formato HH:MM
  pacienteRut?: string;
  observaciones?: string;
}

export interface RegistroMedicinaRequest {
  turno: '24 h' | '22 h' | '12 h';
  fecha: string;
  procedimientos: ProcedimientoMedicinaData[];
}

export interface ProcedimientoMedicina {
  id: number;
  usuarioId: number;
  turno: '24 h' | '22 h' | '12 h';
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

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface MetricasMedicina {
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
  promedio24h: {
    promedio: number;
    totalTurnos: number;
    totalProcedimientos: number;
  };
  promedioInterconsulta: {
    promedio: number;
    cantidad: number;
    texto: string;
  };
  estadisticasDetalladas?: {
    sesionesTotales: number;
    diasConActividad: number;
    porcentajeActividad: string;
    promedioPorDiaActivo: number;
    promedioGeneral: number;
  };
}

const medicinaAPI = {
  // Crear nuevo registro de procedimientos de medicina
  crear: async (data: RegistroMedicinaRequest): Promise<{
    procedimientos: ProcedimientoMedicina[];
    resumen: {
      total: number;
      turno: string;
      fecha: string;
      tiempoTotal: number;
      usuario: string;
    };
  }> => {
    try {
      const response = await axios.post(
        `${API_URL}/medicina`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error completo medicina:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Error del servidor medicina:', error.response.data);
          throw new Error(error.response.data.message || error.response.data.error || 'Error al crear el registro de medicina');
        } else if (error.request) {
          console.error('No se recibió respuesta del servidor medicina');
          throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
        }
      }
      throw error;
    }
  },

  // Obtener todos los procedimientos de medicina (con paginación y filtros)
  obtenerTodos: async (params?: {
    page?: number;
    limit?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    turno?: '24 h' | '22 h' | '12 h';
    usuarioId?: number;
    pacienteRut?: string;
    nombre?: string;
  }): Promise<{ procedimientos: ProcedimientoMedicina[]; pagination: PaginationInfo }> => {
    try {
      const response = await axios.get(
        `${API_URL}/medicina`,
        {
          headers: getAuthHeader(),
          params
        }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener los procedimientos de medicina');
      }
      throw error;
    }
  },

  // Obtener métricas del dashboard de medicina
  obtenerMetricas: async (): Promise<MetricasMedicina> => {
    try {
      const response = await axios.get(
        `${API_URL}/medicina/metricas`,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener las métricas de medicina');
      }
      throw error;
    }
  },

  // Eliminar procedimiento de medicina
  eliminar: async (id: number): Promise<void> => {
    try {
      await axios.delete(
        `${API_URL}/medicina/${id}`,
        { headers: getAuthHeader() }
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al eliminar el procedimiento de medicina');
      }
      throw error;
    }
  },

  // Actualizar procedimiento de medicina
  actualizar: async (id: number, data: ProcedimientoMedicinaData): Promise<ProcedimientoMedicina> => {
    try {
      const response = await axios.put(
        `${API_URL}/medicina/${id}`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al actualizar el procedimiento de medicina');
      }
      throw error;
    }
  },

  // Obtener procedimientos de medicina válidos
  getProcedimientosValidos: (): string[] => {
    return [
      // Procedimientos habituales de medicina
      'Tareas administrativas (evoluciones, revisión de HC, indicaciones, recetas, etc)',
      'Logística (solicitud de insumos o situación similar por la cual se debe retrasar un procedimiento)',
      'Informe médico (redacción para traslados)',
      'Egreso (redacción de egreso, indicaciones, etc)',
      'Entrega de turno',
      'Recepción de turno',
      'Discusión con especialidades',
      'Visita clínica',
      'Redacción de licencia médica',
      'Desfibrilación o cardioversión',
      'Ingreso (redacción de ingreso, evaluación y procedimientos correspondientes)',
      'Instalación CHD',
      'Instalación CVC',
      'Interconsulta (lectura de HC, evaluación/reevaluación, evolución)',
      'IOT',
      'PCR (incluye IOT por PCR)',
      // Otros procedimientos
      'Cambio de TQT',
      'Colonoscopía (indicación de sedación y/o supervisión)',
      'Decanulación',
      'Ecografía',
      'Endoscopía (indicación de sedación y/o supervisión)',
      'Endoscopía + Colonoscopía (indicación de sedación y/o supervisión)',
      'Fibrobroncoscopía (indicación de sedación, supervisión o realización del procedimiento)',
      'Instalación de Cistotomia (indicación de sedación/analgesia o supervisión)',
      'Instalación de gastrotomía (indicación de sedación y/o supervisión)',
      'Instalación de SNY (indicación de sedación y/o supervisión)',
      'Instalación de TQT',
      'Instalación de tunelizado (indicación de sedación y/o supervisión)',
      'Instalación LA',
      'Instalación PICCLINE',
      'Mielograma (indicación de analgesia, supervisión o realización del procedimiento)',
      'Paracentesís (supervisión o realización del procedimiento)',
      'Punción lumbar (indicación de sedación, supervisión o realización del procedimiento)',
      'Toracocentesís (indicación de sedación/analgesia, supervisión o realización del procedimiento)'
    ];
  },

  // Verificar si un procedimiento requiere paciente
  requierePaciente: (nombreProcedimiento: string): boolean => {
    const procedimientosSinPaciente = [
      'Tareas administrativas (evoluciones, revisión de HC, indicaciones, recetas, etc)',
      'Logística (solicitud de insumos o situación similar por la cual se debe retrasar un procedimiento)',
      'Interconsulta (lectura de HC, evaluación/reevaluación, evolución)',
      'Entrega de turno',
      'Recepción de turno',
      'Discusión con especialidades',
      'Visita clínica',
    ];
    return !procedimientosSinPaciente.includes(nombreProcedimiento);
  }
};

export default medicinaAPI;
