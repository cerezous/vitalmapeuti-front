import React, { useState } from 'react';
import { Paciente } from '../services/api';

interface ModalEgresoPacienteProps {
  paciente: Paciente;
  onClose: () => void;
  onConfirm: (fechaEgreso: string, motivoEgreso: string) => void;
  isLoading?: boolean;
}

const ModalEgresoPaciente: React.FC<ModalEgresoPacienteProps> = ({
  paciente,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  // Obtener fecha actual en zona horaria local
  const obtenerFechaLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Obtener fecha mínima (fecha de ingreso)
  const obtenerFechaMinima = () => {
    const fechaIngreso = new Date(paciente.fechaIngresoUTI);
    return fechaIngreso.toISOString().split('T')[0];
  };

  const [fechaEgreso, setFechaEgreso] = useState(obtenerFechaLocal());
  const [motivoEgreso, setMotivoEgreso] = useState('');

  const motivosEgreso = [
    'Alta médica',
    'Traslado dentro de UPC',
    'Traslado a UCM o fuera de UPC',
    'Traslado a extrasistema',
    'Fallecimiento'
  ];

  const handleConfirm = () => {
    if (!motivoEgreso) {
      alert('Por favor seleccione un motivo de egreso');
      return;
    }
    
    // Validar que la fecha de egreso no sea anterior a la fecha de ingreso
    const fechaIngreso = new Date(paciente.fechaIngresoUTI);
    const fechaEgresoSeleccionada = new Date(fechaEgreso);
    
    if (fechaEgresoSeleccionada < fechaIngreso) {
      alert('La fecha de egreso no puede ser anterior a la fecha de ingreso del paciente');
      return;
    }
    
    onConfirm(fechaEgreso, motivoEgreso);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Egresar Paciente
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
              <p><span className="font-medium">N° Ficha:</span> {paciente.numeroFicha}</p>
              {paciente.camaAsignada && (
                <p><span className="font-medium">Cama:</span> {paciente.camaAsignada}</p>
              )}
            </div>
          </div>

          {/* Fecha de egreso */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Traslado
            </label>
            <input
              type="date"
              value={fechaEgreso}
              onChange={(e) => setFechaEgreso(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              min={obtenerFechaMinima()}
              max={obtenerFechaLocal()}
              disabled={isLoading}
            />
          </div>

          {/* Motivo de egreso */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de Traslado
            </label>
            <select
              value={motivoEgreso}
              onChange={(e) => setMotivoEgreso(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              disabled={isLoading}
            >
              <option value="">Seleccione un motivo</option>
              {motivosEgreso.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {motivo}
                </option>
              ))}
            </select>
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
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              'Confirmar Egreso'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEgresoPaciente;

