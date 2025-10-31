import React, { useState, useEffect } from 'react';
import { Paciente } from '../services/api';
import { enfermeriaService } from '../services/enfermeriaAPI';
import apache2Service from '../services/apache2API';
import categorizacionKinesiologiaAPI, { CategorizacionKinesiologia } from '../services/categorizacionKinesiologiaAPI';
import registroProcedimientosAPI, { ProcedimientoRegistroItem } from '../services/registroProcedimientosAPI';
import procedimientosKinesiologiaAPI, { ProcedimientoKinesiologia } from '../services/procedimientosKinesiologiaAPI';
import medicinaAPI, { ProcedimientoMedicina } from '../services/medicinaAPI';
import nasAPI, { NASRegistro } from '../services/nasAPI';
import procedimientosTENSAPI, { ProcedimientoTENSItem } from '../services/procedimientosTENSAPI';
import ModalDetalleNAS from './ModalDetalleNAS';
import ModalDetalleApache2Paciente from './ModalDetalleApache2Paciente';
import ModalDetalleCategorizacionKinesiologiaDia from './ModalDetalleCategorizacionKinesiologiaDia';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface FichaPacienteProps {
  paciente: Paciente;
  onClose: () => void;
}

interface Apache2DelDia {
  id: number;
  puntajeTotal: number;
  nivelRiesgo: string;
  riesgoMortalidad: string;
  fechaEvaluacion: string;
}

interface NASDelDia {
  id: number;
  puntuacion: number;
  fechaRegistro: string;
}

interface CategorizacionDelDia {
  id: number;
  puntajeTotal: number;
  complejidad: string;
  cargaAsistencial: string;
  fechaCategorizacion: string;
}

interface ProcedimientosDelDia {
  enfermeria: ProcedimientoRegistroItem[];
  medicina: ProcedimientoMedicina[];
  kinesiologia: ProcedimientoKinesiologia[];
  tens: ProcedimientoTENSItem[];
}

interface MetricasEgresado {
  totalDias: number;
  totalCategorizaciones: number;
  totalProcedimientos: number;
  totalRegistrosNAS: number;
  promedioPuntajeCategorizacion: number;
  promedioPuntajeNAS: number;
  distribucionComplejidad: { complejidad: string; cantidad: number; porcentaje: number }[];
}

interface DatoGrafico {
  fecha: string;
  puntajeCategorizacion?: number;
  puntajeNAS?: number;
  cantidadProcedimientos?: number;
  complejidad?: string;
}

const FichaPaciente: React.FC<FichaPacienteProps> = ({ paciente, onClose }) => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>(new Date());
  const [showCalendario, setShowCalendario] = useState(false);
  const [mesActual, setMesActual] = useState(new Date());
  
  // Estados para métricas de pacientes egresados
  const [metricasEgresado, setMetricasEgresado] = useState<MetricasEgresado | null>(null);
  const [datosGraficos, setDatosGraficos] = useState<DatoGrafico[]>([]);
  const [categorizacionesHistoricas, setCategorizacionesHistoricas] = useState<CategorizacionKinesiologia[]>([]);
  const [registrosNASHistoricos, setRegistrosNASHistoricos] = useState<NASRegistro[]>([]);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  
  // Estados para las 3 métricas
  const [apache2DelDia, setApache2DelDia] = useState<Apache2DelDia | null>(null);
  const [nasDelDia, setNasDelDia] = useState<NASDelDia | null>(null);
  const [categorizacionDelDia, setCategorizacionDelDia] = useState<CategorizacionDelDia | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para modales de detalle
  const [showModalApache2, setShowModalApache2] = useState(false);
  const [showModalNAS, setShowModalNAS] = useState(false);
  const [showModalCategorizacion, setShowModalCategorizacion] = useState(false);
  
  // Estados para procedimientos
  const [procedimientosDelDia, setProcedimientosDelDia] = useState<ProcedimientosDelDia>({
    enfermeria: [],
    medicina: [],
    kinesiologia: [],
    tens: []
  });
  const [loadingProcedimientos, setLoadingProcedimientos] = useState(false);

  // Cargar Apache2 una sola vez al inicio (no depende de la fecha)
  useEffect(() => {
    if (paciente) {
      cargarApache2();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar datos del día cuando cambia la fecha seleccionada
  useEffect(() => {
    if (paciente) {
      cargarDatosDelDia();
      cargarProcedimientosDelDia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaSeleccionada]);

  // Cargar datos históricos para pacientes egresados al montar el componente
  useEffect(() => {
    if (paciente.fechaEgresoUTI) {
      cargarDatosHistoricosEgresado();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente.rut, paciente.fechaEgresoUTI]);

  // Cargar datos históricos para pacientes egresados
  // Función para calcular promedios de categorías NAS
  const calcularPromediosNASRadar = (registros: NASRegistro[]) => {
    if (registros.length === 0) return [];
    
    const totalRegistros = registros.length;
    
    const categorias = [
      {
        categoria: 'Monitorización',
        items: ['item_1a', 'item_1b', 'item_1c'],
        valores: [4.5, 12.1, 19.6]
      },
      {
        categoria: 'Investigación/Medicación',
        items: ['item_2', 'item_3'],
        valores: [4.3, 5.6]
      },
      {
        categoria: 'Higiene',
        items: ['item_4a', 'item_4b', 'item_4c', 'item_5'],
        valores: [4.1, 16.5, 20.0, 1.8]
      },
      {
        categoria: 'Movilización',
        items: ['item_6a', 'item_6b', 'item_6c'],
        valores: [5.5, 12.4, 17.0]
      },
      {
        categoria: 'Apoyo Familiar',
        items: ['item_7a', 'item_7b'],
        valores: [4.0, 32.0]
      },
      {
        categoria: 'Administrativo',
        items: ['item_8a', 'item_8b', 'item_8c'],
        valores: [4.2, 23.2, 30.0]
      },
      {
        categoria: 'Soporte Respiratorio',
        items: ['item_9', 'item_10', 'item_11'],
        valores: [1.4, 1.8, 4.4]
      },
      {
        categoria: 'Soporte Hemodinámico',
        items: ['item_12', 'item_13', 'item_14', 'item_16'],
        valores: [1.2, 2.5, 1.7, 7.7]
      },
      {
        categoria: 'Intervenciones Específicas',
        items: ['item_15', 'item_17', 'item_18', 'item_19', 'item_20', 'item_21', 'item_22', 'item_23'],
        valores: [7.1, 7.0, 1.6, 1.3, 2.8, 1.3, 2.8, 1.9]
      }
    ];

    return categorias.map(cat => {
      let sumaPuntuacion = 0;
      
      registros.forEach(nas => {
        let puntuacionCategoria = 0;
        cat.items.forEach((item, index) => {
          if ((nas as any)[item]) {
            puntuacionCategoria += cat.valores[index];
          }
        });
        sumaPuntuacion += puntuacionCategoria;
      });
      
      const promedio = sumaPuntuacion / totalRegistros;
      
      return {
        categoria: cat.categoria,
        puntuacion: Math.round(promedio * 10) / 10
      };
    });
  };

  // Función para obtener descripción de categorización
  const obtenerDescripcionCategorizacion = (puntaje: number) => {
    if (puntaje === 5) return { nivel: 'Baja', descripcion: 'Carga baja (0-1)' };
    if (puntaje >= 6 && puntaje <= 10) return { nivel: 'Mediana', descripcion: 'Carga mediana (2-3 + Noche)' };
    if (puntaje >= 11) return { nivel: 'Alta', descripcion: 'Carga alta (3-4 + Noche)' };
    return { nivel: 'Sin datos', descripcion: 'Sin categorización' };
  };

  // Función para obtener descripción de NAS
  const obtenerDescripcionNAS = (puntuacion: number) => {
    if (puntuacion <= 50) return { nivel: 'Baja', descripcion: 'Carga laboral baja' };
    if (puntuacion <= 80) return { nivel: 'Moderada', descripcion: 'Carga laboral moderada' };
    if (puntuacion <= 100) return { nivel: 'Alta', descripcion: 'Carga laboral alta' };
    return { nivel: 'Muy Alta', descripcion: 'Carga laboral muy alta' };
  };

  const cargarDatosHistoricosEgresado = async () => {
    if (!paciente.fechaEgresoUTI) return;
    
    try {
      setLoadingMetricas(true);
      
      // Obtener datos históricos
      const [categorizaciones, registrosNAS] = await Promise.all([
        categorizacionKinesiologiaAPI.obtenerPorPaciente(paciente.rut, {
          fechaDesde: paciente.fechaIngresoUTI,
          fechaHasta: paciente.fechaEgresoUTI,
          limit: 1000
        }),
        nasAPI.obtenerRegistrosPorPaciente(paciente.rut, {
          limit: 1000,
          orderBy: 'fechaRegistro',
          orderDir: 'ASC'
        })
      ]);

      setCategorizacionesHistoricas(categorizaciones.categorizaciones || []);
      setRegistrosNASHistoricos(registrosNAS || []);

      // Calcular métricas
      const fechaIngreso = new Date(paciente.fechaIngresoUTI);
      const fechaEgreso = new Date(paciente.fechaEgresoUTI);
      const totalDias = Math.ceil((fechaEgreso.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24));
      
      const totalCategorizaciones = categorizaciones.categorizaciones?.length || 0;
      const totalRegistrosNAS = registrosNAS?.length || 0;
      
      const promedioPuntajeCategorizacion = totalCategorizaciones > 0 
        ? (categorizaciones.categorizaciones?.reduce((sum, c) => sum + (c.puntajeTotal || 0), 0) || 0) / totalCategorizaciones
        : 0;
        
      const promedioPuntajeNAS = totalRegistrosNAS > 0
        ? (registrosNAS?.reduce((sum, n) => sum + (n.puntuacionTotal || 0), 0) || 0) / totalRegistrosNAS
        : 0;

      // Calcular distribución de complejidad
      const complejidadCount: { [key: string]: number } = {};
      categorizaciones.categorizaciones?.forEach(c => {
        if (c.complejidad) {
          complejidadCount[c.complejidad] = (complejidadCount[c.complejidad] || 0) + 1;
        }
      });
      
      const distribucionComplejidad = Object.entries(complejidadCount).map(([complejidad, cantidad]) => ({
        complejidad,
        cantidad,
        porcentaje: Math.round((cantidad / totalCategorizaciones) * 100)
      }));

      setMetricasEgresado({
        totalDias,
        totalCategorizaciones,
        totalProcedimientos: 0, // Se calculará después con procedimientos
        totalRegistrosNAS,
        promedioPuntajeCategorizacion: Math.round(promedioPuntajeCategorizacion * 10) / 10,
        promedioPuntajeNAS: Math.round(promedioPuntajeNAS * 10) / 10,
        distribucionComplejidad
      });

      // Preparar datos para gráficos
      const datosPorFecha: { [key: string]: DatoGrafico } = {};
      
      // Agregar categorizaciones
      categorizaciones.categorizaciones?.forEach(c => {
        const fecha = c.fechaCategorizacion?.split('T')[0] || '';
        if (!datosPorFecha[fecha]) {
          datosPorFecha[fecha] = { fecha };
        }
        datosPorFecha[fecha].puntajeCategorizacion = c.puntajeTotal;
        datosPorFecha[fecha].complejidad = c.complejidad;
      });
      
      // Agregar registros NAS
      registrosNAS?.forEach(n => {
        const fecha = n.fechaRegistro?.split('T')[0] || '';
        if (!datosPorFecha[fecha]) {
          datosPorFecha[fecha] = { fecha };
        }
        datosPorFecha[fecha].puntajeNAS = n.puntuacionTotal;
      });

      const datosOrdenados = Object.values(datosPorFecha).sort((a, b) => 
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
      
      setDatosGraficos(datosOrdenados);
      
    } catch (error) {
      console.error('Error al cargar datos históricos:', error);
    } finally {
      setLoadingMetricas(false);
    }
  };

  const cargarApache2 = async () => {
    try {
      const responseApache = await apache2Service.obtenerPorPaciente(paciente.rut, { limit: 1 });
      const evaluaciones = responseApache.evaluaciones || [];
      const ultimaEvaluacion = evaluaciones[0]; // La más reciente
      
      if (ultimaEvaluacion) {
        setApache2DelDia({
          id: ultimaEvaluacion.id!,
          puntajeTotal: ultimaEvaluacion.puntajeTotal || 0,
          nivelRiesgo: ultimaEvaluacion.nivelRiesgo || '',
          riesgoMortalidad: ultimaEvaluacion.riesgoMortalidad || '',
          fechaEvaluacion: ultimaEvaluacion.fechaEvaluacion || ''
        });
      } else {
        setApache2DelDia(null);
      }
    } catch (error) {
      console.error('Error al cargar Apache2:', error);
      setApache2DelDia(null);
    }
  };

  const cargarDatosDelDia = async () => {
    try {
      setIsLoading(true);
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaStr = `${year}-${month}-${day}`;

      // Cargar NAS del día seleccionado
      try {
        const detalleNas = await enfermeriaService.obtenerDetalleDia(paciente.rut, fechaStr);
        
        // Verificar si hay registros NAS
        if (detalleNas?.nas && Array.isArray(detalleNas.nas) && detalleNas.nas.length > 0) {
          const nas = detalleNas.nas[0];
          setNasDelDia({
            id: nas.id,
            puntuacion: nas.puntuacion,
            fechaRegistro: fechaStr
          });
        } else {
          setNasDelDia(null);
        }
      } catch (error) {
        console.error('❌ Error al cargar NAS:', error);
        setNasDelDia(null);
      }

      // Cargar Categorización de Kinesiología
      try {
        const responseCat = await categorizacionKinesiologiaAPI.obtenerPorPaciente(paciente.rut, { limit: 100 });
        const categorizaciones = responseCat.categorizaciones || [];
        const categorizacionDelDia = categorizaciones.find(cat => cat.fechaCategorizacion === fechaStr);
        
        if (categorizacionDelDia) {
          setCategorizacionDelDia({
            id: categorizacionDelDia.id!,
            puntajeTotal: categorizacionDelDia.puntajeTotal || 0,
            complejidad: categorizacionDelDia.complejidad || '',
            cargaAsistencial: categorizacionDelDia.cargaAsistencial || '',
            fechaCategorizacion: categorizacionDelDia.fechaCategorizacion
          });
        } else {
          setCategorizacionDelDia(null);
        }
      } catch (error) {
        console.error('Error al cargar Categorización:', error);
        setCategorizacionDelDia(null);
      }
    } catch (error) {
      console.error('Error al cargar datos del día:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarProcedimientosDelDia = async () => {
    try {
      setLoadingProcedimientos(true);
      const year = fechaSeleccionada.getFullYear();
      const month = String(fechaSeleccionada.getMonth() + 1).padStart(2, '0');
      const day = String(fechaSeleccionada.getDate()).padStart(2, '0');
      const fechaStr = `${year}-${month}-${day}`;

      // Inicializar procedimientos vacíos
      const nuevosProcedimientos: ProcedimientosDelDia = {
        enfermeria: [],
        medicina: [],
        kinesiologia: [],
        tens: []
      };

      // Cargar procedimientos de Enfermería (solo enfermería)
      try {
        const responseRegistros = await registroProcedimientosAPI.obtenerTodos({
          fechaDesde: fechaStr,
          fechaHasta: fechaStr,
          incluirProcedimientos: true,
          limit: 100
        });

        // Filtrar procedimientos de enfermería del paciente
        responseRegistros.registros.forEach(registro => {
          const procedimientosPaciente = (registro.procedimientos || []).filter(proc => 
            proc.pacienteRut === paciente.rut
          );
          nuevosProcedimientos.enfermeria.push(...procedimientosPaciente);
        });

      } catch (error) {
        console.error('❌ Error al cargar procedimientos de enfermería:', error);
      }

      // Cargar procedimientos de Medicina (nueva tabla)
      try {
        const responseMedicina = await medicinaAPI.obtenerTodos({
          fechaDesde: fechaStr,
          fechaHasta: fechaStr,
          pacienteRut: paciente.rut,
          limit: 100
        });

        nuevosProcedimientos.medicina = responseMedicina.procedimientos || [];
      } catch (error) {
        console.error('❌ Error al cargar procedimientos de medicina:', error);
      }

      // Cargar procedimientos de Kinesiología
      try {
        const responseKinesio = await procedimientosKinesiologiaAPI.obtenerPorPaciente(paciente.rut, {
          fechaDesde: fechaStr,
          fechaHasta: fechaStr,
          limit: 100
        });

        nuevosProcedimientos.kinesiologia = responseKinesio.procedimientos || [];
      } catch (error) {
        console.error('❌ Error al cargar procedimientos de kinesiología:', error);
      }

      // Cargar procedimientos de TENS
      try {
        const responseTENS = await procedimientosTENSAPI.obtenerTodos({
          fechaDesde: fechaStr,
          fechaHasta: fechaStr,
          incluirProcedimientos: true,
          limit: 100
        });

        // Filtrar procedimientos TENS del paciente
        responseTENS.registros.forEach(registro => {
          const procedimientosPaciente = (registro.procedimientos || []).filter(proc => 
            proc.pacienteRut === paciente.rut
          );
          nuevosProcedimientos.tens.push(...procedimientosPaciente);
        });

      } catch (error) {
        console.error('❌ Error al cargar procedimientos de TENS:', error);
      }

      setProcedimientosDelDia(nuevosProcedimientos);
    } catch (error) {
      console.error('❌ Error general al cargar procedimientos:', error);
    } finally {
      setLoadingProcedimientos(false);
    }
  };

  // Cerrar calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showCalendario && !target.closest('.calendario-dropdown')) {
        setShowCalendario(false);
      }
    };

    if (showCalendario) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCalendario]);

  const cambiarMes = (direccion: 'anterior' | 'siguiente') => {
    setMesActual(prevMes => {
      const nuevaFecha = new Date(prevMes);
      if (direccion === 'anterior') {
        nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
      } else {
        nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
      }
      return nuevaFecha;
    });
  };

  const obtenerDiasDelMes = () => {
    const year = mesActual.getFullYear();
    const month = mesActual.getMonth();
    
    // Primer día del mes
    const primerDia = new Date(year, month, 1);
    // Último día del mes
    const ultimoDia = new Date(year, month + 1, 0);
    
    // Día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
    let diaSemanaInicio = primerDia.getDay();
    // Ajustar para que lunes sea 0
    diaSemanaInicio = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1;
    
    const dias: Array<{ fecha: Date; esDelMes: boolean }> = [];
    
    // Agregar días del mes anterior para completar la primera semana
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const fecha = new Date(year, month, -i);
      dias.push({ fecha, esDelMes: false });
    }
    
    // Agregar todos los días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(year, month, dia);
      dias.push({ fecha, esDelMes: true });
    }
    
    // Agregar días del mes siguiente para completar la última semana
    const diasParaCompletar = 42 - dias.length; // 6 semanas * 7 días = 42
    for (let i = 1; i <= diasParaCompletar; i++) {
      const fecha = new Date(year, month + 1, i);
      dias.push({ fecha, esDelMes: false });
    }
    
    return dias;
  };

  const esHoy = (fecha: Date) => {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  };

  const seleccionarFecha = (fecha: Date) => {
    setFechaSeleccionada(fecha);
    setShowCalendario(false);
  };

  const obtenerColorApache = (puntaje: number) => {
    if (puntaje <= 4) return 'bg-green-500';
    if (puntaje <= 9) return 'bg-green-600';
    if (puntaje <= 14) return 'bg-yellow-500';
    if (puntaje <= 19) return 'bg-orange-500';
    if (puntaje <= 24) return 'bg-orange-600';
    if (puntaje <= 34) return 'bg-red-500';
    return 'bg-red-700';
  };

  const obtenerColorComplejidad = (complejidad: string) => {
    switch (complejidad) {
      case 'Baja': return 'bg-green-500';
      case 'Mediana': return 'bg-yellow-500';
      case 'Alta': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-16 md:pb-8">
      {/* Header con botón de regreso e información del paciente */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex items-start space-x-3 md:space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              title="Volver al listado"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">{paciente.nombreCompleto}</h1>
              {/* Vista móvil - información vertical */}
              <div className="md:hidden mt-2 space-y-1">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">RUT:</span> {paciente.rut}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Ficha:</span> {paciente.numeroFicha}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Edad:</span> {paciente.edad} años
                </div>
                {paciente.camaAsignada && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Cama:</span> {paciente.camaAsignada}
                  </div>
                )}
              </div>
              
              {/* Vista desktop - información horizontal con iconos */}
              <div className="hidden md:flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  RUT: {paciente.rut}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Ficha: {paciente.numeroFicha}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Edad: {paciente.edad} años
                </span>
                {paciente.camaAsignada && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Cama: {paciente.camaAsignada}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de métricas y gráficos para pacientes egresados */}
      {paciente.fechaEgresoUTI && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-sm p-6 border border-green-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Resumen de Estadía - Paciente Egresado</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Desde {new Date(paciente.fechaIngresoUTI).toLocaleDateString('es-ES')} hasta {new Date(paciente.fechaEgresoUTI).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
            {loadingMetricas && (
              <div className="flex items-center space-x-2 text-blue-600">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Cargando métricas...</span>
              </div>
            )}
          </div>

          {metricasEgresado && !loadingMetricas && (
            <>
              {/* Cards de métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Días en UTI</p>
                      <p className="text-2xl font-semibold text-gray-900">{metricasEgresado.totalDias}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Categorizaciones</p>
                      <p className="text-2xl font-semibold text-gray-900">{metricasEgresado.totalCategorizaciones}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Promedio Categorización</p>
                      <p className="text-2xl font-semibold text-gray-900">{metricasEgresado.promedioPuntajeCategorizacion}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {obtenerDescripcionCategorizacion(metricasEgresado.promedioPuntajeCategorizacion).descripcion}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Promedio NAS</p>
                      <p className="text-2xl font-semibold text-gray-900">{metricasEgresado.promedioPuntajeNAS}%</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {obtenerDescripcionNAS(metricasEgresado.promedioPuntajeNAS).descripcion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de evolución de puntajes */}
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución de Puntajes</h3>
                  {datosGraficos.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={datosGraficos}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="fecha" 
                          tickFormatter={(fecha) => new Date(fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(fecha) => new Date(fecha).toLocaleDateString('es-ES')}
                          formatter={(value, name) => [
                            value, 
                            name === 'Categorización Kinesiología' ? 'Categorización Kinesiología' : 'NAS Enfermería'
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="puntajeCategorizacion" 
                          stroke="#4B5563" 
                          strokeWidth={2}
                          name="Categorización Kinesiología"
                          connectNulls={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="puntajeNAS" 
                          stroke="#1E3A8A" 
                          strokeWidth={2}
                          name="NAS Enfermería"
                          connectNulls={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <p>No hay datos suficientes para mostrar el gráfico</p>
                    </div>
                  )}
                </div>

                {/* Gráfico de radar NAS - Distribución promedio de carga laboral */}
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución Promedio de Carga Laboral NAS</h3>
                  {registrosNASHistoricos.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={calcularPromediosNASRadar(registrosNASHistoricos)}>
                        <PolarGrid stroke="#cbd5e1" />
                        <PolarAngleAxis 
                          dataKey="categoria" 
                          tick={{ fill: '#374151', fontSize: 10 }}
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 40]}
                          tick={{ fill: '#6b7280', fontSize: 10 }}
                        />
                        <Radar
                          name="Puntuación Promedio"
                          dataKey="puntuacion"
                          stroke="#2563eb"
                          fill="#3b82f6"
                          fillOpacity={0.6}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e3a8a', 
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value: any) => [`${value}%`, 'Puntuación Promedio']}
                          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <p>No hay datos de NAS disponibles</p>
                    </div>
                  )}
                  {registrosNASHistoricos.length > 0 && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Promedio calculado de {registrosNASHistoricos.length} registros NAS
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Contenedor principal */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header con fecha y calendario */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {fechaSeleccionada.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric',
              month: 'long', 
              year: 'numeric' 
            })}
          </h2>
          
          {/* Botón de calendario sutil */}
          <div className="relative calendario-dropdown">
            <button
              onClick={() => setShowCalendario(!showCalendario)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Dropdown del calendario */}
            {showCalendario && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[300px]">
                {/* Header del calendario */}
                <div className="flex justify-between items-center mb-3">
                  <button
                    onClick={() => cambiarMes('anterior')}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h4 className="text-sm font-semibold text-gray-900 capitalize">
                    {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </h4>
              <button
                    onClick={() => cambiarMes('siguiente')}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
              </button>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dia) => (
                    <div key={dia} className="text-center">
                      <span className="text-xs font-medium text-gray-500">{dia}</span>
                    </div>
                  ))}
                </div>

                {/* Días del mes */}
                <div className="grid grid-cols-7 gap-1">
                  {obtenerDiasDelMes().map((dia, index) => {
                    const isToday = esHoy(dia.fecha);
                    const isSelected = dia.fecha.toDateString() === fechaSeleccionada.toDateString();
                    
                    return (
                      <button
                        key={index}
                        onClick={() => dia.esDelMes && seleccionarFecha(dia.fecha)}
                        disabled={!dia.esDelMes}
                        className={`p-2 text-center rounded transition-colors ${
                          !dia.esDelMes ? 'opacity-30 cursor-default text-gray-400' : 
                          isSelected ? 'bg-blue-600 text-white' :
                          isToday ? 'bg-blue-100 text-blue-700' : 
                          'hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        <span className="text-xs font-medium">{dia.fecha.getDate()}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Botón cerrar */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowCalendario(false)}
                    className="w-full px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido: 3 métricas */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Métrica Apache II - Medicina */}
            <button
              onClick={() => apache2DelDia && setShowModalApache2(true)}
              disabled={!apache2DelDia}
              className={`p-6 rounded-xl transition-all border ${
                apache2DelDia 
                  ? 'bg-white border-gray-200 hover:bg-green-50 hover:border-green-200 hover:shadow-lg cursor-pointer' 
                  : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Apache II</h3>
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              
              {apache2DelDia ? (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900">{apache2DelDia.puntajeTotal}</span>
                    <span className="text-sm text-gray-600">puntos</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${obtenerColorApache(apache2DelDia.puntajeTotal)}`}></div>
                    <span className="text-sm font-medium text-gray-700">{apache2DelDia.nivelRiesgo}</span>
                  </div>
                  {apache2DelDia.fechaEvaluacion && (
                    <p className="text-xs text-gray-500">
                      Evaluado: {(() => {
                        const fecha = apache2DelDia.fechaEvaluacion.split('T')[0];
                        const [year, month, day] = fecha.split('-');
                        return `${day}/${month}/${year}`;
                      })()}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">Sin evaluación registrada</p>
              )}
            </button>

            {/* Métrica NAS - Enfermería */}
            <button
              onClick={() => nasDelDia && setShowModalNAS(true)}
              disabled={!nasDelDia}
              className={`p-6 rounded-xl transition-all border ${
                nasDelDia 
                  ? 'bg-white border-gray-200 hover:bg-cyan-50 hover:border-cyan-200 hover:shadow-lg cursor-pointer' 
                  : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">NAS</h3>
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              
              {nasDelDia ? (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900">{nasDelDia.puntuacion}</span>
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Puntuación de enfermería</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Sin evaluación registrada</p>
              )}
            </button>

            {/* Métrica Categorización Kinesiología */}
            <button
              onClick={() => categorizacionDelDia && setShowModalCategorizacion(true)}
              disabled={!categorizacionDelDia}
              className={`p-6 rounded-xl transition-all border ${
                categorizacionDelDia 
                  ? 'bg-white border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-lg cursor-pointer' 
                  : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Kinesiología</h3>
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              
              {categorizacionDelDia ? (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900">{categorizacionDelDia.puntajeTotal}</span>
                    <span className="text-sm text-gray-600">puntos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${obtenerColorComplejidad(categorizacionDelDia.complejidad)}`}></div>
                    <span className="text-sm font-medium text-gray-700">Complejidad {categorizacionDelDia.complejidad}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Sin categorización registrada</p>
              )}
            </button>
        </div>
        )}

        {/* Sección de Procedimientos */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Procedimientos del Día</h3>
          
          {loadingProcedimientos ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">Cargando procedimientos...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Medicina */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <h4 className="font-semibold text-gray-900">Medicina</h4>
                  <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">
                    {procedimientosDelDia.medicina.length}
                  </span>
                </div>
                
                {procedimientosDelDia.medicina.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Sin procedimientos registrados</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {procedimientosDelDia.medicina.map((proc, index) => (
                      <div key={index} className="bg-white rounded p-2 text-sm">
                        <div className="font-medium text-gray-900">{proc.nombre}</div>
                        <div className="text-xs text-gray-600">
                          Duración: {proc.tiempo}
                          {proc.turno && ` • Turno: ${proc.turno}`}
                        </div>
                        {proc.observaciones && (
                          <div className="text-xs text-gray-500 mt-1 italic">
                            {proc.observaciones}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enfermería */}
              <div className="bg-blue-900 bg-opacity-10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <h4 className="font-semibold text-gray-900">Enfermería</h4>
                  <span className="bg-blue-900 text-white text-xs px-2 py-1 rounded-full">
                    {procedimientosDelDia.enfermeria.length}
                  </span>
                </div>
                
                {procedimientosDelDia.enfermeria.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Sin procedimientos registrados</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {procedimientosDelDia.enfermeria.map((proc, index) => (
                      <div key={index} className="bg-white rounded p-2 text-sm">
                        <div className="font-medium text-gray-900">{proc.nombre}</div>
                        <div className="text-xs text-gray-600">Duración: {proc.tiempo}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kinesiología */}
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h4 className="font-semibold text-gray-900">Kinesiología</h4>
                  <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-full">
                    {procedimientosDelDia.kinesiologia.length}
                  </span>
                </div>
                
                {procedimientosDelDia.kinesiologia.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Sin procedimientos registrados</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {procedimientosDelDia.kinesiologia.map((proc, index) => (
                      <div key={index} className="bg-white rounded p-2 text-sm">
                        <div className="font-medium text-gray-900">{proc.nombre}</div>
                        <div className="text-xs text-gray-600">
                          Duración: {proc.tiempo}
                          {proc.turno && ` • Turno: ${proc.turno}`}
                        </div>
                        {proc.observaciones && (
                          <div className="text-xs text-gray-500 mt-1 italic">
                            {proc.observaciones}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TENS */}
              <div className="bg-sky-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="8" width="12" height="8" rx="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 12h4M12 10v4" />
                  </svg>
                  <h4 className="font-semibold text-gray-900">TENS</h4>
                  <span className="bg-sky-200 text-sky-800 text-xs px-2 py-1 rounded-full">
                    {procedimientosDelDia.tens.length}
                  </span>
                </div>
                
                {procedimientosDelDia.tens.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Sin procedimientos registrados</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {procedimientosDelDia.tens.map((proc, index) => (
                      <div key={index} className="bg-white rounded p-2 text-sm">
                        <div className="font-medium text-gray-900">{proc.nombre}</div>
                        <div className="text-xs text-gray-600">
                          Duración: {proc.tiempo}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales de detalle */}
      {showModalApache2 && (
        <ModalDetalleApache2Paciente
        isOpen={showModalApache2}
        onClose={() => setShowModalApache2(false)}
        pacienteRut={paciente.rut}
        pacienteNombre={paciente.nombreCompleto}
      />
      )}

      {showModalNAS && nasDelDia && (
        <ModalDetalleNAS
          nasId={nasDelDia.id}
          onClose={() => setShowModalNAS(false)}
        />
      )}

      {showModalCategorizacion && categorizacionDelDia && (
        <ModalDetalleCategorizacionKinesiologiaDia
          isOpen={showModalCategorizacion}
          onClose={() => setShowModalCategorizacion(false)}
          categorizacionId={categorizacionDelDia.id}
          pacienteNombre={paciente.nombreCompleto}
        />
      )}
    </div>
  );
};

export default FichaPaciente;