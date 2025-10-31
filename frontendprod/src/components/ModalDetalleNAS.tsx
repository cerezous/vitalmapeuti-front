import React, { useState, useEffect } from 'react';
import { nasService } from '../services/nasAPI';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

interface ModalDetalleNASProps {
  nasId: number;
  onClose: () => void;
}

// Función para formatear fecha sin problemas de zona horaria
const formatearFechaSinZonaHoraria = (fechaStr: string): string => {
  if (fechaStr && fechaStr.includes('-')) {
    const fecha = fechaStr.split('T')[0]; // Quitar parte de hora si existe
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }
  return fechaStr;
};

const ModalDetalleNAS: React.FC<ModalDetalleNASProps> = ({ nasId, onClose }) => {
  const [nas, setNas] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cargarDetalleNAS();
  }, [nasId]);

  const cargarDetalleNAS = async () => {
    try {
      setIsLoading(true);
      const response = await nasService.obtenerNAS(nasId);
      setNas(response);
    } catch (error) {
      console.error('Error al cargar detalle de NAS:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular datos para el gráfico de radar agrupando por categorías
  const calcularDatosRadar = (nas: any) => {
    const categorias = [
      {
        categoria: 'Monitorización',
        puntuacion: (
          (nas.item_1a ? 4.5 : 0) +
          (nas.item_1b ? 12.1 : 0) +
          (nas.item_1c ? 19.6 : 0)
        ),
      },
      {
        categoria: 'Investigación/Medicación',
        puntuacion: (
          (nas.item_2 ? 4.3 : 0) +
          (nas.item_3 ? 5.6 : 0)
        ),
      },
      {
        categoria: 'Higiene',
        puntuacion: (
          (nas.item_4a ? 4.1 : 0) +
          (nas.item_4b ? 16.5 : 0) +
          (nas.item_4c ? 20.0 : 0) +
          (nas.item_5 ? 1.8 : 0)
        ),
      },
      {
        categoria: 'Movilización',
        puntuacion: (
          (nas.item_6a ? 5.5 : 0) +
          (nas.item_6b ? 12.4 : 0) +
          (nas.item_6c ? 17.0 : 0)
        ),
      },
      {
        categoria: 'Apoyo Familiar',
        puntuacion: (
          (nas.item_7a ? 4.0 : 0) +
          (nas.item_7b ? 32.0 : 0)
        ),
      },
      {
        categoria: 'Administrativo',
        puntuacion: (
          (nas.item_8a ? 4.2 : 0) +
          (nas.item_8b ? 23.2 : 0) +
          (nas.item_8c ? 30.0 : 0)
        ),
      },
      {
        categoria: 'Soporte Respiratorio',
        puntuacion: (
          (nas.item_9 ? 1.4 : 0) +
          (nas.item_10 ? 1.8 : 0) +
          (nas.item_11 ? 4.4 : 0)
        ),
      },
      {
        categoria: 'Soporte Hemodinámico',
        puntuacion: (
          (nas.item_12 ? 1.2 : 0) +
          (nas.item_13 ? 2.5 : 0) +
          (nas.item_14 ? 1.7 : 0) +
          (nas.item_16 ? 7.7 : 0)
        ),
      },
      {
        categoria: 'Intervenciones Específicas',
        puntuacion: (
          (nas.item_15 ? 7.1 : 0) +
          (nas.item_17 ? 7.0 : 0) +
          (nas.item_18 ? 1.6 : 0) +
          (nas.item_19 ? 1.3 : 0) +
          (nas.item_20 ? 2.8 : 0) +
          (nas.item_21 ? 1.3 : 0) +
          (nas.item_22 ? 2.8 : 0) +
          (nas.item_23 ? 1.9 : 0)
        ),
      },
    ];

    return categorias;
  };

  if (!nas && !isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Detalle NAS</h3>
            {nas && (
              <p className="text-sm text-gray-600 mt-1">
                Puntuación: {nas.puntuacionTotal}%
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : nas ? (
            <div className="space-y-4">
              {/* Header con puntuación */}
              <div className="bg-blue-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Puntuación Total NAS</span>
                  <span className="text-3xl font-bold text-white">{nas.puntuacionTotal}%</span>
                </div>
                <div className="text-xs text-blue-100 space-y-1">
                  <p><strong>Fecha:</strong> {formatearFechaSinZonaHoraria(nas.fechaRegistro)}</p>
                  <p><strong>Registrado:</strong> {new Date(nas.createdAt).toLocaleString('es-ES')}</p>
                </div>
              </div>

              {/* Gráfico de radar - Distribución de carga laboral */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Distribución de Carga Laboral por Categoría</h4>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={calcularDatosRadar(nas)}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis 
                      dataKey="categoria" 
                      tick={{ fill: '#374151', fontSize: 11 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 40]}
                      tick={{ fill: '#6b7280', fontSize: 10 }}
                    />
                    <Radar
                      name="Puntuación"
                      dataKey="puntuacion"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e3a8a', 
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: any) => [`${value.toFixed(1)}%`, 'Puntuación']}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Grupos de items NAS */}
              <div className="space-y-4">
                {/* Grupo 1 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">1. Actividades Básicas de Monitorización</h4>
                  <div className="space-y-2">
                    <ItemNAS checked={nas.item_1a} label="1a. Monitorización horaria, balance hídrico (4.5%)" />
                    <ItemNAS checked={nas.item_1b} label="1b. Presencia continua ≥2 h (12.1%)" />
                    <ItemNAS checked={nas.item_1c} label="1c. Presencia continua ≥4 h (19.6%)" />
                  </div>
                </div>

                {/* Items individuales 2-3 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">2-3. Investigación y Medicación</h4>
                  <div className="space-y-2">
                    <ItemNAS checked={nas.item_2} label="2. Analíticas (bioquímica, micro, etc.) (4.3%)" />
                    <ItemNAS checked={nas.item_3} label="3. Medicación, excluye vasoactivos (5.6%)" />
                  </div>
                </div>

                {/* Grupo 4 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">4. Procedimientos de Higiene</h4>
                  <div className="space-y-2">
                    <ItemNAS checked={nas.item_4a} label='4a. Higiene/procedimientos "normales" (4.1%)' />
                    <ItemNAS checked={nas.item_4b} label="4b. Higiene/procedimientos &gt;2 h en un turno (16.5%)" />
                    <ItemNAS checked={nas.item_4c} label="4c. Higiene/procedimientos &gt;4 h en un turno (20.0%)" />
                  </div>
                </div>

                {/* Item 5 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">5. Cuidados de Drenajes</h4>
                  <div className="space-y-2">
                    <ItemNAS checked={nas.item_5} label="5. Cuidados de drenajes, excepto SNG (1.8%)" />
                  </div>
                </div>

                {/* Grupo 6 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">6. Movilización y Posicionamiento</h4>
                  <div className="space-y-2">
                    <ItemNAS checked={nas.item_6a} label="6a. Movilización/posicionamiento hasta 3 veces/24 h (5.5%)" />
                    <ItemNAS checked={nas.item_6b} label="6b. Movilización &gt;3 veces/24 h o con 2 enfermeras (12.4%)" />
                    <ItemNAS checked={nas.item_6c} label="6c. Movilización con ≥3 enfermeras (17.0%)" />
                  </div>
                </div>

                {/* Grupo 7 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">7. Apoyo y Soporte Familiar</h4>
                  <div className="space-y-2">
                    <ItemNAS checked={nas.item_7a} label="7a. Apoyo a familia/paciente ~1 h (4.0%)" />
                    <ItemNAS checked={nas.item_7b} label="7b. Apoyo a familia/paciente ≥3 h (32.0%)" />
                  </div>
                </div>

                {/* Grupo 8 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">8. Tareas Administrativas</h4>
                  <div className="space-y-2">
                    <ItemNAS checked={nas.item_8a} label="8a. Tareas administrativas rutinarias (&lt;2 h) (4.2%)" />
                    <ItemNAS checked={nas.item_8b} label="8b. Tareas administrativas ~2 h (23.2%)" />
                    <ItemNAS checked={nas.item_8c} label="8c. Tareas administrativas ~4 h (30.0%)" />
                  </div>
                </div>

                {/* Grupo 9 - Actividades específicas */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">9-23. Actividades Específicas de UCI</h4>
                  <div className="space-y-2">
                    <ItemNAS checked={nas.item_9} label="9. Soporte respiratorio (1.4%)" />
                    <ItemNAS checked={nas.item_10} label="10. Cuidados de vía aérea artificial (1.8%)" />
                    <ItemNAS checked={nas.item_11} label="11. Tratamiento función pulmonar (4.4%)" />
                    <ItemNAS checked={nas.item_12} label="12. Fármacos vasoactivos (1.2%)" />
                    <ItemNAS checked={nas.item_13} label="13. Reposición IV de grandes pérdidas (2.5%)" />
                    <ItemNAS checked={nas.item_14} label="14. Monitorización aurícula izq./Swan-Ganz (1.7%)" />
                    <ItemNAS checked={nas.item_15} label="15. RCP tras parada (7.1%)" />
                    <ItemNAS checked={nas.item_16} label="16. Hemofiltración/diálisis (7.7%)" />
                    <ItemNAS checked={nas.item_17} label="17. Diuresis cuantitativa (7.0%)" />
                    <ItemNAS checked={nas.item_18} label="18. Monitorización presión intracraneal (1.6%)" />
                    <ItemNAS checked={nas.item_19} label="19. Tratamiento acidosis/alcalosis (1.3%)" />
                    <ItemNAS checked={nas.item_20} label="20. Nutrición parenteral (2.8%)" />
                    <ItemNAS checked={nas.item_21} label="21. Nutrición enteral (1.3%)" />
                    <ItemNAS checked={nas.item_22} label="22. Intervención específica en UCI (2.8%)" />
                    <ItemNAS checked={nas.item_23} label="23. Intervención fuera de UCI (1.9%)" />
                  </div>
                </div>

                {/* Observaciones */}
                {nas.observaciones && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Observaciones</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{nas.observaciones}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No se encontró el registro</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para mostrar items del NAS en modo solo lectura
const ItemNAS: React.FC<{ checked: boolean; label: string }> = ({ checked, label }) => {
  return (
    <div className={`flex items-center gap-2 p-2 rounded ${checked ? 'bg-blue-100' : 'bg-white'}`}>
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
        checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-xs ${checked ? 'text-gray-900 font-medium' : 'text-gray-600'}`} dangerouslySetInnerHTML={{ __html: label }} />
    </div>
  );
};

export default ModalDetalleNAS;

