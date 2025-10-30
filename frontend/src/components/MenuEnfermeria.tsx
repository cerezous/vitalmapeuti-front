import React, { useState, useEffect } from 'react';
import ModalNAS from './ModalNAS';
import ModalRegistroProcedimientosEnfermeria from './ModalRegistroProcedimientosEnfermeria';
import ModalDetalleRegistro from './ModalDetalleRegistro';
import ModalDetalleNASPaciente from './ModalDetalleNASPaciente';
import { pacienteService, Paciente } from '../services/api';
import nasAPI from '../services/nasAPI';
import registroProcedimientosAPI, { RegistroProcedimiento } from '../services/registroProcedimientosAPI';
import { enfermeriaService, MetricasEnfermeria } from '../services/enfermeriaAPI';
import { useAuth } from '../contexts/AuthContext';

interface MenuEnfermeriaProps {
  onOpenModal?: () => void;
}

interface NASPorCama {
  [numeroCama: number]: {
    puntuacion: number;
    color: string;
    categoria: string;
    fecha: string;
    pacienteNombre: string;
  };
}

const MenuEnfermeria: React.FC<MenuEnfermeriaProps> = ({ onOpenModal }) => {
  const { user } = useAuth();
  const [showNASModal, setShowNASModal] = useState(false);
  const [showRegistroProcedimientosModal, setShowRegistroProcedimientosModal] = useState(false);
  const [nasPorCama, setNASPorCama] = useState<NASPorCama>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showMapInfoModal, setShowMapInfoModal] = useState(false);
  const [registros, setRegistros] = useState<RegistroProcedimiento[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroProcedimiento | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [metricas, setMetricas] = useState<any>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [metricasAPI, setMetricasAPI] = useState<MetricasEnfermeria | null>(null);
  const [camasBloqueadas, setCamasBloqueadas] = useState<number[]>(() => {
    // Cargar camas bloqueadas desde localStorage
    const stored = localStorage.getItem('camasBloqueadas');
    return stored ? JSON.parse(stored) : [];
  });
  const [showDetalleNASModal, setShowDetalleNASModal] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<{ rut: string; nombre: string } | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  // Verificar si el usuario es enfermera/o o administrador
  const esEnfermeria = user?.estamento === 'Enfermería' || user?.estamento === 'Administrador';

  // Cargar pacientes y sus NAS
  useEffect(() => {
    cargarNAS();
    cargarRegistros();
  }, []);

  // Cargar métricas después de cargar NAS
  useEffect(() => {
    if (!isLoading) {
      cargarMetricas();
    }
  }, [nasPorCama, isLoading]);

  // Recargar NAS cuando se cierra el modal
  const handleCloseModal = () => {
    setShowNASModal(false);
    cargarNAS();
  };

  const cargarNAS = async () => {
    try {
      setIsLoading(true);
      const pacientesData = await pacienteService.obtenerPacientes();
      setPacientes(pacientesData);
      const nasData: NASPorCama = {};

      // Para cada paciente con cama asignada, obtener su último NAS
      for (const paciente of pacientesData) {
        if (paciente.camaAsignada) {
          try {
            const registros = await nasAPI.obtenerRegistrosPorPaciente(paciente.rut, { limit: 1 });
            if (registros && registros.length > 0) {
              const ultimoNAS = registros[0];
              const puntuacion = ultimoNAS.puntuacionTotal;
              
              let color = 'bg-blue-200'; // Por defecto
              let categoria = 'Normal';
              
              // Clasificar según puntuación NAS (nueva clasificación MINSAL)
              if (puntuacion <= 50) {
                color = 'bg-green-400';
                categoria = 'Baja';
              } else if (puntuacion <= 80) {
                color = 'bg-yellow-400';
                categoria = 'Moderada';
              } else if (puntuacion <= 100) {
                color = 'bg-orange-400';
                categoria = 'Alta';
              } else {
                color = 'bg-red-400';
                categoria = 'Muy Alta';
              }

              nasData[paciente.camaAsignada] = {
                puntuacion,
                color,
                categoria,
                fecha: ultimoNAS.fechaRegistro,
                pacienteNombre: paciente.nombreCompleto
              };
            }
          } catch (error) {
            console.error(`Error al obtener NAS del paciente ${paciente.rut}:`, error);
          }
        }
      }

      setNASPorCama(nasData);
    } catch (error) {
      console.error('Error al cargar NAS:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarRegistros = async () => {
    try {
      setLoadingRegistros(true);
      // Obtener todos los registros recientes
      const data = await registroProcedimientosAPI.obtenerTodos({ limit: 100 });
      
      // Filtrar solo registros de enfermería (excluir turno "24 h" que es de medicina)
      const registrosEnfermeria = (data.registros || [])
        .filter((r: RegistroProcedimiento) => r.turno === 'Día' || r.turno === 'Noche')
        .slice(0, 10); // Limitar a 10 después de filtrar
      
      setRegistros(registrosEnfermeria);
    } catch (error) {
      console.error('Error al cargar registros:', error);
    } finally {
      setLoadingRegistros(false);
    }
  };

  const cargarMetricas = async () => {
    try {
      setLoadingMetricas(true);
      
      // Obtener métricas del API
      const metricasAPIData = await enfermeriaService.obtenerMetricas();
      setMetricasAPI(metricasAPIData);
      
      // Calcular métricas basadas en datos locales
      const pacientesConNAS = Object.values(nasPorCama);
      
      if (pacientesConNAS.length === 0) {
        setMetricas({
          nasPromedio: 0,
          pacientesAltaCarga: { total: 0, porcentaje: 0 },
          promedioProcedimientos: { dia: 0, noche: 0, totalTurnosDia: 0, totalTurnosNoche: 0 }
        });
        return;
      }

      // 1. NAS Promedio
      const sumaTotal = pacientesConNAS.reduce((sum, p) => sum + p.puntuacion, 0);
      const nasPromedio = sumaTotal / pacientesConNAS.length;

      // 2. Pacientes con carga alta/crítica (>80%)
      const pacientesAlta = pacientesConNAS.filter(p => p.puntuacion > 80).length;
      const porcentajeAlta = (pacientesAlta / pacientesConNAS.length) * 100;

      // 3. Promedio de procedimientos por turno
      // Obtener todos los registros CON procedimientos incluidos
      const todosRegistros = await registroProcedimientosAPI.obtenerTodos({ 
        limit: 1000,
        incluirProcedimientos: 'true'
      });
      
      
      // Separar por turnos
      const registrosDia = todosRegistros.registros.filter((r: any) => r.turno === 'Día');
      const registrosNoche = todosRegistros.registros.filter((r: any) => r.turno === 'Noche');
      
      
      // Contar total de procedimientos por turno
      const totalProcedimientosDia = registrosDia.reduce((sum: number, r: any) => {
        const cantidadProc = r.procedimientos?.length || 0;
        return sum + cantidadProc;
      }, 0);
      
      const totalProcedimientosNoche = registrosNoche.reduce((sum: number, r: any) => {
        const cantidadProc = r.procedimientos?.length || 0;
        return sum + cantidadProc;
      }, 0);
      
      
      // Calcular promedio: total procedimientos / total turnos
      const promedioDia = registrosDia.length > 0
        ? totalProcedimientosDia / registrosDia.length
        : 0;
      
      const promedioNoche = registrosNoche.length > 0
        ? totalProcedimientosNoche / registrosNoche.length
        : 0;


      setMetricas({
        nasPromedio: nasPromedio,
        pacientesAltaCarga: {
          total: pacientesAlta,
          porcentaje: porcentajeAlta
        },
        promedioProcedimientos: {
          dia: Math.round(promedioDia * 10) / 10, // Redondear a 1 decimal
          noche: Math.round(promedioNoche * 10) / 10, // Redondear a 1 decimal
          totalTurnosDia: registrosDia.length,
          totalTurnosNoche: registrosNoche.length
        }
      });
    } catch (error) {
      console.error('Error al cargar métricas:', error);
      setMetricas({
        nasPromedio: 0,
        pacientesAltaCarga: { total: 0, porcentaje: 0 },
        promedioProcedimientos: { dia: 0, noche: 0, totalTurnosDia: 0, totalTurnosNoche: 0 }
      });
    } finally {
      setLoadingMetricas(false);
    }
  };

  const handleVerDetalle = async (registroId: number) => {
    try {
      const registro = await registroProcedimientosAPI.obtenerPorId(registroId);
      setSelectedRegistro(registro);
      setShowDetalleModal(true);
    } catch (error) {
      console.error('Error al obtener detalle del registro:', error);
    }
  };

  const formatearTiempoTotal = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const obtenerEstiloCama = (numeroCama: number) => {
    // Verificar si la cama está bloqueada primero
    if (camasBloqueadas.includes(numeroCama)) {
      return {
        color: 'bg-gray-600',
        puntuacion: '',
        fecha: '',
        fechaFormateada: '',
        titulo: `Cama ${numeroCama} - Bloqueada`,
        pacienteRut: null
      };
    }

    const nasInfo = nasPorCama[numeroCama];
    if (nasInfo) {
      // Buscar el paciente por cama
      const paciente = pacientes.find(p => p.camaAsignada === numeroCama);
      return {
        color: nasInfo.color,
        puntuacion: nasInfo.puntuacion.toFixed(1),
        fecha: nasInfo.fecha,
        fechaFormateada: formatearFecha(nasInfo.fecha),
        titulo: `Cama ${numeroCama} - ${nasInfo.pacienteNombre} - NAS: ${nasInfo.puntuacion.toFixed(1)}%`,
        pacienteRut: paciente?.rut || null,
        pacienteNombre: nasInfo.pacienteNombre
      };
    }
    return {
      color: 'bg-blue-200',
      puntuacion: '',
      fecha: '',
      fechaFormateada: '',
      titulo: `Cama ${numeroCama}`,
      pacienteRut: null
    };
  };

  const handleClickCama = (numeroCama: number) => {
    const estilo = obtenerEstiloCama(numeroCama);
    if (estilo.pacienteRut && estilo.pacienteNombre) {
      setPacienteSeleccionado({
        rut: estilo.pacienteRut,
        nombre: estilo.pacienteNombre
      });
      setShowDetalleNASModal(true);
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

  const formatearFechaCompleta = (fechaStr: string): string => {
    if (!fechaStr) return '';
    
    try {
      const fechaMatch = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (fechaMatch) {
        const [, year, month, day] = fechaMatch;
        return `${day}/${month}/${year}`;
      }
      
      const fecha = new Date(fechaStr);
      
      if (isNaN(fecha.getTime())) {
        console.warn('Fecha inválida:', fechaStr);
        return '';
      }
      
      return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (error) {
      console.error('Error al formatear fecha:', error, fechaStr);
      return '';
    }
  };

  const calcularEstadisticasSector = (camasRango: number[]) => {
    const total = camasRango.length;
    let sinCategorizar = 0;
    let baja = 0;
    let moderada = 0;
    let alta = 0;
    let muyAlta = 0;

    camasRango.forEach(numeroCama => {
      const nasInfo = nasPorCama[numeroCama];
      if (!nasInfo) {
        sinCategorizar++;
      } else {
        // Nueva clasificación MINSAL
        if (nasInfo.puntuacion <= 50) {
          baja++;
        } else if (nasInfo.puntuacion <= 80) {
          moderada++;
        } else if (nasInfo.puntuacion <= 100) {
          alta++;
        } else {
          muyAlta++;
        }
      }
    });

    return {
      sinCategorizar: ((sinCategorizar / total) * 100).toFixed(0),
      baja: ((baja / total) * 100).toFixed(0),
      moderada: ((moderada / total) * 100).toFixed(0),
      alta: ((alta / total) * 100).toFixed(0),
      muyAlta: ((muyAlta / total) * 100).toFixed(0)
    };
  };

  // Métricas dinámicas
  const metricasDisplay = loadingMetricas || !metricas ? [
    {
      titulo: 'NAS Promedio',
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
      titulo: 'Carga Alta/Crítica',
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
      titulo: 'Total Procedimientos',
      valor: '...',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'bg-green-500',
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
      titulo: 'NAS Promedio',
      valor: `${metricas.nasPromedio.toFixed(1)}%`,
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: metricas.nasPromedio <= 50 ? 'bg-green-500' : 
             metricas.nasPromedio <= 80 ? 'bg-yellow-500' : 'bg-orange-500',
      subtitulo: 'Carga de trabajo promedio'
    },
    {
      titulo: 'Carga Alta/Crítica',
      valor: `${metricas.pacientesAltaCarga.total}`,
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: metricas.pacientesAltaCarga.porcentaje > 30 ? 'bg-red-500' : 
             metricas.pacientesAltaCarga.porcentaje > 15 ? 'bg-orange-500' : 'bg-green-500',
      subtitulo: `${metricas.pacientesAltaCarga.porcentaje.toFixed(0)}% con NAS >80%`
    },
    {
      titulo: 'Total Procedimientos',
      valor: metricasAPI?.totalProcedimientos?.texto || '0',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'bg-green-500',
      subtitulo: 'Registrados este mes'
    },
    {
      titulo: 'Promedio Procedimientos',
      valor: `Día:${metricas.promedioProcedimientos.dia} / Noche:${metricas.promedioProcedimientos.noche}`,
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'bg-purple-500',
      subtitulo: `${metricas.promedioProcedimientos.totalTurnosDia} turnos día / ${metricas.promedioProcedimientos.totalTurnosNoche} turnos noche`
    }
  ];

  return (
    <>
    <div className="space-y-8 pb-16 md:pb-8">
      {/* Métricas superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Sección de NAS */}
      <div>
        {/* Header con título y botón */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Evaluación NAS</h2>
          <div className="relative group">
            <button
              onClick={() => esEnfermeria && setShowNASModal(true)}
              disabled={!esEnfermeria}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
                esEnfermeria 
                  ? 'bg-blue-900 hover:bg-blue-800 text-white hover:shadow-md transform hover:scale-105 cursor-pointer' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={esEnfermeria ? "Agregar evaluación NAS" : "Solo usuarios de enfermería pueden agregar evaluaciones"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {!esEnfermeria && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 z-10">
                Solo usuarios con estamento "Enfermería" pueden agregar evaluaciones NAS
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
                      {estilo.puntuacion && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntuacion}
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
                      {estilo.puntuacion && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntuacion}
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
                      {estilo.puntuacion && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntuacion}
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
                      {estilo.puntuacion && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntuacion}
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
                      {estilo.puntuacion && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntuacion}
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
                      {estilo.puntuacion && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntuacion}
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
                      {estilo.puntuacion && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntuacion}
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
                      {estilo.puntuacion && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntuacion}
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
                      {estilo.puntuacion && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntuacion}
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
                      {estilo.puntuacion && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntuacion}
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
                      {estilo.puntuacion && (
                        <>
                          <span className="text-xs font-bold text-gray-800">
                            {estilo.puntuacion}
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
                <span>Baja (0-50%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>Moderada (51-80%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-400 rounded"></div>
                <span>Alta (81-100%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span>Muy Alta (&gt;100%)</span>
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
                          <span className="text-gray-600">Baja:</span>
                          <span className="font-semibold text-green-600">{stats.baja}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Moderada:</span>
                          <span className="font-semibold text-yellow-600">{stats.moderada}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Alta:</span>
                          <span className="font-semibold text-orange-600">{stats.alta}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Muy Alta:</span>
                          <span className="font-semibold text-red-600">{stats.muyAlta}%</span>
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
                          <span className="text-gray-600">Baja:</span>
                          <span className="font-semibold text-green-600">{stats.baja}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Moderada:</span>
                          <span className="font-semibold text-yellow-600">{stats.moderada}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Alta:</span>
                          <span className="font-semibold text-orange-600">{stats.alta}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Muy Alta:</span>
                          <span className="font-semibold text-red-600">{stats.muyAlta}%</span>
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
                          <span className="text-gray-600">Baja:</span>
                          <span className="font-semibold text-green-600">{stats.baja}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Moderada:</span>
                          <span className="font-semibold text-yellow-600">{stats.moderada}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Alta:</span>
                          <span className="font-semibold text-orange-600">{stats.alta}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Muy Alta:</span>
                          <span className="font-semibold text-red-600">{stats.muyAlta}%</span>
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
        {/* Header con título y botón */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Registro de Procedimientos</h2>
          <div className="relative group">
            <button
              onClick={() => esEnfermeria && setShowRegistroProcedimientosModal(true)}
              disabled={!esEnfermeria}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
                esEnfermeria 
                  ? 'bg-blue-900 hover:bg-blue-800 text-white hover:shadow-md transform hover:scale-105 cursor-pointer' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={esEnfermeria ? "Agregar procedimiento" : "Solo usuarios de enfermería pueden agregar procedimientos"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {!esEnfermeria && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 z-10">
                Solo usuarios con estamento "Enfermería" pueden agregar procedimientos
              </div>
            )}
          </div>
        </div>

        {/* Listado de registros */}
        <div className="bg-white bg-opacity-60 backdrop-blur-xl rounded-2xl p-8 shadow-sm">
          {loadingRegistros ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando registros...</p>
            </div>
          ) : registros.length === 0 ? (
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
              {registros.map((registro) => {
                // Verificar si el registro es del usuario actual
                const registradoPorUsuario = user && registro.usuarioId === user.id;
                
                return (
                <div key={registro.id} className={`${registradoPorUsuario ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'} rounded-lg p-4 flex items-center justify-between ${registradoPorUsuario ? 'hover:bg-blue-100' : 'hover:bg-gray-100'} transition-colors`}>
                  {/* Vista móvil */}
                  <div className="flex-1 md:hidden">
                    <div className="space-y-1">
                      <div>
                        <span className="text-sm text-gray-500">Turno: </span>
                        <span className="font-semibold text-gray-800">{registro.turno}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Fecha: </span>
                        <span className="font-semibold text-gray-800">
                          {formatearFechaCompleta(registro.fecha)}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Usuario: </span>
                        <span className="font-semibold text-gray-800">{registro.usuario.nombres} {registro.usuario.apellidos}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vista desktop */}
                  <div className="flex-1 hidden md:grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Turno</p>
                      <p className="font-semibold text-gray-800">{registro.turno}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="font-semibold text-gray-800">
                        {formatearFechaCompleta(registro.fecha)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tiempo Total</p>
                      <p className="font-semibold text-gray-800">{formatearTiempoTotal(registro.tiempoTotal)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Usuario</p>
                      <p className="font-semibold text-gray-800">{registro.usuario.nombres} {registro.usuario.apellidos}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleVerDetalle(registro.id)}
                    className="ml-4 p-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors"
                    title="Ver detalle"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Modal de NAS */}
    <ModalNAS
      isOpen={showNASModal}
      onClose={handleCloseModal}
    />

    {/* Modal de registro de procedimientos */}
    <ModalRegistroProcedimientosEnfermeria
      isOpen={showRegistroProcedimientosModal}
      onClose={() => setShowRegistroProcedimientosModal(false)}
      onSuccess={() => {
        cargarRegistros();
        cargarMetricas(); // Recargar métricas después de guardar
      }}
    />

    {/* Modal de detalle de registro */}
    <ModalDetalleRegistro
      isOpen={showDetalleModal}
      onClose={() => setShowDetalleModal(false)}
      registro={selectedRegistro}
      onUpdate={() => {
        cargarRegistros();
        // También podríamos recargar métricas si es necesario
      }}
    />

    {/* Modal de detalle NAS del paciente */}
    <ModalDetalleNASPaciente
      isOpen={showDetalleNASModal}
      onClose={() => setShowDetalleNASModal(false)}
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
              <h4 className="font-semibold text-gray-800 mb-2">NAS (Nursing Activities Score)</h4>
              <p className="text-sm text-gray-600 mb-3">
                Sistema de puntuación que mide la carga de trabajo de enfermería requerida por cada paciente.
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
                  <span className="text-sm">Baja (&lt;50%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-sm">Moderada (51-80%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-400 rounded"></div>
                  <span className="text-sm">Alta (81-100%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span className="text-sm">Muy Alta (&gt;100%)</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Instrucciones</h4>
              <p className="text-sm text-gray-600">
                Toca cualquier cama para ver los detalles del paciente y su evaluación NAS más reciente.
              </p>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default MenuEnfermeria;

