import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pacienteService, Paciente } from '../services/api';
import nasAPI, { CreateNASRequest, NASRegistro } from '../services/nasAPI';

interface ModalEnfermeriaProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteRut?: string; // Opcional: para preseleccionar un paciente
  pacienteNombre?: string; // Opcional: solo informativo
}

// Función para formatear fecha sin problemas de zona horaria
const formatearFechaSinZonaHoraria = (fechaStr: string): string => {
  if (fechaStr && fechaStr.includes('-')) {
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  }
  return fechaStr;
};

const ModalEnfermeria: React.FC<ModalEnfermeriaProps> = ({ isOpen, onClose, pacienteRut, pacienteNombre }) => {
  const [activeTab, setActiveTab] = useState<'categorizacion' | 'procedimientos'>('categorizacion');
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [isLoadingPacientes, setIsLoadingPacientes] = useState(false);
  
  // Estado para las selecciones NAS
  const [nasSelections, setNasSelections] = useState<{[key: string]: boolean}>({});
  const [fecha, setFecha] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fechaFormateada = `${year}-${month}-${day}`;
    return fechaFormateada;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registrosAnteriores, setRegistrosAnteriores] = useState<NASRegistro[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);
  
  // Grupos mutuamente excluyentes
  const exclusiveGroups = {
    grupo1: ['1a', '1b', '1c'],
    grupo4: ['4a', '4b', '4c'],
    grupo6: ['6a', '6b', '6c'],
    grupo7: ['7a', '7b'],
    grupo8: ['8a', '8b', '8c']
  };
  
  // Cargar pacientes cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarPacientes();
    }
  }, [isOpen]);

  // Cargar registros anteriores del paciente
  useEffect(() => {
    if (isOpen && pacienteSeleccionado) {
      cargarRegistrosAnteriores();
    }
  }, [isOpen, pacienteSeleccionado]);

  const cargarPacientes = async () => {
    try {
      setIsLoadingPacientes(true);
      const pacientesData = await pacienteService.obtenerPacientes();
      // Filtrar solo pacientes con cama asignada y ordenar por número de cama
      const pacientesConCama = pacientesData
        .filter(p => p.camaAsignada)
        .sort((a, b) => (a.camaAsignada || 0) - (b.camaAsignada || 0));
      setPacientes(pacientesConCama);
      
      // Si se pasó un pacienteRut, preseleccionar ese paciente
      if (pacienteRut) {
        const pacientePreseleccionado = pacientesConCama.find(p => p.rut === pacienteRut);
        if (pacientePreseleccionado) {
          setPacienteSeleccionado(pacientePreseleccionado);
        }
      }
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    } finally {
      setIsLoadingPacientes(false);
    }
  };

  const handlePacienteClick = (paciente: Paciente) => {
    if (pacienteSeleccionado?.rut === paciente.rut) {
      setPacienteSeleccionado(null);
      setNasSelections({});
    } else {
      setPacienteSeleccionado(paciente);
      setNasSelections({});
    }
  };

  const cargarRegistrosAnteriores = async () => {
    if (!pacienteSeleccionado) return;
    
    try {
      setLoadingRegistros(true);
      const registros = await nasAPI.obtenerRegistrosPorPaciente(pacienteSeleccionado.rut, {
        limit: 5,
        orderBy: 'fechaRegistro',
        orderDir: 'DESC'
      });
      setRegistrosAnteriores(registros);
    } catch (error: any) {
      console.error('Error al cargar registros anteriores:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
    } finally {
      setLoadingRegistros(false);
    }
  };

  // Función para manejar cambios en las selecciones
  const handleNasSelection = (itemId: string) => {
    setError(null); // Limpiar errores al hacer cambios
    
    // Encontrar si este item pertenece a un grupo exclusivo
    const group = Object.entries(exclusiveGroups).find(([_, items]) => items.includes(itemId));
    
    if (group) {
      // Si pertenece a un grupo exclusivo, deseleccionar otros del mismo grupo
      const [groupName, groupItems] = group;
      const newSelections = { ...nasSelections };
      
      // Deseleccionar todos los items del grupo
      groupItems.forEach(item => {
        newSelections[item] = false;
      });
      
      // Seleccionar solo el item clickeado
      newSelections[itemId] = !nasSelections[itemId];
      
      setNasSelections(newSelections);
    } else {
      // Si no pertenece a un grupo exclusivo, toggle normal
      setNasSelections(prev => ({
        ...prev,
        [itemId]: !prev[itemId]
      }));
    }
  };

  // Función para mostrar modal de confirmación
  const handleSubmitClick = () => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    // Validar selecciones
    const erroresValidacion = nasAPI.validarSelecciones(nasSelections);
    if (erroresValidacion.length > 0) {
      setError(erroresValidacion.join('. '));
      return;
    }

    // Verificar que al menos un ítem esté seleccionado
    const itemsSeleccionados = Object.values(nasSelections).filter(Boolean).length;
    if (itemsSeleccionados === 0) {
      setError('Debe seleccionar al menos un ítem del NAS');
      return;
    }

    // Si pasa todas las validaciones, mostrar modal de confirmación
    setShowConfirmModal(true);
  };

  // Función para enviar el formulario después de confirmar
  const handleConfirmSubmit = async () => {
    if (!user) {
      setError('Usuario no autenticado');
      setShowConfirmModal(false);
      return;
    }

    if (!pacienteSeleccionado) {
      setError('Debe seleccionar un paciente');
      setShowConfirmModal(false);
      return;
    }

    setShowConfirmModal(false);
    
    try {
      setIsSubmitting(true);
      setError(null);

      const seleccionesBackend = nasAPI.convertirSeleccionesParaBackend(nasSelections);
      
      const requestData: CreateNASRequest = {
        pacienteRut: pacienteSeleccionado.rut,
        usuarioId: user.id,
        selecciones: seleccionesBackend
      };

      await nasAPI.crearRegistro(requestData);
      
      setSuccess('Registro NAS guardado exitosamente');
      
      // Limpiar formulario
      setNasSelections({});
      
      // Recargar registros anteriores
      await cargarRegistrosAnteriores();
      
      // Cerrar modal después de un momento
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Error al guardar registro NAS:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      let errorMessage = 'Error al guardar el registro NAS';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor. Por favor, contacta al administrador.';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para cargar un registro anterior
  const cargarRegistroAnterior = (registro: NASRegistro) => {
    const seleccionesFrontend = nasAPI.convertirSeleccionesParaFrontend(registro);
    setNasSelections(seleccionesFrontend);
    // Cargar la fecha del registro usando fecha local
    const fechaRegistro = new Date(registro.fechaRegistro);
    const year = fechaRegistro.getFullYear();
    const month = String(fechaRegistro.getMonth() + 1).padStart(2, '0');
    const day = String(fechaRegistro.getDate()).padStart(2, '0');
    setFecha(`${year}-${month}-${day}`);
    setError(null);
    setSuccess(null);
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setNasSelections({});
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setFecha(`${year}-${month}-${day}`);
    setError(null);
    setSuccess(null);
  };
  
  // Calcular puntuación total NAS
  const calculateTotalNAS = () => {
    const nasScores: {[key: string]: number} = {
      '1a': 4.5, '1b': 12.1, '1c': 19.6, '2': 4.3, '3': 5.6,
      '4a': 4.1, '4b': 16.5, '4c': 20.0, '5': 1.8,
      '6a': 5.5, '6b': 12.4, '6c': 17.0, '7a': 4.0, '7b': 32.0,
      '8a': 4.2, '8b': 23.2, '8c': 30.0, '9': 1.4, '10': 1.8,
      '11': 4.4, '12': 1.2, '13': 2.5, '14': 1.7, '15': 7.1,
      '16': 7.7, '17': 7.0, '18': 1.6, '19': 1.3, '20': 2.8,
      '21': 1.3, '22': 2.8, '23': 1.9
    };
    
    return Object.entries(nasSelections)
      .filter(([_, selected]) => selected)
      .reduce((total, [itemId, _]) => total + (nasScores[itemId] || 0), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center" style={{zIndex: 9999, width: '100vw', height: '100vh'}}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Registro enfermería</h2>
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

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex px-6">
            <button
              onClick={() => setActiveTab('categorizacion')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'categorizacion'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              NAS
            </button>
            <button
              onClick={() => setActiveTab('procedimientos')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'procedimientos'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Procedimientos
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'categorizacion' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Nursing Activities Score (NAS)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Ítem
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        % NAS
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Aplicar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Grupo 1: Actividades básicas de monitorización - seleccionar una opción */}
                    <tr className="bg-blue-50 border-l-4 border-blue-200">
                      <td colSpan={4} className="px-4 py-2 text-xs text-blue-700">
                        <span className="font-medium">Grupo 1:</span> Actividades básicas de monitorización (seleccionar una opción)
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">1a</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Monitorización horaria, balance hídrico</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">4.5</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['1a'] || false}
                          onChange={() => handleNasSelection('1a')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">1b</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Presencia continua ≥2 h (p. ej., VNI, destete, agitación…)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">12.1</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['1b'] || false}
                          onChange={() => handleNasSelection('1b')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">1c</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Presencia continua ≥4 h</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">19.6</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['1c'] || false}
                          onChange={() => handleNasSelection('1c')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">2</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Analíticas (bioquímica, micro, etc.)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">4.3</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['2'] || false}
                          onChange={() => handleNasSelection('2')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">3</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Medicación (excluye vasoactivos)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">5.6</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['3'] || false}
                          onChange={() => handleNasSelection('3')}
                        />
                      </td>
                    </tr>
                    {/* Grupo 4: Procedimientos de higiene - seleccionar una opción */}
                    <tr className="bg-purple-50 border-l-4 border-purple-200">
                      <td colSpan={4} className="px-4 py-2 text-xs text-purple-700">
                        <span className="font-medium">Grupo 4:</span> Procedimientos de higiene (seleccionar una opción)
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">4a</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Higiene/procedimientos "normales"</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">4.1</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['4a'] || false}
                          onChange={() => handleNasSelection('4a')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">4b</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Higiene/procedimientos &gt;2 h en un turno</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">16.5</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['4b'] || false}
                          onChange={() => handleNasSelection('4b')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">4c</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Higiene/procedimientos &gt;4 h en un turno</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">20.0</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['4c'] || false}
                          onChange={() => handleNasSelection('4c')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">5</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Cuidados de drenajes (excepto SNG)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">1.8</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['5'] || false}
                          onChange={() => handleNasSelection('5')}
                        />
                      </td>
                    </tr>
                    {/* Grupo 6: Movilización y posicionamiento - seleccionar una opción */}
                    <tr className="bg-green-50 border-l-4 border-green-200">
                      <td colSpan={4} className="px-4 py-2 text-xs text-green-700">
                        <span className="font-medium">Grupo 6:</span> Movilización y posicionamiento (seleccionar una opción)
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">6a</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Movilización/posicionamiento hasta 3 veces/24 h</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">5.5</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['6a'] || false}
                          onChange={() => handleNasSelection('6a')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">6b</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Movilización &gt;3 veces/24 h o con 2 enfermeras</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">12.4</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['6b'] || false}
                          onChange={() => handleNasSelection('6b')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">6c</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Movilización con ≥3 enfermeras</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">17.0</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['6c'] || false}
                          onChange={() => handleNasSelection('6c')}
                        />
                      </td>
                    </tr>
                    {/* Grupo 7: Apoyo y soporte familiar - seleccionar una opción */}
                    <tr className="bg-orange-50 border-l-4 border-orange-200">
                      <td colSpan={4} className="px-4 py-2 text-xs text-orange-700">
                        <span className="font-medium">Grupo 7:</span> Apoyo y soporte familiar (seleccionar una opción)
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">7a</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Apoyo a familia/paciente ~1 h</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">4.0</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['7a'] || false}
                          onChange={() => handleNasSelection('7a')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">7b</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Apoyo a familia/paciente ≥3 h (duelo, circunstancias complejas)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">32.0</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['7b'] || false}
                          onChange={() => handleNasSelection('7b')}
                        />
                      </td>
                    </tr>
                    {/* Grupo 8: Tareas administrativas - seleccionar una opción */}
                    <tr className="bg-red-50 border-l-4 border-red-200">
                      <td colSpan={4} className="px-4 py-2 text-xs text-red-700">
                        <span className="font-medium">Grupo 8:</span> Tareas administrativas (seleccionar una opción)
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">8a</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Tareas administrativas rutinarias (&lt;2 h)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">4.2</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['8a'] || false}
                          onChange={() => handleNasSelection('8a')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">8b</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Tareas administrativas ~2 h</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">23.2</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['8b'] || false}
                          onChange={() => handleNasSelection('8b')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">8c</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Tareas administrativas ~4 h (donación, coordinación…)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">30.0</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['8c'] || false}
                          onChange={() => handleNasSelection('8c')}
                        />
                      </td>
                    </tr>
                    {/* Grupo 9: Actividades específicas de la unidad */}
                    <tr className="bg-indigo-50 border-l-4 border-indigo-200">
                      <td colSpan={4} className="px-4 py-2 text-xs text-indigo-700">
                        <span className="font-medium">Grupo 9:</span> Actividades específicas de la unidad
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">9</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Soporte respiratorio (VM, VMI, CPAP/PEEP, O₂, etc.)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">1.4</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['9'] || false}
                          onChange={() => handleNasSelection('9')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">10</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Cuidados de vía aérea artificial (TET/traqueo)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">1.8</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['10'] || false}
                          onChange={() => handleNasSelection('10')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">11</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Tratamiento para mejorar función pulmonar (FTR torácica, aspiración…)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">4.4</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['11'] || false}
                          onChange={() => handleNasSelection('11')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">12</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Fármacos vasoactivos (cualquier tipo/dosis)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">1.2</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['12'] || false}
                          onChange={() => handleNasSelection('12')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">13</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Reposición IV de grandes pérdidas (&gt;3 L/m²/día)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">2.5</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['13'] || false}
                          onChange={() => handleNasSelection('13')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">14</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Monitorización de aurícula izquierda / Swan-Ganz</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">1.7</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['14'] || false}
                          onChange={() => handleNasSelection('14')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">15</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">RCP tras parada (en últimas 24 h)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">7.1</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['15'] || false}
                          onChange={() => handleNasSelection('15')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">16</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Hemofiltración/diálisis</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">7.7</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['16'] || false}
                          onChange={() => handleNasSelection('16')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">17</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Diuresis cuantitativa (sondaje vesical, etc.)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">7.0</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['17'] || false}
                          onChange={() => handleNasSelection('17')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">18</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Monitorización de presión intracraneal</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">1.6</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['18'] || false}
                          onChange={() => handleNasSelection('18')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">19</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Tratamiento de acidosis/alcalosis metabólica complicada</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">1.3</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['19'] || false}
                          onChange={() => handleNasSelection('19')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">20</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Hiperalimentación IV (nutrición parenteral)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">2.8</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['20'] || false}
                          onChange={() => handleNasSelection('20')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">21</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Nutrición enteral (SNG u otra vía GI)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">1.3</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['21'] || false}
                          onChange={() => handleNasSelection('21')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">22</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-b">Intervención específica en UCI (intubación, marcapasos, cardioversión, endoscopias, cirugía urgente &lt;24 h, etc.)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 border-b">2.8</td>
                      <td className="px-4 py-3 text-center border-b">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['22'] || false}
                          onChange={() => handleNasSelection('22')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">23</td>
                      <td className="px-4 py-3 text-sm text-gray-700">Intervención específica fuera de UCI (cirugía/proced. diagnósticos)</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">1.9</td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500" 
                          checked={nasSelections['23'] || false}
                          onChange={() => handleNasSelection('23')}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Total NAS Score */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Puntuación Total NAS:</span>
                  <span className="text-2xl font-bold text-green-600">{calculateTotalNAS().toFixed(1)}%</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  El NAS representa el porcentaje de tiempo que una enfermera dedica a un paciente en 24 horas.
                </p>
              </div>

              {/* Formulario de Registro */}
              <div className="mt-6 space-y-4">
                {/* Selección de Paciente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Paciente</label>
                  {isLoadingPacientes ? (
                    <p className="text-sm text-gray-500">Cargando pacientes...</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {pacientes.map((paciente) => (
                        <button
                          key={paciente.rut}
                          onClick={() => handlePacienteClick(paciente)}
                          className={`p-3 rounded-lg text-left transition-all ${
                            pacienteSeleccionado?.rut === paciente.rut
                              ? 'bg-green-100 border-2 border-green-600'
                              : 'bg-gray-50 border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900">{paciente.nombreCompleto}</div>
                          <div className="text-xs text-gray-600">Cama: {paciente.camaAsignada}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Información del Paciente Seleccionado */}
                {pacienteSeleccionado && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Paciente: {pacienteSeleccionado.nombreCompleto}</h4>
                    <p className="text-sm text-blue-700">RUT: {pacienteSeleccionado.rut}</p>
                    <p className="text-sm text-blue-700">Cama: {pacienteSeleccionado.camaAsignada}</p>
                  </div>
                )}

                {/* Fecha */}
                <div>
                  <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    id="fecha"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Mensajes de Error y Éxito */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600">{success}</p>
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitClick}
                    disabled={isSubmitting}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar Evaluación NAS'}
                  </button>
                </div>
              </div>

              {/* Registros Anteriores */}
              {registrosAnteriores.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Registros Anteriores</h4>
                  <div className="space-y-2">
                    {registrosAnteriores.map((registro) => (
                      <div key={registro.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                              {formatearFechaSinZonaHoraria(registro.fechaRegistro.split('T')[0])}
                            </span>
                            <span className="text-sm font-medium text-green-600">
                              NAS: {registro.puntuacionTotal.toFixed(1)}%
                            </span>
                            {registro.observaciones && (
                              <span className="text-xs text-gray-500 truncate max-w-xs">
                                {registro.observaciones}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => cargarRegistroAnterior(registro)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Cargar
                        </button>
                      </div>
                    ))}
                  </div>
                  {loadingRegistros && (
                    <p className="text-sm text-gray-500 text-center py-2">Cargando registros...</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'procedimientos' && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Procedimientos de Enfermería</h3>
              <p className="text-gray-500">
                Cuidados y procedimientos de enfermería realizados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{zIndex: 10000}}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirmar Registro NAS</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-4">
                ¿Estás seguro de que deseas guardar este registro NAS?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Paciente:</span>
                  <span>{pacienteSeleccionado?.nombreCompleto}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Fecha:</span>
                  <span>{formatearFechaSinZonaHoraria(fecha)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Puntuación NAS:</span>
                  <span className="text-green-600 font-semibold">{calculateTotalNAS().toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalEnfermeria;