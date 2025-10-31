import api from './api';
import axios from 'axios';

export interface DatoEnfermeria {
  fecha: string;
  nas: number | null;
  procedimientos: {
    dia: number;
    noche: number;
  };
}

export interface RegistroNAS {
  id: number;
  puntuacion: number;
  fecha: string;
  horaRegistro: string;
  detalle?: any; // Detalle completo del NAS con todos los items
}

export interface Procedimiento {
  id: number;
  nombre: string;
  tiempo: string;
  turno: string;
  registroId: number;
}

export interface Categorizacion {
  id: number;
  puntajeTotal: number;
  complejidad: string;
  cargaAsistencial: string;
  patronRespiratorio: number;
  asistenciaVentilatoria: number;
  sasGlasgow: number;
  tosSecreciones: number;
  asistencia: number;
  observaciones: string | null;
  fechaCategorizacion: string;
  horaRegistro: string;
}

export interface DetalleDia {
  fecha: string;
  nas: RegistroNAS[];
  procedimientos: Procedimiento[];
  categorizacion: Categorizacion | null;
}

export interface MetricasEnfermeria {
  totalProcedimientos: {
    cantidad: number;
    texto: string;
  };
}

class EnfermeriaAPI {
  async obtenerCalendarioEnfermeria(pacienteRut: string, dias: number = 30): Promise<DatoEnfermeria[]> {
    try {
      const response = await api.get(`/enfermeria/calendario/${pacienteRut}?dias=${dias}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener calendario de enfermería:', error);
      throw error;
    }
  }

  async obtenerDetalleDia(pacienteRut: string, fecha: string): Promise<DetalleDia> {
    try {
      const url = `/enfermeria/dia/${pacienteRut}/${fecha}`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error al obtener detalle del día:', error);
      throw error;
    }
  }

  async obtenerMetricas(): Promise<MetricasEnfermeria> {
    try {
      const response = await api.get('/enfermeria/metricas');
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Error al obtener las métricas de enfermería');
      }
      throw error;
    }
  }
}

export const enfermeriaService = new EnfermeriaAPI();

