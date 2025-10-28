import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import estadisticasAPI, { EstadisticasUTI } from '../services/estadisticasAPI';

// Usar la interfaz importada
type KPIData = EstadisticasUTI;

const MenuEstadisticasUTI: React.FC = () => {
  const { user } = useAuth();
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tiempo' | 'severidad' | 'tendencias'>('overview');

  useEffect(() => {
    cargarDatosEstadisticas();
  }, []);

  const cargarDatosEstadisticas = async () => {
    try {
      setLoading(true);
      const datos = await estadisticasAPI.obtenerEstadisticasUTI();
      setKpiData(datos);
    } catch (error) {
      setError('Error al cargar las estadísticas');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOcupacionColor = (tasa: number) => {
    if (tasa < 70) return 'text-green-600';
    if (tasa < 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOcupacionBgColor = (tasa: number) => {
    if (tasa < 70) return 'bg-green-100';
    if (tasa < 85) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar estadísticas</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!kpiData) return null;

  return (
    <div className="space-y-6 pb-16 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Estadísticas UTI
        </h1>
        <p className="text-gray-600">
          Métricas generales y estado de la Unidad de Terapia Intensiva
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'overview', name: 'Resumen', icon: '📊' },
            { id: 'tiempo', name: 'Tiempo por Estamento', icon: '⏱️' },
            { id: 'severidad', name: 'Severidad', icon: '🏥' },
            { id: 'tendencias', name: 'Tendencias', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Ocupación */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${getOcupacionBgColor(kpiData.ocupacion.tasaOcupacion)}`}>
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Ocupación UTI</dt>
                      <dd className={`text-lg font-medium ${getOcupacionColor(kpiData.ocupacion.tasaOcupacion)}`}>
                        {kpiData.ocupacion.tasaOcupacion.toFixed(1)}%
                      </dd>
                      <dd className="text-sm text-gray-500">
                        {kpiData.ocupacion.camasOcupadas}/{kpiData.ocupacion.totalCamas} camas
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Severidad */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Apache II Promedio</dt>
                      <dd className="text-lg font-medium text-gray-900">{kpiData.severidad.apachePromedio}</dd>
                      <dd className="text-sm text-gray-500">
                        {kpiData.severidad.pacientesCriticos} críticos
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Tiempo Total */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Tiempo Total</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Math.floor((kpiData.tiempo.medicina.total + kpiData.tiempo.enfermeria.total + kpiData.tiempo.kinesiologia.total + kpiData.tiempo.tens.total + kpiData.tiempo.auxiliares.total) / 60)}h
                      </dd>
                      <dd className="text-sm text-gray-500">Todos los estamentos</dd>
                    </dl>
                  </div>
                </div>
              </div>

            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gauge de Ocupación */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ocupación UTI</h3>
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={kpiData.ocupacion.tasaOcupacion < 70 ? 'text-green-500' : kpiData.ocupacion.tasaOcupacion < 85 ? 'text-yellow-500' : 'text-red-500'}
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${kpiData.ocupacion.tasaOcupacion}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {kpiData.ocupacion.tasaOcupacion.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    {kpiData.ocupacion.camasOcupadas} de {kpiData.ocupacion.totalCamas} camas ocupadas
                  </p>
                </div>
              </div>

              {/* Distribución Apache II */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución Apache II</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bajo (≤9)</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(kpiData.severidad.distribucionApache.bajo / 15) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{kpiData.severidad.distribucionApache.bajo}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Moderado (10-19)</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${(kpiData.severidad.distribucionApache.moderado / 15) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{kpiData.severidad.distribucionApache.moderado}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Alto (≥20)</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${(kpiData.severidad.distribucionApache.alto / 15) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{kpiData.severidad.distribucionApache.alto}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tiempo' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Tiempo por Estamento</h2>
            
            {/* Tabla de Tiempo por Estamento */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tiempo por Estamento</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estamento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tiempo Total (min)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Promedio (min)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(kpiData.tiempo).map(([estamento, datos]) => (
                        <tr key={estamento}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                            {estamento}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {datos.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {datos.promedio.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Gráfico de Barras - Tiempo por Estamento */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de tiempo por Estamento</h3>
              <div className="space-y-4">
                {Object.entries(kpiData.tiempo).map(([estamento, datos]) => (
                  <div key={estamento} className="flex items-center">
                    <div className="w-24 text-sm font-medium text-gray-700 capitalize">
                      {estamento}
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-blue-500 h-4 rounded-full" 
                          style={{ width: `${(datos.total / Math.max(...Object.values(kpiData.tiempo).map(d => d.total))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-right">
                      {datos.total} min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'severidad' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Análisis de Severidad</h2>
            
            {/* Métricas de Severidad */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Apache II</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {kpiData.severidad.apachePromedio}
                  </div>
                  <p className="text-sm text-gray-600">Puntaje Promedio</p>
                  <div className="mt-4">
                    <div className="text-sm text-gray-600 mb-2">Distribución:</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Bajo: {kpiData.severidad.distribucionApache.bajo}</span>
                        <span className="text-green-600">{(kpiData.severidad.distribucionApache.bajo / 15 * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Moderado: {kpiData.severidad.distribucionApache.moderado}</span>
                        <span className="text-yellow-600">{(kpiData.severidad.distribucionApache.moderado / 15 * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Alto: {kpiData.severidad.distribucionApache.alto}</span>
                        <span className="text-red-600">{(kpiData.severidad.distribucionApache.alto / 15 * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">NAS Score</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {kpiData.severidad.nasPromedio}
                  </div>
                  <p className="text-sm text-gray-600">Puntaje Promedio</p>
                  <div className="mt-4">
                    <div className="text-sm text-gray-600 mb-2">Distribución:</div>
                    <div className="space-y-2">
                      {kpiData.severidad.distribucionNAS ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Baja: {kpiData.severidad.distribucionNAS.baja}</span>
                            <span className="text-green-600">{(kpiData.severidad.distribucionNAS.baja / 15 * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Moderada: {kpiData.severidad.distribucionNAS.moderada}</span>
                            <span className="text-yellow-600">{(kpiData.severidad.distribucionNAS.moderada / 15 * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Alta: {kpiData.severidad.distribucionNAS.alta}</span>
                            <span className="text-red-600">{(kpiData.severidad.distribucionNAS.alta / 15 * 100).toFixed(0)}%</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">Cargando datos...</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pacientes Críticos (Kinesiología)</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {kpiData.severidad.pacientesCriticos}
                  </div>
                  <p className="text-sm text-gray-600">de 15 pacientes activos</p>
                  <div className="mt-4">
                    <div className="text-sm text-gray-600 mb-2">Distribución:</div>
                    <div className="space-y-2">
                      {kpiData.severidad.distribucionKinesiologia ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Baja: {kpiData.severidad.distribucionKinesiologia.baja}</span>
                            <span className="text-green-600">{(kpiData.severidad.distribucionKinesiologia.baja / 15 * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Mediana: {kpiData.severidad.distribucionKinesiologia.mediana}</span>
                            <span className="text-yellow-600">{(kpiData.severidad.distribucionKinesiologia.mediana / 15 * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Alta: {kpiData.severidad.distribucionKinesiologia.alta}</span>
                            <span className="text-red-600">{(kpiData.severidad.distribucionKinesiologia.alta / 15 * 100).toFixed(0)}%</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">Cargando datos...</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tendencias' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Tendencias Históricas</h2>
            
            {/* Gráfico de Tendencias */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tendencias de los Últimos 7 Días</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Ocupación (%)</h4>
                  <div className="flex items-end space-x-2 h-32">
                    {kpiData.tendencias.ocupacion7dias.map((valor, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="bg-blue-500 rounded-t w-full"
                          style={{ height: `${(valor / 100) * 120}px` }}
                        ></div>
                        <div className="text-xs text-gray-600 mt-1">D{index + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tiempo Total (min)</h4>
                  <div className="flex items-end space-x-2 h-32">
                    {kpiData.tendencias.tiempo7dias.map((valor, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="bg-green-500 rounded-t w-full"
                          style={{ height: `${(valor / 1500) * 120}px` }}
                        ></div>
                        <div className="text-xs text-gray-600 mt-1">D{index + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>


            {/* Tabla Detallada de Procedimientos y Ranking */}
            <div className="grid grid-cols-3 gap-6">
        {/* Tabla de Promedios - 3/4 de la página */}
        <div className="col-span-2 bg-white shadow overflow-hidden sm:rounded-md flex flex-col">
          <div className="px-4 py-5 sm:p-6 flex-1 flex flex-col">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Promedios de Tiempo por Procedimiento</h3>
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Procedimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiempo Promedio (min)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {kpiData.procedimientosDetalle && Array.isArray(kpiData.procedimientosDetalle) ? 
                    kpiData.procedimientosDetalle.map((proc, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={proc.nombre}>
                            {proc.nombre}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {proc.tiempoPromedio}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            proc.estamento === 'Medicina' ? 'bg-green-100 text-green-800' :
                            proc.estamento === 'Enfermería' ? 'bg-blue-900 text-white' :
                            proc.estamento === 'Kinesiología' ? 'bg-gray-800 text-white' :
                            proc.estamento === 'TENS' ? 'bg-sky-100 text-sky-800' :
                            proc.estamento === 'Auxiliares' ? 'bg-gray-200 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {proc.estamento}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {proc.cantidad} veces
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          Cargando datos...
                        </td>
                      </tr>
                    )
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Contenedor de Rankings - 1/4 de la página */}
        <div className="col-span-1 flex flex-col space-y-4">
          {/* Top 10 Procedimientos Más Largos */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md flex-1 flex flex-col">
            <div className="px-4 py-5 sm:p-6 flex-1 flex flex-col">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Top 10 Más Largos</h3>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {kpiData.rankingProcedimientos && Array.isArray(kpiData.rankingProcedimientos) ? 
                  kpiData.rankingProcedimientos.map((proc, index) => (
                    <div key={index} className="group hover:bg-gray-50 rounded-lg p-3 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-bold text-white">{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate group-hover:text-red-600 transition-colors" title={proc.nombre}>
                              {proc.nombre}
                            </div>
                            <div className="flex items-center mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${
                                proc.estamento === 'Medicina' ? 'bg-green-100 text-green-800' :
                                proc.estamento === 'Enfermería' ? 'bg-blue-900 text-white' :
                                proc.estamento === 'Kinesiología' ? 'bg-gray-800 text-white' :
                                proc.estamento === 'TENS' ? 'bg-sky-100 text-sky-800' :
                                proc.estamento === 'Auxiliares' ? 'bg-gray-200 text-gray-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {proc.estamento}
                              </span>
                              <span className="text-xs text-gray-500">{proc.cantidad} veces</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-3 text-right">
                          <div className="text-sm font-bold text-red-600">
                            {proc.tiempoPromedio} min
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-sm text-gray-500 py-8">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cargando datos...
                    </div>
                  )
                }
              </div>
            </div>
          </div>

          {/* Top 10 Procedimientos Más Cortos */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md flex-1 flex flex-col">
            <div className="px-4 py-5 sm:p-6 flex-1 flex flex-col">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Top 10 Más Rápidos</h3>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {kpiData.procedimientosDetalle && Array.isArray(kpiData.procedimientosDetalle) ? 
                  kpiData.procedimientosDetalle
                    .sort((a, b) => a.tiempoPromedio - b.tiempoPromedio)
                    .slice(0, 10)
                    .map((proc, index) => (
                      <div key={index} className="group hover:bg-gray-50 rounded-lg p-3 transition-colors duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mr-3">
                              <span className="text-xs font-bold text-white">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate group-hover:text-green-600 transition-colors" title={proc.nombre}>
                                {proc.nombre}
                              </div>
                              <div className="flex items-center mt-1">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${
                                  proc.estamento === 'Medicina' ? 'bg-green-100 text-green-800' :
                                  proc.estamento === 'Enfermería' ? 'bg-blue-900 text-white' :
                                  proc.estamento === 'Kinesiología' ? 'bg-gray-800 text-white' :
                                  proc.estamento === 'TENS' ? 'bg-sky-100 text-sky-800' :
                                  proc.estamento === 'Auxiliares' ? 'bg-gray-200 text-gray-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {proc.estamento}
                                </span>
                                <span className="text-xs text-gray-500">{proc.cantidad} veces</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-3 text-right">
                            <div className="text-sm font-bold text-green-600">
                              {proc.tiempoPromedio} min
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-sm text-gray-500 py-8">
                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Cargando datos...
                      </div>
                    )
                }
              </div>
            </div>
          </div>
        </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuEstadisticasUTI;
