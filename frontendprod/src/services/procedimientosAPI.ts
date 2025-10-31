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

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Procedimiento {
  id: number;
  nombre: string;
  descripcion?: string;
  estamento: string;
  tiempoEstimado?: number; // en minutos
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProcedimientoInput {
  nombre: string;
  descripcion?: string;
  estamento: string;
  tiempoEstimado?: number;
  activo?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class ProcedimientosService {
  // Datos temporales con procedimientos reales del sistema
  private procedimientosTemporales: Procedimiento[] = [
    // ENFERMERÍA
    {
      id: 1,
      nombre: 'Instalación VVP',
      descripcion: 'Instalación de vía venosa periférica',
      estamento: 'Enfermería',
      tiempoEstimado: 15,
      activo: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      nombre: 'Instalación CVC',
      descripcion: 'Instalación de catéter venoso central',
      estamento: 'Enfermería',
      tiempoEstimado: 30,
      activo: true,
      createdAt: '2024-01-15T10:05:00Z',
      updatedAt: '2024-01-15T10:05:00Z'
    },
    {
      id: 3,
      nombre: 'Instalación CHD',
      descripcion: 'Instalación de catéter de hemodiálisis',
      estamento: 'Enfermería',
      tiempoEstimado: 25,
      activo: true,
      createdAt: '2024-01-15T10:10:00Z',
      updatedAt: '2024-01-15T10:10:00Z'
    },
    {
      id: 4,
      nombre: 'IOT',
      descripcion: 'Intubación orotraqueal',
      estamento: 'Enfermería',
      tiempoEstimado: 20,
      activo: true,
      createdAt: '2024-01-15T10:15:00Z',
      updatedAt: '2024-01-15T10:15:00Z'
    },
    {
      id: 5,
      nombre: 'Extubación',
      descripcion: 'Retiro de tubo endotraqueal',
      estamento: 'Enfermería',
      tiempoEstimado: 15,
      activo: true,
      createdAt: '2024-01-15T10:20:00Z',
      updatedAt: '2024-01-15T10:20:00Z'
    },
    {
      id: 6,
      nombre: 'Cambio de TQT',
      descripcion: 'Cambio de traqueostomía',
      estamento: 'Enfermería',
      tiempoEstimado: 20,
      activo: true,
      createdAt: '2024-01-15T10:25:00Z',
      updatedAt: '2024-01-15T10:25:00Z'
    },
    {
      id: 7,
      nombre: 'Fibrobroncoscopía',
      descripcion: 'Asistencia en fibrobroncoscopía',
      estamento: 'Enfermería',
      tiempoEstimado: 45,
      activo: true,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 8,
      nombre: 'Aspiración de secreciones por TQT',
      descripcion: 'Aspiración de secreciones por traqueostomía',
      estamento: 'Enfermería',
      tiempoEstimado: 10,
      activo: true,
      createdAt: '2024-01-15T10:35:00Z',
      updatedAt: '2024-01-15T10:35:00Z'
    },
    {
      id: 9,
      nombre: 'Instalación de Sonda Foley',
      descripcion: 'Instalación de sonda vesical',
      estamento: 'Enfermería',
      tiempoEstimado: 10,
      activo: true,
      createdAt: '2024-01-15T10:40:00Z',
      updatedAt: '2024-01-15T10:40:00Z'
    },
    {
      id: 10,
      nombre: 'Instalación de SNG',
      descripcion: 'Instalación de sonda nasogástrica',
      estamento: 'Enfermería',
      tiempoEstimado: 10,
      activo: true,
      createdAt: '2024-01-15T10:45:00Z',
      updatedAt: '2024-01-15T10:45:00Z'
    },

    // KINESIOLOGÍA
    {
      id: 11,
      nombre: 'Kinesiterapia respiratoria (Ev, KTR, EMR, etc)',
      descripcion: 'Terapia respiratoria especializada',
      estamento: 'Kinesiología',
      tiempoEstimado: 30,
      activo: true,
      createdAt: '2024-01-15T11:00:00Z',
      updatedAt: '2024-01-15T11:00:00Z'
    },
    {
      id: 12,
      nombre: 'Kinesiterapia motora',
      descripcion: 'Terapia de movilización y ejercicios',
      estamento: 'Kinesiología',
      tiempoEstimado: 25,
      activo: true,
      createdAt: '2024-01-15T11:05:00Z',
      updatedAt: '2024-01-15T11:05:00Z'
    },
    {
      id: 13,
      nombre: 'Kinesiterapia integral (respiratorio + motor)',
      descripcion: 'Terapia integral respiratoria y motora',
      estamento: 'Kinesiología',
      tiempoEstimado: 45,
      activo: true,
      createdAt: '2024-01-15T11:10:00Z',
      updatedAt: '2024-01-15T11:10:00Z'
    },
    {
      id: 14,
      nombre: 'Instalación de VMNI',
      descripcion: 'Instalación de ventilación mecánica no invasiva',
      estamento: 'Kinesiología',
      tiempoEstimado: 20,
      activo: true,
      createdAt: '2024-01-15T11:15:00Z',
      updatedAt: '2024-01-15T11:15:00Z'
    },
    {
      id: 15,
      nombre: 'Instalación de CNAF',
      descripcion: 'Instalación de cánula nasal de alto flujo',
      estamento: 'Kinesiología',
      tiempoEstimado: 15,
      activo: true,
      createdAt: '2024-01-15T11:20:00Z',
      updatedAt: '2024-01-15T11:20:00Z'
    },
    {
      id: 16,
      nombre: 'PCR',
      descripcion: 'Procedimiento de reanimación cardiopulmonar',
      estamento: 'Kinesiología',
      tiempoEstimado: 60,
      activo: true,
      createdAt: '2024-01-15T11:25:00Z',
      updatedAt: '2024-01-15T11:25:00Z'
    },
    {
      id: 17,
      nombre: 'Tareas administrativas (evoluciones, estadísticas, etc)',
      descripcion: 'Tareas administrativas de kinesiología',
      estamento: 'Kinesiología',
      tiempoEstimado: 20,
      activo: true,
      createdAt: '2024-01-15T11:30:00Z',
      updatedAt: '2024-01-15T11:30:00Z'
    },
    {
      id: 18,
      nombre: 'Entrega de turno (solo cuando se recibe turno)',
      descripcion: 'Entrega de turno de kinesiología',
      estamento: 'Kinesiología',
      tiempoEstimado: 15,
      activo: true,
      createdAt: '2024-01-15T11:35:00Z',
      updatedAt: '2024-01-15T11:35:00Z'
    },

    // MEDICINA
    {
      id: 19,
      nombre: 'Administrativo (evoluciones, revisión de HC, indicaciones, etc)',
      descripcion: 'Tareas administrativas médicas',
      estamento: 'Medicina',
      tiempoEstimado: 30,
      activo: true,
      createdAt: '2024-01-15T12:00:00Z',
      updatedAt: '2024-01-15T12:00:00Z'
    },
    {
      id: 20,
      nombre: 'Egreso (redacción de egreso, indicaciones, etc)',
      descripcion: 'Proceso de egreso del paciente',
      estamento: 'Medicina',
      tiempoEstimado: 25,
      activo: true,
      createdAt: '2024-01-15T12:05:00Z',
      updatedAt: '2024-01-15T12:05:00Z'
    },
    {
      id: 21,
      nombre: 'Entrega de turno (solo cuando se recibe turno)',
      descripcion: 'Entrega de turno médico',
      estamento: 'Medicina',
      tiempoEstimado: 20,
      activo: true,
      createdAt: '2024-01-15T12:10:00Z',
      updatedAt: '2024-01-15T12:10:00Z'
    },
    {
      id: 22,
      nombre: 'Ingreso (redacción de ingreso, evaluación y procedimientos correspondientes)',
      descripcion: 'Proceso de ingreso del paciente',
      estamento: 'Medicina',
      tiempoEstimado: 40,
      activo: true,
      createdAt: '2024-01-15T12:15:00Z',
      updatedAt: '2024-01-15T12:15:00Z'
    },
    {
      id: 23,
      nombre: 'Interconsulta (lectura de HC, evaluación/reevaluación, evolución)',
      descripcion: 'Proceso de interconsulta médica',
      estamento: 'Medicina',
      tiempoEstimado: 35,
      activo: true,
      createdAt: '2024-01-15T12:20:00Z',
      updatedAt: '2024-01-15T12:20:00Z'
    },
    {
      id: 24,
      nombre: 'Colonoscopía',
      descripcion: 'Procedimiento de colonoscopía',
      estamento: 'Medicina',
      tiempoEstimado: 60,
      activo: true,
      createdAt: '2024-01-15T12:25:00Z',
      updatedAt: '2024-01-15T12:25:00Z'
    },
    {
      id: 25,
      nombre: 'Endoscopía',
      descripcion: 'Procedimiento de endoscopía',
      estamento: 'Medicina',
      tiempoEstimado: 45,
      activo: true,
      createdAt: '2024-01-15T12:30:00Z',
      updatedAt: '2024-01-15T12:30:00Z'
    },
    {
      id: 26,
      nombre: 'Ecografía',
      descripcion: 'Procedimiento de ecografía',
      estamento: 'Medicina',
      tiempoEstimado: 30,
      activo: true,
      createdAt: '2024-01-15T12:35:00Z',
      updatedAt: '2024-01-15T12:35:00Z'
    },

    // TENS
    {
      id: 27,
      nombre: 'Esterilización (conteo de materiales, recolección y traslados)',
      descripcion: 'Proceso de esterilización de materiales',
      estamento: 'TENS',
      tiempoEstimado: 30,
      activo: true,
      createdAt: '2024-01-15T13:00:00Z',
      updatedAt: '2024-01-15T13:00:00Z'
    },
    {
      id: 28,
      nombre: 'Tareas administrativas (registros, evoluciones, etc)',
      descripcion: 'Tareas administrativas de TENS',
      estamento: 'TENS',
      tiempoEstimado: 20,
      activo: true,
      createdAt: '2024-01-15T13:05:00Z',
      updatedAt: '2024-01-15T13:05:00Z'
    },
    {
      id: 29,
      nombre: 'Entrega de turno (solo cuando se recibe)',
      descripcion: 'Entrega de turno de TENS',
      estamento: 'TENS',
      tiempoEstimado: 15,
      activo: true,
      createdAt: '2024-01-15T13:10:00Z',
      updatedAt: '2024-01-15T13:10:00Z'
    },
    {
      id: 30,
      nombre: 'Toma de signos vitales',
      descripcion: 'Control de signos vitales del paciente',
      estamento: 'TENS',
      tiempoEstimado: 10,
      activo: true,
      createdAt: '2024-01-15T13:15:00Z',
      updatedAt: '2024-01-15T13:15:00Z'
    },
    {
      id: 31,
      nombre: 'Aseo y cuidados del paciente (aseo parcial o completo, cuidados de la piel, etc)',
      descripcion: 'Cuidados de aseo y piel del paciente',
      estamento: 'TENS',
      tiempoEstimado: 25,
      activo: true,
      createdAt: '2024-01-15T13:20:00Z',
      updatedAt: '2024-01-15T13:20:00Z'
    },
    {
      id: 32,
      nombre: 'Administración de medicamentos oral/SNG/SNY/Gastrostomía',
      descripcion: 'Administración de medicamentos por diferentes vías',
      estamento: 'TENS',
      tiempoEstimado: 15,
      activo: true,
      createdAt: '2024-01-15T13:25:00Z',
      updatedAt: '2024-01-15T13:25:00Z'
    },
    {
      id: 33,
      nombre: 'Medición de diuresis',
      descripcion: 'Control y medición de diuresis',
      estamento: 'TENS',
      tiempoEstimado: 5,
      activo: true,
      createdAt: '2024-01-15T13:30:00Z',
      updatedAt: '2024-01-15T13:30:00Z'
    },
    {
      id: 34,
      nombre: 'Administración de broncodilatadores o nebulización',
      descripcion: 'Administración de medicamentos broncodilatadores',
      estamento: 'TENS',
      tiempoEstimado: 20,
      activo: true,
      createdAt: '2024-01-15T13:35:00Z',
      updatedAt: '2024-01-15T13:35:00Z'
    },
    {
      id: 35,
      nombre: 'Control de glicemia',
      descripcion: 'Control de niveles de glucosa',
      estamento: 'TENS',
      tiempoEstimado: 5,
      activo: true,
      createdAt: '2024-01-15T13:40:00Z',
      updatedAt: '2024-01-15T13:40:00Z'
    },
    {
      id: 36,
      nombre: 'Curación simple (asistencia)',
      descripcion: 'Asistencia en curaciones simples',
      estamento: 'TENS',
      tiempoEstimado: 15,
      activo: true,
      createdAt: '2024-01-15T13:45:00Z',
      updatedAt: '2024-01-15T13:45:00Z'
    },
    {
      id: 37,
      nombre: 'Curación avanzada (asistencia)',
      descripcion: 'Asistencia en curaciones avanzadas',
      estamento: 'TENS',
      tiempoEstimado: 25,
      activo: true,
      createdAt: '2024-01-15T13:50:00Z',
      updatedAt: '2024-01-15T13:50:00Z'
    },
    {
      id: 38,
      nombre: 'Cambio de posición',
      descripcion: 'Cambio de posición del paciente',
      estamento: 'TENS',
      tiempoEstimado: 10,
      activo: true,
      createdAt: '2024-01-15T13:55:00Z',
      updatedAt: '2024-01-15T13:55:00Z'
    },
    {
      id: 39,
      nombre: 'Alimentación asistida',
      descripcion: 'Asistencia en alimentación del paciente',
      estamento: 'TENS',
      tiempoEstimado: 20,
      activo: true,
      createdAt: '2024-01-15T14:00:00Z',
      updatedAt: '2024-01-15T14:00:00Z'
    },
    {
      id: 40,
      nombre: 'Traslado interno',
      descripcion: 'Traslado interno del paciente',
      estamento: 'TENS',
      tiempoEstimado: 15,
      activo: true,
      createdAt: '2024-01-15T14:05:00Z',
      updatedAt: '2024-01-15T14:05:00Z'
    },
    {
      id: 41,
      nombre: 'Traslado a TAC sin contraste',
      descripcion: 'Traslado a TAC sin medio de contraste',
      estamento: 'TENS',
      tiempoEstimado: 30,
      activo: true,
      createdAt: '2024-01-15T14:10:00Z',
      updatedAt: '2024-01-15T14:10:00Z'
    },
    {
      id: 42,
      nombre: 'Traslado a TAC con contraste',
      descripcion: 'Traslado a TAC con medio de contraste',
      estamento: 'TENS',
      tiempoEstimado: 45,
      activo: true,
      createdAt: '2024-01-15T14:15:00Z',
      updatedAt: '2024-01-15T14:15:00Z'
    },
    {
      id: 43,
      nombre: 'Control de drenajes (vaciado y registro)',
      descripcion: 'Control y registro de drenajes',
      estamento: 'TENS',
      tiempoEstimado: 10,
      activo: true,
      createdAt: '2024-01-15T14:20:00Z',
      updatedAt: '2024-01-15T14:20:00Z'
    },
    {
      id: 44,
      nombre: 'Educación familiar',
      descripcion: 'Educación a familiares del paciente',
      estamento: 'TENS',
      tiempoEstimado: 20,
      activo: true,
      createdAt: '2024-01-15T14:25:00Z',
      updatedAt: '2024-01-15T14:25:00Z'
    },

    // AUXILIARES
    {
      id: 45,
      nombre: 'Entrega de turno',
      descripcion: 'Entrega de turno de auxiliares',
      estamento: 'Auxiliar',
      tiempoEstimado: 15,
      activo: true,
      createdAt: '2024-01-15T15:00:00Z',
      updatedAt: '2024-01-15T15:00:00Z'
    },
    {
      id: 46,
      nombre: 'Aseo terminal',
      descripcion: 'Limpieza y desinfección terminal',
      estamento: 'Auxiliar',
      tiempoEstimado: 45,
      activo: true,
      createdAt: '2024-01-15T15:05:00Z',
      updatedAt: '2024-01-15T15:05:00Z'
    },
    {
      id: 47,
      nombre: 'Entrega de interconsulta',
      descripcion: 'Entrega de documentos de interconsulta',
      estamento: 'Auxiliar',
      tiempoEstimado: 10,
      activo: true,
      createdAt: '2024-01-15T15:10:00Z',
      updatedAt: '2024-01-15T15:10:00Z'
    },
    {
      id: 48,
      nombre: 'Entrega de exámenes',
      descripcion: 'Entrega de resultados de exámenes',
      estamento: 'Auxiliar',
      tiempoEstimado: 10,
      activo: true,
      createdAt: '2024-01-15T15:15:00Z',
      updatedAt: '2024-01-15T15:15:00Z'
    },
    {
      id: 49,
      nombre: 'Entrega de recetas / recepción de fármacos (trayecto hacia y desde farmacia)',
      descripcion: 'Gestión de recetas y fármacos',
      estamento: 'Auxiliar',
      tiempoEstimado: 20,
      activo: true,
      createdAt: '2024-01-15T15:20:00Z',
      updatedAt: '2024-01-15T15:20:00Z'
    },
    {
      id: 50,
      nombre: 'Aseo regular',
      descripcion: 'Limpieza regular de áreas',
      estamento: 'Auxiliar',
      tiempoEstimado: 30,
      activo: true,
      createdAt: '2024-01-15T15:25:00Z',
      updatedAt: '2024-01-15T15:25:00Z'
    },
    {
      id: 51,
      nombre: 'Recepción / entrega de ropa',
      descripcion: 'Gestión de ropa hospitalaria',
      estamento: 'Auxiliar',
      tiempoEstimado: 15,
      activo: true,
      createdAt: '2024-01-15T15:30:00Z',
      updatedAt: '2024-01-15T15:30:00Z'
    }
  ];

  async obtenerProcedimientos(): Promise<Procedimiento[]> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.procedimientosTemporales];
  }

  async obtenerProcedimiento(id: number): Promise<Procedimiento> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const procedimiento = this.procedimientosTemporales.find(p => p.id === id);
    if (!procedimiento) {
      throw new Error('Procedimiento no encontrado');
    }
    return procedimiento;
  }

  async crearProcedimiento(procedimiento: ProcedimientoInput): Promise<Procedimiento> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const nuevoProcedimiento: Procedimiento = {
      id: Math.max(...this.procedimientosTemporales.map(p => p.id)) + 1,
      nombre: procedimiento.nombre,
      descripcion: procedimiento.descripcion,
      estamento: procedimiento.estamento,
      tiempoEstimado: procedimiento.tiempoEstimado,
      activo: procedimiento.activo ?? true, // Default a true si no se especifica
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.procedimientosTemporales.push(nuevoProcedimiento);
    return nuevoProcedimiento;
  }

  async actualizarProcedimiento(id: number, procedimiento: ProcedimientoInput): Promise<Procedimiento> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = this.procedimientosTemporales.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Procedimiento no encontrado');
    }
    this.procedimientosTemporales[index] = {
      ...this.procedimientosTemporales[index],
      nombre: procedimiento.nombre,
      descripcion: procedimiento.descripcion,
      estamento: procedimiento.estamento,
      tiempoEstimado: procedimiento.tiempoEstimado,
      activo: procedimiento.activo ?? this.procedimientosTemporales[index].activo, // Mantener valor actual si no se especifica
      updatedAt: new Date().toISOString()
    };
    return this.procedimientosTemporales[index];
  }

  async eliminarProcedimiento(id: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = this.procedimientosTemporales.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Procedimiento no encontrado');
    }
    this.procedimientosTemporales.splice(index, 1);
  }

  async obtenerProcedimientosPorEstamento(estamento: string): Promise<Procedimiento[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.procedimientosTemporales.filter(p => p.estamento === estamento);
  }

  async activarDesactivarProcedimiento(id: number, activo: boolean): Promise<Procedimiento> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = this.procedimientosTemporales.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Procedimiento no encontrado');
    }
    this.procedimientosTemporales[index].activo = activo;
    this.procedimientosTemporales[index].updatedAt = new Date().toISOString();
    return this.procedimientosTemporales[index];
  }
}

export default new ProcedimientosService();
