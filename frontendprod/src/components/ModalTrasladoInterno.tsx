import React, { useState } from 'react';
import { Paciente } from '../services/api';

interface ModalTrasladoInternoProps {
  paciente: Paciente;
  camasOcupadas: number[];
  onClose: () => void;
  onConfirm: (nuevaCama: number) => void;
  isLoading?: boolean;
}

const ModalTrasladoInterno: React.FC<ModalTrasladoInternoProps> = ({
  paciente,
  camasOcupadas,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [nuevaCama, setNuevaCama] = useState<string>('');

  // Generar lista de camas disponibles (1-27)
  const todasLasCamas = Array.from({ length: 27 }, (_, i) => i + 1);
  const camasDisponibles = todasLasCamas.filter(
    cama => !camasOcupadas.includes(cama) || cama === paciente.camaAsignada
  );

  const handleConfirm = () => {
    if (!nuevaCama) {
      alert('Por favor seleccione una cama');
      return;
    }
    
    const camaNum = parseInt(nuevaCama);
    if (camaNum === paciente.camaAsignada) {
      alert('La cama seleccionada es la misma que la actual');
      return;
    }

    onConfirm(camaNum);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Traslado Interno de Cama
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Información del paciente */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Información del Paciente</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Nombre:</span> {paciente.nombreCompleto}</p>
              <p><span className="font-medium">RUT:</span> {paciente.rut}</p>
              <p><span className="font-medium">Cama actual:</span> {paciente.camaAsignada || 'Sin cama asignada'}</p>
            </div>
          </div>

          {/* Nueva cama */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Cama
            </label>
            <select
              value={nuevaCama}
              onChange={(e) => setNuevaCama(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              disabled={isLoading}
            >
              <option value="">Seleccione una cama</option>
              {camasDisponibles.map((cama) => (
                <option key={cama} value={cama}>
                  Cama {cama} {cama === paciente.camaAsignada ? '(Actual)' : ''}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              {camasDisponibles.length} cama(s) disponible(s) de 27
            </p>
          </div>

          {/* Advertencia */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-blue-700">
                Este es un traslado interno. El paciente permanecerá activo en la UTI.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </div>
            ) : (
              'Confirmar Traslado'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalTrasladoInterno;

