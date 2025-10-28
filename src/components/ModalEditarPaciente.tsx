import React, { useState, useEffect } from 'react';
import { Paciente } from '../services/api';

interface ModalEditarPacienteProps {
  paciente: Paciente;
  camasOcupadas: number[];
  onClose: () => void;
  onConfirm: (pacienteData: {
    nombreCompleto: string;
    rut: string;
    numeroFicha: string;
    edad: string;
    fechaIngresoUTI: string;
    camaAsignada: string;
  }) => void;
  isLoading?: boolean;
}

const ModalEditarPaciente: React.FC<ModalEditarPacienteProps> = ({
  paciente,
  camasOcupadas,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    nombreCompleto: paciente.nombreCompleto,
    rut: paciente.rut,
    numeroFicha: paciente.numeroFicha,
    edad: paciente.edad.toString(),
    fechaIngresoUTI: paciente.fechaIngresoUTI.split('T')[0],
    camaAsignada: paciente.camaAsignada?.toString() || ''
  });

  const [error, setError] = useState<string | null>(null);

  // Función para formatear RUT chileno
  const formatRut = (rut: string) => {
    const cleanRut = rut.replace(/[.-]/g, '');
    const validRut = cleanRut.replace(/[^0-9kK]/g, '');
    
    if (validRut.length <= 1) return validRut;
    
    const body = validRut.slice(0, -1);
    const dv = validRut.slice(-1).toUpperCase();
    
    let formattedBody = '';
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) {
        formattedBody = '.' + formattedBody;
      }
      formattedBody = body[i] + formattedBody;
    }
    
    return formattedBody + '-' + dv;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'nombreCompleto') {
      value = value.toUpperCase();
    } else if (field === 'rut') {
      value = formatRut(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirm = () => {
    // Validar campos requeridos
    if (!formData.nombreCompleto || !formData.rut || !formData.numeroFicha || 
        !formData.edad || !formData.fechaIngresoUTI) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setError(null);
    onConfirm(formData);
  };

  // Generar lista de camas disponibles
  const todasLasCamas = Array.from({ length: 27 }, (_, i) => i + 1);
  const camasDisponibles = todasLasCamas.filter(
    cama => !camasOcupadas.includes(cama) || cama === paciente.camaAsignada
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {/* Header del modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Editar Paciente</h3>
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

        {/* Contenido del modal */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <form className="space-y-4">
            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={formData.nombreCompleto}
                onChange={(e) => handleInputChange('nombreCompleto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase text-gray-900"
                placeholder="INGRESE EL NOMBRE COMPLETO"
                disabled={isLoading}
              />
            </div>

            {/* RUT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT
              </label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) => handleInputChange('rut', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="12.345.678-9"
                maxLength={12}
                disabled={isLoading}
              />
            </div>

            {/* Número de Ficha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                N° Ficha
              </label>
              <input
                type="text"
                value={formData.numeroFicha}
                onChange={(e) => handleInputChange('numeroFicha', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="12345"
                disabled={isLoading}
              />
            </div>

            {/* Edad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Edad
              </label>
              <input
                type="number"
                value={formData.edad}
                onChange={(e) => handleInputChange('edad', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Edad en años"
                min="0"
                max="150"
                disabled={isLoading}
              />
            </div>

            {/* Fecha de Ingreso a UTI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Ingreso a UTI
              </label>
              <input
                type="date"
                value={formData.fechaIngresoUTI}
                onChange={(e) => handleInputChange('fechaIngresoUTI', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={isLoading}
              />
            </div>

            {/* Cama Asignada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cama Asignada
              </label>
              <select
                value={formData.camaAsignada}
                onChange={(e) => handleInputChange('camaAsignada', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={isLoading}
              >
                <option value="">Sin cama asignada</option>
                {camasDisponibles.map((cama) => (
                  <option key={cama} value={cama}>
                    Cama {cama} {cama === paciente.camaAsignada ? '(Actual)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Footer del modal */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
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
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </div>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarPaciente;

