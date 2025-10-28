import React, { useState, useEffect } from 'react';
import categorizacionKinesiologiaAPI, { CategorizacionKinesiologia } from '../services/categorizacionKinesiologiaAPI';

interface ModalDetalleCategorizacionKinesiologiaProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteRut: string | null;
  pacienteNombre: string;
}

const ModalDetalleCategorizacionKinesiologia: React.FC<ModalDetalleCategorizacionKinesiologiaProps> = ({
  isOpen,
  onClose,
  pacienteRut,
  pacienteNombre
}) => {
  const [categorizaciones, setCategorizaciones] = useState<CategorizacionKinesiologia[]>([]);
  const [loading, setLoading] = useState(false);
  const [categorizacionActual, setCategorizacionActual] = useState<CategorizacionKinesiologia | null>(null);

  useEffect(() => {
    if (isOpen && pacienteRut) {
      cargarCategorizaciones();
    }
  }, [isOpen, pacienteRut]);

  const cargarCategorizaciones = async () => {
    if (!pacienteRut) return;
    
    try {
      setLoading(true);
      const data = await categorizacionKinesiologiaAPI.obtenerPorPaciente(pacienteRut, { limit: 10 });
      setCategorizaciones(data.categorizaciones || []);
      setCategorizacionActual(data.categorizaciones?.[0] || null);
    } catch (error) {
      console.error('Error al cargar categorizaciones:', error);
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

  // Calcular dimensiones del gráfico responsivas
  const chartWidth = window.innerWidth < 768 ? 300 : 600;
  const chartHeight = window.innerWidth < 768 ? 150 : 200;
  const padding = { 
    top: window.innerWidth < 768 ? 15 : 20, 
    right: window.innerWidth < 768 ? 20 : 30, 
    bottom: window.innerWidth < 768 ? 30 : 40, 
    left: window.innerWidth < 768 ? 35 : 50 
  };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Preparar datos para el gráfico (invertir para que el más reciente esté a la derecha)
  const datosGrafico = [...categorizaciones].reverse();

  // Escala Y: 0-25 (puntaje total)
  const maxPuntaje = 25;
  const minPuntaje = 0;

  // Crear puntos para la línea
  const puntos = datosGrafico.map((cat, index) => {
    const x = padding.left + (index / Math.max(datosGrafico.length - 1, 1)) * innerWidth;
    const puntaje = cat.puntajeTotal || 0;
    const y = padding.top + innerHeight - ((puntaje - minPuntaje) / (maxPuntaje - minPuntaje)) * innerHeight;
    return { x, y, cat };
  });

  // Crear path para la línea
  const linePath = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-800 text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center rounded-t-lg md:rounded-t-2xl sticky top-0 z-10">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Categorización Kinesiológica</h2>
            <p className="text-xs md:text-sm text-gray-300">{pacienteNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-3 md:p-6 space-y-4 md:space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-gray-800" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : categorizacionActual ? (
            <>
              {/* Categorización Actual */}
              <div className="bg-gray-50 rounded-lg p-3 md:p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Última Categorización</h3>
                  <span className={`px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm font-bold ${obtenerColorComplejidad(categorizacionActual.complejidad || '')}`}>
                    {categorizacionActual.complejidad}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Fecha</p>
                    <p className="text-sm font-semibold text-gray-900">{formatearFecha(categorizacionActual.fechaCategorizacion)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Puntaje Total</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-800">{categorizacionActual.puntajeTotal}</p>
                  </div>
                </div>

                {/* Detalles de la categorización */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                  <div className="bg-white rounded-lg p-2 md:p-3">
                    <p className="text-xs text-gray-500 mb-1">Carga Asistencial</p>
                    <p className="text-sm font-semibold text-gray-900">{categorizacionActual.cargaAsistencial || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 md:p-3">
                    <p className="text-xs text-gray-500 mb-1">Patrón Respiratorio</p>
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-sm font-semibold text-gray-900">{categorizacionActual.patronRespiratorio}</span>
                      <span className="text-xs text-gray-500">pts</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 md:p-3">
                    <p className="text-xs text-gray-500 mb-1">Asist. Ventilatoria</p>
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-sm font-semibold text-gray-900">{categorizacionActual.asistenciaVentilatoria}</span>
                      <span className="text-xs text-gray-500">pts</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 md:p-3">
                    <p className="text-xs text-gray-500 mb-1">SAS/Glasgow</p>
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-sm font-semibold text-gray-900">{categorizacionActual.sasGlasgow}</span>
                      <span className="text-xs text-gray-500">pts</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 md:p-3">
                    <p className="text-xs text-gray-500 mb-1">Tos/Secreciones</p>
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-sm font-semibold text-gray-900">{categorizacionActual.tosSecreciones}</span>
                      <span className="text-xs text-gray-500">pts</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 md:p-3">
                    <p className="text-xs text-gray-500 mb-1">Asistencia</p>
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-sm font-semibold text-gray-900">{categorizacionActual.asistencia}</span>
                      <span className="text-xs text-gray-500">pts</span>
                    </div>
                  </div>
                </div>

                {categorizacionActual.observaciones && (
                  <div className="mt-3 md:mt-4 bg-white rounded-lg p-2 md:p-3">
                    <p className="text-xs text-gray-500 mb-1">Observaciones</p>
                    <p className="text-sm text-gray-700">{categorizacionActual.observaciones}</p>
                  </div>
                )}
              </div>

              {/* Gráfico de Evolución */}
              {datosGrafico.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Evolución del Puntaje</h3>
                  
                  <div className="flex justify-center overflow-x-auto">
                    <svg 
                      width={chartWidth} 
                      height={chartHeight} 
                      className="overflow-visible min-w-full" 
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      style={{ maxWidth: '100%', height: 'auto' }}
                    >
                      {/* Ejes */}
                      <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={chartHeight - padding.bottom}
                        stroke="#9CA3AF"
                        strokeWidth="2"
                      />
                      <line
                        x1={padding.left}
                        y1={chartHeight - padding.bottom}
                        x2={chartWidth - padding.right}
                        y2={chartHeight - padding.bottom}
                        stroke="#9CA3AF"
                        strokeWidth="2"
                      />

                      {/* Líneas de guía horizontales */}
                      {[0, 5, 10, 15, 20, 25].map((valor) => {
                        const y = padding.top + innerHeight - ((valor - minPuntaje) / (maxPuntaje - minPuntaje)) * innerHeight;
                        return (
                          <g key={valor}>
                            <line
                              x1={padding.left}
                              y1={y}
                              x2={chartWidth - padding.right}
                              y2={y}
                              stroke="#E5E7EB"
                              strokeWidth="1"
                              strokeDasharray="4"
                            />
                            <text
                              x={padding.left - 10}
                              y={y + 4}
                              textAnchor="end"
                              fontSize="12"
                              fill="#6B7280"
                            >
                              {valor}
                            </text>
                          </g>
                        );
                      })}

                      {/* Línea del gráfico */}
                      {puntos.length > 1 && (
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#374151"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Puntos */}
                      {puntos.map((punto, index) => (
                        <g key={index}>
                          <circle
                            cx={punto.x}
                            cy={punto.y}
                            r="5"
                            fill="#374151"
                            stroke="white"
                            strokeWidth="2"
                          />
                          {/* Etiquetas en el eje X */}
                          <text
                            x={punto.x}
                            y={chartHeight - padding.bottom + 20}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#6B7280"
                          >
                            {formatearFecha(punto.cat.fechaCategorizacion).substring(0, 5)}
                          </text>
                        </g>
                      ))}

                      {/* Etiquetas de los ejes */}
                      <text
                        x={padding.left - 35}
                        y={padding.top + innerHeight / 2}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#374151"
                        transform={`rotate(-90, ${padding.left - 35}, ${padding.top + innerHeight / 2})`}
                      >
                        Puntaje
                      </text>
                      <text
                        x={padding.left + innerWidth / 2}
                        y={chartHeight - 5}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#374151"
                      >
                        Fecha
                      </text>
                    </svg>
                  </div>
                </div>
              )}

              {/* Historial */}
              {categorizaciones.length > 1 && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Historial de Categorizaciones</h3>
                  <div className="space-y-2">
                    {categorizaciones.slice(1).map((cat) => (
                      <div key={cat.id} className="bg-gray-50 rounded-lg p-3 md:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Fecha</p>
                            <p className="text-sm font-semibold text-gray-900">{formatearFecha(cat.fechaCategorizacion)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Complejidad</p>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${obtenerColorComplejidad(cat.complejidad || '')}`}>
                              {cat.complejidad}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Puntaje</p>
                            <p className="text-sm font-bold text-gray-800">{cat.puntajeTotal}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 md:py-12">
              <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm md:text-base text-gray-500">No hay categorizaciones registradas para este paciente</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-3 md:p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg md:rounded-b-2xl sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 md:px-6 py-2 text-sm md:text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleCategorizacionKinesiologia;

