import api from './api';

// Tipos TypeScript para la categorización
export interface CategorizacionKinesiologia {
  id?: number;
  pacienteRut: string;
  usuarioId?: number;
  fechaCategorizacion: string;
  patronRespiratorio: number;
  asistenciaVentilatoria: number;
  sasGlasgow: number;
  tosSecreciones: number;
  asistencia: number;
  puntajeTotal?: number;
  complejidad?: string;
  cargaAsistencial?: string;
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

export interface CategorizacionRequest {
  pacienteRut: string;
  fechaCategorizacion: string;
  patronRespiratorio: number;
  asistenciaVentilatoria: number;
  sasGlasgow: number;
  tosSecreciones: number;
  asistencia: number;
  observaciones?: string;
}

export interface CategorizacionResponse {
  message: string;
  data: CategorizacionKinesiologia | CategorizacionKinesiologia[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface CategorizacionListResponse {
  message: string;
  data: {
    categorizaciones: CategorizacionKinesiologia[];
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

export interface EstadisticasResponse {
  message: string;
  data: {
    estadisticas: Array<{
      complejidad: string;
      cantidad: number;
      puntajePromedio: number;
    }>;
    total: number;
    periodo: {
      fechaDesde?: string;
      fechaHasta?: string;
    };
  };
}

class CategorizacionKinesiologiaAPI {
  private baseURL = '/categorizacion-kinesiologia';

  // Crear nueva categorización
  async crear(categorización: CategorizacionRequest): Promise<CategorizacionKinesiologia> {
    try {
      console.log('🔧 Creando categorización con datos:', categorización);
      
      // Obtener token del localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
      
      // Usar fetch directamente para evitar problemas con axios
      const response = await fetch('http://localhost:3001/api/categorizacion-kinesiologia', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categorización),
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Categorización creada exitosamente:', data);
      return data.data as CategorizacionKinesiologia;
      
    } catch (error: any) {
      console.error('Error al crear categorización:', error);
      console.error('Status del error:', error.response?.status);
      console.error('Datos del error:', error.response?.data);
      throw this.handleError(error);
    }
  }

  // Obtener categorizaciones por RUT del paciente
  async obtenerPorPaciente(
    rut: string, 
    params: PaginationParams = {}
  ): Promise<CategorizacionListResponse['data']> {
    try {
      console.log('🔧 Obteniendo categorizaciones para paciente:', rut);
      
      // Obtener token del localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
      
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.fechaDesde) queryParams.append('fechaDesde', params.fechaDesde);
      if (params.fechaHasta) queryParams.append('fechaHasta', params.fechaHasta);
      
      const url = `http://localhost:3001/api/categorizacion-kinesiologia/paciente/${rut}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      console.log('🌐 URL:', url);
      
      // Usar fetch directamente
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Categorizaciones obtenidas:', data);
      return data.data;
      
    } catch (error: any) {
      console.error('Error al obtener categorizaciones:', error);
      throw this.handleError(error);
    }
  }

  // Obtener categorización específica por ID
  async obtenerPorId(id: number): Promise<CategorizacionKinesiologia> {
    try {
      const response = await api.get<CategorizacionResponse>(`${this.baseURL}/${id}`);
      return response.data.data as CategorizacionKinesiologia;
    } catch (error: any) {
      console.error('Error al obtener categorización:', error);
      throw this.handleError(error);
    }
  }

  // Actualizar categorización
  async actualizar(id: number, categorización: Partial<CategorizacionRequest>): Promise<CategorizacionKinesiologia> {
    try {
      const response = await api.put<CategorizacionResponse>(`${this.baseURL}/${id}`, categorización);
      return response.data.data as CategorizacionKinesiologia;
    } catch (error: any) {
      console.error('Error al actualizar categorización:', error);
      throw this.handleError(error);
    }
  }

  // Eliminar categorización
  async eliminar(id: number): Promise<{ id: number }> {
    try {
      const response = await api.delete<{ message: string; data: { id: number } }>(`${this.baseURL}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error al eliminar categorización:', error);
      throw this.handleError(error);
    }
  }

  // Obtener estadísticas
  async obtenerEstadisticas(params: { fechaDesde?: string; fechaHasta?: string } = {}): Promise<EstadisticasResponse['data']> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.fechaDesde) queryParams.append('fechaDesde', params.fechaDesde);
      if (params.fechaHasta) queryParams.append('fechaHasta', params.fechaHasta);
      
      const url = `${this.baseURL}/estadisticas/resumen${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get<EstadisticasResponse>(url);
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      throw this.handleError(error);
    }
  }

  // Método para calcular complejidad (útil para validaciones frontend)
  calcularComplejidad(puntaje: number): { complejidad: string; cargaAsistencial: string } {
    if (puntaje === 5) {
      return { complejidad: 'Baja', cargaAsistencial: '0-1' };
    } else if (puntaje >= 6 && puntaje <= 10) {
      return { complejidad: 'Mediana', cargaAsistencial: '2-3 + Noche' };
    } else if (puntaje >= 11) {
      return { complejidad: 'Alta', cargaAsistencial: '3-4 + Noche' };
    }
    return { complejidad: '', cargaAsistencial: '' };
  }

  // Validar datos de categorización
  validarCategorizacion(categorización: CategorizacionRequest): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    // Validar RUT del paciente
    if (!categorización.pacienteRut || categorización.pacienteRut.trim().length === 0) {
      errores.push('RUT del paciente es requerido');
    }

    // Validar fecha
    if (!categorización.fechaCategorizacion) {
      errores.push('Fecha de categorización es requerida');
    } else {
      const fecha = new Date(categorización.fechaCategorizacion);
      if (isNaN(fecha.getTime())) {
        errores.push('Fecha de categorización no es válida');
      }
    }

    // Validar puntajes (deben ser 1, 3 o 5)
    const puntajesValidos = [1, 3, 5];
    const campos = [
      { nombre: 'Patrón respiratorio', valor: categorización.patronRespiratorio },
      { nombre: 'Asistencia ventilatoria', valor: categorización.asistenciaVentilatoria },
      { nombre: 'SAS/Glasgow', valor: categorización.sasGlasgow },
      { nombre: 'Tos/Secreciones', valor: categorización.tosSecreciones },
      { nombre: 'Asistencia', valor: categorización.asistencia }
    ];

    campos.forEach(campo => {
      if (!puntajesValidos.includes(campo.valor)) {
        errores.push(`${campo.nombre} debe ser 1, 3 o 5`);
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
      return new Error('Error desconocido en la API');
    }
  }
}

// Instancia única de la API
const categorizacionKinesiologiaAPI = new CategorizacionKinesiologiaAPI();

// Exportar alias para compatibilidad
export type Categorizacion = CategorizacionKinesiologia;

export default categorizacionKinesiologiaAPI;