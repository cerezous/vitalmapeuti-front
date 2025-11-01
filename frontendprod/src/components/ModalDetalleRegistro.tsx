import React, { useState, useEffect } from 'react';
import { RegistroProcedimiento, ProcedimientoRegistroData } from '../services/registroProcedimientosAPI';
import registroProcedimientosAPI from '../services/registroProcedimientosAPI';
import { useAuth } from '../contexts/AuthContext';
import { pacienteService, Paciente } from '../services/api';
import TimePicker from './TimePicker';

interface ModalDetalleRegistroProps {
  isOpen: boolean;
  onClose: () => void;
  registro: RegistroProcedimiento | null;
  onUpdate?: () => void; // Callback para refrescar datos cuando se actualicen
}

// Función para formatear fecha sin problemas de zona horaria
const formatearFechaSinZonaHoraria = (fechaStr: string): string => {
  // Si la fecha viene como "2025-10-13", la mostramos directamente sin conversiones
  if (fechaStr && fechaStr.includes('-')) {
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  }
  return fechaStr;
};

const ModalDetalleRegistro: React.FC<ModalDetalleRegistroProps> = ({ isOpen, onClose, registro, onUpdate }) => {
  const { user } = useAuth();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [nuevoProcedimiento, setNuevoProcedimiento] = useState({
    nombre: '',
    tiempo: '00:00',
    pacienteRut: ''
  });
  const [fechaRegistro, setFechaRegistro] = useState<string>('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacientesEgresados, setPacientesEgresados] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | ''; texto: string }>({ tipo: '', texto: '' });
  const [procedimientosEditables, setProcedimientosEditables] = useState<any[]>([]);
  const [procedimientosAEliminar, setProcedimientosAEliminar] = useState<number[]>([]);
  const [procedimientoEditando, setProcedimientoEditando] = useState<number | null>(null);
  const [procedimientoEditado, setProcedimientoEditado] = useState<any | null>(null);

  // Verificar si el usuario actual puede editar (es el propietario del registro o es administrador)
  const puedeEditar = user && registro && (registro.usuarioId === user.id || user.estamento === 'Administrador');

  // Cargar pacientes cuando se abre el modal y entra en modo edición
  useEffect(() => {
    const cargarPacientes = async () => {
      if (modoEdicion && pacientes.length === 0) {
        try {
          const { activos, egresadosRecientes } = await pacienteService.obtenerPacientesParaProcedimientos();
          // Ordenar pacientes por número de cama
          const pacientesOrdenados = activos.sort((a, b) => {
            // Pacientes sin cama al final
            if (!a.camaAsignada && !b.camaAsignada) return 0;
            if (!a.camaAsignada) return 1;
            if (!b.camaAsignada) return -1;
            // Ordenar por número de cama
            return (a.camaAsignada || 0) - (b.camaAsignada || 0);
          });
          setPacientes(pacientesOrdenados);
          setPacientesEgresados(egresadosRecientes);
        } catch (error) {
          console.error('Error al cargar pacientes:', error);
        }
      }
    };
    
    if (isOpen && modoEdicion) {
      cargarPacientes();
    }
  }, [modoEdicion, isOpen, pacientes.length]);

  // Inicializar procedimientos editables cuando se entra al modo edición
  useEffect(() => {
    if (modoEdicion && registro && registro.procedimientos) {
      setProcedimientosEditables([...registro.procedimientos]);
      setFechaRegistro(registro.fecha);
    } else if (!modoEdicion) {
      setProcedimientosEditables([]);
      setProcedimientosAEliminar([]);
      setFechaRegistro('');
    }
  }, [modoEdicion, registro]);

  // Limpiar estado al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      setModoEdicion(false);
      setNuevoProcedimiento({ nombre: '', tiempo: '00:00', pacienteRut: '' });
      setMensaje({ tipo: '', texto: '' });
      setProcedimientosEditables([]);
      setProcedimientosAEliminar([]);
      setProcedimientoEditando(null);
      setProcedimientoEditado(null);
    }
  }, [isOpen]);

  // Tareas habituales de Enfermería - deben coincidir con ModalRegistroProcedimientosEnfermeria
  const tareasHabituales = [
    'Entrega de turno',
    'Recepción de turno',
    'Tareas Administrativas (redacción de ingresos/traslados, evoluciones, categorización, estadística, etc)',
    'Curación avanzada',
    'Diálisis',
    'Atención de enfermería (evaluación, curación simple, administración de medicamentos, etc)',
    'Hemocultivos (incluye registro administrativo)',
    'Ingreso (recepción de paciente)',
    'Instalación LA',
    'Instalación SNG',
    'Instalación de Sonda Foley',
    'Instalación VVP',
    'MAKI (incluye registro administrativo)',
    'Preparación de medicamentos',
    'TAC con contraste',
    'TAC simple',
    'Toma de exámenes (incluye registro administrativo)',
    'Traslado (Incluye tarea administrativa)'
  ];

  // Otras tareas de Enfermería - deben coincidir con ModalRegistroProcedimientosEnfermeria
  const otrasTareas = [
    'Cambio de TQT',
    'Cateterismo vesical',
    'Colonoscopía',
    'Decanulación',
    'Ecografía',
    'Electrocardiograma',
    'Endoscopía',
    'Endoscopía + Colonoscopía',
    'Fibrobroncoscopía',
    'IOT',
    'Instalación CHD',
    'Instalación CVC',
    'Instalación de Cistotomia',
    'Instalación de gastrotomía',
    'Instalación de Sonda rectal',
    'Instalación de TQT',
    'Instalación de tunelizado',
    'Instalación PICCLINE',
    'Instalación de SNY',
    'Mielograma',
    'Paracentesís',
    'PCR (incluye IOT por PCR)',
    'Premeditación QMT',
    'Punción lumbar',
    'Radiografía',
    'RMN',
    'RMN con traslado a BUPA',
    'Toracocentesís',
    'Traslado a pabellón'
  ];

  // Procedimientos que no requieren paciente - deben coincidir con ModalRegistroProcedimientosEnfermeria
  const procedimientosSinPaciente = [
    'Tareas Administrativas (redacción de ingresos/traslados, evoluciones, categorización, estadística, etc)',
    'Entrega de turno',
    'Recepción de turno',
    'Preparación de medicamentos',
    'Toma de exámenes (incluye registro administrativo)',
  ];

  const formatearTiempo = (tiempo: string): string => {
    return tiempo; // Ya viene en formato HH:MM
  };

  // Verificar si el procedimiento seleccionado requiere paciente
  const requierePaciente = (nombreProcedimiento: string): boolean => {
    return !procedimientosSinPaciente.includes(nombreProcedimiento);
  };

  const formatearTiempoTotal = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0) {
      return `${horas} hora${horas > 1 ? 's' : ''} ${mins} minuto${mins !== 1 ? 's' : ''}`;
    }
    return `${mins} minuto${mins !== 1 ? 's' : ''}`;
  };

  const calcularTiempoTotal = (): number => {
    if (!registro) return 0;
    const procedimientosParaCalcular = modoEdicion && puedeEditar ? procedimientosEditables : registro.procedimientos || [];
    return procedimientosParaCalcular.reduce((total, proc) => {
      const [h, m] = proc.tiempo.split(':').map(Number);
      return total + (h * 60) + m;
    }, 0);
  };

  const formatearTiempoTotalCompleto = (minutos: number): string => {
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

  const agregarNuevoProcedimiento = () => {
    if (!nuevoProcedimiento.nombre || !nuevoProcedimiento.tiempo) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar un procedimiento y especificar el tiempo' });
      return;
    }

    // Validar que se haya seleccionado un paciente si el procedimiento lo requiere
    if (requierePaciente(nuevoProcedimiento.nombre) && !nuevoProcedimiento.pacienteRut) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona un paciente' });
      return;
    }

    // Encontrar el paciente seleccionado
    const pacienteSeleccionado = [...pacientes, ...pacientesEgresados].find(p => p.rut === nuevoProcedimiento.pacienteRut);

    // Crear un procedimiento temporal con ID negativo para distinguirlo de los existentes
    const nuevoProcTemporal = {
      id: -(Date.now()), // ID negativo temporal
      nombre: nuevoProcedimiento.nombre,
      tiempo: nuevoProcedimiento.tiempo,
      pacienteRut: nuevoProcedimiento.pacienteRut || undefined,
      paciente: pacienteSeleccionado ? {
        nombreCompleto: pacienteSeleccionado.nombreCompleto,
        rut: pacienteSeleccionado.rut,
        numeroFicha: pacienteSeleccionado.numeroFicha,
        camaAsignada: pacienteSeleccionado.camaAsignada
      } : undefined
    };

    setProcedimientosEditables([...procedimientosEditables, nuevoProcTemporal]);
    setNuevoProcedimiento({ nombre: '', tiempo: '', pacienteRut: '' });
    setMensaje({ tipo: '', texto: '' });
  };

  const eliminarProcedimiento = async (id: number) => {
    // Si es un procedimiento existente (ID positivo), eliminarlo directamente del servidor
    if (id > 0 && registro) {
      try {
        setLoading(true);
        await registroProcedimientosAPI.eliminarProcedimiento(registro.id, id);
        
        // Actualizar la lista local
        setProcedimientosEditables(procedimientosEditables.filter(proc => proc.id !== id));
        
        // Actualizar el registro original
        if (registro.procedimientos) {
          registro.procedimientos = registro.procedimientos.filter(proc => proc.id !== id);
        }
        
        setMensaje({ tipo: 'success', texto: 'Procedimiento eliminado exitosamente' });
        
        // Refrescar datos
        if (onUpdate) {
          setTimeout(() => onUpdate(), 1000);
        }
        
      } catch (error: any) {
        setMensaje({ tipo: 'error', texto: error.message || 'Error al eliminar el procedimiento' });
      } finally {
        setLoading(false);
      }
    } else {
      // Si es un procedimiento temporal (ID negativo), solo removerlo de la lista
      setProcedimientosEditables(procedimientosEditables.filter(proc => proc.id !== id));
      setMensaje({ tipo: '', texto: '' });
    }
  };

  const iniciarEdicionProcedimiento = async (procedimiento: any) => {
    setProcedimientoEditando(procedimiento.id);
    setProcedimientoEditado({ ...procedimiento });
    
    // Cargar pacientes si no están cargados
    if (pacientes.length === 0) {
      try {
        const { activos, egresadosRecientes } = await pacienteService.obtenerPacientesParaProcedimientos();
        // Ordenar pacientes por número de cama
        const pacientesOrdenados = activos.sort((a, b) => {
          // Pacientes sin cama al final
          if (!a.camaAsignada && !b.camaAsignada) return 0;
          if (!a.camaAsignada) return 1;
          if (!b.camaAsignada) return -1;
          // Ordenar por número de cama
          return (a.camaAsignada || 0) - (b.camaAsignada || 0);
        });
        setPacientes(pacientesOrdenados);
        setPacientesEgresados(egresadosRecientes);
      } catch (error) {
        console.error('Error al cargar pacientes para edición:', error);
      }
    }
  };

  const cancelarEdicionProcedimiento = () => {
    setProcedimientoEditando(null);
    setProcedimientoEditado(null);
  };

  const actualizarProcedimientoEditado = (campo: string, valor: string) => {
    if (procedimientoEditado) {
      setProcedimientoEditado({
        ...procedimientoEditado,
        [campo]: valor
      });
    }
  };

  const guardarProcedimientoEditado = async () => {
    if (!procedimientoEditado || !registro) return;

    // Validar datos
    if (!procedimientoEditado.nombre || !procedimientoEditado.tiempo) {
      setMensaje({ tipo: 'error', texto: 'Debe especificar el nombre del procedimiento y el tiempo' });
      return;
    }

    try {
      setLoading(true);
      
      // Actualizar el procedimiento en el servidor
      await registroProcedimientosAPI.actualizarProcedimiento(registro.id, procedimientoEditado.id, {
        nombre: procedimientoEditado.nombre,
        tiempo: procedimientoEditado.tiempo,
        pacienteRut: procedimientoEditado.pacienteRut
      });

      // Actualizar el procedimiento en la lista local
      setProcedimientosEditables(procedimientosEditables.map(proc => 
        proc.id === procedimientoEditado.id ? procedimientoEditado : proc
      ));

      // Actualizar el registro original
      if (registro.procedimientos) {
        const index = registro.procedimientos.findIndex(proc => proc.id === procedimientoEditado.id);
        if (index !== -1) {
          registro.procedimientos[index] = procedimientoEditado;
        }
      }

      // Limpiar estado de edición
      setProcedimientoEditando(null);
      setProcedimientoEditado(null);
      setMensaje({ tipo: 'success', texto: 'Procedimiento actualizado' });

      // Limpiar mensaje después de un breve delay
      setTimeout(() => {
        setMensaje({ tipo: '', texto: '' });
      }, 2000);

    } catch (error: any) {
      console.error('Error al actualizar procedimiento:', error);
      setMensaje({ 
        tipo: 'error', 
        texto: error.message || 'Error al actualizar el procedimiento'
      });
    } finally {
      setLoading(false);
    }
  };

  const guardarCambios = async () => {
    try {
      setLoading(true);
      setMensaje({ tipo: '', texto: '' });

      if (!registro) {
        setMensaje({ tipo: 'error', texto: 'Error: No se encontró el registro' });
        return;
      }

      // Si la fecha cambió, actualizarla
      if (fechaRegistro && fechaRegistro !== registro.fecha) {
        await registroProcedimientosAPI.actualizarRegistro(registro.id, { fecha: fechaRegistro });
      }

      // Obtener solo los procedimientos nuevos (ID negativo)
      const procedimientosNuevos = procedimientosEditables.filter(proc => proc.id < 0);

      // Si hay procedimientos nuevos, agregarlos al registro existente
      if (procedimientosNuevos.length > 0) {
        const procedimientosData: ProcedimientoRegistroData[] = procedimientosNuevos.map(proc => ({
          nombre: proc.nombre,
          tiempo: proc.tiempo,
          pacienteRut: proc.pacienteRut
        }));

        await registroProcedimientosAPI.agregarProcedimientos(registro.id, procedimientosData);
        
        setMensaje({ tipo: 'success', texto: 'Procedimientos agregados exitosamente' });
      } else {
        setMensaje({ tipo: 'success', texto: 'Cambios guardados exitosamente' });
      }
      
      // Refrescar datos y cerrar modo edición
      setTimeout(() => {
        if (onUpdate) {
          onUpdate();
        }
        setModoEdicion(false);
        setMensaje({ tipo: '', texto: '' });
      }, 1500);

    } catch (error: any) {
      console.error('Error al guardar cambios:', error);
      setMensaje({ 
        tipo: 'error', 
        texto: error.message || 'Error al guardar los cambios'
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha de egreso
  const formatearFechaEgreso = (fechaEgreso: string | null | undefined): string => {
    if (!fechaEgreso) return 'Fecha no disponible';
    
    let fechaSolo: string;
    
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

  // Condición de retorno después de todos los hooks
  if (!isOpen || !registro) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] md:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center rounded-t-lg md:rounded-t-2xl">
          <h2 className="text-lg md:text-2xl font-bold">
            Detalle del Registro - Enfermería
            {modoEdicion && <span className="ml-2 text-xs md:text-sm font-normal">(Modo Edición)</span>}
          </h2>
          <div className="flex items-center space-x-2">
            {puedeEditar && (
              <button
                onClick={() => setModoEdicion(!modoEdicion)}
                className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
                  modoEdicion 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
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
        {modoEdicion && puedeEditar ? (
          <form className="p-3 md:p-6 space-y-4 md:space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
            {/* Mensaje de estado */}
            {mensaje.texto && (
              <div className={`p-4 rounded-lg ${
                mensaje.tipo === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {mensaje.texto}
              </div>
            )}

            {/* Información del turno - Solo en modo edición */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turno <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center h-11 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-900">
                    {registro.turno}
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={fechaRegistro}
                  onChange={(e) => setFechaRegistro(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            {/* Agregar procedimiento - Solo en modo edición */}
            <div className="bg-gray-50 p-3 md:p-4 rounded-lg space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Agregar Procedimiento</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Procedimiento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={nuevoProcedimiento.nombre}
                    onChange={(e) => setNuevoProcedimiento({ ...nuevoProcedimiento, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Seleccione...</option>
                    
                    {/* Tareas habituales */}
                    <optgroup label="📋 Tareas habituales">
                      {tareasHabituales.map((proc, index) => (
                        <option key={`habitual-${index}`} value={proc}>{proc}</option>
                      ))}
                    </optgroup>
                    
                    {/* Otras tareas */}
                    <optgroup label="⚕️ Otras tareas">
                      {otrasTareas.map((proc, index) => (
                        <option key={`otras-${index}`} value={proc}>{proc}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paciente {requierePaciente(nuevoProcedimiento.nombre) && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={nuevoProcedimiento.pacienteRut}
                    onChange={(e) => setNuevoProcedimiento({ ...nuevoProcedimiento, pacienteRut: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 disabled:bg-gray-100"
                    disabled={!requierePaciente(nuevoProcedimiento.nombre)}
                  >
                    <option value="">
                      {!requierePaciente(nuevoProcedimiento.nombre) ? 'No aplica' : 'Sin paciente específico'}
                    </option>
                    {requierePaciente(nuevoProcedimiento.nombre) && (
                      <>
                        {/* Pacientes activos */}
                        {pacientes.length > 0 && (
                          <optgroup label="📋 Pacientes activos en UTI">
                            {pacientes.map((paciente) => (
                              <option key={paciente.id} value={paciente.rut}>
                                {paciente.nombreCompleto} - Cama: {paciente.camaAsignada || 'Sin asignar'}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        
                        {/* Pacientes egresados */}
                        {pacientesEgresados.length > 0 && (
                          <optgroup label="📅 Pacientes egresados en las últimas 48 horas">
                            {pacientesEgresados.map((paciente) => (
                              <option key={`egresado-${paciente.id}`} value={paciente.rut}>
                                {paciente.nombreCompleto} - Egresado {formatearFechaEgreso(paciente.fechaEgresoUTI)}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiempo (HH:MM) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <TimePicker
                        value={nuevoProcedimiento.tiempo || '00:00'}
                        onChange={(value) => setNuevoProcedimiento({ ...nuevoProcedimiento, tiempo: value })}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={agregarNuevoProcedimiento}
                      className="px-3 md:px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de procedimientos editables - Solo en modo edición */}
            {procedimientosEditables.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Procedimientos del Turno</h3>
                  <span className="text-sm font-medium text-gray-600">
                    Tiempo Total: {formatearTiempoTotalCompleto(calcularTiempoTotal())}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {procedimientosEditables.map((proc, index) => (
                    <div key={proc.id} className="bg-white border border-gray-200 rounded-lg p-3 md:p-4">
                      {procedimientoEditando === proc.id ? (
                        // Modo edición inline
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                              #{index + 1} - Editando
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Procedimiento <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={procedimientoEditado?.nombre || ''}
                                onChange={(e) => actualizarProcedimientoEditado('nombre', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                              >
                                <option value="">Seleccione...</option>
                                
                                {/* Tareas habituales */}
                                <optgroup label="📋 Tareas habituales">
                                  {tareasHabituales.map((proc, index) => (
                                    <option key={`habitual-${index}`} value={proc}>{proc}</option>
                                  ))}
                                </optgroup>
                                
                                {/* Otras tareas */}
                                <optgroup label="⚕️ Otras tareas">
                                  {otrasTareas.map((proc, index) => (
                                    <option key={`otras-${index}`} value={proc}>{proc}</option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Paciente {requierePaciente(procedimientoEditado?.nombre || '') && <span className="text-red-500">*</span>}
                              </label>
                              <select
                                value={procedimientoEditado?.pacienteRut || ''}
                                onChange={(e) => actualizarProcedimientoEditado('pacienteRut', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 disabled:bg-gray-100"
                                disabled={!requierePaciente(procedimientoEditado?.nombre || '')}
                              >
                                <option value="">
                                  {!requierePaciente(procedimientoEditado?.nombre || '') ? 'No aplica' : 'Sin paciente específico'}
                                </option>
                                {requierePaciente(procedimientoEditado?.nombre || '') && (
                                  <>
                                    {pacientes.length > 0 && (
                                      <optgroup label="📋 Pacientes activos en UTI">
                                        {pacientes.map((paciente) => (
                                          <option key={paciente.id} value={paciente.rut}>
                                            {paciente.nombreCompleto} - Cama: {paciente.camaAsignada || 'Sin asignar'}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                    {pacientesEgresados.length > 0 && (
                                      <optgroup label="📅 Pacientes egresados en las últimas 48 horas">
                                        {pacientesEgresados.map((paciente) => (
                                          <option key={`egresado-${paciente.id}`} value={paciente.rut}>
                                            {paciente.nombreCompleto} - Egresado {formatearFechaEgreso(paciente.fechaEgresoUTI)}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                  </>
                                )}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiempo (HH:MM) <span className="text-red-500">*</span>
                              </label>
                              <TimePicker
                                value={procedimientoEditado?.tiempo || '00:00'}
                                onChange={(value) => actualizarProcedimientoEditado('tiempo', value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={cancelarEdicionProcedimiento}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={guardarProcedimientoEditado}
                              className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
                            >
                              Guardar Cambios
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Modo visualización
                        <div className="flex items-center justify-between">
                          <div className="flex-1 pr-6 md:pr-8">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-blue-900 text-white text-xs font-semibold px-2 py-1 rounded">
                                #{index + 1}
                              </span>
                              <p className="text-sm md:text-base font-semibold text-gray-900">{proc.nombre}</p>
                              {proc.id < 0 && (
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
                          </div>
                          <div className="flex items-center gap-2">
                            {proc.id > 0 && (
                              <button
                                type="button"
                                onClick={() => iniciarEdicionProcedimiento(proc)}
                                className="text-blue-600 hover:text-blue-700 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all"
                                title="Editar procedimiento"
                              >
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => eliminarProcedimiento(proc.id)}
                              className="text-red-600 hover:text-red-700 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all"
                              title="Eliminar procedimiento"
                            >
                              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        ) : (
          <div className="p-3 md:p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
            {/* Mensaje de estado */}
            {mensaje.texto && (
              <div className={`p-4 rounded-lg mb-6 ${
                mensaje.tipo === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {mensaje.texto}
              </div>
            )}

            {/* Información general */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-6 mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Información General</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div>
                  <p className="text-sm text-gray-500">Turno</p>
                  <p className="font-semibold text-gray-800">{registro.turno}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-semibold text-gray-800">
                    {formatearFechaSinZonaHoraria(registro.fecha)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tiempo Total</p>
                  <p className="font-semibold text-gray-800">{formatearTiempoTotal(registro.tiempoTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registrado por</p>
                  <p className="font-semibold text-gray-800">{registro.usuario.nombres} {registro.usuario.apellidos}</p>
                </div>
              </div>
            </div>

            {/* Procedimientos */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
                Procedimientos ({registro.procedimientos?.length || 0})
              </h3>
              {registro.procedimientos && registro.procedimientos.length > 0 ? (
                <div className="space-y-3">
                  {registro.procedimientos.map((proc, index) => (
                    <div key={proc.id} className="bg-white rounded-lg p-3 md:p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-900 text-white text-xs font-semibold px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <p className="text-sm md:text-base font-semibold text-gray-800">{proc.nombre}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay procedimientos registrados</p>
              )}
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-3 md:px-6 py-3 md:py-4 flex justify-end space-x-2 md:space-x-3 pt-4 border-t border-gray-200 rounded-b-lg md:rounded-b-2xl">
          {modoEdicion && puedeEditar ? (
            <>
              <button
                type="button"
                onClick={() => setModoEdicion(false)}
                className="px-4 md:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarCambios}
                disabled={loading}
                className="px-4 md:px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 md:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleRegistro;

