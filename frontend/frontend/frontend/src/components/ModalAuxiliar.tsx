import React, { useState, useEffect } from 'react';
import auxiliaresAPI, { ProcedimientoAuxiliarData } from '../services/auxiliaresAPI';

interface ModalAuxiliarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ProcedimientoItem {
  id: string;
  nombre: string;
  tiempo: string; // Formato HH:MM
  observaciones?: string;
}

const ModalAuxiliar: React.FC<ModalAuxiliarProps> = ({ isOpen, onClose, onSuccess }) => {
  const [turno, setTurno] = useState<'Día' | 'Noche'>('Día');
  const [fecha, setFecha] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [procedimientos, setProcedimientos] = useState<ProcedimientoItem[]>([]);
  const [nuevoProcedimiento, setNuevoProcedimiento] = useState({
    nombre: '',
    tiempo: '00:00',
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | ''; texto: string }>({ tipo: '', texto: '' });


  // Procedimientos auxiliares específicos (obtenidos de la API)
  const procedimientosAuxiliares = auxiliaresAPI.getProcedimientosValidos();

  // Limpiar formulario al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setTurno('Día');
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setFecha(`${year}-${month}-${day}`);
      setProcedimientos([]);
      setNuevoProcedimiento({ nombre: '', tiempo: '00:00', observaciones: '' });
      setMensaje({ tipo: '', texto: '' });
    }
  }, [isOpen]);

  // Agregar procedimiento al listado temporal
  const handleAgregarProcedimiento = () => {
    if (!nuevoProcedimiento.nombre) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona un procedimiento' });
      return;
    }
    if (!nuevoProcedimiento.tiempo) {
      setMensaje({ tipo: 'error', texto: 'Por favor ingresa el tiempo del procedimiento' });
      return;
    }

    const nuevoProcId = Date.now().toString();
    
    const procAgregado: ProcedimientoItem = {
      id: nuevoProcId,
      nombre: nuevoProcedimiento.nombre,
      tiempo: nuevoProcedimiento.tiempo,
      observaciones: nuevoProcedimiento.observaciones || undefined
    };

    setProcedimientos([...procedimientos, procAgregado]);
    setNuevoProcedimiento({ nombre: '', tiempo: '', observaciones: '' });
    setMensaje({ tipo: 'success', texto: 'Procedimiento agregado al listado' });

    // Limpiar mensaje después de 2 segundos
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 2000);
  };

  // Eliminar procedimiento del listado
  const handleEliminarProcedimiento = (id: string) => {
    setProcedimientos(procedimientos.filter(p => p.id !== id));
  };

  // Guardar todos los procedimientos
  const handleGuardar = async () => {
    if (procedimientos.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Debes agregar al menos un procedimiento' });
      return;
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // Convertir a formato esperado por la API de auxiliares
      const procedimientosData: ProcedimientoAuxiliarData[] = procedimientos.map(proc => ({
        nombre: proc.nombre,
        tiempo: proc.tiempo,
        observaciones: proc.observaciones
      }));

      const registroData = {
        turno,
        fecha,
        procedimientos: procedimientosData
      };

      await auxiliaresAPI.crear(registroData);

      setMensaje({ tipo: 'success', texto: 'Procedimientos auxiliares registrados exitosamente' });
      
      // Limpiar formulario
      setProcedimientos([]);
      setNuevoProcedimiento({ nombre: '', tiempo: '00:00', observaciones: '' });
      
      if (onSuccess) {
        onSuccess();
      }

      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Error al guardar:', error);
      setMensaje({ tipo: 'error', texto: error.message || 'Error al registrar procedimientos auxiliares' });
    } finally {
      setLoading(false);
    }
  };

  // Calcular tiempo total
  const calcularTiempoTotal = () => {
    return procedimientos.reduce((total, proc) => {
      const [horas, minutos] = proc.tiempo.split(':').map(Number);
      return total + (horas * 60) + minutos;
    }, 0);
  };

  const formatearTiempoTotal = (minutos: number) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] md:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-700 text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <h2 className="text-lg md:text-2xl font-bold">
            Registro de Procedimientos Auxiliares
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            disabled={loading}
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 md:p-6 pb-16 md:pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {/* Mensaje de feedback */}
          {mensaje.texto && (
            <div className={`mb-3 md:mb-4 p-3 md:p-4 rounded-lg ${
              mensaje.tipo === 'success' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
            }`}>
              {mensaje.texto}
            </div>
          )}

          {/* Información general */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* Turno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turno
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="Día"
                    checked={turno === 'Día'}
                    onChange={(e) => setTurno(e.target.value as 'Día' | 'Noche')}
                    className="w-4 h-4 text-gray-700"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm md:text-base text-gray-700">Día</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="Noche"
                    checked={turno === 'Noche'}
                    onChange={(e) => setTurno(e.target.value as 'Día' | 'Noche')}
                    className="w-4 h-4 text-gray-700"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm md:text-base text-gray-700">Noche</span>
                </label>
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 md:px-4 py-2 bg-gray-50 text-gray-900 text-sm md:text-base rounded-lg focus:ring-2 focus:ring-gray-700 focus:bg-white transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* Formulario para agregar procedimiento */}
          <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Agregar Procedimiento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
              {/* Seleccionar procedimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Procedimiento
                </label>
                <select
                  value={nuevoProcedimiento.nombre}
                  onChange={(e) => setNuevoProcedimiento({ 
                    ...nuevoProcedimiento, 
                    nombre: e.target.value
                  })}
                  className="w-full px-3 md:px-4 py-2 bg-white text-gray-900 text-sm md:text-base rounded-lg focus:ring-2 focus:ring-gray-700 transition-all"
                  disabled={loading}
                >
                  <option value="">Seleccionar procedimiento...</option>
                  {procedimientosAuxiliares.map((proc, index) => (
                    <option key={index} value={proc}>{proc}</option>
                  ))}
                </select>
              </div>

              {/* Tiempo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo (HH:MM)
                </label>
                <input
                  type="time"
                  value={nuevoProcedimiento.tiempo}
                  onChange={(e) => setNuevoProcedimiento({ ...nuevoProcedimiento, tiempo: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 bg-white text-gray-900 text-sm md:text-base rounded-lg focus:ring-2 focus:ring-gray-700 transition-all"
                  placeholder="Tiempo"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Observaciones */}
            <div className="mb-3 md:mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                value={nuevoProcedimiento.observaciones}
                onChange={(e) => setNuevoProcedimiento({ ...nuevoProcedimiento, observaciones: e.target.value })}
                className="w-full px-3 md:px-4 py-2 bg-white text-gray-900 text-sm md:text-base rounded-lg focus:ring-2 focus:ring-gray-700 transition-all resize-none"
                rows={2}
                placeholder="Observaciones adicionales..."
                disabled={loading}
              />
            </div>

            {/* Botón agregar */}
            <button
              onClick={handleAgregarProcedimiento}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white px-3 md:px-4 py-2 text-sm md:text-base rounded-lg transition-colors"
              disabled={loading}
            >
              Agregar al Listado
            </button>
          </div>

          {/* Listado de procedimientos agregados */}
          {procedimientos.length > 0 && (
            <div className="mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
                Procedimientos Agregados ({procedimientos.length})
              </h3>
              <div className="space-y-2">
                {procedimientos.map((proc) => (
                  <div key={proc.id} className="bg-white rounded-lg p-3 md:p-4 shadow-sm flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-sm md:text-base">{proc.nombre}</div>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">
                        Tiempo: {proc.tiempo}
                        {proc.observaciones && (
                          <div className="text-xs text-gray-500 mt-1">
                            Observaciones: {proc.observaciones}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEliminarProcedimiento(proc.id)}
                      className="text-red-600 hover:text-red-800 ml-2 md:ml-4"
                      disabled={loading}
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {procedimientos.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No hay procedimientos agregados aún
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row justify-end gap-2 md:gap-4 rounded-b-lg md:rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-4 md:px-6 py-2.5 md:py-2 bg-gray-200 text-gray-700 text-sm md:text-base font-medium rounded-lg hover:bg-gray-300 transition-colors order-2 md:order-1"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="w-full md:w-auto px-4 md:px-6 py-2.5 md:py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm md:text-base font-medium rounded-lg transition-colors disabled:bg-gray-400 order-1 md:order-2"
            disabled={loading || procedimientos.length === 0}
          >
            {loading ? 'Guardando...' : 'Guardar Registro'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAuxiliar;
