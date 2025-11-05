import React, { useState, useEffect } from 'react';
import ModalApache2 from './ModalApache2';
import ModalRegistroProcedimientosMedicina from './ModalRegistroProcedimientosMedicina';
import ModalDetalleProcedimientoMedicina from './ModalDetalleProcedimientoMedicina';
import ModalDetalleApache2Paciente from './ModalDetalleApache2Paciente';
import { pacienteService, Paciente } from '../services/api';
import apache2Service from '../services/apache2API';
import medicinaAPI, { ProcedimientoMedicina, MetricasMedicina } from '../services/medicinaAPI';
import { useAuth } from '../contexts/AuthContext';

interface MenuMedicinaProps {
  onOpenModal?: () => void;
}

interface Apache2PorCama {
  [numeroCama: number]: {
    puntajeTotal: number;
    color: string;
    nivelRiesgo: string;
    fecha: string;
    pacienteNombre: string;
  };
}

interface MetricasComponente {
  apache2Promedio: number;
  pacientesRiesgoAlto: {
    total: number;
    porcentaje: number;
  };
  promedioProcedimientos: {
    promedio: number;
    totalProcedimientos: number;
    totalTurnos: number;
    estadisticasDetalladas?: {
      sesionesTotales: number; // Ahora representa turnos (fecha+turno) no sesiones por usuario
      diasConActividad: number;
      porcentajeActividad: string;
      promedioPorDiaActivo: number;
      promedioGeneral: number;
    };
  };
  promedioInterconsulta: {
    promedio: number;
    cantidad: number;
    texto: string;
  };
}

const MenuMedicina: React.FC<MenuMedicinaProps> = ({ onOpenModal }) => {
  const { user } = useAuth();
  const [showApache2Modal, setShowApache2Modal] = useState(false);
  const [showRegistroProcedimientosModal, setShowRegistroProcedimientosModal] = useState(false);
  const [showMapInfoModal, setShowMapInfoModal] = useState(false);
  const [showFiltroFechasModal, setShowFiltroFechasModal] = useState(false);
  const [apache2PorCama, setApache2PorCama] = useState<Apache2PorCama>({});
  const [isLoading, setIsLoading] = useState(true);
  const [procedimientos, setProcedimientos] = useState<ProcedimientoMedicina[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);
  const [selectedProcedimiento, setSelectedProcedimiento] = useState<ProcedimientoMedicina | null>(null);
  const [selectedGrupoProcedimientos, setSelectedGrupoProcedimientos] = useState<ProcedimientoMedicina[]>([]);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [metricas, setMetricas] = useState<MetricasComponente | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [camasBloqueadas, setCamasBloqueadas] = useState<number[]>(() => {
    // Cargar camas bloqueadas desde localStorage
    const stored = localStorage.getItem('camasBloqueadas');
    return stored ? JSON.parse(stored) : [];
  });
  const [showDetalleApache2Modal, setShowDetalleApache2Modal] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<{ rut: string; nombre: string } | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  // Verificar si el usuario es médico o administrador/supervisor
  const esMedico = user?.estamento === 'Médico' || user?.estamento === 'Medicina' || user?.estamento === 'Administrador' || user?.estamento === 'Supervisor';
  const esAdministrador = user?.estamento === 'Administrador' || user?.estamento === 'Supervisor';

  // Cargar pacientes y sus Apache II
  useEffect(() => {
    cargarApache2();
    cargarProcedimientos();
  }, []);

  // Recargar procedimientos cuando cambien las fechas de filtro
  useEffect(() => {
    if (fechaDesde || fechaHasta) {
      cargarProcedimientos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaDesde, fechaHasta]);

  // Cargar métricas después de cargar Apache II
  useEffect(() => {
    if (!isLoading) {
      cargarMetricas();
    }
  }, [apache2PorCama, isLoading]);

  // Recargar Apache II cuando se cierra el modal
  const handleCloseModal = () => {
    setShowApache2Modal(false);
    cargarApache2();
  };

  const cargarApache2 = async () => {
    try {
      setIsLoading(true);
      const pacientesData = await pacienteService.obtenerPacientes();
      setPacientes(pacientesData);
      const apache2Data: Apache2PorCama = {};

      // Obtener todos los Apache II en paralelo usando Promise.all
      const promesasApache2 = pacientesData
        .filter(paciente => paciente.camaAsignada)
        .map(async (paciente) => {
          try {
            const response = await apache2Service.obtenerPorPaciente(paciente.rut, { limit: 1 });
            if (response.evaluaciones && response.evaluaciones.length > 0) {
              const ultimoApache = response.evaluaciones[0];
              const puntajeTotal = ultimoApache.puntajeTotal || 0;
              
              let color = 'bg-blue-200'; // Por defecto
              let nivelRiesgo = 'Sin evaluación';
              
              // Clasificar según puntaje Apache II
              if (puntajeTotal <= 4) {
                color = 'bg-green-400';
                nivelRiesgo = 'Bajo';
              } else if (puntajeTotal <= 9) {
                color = 'bg-green-300';
                nivelRiesgo = 'Bajo-Moderado';
              } else if (puntajeTotal <= 14) {
                color = 'bg-yellow-400';
                nivelRiesgo = 'Moderado';
              } else if (puntajeTotal <= 19) {
                color = 'bg-orange-400';
                nivelRiesgo = 'Alto';
              } else if (puntajeTotal <= 24) {
                color = 'bg-orange-500';
                nivelRiesgo = 'Muy Alto';
              } else if (puntajeTotal <= 34) {
                color = 'bg-red-400';
                nivelRiesgo = 'Crítico';
              } else {
                color = 'bg-red-600';
                nivelRiesgo = 'Crítico';
              }

              return {
                cama: paciente.camaAsignada,
                data: {
                  puntajeTotal,
                  color,
                  nivelRiesgo,
                  fecha: ultimoApache.fechaEvaluacion || '',
                  pacienteNombre: paciente.nombreCompleto
                }
              };
            }
            return null;
          } catch (error) {
            console.error(`Error al obtener Apache II del paciente ${paciente.rut}:`, error);
            return null;
          }
        });

      // Esperar a que todas las promesas se resuelvan
      const resultados = await Promise.all(promesasApache2);
      
      // Agregar resultados válidos al objeto apache2Data
      resultados.forEach(resultado => {
        if (resultado && resultado.cama) {
          apache2Data[resultado.cama] = resultado.data;
        }
      });

      setApache2PorCama(apache2Data);
    } catch (error) {
      console.error('Error al cargar Apache II:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarProcedimientos = async () => {
    try {
      setLoadingRegistros(true);
      const params: any = { 
        page: 1,
        limit: 50
      };
      
      if (fechaDesde) {
        params.fechaDesde = fechaDesde;
      }
      if (fechaHasta) {
        params.fechaHasta = fechaHasta;
      }
      
      const data = await medicinaAPI.obtenerTodos(params);
      
      setProcedimientos(data.procedimientos || []);
    } catch (error) {
      console.error('Error al cargar procedimientos de medicina:', error);
    } finally {
      setLoadingRegistros(false);
    }
  };

  const cargarMetricas = async () => {
    try {
      setLoadingMetricas(true);
      
      // Calcular métricas basadas en datos locales
      const pacientesConApache = Object.values(apache2PorCama);
      
      if (pacientesConApache.length === 0) {
      setMetricas({
        apache2Promedio: 0,
        pacientesRiesgoAlto: { total: 0, porcentaje: 0 },
        promedioProcedimientos: { promedio: 0, totalProcedimientos: 0, totalTurnos: 0 },
        promedioInterconsulta: { promedio: 0, cantidad: 0, texto: '0 min promedio' }
      });
        return;
      }

      // 1. Apache II Promedio
      const sumaTotal = pacientesConApache.reduce((sum, p) => sum + p.puntajeTotal, 0);
      const apache2Promedio = sumaTotal / pacientesConApache.length;

      // 2. Pacientes con riesgo alto/crítico (>14, es decir >=15)
      const pacientesAlta = pacientesConApache.filter(p => p.puntajeTotal > 14).length;
      const porcentajeAlta = (pacientesAlta / pacientesConApache.length) * 100;

      // 3. Obtener métricas de medicina desde la API
      const metricasMedicina = await medicinaAPI.obtenerMetricas();

      setMetricas({
        apache2Promedio: apache2Promedio,
        pacientesRiesgoAlto: {
          total: pacientesAlta,
          porcentaje: porcentajeAlta
        },
        promedioProcedimientos: {
          promedio: metricasMedicina.promedio24h.promedio,
          totalProcedimientos: metricasMedicina.totalProcedimientos.cantidad,
          totalTurnos: metricasMedicina.promedio24h.totalTurnos,
          // Nuevas métricas detalladas
          estadisticasDetalladas: metricasMedicina.estadisticasDetalladas
        },
        promedioInterconsulta: metricasMedicina.promedioInterconsulta
      });
    } catch (error) {
      console.error('Error al cargar métricas:', error);
      setMetricas({
        apache2Promedio: 0,
        pacientesRiesgoAlto: { total: 0, porcentaje: 0 },
        promedioProcedimientos: { promedio: 0, totalProcedimientos: 0, totalTurnos: 0 },
        promedioInterconsulta: { promedio: 0, cantidad: 0, texto: '0 min promedio' }
      });
    } finally {
      setLoadingMetricas(false);
    }
  };

  const handleVerDetalle = (grupoProcedimientos: ProcedimientoMedicina[]) => {
    setSelectedGrupoProcedimientos(grupoProcedimientos);
    setShowDetalleModal(true);
  };

  const handleEliminarGrupo = async (procedimientosGrupo: ProcedimientoMedicina[]) => {
    if (!esAdministrador) return;
    
    const confirmacion = window.confirm('¿Está seguro de que desea eliminar este registro de procedimientos? Esta acción no se puede deshacer.');
    if (!confirmacion) return;

    try {
      setLoadingRegistros(true);
      
      // Eliminar todos los procedimientos del grupo
      const promesas = procedimientosGrupo.map(proc => medicinaAPI.eliminar(proc.id));
      await Promise.all(promesas);
      
      // Recargar procedimientos y métricas
      await cargarProcedimientos();
      await cargarMetricas();
      
      alert('Registro eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar registro:', error);
      alert(`Error al eliminar el registro: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoadingRegistros(false);
    }
  };

  // Agrupar procedimientos por fecha y usuario
  const agruparProcedimientos = () => {
    // Primero agrupar por fecha
    const gruposPorFecha: { [key: string]: ProcedimientoMedicina[] } = {};
    
    procedimientos.forEach(proc => {
      if (!gruposPorFecha[proc.fecha]) {
        gruposPorFecha[proc.fecha] = [];
      }
      gruposPorFecha[proc.fecha].push(proc);
    });

    // Luego, para cada fecha, sub-agrupar por usuario y turno
    const resultado: any[] = [];
    
    Object.entries(gruposPorFecha)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA)) // Ordenar por fecha descendente
      .forEach(([fecha, procedimientosFecha]) => {
        // Sub-agrupar por usuario y turno
        const subGrupos: { [key: string]: ProcedimientoMedicina[] } = {};
        
        procedimientosFecha.forEach(proc => {
          const key = `${proc.usuarioId}-${proc.turno || 'Sin turno'}`;
          if (!subGrupos[key]) {
            subGrupos[key] = [];
          }
          subGrupos[key].push(proc);
        });

        // Agregar cada sub-grupo al resultado
        Object.entries(subGrupos).forEach(([key, procs]) => {
          // Verificar si todos los procedimientos fueron registrados por el usuario actual
          const registradoPorUsuario = user && procs.every(proc => proc.usuarioId === user.id);
          
          resultado.push({
            fecha: procs[0].fecha,
            turno: procs[0].turno || 'Sin turno',
            usuarioId: procs[0].usuarioId,
            usuarioNombre: `${procs[0].usuario.nombres} ${procs[0].usuario.apellidos}`,
            procedimientos: procs,
            tiempoTotal: procs.reduce((acc, p) => {
              const [h, m] = p.tiempo.split(':').map(Number);
              return acc + (h * 60) + m;
            }, 0),
            cantidadProcedimientos: procs.length,
            registradoPorUsuario: registradoPorUsuario
          });
        });
      });

    return resultado;
  };

  const formatearTiempoTotal = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${horas}h`;
    } else {
      return `${horas}h ${mins}m`;
    }
  };

  const obtenerEstiloCama = (numeroCama: number) => {
    // Verificar si la cama está bloqueada primero
    if (camasBloqueadas.includes(numeroCama)) {
      return {
        color: 'bg-gray-600',
        puntaje: '',
        fecha: '',
        fechaFormateada: '',
        titulo: `Cama ${numeroCama} - Bloqueada`,
        pacienteRut: null
      };
    }

    // Buscar el paciente por cama primero
    const paciente = pacientes.find(p => p.camaAsignada === numeroCama);
    
    const apache2Info = apache2PorCama[numeroCama];
    if (apache2Info) {
      return {
        color: apache2Info.color,
        puntaje: apache2Info.puntajeTotal.toString(),
        fecha: apache2Info.fecha,
        fechaFormateada: formatearFecha(apache2Info.fecha),
        titulo: `Cama ${numeroCama} - ${apache2Info.pacienteNombre} - Apache II: ${apache2Info.puntajeTotal}`,
        pacienteRut: paciente?.rut || null,
        pacienteNombre: apache2Info.pacienteNombre
      };
    }
    
    // Si hay paciente pero no tiene Apache evaluado
    if (paciente) {
      return {
        color: 'bg-blue-200',
        puntaje: '',
        fecha: '',
        fechaFormateada: '',
        titulo: `Cama ${numeroCama} - ${paciente.nombreCompleto} - Sin Apache II`,
        pacienteRut: paciente.rut,
        pacienteNombre: paciente.nombreCompleto
      };
    }
    
    // Si no hay paciente en la cama
    return {
      color: 'bg-blue-200',
      puntaje: '',
      fecha: '',
      fechaFormateada: '',
      titulo: `Cama ${numeroCama}`,
      pacienteRut: null
    };
  };

  const handleClickCama = (numeroCama: number) => {
    const estilo = obtenerEstiloCama(numeroCama);
    if (estilo.pacienteRut && estilo.pacienteNombre) {
      // Verificar si el paciente ya tiene Apache evaluado
      const tieneApacheEvaluado = apache2PorCama[numeroCama] !== undefined;
      
      if (tieneApacheEvaluado) {
        // Si ya tiene Apache evaluado, abrir modal de detalle
        setPacienteSeleccionado({
          rut: estilo.pacienteRut,
          nombre: estilo.pacienteNombre
        });
        setShowDetalleApache2Modal(true);
      } else {
        // Si no tiene Apache evaluado, abrir modal Apache para evaluar
        setPacienteSeleccionado({
          rut: estilo.pacienteRut,
          nombre: estilo.pacienteNombre
        });
        setShowApache2Modal(true);
      }
    }
  };

  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return '';
    
    try {
      const fechaMatch = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (fechaMatch) {
        const [, year, month, day] = fechaMatch;
        return `${day}/${month}`;
      }
      
      const fecha = new Date(fechaStr);
      
      if (isNaN(fecha.getTime())) {
        console.warn('Fecha inválida:', fechaStr);
        return '';
      }
      
      return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    } catch (error) {
      console.error('Error al formatear fecha:', error, fechaStr);
      return '';
    }
  };

  const calcularEstadisticasSector = (camasRango: number[]) => {
    const total = camasRango.length;
    let sinCategorizar = 0;
    let bajo = 0;
    let moderado = 0;
    let alto = 0;
    let muyAlto = 0;
    let critico = 0;

    camasRango.forEach(numeroCama => {
      const apache2Info = apache2PorCama[numeroCama];
      if (!apache2Info) {
        sinCategorizar++;
      } else {
        const puntaje = apache2Info.puntajeTotal;
        if (puntaje <= 9) {
          bajo++;
        } else if (puntaje <= 14) {
          moderado++;
        } else if (puntaje <= 19) {
          alto++;
        } else if (puntaje <= 24) {
          muyAlto++;
        } else {
          critico++;
        }
      }
    });

    return {
      sinCategorizar: ((sinCategorizar / total) * 100).toFixed(0),
      bajo: ((bajo / total) * 100).toFixed(0),
      moderado: ((moderado / total) * 100).toFixed(0),
      alto: ((alto / total) * 100).toFixed(0),
      muyAlto: ((muyAlto / total) * 100).toFixed(0),
      critico: ((critico / total) * 100).toFixed(0)
    };
  };

  // Métricas dinámicas
  const metricasDisplay = loadingMetricas || !metricas ? [
    {
      titulo: 'Apache II Promedio',
      valor: '...',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-blue-500',
      subtitulo: 'Cargando...'
    },
    {
      titulo: 'Riesgo Alto/Crítico',
      valor: '...',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'bg-red-500',
      subtitulo: 'Cargando...'
    },
    {
      titulo: 'Promedio Procedimientos',
      valor: '...',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'bg-purple-500',
      subtitulo: 'Cargando...'
    }
  ] : [
    {
      titulo: 'Apache II Promedio',
      valor: `${metricas.apache2Promedio.toFixed(1)}`,
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: metricas.apache2Promedio <= 9 ? 'bg-green-500' : 
             metricas.apache2Promedio <= 14 ? 'bg-yellow-500' : 
             metricas.apache2Promedio <= 19 ? 'bg-orange-500' : 'bg-red-500',
      subtitulo: 'Severidad promedio de pacientes'
    },
    {
      titulo: 'Riesgo Alto/Crítico',
      valor: `${metricas.pacientesRiesgoAlto.total}`,
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: metricas.pacientesRiesgoAlto.porcentaje > 30 ? 'bg-red-500' : 
             metricas.pacientesRiesgoAlto.porcentaje > 15 ? 'bg-orange-500' : 'bg-green-500',
      subtitulo: `${metricas.pacientesRiesgoAlto.porcentaje.toFixed(0)}% con Apache II >14`
    },
    {
      titulo: 'Promedio de tiempo en Interconsulta',
      valor: `${Number(metricas.promedioInterconsulta?.promedio || 0).toFixed(1)} min`,
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'bg-purple-500',
      subtitulo: `${metricas.promedioInterconsulta?.cantidad || 0} interconsultas registradas`
    }
  ];

  return (
    <>
    <div className="space-y-8 pb-16 md:pb-8">
      {/* Métricas superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metricasDisplay.map((metrica, index) => (
          <div key={index} className="bg-white bg-opacity-60 backdrop-blur-xl rounded-2xl shadow-sm p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 ${metrica.color} rounded-xl flex items-center justify-center`}>
                  <div className="text-white">
                    {metrica.icono}
                  </div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {metrica.titulo}
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {metrica.valor}
                  </dd>
                  {metrica.subtitulo && (
                    <dd className="text-xs text-gray-500 mt-1">
                      {metrica.subtitulo}
                    </dd>
                  )}
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sección de Apache II */}
      <div>
        {/* Header con título y botón */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Evaluación Apache II</h2>
          <div className="relative group">
            <button
              onClick={() => esMedico && setShowApache2Modal(true)}
              disabled={!esMedico}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
                esMedico 
                  ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md transform hover:scale-105 cursor-pointer' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={esMedico ? "Agregar evaluación Apache II" : "Solo usuarios médicos pueden agregar evaluaciones"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {!esMedico && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 z-10">
                Solo usuarios con estamento "Médico" pueden agregar evaluaciones Apache II
              </div>
            )}
          </div>
        </div>

        {/* Espacio para el mapa de la unidad */}
        <div className="bg-white bg-opacity-60 backdrop-blur-xl rounded-2xl p-8 shadow-sm">
          <div className="bg-gray-50 bg-opacity-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-700 -mt-1 flex-1 text-center">Mapa de la Unidad UTI</h3>
              <button
                onClick={() => setShowMapInfoModal(true)}
                className="md:hidden w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                title="Información del mapa"
              >
                i
              </button>
            </div>
            
            {/* Grid de camas */}
            <div className="overflow-x-auto">
              <div className="flex justify-center space-x-1.5 min-w-max">
              {/* Primera columna - Camas 3, 2, 1 (de arriba hacia abajo) */}
              <div className="flex flex-col space-y-1.5">
                {[3, 2, 1].map((numero) => {
                  const estilo = obtenerEstiloCama(numero);
                  return (
                    <div
                      key={numero}
                      onClick={() => handleClickCama(numero)}
                      className={`w-16 h-16 ${estilo.color} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center`}
                      title={estilo.titulo}
                    >
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                        {numero}
                      </span>
                      {estilo.puntaje && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntaje}
                          </span>
                          <span className="absolute bottom-0.5 text-[9px] font-medium text-gray-700">
                            {estilo.fechaFormateada}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Primera parte horizontal - Camas 4,5,6 */}
              <div className="flex space-x-1.5">
                {[4,5,6].map((numero) => {
                  const estilo = obtenerEstiloCama(numero);
                  return (
                    <div
                      key={numero}
                      onClick={() => handleClickCama(numero)}
                      className={`w-16 h-16 ${estilo.color} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center`}
                      title={estilo.titulo}
                    >
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                        {numero}
                      </span>
                      {estilo.puntaje && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntaje}
                          </span>
                          <span className="absolute bottom-0.5 text-[9px] font-medium text-gray-700">
                            {estilo.fechaFormateada}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Columna vertical - Camas 7, 8, 9 (de arriba hacia abajo) */}
              <div className="flex flex-col space-y-1.5">
                {[7, 8, 9].map((numero) => {
                  const estilo = obtenerEstiloCama(numero);
                  return (
                    <div
                      key={numero}
                      onClick={() => handleClickCama(numero)}
                      className={`w-16 h-16 ${estilo.color} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center`}
                      title={estilo.titulo}
                    >
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                        {numero}
                      </span>
                      {estilo.puntaje && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntaje}
                          </span>
                          <span className="absolute bottom-0.5 text-[9px] font-medium text-gray-700">
                            {estilo.fechaFormateada}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Segunda parte horizontal - Cama 10 */}
              <div className="flex space-x-1.5">
                {[10].map((numero) => {
                  const estilo = obtenerEstiloCama(numero);
                  return (
                    <div
                      key={numero}
                      onClick={() => handleClickCama(numero)}
                      className={`w-16 h-16 ${estilo.color} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center`}
                      title={estilo.titulo}
                    >
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                        {numero}
                      </span>
                      {estilo.puntaje && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntaje}
                          </span>
                          <span className="absolute bottom-0.5 text-[9px] font-medium text-gray-700">
                            {estilo.fechaFormateada}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Columna vertical - Camas 11, 12, 13 (de arriba hacia abajo) */}
              <div className="flex flex-col space-y-1.5">
                {[11, 12, 13].map((numero) => {
                  const estilo = obtenerEstiloCama(numero);
                  return (
                    <div
                      key={numero}
                      onClick={() => handleClickCama(numero)}
                      className={`w-16 h-16 ${estilo.color} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center`}
                      title={estilo.titulo}
                    >
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                        {numero}
                      </span>
                      {estilo.puntaje && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntaje}
                          </span>
                          <span className="absolute bottom-0.5 text-[9px] font-medium text-gray-700">
                            {estilo.fechaFormateada}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tercera parte horizontal - Camas 14,15 */}
              <div className="flex space-x-1.5">
                {[14,15].map((numero) => {
                  const estilo = obtenerEstiloCama(numero);
                  return (
                    <div
                      key={numero}
                      onClick={() => handleClickCama(numero)}
                      className={`w-16 h-16 ${estilo.color} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center`}
                      title={estilo.titulo}
                    >
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                        {numero}
                      </span>
                      {estilo.puntaje && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntaje}
                          </span>
                          <span className="absolute bottom-0.5 text-[9px] font-medium text-gray-700">
                            {estilo.fechaFormateada}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Columna vertical - Camas 18, 16, 17 (de arriba hacia abajo) */}
              <div className="flex flex-col space-y-1.5">
                {[18, 16, 17].map((numero) => {
                  const estilo = obtenerEstiloCama(numero);
                  return (
                    <div
                      key={numero}
                      onClick={() => handleClickCama(numero)}
                      className={`w-16 h-16 ${estilo.color} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center`}
                      title={estilo.titulo}
                    >
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                        {numero}
                      </span>
                      {estilo.puntaje && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntaje}
                          </span>
                          <span className="absolute bottom-0.5 text-[9px] font-medium text-gray-700">
                            {estilo.fechaFormateada}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cuarta parte horizontal - Cama 19 */}
              <div className="flex space-x-1.5">
                {[19].map((numero) => {
                  const estilo = obtenerEstiloCama(numero);
                  return (
                    <div
                      key={numero}
                      onClick={() => handleClickCama(numero)}
                      className={`w-16 h-16 ${estilo.color} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center`}
                      title={estilo.titulo}
                    >
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                        {numero}
                      </span>
                      {estilo.puntaje && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntaje}
                          </span>
                          <span className="absolute bottom-0.5 text-[9px] font-medium text-gray-700">
                            {estilo.fechaFormateada}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Columna vertical - Camas 22, 20, 21 (de arriba hacia abajo) */}
              <div className="flex flex-col space-y-1.5">
                {[22, 20, 21].map((numero) => {
                  const estilo = obtenerEstiloCama(numero);
                  return (
                    <div
                      key={numero}
                      onClick={() => handleClickCama(numero)}
                      className={`w-16 h-16 ${estilo.color} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center`}
                      title={estilo.titulo}
                    >
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                        {numero}
                      </span>
                      {estilo.puntaje && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntaje}
                          </span>
                          <span className="absolute bottom-0.5 text-[9px] font-medium text-gray-700">
                            {estilo.fechaFormateada}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quinta parte horizontal - Camas 23,24,25 */}
              <div className="flex space-x-1.5">
                {[23,24,25].map((numero) => {
                  const estilo = obtenerEstiloCama(numero);
                  return (
                    <div
                      key={numero}
                      onClick={() => handleClickCama(numero)}
                      className={`w-16 h-16 ${estilo.color} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center`}
                      title={estilo.titulo}
                    >
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                        {numero}
                      </span>
                      {estilo.puntaje && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntaje}
                          </span>
                          <span className="absolute bottom-0.5 text-[9px] font-medium text-gray-700">
                            {estilo.fechaFormateada}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Columna vertical final - Camas 26, 27 (de arriba hacia abajo) */}
              <div className="flex flex-col space-y-1.5">
                {[26, 27].map((numero) => {
                  const estilo = obtenerEstiloCama(numero);
                  return (
                    <div
                      key={numero}
                      onClick={() => handleClickCama(numero)}
                      className={`w-16 h-16 ${estilo.color} rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative flex items-center justify-center`}
                      title={estilo.titulo}
                    >
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                        {numero}
                      </span>
                      {estilo.puntaje && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntaje}
                          </span>
                          <span className="absolute bottom-0.5 text-[9px] font-medium text-gray-700">
                            {estilo.fechaFormateada}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>
            </div>

            {/* Leyenda - Solo visible en desktop */}
            <div className="mt-6 hidden md:flex justify-center items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-200 rounded"></div>
                <span>Sin evaluar</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-400 rounded"></div>
                <span>Bajo (0-9)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>Moderado (10-14)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-400 rounded"></div>
                <span>Alto (15-24)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span>Crítico (&gt;24)</span>
              </div>
            </div>

            {/* Estadísticas por Sectores */}
            <div className="mt-6 flex flex-col md:flex-row md:justify-between items-start gap-4">
              {/* Sector 1 */}
              <div className="w-full md:w-auto bg-white rounded-lg shadow-sm p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Sector 1 (1-9)</h4>
                <div className="space-y-2 text-xs">
                  {(() => {
                    const stats = calcularEstadisticasSector([1,2,3,4,5,6,7,8,9]);
                    return (
                      <>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Sin evaluar:</span>
                          <span className="font-semibold text-gray-800">{stats.sinCategorizar}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Bajo:</span>
                          <span className="font-semibold text-green-600">{stats.bajo}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Moderado:</span>
                          <span className="font-semibold text-yellow-600">{stats.moderado}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Alto:</span>
                          <span className="font-semibold text-orange-600">{stats.alto}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Crítico:</span>
                          <span className="font-semibold text-red-600">{stats.critico}%</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Sector 2 */}
              <div className="w-full md:w-auto bg-white rounded-lg shadow-sm p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Sector 2 (10-19)</h4>
                <div className="space-y-2 text-xs">
                  {(() => {
                    const stats = calcularEstadisticasSector([10,11,12,13,14,15,16,17,18,19]);
                    return (
                      <>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Sin evaluar:</span>
                          <span className="font-semibold text-gray-800">{stats.sinCategorizar}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Bajo:</span>
                          <span className="font-semibold text-green-600">{stats.bajo}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Moderado:</span>
                          <span className="font-semibold text-yellow-600">{stats.moderado}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Alto:</span>
                          <span className="font-semibold text-orange-600">{stats.alto}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Crítico:</span>
                          <span className="font-semibold text-red-600">{stats.critico}%</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Sector 3 */}
              <div className="w-full md:w-auto bg-white rounded-lg shadow-sm p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Sector 3 (20-27)</h4>
                <div className="space-y-2 text-xs">
                  {(() => {
                    const stats = calcularEstadisticasSector([20,21,22,23,24,25,26,27]);
                    return (
                      <>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Sin evaluar:</span>
                          <span className="font-semibold text-gray-800">{stats.sinCategorizar}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Bajo:</span>
                          <span className="font-semibold text-green-600">{stats.bajo}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Moderado:</span>
                          <span className="font-semibold text-yellow-600">{stats.moderado}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Alto:</span>
                          <span className="font-semibold text-orange-600">{stats.alto}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Crítico:</span>
                          <span className="font-semibold text-red-600">{stats.critico}%</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Registro de Procedimientos */}
      <div>
        {/* Header con título y botones */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Registro de Procedimientos</h2>
          <div className="flex items-center gap-2">
            {/* Botón de calendario para filtrar */}
            <button
              onClick={() => setShowFiltroFechasModal(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md transform hover:scale-105 cursor-pointer"
              title="Filtrar por fechas"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            {/* Botón de agregar */}
            <div className="relative group">
              <button
                onClick={() => esMedico && setShowRegistroProcedimientosModal(true)}
                disabled={!esMedico}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
                  esMedico 
                    ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md transform hover:scale-105 cursor-pointer' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={esMedico ? "Agregar procedimiento" : "Solo usuarios médicos pueden agregar procedimientos"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {!esMedico && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 z-10">
                  Solo usuarios con estamento "Médico" pueden agregar procedimientos
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listado de registros */}
        <div className="bg-white bg-opacity-60 backdrop-blur-xl rounded-2xl p-8 shadow-sm">
          {loadingRegistros ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando registros...</p>
            </div>
          ) : procedimientos.length === 0 ? (
            <div className="bg-gray-50 bg-opacity-50 rounded-xl h-96 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">No hay registros</p>
                <p className="text-sm mt-2">Crea un nuevo registro usando el botón +</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {agruparProcedimientos().map((grupo, index) => (
                <div key={index} className={`${grupo.registradoPorUsuario ? 'bg-green-50 border border-green-200' : 'bg-gray-50'} rounded-lg p-4 flex items-center justify-between ${grupo.registradoPorUsuario ? 'hover:bg-green-100' : 'hover:bg-gray-100'} transition-colors`}>
                  {/* Vista móvil */}
                  <div className="flex-1 md:hidden">
                    <div className="space-y-1">
                      <div>
                        <span className="text-sm text-gray-500">Turno: </span>
                        <span className="font-semibold text-gray-800">{grupo.turno}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Fecha: </span>
                        <span className="font-semibold text-gray-800">
                          {(() => {
                            const [year, month, day] = grupo.fecha.split('-');
                            return `${day}/${month}/${year}`;
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Usuario: </span>
                        <span className="font-semibold text-gray-800">{grupo.usuarioNombre}</span>
                      </div>
                    </div>
                  </div>
                  {/* Botones móvil */}
                  <div className="flex items-center gap-2 md:hidden">
                    <button
                      onClick={() => handleVerDetalle(grupo.procedimientos)}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      title="Ver detalle"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {esAdministrador && (
                      <button
                        onClick={() => handleEliminarGrupo(grupo.procedimientos)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        title="Eliminar registro (Solo administrador)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Vista desktop */}
                  <div className="flex-1 hidden md:grid grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="font-semibold text-gray-800">
                        {(() => {
                          // Parsear fecha local sin conversión UTC
                          const [year, month, day] = grupo.fecha.split('-');
                          return `${day}/${month}/${year}`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Turno</p>
                      <p className="font-semibold text-gray-800">{grupo.turno}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Usuario</p>
                      <p className="font-semibold text-gray-800">{grupo.usuarioNombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tiempo Total</p>
                      <p className="font-semibold text-gray-800">{formatearTiempoTotal(grupo.tiempoTotal)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Procedimientos</p>
                      <p className="font-semibold text-gray-800">{grupo.cantidadProcedimientos} procedimiento{grupo.cantidadProcedimientos > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerDetalle(grupo.procedimientos)}
                      className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      title="Ver detalle"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {esAdministrador && (
                      <button
                        onClick={() => handleEliminarGrupo(grupo.procedimientos)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        title="Eliminar registro (Solo administrador)"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Modal de Apache II */}
    <ModalApache2
      isOpen={showApache2Modal}
      onClose={handleCloseModal}
      pacientePreseleccionado={pacienteSeleccionado}
    />

    {/* Modal de registro de procedimientos */}
    <ModalRegistroProcedimientosMedicina
      isOpen={showRegistroProcedimientosModal}
      onClose={() => setShowRegistroProcedimientosModal(false)}
      onSuccess={() => {
        cargarProcedimientos();
        cargarMetricas();
      }}
    />

    {/* Modal de detalle de procedimientos */}
    <ModalDetalleProcedimientoMedicina
      isOpen={showDetalleModal}
      onClose={() => setShowDetalleModal(false)}
      procedimientos={selectedGrupoProcedimientos}
      onUpdate={() => {
        cargarProcedimientos();
        cargarMetricas();
      }}
    />

    {/* Modal de detalle Apache II del paciente */}
    <ModalDetalleApache2Paciente
      isOpen={showDetalleApache2Modal}
      onClose={() => setShowDetalleApache2Modal(false)}
      pacienteRut={pacienteSeleccionado?.rut || null}
      pacienteNombre={pacienteSeleccionado?.nombre || ''}
    />

    {/* Modal de información del mapa */}
    {showMapInfoModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Información del Mapa UTI</h3>
            <button
              onClick={() => setShowMapInfoModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Apache II</h4>
              <p className="text-sm text-gray-600 mb-3">
                Sistema de puntuación para evaluar la gravedad de enfermedades en pacientes de cuidados intensivos.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Leyenda de Colores</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-200 rounded"></div>
                  <span className="text-sm">Sin evaluar</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-sm">Bajo (0-9)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-sm">Moderado (10-14)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-400 rounded"></div>
                  <span className="text-sm">Alto (15-24)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span className="text-sm">Crítico (&gt;24)</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Instrucciones</h4>
              <p className="text-sm text-gray-600">
                Toca cualquier cama para ver los detalles del paciente y su evaluación Apache II más reciente.
              </p>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Modal de filtro de fechas */}
      {showFiltroFechasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-11/12 max-w-md p-8 border border-gray-200">
            {/* Header del modal */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Filtrar por Fechas</h3>
              <button
                type="button"
                onClick={() => setShowFiltroFechasModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenido */}
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 bg-white hover:border-gray-400 shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 bg-white hover:border-gray-400 shadow-sm"
                />
              </div>
            </div>

            {/* Footer con botones */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setFechaDesde('');
                  setFechaHasta('');
                  cargarProcedimientos();
                }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setShowFiltroFechasModal(false)}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuMedicina;

