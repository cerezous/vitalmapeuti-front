import React, { useState, useEffect } from 'react';
import { ProcedimientoKinesiologia } from '../services/procedimientosKinesiologiaAPI';
import procedimientosKinesiologiaAPI from '../services/procedimientosKinesiologiaAPI';
import { pacienteService, Paciente } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import TimePicker from './TimePicker';

interface ModalDetalleProcedimientoKinesiologiaProps {
  isOpen: boolean;
  onClose: () => void;
  procedimientos: ProcedimientoKinesiologia[];
  onUpdate?: () => void;
}

const ModalDetalleProcedimientoKinesiologia: React.FC<ModalDetalleProcedimientoKinesiologiaProps> = ({ 
  isOpen, 
  onClose, 
  procedimientos,
  onUpdate
}) => {
  const { user } = useAuth();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | ''; texto: string }>({ tipo: '', texto: '' });
  const [nuevoProcedimiento, setNuevoProcedimiento] = useState({
    nombre: '',
    tiempo: '00:00',
    pacienteRut: ''
  });
  const [fechaGrupo, setFechaGrupo] = useState<string>('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacientesEgresados, setPacientesEgresados] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [procedimientosEditables, setProcedimientosEditables] = useState<ProcedimientoKinesiologia[]>([]);
  const [procedimientosNuevos, setProcedimientosNuevos] = useState<ProcedimientoKinesiologia[]>([]);

  // Cargar pacientes cuando se entra en modo edición
  useEffect(() => {
    const cargarPacientes = async () => {
      if (modoEdicion) {
        setLoadingPacientes(true);
        try {
          const { activos, egresadosRecientes } = await pacienteService.obtenerPacientesParaProcedimientos();
          // Ordenar pacientes activos por número de cama
          const activosOrdenados = activos.sort((a, b) => (a.camaAsignada || 0) - (b.camaAsignada || 0));
          setPacientes(activosOrdenados);
          setPacientesEgresados(egresadosRecientes);
        } catch (error) {
          console.error('Error al cargar pacientes:', error);
          setMensaje({ tipo: 'error', texto: 'Error al cargar la lista de pacientes' });
        } finally {
          setLoadingPacientes(false);
        }
      }
    };
    cargarPacientes();
  }, [modoEdicion]);

  // Limpiar mensaje después de unos segundos
  useEffect(() => {
    if (mensaje.texto) {
      const timer = setTimeout(() => {
        setMensaje({ tipo: '', texto: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  // Inicializar procedimientos editables cuando se abre el modal
  useEffect(() => {
    if (isOpen && procedimientos.length > 0) {
      setProcedimientosEditables([...procedimientos]);
      setProcedimientosNuevos([]);
      setModoEdicion(false);
      setFechaGrupo(procedimientos[0]?.fecha || '');
    }
  }, [isOpen, procedimientos]);

  // Actualizar procedimientos editables cuando cambian los datos (después de guardar)
  useEffect(() => {
    if (isOpen && procedimientos.length > 0 && !modoEdicion) {
      setProcedimientosEditables([...procedimientos]);
      setProcedimientosNuevos([]);
    }
  }, [procedimientos, isOpen, modoEdicion]);

  // Forzar actualización cuando se guardan cambios
  useEffect(() => {
    if (isOpen && procedimientos.length > 0 && !modoEdicion) {
      setProcedimientosEditables([...procedimientos]);
    }
  }, [procedimientos.length]);

  if (!isOpen || !procedimientos || procedimientos.length === 0) return null;

  const primerProcedimiento = procedimientos[0];  // Verificar permisos de edición - solo el usuario que creó el primer procedimiento o administradores pueden editar
  const puedeEditar = user && (
    user.estamento === 'Administrador' || 
    procedimientos.some(proc => proc.usuarioId === user.id)
  );

  // Catálogo alineado con ModalRegistroProcedimientos
  const procedimientosKinesiologia = [
    'Tareas administrativas (evoluciones, estadísticas, reuniones clínicas, etc)',
    'Recepción de turno',
    'Entrega de turno',
    'Kinesiterapia respiratoria (Ev, KTR, EMR, instalación de oxigenoterapia, etc)',
    'Kinesiterapia motora',
    'Kinesiterapia integral (respiratorio + motor)',
    'Ingreso (recepción y evaluación del paciente)',
    'Traslado a otra unidad',
    'Cultivo de secreción bronquial',
    'Film array respiratorio',
    'Baciloscopía',
    'Instalación de VMNI',
    'Instalación de CNAF',
    'IOT',
    'PCR (incluye IOT por PCR)',
    'Instalación de TQT',
    'Cambio de TQT',
    'Decanulación',
    'TAC simple',
    'TAC con contraste',
    'RMN',
    'RMN con traslado a BUPA',
  ];

  const otrosProcedimientos = [
    'Asistencia en aseos (general o parcial)',
    'Instalación VVP',
    'Instalación CVC',
    'Instalación CHD',
    'Instalación LA',
    'Instalación PICCLINE',
    'Instalación de tunelizado',
    'Instalación de Cistotomia',
    'Instalación de Sonda Foley',
    'Instalación de Sonda rectal',
    'Instalación de gastrotomía',
    'Instalación de SNG',
    'Instalación de SNY',
    'Toma de exámenes',
    'Hemocultivos',
    'Electrocardiograma',
    'MAKI',
    'Endoscopía',
    'Colonoscopía',
    'Endoscopía + Colonoscopía',
    'Fibrobroncoscopía',
    'Ecografía',
    'Radiografía',
    'Toracocentesís',
    'Paracentesís',
    'Punción lumbar',
    'Mielograma',
    'Traslado a pabellón',
    'Curación simple',
    'Diálisis',
    'Curación avanzada'
  ];

  // Procedimientos que no requieren paciente
  const procedimientosSinPaciente = [
    'Tareas administrativas (evoluciones, estadísticas, reuniones clínicas, etc)',
    'Entrega de turno',
    'Recepción de turno'
  ];

  const formatearFecha = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatearTiempo = (tiempo: string) => {
    const [horas, minutos] = tiempo.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos;
    
    if (totalMinutos < 60) {
      return `${totalMinutos}m`;
    }
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Calcular tiempo total usando los procedimientos actuales
  const procedimientosActuales = modoEdicion ? procedimientosEditables : procedimientos;
  const tiempoTotal = procedimientosActuales.reduce((acc, p) => {
    const [h, m] = p.tiempo.split(':').map(Number);
    return acc + (h * 60) + m;
  }, 0);

  const formatearTiempoTotal = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${horas}h`;
    } else {
      return `${horas}h ${mins}m`;
    }
  };

  // Verificar si un procedimiento requiere paciente
  const requierePaciente = (nombreProcedimiento: string): boolean => {
    return !procedimientosSinPaciente.includes(nombreProcedimiento);
  };

  // Agregar nuevo procedimiento (solo a lista local)
  const agregarProcedimiento = () => {
    if (!nuevoProcedimiento.nombre || !nuevoProcedimiento.tiempo) {
      setMensaje({ tipo: 'error', texto: 'Por favor completa todos los campos requeridos' });
      return;
    }

    if (requierePaciente(nuevoProcedimiento.nombre) && !nuevoProcedimiento.pacienteRut) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona un paciente' });
      return;
    }

    // Encontrar el paciente seleccionado
    const pacienteSeleccionado = [...pacientes, ...pacientesEgresados].find(p => p.rut === nuevoProcedimiento.pacienteRut);

    // Crear procedimiento temporal con ID negativo
    const nuevoProcTemporal: ProcedimientoKinesiologia = {
      id: -(Date.now()), // ID negativo temporal
      nombre: nuevoProcedimiento.nombre,
      tiempo: nuevoProcedimiento.tiempo,
      fecha: primerProcedimiento.fecha,
      turno: primerProcedimiento.turno,
      pacienteRut: requierePaciente(nuevoProcedimiento.nombre) ? nuevoProcedimiento.pacienteRut : '', // Usar string vacío en lugar de null
      paciente: pacienteSeleccionado ? {
        nombreCompleto: pacienteSeleccionado.nombreCompleto,
        rut: pacienteSeleccionado.rut,
        numeroFicha: pacienteSeleccionado.numeroFicha || ''
      } : undefined,
      usuario: {
        nombres: user?.nombres || '',
        apellidos: user?.apellidos || '',
        usuario: user?.usuario || ''
      },
      observaciones: ''
    };

    // Agregar a listas locales
    setProcedimientosEditables([...procedimientosEditables, nuevoProcTemporal]);
    setProcedimientosNuevos([...procedimientosNuevos, nuevoProcTemporal]);
    
    // Limpiar formulario
    setNuevoProcedimiento({ nombre: '', tiempo: '00:00', pacienteRut: '' });
    setMensaje({ tipo: 'success', texto: 'Procedimiento agregado a la lista (sin guardar aún)' });
  };

  // Eliminar procedimiento (solo de lista local si es nuevo, o marcar para eliminación si es existente)
  const eliminarProcedimiento = (id: number) => {
    if (id < 0) {
      // Es un procedimiento nuevo, solo eliminarlo de las listas locales
      setProcedimientosEditables(procedimientosEditables.filter(proc => proc.id !== id));
      setProcedimientosNuevos(procedimientosNuevos.filter(proc => proc.id !== id));
    } else {
      // Es un procedimiento existente, solo eliminarlo de la lista editable
      // (se eliminará del servidor cuando se guarden los cambios)
      setProcedimientosEditables(procedimientosEditables.filter(proc => proc.id !== id));
    }
    setMensaje({ tipo: 'success', texto: 'Procedimiento eliminado de la lista' });
  };

  // Guardar todos los cambios
  const guardarCambios = async () => {
    setLoading(true);
    try {
      let nuevosProcedimientosDelBackend: ProcedimientoKinesiologia[] = [];

      // 0. Si la fecha cambió, actualizar todos los procedimientos existentes
      if (fechaGrupo && fechaGrupo !== primerProcedimiento.fecha) {
        const procedimientosExistentes = procedimientosEditables.filter(proc => proc.id && proc.id > 0);
        for (const proc of procedimientosExistentes) {
          if (proc.id) {
            await procedimientosKinesiologiaAPI.actualizar(proc.id, { fecha: fechaGrupo });
          }
        }
      }

      // 1. Agregar procedimientos nuevos
      if (procedimientosNuevos.length > 0) {
        const respuesta = await procedimientosKinesiologiaAPI.agregarProcedimientos({
          fecha: fechaGrupo || primerProcedimiento.fecha,
          turno: primerProcedimiento.turno || 'Día',
          procedimientos: procedimientosNuevos.map(proc => ({
            nombre: proc.nombre,
            tiempo: proc.tiempo,
            pacienteRut: proc.pacienteRut || undefined // Convertir string vacío a undefined
          }))
        });
        // La API de kinesiología devuelve directamente un array de procedimientos
        nuevosProcedimientosDelBackend = Array.isArray(respuesta) ? respuesta : [];
      }

      // 2. Eliminar procedimientos que ya no están en la lista editable
      const procedimientosAEliminar = procedimientos.filter(
        procOriginal => !procedimientosEditables.some(procEditable => procEditable.id === procOriginal.id)
      );

      for (const proc of procedimientosAEliminar) {
        if (proc.id) {
          await procedimientosKinesiologiaAPI.eliminar(proc.id);
        }
      }

      // 3. Actualizar inmediatamente el estado local con los datos actualizados
      const procedimientosActualizados = [
        ...procedimientos.filter(proc => 
          !procedimientosAEliminar.some(procEliminar => procEliminar.id === proc.id)
        ),
        ...nuevosProcedimientosDelBackend
      ];

      // Actualizar el estado local inmediatamente
      setProcedimientosEditables(procedimientosActualizados);
      
      // Actualizar el array de procedimientos del prop para que se refleje en la vista
      procedimientos.splice(0, procedimientos.length, ...procedimientosActualizados);
      
      setMensaje({ tipo: 'success', texto: 'Cambios guardados exitosamente' });
      
      // Salir del modo edición inmediatamente
      setModoEdicion(false);
      
      // Limpiar procedimientos nuevos ya que se han guardado
      setProcedimientosNuevos([]);
      
      // Refrescar datos del componente padre para obtener la información actualizada
      if (onUpdate) {
        onUpdate();
      }
      
      // Limpiar mensaje después de un breve delay
      setTimeout(() => {
        setMensaje({ tipo: '', texto: '' });
      }, 2000);
      
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      setMensaje({ tipo: 'error', texto: error instanceof Error ? error.message : 'Error al guardar cambios' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-xl max-w-6xl w-full max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-800 text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center rounded-t-lg md:rounded-t-2xl sticky top-0 z-10">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Registro de Procedimientos - Kinesiología</h2>
            <p className="text-xs md:text-sm text-gray-300">
              {formatearFecha(primerProcedimiento.fecha)} - Turno {primerProcedimiento.turno || 'No especificado'}
            </p>
          </div>
          <div className="flex items-center space-x-1 md:space-x-2">
            {puedeEditar && (
              <button
                onClick={() => setModoEdicion(!modoEdicion)}
                disabled={loading}
                className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  modoEdicion 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                }`}
              >
                {modoEdicion ? 'Ver Modo' : 'Editar'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-3 md:p-6 space-y-3 md:space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {/* Mensaje de estado */}
          {mensaje.texto && (
            <div className={`p-3 md:p-4 rounded-lg text-sm md:text-base ${
              mensaje.tipo === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {mensaje.texto}
            </div>
          )}

          {/* Resumen general */}
          <div className="bg-gray-50 rounded-lg p-3 md:p-4 border-2 border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 md:mb-3">Resumen del Turno</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Procedimientos</p>
                <p className="text-xl md:text-2xl font-bold text-gray-800">{procedimientosActuales.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Tiempo Total</p>
                <p className="text-xl md:text-2xl font-bold text-gray-800">{formatearTiempoTotal(tiempoTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Registrado Por</p>
                <p className="text-sm font-semibold text-gray-900">
                  {primerProcedimiento.usuario?.nombres} {primerProcedimiento.usuario?.apellidos}
                </p>
              </div>
            </div>
          </div>

          {/* Campo de fecha editable - Solo en modo edición */}
          {modoEdicion && puedeEditar && (
            <div className="bg-blue-50 rounded-lg p-3 md:p-4 border border-blue-200">
              <h3 className="text-base md:text-lg font-semibold text-blue-800 mb-3 md:mb-4">Información del Turno</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Turno <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center h-11 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    <label className="text-sm font-medium text-gray-900">
                      {primerProcedimiento.turno || 'No especificado'}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaGrupo}
                    onChange={(e) => setFechaGrupo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Formulario para agregar procedimiento - Solo en modo edición */}
          {modoEdicion && puedeEditar && (
            <div className="bg-blue-50 rounded-lg p-3 md:p-4 border border-blue-200">
              <h3 className="text-base md:text-lg font-semibold text-blue-800 mb-3 md:mb-4">Agregar Nuevo Procedimiento</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
                {/* Procedimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Procedimiento
                  </label>
                  <select
                    value={nuevoProcedimiento.nombre}
                    onChange={(e) => setNuevoProcedimiento(prev => ({ ...prev, nombre: e.target.value, pacienteRut: '' }))}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm md:text-base"
                    disabled={loading}
                  >
                    <option value="">Seleccionar procedimiento...</option>
                  <optgroup label="Procedimientos de Kinesiología">
                    {procedimientosKinesiologia.map((proc, index) => (
                      <option key={`kine-${index}`} value={proc}>{proc}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Otros procedimientos">
                    {otrosProcedimientos.map((proc, index) => (
                      <option key={`otros-${index}`} value={proc}>{proc}</option>
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
                    value={nuevoProcedimiento.tiempo}
                    onChange={(value) => setNuevoProcedimiento(prev => ({ ...prev, tiempo: value }))}
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
                    onChange={(e) => setNuevoProcedimiento(prev => ({ ...prev, pacienteRut: e.target.value }))}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-100 text-sm md:text-base"
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
                                {paciente.nombreCompleto} - Egresado {paciente.fechaEgresoUTI ? new Date(paciente.fechaEgresoUTI).toLocaleDateString('es-CL') : 'Fecha no disponible'}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <button
                onClick={agregarProcedimiento}
                disabled={!nuevoProcedimiento.nombre || !nuevoProcedimiento.tiempo || (requierePaciente(nuevoProcedimiento.nombre) && !nuevoProcedimiento.pacienteRut)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
              >
                Agregar Procedimiento
              </button>
            </div>
          )}

          {/* Lista de procedimientos */}
          <div className="space-y-2 md:space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Procedimientos Realizados ({procedimientosActuales.length})
            </h3>
            {procedimientosActuales.map((proc, index) => (
              <div key={proc.id} className={`bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200 ${modoEdicion && puedeEditar ? 'relative' : ''}`}>
                {modoEdicion && puedeEditar && (
                  <button
                    onClick={() => eliminarProcedimiento(proc.id!)}
                    disabled={loading}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-700 p-1.5 md:p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar procedimiento"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-6 md:pr-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <h4 className="text-sm md:text-base font-semibold text-gray-900">{proc.nombre}</h4>
                      {proc.id && proc.id < 0 && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Nuevo
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Paciente</p>
                        <p className="text-sm md:text-base font-medium text-gray-800">
                          {proc.paciente?.nombreCompleto || <span className="text-gray-500 italic">General del turno</span>}
                        </p>
                        {proc.paciente?.rut && (
                          <p className="text-xs text-gray-500">{proc.paciente.rut}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tiempo Dedicado</p>
                        <p className="text-sm md:text-base font-medium text-gray-800">{formatearTiempo(proc.tiempo)}</p>
                      </div>
                    </div>
                    {proc.observaciones && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Observaciones</p>
                        <p className="text-sm md:text-base text-gray-700">{proc.observaciones}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-3 md:p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg md:rounded-b-2xl sticky bottom-0 space-x-2">
          {modoEdicion && puedeEditar ? (
            <>
              <button
                onClick={() => {
                  setModoEdicion(false);
                  // Restaurar lista original
                  setProcedimientosEditables([...procedimientos]);
                  setProcedimientosNuevos([]);
                  setMensaje({ tipo: '', texto: '' });
                }}
                className="px-4 md:px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={guardarCambios}
                disabled={loading}
                className="px-4 md:px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 md:px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleProcedimientoKinesiologia;

