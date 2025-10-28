import React, { useState, useEffect } from 'react';
import apache2Service, { Apache2Data } from '../services/apache2API';
import { pacienteService, Paciente } from '../services/api';

interface ModalDetalleApache2PacienteProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteRut: string | null;
  pacienteNombre: string;
}

const ModalDetalleApache2Paciente: React.FC<ModalDetalleApache2PacienteProps> = ({
  isOpen,
  onClose,
  pacienteRut,
  pacienteNombre
}) => {
  const [loading, setLoading] = useState(false);
  const [evaluacionActual, setEvaluacionActual] = useState<Apache2Data | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);

  useEffect(() => {
    if (isOpen && pacienteRut) {
      cargarEvaluacion();
      cargarPaciente();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pacienteRut]);

  const cargarEvaluacion = async () => {
    if (!pacienteRut) return;
    
    try {
      setLoading(true);
      const response = await apache2Service.obtenerPorPaciente(pacienteRut, { limit: 1 });
      const evaluacion = response.evaluaciones?.[0] || null;
      setEvaluacionActual(evaluacion);
    } catch (error) {
      console.error('Error al cargar evaluación Apache II:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarPaciente = async () => {
    if (!pacienteRut) return;
    
    try {
      const pacientes = await pacienteService.obtenerPacientes();
      const pacienteEncontrado = pacientes.find(p => p.rut === pacienteRut);
      setPaciente(pacienteEncontrado || null);
    } catch (error) {
      console.error('Error al cargar paciente:', error);
    }
  };

  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return '';
    const fechaSolo = fechaStr.split('T')[0];
    const [year, month, day] = fechaSolo.split('-');
    return `${day}/${month}/${year}`;
  };

  const obtenerColorRiesgo = (puntaje: number) => {
    if (puntaje <= 4) return 'text-green-600 bg-green-100';
    if (puntaje <= 9) return 'text-green-700 bg-green-200';
    if (puntaje <= 14) return 'text-yellow-600 bg-yellow-100';
    if (puntaje <= 19) return 'text-orange-600 bg-orange-100';
    if (puntaje <= 24) return 'text-orange-700 bg-orange-200';
    if (puntaje <= 34) return 'text-red-600 bg-red-100';
    return 'text-red-700 bg-red-200';
  };

  const obtenerNivelRiesgo = (puntaje: number) => {
    if (puntaje <= 4) return 'Bajo';
    if (puntaje <= 9) return 'Bajo-Moderado';
    if (puntaje <= 14) return 'Moderado';
    if (puntaje <= 19) return 'Alto';
    if (puntaje <= 24) return 'Muy Alto';
    if (puntaje <= 34) return 'Crítico';
    return 'Crítico';
  };

  // Función helper para verificar si un rango fue seleccionado
  const fueSeleccionado = (rangoKey: string): boolean => {
    if (!evaluacionActual?.rangosSeleccionados) return false;
    return Object.values(evaluacionActual.rangosSeleccionados).includes(rangoKey);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-xl max-w-7xl w-full max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-green-600 text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center rounded-t-lg md:rounded-t-2xl sticky top-0 z-10">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Evaluación Apache II - Detalle</h2>
            <p className="text-xs md:text-sm text-green-100">{pacienteNombre}</p>
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
        <div className="p-3 md:p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : evaluacionActual ? (
            <>
              {/* Resumen Superior */}
              <div className="bg-green-50 rounded-lg p-3 md:p-4 mb-4 md:mb-6 border-2 border-green-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Fecha de Evaluación</p>
                    <p className="text-sm font-semibold text-gray-900">{formatearFecha(evaluacionActual.fechaEvaluacion || '')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Puntaje Total</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-600">{evaluacionActual.puntajeTotal || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nivel de Riesgo</p>
                    <span className={`inline-block px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm font-bold ${obtenerColorRiesgo(evaluacionActual.puntajeTotal || 0)}`}>
                      {obtenerNivelRiesgo(evaluacionActual.puntajeTotal || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vista de tarjetas para móvil */}
              <div className="block md:hidden space-y-3">
                {/* Temperatura */}
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Temperatura (°C)</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.temperatura || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Seleccionado: {
                      fueSeleccionado('temp_≥41') && '≥41°C'
                      || fueSeleccionado('temp_39-40.9') && '39-40.9°C'
                      || fueSeleccionado('temp_38.5-38.9') && '38.5-38.9°C'
                      || fueSeleccionado('temp_36-38.4') && '36-38.4°C'
                      || fueSeleccionado('temp_34-35.9') && '34-35.9°C'
                      || fueSeleccionado('temp_32-33.9') && '32-33.9°C'
                      || fueSeleccionado('temp_≤31.9') && '≤31.9°C'
                      || 'No especificado'
                    }
                  </div>
                </div>

                {/* Presión Arterial Media */}
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Presión Arterial Media</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.presionArterial || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Seleccionado: {
                      fueSeleccionado('pa_≥160') && '≥160 mmHg'
                      || fueSeleccionado('pa_130-159') && '130-159 mmHg'
                      || fueSeleccionado('pa_110-129') && '110-129 mmHg'
                      || fueSeleccionado('pa_70-109') && '70-109 mmHg'
                      || fueSeleccionado('pa_50-69') && '50-69 mmHg'
                      || fueSeleccionado('pa_≤49') && '≤49 mmHg'
                      || 'No especificado'
                    }
                  </div>
                </div>

                {/* Frecuencia Cardíaca */}
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Frecuencia Cardíaca</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.frecuenciaCardiaca || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Seleccionado: {
                      fueSeleccionado('fc_≥180') && '≥180 bpm'
                      || fueSeleccionado('fc_140-179') && '140-179 bpm'
                      || fueSeleccionado('fc_110-139') && '110-139 bpm'
                      || fueSeleccionado('fc_70-109') && '70-109 bpm'
                      || fueSeleccionado('fc_55-69') && '55-69 bpm'
                      || fueSeleccionado('fc_≤54') && '≤54 bpm'
                      || 'No especificado'
                    }
                  </div>
                </div>

                {/* Frecuencia Respiratoria */}
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Frecuencia Respiratoria</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.frecuenciaRespiratoria || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Seleccionado: {
                      fueSeleccionado('fr_≥50') && '≥50 rpm'
                      || fueSeleccionado('fr_35-49') && '35-49 rpm'
                      || fueSeleccionado('fr_25-34') && '25-34 rpm'
                      || fueSeleccionado('fr_12-24') && '12-24 rpm'
                      || fueSeleccionado('fr_10-11') && '10-11 rpm'
                      || fueSeleccionado('fr_≤9') && '≤9 rpm'
                      || 'No especificado'
                    }
                  </div>
                </div>

                {/* Oxigenación */}
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Oxigenación</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.oxigenacion || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Seleccionado: {
                      fueSeleccionado('ox_aado2_high') && 'AaDO₂ >499'
                      || fueSeleccionado('ox_aado2_med') && 'AaDO₂ 350-499'
                      || fueSeleccionado('ox_aado2_low') && 'AaDO₂ 200-349'
                      || fueSeleccionado('ox_normal') && 'AaDO₂ <200 / paO₂ >70'
                      || fueSeleccionado('ox_pao2_61_70') && 'paO₂ 61-70'
                      || fueSeleccionado('ox_pao2_56_60') && 'paO₂ 56-60'
                      || fueSeleccionado('ox_pao2_low') && 'paO₂ <56'
                      || 'No especificado'
                    }
                  </div>
                </div>

                {/* pH Arterial */}
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">pH Arterial</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.phArterial || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Seleccionado: {
                      fueSeleccionado('ph_≥7.7') && '≥7.7'
                      || fueSeleccionado('ph_7.6-7.69') && '7.6-7.69'
                      || fueSeleccionado('ph_7.5-7.59') && '7.5-7.59'
                      || fueSeleccionado('ph_7.33-7.49') && '7.33-7.49'
                      || fueSeleccionado('ph_7.25-7.32') && '7.25-7.32'
                      || fueSeleccionado('ph_7.15-7.24') && '7.15-7.24'
                      || fueSeleccionado('ph_<7.15') && '<7.15'
                      || 'No especificado'
                    }
                  </div>
                </div>

                {/* Sodio */}
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Sodio Sérico</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.sodio || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Seleccionado: {
                      fueSeleccionado('sodio_≥180') && '≥180 mEq/L'
                      || fueSeleccionado('sodio_160-179') && '160-179 mEq/L'
                      || fueSeleccionado('sodio_155-159') && '155-159 mEq/L'
                      || fueSeleccionado('sodio_150-154') && '150-154 mEq/L'
                      || fueSeleccionado('sodio_130-149') && '130-149 mEq/L'
                      || fueSeleccionado('sodio_≤129') && '≤129 mEq/L'
                      || 'No especificado'
                    }
                  </div>
                </div>

                {/* Potasio */}
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Potasio Sérico</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.potasio || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Seleccionado: {
                      fueSeleccionado('potasio_≥7') && '≥7 mEq/L'
                      || fueSeleccionado('potasio_6-6.9') && '6-6.9 mEq/L'
                      || fueSeleccionado('potasio_5.5-5.9') && '5.5-5.9 mEq/L'
                      || fueSeleccionado('potasio_3.5-5.4') && '3.5-5.4 mEq/L'
                      || fueSeleccionado('potasio_3-3.4') && '3-3.4 mEq/L'
                      || fueSeleccionado('potasio_≤2.9') && '≤2.9 mEq/L'
                      || 'No especificado'
                    }
                  </div>
                </div>

                {/* Creatinina */}
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Creatinina Sérica</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.creatinina || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Seleccionado: {
                      fueSeleccionado('creatinina_≥3.5') && '≥3.5 mg/dL'
                      || fueSeleccionado('creatinina_2-3.4') && '2-3.4 mg/dL'
                      || fueSeleccionado('creatinina_1.5-1.9') && '1.5-1.9 mg/dL'
                      || fueSeleccionado('creatinina_0.6-1.4') && '0.6-1.4 mg/dL'
                      || fueSeleccionado('creatinina_≤0.6') && '≤0.6 mg/dL'
                      || 'No especificado'
                    }
                  </div>
                </div>

                {/* Hematocrito */}
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Hematocrito</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.hematocrito || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Seleccionado: {
                      fueSeleccionado('hto_≥60') && '≥60%'
                      || fueSeleccionado('hto_50-59.9') && '50-59.9%'
                      || fueSeleccionado('hto_46-49.9') && '46-49.9%'
                      || fueSeleccionado('hto_30-45.9') && '30-45.9%'
                      || fueSeleccionado('hto_≤29.9') && '≤29.9%'
                      || 'No especificado'
                    }
                  </div>
                </div>

                {/* Leucocitos */}
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Leucocitos</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.leucocitos || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Seleccionado: {
                      fueSeleccionado('leuco_≥40') && '≥40 x10³/μL'
                      || fueSeleccionado('leuco_20-39.9') && '20-39.9 x10³/μL'
                      || fueSeleccionado('leuco_15-19.9') && '15-19.9 x10³/μL'
                      || fueSeleccionado('leuco_3-14.9') && '3-14.9 x10³/μL'
                      || fueSeleccionado('leuco_≤2.9') && '≤2.9 x10³/μL'
                      || 'No especificado'
                    }
                  </div>
                </div>

                {/* Glasgow */}
                <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Glasgow Coma Scale</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.glasgow || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Seleccionado: {
                      fueSeleccionado('glasgow_15') && 'Valor: 15 (0 pts)'
                      || fueSeleccionado('glasgow_13-14') && 'Valor: 13-14 (1 pt)'
                      || fueSeleccionado('glasgow_10-12') && 'Valor: 10-12 (2 pts)'
                      || fueSeleccionado('glasgow_≤9') && 'Valor: ≤9 (3 pts)'
                      || 'No especificado'
                    }
                  </div>
                </div>

                {/* Edad */}
                <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Edad</h4>
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">{evaluacionActual.edad || 0}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {paciente?.edad || 'N/A'} años
                  </div>
                </div>
              </div>

              {/* Tabla de Apache II para desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-green-600 text-white">
                      <th className="border border-gray-300 px-2 py-2 text-left text-sm font-medium">Parámetro Fisiológico</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+4</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+3</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+2</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+1</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs bg-green-700">0</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+1</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+2</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+3</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+4</th>
                      <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Temperatura */}
                    <tr>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">Temperatura (°C)</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-0.5 md:p-1 block rounded ${fueSeleccionado('temp_≥41') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≥41</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-0.5 md:p-1 block rounded ${fueSeleccionado('temp_39-40.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>39-40.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-0.5 md:p-1 block rounded ${fueSeleccionado('temp_38.5-38.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>38.5-38.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <span className={`text-xs p-0.5 md:p-1 block rounded ${fueSeleccionado('temp_36-38.4') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>36-38.4</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-0.5 md:p-1 block rounded ${fueSeleccionado('temp_34-35.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>34-35.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-0.5 md:p-1 block rounded ${fueSeleccionado('temp_32-33.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>32-33.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-0.5 md:p-1 block rounded ${fueSeleccionado('temp_≤31.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≤31.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-semibold text-green-600 text-xs md:text-sm">{evaluacionActual.temperatura || 0}</td>
                    </tr>

                    {/* Presión Arterial Media */}
                    <tr>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">Presión Arterial Media</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('pa_≥160') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≥160</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('pa_130-159') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>130-159</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('pa_110-129') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>110-129</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('pa_70-109') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>70-109</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('pa_50-69') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>50-69</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('pa_≤49') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≤49</span>
                      </td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-semibold text-green-600 text-xs md:text-sm">{evaluacionActual.presionArterial || 0}</td>
                    </tr>

                    {/* Frecuencia Cardíaca */}
                    <tr>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">Frecuencia Cardíaca</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('fc_≥180') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≥180</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('fc_140-179') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>140-179</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('fc_110-139') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>110-139</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('fc_70-109') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>70-109</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('fc_55-69') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>55-69</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('fc_≤54') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≤54</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-semibold text-green-600 text-xs md:text-sm">{evaluacionActual.frecuenciaCardiaca || 0}</td>
                    </tr>

                    {/* Frecuencia Respiratoria */}
                    <tr>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">Frecuencia Respiratoria</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('fr_≥50') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≥50</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('fr_35-49') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>35-49</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('fr_25-34') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>25-34</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('fr_12-24') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>12-24</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('fr_10-11') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>10-11</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('fr_≤9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≤9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-semibold text-green-600 text-xs md:text-sm">{evaluacionActual.frecuenciaRespiratoria || 0}</td>
                    </tr>

                    {/* Oxigenación */}
                    <tr>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">
                        <div>Oxigenación:</div>
                        <div className="text-xs text-gray-500 mt-1">Si FiO₂ ≥ 0.5 (AaDO₂)</div>
                        <div className="text-xs text-gray-500">Si FiO₂ &lt; 0.5 (paO₂)</div>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <div className={`text-xs p-1 rounded ${fueSeleccionado('ox_aado2_high') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>
                          <div>&gt;499</div>
                          <div>-</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <div className={`text-xs p-1 rounded ${fueSeleccionado('ox_aado2_med') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>
                          <div>350-499</div>
                          <div>-</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <div className={`text-xs p-1 rounded ${fueSeleccionado('ox_aado2_low') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>
                          <div>200-349</div>
                          <div>-</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <div className={`text-xs p-1 rounded ${fueSeleccionado('ox_normal') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>
                          <div>&lt;200</div>
                          <div>&gt;70</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <div className={`text-xs p-1 rounded ${fueSeleccionado('ox_pao2_61_70') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>
                          <div>-</div>
                          <div>61-70</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <div className={`text-xs p-1 rounded ${fueSeleccionado('ox_pao2_56_60') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>
                          <div>-</div>
                          <div>56-60</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <div className={`text-xs p-1 rounded ${fueSeleccionado('ox_pao2_low') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>
                          <div>-</div>
                          <div>&lt;56</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-semibold text-green-600 text-xs md:text-sm">{evaluacionActual.oxigenacion || 0}</td>
                    </tr>

                    {/* pH Arterial */}
                    <tr>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">pH Arterial</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('ph_≥7.7') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≥7.7</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('ph_7.6-7.69') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>7.6-7.69</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('ph_7.5-7.59') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>7.5-7.59</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('ph_7.33-7.49') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>7.33-7.49</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('ph_7.25-7.32') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>7.25-7.32</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('ph_7.15-7.24') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>7.15-7.24</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('ph_<7.15') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>&lt;7.15</span>
                      </td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-semibold text-green-600 text-xs md:text-sm">{evaluacionActual.phArterial || 0}</td>
                    </tr>

                    {/* Sodio */}
                    <tr>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">Sodio Sérico</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('sodio_≥180') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≥180</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('sodio_160-179') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>160-179</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('sodio_155-159') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>155-159</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('sodio_150-154') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>150-154</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('sodio_130-149') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>130-149</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('sodio_≤129') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≤129</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-semibold text-green-600 text-xs md:text-sm">{evaluacionActual.sodio || 0}</td>
                    </tr>

                    {/* Potasio */}
                    <tr>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">Potasio Sérico</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('potasio_≥7') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≥7</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('potasio_6-6.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>6-6.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('potasio_5.5-5.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>5.5-5.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('potasio_3.5-5.4') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>3.5-5.4</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('potasio_3-3.4') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>3-3.4</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('potasio_≤2.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≤2.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-semibold text-green-600 text-xs md:text-sm">{evaluacionActual.potasio || 0}</td>
                    </tr>

                    {/* Creatinina */}
                    <tr>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">Creatinina Sérica</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('creatinina_≥3.5') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≥3.5</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('creatinina_2-3.4') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>2-3.4</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('creatinina_1.5-1.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>1.5-1.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('creatinina_0.6-1.4') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>0.6-1.4</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('creatinina_≤0.6') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≤0.6</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-semibold text-green-600 text-xs md:text-sm">{evaluacionActual.creatinina || 0}</td>
                    </tr>

                    {/* Hematocrito */}
                    <tr>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">Hematocrito</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('hto_≥60') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≥60</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('hto_50-59.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>50-59.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('hto_46-49.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>46-49.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('hto_30-45.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>30-45.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('hto_≤29.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≤29.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-semibold text-green-600 text-xs md:text-sm">{evaluacionActual.hematocrito || 0}</td>
                    </tr>

                    {/* Leucocitos */}
                    <tr>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">Leucocitos</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('leuco_≥40') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≥40</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('leuco_20-39.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>20-39.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('leuco_15-19.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>15-19.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('leuco_3-14.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>3-14.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <span className={`text-xs p-1 block rounded ${fueSeleccionado('leuco_≤2.9') ? 'bg-green-600 text-white font-bold' : 'text-gray-700'}`}>≤2.9</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center text-gray-400">-</td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-semibold text-green-600 text-xs md:text-sm">{evaluacionActual.leucocitos || 0}</td>
                    </tr>

                    {/* Glasgow */}
                    <tr className="bg-green-50">
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">Glasgow Coma Scale</td>
                      <td className="border border-gray-300 px-1 py-1 text-center" colSpan={9}>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 py-1 md:py-2">
                          <span className="text-xs md:text-sm font-semibold text-gray-900">
                            {fueSeleccionado('glasgow_15') && 'Valor: 15'}
                            {fueSeleccionado('glasgow_13-14') && 'Valor: 13-14'}
                            {fueSeleccionado('glasgow_10-12') && 'Valor: 10-12'}
                            {fueSeleccionado('glasgow_≤9') && 'Valor: ≤9'}
                            {!evaluacionActual.rangosSeleccionados && 'Rango no especificado'}
                          </span>
                          <span className="text-xs text-gray-500">
                            (15=0pts, 13-14=1pt, 10-12=2pts, ≤9=3pts)
                          </span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">
                        <span className="font-bold text-green-600 text-xs md:text-sm">{evaluacionActual.glasgow || 0}</span>
                      </td>
                    </tr>

                    {/* Edad */}
                    <tr className="bg-green-50">
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-xs md:text-sm font-medium">Edad</td>
                      <td className="border border-gray-300 px-1 py-1 text-center" colSpan={9}>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 py-1 md:py-2">
                          <span className="text-xs md:text-sm font-semibold text-gray-900">
                            {paciente?.edad || 'N/A'} años
                          </span>
                          <span className="text-xs text-gray-500">
                            (≤44=0pts, 45-54=2pts, 55-64=3pts, 65-74=5pts, ≥75=6pts)
                          </span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">
                        <span className="font-bold text-green-600 text-xs md:text-sm">{evaluacionActual.edad || 0}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sección de Enfermedad Crónica */}
              <div className="mt-4 md:mt-6 bg-green-50 p-3 md:p-4 rounded-lg border border-green-200">
                <h4 className="text-sm md:text-base font-medium text-gray-900 mb-3">Evaluación de Salud Crónica</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                  <div className={`p-2 md:p-3 text-left border rounded-lg ${
                    fueSeleccionado('enf_sin')
                      ? 'bg-green-600 text-white border-green-600 font-bold' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="text-sm md:text-base font-medium">Sin enfermedad crónica</div>
                    <div className="text-xs md:text-sm opacity-80">0 puntos</div>
                  </div>
                  <div className={`p-2 md:p-3 text-left border rounded-lg ${
                    fueSeleccionado('enf_electiva')
                      ? 'bg-green-600 text-white border-green-600 font-bold' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="text-sm md:text-base font-medium">Cirugía electiva</div>
                    <div className="text-xs md:text-sm opacity-80">2 puntos</div>
                    <div className="text-xs opacity-70 mt-1">Con enfermedad crónica</div>
                  </div>
                  <div className={`p-2 md:p-3 text-left border rounded-lg ${
                    fueSeleccionado('enf_urgente')
                      ? 'bg-green-600 text-white border-green-600 font-bold' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="text-sm md:text-base font-medium">Médico o cirugía urgente</div>
                    <div className="text-xs md:text-sm opacity-80">5 puntos</div>
                    <div className="text-xs opacity-70 mt-1">Con enfermedad crónica</div>
                  </div>
                </div>
                <div className={`mt-2 md:mt-3 px-2 md:px-3 py-2 rounded ${fueSeleccionado('enf_sin') ? 'bg-green-400 text-white' : 'bg-white'}`}>
                  <p className="text-xs md:text-sm font-medium">Puntos por Enfermedad Crónica: {evaluacionActual.enfermedadCronica || 0}</p>
                </div>
              </div>

              {/* Observaciones */}
              {evaluacionActual.observaciones && (
                <div className="mt-3 md:mt-4 bg-white rounded-lg p-3 md:p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Observaciones</p>
                  <p className="text-sm text-gray-700">{evaluacionActual.observaciones}</p>
                </div>
              )}

              {/* Puntaje Total Final */}
              <div className="mt-4 md:mt-6 bg-green-600 text-white rounded-lg p-3 md:p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
                  <span className="text-base md:text-lg font-bold">PUNTAJE TOTAL APACHE II:</span>
                  <span className="text-2xl md:text-3xl font-bold">{evaluacionActual.puntajeTotal || 0}</span>
                </div>
                <div className="mt-2 flex flex-col md:flex-row items-center justify-between text-green-100 gap-1 md:gap-0">
                  <span className="text-xs md:text-sm">Nivel de Riesgo:</span>
                  <span className="text-base md:text-lg font-semibold">{obtenerNivelRiesgo(evaluacionActual.puntajeTotal || 0)}</span>
                </div>
                {evaluacionActual.riesgoMortalidad && (
                  <div className="mt-2 flex flex-col md:flex-row items-center justify-between text-green-100 gap-1 md:gap-0">
                    <span className="text-xs md:text-sm">Riesgo de Mortalidad:</span>
                    <span className="text-base md:text-lg font-semibold">{evaluacionActual.riesgoMortalidad}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 md:py-12">
              <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm md:text-base text-gray-500">No hay evaluaciones Apache II registradas para este paciente</p>
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

export default ModalDetalleApache2Paciente;
