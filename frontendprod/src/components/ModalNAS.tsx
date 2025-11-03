import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pacienteService, Paciente } from '../services/api';
import nasAPI, { CreateNASRequest, NASRegistro } from '../services/nasAPI';

interface ModalNASProps {
  isOpen: boolean;
  onClose: () => void;
}

// Función para obtener la fecha actual del día (siempre la fecha actual, sin ajustes)
const obtenerFechaActual = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para validar y formatear fecha correctamente  
const formatearFechaParaBackend = (fechaInput: string) => {
  // La fecha viene del input type="date" en formato YYYY-MM-DD
  // La enviamos tal como está, sin conversiones de zona horaria
  return fechaInput;
};

const ModalNAS: React.FC<ModalNASProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pacientesEvaluados, setPacientesEvaluados] = useState<Set<string>>(new Set());
  
  // Estado para las selecciones NAS
  const [nasSelections, setNasSelections] = useState<{[key: string]: boolean}>({});
  const [fecha, setFecha] = useState<string>(obtenerFechaActual());

  // Función para formatear fecha de ingreso (de YYYY-MM-DD HH:MM:SS a YYYY-MM-DD)
  const formatearFechaIngreso = (fechaIngreso: string) => {
    if (!fechaIngreso) return null;
    // Extraer solo la parte de la fecha (YYYY-MM-DD) 
    return fechaIngreso.split(' ')[0];
  };

  // Función para validar la fecha seleccionada
  const validarFecha = (fechaSeleccionada: string, rutPaciente: string) => {
    const paciente = pacientes.find(p => p.rut === rutPaciente);
    if (!paciente) return { valida: false, mensaje: 'Paciente no encontrado' };

    const fechaActual = obtenerFechaActual(); // Siempre usar la fecha actual del día
    const fechaIngreso = formatearFechaIngreso(paciente.fechaIngresoUTI);

    // Comparar fechas como strings en formato YYYY-MM-DD para evitar problemas de zona horaria
    // Las fechas en formato YYYY-MM-DD se pueden comparar directamente como strings
    // Validar que no sea posterior a la fecha actual
    if (fechaSeleccionada > fechaActual) {
      return { 
        valida: false, 
        mensaje: 'No se puede seleccionar una fecha posterior a la actual' 
      };
    }

    // Validar que no sea anterior a la fecha de ingreso
    if (fechaIngreso && fechaSeleccionada < fechaIngreso) {
      // Formatear fecha de ingreso para mostrar al usuario
      const [year, month, day] = fechaIngreso.split('-');
      const fechaIngresoFormateada = `${day}/${month}/${year}`;
      return { 
        valida: false, 
        mensaje: `No se puede seleccionar una fecha anterior al ingreso del paciente (${fechaIngresoFormateada})` 
      };
    }

    return { valida: true, mensaje: '' };
  };

  // Función para manejar el cambio de fecha con validación
  const handleFechaChange = (nuevaFecha: string) => {
    if (pacienteSeleccionado) {
      const validacion = validarFecha(nuevaFecha, pacienteSeleccionado);
      if (!validacion.valida) {
        setMensaje({ tipo: 'error', texto: validacion.mensaje });
        return;
      }
    }
    
    setFecha(nuevaFecha);
    // Limpiar mensaje de error si la fecha es válida
    if (mensaje.tipo === 'error' && mensaje.texto.includes('fecha')) {
      setMensaje({ tipo: '', texto: '' });
    }
    
    // Verificar pacientes evaluados para la nueva fecha
    verificarPacientesEvaluados();
  };
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | ''; texto: string }>({ tipo: '', texto: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
      verificarPacientesEvaluados();
    }
  }, [isOpen, fecha]);

  const cargarPacientes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const pacientesData = await pacienteService.obtenerPacientes();
      // Filtrar solo pacientes con cama asignada y ordenar por número de cama
      const pacientesConCama = pacientesData
        .filter(p => p.camaAsignada)
        .sort((a, b) => (a.camaAsignada || 0) - (b.camaAsignada || 0));
      setPacientes(pacientesConCama);
    } catch (err) {
      console.error('Error al cargar pacientes:', err);
      setError('Error al cargar los pacientes');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para verificar qué pacientes ya fueron evaluados en la fecha seleccionada
  const verificarPacientesEvaluados = async () => {
    if (!fecha) return; // No verificar si no hay fecha seleccionada
    
    try {
      // Usar la fecha seleccionada directamente (sin ajuste de turno)
      // Buscar por la fecha específica usando la API
      const registros = await nasAPI.obtenerRegistros({
        fechaInicio: fecha,
        fechaFin: fecha
      });
      
      // Obtener todos los registros NAS para verificación manual adicional si la API no encuentra
      const todosLosRegistros = await nasAPI.obtenerRegistros({
        limit: 100
      });
      
      // Verificar manualmente si algún registro coincide con la fecha seleccionada
      const registrosCoincidentes = todosLosRegistros.registros.filter(r => {
        // Convertir la fecha del registro a fecha local (YYYY-MM-DD)
        const fechaRegistro = new Date(r.fechaRegistro);
        const year = fechaRegistro.getFullYear();
        const month = String(fechaRegistro.getMonth() + 1).padStart(2, '0');
        const day = String(fechaRegistro.getDate()).padStart(2, '0');
        const fechaRegistroFormateada = `${year}-${month}-${day}`;
        return fechaRegistroFormateada === fecha;
      });
      
      // Usar la verificación manual si la API no encuentra registros
      const evaluados = new Set<string>();
      if (registros.registros.length > 0) {
        // Si la API encuentra registros, usarlos
        registros.registros.forEach(registro => {
          evaluados.add(registro.pacienteRut);
        });
      } else if (registrosCoincidentes.length > 0) {
        // Si la API no encuentra pero la verificación manual sí, usar la verificación manual
        registrosCoincidentes.forEach(registro => {
          evaluados.add(registro.pacienteRut);
        });
      }
      
      setPacientesEvaluados(evaluados);
    } catch (err) {
      console.error('Error al verificar pacientes evaluados:', err);
      // En caso de error, continuar sin mostrar el estado evaluado
    }
  };

  const handlePacienteClick = (rutPaciente: string) => {
    if (pacienteSeleccionado === rutPaciente) {
      // Si ya está seleccionado, lo deseleccionamos
      setPacienteSeleccionado(null);
      resetearFormulario();
    } else {
      // Seleccionar nuevo paciente
      setPacienteSeleccionado(rutPaciente);
      resetearFormulario();
      
      // Validar la fecha actual cuando se selecciona un paciente
      const fechaActual = obtenerFechaActual();
      const validacion = validarFecha(fechaActual, rutPaciente);
      if (!validacion.valida) {
        // Si la fecha actual no es válida, establecer la fecha de ingreso
        const paciente = pacientes.find(p => p.rut === rutPaciente);
        if (paciente) {
          const fechaIngreso = formatearFechaIngreso(paciente.fechaIngresoUTI);
          if (fechaIngreso) {
            setFecha(fechaIngreso);
          }
        }
      } else {
        // Si la fecha actual es válida, usarla
        setFecha(fechaActual);
      }
    }
  };

  const resetearFormulario = () => {
    setNasSelections({});
    setFecha(obtenerFechaActual());
    setMensaje({ tipo: '', texto: '' });
  };

  // Función para manejar cambios en las selecciones
  const handleNasSelection = (itemId: string) => {
    setMensaje({ tipo: '', texto: '' });
    
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

  // Función para mostrar modal de confirmación
  const handleSubmitClick = () => {
    if (!user) {
      setMensaje({ tipo: 'error', texto: 'Usuario no autenticado' });
      return;
    }

    if (!pacienteSeleccionado) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar un paciente' });
      return;
    }

    // Verificar si el paciente ya fue evaluado en la fecha seleccionada
    if (pacientesEvaluados.has(pacienteSeleccionado)) {
      setMensaje({ 
        tipo: 'error', 
        texto: `Este paciente ya fue evaluado en la fecha seleccionada. Solo se puede realizar una evaluación por día.` 
      });
      return;
    }

    // Validar selecciones
    const erroresValidacion = nasAPI.validarSelecciones(nasSelections);
    if (erroresValidacion.length > 0) {
      setMensaje({ tipo: 'error', texto: erroresValidacion.join('. ') });
      return;
    }

    // Verificar que al menos un ítem esté seleccionado
    const itemsSeleccionados = Object.values(nasSelections).filter(Boolean).length;
    if (itemsSeleccionados === 0) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar al menos un ítem del NAS' });
      return;
    }

    // Si pasa todas las validaciones, mostrar modal de confirmación
    setShowConfirmModal(true);
  };

  // Función para enviar el formulario después de confirmar
  const handleConfirmSubmit = async () => {
    if (!user || !pacienteSeleccionado) {
      setMensaje({ tipo: 'error', texto: 'Usuario no autenticado o paciente no seleccionado' });
      setShowConfirmModal(false);
      return;
    }

    setShowConfirmModal(false);
    
    try {
      setLoading(true);
      setMensaje({ tipo: '', texto: '' });

      const seleccionesBackend = nasAPI.convertirSeleccionesParaBackend(nasSelections);
      
      const requestData: CreateNASRequest = {
        pacienteRut: pacienteSeleccionado,
        usuarioId: user.id,
        fechaRegistro: formatearFechaParaBackend(fecha),
        selecciones: seleccionesBackend
      };

      await nasAPI.crearRegistro(requestData);
      
      setMensaje({ tipo: 'success', texto: 'Registro NAS guardado exitosamente' });
      
      // Actualizar lista de pacientes evaluados
      setPacientesEvaluados(prev => new Set(Array.from(prev).concat(pacienteSeleccionado)));
      
      // Limpiar formulario pero mantener el modal abierto
      resetearFormulario();
      setPacienteSeleccionado(null);

    } catch (error: any) {
      console.error('Error al guardar registro NAS:', error);
      
      let errorMessage = 'Error al guardar el registro NAS';
      if (error.response?.status === 409) {
        // Error de conflicto - registro duplicado
        errorMessage = error.response?.data?.message || 'Ya existe un registro NAS para este paciente en esta fecha';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setMensaje({ tipo: 'error', texto: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const pacienteActual = pacientes.find(p => p.rut === pacienteSeleccionado);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
        <div className="bg-white rounded-lg md:rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] md:max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-blue-900 text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
            <h2 className="text-lg md:text-2xl font-bold">Evaluación NAS</h2>
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

          {/* Content */}
          <div className="p-3 md:p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
            {isLoading ? (
              <div className="text-center py-8 md:py-12">
                <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-900 mx-auto"></div>
                <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-600">Cargando pacientes...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 md:p-4 text-sm md:text-base">
                {error}
              </div>
            ) : pacientes.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm md:text-base text-gray-600">No hay pacientes con camas asignadas</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {pacientes.map((paciente) => (
                  <div key={paciente.rut} className="border rounded-lg overflow-hidden">
                    {/* Header del paciente - clickeable */}
                    <div
                      onClick={() => handlePacienteClick(paciente.rut)}
                      className={`p-3 md:p-4 cursor-pointer transition-all relative ${
                        pacienteSeleccionado === paciente.rut
                          ? 'bg-blue-50 border-l-4 border-blue-900'
                          : pacientesEvaluados.has(paciente.rut)
                          ? 'bg-blue-100 border-l-4 border-blue-600 hover:bg-blue-200'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 md:space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                              pacienteSeleccionado === paciente.rut 
                                ? 'bg-blue-900' 
                                : pacientesEvaluados.has(paciente.rut)
                                ? 'bg-blue-600'
                                : 'bg-gray-200'
                            }`}>
                              <span className={`text-xs md:text-sm font-bold ${
                                pacienteSeleccionado === paciente.rut || pacientesEvaluados.has(paciente.rut)
                                  ? 'text-white' 
                                  : 'text-gray-600'
                              }`}>
                                {paciente.camaAsignada}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">{paciente.nombreCompleto}</h3>
                            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-xs md:text-sm text-gray-600 mt-1">
                              <span>RUT: {paciente.rut}</span>
                              <span className="hidden md:inline">•</span>
                              <span>Ficha: {paciente.numeroFicha}</span>
                              <span className="hidden md:inline">•</span>
                              <span>Cama: {paciente.camaAsignada}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <svg
                            className={`w-5 h-5 md:w-6 md:h-6 text-gray-400 transition-transform ${
                              pacienteSeleccionado === paciente.rut ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Cápsula Evaluado en esquina inferior derecha */}
                      {pacientesEvaluados.has(paciente.rut) && (
                        <div className="absolute bottom-2 right-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white whitespace-nowrap">
                            ✓ Evaluado/a
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Formulario NAS - solo visible si está seleccionado */}
                    {pacienteSeleccionado === paciente.rut && (
                      <div className="p-3 md:p-6 bg-gray-50 border-t">
                        <h4 className="text-base md:text-lg font-bold text-center text-gray-800 mb-3 md:mb-4">
                          EVALUACIÓN NAS - Nursing Activities Score
                        </h4>

                        {/* Mensajes */}
                        {mensaje.texto && (
                          <div className={`mb-3 md:mb-4 p-3 md:p-4 rounded-lg text-sm md:text-base ${
                            mensaje.tipo === 'success' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {mensaje.texto}
                          </div>
                        )}

                        {/* Mensaje de paciente ya evaluado */}
                        {pacientesEvaluados.has(paciente.rut) && (
                          <div className="mb-3 md:mb-4 p-3 md:p-4 rounded-lg text-sm md:text-base bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <span>
                                <strong>Paciente ya evaluado:</strong> Este paciente ya fue evaluado en la fecha seleccionada. 
                                Solo se puede realizar una evaluación por día.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Fecha */}
                        <div className="mb-3 md:mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                          <input
                            type="date"
                            value={fecha}
                            onChange={(e) => handleFechaChange(e.target.value)}
                            min={pacienteSeleccionado ? formatearFechaIngreso(pacientes.find(p => p.rut === pacienteSeleccionado)?.fechaIngresoUTI || '') || '' : ''}
                            max={obtenerFechaActual()}
                            className="w-full px-3 py-2 bg-white text-gray-900 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                            disabled={loading}
                          />
                        </div>

                        {/* Tabla NAS */}
                        <div className="bg-white rounded-lg shadow overflow-x-auto mb-3 md:mb-4">
                          <table className="min-w-full bg-white border border-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                  Ítem
                                </th>
                                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                  Descripción
                                </th>
                                <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                  % NAS
                                </th>
                                <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                  Aplicar
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {/* Grupo 1 */}
                              <tr className="bg-blue-50 border-l-4 border-blue-200">
                                <td colSpan={4} className="px-2 md:px-4 py-1.5 md:py-2 text-xs text-blue-700">
                                  <span className="font-medium">Grupo 1:</span> Actividades básicas de monitorización (seleccionar una opción)
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['1a'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('1a')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">1a</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Monitorización horaria, balance hídrico</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">4.5</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['1a'] || false}
                                    onChange={() => handleNasSelection('1a')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['1b'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('1b')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">1b</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Presencia continua ≥2 h</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">12.1</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['1b'] || false}
                                    onChange={() => handleNasSelection('1b')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['1c'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('1c')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">1c</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Presencia continua ≥4 h</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">19.6</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['1c'] || false}
                                    onChange={() => handleNasSelection('1c')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['2'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('2')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">2</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Analíticas (bioquímica, micro, etc.)</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">4.3</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['2'] || false}
                                    onChange={() => handleNasSelection('2')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['3'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('3')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">3</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Medicación (excluye vasoactivos)</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">5.6</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['3'] || false}
                                    onChange={() => handleNasSelection('3')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>

                              {/* Grupo 4 */}
                              <tr className="bg-purple-50 border-l-4 border-purple-200">
                                <td colSpan={4} className="px-2 md:px-4 py-1.5 md:py-2 text-xs text-purple-700">
                                  <span className="font-medium">Grupo 4:</span> Procedimientos de higiene (seleccionar una opción)
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['4a'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('4a')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">4a</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Higiene/procedimientos "normales"</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">4.1</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['4a'] || false}
                                    onChange={() => handleNasSelection('4a')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['4b'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('4b')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">4b</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Higiene/procedimientos &gt;2 h</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">16.5</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['4b'] || false}
                                    onChange={() => handleNasSelection('4b')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['4c'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('4c')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">4c</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Higiene/procedimientos &gt;4 h</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">20.0</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['4c'] || false}
                                    onChange={() => handleNasSelection('4c')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['5'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('5')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">5</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Cuidados de drenajes (excepto SNG)</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">1.8</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['5'] || false}
                                    onChange={() => handleNasSelection('5')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>

                              {/* Grupo 6 */}
                              <tr className="bg-green-50 border-l-4 border-green-200">
                                <td colSpan={4} className="px-2 md:px-4 py-1.5 md:py-2 text-xs text-green-700">
                                  <span className="font-medium">Grupo 6:</span> Movilización y posicionamiento (seleccionar una opción)
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['6a'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('6a')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">6a</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Movilización hasta 3 veces/24 h</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">5.5</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['6a'] || false}
                                    onChange={() => handleNasSelection('6a')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['6b'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('6b')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">6b</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Movilización &gt;3 veces/24 h o con 2 enfermeras</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">12.4</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['6b'] || false}
                                    onChange={() => handleNasSelection('6b')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['6c'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('6c')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">6c</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Movilización con ≥3 enfermeras</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">17.0</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['6c'] || false}
                                    onChange={() => handleNasSelection('6c')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>

                              {/* Grupo 7 */}
                              <tr className="bg-orange-50 border-l-4 border-orange-200">
                                <td colSpan={4} className="px-2 md:px-4 py-1.5 md:py-2 text-xs text-orange-700">
                                  <span className="font-medium">Grupo 7:</span> Apoyo y soporte familiar (seleccionar una opción)
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['7a'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('7a')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">7a</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Apoyo a familia/paciente ~1 h</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">4.0</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['7a'] || false}
                                    onChange={() => handleNasSelection('7a')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['7b'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('7b')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">7b</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Apoyo a familia/paciente ≥3 h</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">32.0</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['7b'] || false}
                                    onChange={() => handleNasSelection('7b')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>

                              {/* Grupo 8 */}
                              <tr className="bg-red-50 border-l-4 border-red-200">
                                <td colSpan={4} className="px-2 md:px-4 py-1.5 md:py-2 text-xs text-red-700">
                                  <span className="font-medium">Grupo 8:</span> Tareas administrativas (seleccionar una opción)
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['8a'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('8a')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">8a</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Tareas administrativas rutinarias (&lt;2 h)</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">4.2</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['8a'] || false}
                                    onChange={() => handleNasSelection('8a')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['8b'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('8b')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">8b</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Tareas administrativas ~2 h</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">23.2</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['8b'] || false}
                                    onChange={() => handleNasSelection('8b')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>
                              <tr 
                                className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections['8c'] ? 'bg-blue-100 md:bg-white' : ''}`}
                                onClick={() => window.innerWidth < 768 && handleNasSelection('8c')}
                              >
                                <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">8c</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">Tareas administrativas ~4 h</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">30.0</td>
                                <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                    checked={nasSelections['8c'] || false}
                                    onChange={() => handleNasSelection('8c')}
                                    disabled={loading}
                                  />
                                </td>
                              </tr>

                              {/* Ítems individuales (9-23) */}
                              <tr className="bg-indigo-50 border-l-4 border-indigo-200">
                                <td colSpan={4} className="px-2 md:px-4 py-1.5 md:py-2 text-xs text-indigo-700">
                                  <span className="font-medium">Actividades específicas de la unidad</span>
                                </td>
                              </tr>
                              {[
                                { id: '9', desc: 'Soporte respiratorio (VM, VMI, CPAP/PEEP, O₂, etc.)', score: 1.4 },
                                { id: '10', desc: 'Cuidados de vía aérea artificial (TET/traqueo)', score: 1.8 },
                                { id: '11', desc: 'Tratamiento para mejorar función pulmonar', score: 4.4 },
                                { id: '12', desc: 'Fármacos vasoactivos (cualquier tipo/dosis)', score: 1.2 },
                                { id: '13', desc: 'Reposición IV de grandes pérdidas (&gt;3 L/m²/día)', score: 2.5 },
                                { id: '14', desc: 'Monitorización de aurícula izquierda / Swan-Ganz', score: 1.7 },
                                { id: '15', desc: 'RCP tras parada (en últimas 24 h)', score: 7.1 },
                                { id: '16', desc: 'Hemofiltración/diálisis', score: 7.7 },
                                { id: '17', desc: 'Diuresis cuantitativa (sondaje vesical, etc.)', score: 7.0 },
                                { id: '18', desc: 'Monitorización de presión intracraneal', score: 1.6 },
                                { id: '19', desc: 'Tratamiento de acidosis/alcalosis metabólica complicada', score: 1.3 },
                                { id: '20', desc: 'Hiperalimentación IV (nutrición parenteral)', score: 2.8 },
                                { id: '21', desc: 'Nutrición enteral (SNG u otra vía GI)', score: 1.3 },
                                { id: '22', desc: 'Intervención específica en UCI', score: 2.8 },
                                { id: '23', desc: 'Intervención específica fuera de UCI', score: 1.9 }
                              ].map((item) => (
                                <tr 
                                  key={item.id} 
                                  className={`hover:bg-gray-50 md:cursor-default cursor-pointer transition-colors ${nasSelections[item.id] ? 'bg-blue-100 md:bg-white' : ''}`}
                                  onClick={() => window.innerWidth < 768 && handleNasSelection(item.id)}
                                >
                                  <td className="px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-gray-900 border-b">{item.id}</td>
                                  <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-700 border-b">{item.desc}</td>
                                  <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm text-center text-gray-700 border-b">{item.score}</td>
                                  <td className="px-2 md:px-4 py-2 md:py-3 text-center border-b">
                                    <input 
                                      type="checkbox" 
                                      className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 w-4 h-4 pointer-events-none md:pointer-events-auto" 
                                      checked={nasSelections[item.id] || false}
                                      onChange={() => handleNasSelection(item.id)}
                                      disabled={loading}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Total NAS Score */}
                        <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-base md:text-lg font-semibold text-gray-900">Puntuación Total NAS:</span>
                            <span className="text-xl md:text-2xl font-bold text-blue-900">{calculateTotalNAS().toFixed(1)}%</span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600 mt-2">
                            El NAS representa el porcentaje de tiempo que una enfermera dedica a un paciente en 24 horas.
                          </p>
                        </div>

                        {/* Botones */}
                        <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-3 mt-3 md:mt-4">
                          <button
                            onClick={() => handlePacienteClick(paciente.rut)}
                            className="hidden md:block px-4 md:px-6 py-2 bg-gray-200 text-gray-700 text-sm md:text-base rounded-lg hover:bg-gray-300 transition-colors"
                            disabled={loading}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleSubmitClick}
                            disabled={loading || pacientesEvaluados.has(paciente.rut)}
                            className={`w-full md:w-auto px-4 md:px-6 py-2.5 md:py-2 rounded-lg font-medium text-sm md:text-base transition-colors ${
                              loading || pacientesEvaluados.has(paciente.rut)
                                ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                                : 'bg-blue-900 hover:bg-blue-800 text-white'
                            }`}
                          >
                            {loading 
                              ? 'Guardando...' 
                              : pacientesEvaluados.has(paciente.rut)
                              ? 'Ya evaluado'
                              : 'Guardar Evaluación NAS'
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && pacienteActual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 60}}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4 md:p-6">
            <div className="flex items-center mb-3 md:mb-4">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-base md:text-lg font-medium text-gray-900">Confirmar Registro NAS</h3>
              </div>
            </div>
            
            <div className="mb-4 md:mb-6">
              <p className="text-sm text-gray-700 mb-3 md:mb-4">
                ¿Estás seguro de que deseas guardar este registro NAS?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Paciente:</span>
                  <span className="text-right">{pacienteActual.nombreCompleto}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Fecha:</span>
                  <span>{fecha.split('-').reverse().join('/')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Puntuación NAS:</span>
                  <span className="text-blue-900 font-semibold">{calculateTotalNAS().toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 md:gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full md:w-auto px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={loading}
                className={`w-full md:w-auto px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-900 hover:bg-blue-800'
                } text-white`}
              >
                {loading ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalNAS;

