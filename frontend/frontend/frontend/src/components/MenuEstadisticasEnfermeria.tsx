import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import estadisticasAPI, { EstadisticasEstamento } from '../services/estadisticasAPI';

const MenuEstadisticasEnfermeria: React.FC = () => {
  const { user } = useAuth();
  const [estadisticas, setEstadisticas] = useState<EstadisticasEstamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const datos = await estadisticasAPI.obtenerEstadisticasEstamento('enfermeria');
      setEstadisticas(datos);
    } catch (error) {
      setError('Error al cargar las estadísticas de enfermería');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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

  if (!estadisticas) return null;

  return (
    <div className="space-y-6 pb-16 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Estadísticas de Enfermería
        </h1>
        <p className="text-gray-600">
          Métricas de enfermería y evaluaciones NAS
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Evaluaciones</dt>
                <dd className="text-lg font-medium text-gray-900">{estadisticas.totalEvaluaciones}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">NAS Promedio</dt>
                <dd className="text-lg font-medium text-gray-900">{estadisticas.puntuacionPromedio?.toFixed(1)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Carga Moderada</dt>
                <dd className="text-lg font-medium text-gray-900">{estadisticas.distribucionCarga?.moderada}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Carga Alta</dt>
                <dd className="text-lg font-medium text-gray-900">{estadisticas.distribucionCarga?.alta}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución de Carga NAS */}
      {estadisticas.distribucionCarga && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Carga NAS</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Carga Baja (&lt;40)</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(estadisticas.distribucionCarga.baja / (estadisticas.distribucionCarga.baja + estadisticas.distribucionCarga.moderada + estadisticas.distribucionCarga.alta)) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{estadisticas.distribucionCarga.baja}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Carga Moderada (40-59)</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(estadisticas.distribucionCarga.moderada / (estadisticas.distribucionCarga.baja + estadisticas.distribucionCarga.moderada + estadisticas.distribucionCarga.alta)) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{estadisticas.distribucionCarga.moderada}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Carga Alta (≥60)</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(estadisticas.distribucionCarga.alta / (estadisticas.distribucionCarga.baja + estadisticas.distribucionCarga.moderada + estadisticas.distribucionCarga.alta)) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{estadisticas.distribucionCarga.alta}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de NAS Score */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución NAS Score</h3>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {estadisticas.puntuacionPromedio?.toFixed(1)}
          </div>
          <p className="text-sm text-gray-600 mb-4">Puntaje Promedio NAS</p>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
            (estadisticas.puntuacionPromedio || 0) < 40 
              ? 'bg-green-100 text-green-800' 
              : (estadisticas.puntuacionPromedio || 0) < 60 
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {(estadisticas.puntuacionPromedio || 0) < 40 ? 'Carga Baja' : (estadisticas.puntuacionPromedio || 0) < 60 ? 'Carga Moderada' : 'Carga Alta'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuEstadisticasEnfermeria;


