import React, { useState, useEffect } from 'react';
import categorizacionKinesiologiaAPI, { CategorizacionKinesiologia } from '../services/categorizacionKinesiologiaAPI';

interface ModalDetalleCategorizacionKinesiologiaDiaProps {
  isOpen: boolean;
  onClose: () => void;
  categorizacionId: number;
  pacienteNombre: string;
}

const ModalDetalleCategorizacionKinesiologiaDia: React.FC<ModalDetalleCategorizacionKinesiologiaDiaProps> = ({
  isOpen,
  onClose,
  categorizacionId,
  pacienteNombre
}) => {
  const [categorizacion, setCategorizacion] = useState<CategorizacionKinesiologia | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && categorizacionId) {
      cargarCategorizacion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, categorizacionId]);

  const cargarCategorizacion = async () => {
    try {
      setLoading(true);
      const data = await categorizacionKinesiologiaAPI.obtenerPorId(categorizacionId);
      setCategorizacion(data);
    } catch (error) {
      console.error('Error al cargar categorización:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const obtenerColorComplejidad = (complejidad: string) => {
    switch (complejidad) {
      case 'Baja': return 'text-green-600 bg-green-100';
      case 'Mediana': return 'text-yellow-600 bg-yellow-100';
      case 'Alta': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const obtenerDescripcionPuntaje = (puntaje: number, campo: string) => {
    const descripciones: { [key: string]: { [key: number]: string } } = {
      patronRespiratorio: {
        1: 'Normal o leve',
        3: 'Moderado',
        5: 'Severo'
      },
      asistenciaVentilatoria: {
        1: 'Sin asistencia',
        3: 'CPAP/BiPAP',
        5: 'Ventilación mecánica'
      },
      sasGlasgow: {
        1: 'Despierto y orientado',
        3: 'Sedación moderada',
        5: 'Sedación profunda'
      },
      tosSecreciones: {
        1: 'Efectiva',
        3: 'Moderada',
        5: 'Inefectiva'
      },
      asistencia: {
        1: 'Mínima',
        3: 'Moderada',
        5: 'Total'
      }
    };

    return descripciones[campo]?.[puntaje] || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold">Categorización Kinesiológica del Día</h2>
            <p className="text-sm text-gray-300">{pacienteNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-gray-800" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : categorizacion ? (
            <>
              {/* Resumen General */}
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Fecha de Evaluación</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatearFecha(categorizacion.fechaCategorizacion)}
                    </p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 mb-1">Puntaje Total</p>
                    <p className="text-4xl font-bold text-gray-900">{categorizacion.puntajeTotal}</p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-gray-500 mb-1">Complejidad</p>
                    <span className={`inline-block px-4 py-2 rounded-lg text-base font-bold ${obtenerColorComplejidad(categorizacion.complejidad || '')}`}>
                      {categorizacion.complejidad}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 mt-4">
                  <p className="text-xs text-gray-500 mb-1">Carga Asistencial</p>
                  <p className="text-base font-semibold text-gray-900">{categorizacion.cargaAsistencial}</p>
                </div>
              </div>

              {/* Desglose de Parámetros */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Desglose de Evaluación</h3>
                <div className="space-y-3">
                  {/* Patrón Respiratorio */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">Patrón Respiratorio</h4>
                      <span className="text-2xl font-bold text-gray-900">{categorizacion.patronRespiratorio}</span>
                    </div>
                    <p className="text-xs text-gray-600">{obtenerDescripcionPuntaje(categorizacion.patronRespiratorio, 'patronRespiratorio')}</p>
                  </div>

                  {/* Asistencia Ventilatoria */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">Asistencia Ventilatoria</h4>
                      <span className="text-2xl font-bold text-gray-900">{categorizacion.asistenciaVentilatoria}</span>
                    </div>
                    <p className="text-xs text-gray-600">{obtenerDescripcionPuntaje(categorizacion.asistenciaVentilatoria, 'asistenciaVentilatoria')}</p>
                  </div>

                  {/* SAS/Glasgow */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">SAS/Glasgow</h4>
                      <span className="text-2xl font-bold text-gray-900">{categorizacion.sasGlasgow}</span>
                    </div>
                    <p className="text-xs text-gray-600">{obtenerDescripcionPuntaje(categorizacion.sasGlasgow, 'sasGlasgow')}</p>
                  </div>

                  {/* Tos/Secreciones */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">Tos/Secreciones</h4>
                      <span className="text-2xl font-bold text-gray-900">{categorizacion.tosSecreciones}</span>
                    </div>
                    <p className="text-xs text-gray-600">{obtenerDescripcionPuntaje(categorizacion.tosSecreciones, 'tosSecreciones')}</p>
                  </div>

                  {/* Asistencia */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">Asistencia</h4>
                      <span className="text-2xl font-bold text-gray-900">{categorizacion.asistencia}</span>
                    </div>
                    <p className="text-xs text-gray-600">{obtenerDescripcionPuntaje(categorizacion.asistencia, 'asistencia')}</p>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {categorizacion.observaciones && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Observaciones
                  </h4>
                  <p className="text-sm text-gray-700">{categorizacion.observaciones}</p>
                </div>
              )}

              {/* Información del registro */}
              {categorizacion.usuario && (
                <div className="text-xs text-gray-500 text-center">
                  Registrado por: {categorizacion.usuario.nombres} {categorizacion.usuario.apellidos}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No se pudo cargar la categorización</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleCategorizacionKinesiologiaDia;

