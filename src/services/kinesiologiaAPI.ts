import axios from 'axios';
import { getApiBaseUrl } from './apiBaseUrl';

// Detecta automáticamente la URL del backend
const API_URL = getApiBaseUrl();

export interface Categorizacion {
  id: number;
  pacienteRut: string;
  fecha: string;
  observaciones: string;
  complejidad: string;
  puntajeTotal: number;
  cargaAsistencial: string;
  patronRespiratorio: string;
  asistenciaVentilatoria: string;
  sasGlasgow: string;
  tosSecreciones: string;
  asistencia: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcedimientoKinesiologia {
  id: number;
  pacienteRut: string;
  usuarioId: number;
  nombre: string;
  fecha: string;
  tiempo: string;
  observaciones: string;
  turno?: string | null;
  createdAt: string;
  updatedAt: string;
  usuario?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  paciente?: {
    rut: string;
    nombres: string;
    apellidos: string;
  };
}

export interface DetalleDiaKinesiologia {
  categorizacion: Categorizacion | null;
  procedimientos: ProcedimientoKinesiologia[];
}

export interface MetricasKinesiologia {
  totalProcedimientos: {
    cantidad: number;
    texto: string;
  };
  gravedad: {
    promedioPuntaje: string | number;
    complejidadPredominante: 'Baja' | 'Mediana' | 'Alta' | 'Sin categorizar';
    baja: number;
    media: number;
    alta: number;
    total: number;
    totalPacientesActivos: number;
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

class KinesiologiaService {
  async obtenerDetalleDia(pacienteRut: string, fecha: string): Promise<DetalleDiaKinesiologia> {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/kinesiologia/dia/${pacienteRut}/${fecha}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  }

  async obtenerMetricas(): Promise<MetricasKinesiologia> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/kinesiologia/metricas`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener las métricas de kinesiología');
      }
      throw error;
    }
  }
}

export const kinesiologiaService = new KinesiologiaService();
