import api from './api';

export interface EstadisticasUTI {
  ocupacion: {
    camasOcupadas: number;
    totalCamas: number;
    tasaOcupacion: number;
    nivel: 'normal' | 'alto' | 'critico';
  };
  severidad: {
    apachePromedio: number;
    nasPromedio: number;
    pacientesCriticos: number;
    distribucionApache: {
      bajo: number;
      moderado: number;
      alto: number;
    };
    distribucionNAS: {
      baja: number;
      moderada: number;
      alta: number;
    };
    distribucionKinesiologia: {
      baja: number;
      mediana: number;
      alta: number;
    };
  };
  tiempo: {
    medicina: { total: number; promedio: number };
    enfermeria: { total: number; promedio: number };
    kinesiologia: { total: number; promedio: number };
    tens: { total: number; promedio: number };
    auxiliares: { total: number; promedio: number };
  };
  tendencias: {
    ocupacion7dias: number[];
    tiempo7dias: number[];
  };
  procedimientosDetalle: Array<{
    nombre: string;
    estamento: string;
    tiempoPromedio: number;
    cantidad: number;
  }>;
  rankingProcedimientos: Array<{
    nombre: string;
    estamento: string;
    tiempoPromedio: number;
    cantidad: number;
  }>;
}

export interface EstadisticasEstamento {
  totalProcedimientos?: number;
  tiempoTotal: number;
  tiempoPromedio: number;
  totalEvaluaciones?: number;
  puntuacionPromedio?: number;
  totalCategorizaciones?: number;
  puntajePromedio?: number;
  totalRegistros?: number;
  distribucionCarga?: {
    baja: number;
    moderada: number;
    alta: number;
  };
  distribucionComplejidad?: {
    baja: number;
    mediana: number;
    alta: number;
  };
  distribucionPorTurno?: {
    dia: number;
    noche: number;
    '24h': number;
  };
  procedimientosPorTurno?: {
    '24 h': number;
    '22 h': number;
    '12 h': number;
  };
  procedimientosMasFrecuentes?: Array<{
    nombre: string;
    cantidad: number;
  }>;
}

const estadisticasAPI = {
  // Obtener estadísticas generales de UTI
  obtenerEstadisticasUTI: async (fechaInicio?: string, fechaFin?: string): Promise<EstadisticasUTI> => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get(`/estadisticas/uti?${params.toString()}`);
    return response.data.data;
  },

  // Obtener estadísticas por estamento
  obtenerEstadisticasEstamento: async (
    estamento: 'medicina' | 'enfermeria' | 'kinesiologia' | 'tens' | 'auxiliares',
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<EstadisticasEstamento> => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get(`/estadisticas/estamento/${estamento}?${params.toString()}`);
    return response.data.data;
  },

  // Obtener métricas de ocupación en tiempo real
  obtenerOcupacionTiempoReal: async () => {
    const response = await api.get('/estadisticas/uti');
    return response.data.data.ocupacion;
  },

  // Obtener métricas de severidad
  obtenerSeveridad: async () => {
    const response = await api.get('/estadisticas/uti');
    return response.data.data.severidad;
  },

  // Obtener métricas de tiempo por estamento
  obtenerTiempoEstamentos: async () => {
    const response = await api.get('/estadisticas/uti');
    return response.data.data.tiempo;
  },

  // Obtener tendencias históricas
  obtenerTendencias: async (dias: number = 7) => {
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);
    
    const response = await api.get('/estadisticas/uti', {
      params: {
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0]
      }
    });
    return response.data.data.tendencias;
  }
};

export default estadisticasAPI;
