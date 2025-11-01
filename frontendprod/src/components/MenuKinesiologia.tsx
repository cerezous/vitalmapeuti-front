import React, { useState, useEffect } from 'react';
import ModalCategorizacionKinesiologia from './ModalCategorizacionKinesiologia';
import ModalRegistroProcedimientos from './ModalRegistroProcedimientos';
import ModalDetalleProcedimientoKinesiologia from './ModalDetalleProcedimientoKinesiologia';
import ModalDetalleCategorizacionKinesiologia from './ModalDetalleCategorizacionKinesiologia';
import { pacienteService, Paciente } from '../services/api';
import categorizacionKinesiologiaAPI from '../services/categorizacionKinesiologiaAPI';
import procedimientosKinesiologiaAPI, { ProcedimientoKinesiologia } from '../services/procedimientosKinesiologiaAPI';
import { kinesiologiaService, MetricasKinesiologia } from '../services/kinesiologiaAPI';
import { useAuth } from '../contexts/AuthContext';

interface MenuKinesiologiaProps {
  onOpenModal?: () => void;
}

interface CategorizacionCama {
  [numeroCama: number]: {
    complejidad: 'Baja' | 'Mediana' | 'Alta';
    color: string;
    inicial: string;
    fecha: string;
    pacienteNombre: string;
  };
}

const MenuKinesiologia: React.FC<MenuKinesiologiaProps> = ({ onOpenModal }) => {
  const { user } = useAuth();
  const [showCategorizacionModal, setShowCategorizacionModal] = useState(false);
  const [showRegistroProcedimientosModal, setShowRegistroProcedimientosModal] = useState(false);
  const [categorizacionesPorCama, setCategorizacionesPorCama] = useState<CategorizacionCama>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showMapInfoModal, setShowMapInfoModal] = useState(false);
  const [procedimientos, setProcedimientos] = useState<ProcedimientoKinesiologia[]>([]);
  const [loadingProcedimientos, setLoadingProcedimientos] = useState(false);
  const [metricas, setMetricas] = useState<MetricasKinesiologia | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [selectedProcedimiento, setSelectedProcedimiento] = useState<ProcedimientoKinesiologia | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [selectedGrupoProcedimientos, setSelectedGrupoProcedimientos] = useState<ProcedimientoKinesiologia[]>([]);
  const [camasBloqueadas, setCamasBloqueadas] = useState<number[]>(() => {
    // Cargar camas bloqueadas desde localStorage
    const stored = localStorage.getItem('camasBloqueadas');
    return stored ? JSON.parse(stored) : [];
  });
  const [showDetalleCategorizacionModal, setShowDetalleCategorizacionModal] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<{ rut: string; nombre: string } | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  // Verificar si el usuario es kinesiólogo/a o administrador
  const esKinesiologia = user?.estamento === 'Kinesiología' || user?.estamento === 'Administrador';

  // Cargar pacientes y sus categorizaciones
  useEffect(() => {
    cargarCategorizaciones();
    cargarProcedimientos();
    cargarMetricas();
  }, []);

  // Recargar procedimientos cuando cambien las fechas de filtro
  useEffect(() => {
    if (fechaDesde || fechaHasta) {
      cargarProcedimientos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaDesde, fechaHasta]);

  // Recargar categorizaciones cuando se cierra el modal
  const handleCloseModal = () => {
    setShowCategorizacionModal(false);
    cargarCategorizaciones();
  };

  const cargarCategorizaciones = async () => {
    try {
      setIsLoading(true);
      const pacientesData = await pacienteService.obtenerPacientes();
      setPacientes(pacientesData);
      const categorizaciones: CategorizacionCama = {};

      // Obtener todas las categorizaciones en paralelo usando Promise.all
      const promesasCategorizaciones = pacientesData
        .filter(paciente => paciente.camaAsignada)
        .map(async (paciente) => {
          try {
            const data = await categorizacionKinesiologiaAPI.obtenerPorPaciente(paciente.rut, { limit: 1 });
            if (data.categorizaciones && data.categorizaciones.length > 0) {
              const ultimaCategorizacion = data.categorizaciones[0];
              const complejidad = ultimaCategorizacion.complejidad as 'Baja' | 'Mediana' | 'Alta';
              
              let color = 'bg-blue-200'; // Por defecto
              let inicial = '';
              
              if (complejidad === 'Baja') {
                color = 'bg-green-400';
                inicial = 'B';
              } else if (complejidad === 'Mediana') {
                color = 'bg-yellow-400';
                inicial = 'M';
              } else if (complejidad === 'Alta') {
                color = 'bg-red-400';
                inicial = 'A';
              }

              return {
                cama: paciente.camaAsignada,
                data: {
                  complejidad,
                  color,
                  inicial,
                  fecha: ultimaCategorizacion.fechaCategorizacion,
                  pacienteNombre: paciente.nombreCompleto
                }
              };
            }
            return null;
          } catch (error) {
            console.error(`Error al obtener categorización del paciente ${paciente.rut}:`, error);
            return null;
          }
        });

      // Esperar a que todas las promesas se resuelvan
      const resultados = await Promise.all(promesasCategorizaciones);
      
      // Agregar resultados válidos al objeto categorizaciones
      resultados.forEach(resultado => {
        if (resultado && resultado.cama) {
          categorizaciones[resultado.cama] = resultado.data;
        }
      });

      setCategorizacionesPorCama(categorizaciones);
    } catch (error) {
      console.error('Error al cargar categorizaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cargarProcedimientos = async () => {
    try {
      setLoadingProcedimientos(true);
      // Obtener procedimientos de kinesiología (incluye los que no tienen paciente asociado)
      const params: any = { limit: 50 };
      
      if (fechaDesde) {
        params.fechaDesde = fechaDesde;
      }
      if (fechaHasta) {
        params.fechaHasta = fechaHasta;
      }
      
      const data = await procedimientosKinesiologiaAPI.obtenerTodos(params);
      setProcedimientos(data.procedimientos || []);
    } catch (error) {
      console.error('Error al cargar procedimientos:', error);
    } finally {
      setLoadingProcedimientos(false);
    }
  };

  const cargarMetricas = async () => {
    try {
      setLoadingMetricas(true);
      const metricasData = await kinesiologiaService.obtenerMetricas();
      setMetricas(metricasData);
    } catch (error) {
      console.error('Error al cargar métricas:', error);
    } finally {
      setLoadingMetricas(false);
    }
  };

  const formatearTiempo = (tiempo: string): string => {
    const [horas, minutos] = tiempo.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos;
    
    if (totalMinutos < 60) {
      return `${totalMinutos}m`;
    }
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Agrupar procedimientos por fecha, turno y usuario
  const agruparProcedimientos = () => {
    const grupos: { [key: string]: ProcedimientoKinesiologia[] } = {};
    
    procedimientos.forEach(proc => {
      // Incluir el usuarioId en la clave para separar registros por usuario
      const key = `${proc.fecha}-${proc.turno || 'Sin turno'}-${proc.usuarioId}`;
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(proc);
    });

    // Convertir a array y ordenar por fecha descendente
    return Object.entries(grupos)
      .map(([key, procs]) => ({
        fecha: procs[0].fecha,
        turno: procs[0].turno || 'Sin turno',
        procedimientos: procs,
        tiempoTotal: procs.reduce((acc, p) => {
          const [h, m] = p.tiempo.split(':').map(Number);
          return acc + (h * 60) + m;
        }, 0),
        cantidadProcedimientos: procs.length,
        // Verificar si algún procedimiento del grupo fue registrado por el usuario actual
        registradoPorUsuario: user ? procs.some(proc => proc.usuarioId === user.id) : false,
        // Agregar información del usuario que registró (tomar el primero del grupo)
        usuarioNombre: procs[0].usuario ? `${procs[0].usuario.nombres} ${procs[0].usuario.apellidos}` : 'Usuario desconocido'
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  };

  const formatearTiempoTotal = (minutos: number) => {
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
        inicial: '',
        fecha: '',
        fechaFormateada: '',
        titulo: `Cama ${numeroCama} - Bloqueada`,
        pacienteRut: null
      };
    }

    const categorizacion = categorizacionesPorCama[numeroCama];
    if (categorizacion) {
      // Buscar el paciente por cama
      const paciente = pacientes.find(p => p.camaAsignada === numeroCama);
      return {
        color: categorizacion.color,
        inicial: categorizacion.inicial,
        fecha: categorizacion.fecha,
        fechaFormateada: formatearFecha(categorizacion.fecha),
        titulo: `Cama ${numeroCama} - ${categorizacion.pacienteNombre} - Complejidad ${categorizacion.complejidad}`,
        pacienteRut: paciente?.rut || null,
        pacienteNombre: categorizacion.pacienteNombre
      };
    }
    return {
      color: 'bg-blue-200',
      inicial: '',
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
      setShowDetalleCategorizacionModal(true);
    }
  };

  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return '';
    
    try {
      // Si la fecha viene en formato YYYY-MM-DD, parsearla manualmente
      // para evitar problemas con zonas horarias
      const fechaMatch = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (fechaMatch) {
        const [, year, month, day] = fechaMatch;
        return `${day}/${month}`;
      }
      
      // Intentar parsear la fecha normalmente
      const fecha = new Date(fechaStr);
      
      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) {
        console.warn('Fecha inválida:', fechaStr);
        return '';
      }
      
      // Formatear la fecha
      return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    } catch (error) {
      console.error('Error al formatear fecha:', error, fechaStr);
      return '';
    }
  };

  const calcularEstadisticasSector = (camasRango: number[]) => {
    const total = camasRango.length;
    let sinCategorizar = 0;
    let baja = 0;
    let mediana = 0;
    let alta = 0;

    camasRango.forEach(numeroCama => {
      const categorizacion = categorizacionesPorCama[numeroCama];
      if (!categorizacion) {
        sinCategorizar++;
      } else {
        switch (categorizacion.complejidad) {
          case 'Baja':
            baja++;
            break;
          case 'Mediana':
            mediana++;
            break;
          case 'Alta':
            alta++;
            break;
        }
      }
    });

    return {
      sinCategorizar: ((sinCategorizar / total) * 100).toFixed(0),
      baja: ((baja / total) * 100).toFixed(0),
      mediana: ((mediana / total) * 100).toFixed(0),
      alta: ((alta / total) * 100).toFixed(0)
    };
  };
  // Métricas dinámicas
  const metricasDisplay = loadingMetricas || !metricas ? [
    {
      titulo: 'Total Procedimientos',
      valor: '...',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'bg-blue-500',
      subtitulo: 'Cargando...'
    },
    {
      titulo: 'Prom Categorización',
      valor: '...',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-gray-500',
      subtitulo: 'Cargando...'
    },
    {
      titulo: 'Promedio Procedimientos Día',
      valor: '...',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'bg-yellow-500',
      subtitulo: 'Cargando...'
    },
    {
      titulo: 'Promedio Procedimientos Noche',
      valor: '...',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      color: 'bg-indigo-500',
      subtitulo: 'Cargando...'
    }
  ] : [
    {
      titulo: 'Total Procedimientos',
      valor: metricas?.totalProcedimientos?.texto || '0',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'bg-blue-500',
      subtitulo: 'Registrados este mes'
    },
    {
      titulo: 'Prom Categorización',
      valor: metricas?.gravedad?.promedioPuntaje?.toString() || '0',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: (metricas?.gravedad?.complejidadPredominante === 'Alta') ? 'bg-red-500' : 
             (metricas?.gravedad?.complejidadPredominante === 'Mediana') ? 'bg-yellow-500' : 
             (metricas?.gravedad?.complejidadPredominante === 'Baja') ? 'bg-green-500' : 'bg-gray-500',
      subtitulo: `Complejidad ${metricas?.gravedad?.complejidadPredominante || 'N/A'} (${metricas?.gravedad?.total || 0} pac.)`
    },
    {
      titulo: 'Promedio Procedimientos Día',
      valor: metricas?.promedioDia?.promedio?.toString() || '0',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'bg-yellow-500',
      subtitulo: `${metricas?.promedioDia?.totalTurnos || 0} turnos diurnos`
    },
    {
      titulo: 'Promedio Procedimientos Noche',
      valor: metricas?.promedioNoche?.promedio?.toString() || '0',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      color: 'bg-indigo-500',
      subtitulo: `${metricas?.promedioNoche?.totalTurnos || 0} turnos nocturnos`
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

      {/* Sección de Categorización */}
      <div>
        {/* Header con título y botón */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Categorización</h2>
          <div className="relative group">
            <button
              onClick={() => esKinesiologia && setShowCategorizacionModal(true)}
              disabled={!esKinesiologia}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
                esKinesiologia 
                  ? 'bg-gray-700 hover:bg-gray-800 text-white hover:shadow-md transform hover:scale-105 cursor-pointer' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={esKinesiologia ? "Agregar categorización" : "Solo usuarios de kinesiología pueden agregar categorizaciones"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {!esKinesiologia && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 z-10">
                Solo usuarios con estamento "Kinesiología" pueden agregar categorizaciones
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
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                        {numero}
                      </span>
                      {estilo.inicial && (
                        <>
                          <span className="text-xl font-bold text-gray-800">
                            {estilo.inicial}
                          </span>
                          <span className="absolute bottom-0.5 text-[8px] font-medium text-gray-700">
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
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                        {numero}
                      </span>
                      {estilo.inicial && (
                        <>
                          <span className="text-xl font-bold text-gray-800">
                            {estilo.inicial}
                          </span>
                          <span className="absolute bottom-0.5 text-[8px] font-medium text-gray-700">
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
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                        {numero}
                      </span>
                      {estilo.inicial && (
                        <>
                          <span className="text-xl font-bold text-gray-800">
                            {estilo.inicial}
                          </span>
                          <span className="absolute bottom-0.5 text-[8px] font-medium text-gray-700">
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
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                        {numero}
                      </span>
                      {estilo.inicial && (
                        <>
                          <span className="text-xl font-bold text-gray-800">
                            {estilo.inicial}
                          </span>
                          <span className="absolute bottom-0.5 text-[8px] font-medium text-gray-700">
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
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                        {numero}
                      </span>
                      {estilo.inicial && (
                        <>
                          <span className="text-xl font-bold text-gray-800">
                            {estilo.inicial}
                          </span>
                          <span className="absolute bottom-0.5 text-[8px] font-medium text-gray-700">
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
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                        {numero}
                      </span>
                      {estilo.inicial && (
                        <>
                          <span className="text-xl font-bold text-gray-800">
                            {estilo.inicial}
                          </span>
                          <span className="absolute bottom-0.5 text-[8px] font-medium text-gray-700">
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
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                        {numero}
                      </span>
                      {estilo.inicial && (
                        <>
                          <span className="text-xl font-bold text-gray-800">
                            {estilo.inicial}
                          </span>
                          <span className="absolute bottom-0.5 text-[8px] font-medium text-gray-700">
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
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                        {numero}
                      </span>
                      {estilo.inicial && (
                        <>
                          <span className="text-xl font-bold text-gray-800">
                            {estilo.inicial}
                          </span>
                          <span className="absolute bottom-0.5 text-[8px] font-medium text-gray-700">
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
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                        {numero}
                      </span>
                      {estilo.inicial && (
                        <>
                          <span className="text-xl font-bold text-gray-800">
                            {estilo.inicial}
                          </span>
                          <span className="absolute bottom-0.5 text-[8px] font-medium text-gray-700">
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
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                        {numero}
                      </span>
                      {estilo.inicial && (
                        <>
                          <span className="text-xl font-bold text-gray-800">
                            {estilo.inicial}
                          </span>
                          <span className="absolute bottom-0.5 text-[8px] font-medium text-gray-700">
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
                      <span className="absolute top-0.5 left-0.5 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                        {numero}
                      </span>
                      {estilo.inicial && (
                        <>
                          <span className="text-xl font-bold text-gray-800">
                            {estilo.inicial}
                          </span>
                          <span className="absolute bottom-0.5 text-[8px] font-medium text-gray-700">
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
                <span>Sin categorizar</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-400 rounded"></div>
                <span>Baja (B)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>Mediana (M)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-400 rounded"></div>
                <span>Alta (A)</span>
              </div>
            </div>

            {/* Estadísticas por Sectores */}
            <div className="mt-6 flex flex-col md:flex-row md:justify-between items-start gap-4">
              {/* Sector 1 */}
              <div className="w-full md:w-auto bg-white rounded-lg shadow-sm p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Sector 1 (Camas 1-14)</h4>
                <div className="space-y-2 text-xs">
                  {(() => {
                    const stats = calcularEstadisticasSector([1,2,3,4,5,6,7,8,9,10,11,12,13,14]);
                    return (
                      <>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Sin categorizar:</span>
                          <span className="font-semibold text-gray-800">{stats.sinCategorizar}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Baja:</span>
                          <span className="font-semibold text-green-600">{stats.baja}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Mediana:</span>
                          <span className="font-semibold text-yellow-600">{stats.mediana}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Alta:</span>
                          <span className="font-semibold text-red-600">{stats.alta}%</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Sector 2 */}
              <div className="w-full md:w-auto bg-white rounded-lg shadow-sm p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Sector 2 (Camas 15-27)</h4>
                <div className="space-y-2 text-xs">
                  {(() => {
                    const stats = calcularEstadisticasSector([15,16,17,18,19,20,21,22,23,24,25,26,27]);
                    return (
                      <>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Sin categorizar:</span>
                          <span className="font-semibold text-gray-800">{stats.sinCategorizar}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Baja:</span>
                          <span className="font-semibold text-green-600">{stats.baja}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Mediana:</span>
                          <span className="font-semibold text-yellow-600">{stats.mediana}%</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-600">Alta:</span>
                          <span className="font-semibold text-red-600">{stats.alta}%</span>
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
              onClick={() => {
                const modal = document.getElementById('fecha-filter-modal-kinesiologia') as HTMLDialogElement;
                if (modal) modal.showModal();
              }}
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
                onClick={() => esKinesiologia && setShowRegistroProcedimientosModal(true)}
                disabled={!esKinesiologia}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
                  esKinesiologia 
                    ? 'bg-gray-700 hover:bg-gray-800 text-white hover:shadow-md transform hover:scale-105 cursor-pointer' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={esKinesiologia ? "Agregar procedimiento" : "Solo usuarios de kinesiología pueden agregar procedimientos"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {!esKinesiologia && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 z-10">
                  Solo usuarios con estamento "Kinesiología" pueden agregar procedimientos
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listado de procedimientos */}
        <div className="bg-white bg-opacity-60 backdrop-blur-xl rounded-2xl p-8 shadow-sm">
          {loadingProcedimientos ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando procedimientos...</p>
            </div>
          ) : procedimientos.length === 0 ? (
            <div className="bg-gray-50 bg-opacity-50 rounded-xl h-96 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">No hay procedimientos</p>
                <p className="text-sm mt-2">Crea un nuevo procedimiento usando el botón +</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {agruparProcedimientos().map((grupo, index) => (
                <div key={index} className={`${
                  grupo.registradoPorUsuario 
                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                    : 'bg-gray-50 hover:bg-gray-100'
                } rounded-lg p-4 flex items-center justify-between transition-colors border`}>
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
                  
                  {/* Vista desktop */}
                  <div className="flex-1 hidden md:grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Turno</p>
                      <p className="font-semibold text-gray-800">{grupo.turno}</p>
                    </div>
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
                      <p className="text-sm text-gray-500">Tiempo Total</p>
                      <p className="font-semibold text-gray-800">{formatearTiempoTotal(grupo.tiempoTotal)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Procedimientos</p>
                      <p className="font-semibold text-gray-800">{grupo.cantidadProcedimientos} procedimiento{grupo.cantidadProcedimientos > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedGrupoProcedimientos(grupo.procedimientos);
                      setShowDetalleModal(true);
                    }}
                    className="ml-4 p-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
                    title="Ver detalle"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Modal de categorización */}
    <ModalCategorizacionKinesiologia
      isOpen={showCategorizacionModal}
      onClose={handleCloseModal}
    />

    {/* Modal de registro de procedimientos */}
    <ModalRegistroProcedimientos
      isOpen={showRegistroProcedimientosModal}
      onClose={() => setShowRegistroProcedimientosModal(false)}
      onSuccess={() => {
        cargarProcedimientos();
        cargarMetricas();
      }}
      tipo="kinesiologia"
    />

    {/* Modal de detalle de procedimientos */}
    <ModalDetalleProcedimientoKinesiologia
      isOpen={showDetalleModal}
      onClose={() => {
        setShowDetalleModal(false);
        setSelectedGrupoProcedimientos([]);
      }}
      procedimientos={selectedGrupoProcedimientos}
      onUpdate={() => {
        cargarProcedimientos();
        cargarMetricas();
      }}
    />

    {/* Modal de detalle de categorización */}
    <ModalDetalleCategorizacionKinesiologia
      isOpen={showDetalleCategorizacionModal}
      onClose={() => {
        setShowDetalleCategorizacionModal(false);
        setPacienteSeleccionado(null);
      }}
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
              <h4 className="font-semibold text-gray-800 mb-2">Categorización Kinesiología</h4>
              <p className="text-sm text-gray-600 mb-3">
                Sistema de categorización que evalúa la complejidad de los pacientes para determinar las necesidades kinesiológicas.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Leyenda de Colores</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-200 rounded"></div>
                  <span className="text-sm">Sin categorizar</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-sm">Baja (B)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-sm">Mediana (M)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span className="text-sm">Alta (A)</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Instrucciones</h4>
              <p className="text-sm text-gray-600">
                Toca cualquier cama para ver los detalles del paciente y su categorización kinesiológica más reciente.
              </p>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Modal de filtro de fechas */}
      <dialog id="fecha-filter-modal-kinesiologia" className="modal">
        <div className="modal-box w-11/12 max-w-md">
          {/* Header del modal */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xl text-gray-900">Filtrar por Fechas</h3>
            <button
              type="button"
              onClick={() => {
                const modal = document.getElementById('fecha-filter-modal-kinesiologia') as HTMLDialogElement;
                if (modal) modal.close();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Contenido */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-colors text-gray-900 bg-white hover:border-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-colors text-gray-900 bg-white hover:border-gray-300"
              />
            </div>
          </div>

          {/* Footer con botones */}
          <div className="modal-action mt-6">
            <button
              type="button"
              onClick={() => {
                setFechaDesde('');
                setFechaHasta('');
                cargarProcedimientos();
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => {
                const modal = document.getElementById('fecha-filter-modal-kinesiologia') as HTMLDialogElement;
                if (modal) modal.close();
              }}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Aplicar
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};

export default MenuKinesiologia;

