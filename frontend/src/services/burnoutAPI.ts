import api from './api';

export interface RespuestaBurnout {
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p5: number;
  p6: number;
  p7: number;
  p8: number;
  p9: number;
  p10: number;
  p11: number;
  p12: number;
  p13: number;
  p14: number;
  p15: number;
  p16: number;
  p17: number;
  p18: number;
  p19: number;
  p20: number;
  p21: number;
  p22: number;
}

export interface CuestionarioBurnoutData {
  respuestas: RespuestaBurnout;
  estamento: string;
}

export interface ResultadoBurnout {
  id: number;
  usuarioId: number;
  estamento: string;
  fechaRespuesta: string;
  agotamientoEmocional: number;
  despersonalizacion: number;
  realizacionPersonal: number;
  nivelAgotamiento: 'bajo' | 'medio' | 'alto';
  nivelDespersonalizacion: 'bajo' | 'medio' | 'alto';
  nivelRealizacion: 'bajo' | 'medio' | 'alto';
  createdAt: string;
  updatedAt: string;
  usuario?: {
    nombres: string;
    apellidos: string;
    usuario: string;
  };
}

export interface EstadisticasBurnout {
  totalCuestionarios: number;
  porEstamento: {
    [estamento: string]: {
      total: number;
      promedioAgotamiento: number;
      promedioDespersonalizacion: number;
      promedioRealizacion: number;
      nivelAgotamientoAlto: number;
      nivelDespersonalizacionAlto: number;
      nivelRealizacionBajo: number;
    };
  };
}

const burnoutAPI = {
  // Guardar respuesta del cuestionario
  async guardarRespuesta(data: CuestionarioBurnoutData): Promise<ResultadoBurnout> {
    try {
      const response = await api.post('/burnout/guardar', data);
      return response.data;
    } catch (error: any) {
      console.error('Error al guardar respuesta del cuestionario:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Error al guardar la respuesta');
    }
  },

  // Obtener historial de respuestas del usuario
  async obtenerHistorialUsuario(): Promise<ResultadoBurnout[]> {
    try {
      const response = await api.get('/burnout/historial');
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener historial:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener el historial');
    }
  },

  // Obtener estadísticas generales (solo para administradores)
  async obtenerEstadisticas(): Promise<EstadisticasBurnout> {
    try {
      const response = await api.get('/burnout/estadisticas');
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener las estadísticas');
    }
  },

  // Obtener última respuesta del usuario
  async obtenerUltimaRespuesta(): Promise<ResultadoBurnout | null> {
    try {
      const response = await api.get('/burnout/ultima');
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener última respuesta:', error);
      return null;
    }
  },

  // Obtener todos los cuestionarios (solo para administradores)
  async obtenerTodosCuestionarios(): Promise<ResultadoBurnout[]> {
    try {
      const response = await api.get('/burnout/todos');
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener todos los cuestionarios:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener los cuestionarios');
    }
  },

  // Obtener respuestas detalladas de un cuestionario específico (solo para administradores)
  async obtenerRespuestasDetalladas(cuestionarioId: number): Promise<RespuestaBurnout> {
    try {
      const response = await api.get(`/burnout/respuestas/${cuestionarioId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener respuestas detalladas:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener las respuestas detalladas');
    }
  }
};

export default burnoutAPI;
