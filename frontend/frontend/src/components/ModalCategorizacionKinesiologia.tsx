import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pacienteService, Paciente } from '../services/api';
import categorizacionKinesiologiaAPI, { CategorizacionRequest } from '../services/categorizacionKinesiologiaAPI';

interface ModalCategorizacionKinesiologiaProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategorizacionState {
  respiratorio: number | null;
  asistencia: number | null;
  glasgow: number | null;
  secreciones: number | null;
  asistenciaNueva: number | null;
}

const ModalCategorizacionKinesiologia: React.FC<ModalCategorizacionKinesiologiaProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pacientesEvaluados, setPacientesEvaluados] = useState<Set<string>>(new Set());
  const [categorizacionesExistentes, setCategorizacionesExistentes] = useState<Map<string, any>>(new Map());
  
  // Estados para la categorización
  const [categorizacion, setCategorizacion] = useState<CategorizacionState>({
    respiratorio: null,
    asistencia: null,
    glasgow: null,
    secreciones: null,
    asistenciaNueva: null
  });
  const [fechaCategorizacion, setFechaCategorizacion] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const fechaFormateada = `${year}-${month}-${day}`;
    return fechaFormateada;
  });

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const obtenerFechaActual = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para formatear fecha de ingreso (de YYYY-MM-DD HH:MM:SS a YYYY-MM-DD)
  const formatearFechaIngreso = (fechaIngreso: string) => {
    if (!fechaIngreso) return null;
    // Extraer solo la parte de la fecha (YYYY-MM-DD) 
    return fechaIngreso.split(' ')[0];
  };

  // Función para validar la fecha seleccionada
  const validarFecha = (fechaSeleccionada: string, pacienteRut: string) => {
    const paciente = pacientes.find(p => p.rut === pacienteRut);
    if (!paciente) return { valida: false, mensaje: 'Paciente no encontrado' };

    const fechaActual = obtenerFechaActual();
    const fechaIngreso = formatearFechaIngreso(paciente.fechaIngresoUTI);

    // Convertir fechas a objetos Date para comparación correcta
    const fechaSeleccionadaDate = new Date(fechaSeleccionada);
    const fechaActualDate = new Date(fechaActual);
    const fechaIngresoDate = fechaIngreso ? new Date(fechaIngreso) : null;

    // Validar que no sea posterior a la fecha actual
    if (fechaSeleccionadaDate > fechaActualDate) {
      return { 
        valida: false, 
        mensaje: 'No se puede seleccionar una fecha posterior a la actual' 
      };
    }

    // Validar que no sea anterior a la fecha de ingreso
    if (fechaIngresoDate && fechaSeleccionadaDate < fechaIngresoDate) {
      const fechaIngresoFormateada = fechaIngresoDate.toLocaleDateString('es-ES');
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
    
    setFechaCategorizacion(nuevaFecha);
    // Verificar pacientes evaluados cuando cambie la fecha
    setTimeout(() => {
      verificarPacientesEvaluados();
    }, 100);
    // Limpiar mensaje de error si la fecha es válida
    if (mensaje.tipo === 'error' && mensaje.texto.includes('fecha')) {
      setMensaje({ tipo: '', texto: '' });
    }
  };
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | ''; texto: string }>({ tipo: '', texto: '' });

  // Cargar pacientes cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarPacientes();
      verificarPacientesEvaluados();
    }
  }, [isOpen, fechaCategorizacion]);

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
    try {
      const fechaParaVerificar = fechaCategorizacion || obtenerFechaActual();
      const evaluados = new Set<string>();
      const categorizaciones = new Map<string, any>();
      
      // Verificar cada paciente individualmente
      for (const paciente of pacientes) {
        try {
          const datos = await categorizacionKinesiologiaAPI.obtenerPorPaciente(paciente.rut, {
            fechaDesde: fechaParaVerificar,
            fechaHasta: fechaParaVerificar,
            limit: 1
          });
          
          // Si hay categorizaciones para este paciente en la fecha, agregarlo a la lista de evaluados
          if (datos.categorizaciones && datos.categorizaciones.length > 0) {
            evaluados.add(paciente.rut);
            // Guardar la categorización existente para mostrar los valores
            categorizaciones.set(paciente.rut, datos.categorizaciones[0]);
          }
        } catch (err) {
          // Si hay error al verificar un paciente específico, continuar con los demás
          console.warn(`Error al verificar paciente ${paciente.rut}:`, err);
        }
      }
      
      setPacientesEvaluados(evaluados);
      setCategorizacionesExistentes(categorizaciones);
    } catch (err) {
      console.error('Error al verificar pacientes evaluados:', err);
      // En caso de error, continuar sin mostrar el estado evaluado
    }
  };

  const handlePacienteClick = (rutPaciente: string) => {
    if (pacienteSeleccionado === rutPaciente) {
      // Si ya está seleccionado, lo deseleccionamos
      setPacienteSeleccionado(null);
      resetearCategorizacion();
    } else {
      // Seleccionar nuevo paciente
      setPacienteSeleccionado(rutPaciente);
      
      // Si el paciente ya fue evaluado, cargar los valores existentes
      if (pacientesEvaluados.has(rutPaciente) && categorizacionesExistentes.has(rutPaciente)) {
        const categoriaExistente = categorizacionesExistentes.get(rutPaciente);
        setCategorizacion({
          respiratorio: categoriaExistente.patronRespiratorio,
          asistencia: categoriaExistente.asistenciaVentilatoria,
          glasgow: categoriaExistente.sasGlasgow,
          secreciones: categoriaExistente.tosSecreciones,
          asistenciaNueva: categoriaExistente.asistencia
        });
      } else {
        resetearCategorizacion();
      }
      
      // Validar la fecha actual cuando se selecciona un paciente
      const fechaActual = obtenerFechaActual();
      const validacion = validarFecha(fechaActual, rutPaciente);
      if (!validacion.valida) {
        // Si la fecha actual no es válida, establecer la fecha de ingreso
        const paciente = pacientes.find(p => p.rut === rutPaciente);
        if (paciente) {
          const fechaIngreso = formatearFechaIngreso(paciente.fechaIngresoUTI);
          if (fechaIngreso) {
            setFechaCategorizacion(fechaIngreso);
          }
        }
      }
    }
  };

  const resetearCategorizacion = () => {
    setCategorizacion({
      respiratorio: null,
      asistencia: null,
      glasgow: null,
      secreciones: null,
      asistenciaNueva: null
    });
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setFechaCategorizacion(`${year}-${month}-${day}`);
    setMensaje({ tipo: '', texto: '' });
  };

  const calcularPuntajeTotal = () => {
    const valores = Object.values(categorizacion);
    if (valores.some(v => v === null)) return null;
    return valores.reduce((sum, val) => sum + (val || 0), 0);
  };

  const obtenerComplejidad = (puntaje: number) => {
    if (puntaje === 5) return { nivel: 'Baja', carga: '0-1' };
    if (puntaje >= 6 && puntaje <= 10) return { nivel: 'Mediana', carga: '2-3 + Noche' };
    if (puntaje >= 11) return { nivel: 'Alta', carga: '3-4 + Noche' };
    return { nivel: '', carga: '' };
  };

  const handleCategorizacionChange = (variable: keyof CategorizacionState, value: number) => {
    setCategorizacion(prev => ({
      ...prev,
      [variable]: value
    }));
    if (mensaje.texto) {
      setMensaje({ tipo: '', texto: '' });
    }
  };

  const handleGuardarCategorizacion = async () => {
    if (!user) {
      setMensaje({ tipo: 'error', texto: 'No hay usuario autenticado' });
      return;
    }

    if (!pacienteSeleccionado) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar un paciente' });
      return;
    }

    // Verificar si el paciente ya fue evaluado
    if (pacientesEvaluados.has(pacienteSeleccionado)) {
      setMensaje({ tipo: 'error', texto: 'Este paciente ya fue evaluado en la fecha seleccionada' });
      return;
    }

    const puntajeTotal = calcularPuntajeTotal();
    if (puntajeTotal === null) {
      setMensaje({ tipo: 'error', texto: 'Complete todas las categorías antes de guardar' });
      return;
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const categorizacionData: CategorizacionRequest = {
        pacienteRut: pacienteSeleccionado,
        fechaCategorizacion,
        patronRespiratorio: categorizacion.respiratorio!,
        asistenciaVentilatoria: categorizacion.asistencia!,
        sasGlasgow: categorizacion.glasgow!,
        tosSecreciones: categorizacion.secreciones!,
        asistencia: categorizacion.asistenciaNueva!
      };

      const validacion = categorizacionKinesiologiaAPI.validarCategorizacion(categorizacionData);
      if (!validacion.valido) {
        setMensaje({ tipo: 'error', texto: validacion.errores.join(', ') });
        return;
      }

      await categorizacionKinesiologiaAPI.crear(categorizacionData);
      
      const paciente = pacientes.find(p => p.rut === pacienteSeleccionado);
      setMensaje({ 
        tipo: 'success', 
        texto: `Categorización guardada exitosamente para ${paciente?.nombreCompleto}` 
      });
      
      // Actualizar lista de pacientes evaluados
      setPacientesEvaluados(prev => new Set(Array.from(prev).concat(pacienteSeleccionado)));
      
      setTimeout(() => {
        resetearCategorizacion();
        setPacienteSeleccionado(null);
        setMensaje({ tipo: '', texto: '' });
      }, 2000);

    } catch (error: any) {
      console.error('Error al guardar categorización:', error);
      
      let errorMessage = 'Error al guardar la categorización';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setMensaje({ 
        tipo: 'error', 
        texto: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] md:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg md:text-2xl font-bold">Categorización de Pacientes</h2>
            <p className="text-xs md:text-sm text-gray-300 mt-1">Seleccione un paciente para realizar la categorización</p>
          </div>
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
              <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-gray-700 mx-auto"></div>
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
            <div className="space-y-3">
              {pacientes.map((paciente) => (
                <div key={paciente.rut} className="border rounded-lg overflow-hidden">
                  {/* Header del paciente - clickeable */}
                  <div
                    onClick={() => handlePacienteClick(paciente.rut)}
                    className={`p-3 md:p-4 cursor-pointer transition-all relative ${
                      pacientesEvaluados.has(paciente.rut)
                        ? 'bg-gray-200 border-l-4 border-gray-800'
                        : pacienteSeleccionado === paciente.rut
                        ? 'bg-gray-100 border-l-4 border-gray-700'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 md:space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                            pacientesEvaluados.has(paciente.rut)
                              ? 'bg-gray-800'
                              : pacienteSeleccionado === paciente.rut 
                              ? 'bg-gray-700' 
                              : 'bg-gray-200'
                          }`}>
                            <span className={`text-xs md:text-sm font-bold ${
                              pacientesEvaluados.has(paciente.rut)
                                ? 'text-white'
                                : pacienteSeleccionado === paciente.rut 
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
                      
                      {/* Indicador "Evaluado" */}
                      {pacientesEvaluados.has(paciente.rut) && (
                        <div className="absolute bottom-2 right-2">
                          <div className="bg-gray-800 text-white text-xs font-medium px-2 py-1 rounded-full">
                          ✓ Evaluado/a
                          </div>
                        </div>
                      )}
                      
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
                  </div>

                  {/* Formulario de categorización - solo visible si está seleccionado */}
                  {pacienteSeleccionado === paciente.rut && (
                    <div className="p-3 md:p-6 bg-gray-50 border-t">
                      <h4 className="text-base md:text-lg font-bold text-center text-gray-800 mb-3 md:mb-4">
                        CATEGORIZACIÓN UNIDAD DE PACIENTE CRÍTICO
                      </h4>

                      {/* Mensaje de advertencia si ya fue evaluado */}
                      {pacientesEvaluados.has(paciente.rut) && (
                        <div className="mb-3 md:mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-sm text-yellow-800">
                              Este paciente ya fue evaluado en la fecha seleccionada
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Mostrar valores seleccionados si ya fue evaluado */}
                      {pacientesEvaluados.has(paciente.rut) && categorizacionesExistentes.has(paciente.rut) && (
                        <div className="mb-3 md:mb-4 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                          <h5 className="text-sm font-semibold text-gray-800 mb-2">Evaluación realizada:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Patrón respiratorio:</span>
                              <span className="font-medium text-gray-900">
                                {categorizacionesExistentes.get(paciente.rut).patronRespiratorio}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Asistencia ventilatoria:</span>
                              <span className="font-medium text-gray-900">
                                {categorizacionesExistentes.get(paciente.rut).asistenciaVentilatoria}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">SAS / Glasgow:</span>
                              <span className="font-medium text-gray-900">
                                {categorizacionesExistentes.get(paciente.rut).sasGlasgow}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tos / Secreciones:</span>
                              <span className="font-medium text-gray-900">
                                {categorizacionesExistentes.get(paciente.rut).tosSecreciones}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Asistencia:</span>
                              <span className="font-medium text-gray-900">
                                {categorizacionesExistentes.get(paciente.rut).asistencia}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Puntaje total:</span>
                              <span className="font-bold text-gray-900">
                                {categorizacionesExistentes.get(paciente.rut).puntajeTotal || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between md:col-span-2">
                              <span className="text-gray-600">Complejidad:</span>
                              <span className="font-medium text-gray-900">
                                {categorizacionesExistentes.get(paciente.rut).complejidad || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between md:col-span-2">
                              <span className="text-gray-600">Fecha de evaluación:</span>
                              <span className="font-medium text-gray-900">
                                {categorizacionesExistentes.get(paciente.rut).fechaCategorizacion.split('T')[0].split('-').reverse().join('/')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tabla de categorización */}
                      <div className="bg-white rounded-lg shadow overflow-x-auto mb-3 md:mb-4">
                        <table className="min-w-full bg-white border border-gray-300">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b bg-gray-100">Variables</th>
                              <th className="px-2 md:px-3 py-2 md:py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-b bg-gray-100">1</th>
                              <th className="px-2 md:px-3 py-2 md:py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-b bg-gray-100">3</th>
                              <th className="px-2 md:px-3 py-2 md:py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-b bg-gray-100">5</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {/* Patrón respiratorio */}
                            <tr>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-sm font-medium text-gray-900 border-b bg-gray-100">Patrón respiratorio</td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('respiratorio', 1)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.respiratorio === 1
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  Normal
                                </button>
                              </td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('respiratorio', 3)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.respiratorio === 3
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  Superficial / FR &gt;25
                                </button>
                              </td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('respiratorio', 5)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.respiratorio === 5
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  Apremio / FR &gt;30
                                </button>
                              </td>
                            </tr>

                            {/* Asistencia ventilatoria */}
                            <tr>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-sm font-medium text-gray-900 border-b bg-gray-100">Asistencia ventilatoria</td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('asistencia', 1)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.asistencia === 1
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  Sin
                                </button>
                              </td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('asistencia', 3)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.asistencia === 3
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  VMNI intermitente
                                </button>
                              </td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('asistencia', 5)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.asistencia === 5
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  VMNI/VM continua
                                </button>
                              </td>
                            </tr>

                            {/* SAS / Glasgow */}
                            <tr>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-sm font-medium text-gray-900 border-b bg-gray-100">SAS / Glasgow</td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('glasgow', 1)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.glasgow === 1
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  5 / ≥12
                                </button>
                              </td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('glasgow', 3)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.glasgow === 3
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  3-4 / 12-9
                                </button>
                              </td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('glasgow', 5)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.glasgow === 5
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  1-2 / &gt;9
                                </button>
                              </td>
                            </tr>

                            {/* Tos / Secreciones */}
                            <tr>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-sm font-medium text-gray-900 border-b bg-gray-100">Tos / Secreciones</td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('secreciones', 1)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.secreciones === 1
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  Efectiva / +
                                </button>
                              </td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('secreciones', 3)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.secreciones === 3
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  Poco efectiva / ++
                                </button>
                              </td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('secreciones', 5)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.secreciones === 5
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  Succión / +++
                                </button>
                              </td>
                            </tr>

                            {/* Asistencia */}
                            <tr>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-sm font-medium text-gray-900 border-b bg-gray-100">Asistencia</td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('asistenciaNueva', 1)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.asistenciaNueva === 1
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  Mínima
                                </button>
                              </td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('asistenciaNueva', 3)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.asistenciaNueva === 3
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  Moderada
                                </button>
                              </td>
                              <td className="px-2 md:px-3 py-2 md:py-3 text-center border-b">
                                <button
                                  onClick={() => handleCategorizacionChange('asistenciaNueva', 5)}
                                  className={`px-1 md:px-2 py-1 rounded text-xs font-medium transition-colors w-full ${
                                    categorizacion.asistenciaNueva === 5
                                      ? 'bg-gray-700 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  Máxima / N/E
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Resultado de la categorización */}
                      {calcularPuntajeTotal() !== null && (
                        <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gray-50 rounded-lg border-l-4 border-gray-700">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-6">
                              <div className="text-center">
                                <span className="text-xs font-medium text-gray-600">Puntaje Total</span>
                                <div className="text-xl md:text-2xl font-bold text-gray-800">{calcularPuntajeTotal()}</div>
                              </div>
                              <div className="text-center md:border-l md:pl-6">
                                <span className="text-xs font-medium text-gray-600">Complejidad</span>
                                <div className="text-base md:text-lg font-semibold text-gray-900">
                                  {obtenerComplejidad(calcularPuntajeTotal()!).nivel}
                                </div>
                              </div>
                              <div className="text-center md:border-l md:pl-6">
                                <span className="text-xs font-medium text-gray-600">Carga Asistencial</span>
                                <div className="text-sm font-semibold text-gray-900">
                                  {obtenerComplejidad(calcularPuntajeTotal()!).carga}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mensaje de estado */}
                      {mensaje.texto && (
                        <div className={`mt-3 md:mt-4 p-3 md:p-4 rounded-lg text-sm md:text-base ${
                          mensaje.tipo === 'success' 
                            ? 'bg-green-50 border border-green-200 text-green-800' 
                            : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                          <div className="flex items-center">
                            {mensaje.tipo === 'success' ? (
                              <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className="font-medium">{mensaje.texto}</span>
                          </div>
                        </div>
                      )}

                      {/* Fecha y botones de acción */}
                      <div className="mt-3 md:mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                        <div>
                          <label htmlFor="fecha-categorizacion" className="block text-xs font-medium text-gray-700 mb-1">
                            Fecha de Categorización
                          </label>
                          <input
                            type="date"
                            id="fecha-categorizacion"
                            value={fechaCategorizacion}
                            onChange={(e) => handleFechaChange(e.target.value)}
                            min={pacienteSeleccionado ? formatearFechaIngreso(pacientes.find(p => p.rut === pacienteSeleccionado)?.fechaIngresoUTI || '') || '' : ''}
                            max={obtenerFechaActual()}
                            className="w-full md:w-auto px-3 py-2 bg-white text-gray-900 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                            disabled={loading}
                          />
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 md:gap-2">
                          <button
                            onClick={resetearCategorizacion}
                            className="px-4 py-2 text-sm md:text-base text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            disabled={loading}
                          >
                            Limpiar
                          </button>
                          <button
                            onClick={handleGuardarCategorizacion}
                            disabled={calcularPuntajeTotal() === null || loading || pacientesEvaluados.has(paciente.rut)}
                            className={`px-4 py-2 text-sm md:text-base rounded-lg transition-colors flex items-center justify-center ${
                              loading || calcularPuntajeTotal() === null || pacientesEvaluados.has(paciente.rut)
                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                : 'bg-gray-700 hover:bg-gray-800 text-white'
                            }`}
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Guardando...
                              </>
                            ) : pacientesEvaluados.has(paciente.rut) ? (
                              'Ya evaluado'
                            ) : (
                              'Guardar Categorización'
                            )}
                          </button>
                        </div>
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
  );
};

export default ModalCategorizacionKinesiologia;

