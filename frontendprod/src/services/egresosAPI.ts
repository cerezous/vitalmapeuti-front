import axios from 'axios';

// Detecta automáticamente la URL del backend
const getApiBaseUrl = () => {
  // Si hay una variable de entorno, úsala (para producción)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Si estamos en localhost, usar localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  
  // Si estamos en una IP de red local, usar esa IP
  return `http://${window.location.hostname}:3001/api`;
};

const API_URL = getApiBaseUrl();

export interface Egreso {
  id: number;
  pacienteId: number;
  nombreCompleto: string;
  rut: string;
  numeroFicha: string;
  edad: number;
  camaAsignada: number | null;
  fechaIngresoUTI: string;
  fechaEgresoUTI: string;
  motivoEgreso: string;
  diasEstadia: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EgresoInput {
  pacienteId: number;
  fechaEgresoUTI: string;
  motivoEgreso: string;
}

class EgresosAPI {
  // Obtener todos los egresos
  async obtenerEgresos(): Promise<Egreso[]> {
    try {
      const response = await axios.get(`${API_URL}/egresos`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error al obtener egresos:', error);
      throw error;
    }
  }

  // Obtener un egreso por ID
  async obtenerEgreso(id: number): Promise<Egreso> {
    try {
      const response = await axios.get(`${API_URL}/egresos/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error al obtener egreso:', error);
      throw error;
    }
  }

  // Crear un nuevo egreso
  async crearEgreso(egreso: EgresoInput): Promise<Egreso> {
    try {
      const response = await axios.post(`${API_URL}/egresos`, egreso);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error al crear egreso:', error);
      throw error;
    }
  }
}

export const egresosService = new EgresosAPI();

