import api from './api';

// Tipos TypeScript para los procedimientos
export interface ProcedimientoKinesiologia {
  id?: number;
  pacienteRut: string;
  usuarioId?: number;
  nombre: string;
  fecha: string;
  turno?: string | null;
  tiempo: string; // Formato HH:MM
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
  paciente?: {
    nombreCompleto: string;
    rut: string;
    numeroFicha: string;
  };
  usuario?: {
    nombres: string;
    apellidos: string;
    usuario: string;
  };
}

export interface ProcedimientoRequest {
  nombre: string;
  fecha: string;
  turno?: string;
  tiempo: string;
  observaciones?: string;
}

export interface ProcedimientosBatchRequest {
  pacienteRut: string | null; // Permitir null para procedimientos generales
  procedimientos: ProcedimientoRequest[];
}

export interface ProcedimientosBatchResponse {
  message: string;
  data: ProcedimientoKinesiologia[];
}

export interface ProcedimientosListResponse {
  message: string;
  data: {
    procedimientos: ProcedimientoKinesiologia[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    paciente: {
      nombreCompleto: string;
      rut: string;
      numeroFicha: string;
    };
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

class ProcedimientosKinesiologiaAPI {
  private baseURL = '/procedimientos-kinesiologia';

  // Crear múltiples procedimientos
  async crearProcedimientos(data: ProcedimientosBatchRequest): Promise<ProcedimientoKinesiologia[]> {
    try {
      const url = `${this.baseURL}/batch`;
      
      const response = await api.post<ProcedimientosBatchResponse>(url, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al crear procedimientos:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          fullURL: error.config?.baseURL + error.config?.url
        }
      });
      throw this.handleError(error);
    }
  }

  // Obtener todos los procedimientos (incluyendo los sin paciente asociado)
  async obtenerTodos(
    params: PaginationParams = {}
  ): Promise<{ procedimientos: ProcedimientoKinesiologia[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.fechaDesde) queryParams.append('fechaDesde', params.fechaDesde);
      if (params.fechaHasta) queryParams.append('fechaHasta', params.fechaHasta);
      
      const url = `${this.baseURL}/todos${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get<{ message: string; data: { procedimientos: ProcedimientoKinesiologia[]; pagination: any } }>(url);
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener todos los procedimientos:', error);
      throw this.handleError(error);
    }
  }

  // Obtener procedimientos por RUT del paciente
  async obtenerPorPaciente(
    rut: string, 
    params: PaginationParams = {}
  ): Promise<ProcedimientosListResponse['data']> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.fechaDesde) queryParams.append('fechaDesde', params.fechaDesde);
      if (params.fechaHasta) queryParams.append('fechaHasta', params.fechaHasta);
      
      const url = `${this.baseURL}/paciente/${rut}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get<ProcedimientosListResponse>(url);
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener procedimientos:', error);
      throw this.handleError(error);
    }
  }

  // Agregar procedimientos individuales a un grupo existente (similar fecha/turno)
  async agregarProcedimientos(data: {
    fecha: string;
    turno: string;
    procedimientos: {
      nombre: string;
      tiempo: string;
      pacienteRut?: string;
    }[];
  }): Promise<ProcedimientoKinesiologia[]> {
    try {
      const procedimientosParaEnviar = data.procedimientos.map(proc => ({
        pacienteRut: proc.pacienteRut || null,
        procedimientos: [{
          nombre: proc.nombre,
          fecha: data.fecha,
          turno: data.turno,
          tiempo: proc.tiempo,
          observaciones: ''
        }]
      }));

      // Crear cada procedimiento individualmente
      const resultados = [];
      for (const procData of procedimientosParaEnviar) {
        const response = await this.crearProcedimientos(procData);
        resultados.push(...response);
      }

      return resultados;
    } catch (error: any) {
      console.error('Error al agregar procedimientos:', error);
      throw this.handleError(error);
    }
  }

  // Actualizar procedimiento
  async actualizar(id: number, data: Partial<ProcedimientoKinesiologia>): Promise<ProcedimientoKinesiologia> {
    try {
      const response = await api.put(`${this.baseURL}/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al actualizar procedimiento:', error);
      throw this.handleError(error);
    }
  }

  // Eliminar procedimiento
  async eliminar(id: number): Promise<void> {
    try {
      await api.delete(`${this.baseURL}/${id}`);
    } catch (error: any) {
      console.error('Error al eliminar procedimiento:', error);
      throw this.handleError(error);
    }
  }

  // Validar datos de procedimientos
  validarProcedimientos(procedimientos: ProcedimientoRequest[]): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!procedimientos || procedimientos.length === 0) {
      errores.push('Debe agregar al menos un procedimiento');
      return { valido: false, errores };
    }

    procedimientos.forEach((proc, index) => {
      if (!proc.nombre) {
        errores.push(`Procedimiento ${index + 1}: Debe seleccionar un tipo de procedimiento`);
      }
      
      if (!proc.fecha) {
        errores.push(`Procedimiento ${index + 1}: Debe especificar una fecha`);
      }
      
      if (!proc.tiempo) {
        errores.push(`Procedimiento ${index + 1}: Debe especificar un tiempo`);
      } else {
        // Validar formato HH:MM
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(proc.tiempo)) {
          errores.push(`Procedimiento ${index + 1}: El tiempo debe estar en formato HH:MM`);
        }
      }
    });

    return {
      valido: errores.length === 0,
      errores
    };
  }

  // Manejar errores de la API
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    } else if (error.response?.data?.error) {
      return new Error(error.response.data.error);
    } else if (error.message) {
      return new Error(error.message);
    } else {
      return new Error('Error desconocido en la API de procedimientos');
    }
  }
}

// Instancia única de la API
const procedimientosKinesiologiaAPI = new ProcedimientosKinesiologiaAPI();

export default procedimientosKinesiologiaAPI;