                                            import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pacienteService, Paciente } from '../services/api';
import apache2Service from '../services/apache2API';

interface ModalApache2Props {
  isOpen: boolean;
  onClose: () => void;
  pacientePreseleccionado?: {
    rut: string;
    nombre: string;
  } | null;
}

interface ApacheScore {
  temperatura: number;
  presionArterial: number;
  frecuenciaCardiaca: number;
  frecuenciaRespiratoria: number;
  oxigenacion: number;
  phArterial: number;
  sodio: number;
  potasio: number;
  creatinina: number;
  hematocrito: number;
  leucocitos: number;
  glasgow: number;
  edad: number;
  enfermedadCronica: number;
}

// Función para obtener fecha local sin problemas de zona horaria
const obtenerFechaLocal = () => {
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

const ModalApache2: React.FC<ModalApache2Props> = ({ isOpen, onClose, pacientePreseleccionado }) => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pacientesEvaluados, setPacientesEvaluados] = useState<Set<string>>(new Set());
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | ''; texto: string }>({ tipo: '', texto: '' });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [evaluacionPrevia, setEvaluacionPrevia] = useState<any>(null);
  const [loadingEvaluacion, setLoadingEvaluacion] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  const [apacheScores, setApacheScores] = useState<ApacheScore>({
    temperatura: 0,
    presionArterial: 0,
    frecuenciaCardiaca: 0,
    frecuenciaRespiratoria: 0,
    oxigenacion: 0,
    phArterial: 0,
    sodio: 0,
    potasio: 0,
    creatinina: 0,
    hematocrito: 0,
    leucocitos: 0,
    glasgow: 0,
    edad: 0,
    enfermedadCronica: 0,
  });

  // Estado para rastrear el rango específico seleccionado en cada parámetro
  const [selectedRanges, setSelectedRanges] = useState<{[key: string]: string}>({});

  const [fechaEvaluacion, setFechaEvaluacion] = useState<string>(obtenerFechaLocal());

  // Función para formatear fecha de ingreso (de YYYY-MM-DD HH:MM:SS a YYYY-MM-DD)
  const formatearFechaIngreso = (fechaIngreso: string) => {
    if (!fechaIngreso) return null;
    // Extraer solo la parte de la fecha (YYYY-MM-DD) 
    return fechaIngreso.split(' ')[0];
  };

  // Función para validar la fecha seleccionada
  const validarFecha = (fechaSeleccionada: string, paciente: Paciente) => {
    if (!paciente) return { valida: false, mensaje: 'Paciente no encontrado' };

    const fechaActual = obtenerFechaLocal();
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
    
    // IMPORTANTE: Siempre actualizar la fecha primero, luego validar
    setFechaEvaluacion(nuevaFecha);
    
    if (pacienteSeleccionado) {
      const validacion = validarFecha(nuevaFecha, pacienteSeleccionado);
      if (!validacion.valida) {
        setMensaje({ tipo: 'error', texto: validacion.mensaje });
        // NO hacer return aquí, ya actualizamos la fecha arriba
      } else {
        // Limpiar mensaje de error si la fecha es válida
        if (mensaje.tipo === 'error' && mensaje.texto.includes('fecha')) {
          setMensaje({ tipo: '', texto: '' });
        }
      }
    } else {
      // Limpiar mensaje de error si no hay paciente seleccionado
      if (mensaje.tipo === 'error' && mensaje.texto.includes('fecha')) {
        setMensaje({ tipo: '', texto: '' });
      }
    }
  };

  // Función para obtener el rango de edad como texto
  const obtenerRangoEdad = (edad: number) => {
    if (edad <= 44) return '≤44 años (0 pts)';
    else if (edad <= 54) return '45-54 años (2 pts)';
    else if (edad <= 64) return '55-64 años (3 pts)';
    else if (edad <= 74) return '65-74 años (5 pts)';
    else return '≥75 años (6 pts)';
  };

  // Cargar pacientes cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarPacientes();
      // Resetear los estados cuando se abre el modal
      setPacienteSeleccionado(null);
      resetearApache2();
      setMensaje({ tipo: '', texto: '' });
    }
  }, [isOpen]);

  // Seleccionar paciente preseleccionado cuando se cargan los pacientes
  useEffect(() => {
    if (isOpen && pacientePreseleccionado && pacientes.length > 0) {
      const pacienteEncontrado = pacientes.find(p => p.rut === pacientePreseleccionado.rut);
      if (pacienteEncontrado) {
        handlePacienteClick(pacienteEncontrado);
      }
    }
  }, [isOpen, pacientePreseleccionado, pacientes]);

  const cargarPacientes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const pacientesData = await pacienteService.obtenerPacientes();
      const pacientesConCama = pacientesData
        .filter(p => p.camaAsignada)
        .sort((a, b) => (a.camaAsignada || 0) - (b.camaAsignada || 0));
      setPacientes(pacientesConCama);
      
      // Verificar qué pacientes ya tienen evaluaciones Apache II
      const evaluadosSet = new Set<string>();
      for (const paciente of pacientesConCama) {
        try {
          const response = await apache2Service.obtenerPorPaciente(paciente.rut, { limit: 1 });
          if (response.evaluaciones && response.evaluaciones.length > 0) {
            evaluadosSet.add(paciente.rut);
          }
        } catch (error) {
          console.error(`Error al verificar evaluación del paciente ${paciente.rut}:`, error);
        }
      }
      setPacientesEvaluados(evaluadosSet);
    } catch (err) {
      console.error('Error al cargar pacientes:', err);
      setError('Error al cargar los pacientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePacienteClick = async (paciente: Paciente) => {
    if (pacienteSeleccionado?.rut === paciente.rut) {
      setPacienteSeleccionado(null);
      resetearApache2();
      setEvaluacionPrevia(null);
    } else {
      setPacienteSeleccionado(paciente);
      resetearApache2();
      
      // Pre-llenar la edad del paciente
      const edadPaciente = paciente.edad;
      let puntosEdad = 0;
      if (edadPaciente <= 44) puntosEdad = 0;
      else if (edadPaciente <= 54) puntosEdad = 2;
      else if (edadPaciente <= 64) puntosEdad = 3;
      else if (edadPaciente <= 74) puntosEdad = 5;
      else if (edadPaciente >= 75) puntosEdad = 6;
      
      setApacheScores(prev => ({ ...prev, edad: puntosEdad }));
      
      // Validar la fecha actual cuando se selecciona un paciente
      const fechaActual = obtenerFechaLocal();
      const validacion = validarFecha(fechaActual, paciente);
      if (!validacion.valida) {
        // Si la fecha actual no es válida, establecer la fecha de ingreso
        const fechaIngreso = formatearFechaIngreso(paciente.fechaIngresoUTI);
        if (fechaIngreso) {
          setFechaEvaluacion(fechaIngreso);
        }
      }
      
      // Cargar evaluación previa si existe
      await cargarEvaluacionPrevia(paciente.rut);
    }
  };

  const estaEvaluado = (rutPaciente: string) => {
    return pacientesEvaluados.has(rutPaciente);
  };

  const cargarEvaluacionPrevia = async (rutPaciente: string) => {
    try {
      setLoadingEvaluacion(true);
      const response = await apache2Service.obtenerPorPaciente(rutPaciente, { limit: 1 });
      
      if (response.evaluaciones && response.evaluaciones.length > 0) {
        const ultimaEvaluacion = response.evaluaciones[0];
        setEvaluacionPrevia(ultimaEvaluacion);
        
        // Pre-llenar el formulario con los datos de la evaluación previa
        if (ultimaEvaluacion.rangosSeleccionados) {
          setSelectedRanges(ultimaEvaluacion.rangosSeleccionados);
        }
        
        // Pre-llenar los puntajes
        setApacheScores({
          temperatura: ultimaEvaluacion.temperatura || 0,
          presionArterial: ultimaEvaluacion.presionArterial || 0,
          frecuenciaCardiaca: ultimaEvaluacion.frecuenciaCardiaca || 0,
          frecuenciaRespiratoria: ultimaEvaluacion.frecuenciaRespiratoria || 0,
          oxigenacion: ultimaEvaluacion.oxigenacion || 0,
          phArterial: ultimaEvaluacion.phArterial || 0,
          sodio: ultimaEvaluacion.sodio || 0,
          potasio: ultimaEvaluacion.potasio || 0,
          creatinina: ultimaEvaluacion.creatinina || 0,
          hematocrito: ultimaEvaluacion.hematocrito || 0,
          leucocitos: ultimaEvaluacion.leucocitos || 0,
          glasgow: ultimaEvaluacion.glasgow || 0,
          edad: ultimaEvaluacion.edad || 0,
          enfermedadCronica: ultimaEvaluacion.enfermedadCronica || 0,
        });
        
        // Actualizar fecha de evaluación
        if (ultimaEvaluacion.fechaEvaluacion) {
          const fechaMatch = ultimaEvaluacion.fechaEvaluacion.match(/^(\d{4}-\d{2}-\d{2})/);
          if (fechaMatch) {
            setFechaEvaluacion(fechaMatch[1]);
          }
        }
      } else {
        setEvaluacionPrevia(null);
      }
    } catch (error) {
      console.error('Error al cargar evaluación previa:', error);
      setEvaluacionPrevia(null);
    } finally {
      setLoadingEvaluacion(false);
    }
  };

  const resetearApache2 = () => {
    setApacheScores({
      temperatura: 0,
      presionArterial: 0,
      frecuenciaCardiaca: 0,
      frecuenciaRespiratoria: 0,
      oxigenacion: 0,
      phArterial: 0,
      sodio: 0,
      potasio: 0,
      creatinina: 0,
      hematocrito: 0,
      leucocitos: 0,
      glasgow: 0,
      edad: 0,
      enfermedadCronica: 0,
    });
    setSelectedRanges({});
    // Solo resetear la fecha si no hay paciente seleccionado
    // Si hay paciente seleccionado, mantener la fecha actual para que el usuario pueda cambiarla
    if (!pacienteSeleccionado) {
      setFechaEvaluacion(obtenerFechaLocal());
    }
    setMensaje({ tipo: '', texto: '' });
  };

  const updateScore = (parameter: keyof ApacheScore, score: number, range?: string) => {
    setApacheScores(prev => ({
      ...prev,
      [parameter]: score
    }));
    if (range) {
      setSelectedRanges(prev => ({
        ...prev,
        [parameter]: range
      }));
    }
    // Limpiar mensaje de error si existe
    if (mensaje.texto) {
      setMensaje({ tipo: '', texto: '' });
    }
  };

  const isButtonSelected = (parameter: keyof ApacheScore, score: number, range?: string): boolean => {
    if (range) {
      return selectedRanges[parameter] === range;
    }
    return !selectedRanges[parameter] && apacheScores[parameter] === score;
  };

  const getTotalScore = () => {
    return Object.values(apacheScores).reduce((sum, score) => sum + score, 0);
  };

  const getMortalityRisk = (score: number) => {
    if (score <= 4) return { risk: '4%', level: 'Bajo', color: 'text-green-600' };
    if (score <= 9) return { risk: '8%', level: 'Bajo-Moderado', color: 'text-yellow-600' };
    if (score <= 14) return { risk: '15%', level: 'Moderado', color: 'text-orange-600' };
    if (score <= 19) return { risk: '25%', level: 'Alto', color: 'text-red-600' };
    if (score <= 24) return { risk: '40%', level: 'Muy Alto', color: 'text-red-700' };
    if (score <= 29) return { risk: '55%', level: 'Crítico', color: 'text-red-800' };
    if (score <= 34) return { risk: '73%', level: 'Crítico', color: 'text-red-900' };
    return { risk: '85%', level: 'Crítico', color: 'text-red-900' };
  };

  const validarFormularioCompleto = (): { valido: boolean; camposFaltantes: string[] } => {
    const camposFaltantes: string[] = [];
    
    // Verificar que todos los campos tengan un rango seleccionado
    // (esto asegura que el usuario haya hecho click en un botón)
    const camposRequeridos = [
      { campo: 'temperatura', nombre: 'Temperatura' },
      { campo: 'presionArterial', nombre: 'Presión Arterial Media' },
      { campo: 'frecuenciaCardiaca', nombre: 'Frecuencia Cardíaca' },
      { campo: 'frecuenciaRespiratoria', nombre: 'Frecuencia Respiratoria' },
      { campo: 'oxigenacion', nombre: 'Oxigenación' },
      { campo: 'phArterial', nombre: 'pH Arterial' },
      { campo: 'sodio', nombre: 'Sodio Sérico' },
      { campo: 'potasio', nombre: 'Potasio Sérico' },
      { campo: 'creatinina', nombre: 'Creatinina Sérica' },
      { campo: 'hematocrito', nombre: 'Hematocrito' },
      { campo: 'leucocitos', nombre: 'Leucocitos' }
    ];

    // Verificar campos con rangos seleccionados
    camposRequeridos.forEach(({ campo, nombre }) => {
      if (!selectedRanges[campo]) {
        camposFaltantes.push(nombre);
      }
    });

    // Verificar Glasgow (debe tener un valor mayor a 0 o debe estar en selectedRanges)
    if (apacheScores.glasgow === 0 && !selectedRanges['glasgow']) {
      camposFaltantes.push('Escala de Glasgow');
    }

    // Verificar Enfermedad Crónica (debe tener un rango seleccionado)
    if (!selectedRanges['enfermedadCronica']) {
      camposFaltantes.push('Evaluación de Salud Crónica');
    }

    return {
      valido: camposFaltantes.length === 0,
      camposFaltantes
    };
  };

  const handleSave = () => {
    if (evaluacionPrevia) {
      setMensaje({ 
        tipo: 'error', 
        texto: 'Este paciente ya tiene una evaluación Apache II. No se puede guardar una nueva evaluación.' 
      });
      return;
    }

    // Validar que todos los campos estén completos
    const validacion = validarFormularioCompleto();
    
    if (!validacion.valido) {
      const camposTexto = validacion.camposFaltantes.join(', ');
      setMensaje({ 
        tipo: 'error', 
        texto: `Por favor complete los siguientes campos antes de guardar: ${camposTexto}` 
      });
      return;
    }

    setShowConfirmation(true);
  };

  const confirmSave = async () => {
    if (!user) {
      setMensaje({ tipo: 'error', texto: 'No hay usuario autenticado' });
      setShowConfirmation(false);
      return;
    }

    if (!pacienteSeleccionado) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar un paciente' });
      setShowConfirmation(false);
      return;
    }

    // Cerrar modal de confirmación inmediatamente
    setShowConfirmation(false);
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const fechaFormateada = formatearFechaParaBackend(fechaEvaluacion);
      
      const apache2Data: any = {
        pacienteRut: pacienteSeleccionado.rut,
        fechaEvaluacion: fechaFormateada,
        temperatura: apacheScores.temperatura,
        presionArterial: apacheScores.presionArterial,
        frecuenciaCardiaca: apacheScores.frecuenciaCardiaca,
        frecuenciaRespiratoria: apacheScores.frecuenciaRespiratoria,
        oxigenacion: apacheScores.oxigenacion,
        phArterial: apacheScores.phArterial,
        sodio: apacheScores.sodio,
        potasio: apacheScores.potasio,
        creatinina: apacheScores.creatinina,
        hematocrito: apacheScores.hematocrito,
        leucocitos: apacheScores.leucocitos,
        glasgow: apacheScores.glasgow,
        edad: apacheScores.edad, // Ya es el puntaje, no la edad real
        enfermedadCronica: apacheScores.enfermedadCronica,
        rangosSeleccionados: selectedRanges,
        usuarioId: user.id
      };

      await apache2Service.crear(apache2Data);
      
      // Agregar el paciente al conjunto de evaluados
      setPacientesEvaluados(prev => new Set(prev).add(pacienteSeleccionado.rut));
      
      // Mostrar notificación emergente
      setShowNotification(true);
      
      setTimeout(() => {
        resetearApache2();
        setPacienteSeleccionado(null);
        setMensaje({ tipo: '', texto: '' });
        setShowConfirmation(false);
        // No cerrar el modal completo, solo el formulario del paciente
      }, 2000);
      
      // Ocultar notificación después de 3 segundos
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);

    } catch (error: any) {
      console.error('Error al guardar Apache II:', error);
      
      let errorMessage = 'Error al guardar la evaluación Apache II';
      if (error.message) {
        errorMessage = error.message;
      }
      
      setMensaje({ 
        tipo: 'error', 
        texto: errorMessage 
      });
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelSave = () => {
    setShowConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[85vh] md:max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b sticky top-0 bg-green-600 z-10 rounded-t-lg md:rounded-t-2xl">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-white">Evaluación Apache II</h2>
            <p className="text-xs md:text-sm text-green-100 mt-1">Seleccione un paciente para realizar la evaluación</p>
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

        {/* Content */}
        <div className="p-3 md:p-6" style={{maxHeight: 'calc(85vh - 80px)'}}>
          {isLoading ? (
            <div className="text-center py-8 md:py-12">
              <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-sm md:text-base text-gray-600">Cargando pacientes...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 md:p-4">
              {error}
            </div>
          ) : pacientes.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    onClick={() => handlePacienteClick(paciente)}
                    className={`p-3 md:p-4 cursor-pointer transition-all ${
                      pacienteSeleccionado?.rut === paciente.rut
                        ? 'bg-green-50 border-l-4 border-green-600'
                        : estaEvaluado(paciente.rut)
                        ? 'bg-green-50 hover:bg-green-100'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 md:space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                            pacienteSeleccionado?.rut === paciente.rut 
                              ? 'bg-green-600' 
                              : estaEvaluado(paciente.rut)
                              ? 'bg-green-500'
                              : 'bg-gray-200'
                          }`}>
                            <span className={`text-xs md:text-sm font-bold ${
                              pacienteSeleccionado?.rut === paciente.rut || estaEvaluado(paciente.rut) 
                                ? 'text-white' 
                                : 'text-gray-600'
                            }`}>
                              {paciente.camaAsignada}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2">
                            <h3 className="text-sm md:text-lg font-semibold text-gray-900">{paciente.nombreCompleto}</h3>
                            {estaEvaluado(paciente.rut) && (
                              <div className="flex items-center space-x-1 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full w-fit">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Evaluado</span>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:flex md:items-center md:space-x-4 gap-1 md:gap-0 text-xs md:text-sm text-gray-600 mt-1">
                            <span>RUT: {paciente.rut}</span>
                            <span className="hidden md:inline">•</span>
                            <span>Ficha: {paciente.numeroFicha}</span>
                            <span className="hidden md:inline">•</span>
                            <span>Cama: {paciente.camaAsignada}</span>
                            <span className="hidden md:inline">•</span>
                            <span>Edad: {paciente.edad} años</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <svg
                          className={`w-5 h-5 md:w-6 md:h-6 text-gray-400 transition-transform ${
                            pacienteSeleccionado?.rut === paciente.rut ? 'rotate-180' : ''
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

                  {/* Formulario de Apache II - solo visible si está seleccionado */}
                  {pacienteSeleccionado?.rut === paciente.rut && (
                    <div className="p-3 md:p-6 bg-gray-50 border-t">
                      {/* Aviso de evaluación previa */}
                      {loadingEvaluacion ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                          <div className="flex items-center">
                            <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm text-blue-800">Cargando evaluación previa...</span>
                          </div>
                        </div>
                      ) : evaluacionPrevia ? (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">
                                Paciente ya evaluado
                              </h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                  Este paciente ya tiene una evaluación Apache II registrada el{' '}
                                  <strong>
                                    {new Date(evaluacionPrevia.fechaEvaluacion).toLocaleDateString('es-ES', { 
                                      day: '2-digit', 
                                      month: '2-digit', 
                                      year: 'numeric' 
                                    })}
                                  </strong>
                                  {' '}con un puntaje total de <strong>{evaluacionPrevia.puntajeTotal}</strong> puntos.
                                </p>
                                <p className="mt-1">
                                  <span className="font-medium">Nivel de riesgo:</span> {evaluacionPrevia.nivelRiesgo}
                                </p>
                                <p className="mt-2 text-xs">
                                  Los datos mostrados a continuación corresponden a la evaluación anterior. 
                                  No se permite guardar una nueva evaluación para este paciente.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Header con resultado */}
                      <div className="bg-green-50 p-3 md:p-4 rounded-lg mb-4 md:mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                          <div>
                            <h3 className="text-base md:text-lg font-semibold text-gray-900">APACHE II Score</h3>
                            <p className="text-xs md:text-sm text-gray-600">Acute Physiology and Chronic Health Evaluation</p>
                          </div>
                          <div className="text-left md:text-right">
                            <div className="text-2xl md:text-3xl font-bold text-green-600">{getTotalScore()}</div>
                            <div className={`text-xs md:text-sm font-medium ${getMortalityRisk(getTotalScore()).color}`}>
                              Riesgo: {getMortalityRisk(getTotalScore()).risk} ({getMortalityRisk(getTotalScore()).level})
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tabla APACHE II - Desktop */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-2 py-2 text-left text-sm font-medium">Variable Fisiológica</th>
                              <th className="border border-gray-300 px-2 py-1 text-center text-xs">+4</th>
                              <th className="border border-gray-300 px-2 py-1 text-center text-xs">+3</th>
                              <th className="border border-gray-300 px-2 py-1 text-center text-xs">+2</th>
                              <th className="border border-gray-300 px-2 py-1 text-center text-xs">+1</th>
                              <th className="border border-gray-300 px-2 py-1 text-center text-xs bg-green-50">0</th>
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
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Temperatura (°C)</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('temperatura', 4, 'temp_≥41')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 4, 'temp_≥41') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≥41</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('temperatura', 3, 'temp_39-40.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 3, 'temp_39-40.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>39-40.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('temperatura', 1, 'temp_38.5-38.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 1, 'temp_38.5-38.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>38.5-38.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                                <button onClick={() => updateScore('temperatura', 0, 'temp_36-38.4')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 0, 'temp_36-38.4') ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}>36-38.4</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('temperatura', 1, 'temp_34-35.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 1, 'temp_34-35.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>34-35.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('temperatura', 2, 'temp_32-33.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 2, 'temp_32-33.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>32-33.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('temperatura', 3, 'temp_≤31.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 3, 'temp_≤31.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≤31.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.temperatura}</td>
                            </tr>

                            {/* Presión Arterial Media */}
                            <tr>
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Presión Arterial Media</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('presionArterial', 4, 'pa_≥160')} className={`text-xs p-1 w-full rounded ${isButtonSelected('presionArterial', 4, 'pa_≥160') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≥160</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('presionArterial', 3, 'pa_130-159')} className={`text-xs p-1 w-full rounded ${isButtonSelected('presionArterial', 3, 'pa_130-159') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>130-159</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('presionArterial', 2, 'pa_110-129')} className={`text-xs p-1 w-full rounded ${isButtonSelected('presionArterial', 2, 'pa_110-129') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>110-129</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                                <button onClick={() => updateScore('presionArterial', 0, 'pa_70-109')} className={`text-xs p-1 w-full rounded ${isButtonSelected('presionArterial', 0, 'pa_70-109') ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}>70-109</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('presionArterial', 2, 'pa_50-69')} className={`text-xs p-1 w-full rounded ${isButtonSelected('presionArterial', 2, 'pa_50-69') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>50-69</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('presionArterial', 4, 'pa_≤49')} className={`text-xs p-1 w-full rounded ${isButtonSelected('presionArterial', 4, 'pa_≤49') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≤49</button>
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.presionArterial}</td>
                            </tr>

                            {/* Frecuencia Cardíaca */}
                            <tr>
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Frecuencia Cardíaca</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('frecuenciaCardiaca', 4, 'fc_≥180')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaCardiaca', 4, 'fc_≥180') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≥180</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('frecuenciaCardiaca', 3, 'fc_140-179')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaCardiaca', 3, 'fc_140-179') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>140-179</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('frecuenciaCardiaca', 2, 'fc_110-139')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaCardiaca', 2, 'fc_110-139') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>110-139</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                                <button onClick={() => updateScore('frecuenciaCardiaca', 0, 'fc_70-109')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaCardiaca', 0, 'fc_70-109') ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}>70-109</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('frecuenciaCardiaca', 2, 'fc_55-69')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaCardiaca', 2, 'fc_55-69') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>55-69</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('frecuenciaCardiaca', 3, 'fc_≤54')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaCardiaca', 3, 'fc_≤54') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≤54</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.frecuenciaCardiaca}</td>
                            </tr>

                            {/* Frecuencia Respiratoria */}
                            <tr>
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Frecuencia Respiratoria</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('frecuenciaRespiratoria', 4, 'fr_≥50')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaRespiratoria', 4, 'fr_≥50') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≥50</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('frecuenciaRespiratoria', 3, 'fr_35-49')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaRespiratoria', 3, 'fr_35-49') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>35-49</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('frecuenciaRespiratoria', 1, 'fr_25-34')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaRespiratoria', 1, 'fr_25-34') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>25-34</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                                <button onClick={() => updateScore('frecuenciaRespiratoria', 0, 'fr_12-24')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaRespiratoria', 0, 'fr_12-24') ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}>12-24</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('frecuenciaRespiratoria', 1, 'fr_10-11')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaRespiratoria', 1, 'fr_10-11') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>10-11</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('frecuenciaRespiratoria', 2, 'fr_≤9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaRespiratoria', 2, 'fr_≤9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≤9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.frecuenciaRespiratoria}</td>
                            </tr>

                            {/* Oxigenación */}
                            <tr>
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">
                                <div>Oxigenación:</div>
                                <div className="text-xs text-gray-500 mt-1">Si FiO₂ ≥ 0.5 (AaDO₂)</div>
                                <div className="text-xs text-gray-500">Si FiO₂ &lt; 0.5 (paO₂)</div>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('oxigenacion', 4, 'ox_aado2_high')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 4, 'ox_aado2_high') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>
                                  <div>&gt;499</div>
                                  <div>-</div>
                                </button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('oxigenacion', 3, 'ox_aado2_med')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 3, 'ox_aado2_med') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>
                                  <div>350-499</div>
                                  <div>-</div>
                                </button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('oxigenacion', 2, 'ox_aado2_low')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 2, 'ox_aado2_low') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>
                                  <div>200-349</div>
                                  <div>-</div>
                                </button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                                <button onClick={() => updateScore('oxigenacion', 0, 'ox_normal')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 0, 'ox_normal') ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}>
                                  <div>&lt;200</div>
                                  <div>&gt;70</div>
                                </button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('oxigenacion', 1, 'ox_pao2_61_70')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 1, 'ox_pao2_61_70') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>
                                  <div>-</div>
                                  <div>61-70</div>
                                </button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('oxigenacion', 3, 'ox_pao2_56_60')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 3, 'ox_pao2_56_60') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>
                                  <div>-</div>
                                  <div>56-60</div>
                                </button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('oxigenacion', 4, 'ox_pao2_low')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 4, 'ox_pao2_low') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>
                                  <div>-</div>
                                  <div>&lt;56</div>
                                </button>
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.oxigenacion}</td>
                            </tr>

                            {/* pH Arterial */}
                            <tr>
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">pH Arterial</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('phArterial', 4, 'ph_≥7.7')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 4, 'ph_≥7.7') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≥7.7</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('phArterial', 3, 'ph_7.6-7.69')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 3, 'ph_7.6-7.69') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>7.6-7.69</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('phArterial', 1, 'ph_7.5-7.59')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 1, 'ph_7.5-7.59') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>7.5-7.59</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                                <button onClick={() => updateScore('phArterial', 0, 'ph_7.33-7.49')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 0, 'ph_7.33-7.49') ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}>7.33-7.49</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('phArterial', 2, 'ph_7.25-7.32')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 2, 'ph_7.25-7.32') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>7.25-7.32</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('phArterial', 3, 'ph_7.15-7.24')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 3, 'ph_7.15-7.24') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>7.15-7.24</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('phArterial', 4, 'ph_<7.15')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 4, 'ph_<7.15') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>&lt;7.15</button>
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.phArterial}</td>
                            </tr>

                            {/* Sodio */}
                            <tr>
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Sodio Sérico</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('sodio', 4, 'sodio_≥180')} className={`text-xs p-1 w-full rounded ${isButtonSelected('sodio', 4, 'sodio_≥180') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≥180</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('sodio', 3, 'sodio_160-179')} className={`text-xs p-1 w-full rounded ${isButtonSelected('sodio', 3, 'sodio_160-179') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>160-179</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('sodio', 2, 'sodio_155-159')} className={`text-xs p-1 w-full rounded ${isButtonSelected('sodio', 2, 'sodio_155-159') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>155-159</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('sodio', 1, 'sodio_150-154')} className={`text-xs p-1 w-full rounded ${isButtonSelected('sodio', 1, 'sodio_150-154') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>150-154</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                                <button onClick={() => updateScore('sodio', 0, 'sodio_130-149')} className={`text-xs p-1 w-full rounded ${isButtonSelected('sodio', 0, 'sodio_130-149') ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}>130-149</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('sodio', 2, 'sodio_≤129')} className={`text-xs p-1 w-full rounded ${isButtonSelected('sodio', 2, 'sodio_≤129') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≤129</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.sodio}</td>
                            </tr>

                            {/* Potasio */}
                            <tr>
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Potasio Sérico</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('potasio', 4, 'potasio_≥7')} className={`text-xs p-1 w-full rounded ${isButtonSelected('potasio', 4, 'potasio_≥7') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≥7</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('potasio', 3, 'potasio_6-6.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('potasio', 3, 'potasio_6-6.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>6-6.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('potasio', 1, 'potasio_5.5-5.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('potasio', 1, 'potasio_5.5-5.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>5.5-5.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                                <button onClick={() => updateScore('potasio', 0, 'potasio_3.5-5.4')} className={`text-xs p-1 w-full rounded ${isButtonSelected('potasio', 0, 'potasio_3.5-5.4') ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}>3.5-5.4</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('potasio', 1, 'potasio_3-3.4')} className={`text-xs p-1 w-full rounded ${isButtonSelected('potasio', 1, 'potasio_3-3.4') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>3-3.4</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('potasio', 2, 'potasio_≤2.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('potasio', 2, 'potasio_≤2.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≤2.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.potasio}</td>
                            </tr>

                            {/* Creatinina */}
                            <tr>
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Creatinina Sérica</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('creatinina', 4, 'creatinina_≥3.5')} className={`text-xs p-1 w-full rounded ${isButtonSelected('creatinina', 4, 'creatinina_≥3.5') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≥3.5</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('creatinina', 3, 'creatinina_2-3.4')} className={`text-xs p-1 w-full rounded ${isButtonSelected('creatinina', 3, 'creatinina_2-3.4') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>2-3.4</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('creatinina', 2, 'creatinina_1.5-1.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('creatinina', 2, 'creatinina_1.5-1.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>1.5-1.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                                <button onClick={() => updateScore('creatinina', 0, 'creatinina_0.6-1.4')} className={`text-xs p-1 w-full rounded ${isButtonSelected('creatinina', 0, 'creatinina_0.6-1.4') ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}>0.6-1.4</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('creatinina', 2, 'creatinina_≤0.6')} className={`text-xs p-1 w-full rounded ${isButtonSelected('creatinina', 2, 'creatinina_≤0.6') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≤0.6</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.creatinina}</td>
                            </tr>

                            {/* Hematocrito */}
                            <tr>
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Hematocrito</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('hematocrito', 4, 'hto_≥60')} className={`text-xs p-1 w-full rounded ${isButtonSelected('hematocrito', 4, 'hto_≥60') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≥60</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('hematocrito', 2, 'hto_50-59.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('hematocrito', 2, 'hto_50-59.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>50-59.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('hematocrito', 1, 'hto_46-49.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('hematocrito', 1, 'hto_46-49.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>46-49.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                                <button onClick={() => updateScore('hematocrito', 0, 'hto_30-45.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('hematocrito', 0, 'hto_30-45.9') ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}>30-45.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('hematocrito', 2, 'hto_≤29.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('hematocrito', 2, 'hto_≤29.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≤29.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.hematocrito}</td>
                            </tr>

                            {/* Leucocitos */}
                            <tr>
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Leucocitos</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('leucocitos', 4, 'leuco_≥40')} className={`text-xs p-1 w-full rounded ${isButtonSelected('leucocitos', 4, 'leuco_≥40') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≥40</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('leucocitos', 2, 'leuco_20-39.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('leucocitos', 2, 'leuco_20-39.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>20-39.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('leucocitos', 1, 'leuco_15-19.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('leucocitos', 1, 'leuco_15-19.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>15-19.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                                <button onClick={() => updateScore('leucocitos', 0, 'leuco_3-14.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('leucocitos', 0, 'leuco_3-14.9') ? 'bg-green-600 text-white' : 'hover:bg-gray-100'}`}>3-14.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <button onClick={() => updateScore('leucocitos', 2, 'leuco_≤2.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('leucocitos', 2, 'leuco_≤2.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>≤2.9</button>
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.leucocitos}</td>
                            </tr>

                            {/* Escala de Glasgow con input */}
                            <tr>
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Glasgow Coma Scale</td>
                              <td className="border border-gray-300 px-1 py-1 text-center" colSpan={9}>
                                <div className="flex items-center justify-center gap-2">
                                  <input
                                    type="number"
                                    min="3"
                                    max="15"
                                    placeholder="3-15"
                                    className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm text-gray-900"
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value);
                                      if (value >= 15) {
                                        updateScore('glasgow', 0, 'glasgow_15');
                                      } else if (value >= 13) {
                                        updateScore('glasgow', 1, 'glasgow_13-14');
                                      } else if (value >= 10) {
                                        updateScore('glasgow', 2, 'glasgow_10-12');
                                      } else if (value >= 3) {
                                        updateScore('glasgow', 3, 'glasgow_≤9');
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-gray-600">
                                    (15=0pts, 13-14=1pt, 10-12=2pts, ≤9=3pts)
                                  </span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.glasgow}</td>
                            </tr>

                            {/* Edad */}
                            <tr>
                              <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Edad</td>
                              <td className="border border-gray-300 px-1 py-1 text-center" colSpan={9}>
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">{paciente.edad} años</span>
                                  <span className="text-xs text-gray-600">
                                    (≤44=0pts, 45-54=2pts, 55-64=3pts, 65-74=5pts, ≥75=6pts)
                                  </span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-green-600">{apacheScores.edad}</td>
                            </tr>

                          </tbody>
                        </table>
                      </div>

                      {/* Formulario APACHE II - Mobile */}
                      <div className="md:hidden space-y-4">
                        {/* Temperatura */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Temperatura (°C)</h4>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.temperatura}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => updateScore('temperatura', 4, 'temp_≥41')} className={`p-2 text-xs rounded border ${isButtonSelected('temperatura', 4, 'temp_≥41') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≥41 (+4)</button>
                            <button onClick={() => updateScore('temperatura', 3, 'temp_39-40.9')} className={`p-2 text-xs rounded border ${isButtonSelected('temperatura', 3, 'temp_39-40.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>39-40.9 (+3)</button>
                            <button onClick={() => updateScore('temperatura', 1, 'temp_38.5-38.9')} className={`p-2 text-xs rounded border ${isButtonSelected('temperatura', 1, 'temp_38.5-38.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>38.5-38.9 (+1)</button>
                            <button onClick={() => updateScore('temperatura', 0, 'temp_36-38.4')} className={`p-2 text-xs rounded border ${isButtonSelected('temperatura', 0, 'temp_36-38.4') ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}>36-38.4 (0)</button>
                            <button onClick={() => updateScore('temperatura', 1, 'temp_34-35.9')} className={`p-2 text-xs rounded border ${isButtonSelected('temperatura', 1, 'temp_34-35.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>34-35.9 (+1)</button>
                            <button onClick={() => updateScore('temperatura', 2, 'temp_32-33.9')} className={`p-2 text-xs rounded border ${isButtonSelected('temperatura', 2, 'temp_32-33.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>32-33.9 (+2)</button>
                            <button onClick={() => updateScore('temperatura', 3, 'temp_≤31.9')} className={`p-2 text-xs rounded border ${isButtonSelected('temperatura', 3, 'temp_≤31.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≤31.9 (+3)</button>
                          </div>
                        </div>

                        {/* Presión Arterial */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Presión Arterial Media</h4>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.presionArterial}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => updateScore('presionArterial', 4, 'pa_≥160')} className={`p-2 text-xs rounded border ${isButtonSelected('presionArterial', 4, 'pa_≥160') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≥160 (+4)</button>
                            <button onClick={() => updateScore('presionArterial', 3, 'pa_130-159')} className={`p-2 text-xs rounded border ${isButtonSelected('presionArterial', 3, 'pa_130-159') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>130-159 (+3)</button>
                            <button onClick={() => updateScore('presionArterial', 2, 'pa_110-129')} className={`p-2 text-xs rounded border ${isButtonSelected('presionArterial', 2, 'pa_110-129') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>110-129 (+2)</button>
                            <button onClick={() => updateScore('presionArterial', 0, 'pa_70-109')} className={`p-2 text-xs rounded border ${isButtonSelected('presionArterial', 0, 'pa_70-109') ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}>70-109 (0)</button>
                            <button onClick={() => updateScore('presionArterial', 2, 'pa_50-69')} className={`p-2 text-xs rounded border ${isButtonSelected('presionArterial', 2, 'pa_50-69') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>50-69 (+2)</button>
                            <button onClick={() => updateScore('presionArterial', 4, 'pa_≤49')} className={`p-2 text-xs rounded border ${isButtonSelected('presionArterial', 4, 'pa_≤49') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≤49 (+4)</button>
                          </div>
                        </div>

                        {/* Frecuencia Cardíaca */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Frecuencia Cardíaca</h4>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.frecuenciaCardiaca}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => updateScore('frecuenciaCardiaca', 4, 'fc_≥180')} className={`p-2 text-xs rounded border ${isButtonSelected('frecuenciaCardiaca', 4, 'fc_≥180') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≥180 (+4)</button>
                            <button onClick={() => updateScore('frecuenciaCardiaca', 3, 'fc_140-179')} className={`p-2 text-xs rounded border ${isButtonSelected('frecuenciaCardiaca', 3, 'fc_140-179') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>140-179 (+3)</button>
                            <button onClick={() => updateScore('frecuenciaCardiaca', 2, 'fc_110-139')} className={`p-2 text-xs rounded border ${isButtonSelected('frecuenciaCardiaca', 2, 'fc_110-139') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>110-139 (+2)</button>
                            <button onClick={() => updateScore('frecuenciaCardiaca', 0, 'fc_70-109')} className={`p-2 text-xs rounded border ${isButtonSelected('frecuenciaCardiaca', 0, 'fc_70-109') ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}>70-109 (0)</button>
                            <button onClick={() => updateScore('frecuenciaCardiaca', 2, 'fc_55-69')} className={`p-2 text-xs rounded border ${isButtonSelected('frecuenciaCardiaca', 2, 'fc_55-69') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>55-69 (+2)</button>
                            <button onClick={() => updateScore('frecuenciaCardiaca', 3, 'fc_≤54')} className={`p-2 text-xs rounded border ${isButtonSelected('frecuenciaCardiaca', 3, 'fc_≤54') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≤54 (+3)</button>
                          </div>
                        </div>

                        {/* Frecuencia Respiratoria */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Frecuencia Respiratoria</h4>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.frecuenciaRespiratoria}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => updateScore('frecuenciaRespiratoria', 4, 'fr_≥50')} className={`p-2 text-xs rounded border ${isButtonSelected('frecuenciaRespiratoria', 4, 'fr_≥50') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≥50 (+4)</button>
                            <button onClick={() => updateScore('frecuenciaRespiratoria', 3, 'fr_35-49')} className={`p-2 text-xs rounded border ${isButtonSelected('frecuenciaRespiratoria', 3, 'fr_35-49') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>35-49 (+3)</button>
                            <button onClick={() => updateScore('frecuenciaRespiratoria', 1, 'fr_25-34')} className={`p-2 text-xs rounded border ${isButtonSelected('frecuenciaRespiratoria', 1, 'fr_25-34') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>25-34 (+1)</button>
                            <button onClick={() => updateScore('frecuenciaRespiratoria', 0, 'fr_12-24')} className={`p-2 text-xs rounded border ${isButtonSelected('frecuenciaRespiratoria', 0, 'fr_12-24') ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}>12-24 (0)</button>
                            <button onClick={() => updateScore('frecuenciaRespiratoria', 1, 'fr_10-11')} className={`p-2 text-xs rounded border ${isButtonSelected('frecuenciaRespiratoria', 1, 'fr_10-11') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>10-11 (+1)</button>
                            <button onClick={() => updateScore('frecuenciaRespiratoria', 2, 'fr_≤9')} className={`p-2 text-xs rounded border ${isButtonSelected('frecuenciaRespiratoria', 2, 'fr_≤9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≤9 (+2)</button>
                          </div>
                        </div>

                        {/* Oxigenación */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Oxigenación</h4>
                          <div className="text-xs text-gray-600 mb-2">Si FiO₂ ≥ 0.5 usar AaDO₂, si FiO₂ &lt; 0.5 usar paO₂</div>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.oxigenacion}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => updateScore('oxigenacion', 4, 'ox_aado2_high')} className={`p-2 text-xs rounded border ${isButtonSelected('oxigenacion', 4, 'ox_aado2_high') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>AaDO₂ ≥500 (+4)</button>
                            <button onClick={() => updateScore('oxigenacion', 3, 'ox_aado2_med')} className={`p-2 text-xs rounded border ${isButtonSelected('oxigenacion', 3, 'ox_aado2_med') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>AaDO₂ 350-499 (+3)</button>
                            <button onClick={() => updateScore('oxigenacion', 2, 'ox_aado2_low')} className={`p-2 text-xs rounded border ${isButtonSelected('oxigenacion', 2, 'ox_aado2_low') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>AaDO₂ 200-349 (+2)</button>
                            <button onClick={() => updateScore('oxigenacion', 0, 'ox_normal')} className={`p-2 text-xs rounded border ${isButtonSelected('oxigenacion', 0, 'ox_normal') ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}>AaDO₂ &lt;200 / paO₂ &gt;70 (0)</button>
                            <button onClick={() => updateScore('oxigenacion', 1, 'ox_pao2_61_70')} className={`p-2 text-xs rounded border ${isButtonSelected('oxigenacion', 1, 'ox_pao2_61_70') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>paO₂ 61-70 (+1)</button>
                            <button onClick={() => updateScore('oxigenacion', 3, 'ox_pao2_55_60')} className={`p-2 text-xs rounded border ${isButtonSelected('oxigenacion', 3, 'ox_pao2_55_60') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>paO₂ 55-60 (+3)</button>
                            <button onClick={() => updateScore('oxigenacion', 4, 'ox_pao2_low')} className={`p-2 text-xs rounded border ${isButtonSelected('oxigenacion', 4, 'ox_pao2_low') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>paO₂ &lt;55 (+4)</button>
                          </div>
                        </div>

                        {/* pH Arterial */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">pH Arterial</h4>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.phArterial}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => updateScore('phArterial', 4, 'ph_≥7.7')} className={`p-2 text-xs rounded border ${isButtonSelected('phArterial', 4, 'ph_≥7.7') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≥7.7 (+4)</button>
                            <button onClick={() => updateScore('phArterial', 3, 'ph_7.6-7.69')} className={`p-2 text-xs rounded border ${isButtonSelected('phArterial', 3, 'ph_7.6-7.69') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>7.6-7.69 (+3)</button>
                            <button onClick={() => updateScore('phArterial', 1, 'ph_7.5-7.59')} className={`p-2 text-xs rounded border ${isButtonSelected('phArterial', 1, 'ph_7.5-7.59') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>7.5-7.59 (+1)</button>
                            <button onClick={() => updateScore('phArterial', 0, 'ph_7.33-7.49')} className={`p-2 text-xs rounded border ${isButtonSelected('phArterial', 0, 'ph_7.33-7.49') ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}>7.33-7.49 (0)</button>
                            <button onClick={() => updateScore('phArterial', 2, 'ph_7.25-7.32')} className={`p-2 text-xs rounded border ${isButtonSelected('phArterial', 2, 'ph_7.25-7.32') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>7.25-7.32 (+2)</button>
                            <button onClick={() => updateScore('phArterial', 3, 'ph_7.15-7.24')} className={`p-2 text-xs rounded border ${isButtonSelected('phArterial', 3, 'ph_7.15-7.24') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>7.15-7.24 (+3)</button>
                            <button onClick={() => updateScore('phArterial', 4, 'ph_<7.15')} className={`p-2 text-xs rounded border ${isButtonSelected('phArterial', 4, 'ph_<7.15') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>&lt;7.15 (+4)</button>
                          </div>
                        </div>

                        {/* Sodio */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Sodio Sérico</h4>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.sodio}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => updateScore('sodio', 4, 'na_≥180')} className={`p-2 text-xs rounded border ${isButtonSelected('sodio', 4, 'na_≥180') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≥180 (+4)</button>
                            <button onClick={() => updateScore('sodio', 3, 'na_160-179')} className={`p-2 text-xs rounded border ${isButtonSelected('sodio', 3, 'na_160-179') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>160-179 (+3)</button>
                            <button onClick={() => updateScore('sodio', 2, 'na_155-159')} className={`p-2 text-xs rounded border ${isButtonSelected('sodio', 2, 'na_155-159') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>155-159 (+2)</button>
                            <button onClick={() => updateScore('sodio', 1, 'na_150-154')} className={`p-2 text-xs rounded border ${isButtonSelected('sodio', 1, 'na_150-154') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>150-154 (+1)</button>
                            <button onClick={() => updateScore('sodio', 0, 'na_130-149')} className={`p-2 text-xs rounded border ${isButtonSelected('sodio', 0, 'na_130-149') ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}>130-149 (0)</button>
                            <button onClick={() => updateScore('sodio', 2, 'na_120-129')} className={`p-2 text-xs rounded border ${isButtonSelected('sodio', 2, 'na_120-129') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>120-129 (+2)</button>
                            <button onClick={() => updateScore('sodio', 3, 'na_111-119')} className={`p-2 text-xs rounded border ${isButtonSelected('sodio', 3, 'na_111-119') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>111-119 (+3)</button>
                            <button onClick={() => updateScore('sodio', 4, 'na_≤110')} className={`p-2 text-xs rounded border ${isButtonSelected('sodio', 4, 'na_≤110') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≤110 (+4)</button>
                          </div>
                        </div>

                        {/* Potasio */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Potasio Sérico</h4>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.potasio}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => updateScore('potasio', 4, 'k_≥7')} className={`p-2 text-xs rounded border ${isButtonSelected('potasio', 4, 'k_≥7') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≥7 (+4)</button>
                            <button onClick={() => updateScore('potasio', 3, 'k_6-6.9')} className={`p-2 text-xs rounded border ${isButtonSelected('potasio', 3, 'k_6-6.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>6-6.9 (+3)</button>
                            <button onClick={() => updateScore('potasio', 1, 'k_5.5-5.9')} className={`p-2 text-xs rounded border ${isButtonSelected('potasio', 1, 'k_5.5-5.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>5.5-5.9 (+1)</button>
                            <button onClick={() => updateScore('potasio', 0, 'k_3.5-5.4')} className={`p-2 text-xs rounded border ${isButtonSelected('potasio', 0, 'k_3.5-5.4') ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}>3.5-5.4 (0)</button>
                            <button onClick={() => updateScore('potasio', 1, 'k_3-3.4')} className={`p-2 text-xs rounded border ${isButtonSelected('potasio', 1, 'k_3-3.4') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>3-3.4 (+1)</button>
                            <button onClick={() => updateScore('potasio', 2, 'k_2.5-2.9')} className={`p-2 text-xs rounded border ${isButtonSelected('potasio', 2, 'k_2.5-2.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>2.5-2.9 (+2)</button>
                            <button onClick={() => updateScore('potasio', 4, 'k_<2.5')} className={`p-2 text-xs rounded border ${isButtonSelected('potasio', 4, 'k_<2.5') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>&lt;2.5 (+4)</button>
                          </div>
                        </div>

                        {/* Creatinina */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Creatinina Sérica</h4>
                          <div className="text-xs text-gray-600 mb-2">Doble puntos si insuficiencia renal aguda</div>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.creatinina}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => updateScore('creatinina', 4, 'cr_≥3.5')} className={`p-2 text-xs rounded border ${isButtonSelected('creatinina', 4, 'cr_≥3.5') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≥3.5 (+4)</button>
                            <button onClick={() => updateScore('creatinina', 3, 'cr_2-3.4')} className={`p-2 text-xs rounded border ${isButtonSelected('creatinina', 3, 'cr_2-3.4') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>2-3.4 (+3)</button>
                            <button onClick={() => updateScore('creatinina', 2, 'cr_1.5-1.9')} className={`p-2 text-xs rounded border ${isButtonSelected('creatinina', 2, 'cr_1.5-1.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>1.5-1.9 (+2)</button>
                            <button onClick={() => updateScore('creatinina', 0, 'cr_0.6-1.4')} className={`p-2 text-xs rounded border ${isButtonSelected('creatinina', 0, 'cr_0.6-1.4') ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}>0.6-1.4 (0)</button>
                            <button onClick={() => updateScore('creatinina', 2, 'cr_<0.6')} className={`p-2 text-xs rounded border ${isButtonSelected('creatinina', 2, 'cr_<0.6') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>&lt;0.6 (+2)</button>
                          </div>
                        </div>

                        {/* Hematocrito */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Hematocrito (%)</h4>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.hematocrito}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => updateScore('hematocrito', 4, 'hto_≥60')} className={`p-2 text-xs rounded border ${isButtonSelected('hematocrito', 4, 'hto_≥60') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≥60 (+4)</button>
                            <button onClick={() => updateScore('hematocrito', 2, 'hto_50-59.9')} className={`p-2 text-xs rounded border ${isButtonSelected('hematocrito', 2, 'hto_50-59.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>50-59.9 (+2)</button>
                            <button onClick={() => updateScore('hematocrito', 1, 'hto_46-49.9')} className={`p-2 text-xs rounded border ${isButtonSelected('hematocrito', 1, 'hto_46-49.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>46-49.9 (+1)</button>
                            <button onClick={() => updateScore('hematocrito', 0, 'hto_30-45.9')} className={`p-2 text-xs rounded border ${isButtonSelected('hematocrito', 0, 'hto_30-45.9') ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}>30-45.9 (0)</button>
                            <button onClick={() => updateScore('hematocrito', 2, 'hto_20-29.9')} className={`p-2 text-xs rounded border ${isButtonSelected('hematocrito', 2, 'hto_20-29.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>20-29.9 (+2)</button>
                            <button onClick={() => updateScore('hematocrito', 4, 'hto_<20')} className={`p-2 text-xs rounded border ${isButtonSelected('hematocrito', 4, 'hto_<20') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>&lt;20 (+4)</button>
                          </div>
                        </div>

                        {/* Leucocitos */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Leucocitos (miles/mm³)</h4>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.leucocitos}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => updateScore('leucocitos', 4, 'wbc_≥40')} className={`p-2 text-xs rounded border ${isButtonSelected('leucocitos', 4, 'wbc_≥40') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>≥40 (+4)</button>
                            <button onClick={() => updateScore('leucocitos', 2, 'wbc_20-39.9')} className={`p-2 text-xs rounded border ${isButtonSelected('leucocitos', 2, 'wbc_20-39.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>20-39.9 (+2)</button>
                            <button onClick={() => updateScore('leucocitos', 1, 'wbc_15-19.9')} className={`p-2 text-xs rounded border ${isButtonSelected('leucocitos', 1, 'wbc_15-19.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>15-19.9 (+1)</button>
                            <button onClick={() => updateScore('leucocitos', 0, 'wbc_3-14.9')} className={`p-2 text-xs rounded border ${isButtonSelected('leucocitos', 0, 'wbc_3-14.9') ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}>3-14.9 (0)</button>
                            <button onClick={() => updateScore('leucocitos', 2, 'wbc_1-2.9')} className={`p-2 text-xs rounded border ${isButtonSelected('leucocitos', 2, 'wbc_1-2.9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>1-2.9 (+2)</button>
                            <button onClick={() => updateScore('leucocitos', 4, 'wbc_<1')} className={`p-2 text-xs rounded border ${isButtonSelected('leucocitos', 4, 'wbc_<1') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>&lt;1 (+4)</button>
                          </div>
                        </div>

                        {/* Glasgow */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Escala de Glasgow</h4>
                          <div className="text-xs text-gray-600 mb-2">Usar 15 - Glasgow real</div>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.glasgow}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => updateScore('glasgow', 4, 'gcs_3-6')} className={`p-2 text-xs rounded border ${isButtonSelected('glasgow', 4, 'gcs_3-6') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>3-6 (+4)</button>
                            <button onClick={() => updateScore('glasgow', 3, 'gcs_7-9')} className={`p-2 text-xs rounded border ${isButtonSelected('glasgow', 3, 'gcs_7-9') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>7-9 (+3)</button>
                            <button onClick={() => updateScore('glasgow', 2, 'gcs_10-12')} className={`p-2 text-xs rounded border ${isButtonSelected('glasgow', 2, 'gcs_10-12') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>10-12 (+2)</button>
                            <button onClick={() => updateScore('glasgow', 1, 'gcs_13-14')} className={`p-2 text-xs rounded border ${isButtonSelected('glasgow', 1, 'gcs_13-14') ? 'bg-green-500 text-white border-green-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>13-14 (+1)</button>
                            <button onClick={() => updateScore('glasgow', 0, 'gcs_15')} className={`p-2 text-xs rounded border ${isButtonSelected('glasgow', 0, 'gcs_15') ? 'bg-green-600 text-white border-green-600' : 'bg-green-50 hover:bg-green-100 border-green-200'}`}>15 (0)</button>
                          </div>
                        </div>

                        {/* Edad */}
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Edad</h4>
                          <div className="text-right mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Puntos: {apacheScores.edad}
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-lg font-semibold text-gray-900 mb-1">
                              {pacienteSeleccionado?.edad} años
                            </div>
                            <div className="text-sm text-gray-600">
                              {pacienteSeleccionado && obtenerRangoEdad(pacienteSeleccionado.edad)}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              La edad se calcula automáticamente desde los datos del paciente
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sección de Enfermedad Crónica */}
                      <div className="mt-4 md:mt-6 bg-gray-50 p-3 md:p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2 md:mb-3">Evaluación de Salud Crónica</h4>
                        <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                          Si el paciente tiene historia de insuficiencia orgánica severa o está inmunocomprometido, 
                          asignar puntos según el tipo de admisión:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                          <button 
                            onClick={() => updateScore('enfermedadCronica', 0, 'enf_sin')}
                            className={`p-2 md:p-3 text-left border rounded-lg transition-colors ${
                              isButtonSelected('enfermedadCronica', 0, 'enf_sin') 
                                ? 'bg-green-500 text-white border-green-500' 
                                : 'bg-white hover:bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="text-xs md:text-sm font-medium">Sin enfermedad crónica</div>
                            <div className="text-xs opacity-80">0 puntos</div>
                          </button>
                          <button 
                            onClick={() => updateScore('enfermedadCronica', 2, 'enf_electiva')}
                            className={`p-2 md:p-3 text-left border rounded-lg transition-colors ${
                              isButtonSelected('enfermedadCronica', 2, 'enf_electiva') 
                                ? 'bg-green-500 text-white border-green-500' 
                                : 'bg-white hover:bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="text-xs md:text-sm font-medium">Cirugía electiva</div>
                            <div className="text-xs opacity-80">2 puntos</div>
                            <div className="text-xs opacity-70 mt-1">Con enfermedad crónica</div>
                          </button>
                          <button 
                            onClick={() => updateScore('enfermedadCronica', 5, 'enf_urgente')}
                            className={`p-2 md:p-3 text-left border rounded-lg transition-colors ${
                              isButtonSelected('enfermedadCronica', 5, 'enf_urgente') 
                                ? 'bg-green-500 text-white border-green-500' 
                                : 'bg-white hover:bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="text-xs md:text-sm font-medium">Médico o cirugía urgente</div>
                            <div className="text-xs opacity-80">5 puntos</div>
                            <div className="text-xs opacity-70 mt-1">Con enfermedad crónica</div>
                          </button>
                        </div>
                        <div className="mt-2 md:mt-3 text-xs text-gray-500">
                          <strong>Enfermedades crónicas incluyen:</strong> Cirrosis, ICC clase IV, EPOC severo, diálisis crónica, 
                          inmunodeficiencia o inmunosupresión.
                        </div>
                      </div>

                      {/* Mensaje de estado - justo antes de los botones */}
                      {mensaje.texto && (
                        <div className={`mb-4 p-3 rounded-lg border ${
                          mensaje.tipo === 'success' 
                            ? 'bg-green-50 border-green-200 text-green-800' 
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                          <div className="flex items-center">
                            {mensaje.tipo === 'success' ? (
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className="font-medium text-sm">{mensaje.texto}</span>
                          </div>
                        </div>
                      )}

                      {/* Fecha y botones de acción */}
                      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                        <div>
                          <label htmlFor="fecha-evaluacion" className="block text-xs font-medium text-gray-700 mb-1">
                            Fecha de Evaluación
                          </label>
                          <input
                            type="date"
                            id="fecha-evaluacion"
                            value={fechaEvaluacion}
                            onChange={(e) => handleFechaChange(e.target.value)}
                            min={pacienteSeleccionado ? formatearFechaIngreso(pacienteSeleccionado.fechaIngresoUTI) || '' : ''}
                            max={obtenerFechaLocal()}
                            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900"
                          />
                        </div>
                        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                          {!evaluacionPrevia && (
                            <button
                              onClick={resetearApache2}
                              className="w-full md:w-auto px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Limpiar
                            </button>
                          )}
                          <button
                            onClick={handleSave}
                            disabled={evaluacionPrevia !== null}
                            className={`w-full md:w-auto px-4 py-2 text-sm rounded-lg transition-colors ${
                              evaluacionPrevia 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                            title={evaluacionPrevia ? 'Este paciente ya tiene una evaluación' : 'Guardar evaluación'}
                          >
                            {evaluacionPrevia ? 'Ya Evaluado' : 'Guardar Evaluación'}
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

      {/* Modal de Confirmación */}
      {showConfirmation && pacienteSeleccionado && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-75 flex items-center justify-center" style={{zIndex: 10000}}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirmar Guardado</h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                ¿Estás seguro de que deseas guardar la evaluación APACHE II para <strong>{pacienteSeleccionado.nombreCompleto}</strong>?
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Puntaje Total:</span> {getTotalScore()} puntos
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Riesgo de Mortalidad:</span> {getMortalityRisk(getTotalScore()).risk} ({getMortalityRisk(getTotalScore()).level})
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelSave}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSave}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación emergente */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-[10001] animate-slide-in-right">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">¡Guardado exitoso!</p>
              <p className="text-sm text-green-100">
                Evaluación Apache II guardada correctamente
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalApache2;
