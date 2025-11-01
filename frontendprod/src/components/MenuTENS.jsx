import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import procedimientosTENSAPI from '../services/procedimientosTENSAPI';
import ModalProcedimientosTENS from './ModalProcedimientosTENS';
import ModalDetalleProcedimientosTENS from './ModalDetalleProcedimientosTENS';

const MenuTENS = ({ onOpenModal }) => {
  const { user } = useAuth();
  const [showRegistroProcedimientosModal, setShowRegistroProcedimientosModal] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [metricas, setMetricas] = useState(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Verificar si el usuario es TENS o administrador
  const esTENS = user?.estamento === 'TENS' || user?.estamento === 'Administrador';

  useEffect(() => {
    cargarRegistros();
  }, []);

  // Recargar registros cuando cambien las fechas de filtro
  useEffect(() => {
    if (fechaDesde || fechaHasta) {
      cargarRegistros();
    }
  }, [fechaDesde, fechaHasta]);

  // Cargar métricas después de cargar registros
  useEffect(() => {
    if (!loadingRegistros) {
      cargarMetricas();
    }
  }, [registros, loadingRegistros]);

  const cargarRegistros = async () => {
    try {
      setLoadingRegistros(true);
      // Obtener todos los registros TENS recientes
      const params = { limit: 100 };
      
      if (fechaDesde) {
        params.fechaDesde = fechaDesde;
      }
      if (fechaHasta) {
        params.fechaHasta = fechaHasta;
      }
      
      const data = await procedimientosTENSAPI.obtenerTodos(params);
      // Los registros ya vienen filtrados para TENS desde el backend
      const registrosTENS = (data.registros || []).slice(0, 10); // Limitar a 10
      
      setRegistros(registrosTENS);
    } catch (error) {
      console.error('Error al cargar registros:', error);
    } finally {
      setLoadingRegistros(false);
    }
  };

  const cargarMetricas = async () => {
    try {
      setLoadingMetricas(true);
      
      // Usar la API específica de TENS para obtener métricas
      const metricasAPI = await procedimientosTENSAPI.obtenerMetricas();
      
      // También obtener registros para cálculos locales si es necesario
      const todosRegistros = await procedimientosTENSAPI.obtenerTodos({ 
        limit: 1000,
        incluirProcedimientos: 'true'
      });
      
      
      const registrosTENS = todosRegistros.registros || [];
      
      // Separar por turnos
      const registrosDia = registrosTENS.filter((r) => r.turno === 'Día');
      const registrosNoche = registrosTENS.filter((r) => r.turno === 'Noche');
      
      // Contar total de procedimientos por turno
      const totalProcedimientosDia = registrosDia.reduce((sum, r) => {
        const cantidadProc = r.procedimientos?.length || 0;
        return sum + cantidadProc;
      }, 0);
      
      const totalProcedimientosNoche = registrosNoche.reduce((sum, r) => {
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

      // Calcular total de procedimientos TENS
      const totalProcedimientosTENS = totalProcedimientosDia + totalProcedimientosNoche;

      setMetricas({
        totalProcedimientos: metricasAPI.totalProcedimientos?.total || totalProcedimientosTENS,
        tiempoPromedioAseo: metricasAPI.tiempoPromedioAseo?.minutos || 0,
        promedioProcedimientos: {
          dia: Math.round(promedioDia * 10) / 10,
          noche: Math.round(promedioNoche * 10) / 10,
          totalTurnosDia: registrosDia.length,
          totalTurnosNoche: registrosNoche.length
        }
      });
    } catch (error) {
      console.error('Error al cargar métricas TENS:', error);
      setMetricas({
        totalProcedimientos: 0,
        tiempoPromedioAseo: 0,
        promedioProcedimientos: { dia: 0, noche: 0, totalTurnosDia: 0, totalTurnosNoche: 0 }
      });
    } finally {
      setLoadingMetricas(false);
    }
  };

  const handleVerDetalle = async (registroId) => {
    try {
      const registro = await procedimientosTENSAPI.obtenerPorId(registroId);
      setSelectedRegistro(registro);
      setShowDetalleModal(true);
    } catch (error) {
      console.error('Error al obtener detalle del registro TENS:', error);
    }
  };

  const formatearTiempoTotal = (minutos) => {
    // Validar que minutos sea un número válido
    if (minutos === null || minutos === undefined || isNaN(minutos)) {
      return '0m';
    }
    
    const minutosNum = parseInt(minutos) || 0;
    const horas = Math.floor(minutosNum / 60);
    const mins = minutosNum % 60;
    
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Función para formatear fechas sin problemas de zona horaria
  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    
    // Si la fecha viene en formato YYYY-MM-DD, parsear manualmente para evitar problemas de timezone
    if (typeof fechaString === 'string' && fechaString.includes('-')) {
      const [year, month, day] = fechaString.split('-').map(num => parseInt(num));
      const fecha = new Date(year, month - 1, day); // month - 1 porque los meses en JS van de 0-11
      return fecha.toLocaleDateString('es-ES');
    }
    
    // Para otros formatos, usar Date normal
    return new Date(fechaString).toLocaleDateString('es-ES');
  };

  // Métricas dinámicas para TENS
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
      titulo: 'Registros Este Mes',
      valor: '...',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-purple-500',
      subtitulo: 'Cargando...'
    }
  ] : [
    {
      titulo: 'Total Procedimientos',
      valor: `${metricas.totalProcedimientos}`,
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'bg-blue-500',
      subtitulo: 'Procedimientos registrados'
    },
    {
      titulo: 'Tiempo Promedio Aseo',
      valor: `${metricas.tiempoPromedioAseo} min`,
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500',
      subtitulo: 'Aseo y cuidados del paciente'
    },
    {
      titulo: 'Promedio Procedimientos',
      valor: `Día:${metricas.promedioProcedimientos.dia} / Noche:${metricas.promedioProcedimientos.noche}`,
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

        {/* Sección de Registro de Procedimientos */}
        <div>
          {/* Header con título y botones */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Registro de Procedimientos TENS</h2>
            <div className="flex items-center gap-2">
              {/* Botón de calendario para filtrar */}
              <button
                onClick={() => {
                  const modal = document.getElementById('fecha-filter-modal-tens');
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
                  onClick={() => esTENS && setShowRegistroProcedimientosModal(true)}
                  disabled={!esTENS}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
                    esTENS 
                      ? 'bg-blue-900 hover:bg-blue-800 text-white hover:shadow-md transform hover:scale-105 cursor-pointer' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title={esTENS ? "Agregar procedimiento TENS" : "Solo usuarios TENS pueden agregar procedimientos"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                {!esTENS && (
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 z-10">
                    Solo usuarios con estamento "TENS" pueden agregar procedimientos
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
                          <span className="font-semibold text-gray-800">{formatearFecha(registro.fecha || registro.fechaRegistro)}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Usuario: </span>
                          <span className="font-semibold text-gray-800">{registro.usuario ? `${registro.usuario.nombres} ${registro.usuario.apellidos}` : registro.nombreUsuario}</span>
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
                        <p className="font-semibold text-gray-800">{formatearFecha(registro.fecha || registro.fechaRegistro)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tiempo Total</p>
                        <p className="font-semibold text-gray-800">{formatearTiempoTotal(registro.tiempoTotal)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Usuario</p>
                        <p className="font-semibold text-gray-800">{registro.usuario ? `${registro.usuario.nombres} ${registro.usuario.apellidos}` : registro.nombreUsuario}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleVerDetalle(registro.id)}
                      className="ml-4 p-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors"
                      title="Ver detalle"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Modal de registro de procedimientos TENS */}
      <ModalProcedimientosTENS
        isOpen={showRegistroProcedimientosModal}
        onClose={() => setShowRegistroProcedimientosModal(false)}
        onSuccess={() => {
          cargarRegistros();
          cargarMetricas(); // Recargar métricas después de guardar
        }}
      />

      {/* Modal de detalle de registro TENS */}
      <ModalDetalleProcedimientosTENS
        isOpen={showDetalleModal}
        onClose={() => {
          setShowDetalleModal(false);
          setSelectedRegistro(null);
        }}
        registro={selectedRegistro}
        onUpdate={() => {
          cargarRegistros();
          cargarMetricas();
        }}
      />

      {/* Modal de filtro de fechas */}
      <dialog id="fecha-filter-modal-tens" className="modal">
        <div className="modal-box w-11/12 max-w-md">
          <h3 className="font-bold text-lg mb-4">Filtrar por Fechas</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          <div className="modal-action">
            <form method="dialog" className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFechaDesde('');
                  setFechaHasta('');
                  cargarRegistros();
                }}
                className="btn btn-sm"
              >
                Limpiar Filtros
              </button>
              <button
                type="button"
                onClick={() => {
                  const modal = document.getElementById('fecha-filter-modal-tens');
                  if (modal) modal.close();
                }}
                className="btn btn-sm btn-primary"
              >
                Cerrar
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};

export default MenuTENS;
