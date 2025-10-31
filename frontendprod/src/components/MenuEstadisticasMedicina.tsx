import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import estadisticasAPI, { EstadisticasEstamento } from '../services/estadisticasAPI';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const MenuEstadisticasMedicina: React.FC = () => {
  const { user } = useAuth();
  const [estadisticas, setEstadisticas] = useState<EstadisticasEstamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const datos = await estadisticasAPI.obtenerEstadisticasEstamento('medicina');
      setEstadisticas(datos);
    } catch (error) {
      setError('Error al cargar las estadísticas de medicina');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  // Implementar pull-to-refresh
  usePullToRefresh({
    onRefresh: cargarEstadisticas,
    enabled: true,
    threshold: 80
  });

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
          Estadísticas de Medicina
        </h1>
        <p className="text-gray-600">
          Estadísticas de procedimientos y actividades médicas
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Procedimientos</dt>
                <dd className="text-lg font-medium text-gray-900">{estadisticas.totalProcedimientos || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Tiempo Total</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {Math.floor((estadisticas.tiempoTotal || 0) / 60)}h {(estadisticas.tiempoTotal || 0) % 60}m
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Tiempo Promedio</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {(estadisticas.tiempoPromedio || 0).toFixed(1)} min
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Eficiencia</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {(((estadisticas.totalProcedimientos || 0) * 15) / (estadisticas.tiempoTotal || 1) * 100).toFixed(1)}%
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por Turnos */}
      {estadisticas.procedimientosPorTurno && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Turnos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(estadisticas.procedimientosPorTurno).map(([turno, cantidad]) => (
              <div key={turno} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{cantidad}</div>
                <div className="text-sm text-gray-600">Turno {turno}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Procedimientos Más Frecuentes */}
      {estadisticas.procedimientosMasFrecuentes && estadisticas.procedimientosMasFrecuentes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Procedimientos Más Frecuentes</h3>
          <div className="space-y-3">
            {estadisticas.procedimientosMasFrecuentes.map((proc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{proc.nombre}</span>
                <span className="text-sm text-gray-600">{proc.cantidad} veces</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuEstadisticasMedicina;
