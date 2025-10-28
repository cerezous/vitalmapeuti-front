// services/nasAPI.ts
import api from './api';

export interface NASSelections {
  item_1a?: boolean;
  item_1b?: boolean;
  item_1c?: boolean;
  item_2?: boolean;
  item_3?: boolean;
  item_4a?: boolean;
  item_4b?: boolean;
  item_4c?: boolean;
  item_5?: boolean;
  item_6a?: boolean;
  item_6b?: boolean;
  item_6c?: boolean;
  item_7a?: boolean;
  item_7b?: boolean;
  item_8a?: boolean;
  item_8b?: boolean;
  item_8c?: boolean;
  item_9?: boolean;
  item_10?: boolean;
  item_11?: boolean;
  item_12?: boolean;
  item_13?: boolean;
  item_14?: boolean;
  item_15?: boolean;
  item_16?: boolean;
  item_17?: boolean;
  item_18?: boolean;
  item_19?: boolean;
  item_20?: boolean;
  item_21?: boolean;
  item_22?: boolean;
  item_23?: boolean;
}

export interface CreateNASRequest {
  pacienteRut: string;
  usuarioId: number;
  fechaRegistro?: string;
  selecciones: NASSelections;
  observaciones?: string;
}

export interface UpdateNASRequest {
  selecciones?: NASSelections;
  observaciones?: string;
}

export interface NASRegistro {
  id: number;
  pacienteRut: string;
  usuarioId: number;
  fechaRegistro: string;
  puntuacionTotal: number;
  observaciones?: string;
  // Todos los ítems NAS
  item_1a: boolean;
  item_1b: boolean;
  item_1c: boolean;
  item_2: boolean;
  item_3: boolean;
  item_4a: boolean;
  item_4b: boolean;
  item_4c: boolean;
  item_5: boolean;
  item_6a: boolean;
  item_6b: boolean;
  item_6c: boolean;
  item_7a: boolean;
  item_7b: boolean;
  item_8a: boolean;
  item_8b: boolean;
  item_8c: boolean;
  item_9: boolean;
  item_10: boolean;
  item_11: boolean;
  item_12: boolean;
  item_13: boolean;
  item_14: boolean;
  item_15: boolean;
  item_16: boolean;
  item_17: boolean;
  item_18: boolean;
  item_19: boolean;
  item_20: boolean;
  item_21: boolean;
  item_22: boolean;
  item_23: boolean;
  // Relaciones
  Paciente?: {
    rut: string;
    nombreCompleto: string;
    numeroFicha: string;
  };
  Usuario?: {
    id: number;
    nombre: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NASEstadisticas {
  totalRegistros: number;
  puntuacion: {
    promedio: number;
    minimo: number;
    maximo: number;
  };
  distribucionCarga: {
    baja: number;
    moderada: number;
    alta: number;
    muyAlta: number;
  };
}

export interface ItemFrecuente {
  item: string;
  nombre: string;
  frecuencia: number;
  porcentaje: string;
}

const nasAPI = {
  // ========== CRUD OPERATIONS ==========
  
  // Obtener todos los registros NAS con filtros y paginación
  async obtenerRegistros(params?: {
    pacienteRut?: string;
    fechaInicio?: string;
    fechaFin?: string;
    turno?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
  }): Promise<{
    registros: NASRegistro[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      recordsPerPage: number;
    };
  }> {
    const response = await api.get('/nas', { params });
    return response.data.data;
  },

  // Obtener un registro NAS específico
  async obtenerNAS(id: number): Promise<NASRegistro> {
    const response = await api.get(`/nas/${id}`);
    return response.data.data || response.data;
  },

  // Obtener un registro NAS específico (alias)
  async obtenerRegistroPorId(id: number): Promise<NASRegistro> {
    const response = await api.get(`/nas/${id}`);
    return response.data.data;
  },

  // Obtener registros NAS de un paciente específico
  async obtenerRegistrosPorPaciente(rut: string, params?: {
    limit?: number;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
  }): Promise<NASRegistro[]> {
    const response = await api.get(`/nas/paciente/${rut}`, { params });
    return response.data.data;
  },

  // Crear nuevo registro NAS
  async crearRegistro(data: CreateNASRequest): Promise<NASRegistro> {
    const response = await api.post('/nas', data);
    return response.data.data;
  },

  // Actualizar registro NAS
  async actualizarRegistro(id: number, data: UpdateNASRequest): Promise<NASRegistro> {
    const response = await api.put(`/nas/${id}`, data);
    return response.data.data;
  },

  // Eliminar registro NAS
  async eliminarRegistro(id: number): Promise<void> {
    await api.delete(`/nas/${id}`);
  },

  // ========== ESTADÍSTICAS Y ANÁLISIS ==========

  // Obtener estadísticas generales
  async obtenerEstadisticas(params?: {
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<NASEstadisticas> {
    const response = await api.get('/nas/estadisticas/resumen', { params });
    return response.data.data;
  },

  // Obtener ítems más frecuentemente seleccionados
  async obtenerItemsFrecuentes(params?: {
    fechaInicio?: string;
    fechaFin?: string;
    limit?: number;
  }): Promise<ItemFrecuente[]> {
    const response = await api.get('/nas/estadisticas/items-frecuentes', { params });
    return response.data.data;
  },

  // ========== UTILIDADES ==========

  // Convertir selecciones del frontend al formato del backend
  convertirSeleccionesParaBackend(selecciones: { [key: string]: boolean }): NASSelections {
    const seleccionesBackend: NASSelections = {};
    
    // Mapear las selecciones del frontend (1a, 1b, etc.) al formato del backend (item_1a, item_1b, etc.)
    Object.entries(selecciones).forEach(([key, value]) => {
      if (value === true) {
        const backendKey = key.startsWith('item_') ? key : `item_${key}`;
        (seleccionesBackend as any)[backendKey] = true;
      }
    });
    
    return seleccionesBackend;
  },

  // Convertir selecciones del backend al formato del frontend
  convertirSeleccionesParaFrontend(registro: NASRegistro): { [key: string]: boolean } {
    const seleccionesFrontend: { [key: string]: boolean } = {};
    
    // Mapear las selecciones del backend (item_1a, item_1b, etc.) al formato del frontend (1a, 1b, etc.)
    Object.entries(registro).forEach(([key, value]) => {
      if (key.startsWith('item_') && value === true) {
        const frontendKey = key.replace('item_', '');
        seleccionesFrontend[frontendKey] = true;
      }
    });
    
    return seleccionesFrontend;
  },

  // Validar que las selecciones cumplan las reglas de grupos exclusivos
  validarSelecciones(selecciones: { [key: string]: boolean }): string[] {
    const errores: string[] = [];
    
    // Grupo 1: Solo uno de 1a, 1b, 1c
    const grupo1 = ['1a', '1b', '1c'].filter(item => selecciones[item]).length;
    if (grupo1 > 1) {
      errores.push('Solo se puede seleccionar una opción del Grupo 1 (ítems 1a, 1b, 1c)');
    }
    
    // Grupo 4: Solo uno de 4a, 4b, 4c
    const grupo4 = ['4a', '4b', '4c'].filter(item => selecciones[item]).length;
    if (grupo4 > 1) {
      errores.push('Solo se puede seleccionar una opción del Grupo 4 (ítems 4a, 4b, 4c)');
    }
    
    // Grupo 6: Solo uno de 6a, 6b, 6c
    const grupo6 = ['6a', '6b', '6c'].filter(item => selecciones[item]).length;
    if (grupo6 > 1) {
      errores.push('Solo se puede seleccionar una opción del Grupo 6 (ítems 6a, 6b, 6c)');
    }
    
    // Grupo 7: Solo uno de 7a, 7b
    const grupo7 = ['7a', '7b'].filter(item => selecciones[item]).length;
    if (grupo7 > 1) {
      errores.push('Solo se puede seleccionar una opción del Grupo 7 (ítems 7a, 7b)');
    }
    
    // Grupo 8: Solo uno de 8a, 8b, 8c
    const grupo8 = ['8a', '8b', '8c'].filter(item => selecciones[item]).length;
    if (grupo8 > 1) {
      errores.push('Solo se puede seleccionar una opción del Grupo 8 (ítems 8a, 8b, 8c)');
    }
    
    return errores;
  }
};

export const nasService = nasAPI;
export default nasAPI;