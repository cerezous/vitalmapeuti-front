import React, { useState, useEffect } from 'react';
import TimePicker from './TimePicker';
import { useAuth } from '../contexts/AuthContext';
import { pacienteService } from '../services/api';
import procedimientosTENSAPI from '../services/procedimientosTENSAPI';

const ModalProcedimientosTENS = ({ isOpen, onClose, onSuccess }) => {
  const [turno, setTurno] = useState('Día');
  const [fecha, setFecha] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [procedimientos, setProcedimientos] = useState([]);
  const [nuevoProcedimiento, setNuevoProcedimiento] = useState({
    nombre: '',
    tiempo: '00:00',
    pacienteRut: ''
  });
  const [pacientes, setPacientes] = useState([]);
  const [pacientesEgresados, setPacientesEgresados] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [yaExisteRegistroFecha, setYaExisteRegistroFecha] = useState(false);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [tipoAlerta, setTipoAlerta] = useState('success');
  const [textoAlerta, setTextoAlerta] = useState('');
  const [fechaMinima, setFechaMinima] = useState(() => {
    // Inicializar con 30 días atrás como fecha mínima por defecto
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const year = hace30Dias.getFullYear();
    const month = String(hace30Dias.getMonth() + 1).padStart(2, '0');
    const day = String(hace30Dias.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const { user } = useAuth();

  // Función para mostrar alerta emergente
  const mostrarAlertaEmergente = (tipo, texto) => {
    setTipoAlerta(tipo);
    setTextoAlerta(texto);
    setMostrarAlerta(true);
    
    // Ocultar la alerta después de 3 segundos
    setTimeout(() => {
      setMostrarAlerta(false);
    }, 3000);
  };

  // Función para obtener fecha local sin problemas de zona horaria
  // Mantiene la fecha del día hasta las 08:00 AM del siguiente día
  const obtenerFechaLocal = () => {
    const today = new Date();
    const hora = today.getHours();
    
    // Si es antes de las 08:00, usar el día anterior
    const fechaAUsar = hora < 8 ? new Date(today.getTime() - 24 * 60 * 60 * 1000) : today;
    
    const year = fechaAUsar.getFullYear();
    const month = String(fechaAUsar.getMonth() + 1).padStart(2, '0');
    const day = String(fechaAUsar.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para formatear fecha correctamente
  const formatearFechaParaBackend = (fechaInput) => {
    return fechaInput;
  };

  // Función para verificar si ya existe un registro para la fecha actual
  const verificarRegistroExistente = async (fechaSeleccionada, turnoSeleccionado) => {
    if (!user) return false;
    
    try {
      const { registros } = await procedimientosTENSAPI.obtenerTodos({
        fechaDesde: fechaSeleccionada,
        fechaHasta: fechaSeleccionada,
        turno: turnoSeleccionado,
        limit: 1
      });
      
      // Filtrar por usuario actual
      const registroUsuario = registros.find(r => r.usuarioId === user.id);
      return !!registroUsuario;
    } catch (error) {
      console.warn('No se pudo verificar registro existente:', error);
      return false;
    }
  };

  // Función para formatear fecha de YYYY-MM-DD a DD/MM/YYYY
  const formatearFechaParaMostrar = (fecha) => {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };

  // Función para obtener la fecha máxima permitida (siempre la fecha actual)
  const obtenerFechaMaxima = () => obtenerFechaLocal();

  // Función para formatear fecha de ingreso
  const formatearFechaIngreso = (fechaIngreso) => {
    if (!fechaIngreso) return null;
    return fechaIngreso.split(' ')[0];
  };

  // Función para formatear fecha de egreso
  const formatearFechaEgreso = (fechaEgreso) => {
    if (!fechaEgreso) return 'Fecha no disponible';
    
    let fechaSolo;
    
    if (fechaEgreso.includes('T')) {
      fechaSolo = fechaEgreso.split('T')[0];
    } else if (fechaEgreso.includes(' ')) {
      fechaSolo = fechaEgreso.split(' ')[0];
    } else {
      fechaSolo = fechaEgreso;
    }
    
    const [year, month, day] = fechaSolo.split('-');
    return `${day}/${month}/${year}`;
  };

  // Función para calcular la fecha mínima permitida basada en los pacientes
  const calcularFechaMinima = (todosPacientes) => {
    if (todosPacientes.length === 0) {
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      const year = hace30Dias.getFullYear();
      const month = String(hace30Dias.getMonth() + 1).padStart(2, '0');
      const day = String(hace30Dias.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Encontrar la fecha de ingreso más antigua
    const fechasIngreso = todosPacientes
      .map(p => formatearFechaIngreso(p.fechaIngresoUTI))
      .filter(f => f !== null)
      .sort();

    if (fechasIngreso.length > 0) {
      return fechasIngreso[0];
    }

    // Si no hay fechas de ingreso válidas, permitir desde 30 días atrás
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const year = hace30Dias.getFullYear();
    const month = String(hace30Dias.getMonth() + 1).padStart(2, '0');
    const day = String(hace30Dias.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Procedimientos habituales de TENS
  const procedimientosHabituales = [
    'Esterilización (conteo de materiales, recolección y traslados)',
    'Tareas administrativas (registros, evoluciones, etc)',
    'Entrega de turno',
    'Recepción de turno',
    'Toma de signos vitales (registro por paciente)',
    'Aseo y cuidados del paciente (aseo parcial o completo, cuidados de la piel, medición de deposiciones, etc)',
    'Administración de medicamentos oral/SNG/SNY/Gastrostomía/Broncodilatadores',
    'Preparación de medicamentos',
    'Preparación de carro para aseos',
    'Cambio de posición',
    'Medición de diuresis',
    'Toma de exámenes (hisopado rectal, muestra de orina, etc)',
    'Traslado a endoscopia',
    'Traslado a TAC sin contraste',
    'Traslado a TAC con contraste',
    'Traslado a RMN',
    'Traslado de paciente',
    'Atención post mortem (taponamiento de cuerpo, traslado, tarea administrativa etc)',
    'Traslado a pabellón',
    'Preparación de habitación para nuevo paciente (orden de cama e insumos clínicos)',
    'Recepción de ropa',
    'Limpieza de estación de enfermería y/o sala de estar',
  ];

  // Otras tareas de TENS
  const otrasTareas = [
    'Control de glicemia',
    'Instalación de CVC (asistencia)',
    'Instalación de CHD (asistencia)',
    'Asistencia en procedimientos de enfermería (instalación de LA, curaciones, toma de exámenes, etc)',
    'Asistencia en procedimientos de kinesiología (Kine motora o respiratoria, etc)',
    'IOT (asistencia)',
    'PCR (asistencia)',
    'Alimentación asistida',
    'Traslado interno',
    'Control de drenajes (vaciado y registro)',
    'Educación familiar',
    'Acompañamiento familiar'
  ];

  // Todos los procedimientos TENS combinados
  const todosProcedimientosTENS = [...procedimientosHabituales, ...otrasTareas];

  // Procedimientos que no requieren paciente específico (marcados con *)
  const procedimientosSinPaciente = [
    'Esterilización (conteo de materiales, recolección y traslados)',
    'Tareas administrativas (registros, evoluciones, etc)',
    'Preparación de medicamentos',
    'Preparación de carro para aseos',
    'Entrega de turno',
    'Recepción de turno',
    'Preparación de habitación para nuevo paciente (orden de cama e insumos clínicos)',
    'Recepción de ropa',
    'Limpieza de estación de enfermería y/o sala de estar'
  ];

  // Cargar pacientes cuando se abre el modal
  useEffect(() => {
    const cargarPacientes = async () => {
      if (isOpen) {
        setLoadingPacientes(true);
        try {
          const { activos, egresadosRecientes } = await pacienteService.obtenerPacientesParaProcedimientos();
          // Ordenar por número de cama
          const pacientesOrdenados = activos.sort((a, b) => {
            if (!a.camaAsignada && !b.camaAsignada) return 0;
            if (!a.camaAsignada) return 1;
            if (!b.camaAsignada) return -1;
            return (a.camaAsignada || 0) - (b.camaAsignada || 0);
          });
          setPacientes(pacientesOrdenados);
          setPacientesEgresados(egresadosRecientes);
          
          // Calcular y establecer la fecha mínima
          const todosLosPacientes = [...pacientesOrdenados, ...egresadosRecientes];
          const fechaMin = calcularFechaMinima(todosLosPacientes);
          setFechaMinima(fechaMin);
          
          // Ajustar la fecha actual si está fuera del rango permitido
          const fechaActual = obtenerFechaLocal();
          const fechaMax = obtenerFechaMaxima();
          if (fechaActual < fechaMin) {
            setFecha(fechaMin);
          } else if (fechaActual > fechaMax) {
            setFecha(fechaMax);
          }
        } catch (error) {
          console.warn('Error al cargar pacientes:', error);
        } finally {
          setLoadingPacientes(false);
        }
      }
    };
    
    cargarPacientes();
  }, [isOpen]);

  // Limpiar formulario al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setFecha(obtenerFechaLocal());
    } else {
      setTurno('Día');
      setProcedimientos([]);
      setNuevoProcedimiento({ nombre: '', tiempo: '00:00', pacienteRut: '' });
      setMensaje({ tipo: '', texto: '' });
      setYaExisteRegistroFecha(false);
      setFecha(obtenerFechaLocal());
    }
  }, [isOpen]);

  // Verificar si ya existe un registro para la fecha y turno seleccionados
  useEffect(() => {
    const checkearRegistroExistente = async () => {
      if (isOpen && user && fecha && turno) {
        try {
          const existeRegistro = await verificarRegistroExistente(fecha, turno);
          setYaExisteRegistroFecha(existeRegistro);
        } catch (error) {
          console.warn('No se pudo verificar registro existente:', error);
          setYaExisteRegistroFecha(false);
        }
      }
    };

    checkearRegistroExistente();
  }, [isOpen, fecha, turno, user]);

  // Verificar si el procedimiento seleccionado requiere paciente
  const requierePaciente = (nombreProcedimiento) => {
    return !procedimientosSinPaciente.includes(nombreProcedimiento);
  };

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
    // Validar que se haya seleccionado un paciente si el procedimiento lo requiere
    if (requierePaciente(nuevoProcedimiento.nombre) && !nuevoProcedimiento.pacienteRut) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona un paciente' });
      return;
    }

    const nuevoProcId = Date.now().toString();
    const pacienteSeleccionado = [...pacientes, ...pacientesEgresados].find(p => p.rut === nuevoProcedimiento.pacienteRut);
    
    const procAgregado = {
      id: nuevoProcId,
      nombre: nuevoProcedimiento.nombre,
      tiempo: nuevoProcedimiento.tiempo,
      pacienteRut: nuevoProcedimiento.pacienteRut || undefined,
      pacienteNombre: pacienteSeleccionado?.nombreCompleto || undefined
    };

    setProcedimientos([...procedimientos, procAgregado]);
    setNuevoProcedimiento({ nombre: '', tiempo: '', pacienteRut: '' });
    setMensaje({ tipo: 'success', texto: 'Procedimiento agregado al listado' });

    // Limpiar mensaje después de 2 segundos
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 2000);
  };

  // Eliminar procedimiento del listado
  const handleEliminarProcedimiento = (id) => {
    setProcedimientos(procedimientos.filter(p => p.id !== id));
  };

  // Guardar todos los procedimientos
  const handleGuardar = async () => {
    if (procedimientos.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Debes agregar al menos un procedimiento' });
      return;
    }

    // Verificar si ya existe un registro para esta fecha y turno
    if (yaExisteRegistroFecha) {
      setMensaje({ 
        tipo: 'error', 
        texto: `Ya tiene un registro de procedimientos TENS para el turno ${turno} del ${formatearFechaParaMostrar(fecha)}. No puede realizar múltiples registros en el mismo turno y fecha.` 
      });
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para el backend
      const procedimientosData = procedimientos.map(proc => ({
        nombre: proc.nombre,
        tiempo: proc.tiempo,
        pacienteRut: proc.pacienteRut
      }));

      // Guardar en el backend con fecha correctamente formateada
      await procedimientosTENSAPI.crear({
        turno,
        fecha: formatearFechaParaBackend(fecha),
        procedimientos: procedimientosData
      });
      
      // Mostrar alerta de éxito
      mostrarAlertaEmergente('success', 'Registro TENS guardado exitosamente');
      
      // Llamar callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      }
      
      // Cerrar modal después de un breve delay para que se vea la alerta
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error('Error al guardar:', error);
      const mensajeError = error instanceof Error ? error.message : 'Error al guardar el registro TENS';
      setMensaje({ tipo: 'error', texto: mensajeError });
      mostrarAlertaEmergente('error', mensajeError);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Alerta emergente - fuera del modal */}
      {mostrarAlerta && (
        <div className="fixed top-4 right-4 z-[60] transform transition-all duration-300 ease-in-out animate-pulse">
          <div className={`px-6 py-4 rounded-lg shadow-lg max-w-sm ${
            tipoAlerta === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {tipoAlerta === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {textoAlerta}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] md:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <h2 className="text-lg md:text-2xl font-bold">Registro de Procedimientos TENS</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1"
            disabled={loading}
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 md:p-6 overflow-y-auto pb-16 md:pb-6" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {/* Mensaje de feedback */}
          {mensaje.texto && (
            <div className={`mb-4 p-4 rounded-lg ${
              mensaje.tipo === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {mensaje.texto}
            </div>
          )}

          {/* Aviso de registro existente */}
          {yaExisteRegistroFecha && (
            <div className="mb-4 p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Registro existente para esta fecha y turno
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    Ya tiene un registro de procedimientos TENS para el turno {turno} del {formatearFechaParaMostrar(fecha)}. 
                    No puede realizar múltiples registros en el mismo turno y fecha.
                  </p>
                  <p className="text-sm text-orange-700 mt-2 font-medium">
                    Para continuar registrando actividades de su turno, diríjase al botón "Ver detalle" de su registro y presione el botón "Editar".
                  </p>
                </div>
              </div>
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
                    onChange={(e) => setTurno(e.target.value)}
                    className="w-4 h-4 text-blue-900"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm md:text-base text-gray-700">Día</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="Noche"
                    checked={turno === 'Noche'}
                    onChange={(e) => setTurno(e.target.value)}
                    className="w-4 h-4 text-blue-900"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm md:text-base text-gray-700">Noche</span>
                </label>
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                min={fechaMinima}
                max={obtenerFechaMaxima()}
                className="w-full px-3 md:px-4 py-2 bg-gray-50 text-gray-900 text-sm md:text-base rounded-lg focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* Formulario para agregar procedimiento */}
          <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Agregar Procedimiento TENS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
              {/* Seleccionar procedimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Procedimiento
                </label>
                <select
                  value={nuevoProcedimiento.nombre}
                  onChange={(e) => setNuevoProcedimiento({ ...nuevoProcedimiento, nombre: e.target.value, pacienteRut: '' })}
                  className="w-full px-3 md:px-4 py-2 bg-white text-gray-900 text-sm md:text-base rounded-lg focus:ring-2 focus:ring-blue-900 transition-all"
                  disabled={loading}
                >
                  <option value="">Seleccionar procedimiento...</option>
                  <optgroup label="Tareas habituales">
                    {procedimientosHabituales.map((proc, index) => (
                      <option key={`habitual-${index}`} value={proc}>{proc}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Otras tareas">
                    {otrasTareas.map((proc, index) => (
                      <option key={`otras-${index}`} value={proc}>{proc}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Tiempo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo (HH:MM)
                </label>
                <TimePicker
                  value={nuevoProcedimiento.tiempo || '00:00'}
                  onChange={(value) => setNuevoProcedimiento({ ...nuevoProcedimiento, tiempo: value })}
                  disabled={loading}
                />
              </div>

              {/* Paciente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paciente {requierePaciente(nuevoProcedimiento.nombre) && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={nuevoProcedimiento.pacienteRut}
                  onChange={(e) => setNuevoProcedimiento({ ...nuevoProcedimiento, pacienteRut: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 bg-white text-gray-900 text-sm md:text-base rounded-lg focus:ring-2 focus:ring-blue-900 transition-all disabled:bg-gray-100"
                  disabled={loading || loadingPacientes || !requierePaciente(nuevoProcedimiento.nombre)}
                >
                  <option value="">
                    {loadingPacientes ? 'Cargando pacientes...' : 
                     !requierePaciente(nuevoProcedimiento.nombre) ? 'No aplica' : 
                     'Seleccionar paciente...'}
                  </option>
                  {requierePaciente(nuevoProcedimiento.nombre) && (
                    <>
                      {/* Pacientes activos */}
                      {pacientes.length > 0 && (
                        <optgroup label="📋 Pacientes activos en UTI">
                          {pacientes.map((paciente) => (
                            <option key={paciente.rut} value={paciente.rut}>
                              {paciente.nombreCompleto} - Cama {paciente.camaAsignada || 'S/A'}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      
                      {/* Pacientes egresados en las últimas 24h */}
                      {pacientesEgresados.length > 0 && (
                        <optgroup label="📅 Egresados en últimas 24h">
                          {pacientesEgresados.map((paciente) => (
                            <option key={`egresado-${paciente.rut}`} value={paciente.rut}>
                              {paciente.nombreCompleto} - Egresado {formatearFechaEgreso(paciente.fechaEgresoUTI)}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Botón agregar */}
            <button
              onClick={handleAgregarProcedimiento}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
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
                        {proc.pacienteNombre && ` - Paciente: ${proc.pacienteNombre}`}
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
            className="hidden md:block w-full md:w-auto px-4 md:px-6 py-2.5 md:py-2 bg-gray-200 text-gray-700 text-sm md:text-base font-medium rounded-lg hover:bg-gray-300 transition-colors order-2 md:order-1"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="w-full md:w-auto px-4 md:px-6 py-2.5 md:py-2 bg-blue-900 text-white text-sm md:text-base font-medium rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed order-1 md:order-2"
            disabled={loading || procedimientos.length === 0 || yaExisteRegistroFecha}
          >
            {loading ? 'Guardando...' : yaExisteRegistroFecha ? 'Registro existente' : 'Guardar Registro TENS'}
          </button>
        </div>
        </div>
      </div>
    </>
  );
};

export default ModalProcedimientosTENS;
