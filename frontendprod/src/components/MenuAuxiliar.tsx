import React, { useState, useEffect } from 'react';
import ModalAuxiliar from './ModalAuxiliar';
import ModalDetalleRegistroAuxiliar from './ModalDetalleRegistroAuxiliar';
import auxiliaresAPI, { GrupoProcedimientosAuxiliares, MetricasAuxiliares } from '../services/auxiliaresAPI';
import { useAuth } from '../contexts/AuthContext';

interface MenuAuxiliarProps {
  onOpenModal?: () => void;
}

const MenuAuxiliar: React.FC<MenuAuxiliarProps> = ({ onOpenModal }) => {
  const { user } = useAuth();
  const [showRegistroProcedimientosModal, setShowRegistroProcedimientosModal] = useState(false);
  const [grupos, setGrupos] = useState<GrupoProcedimientosAuxiliares[]>([]);
  const [loadingProcedimientos, setLoadingProcedimientos] = useState(false);
  const [metricas, setMetricas] = useState<MetricasAuxiliares | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoProcedimientosAuxiliares | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  // Verificar si el usuario es auxiliar o administrador
  const esAuxiliar = user?.estamento === 'Auxiliares' || user?.estamento === 'Administrador';

  // Cargar datos iniciales
  useEffect(() => {
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

  const cargarProcedimientos = async () => {
    try {
      setLoadingProcedimientos(true);
      // Usar la API específica de auxiliares para obtener grupos
      const params: any = { limit: 20 };
      
      if (fechaDesde) {
        params.fechaDesde = fechaDesde;
      }
      if (fechaHasta) {
        params.fechaHasta = fechaHasta;
      }
      
      const gruposData = await auxiliaresAPI.obtenerAgrupados(params);
      setGrupos(gruposData);
    } catch (error) {
      console.error('Error al cargar procedimientos auxiliares:', error);
    } finally {
      setLoadingProcedimientos(false);
    }
  };

  const cargarMetricas = async () => {
    try {
      setLoadingMetricas(true);
      // Usar la API específica de auxiliares para obtener métricas
      const metricasData = await auxiliaresAPI.obtenerMetricas();
      setMetricas(metricasData);
    } catch (error) {
      console.error('Error al cargar métricas auxiliares:', error);
    } finally {
      setLoadingMetricas(false);
    }
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

  // Los datos ya vienen agrupados de la API, no necesitamos agrupar manualmente

  // Métricas dinámicas para auxiliares
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
      titulo: 'Tiempo Total',
      valor: '...',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500',
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
      titulo: 'Tiempo Total',
      valor: metricas?.tiempoTotal?.texto || '0h 0m',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500',
      subtitulo: 'Tiempo acumulado este mes'
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

      {/* Sección de Registro de Procedimientos Auxiliares */}
      <div>
        {/* Header con título y botones */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Registro de Procedimientos Auxiliares</h2>
          <div className="flex items-center gap-2">
            {/* Botón de calendario para filtrar */}
            <button
              onClick={() => {
                const modal = document.getElementById('fecha-filter-modal-auxiliar') as HTMLDialogElement;
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
                onClick={() => esAuxiliar && setShowRegistroProcedimientosModal(true)}
                disabled={!esAuxiliar}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
                  esAuxiliar 
                    ? 'bg-gray-700 hover:bg-gray-800 text-white hover:shadow-md transform hover:scale-105 cursor-pointer' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={esAuxiliar ? "Agregar procedimiento auxiliar" : "Solo usuarios auxiliares pueden agregar procedimientos"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {!esAuxiliar && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 z-10">
                  Solo usuarios con estamento "Auxiliares" pueden agregar procedimientos
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
          ) : grupos.length === 0 ? (
            <div className="bg-gray-50 bg-opacity-50 rounded-xl h-96 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">No hay procedimientos auxiliares</p>
                <p className="text-sm mt-2">Crea un nuevo procedimiento usando el botón +</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {grupos.map((grupo, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
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
                        <span className="font-semibold text-gray-800">
                          {grupo.procedimientos && grupo.procedimientos.length > 0 && grupo.procedimientos[0].usuario 
                            ? `${grupo.procedimientos[0].usuario.nombres} ${grupo.procedimientos[0].usuario.apellidos}`
                            : 'Usuario desconocido'
                          }
                        </span>
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
                      setSelectedGrupo(grupo);
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

    {/* Modal de registro de procedimientos auxiliares */}
    <ModalAuxiliar
      isOpen={showRegistroProcedimientosModal}
      onClose={() => setShowRegistroProcedimientosModal(false)}
      onSuccess={() => {
        cargarProcedimientos();
        cargarMetricas();
      }}
    />

    {/* Modal de detalle de registro auxiliar */}
    <ModalDetalleRegistroAuxiliar
      isOpen={showDetalleModal}
      onClose={() => {
        setShowDetalleModal(false);
        setSelectedGrupo(null);
      }}
      grupo={selectedGrupo}
      onUpdate={() => {
        cargarProcedimientos();
        cargarMetricas();
      }}
    />

    {/* Modal de filtro de fechas */}
    <dialog id="fecha-filter-modal-auxiliar" className="modal backdrop:bg-black backdrop:opacity-50">
      <div className="relative bg-white rounded-2xl shadow-2xl w-11/12 max-w-md p-8 border border-gray-200">
        {/* Header del modal */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">Filtrar por Fechas</h3>
          <button
            type="button"
            onClick={() => {
              const modal = document.getElementById('fecha-filter-modal-auxiliar') as HTMLDialogElement;
              if (modal) modal.close();
            }}
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all text-gray-900 bg-white hover:border-gray-400 shadow-sm"
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 transition-all text-gray-900 bg-white hover:border-gray-400 shadow-sm"
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
            onClick={() => {
              const modal = document.getElementById('fecha-filter-modal-auxiliar') as HTMLDialogElement;
              if (modal) modal.close();
            }}
            className="px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Aplicar
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button style={{ display: 'none' }}>close</button>
      </form>
    </dialog>
    </>
  );
};

export default MenuAuxiliar;
