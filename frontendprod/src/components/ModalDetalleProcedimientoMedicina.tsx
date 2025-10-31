import React, { useState, useEffect } from 'react';
import { ProcedimientoMedicina, ProcedimientoMedicinaData } from '../services/medicinaAPI';
import medicinaAPI from '../services/medicinaAPI';
import { useAuth } from '../contexts/AuthContext';
import { pacienteService, Paciente } from '../services/api';
import axios from 'axios';
import { getApiBaseUrl } from '../services/api';
import TimePicker from './TimePicker';

interface ModalDetalleProcedimientoMedicinaProps {
  isOpen: boolean;
  onClose: () => void;
  procedimiento?: ProcedimientoMedicina | null;
  procedimientos?: ProcedimientoMedicina[];
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

const ModalDetalleProcedimientoMedicina: React.FC<ModalDetalleProcedimientoMedicinaProps> = ({ 
  isOpen, 
  onClose, 
  procedimiento,
  procedimientos,
  onUpdate
}) => {
  const { user } = useAuth();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [nuevoProcedimiento, setNuevoProcedimiento] = useState({
    nombre: '',
    tiempo: '00:00',
    pacienteRut: '',
    observaciones: ''
  });
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacientesEgresados, setPacientesEgresados] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | ''; texto: string }>({ tipo: '', texto: '' });
  const [procedimientosEditables, setProcedimientosEditables] = useState<ProcedimientoMedicina[]>([]);
  const [procedimientosAEliminar, setProcedimientosAEliminar] = useState<number[]>([]);
  const [procedimientoEditando, setProcedimientoEditando] = useState<number | null>(null);
  const [procedimientoEditado, setProcedimientoEditado] = useState<ProcedimientoMedicina | null>(null);

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
    if (modoEdicion && procedimientos && procedimientos.length > 0) {
      setProcedimientosEditables([...procedimientos]);
    } else if (modoEdicion && procedimiento) {
      setProcedimientosEditables([procedimiento]);
    } else if (!modoEdicion) {
      setProcedimientosEditables([]);
      setProcedimientosAEliminar([]);
    }
  }, [modoEdicion, procedimientos, procedimiento]);

  // Actualizar procedimientos editables cuando cambian los datos (después de guardar)
  useEffect(() => {
    if (isOpen && procedimientos && procedimientos.length > 0 && !modoEdicion) {
      setProcedimientosEditables([...procedimientos]);
      setProcedimientosAEliminar([]);
    }
  }, [procedimientos, isOpen, modoEdicion]);

  // Forzar actualización cuando se guardan cambios
  useEffect(() => {
    if (isOpen && procedimientos && procedimientos.length > 0 && !modoEdicion) {
      setProcedimientosEditables([...procedimientos]);
    }
  }, [procedimientos?.length]);

  // Limpiar estado al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      setModoEdicion(false);
      setNuevoProcedimiento({ nombre: '', tiempo: '00:00', pacienteRut: '', observaciones: '' });
      setMensaje({ tipo: '', texto: '' });
      setProcedimientosEditables([]);
      setProcedimientosAEliminar([]);
      setProcedimientoEditando(null);
      setProcedimientoEditado(null);
    }
  }, [isOpen]);

  if (!isOpen || (!procedimiento && (!procedimientos || procedimientos.length === 0))) return null;
  
  // Determinar si estamos mostrando un procedimiento individual o un grupo
  const esGrupo = procedimientos && procedimientos.length > 0;
  const datosParaMostrar = esGrupo ? procedimientos : [procedimiento!];
  
  // Verificar si el usuario actual puede editar (es el propietario del registro)
  const puedeEditar = user && datosParaMostrar.length > 0 && datosParaMostrar.every(proc => proc.usuarioId === user.id);

  // Obtener procedimientos válidos - deben coincidir con ModalRegistroProcedimientosMedicina
  const procedimientosMedicina = [
    'Tareas administrativas (evoluciones, revisión de HC, indicaciones, recetas, etc)',
    'Logística (solicitud de insumos o situación similar por la cual se debe retrasar un procedimiento)',
    'Interconsulta (lectura de HC, evaluación/reevaluación, evolución)',
    'Informe médico (redacción para traslados)',
    'Egreso (redacción de egreso, indicaciones, etc)',
    'Entrega de turno',
    'Recepción de turno',
    'Discusión con especialidades',
    'Visita clínica',
    'Redacción de licencia médica',
    'Desfibrilación o cardioversión',
    'Ingreso (redacción de ingreso, evaluación y procedimientos correspondientes)',
    'Instalación CHD',
    'Instalación CVC',
    'Interconsulta (lectura de HC, evaluación/reevaluación, evolución)',
    'IOT',
    'PCR (incluye IOT por PCR)'
  ];

  // Otros procedimientos (requieren paciente específico) - ordenados alfabéticamente
  const otrosProcedimientos = [
    'Cambio de TQT',
    'Colonoscopía (indicación de sedación y/o supervisión)',
    'Decanulación',
    'Ecografía',
    'Endoscopía (indicación de sedación y/o supervisión)',
    'Endoscopía + Colonoscopía (indicación de sedación y/o supervisión)',
    'Fibrobroncoscopía (indicación de sedación, supervisión o realización del procedimiento)',
    'Instalación de Cistotomia (indicación de sedación/analgesia o supervisión)',
    'Instalación de gastrotomía (indicación de sedación y/o supervisión)',
    'Instalación de SNY (indicación de sedación y/o supervisión)',
    'Instalación de TQT',
    'Instalación de tunelizado (indicación de sedación y/o supervisión)',
    'Instalación LA',
    'Instalación PICCLINE',
    'Mielograma (indicación de analgesia, supervisión o realización del procedimiento)',
    'Paracentesís (supervisión o realización del procedimiento)',
    'Punción lumbar (indicación de sedación, supervisión o realización del procedimiento)',
    'Toracocentesís (indicación de sedación/analgesia, supervisión o realización del procedimiento)'
  ];

  const todosLosProcedimientos = [...procedimientosMedicina, ...otrosProcedimientos];

  // Verificar si un procedimiento requiere paciente - debe coincidir con ModalRegistroProcedimientosMedicina
  const requierePaciente = (nombreProcedimiento: string): boolean => {
    // Los procedimientos habituales de medicina usan la lógica original
    if (procedimientosMedicina.includes(nombreProcedimiento)) {
      return medicinaAPI.requierePaciente(nombreProcedimiento);
    }
    
    // Todos los "otros procedimientos" requieren paciente
    if (otrosProcedimientos.includes(nombreProcedimiento)) {
      return true;
    }
    
    return false;
  };

  const agregarNuevoProcedimiento = () => {
    if (!nuevoProcedimiento.nombre || !nuevoProcedimiento.tiempo) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar un procedimiento y especificar el tiempo' });
      return;
    }

    if (requierePaciente(nuevoProcedimiento.nombre) && !nuevoProcedimiento.pacienteRut) {
      setMensaje({ tipo: 'error', texto: 'Este procedimiento requiere seleccionar un paciente' });
      return;
    }

    // Encontrar el paciente seleccionado
    const pacienteSeleccionado = [...pacientes, ...pacientesEgresados].find(p => p.rut === nuevoProcedimiento.pacienteRut);

    // Crear un procedimiento temporal con ID negativo para distinguirlo de los existentes
    const nuevoProcTemporal: ProcedimientoMedicina = {
      id: -(Date.now()), // ID negativo temporal
      usuarioId: user?.id || 0,
      turno: datosParaMostrar[0].turno,
      fecha: datosParaMostrar[0].fecha,
      nombre: nuevoProcedimiento.nombre,
      tiempo: nuevoProcedimiento.tiempo,
      pacienteRut: nuevoProcedimiento.pacienteRut || undefined,
      observaciones: nuevoProcedimiento.observaciones || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usuario: {
        nombres: user?.nombres || '',
        apellidos: user?.apellidos || '',
        usuario: user?.usuario || '',
        estamento: user?.estamento || ''
      },
      paciente: pacienteSeleccionado ? {
        nombreCompleto: pacienteSeleccionado.nombreCompleto,
        rut: pacienteSeleccionado.rut,
        numeroFicha: pacienteSeleccionado.numeroFicha,
        camaAsignada: pacienteSeleccionado.camaAsignada
      } : undefined
    };

    setProcedimientosEditables([...procedimientosEditables, nuevoProcTemporal]);
    setNuevoProcedimiento({ nombre: '', tiempo: '', pacienteRut: '', observaciones: '' });
    setMensaje({ tipo: '', texto: '' });
  };

  const eliminarProcedimiento = (id: number) => {
    // Si es un procedimiento existente (ID positivo), agregarlo a la lista de eliminados
    if (id > 0) {
      setProcedimientosAEliminar([...procedimientosAEliminar, id]);
    }
    
    // Remover de la lista de procedimientos editables
    setProcedimientosEditables(procedimientosEditables.filter(proc => proc.id !== id));
    setMensaje({ tipo: '', texto: '' });
  };

  const iniciarEdicionProcedimiento = async (procedimiento: ProcedimientoMedicina) => {
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

  const guardarProcedimientoEditado = () => {
    if (!procedimientoEditado) return;

    // Validar datos
    if (!procedimientoEditado.nombre || !procedimientoEditado.tiempo) {
      setMensaje({ tipo: 'error', texto: 'Debe especificar el nombre del procedimiento y el tiempo' });
      return;
    }

    if (requierePaciente(procedimientoEditado.nombre) && !procedimientoEditado.pacienteRut) {
      setMensaje({ tipo: 'error', texto: 'Este procedimiento requiere seleccionar un paciente' });
      return;
    }

    // Actualizar el procedimiento en la lista
    setProcedimientosEditables(procedimientosEditables.map(proc => 
      proc.id === procedimientoEditado.id ? procedimientoEditado : proc
    ));

    // Limpiar estado de edición
    setProcedimientoEditando(null);
    setProcedimientoEditado(null);
    setMensaje({ tipo: 'success', texto: 'Procedimiento actualizado' });

    // Limpiar mensaje después de un breve delay
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 2000);
  };

  const guardarCambios = async () => {
    try {
      setLoading(true);

      // Eliminar procedimientos marcados para eliminación
      for (const id of procedimientosAEliminar) {
        await medicinaAPI.eliminar(id);
      }

      // Actualizar procedimientos existentes que fueron editados
      const procedimientosExistentes = procedimientosEditables.filter(proc => proc.id > 0);
      const API_URL = getApiBaseUrl();
      for (const proc of procedimientosExistentes) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.put(
            `${API_URL}/medicina/${proc.id}`,
            {
              nombre: proc.nombre,
              tiempo: proc.tiempo,
              pacienteRut: proc.pacienteRut,
              observaciones: proc.observaciones
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } catch (error: any) {
          console.error(`Error al actualizar procedimiento ${proc.id}:`, error);
          if (axios.isAxiosError(error)) {
            if (error.response) {
              throw new Error(`Error al actualizar el procedimiento "${proc.nombre}": ${error.response.data.message || error.response.data.error || 'Error del servidor'}`);
            } else if (error.request) {
              throw new Error(`Error al actualizar el procedimiento "${proc.nombre}": No se pudo conectar con el servidor`);
            }
          }
          throw new Error(`Error al actualizar el procedimiento "${proc.nombre}": ${error.message || error}`);
        }
      }

      // Agregar nuevos procedimientos (los que tienen ID negativo)
      const nuevosProcedimientos = procedimientosEditables.filter(proc => proc.id < 0);
      if (nuevosProcedimientos.length > 0) {
        const procedimientosData: ProcedimientoMedicinaData[] = nuevosProcedimientos.map(proc => ({
          nombre: proc.nombre,
          tiempo: proc.tiempo,
          pacienteRut: proc.pacienteRut,
          observaciones: proc.observaciones
        }));

        await medicinaAPI.crear({
          turno: datosParaMostrar[0].turno,
          fecha: datosParaMostrar[0].fecha,
          procedimientos: procedimientosData
        });
      }

      // Actualizar inmediatamente el estado local con los datos actualizados
      const procedimientosActualizados = procedimientosEditables.filter(proc => proc.id > 0);
      
      // Actualizar el array de procedimientos del prop para que se refleje en la vista
      if (procedimientos) {
        procedimientos.splice(0, procedimientos.length, ...procedimientosActualizados);
      }

      setMensaje({ tipo: 'success', texto: 'Cambios guardados exitosamente' });
      
      // Salir del modo edición inmediatamente
      setModoEdicion(false);
      
      // Limpiar procedimientos a eliminar ya que se han procesado
      setProcedimientosAEliminar([]);
      
      // Refrescar datos del componente padre para obtener la información actualizada
      if (onUpdate) {
        onUpdate();
      }
      
      // Limpiar mensaje después de un breve delay
      setTimeout(() => {
        setMensaje({ tipo: '', texto: '' });
      }, 2000);

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

  const formatearTiempo = (tiempo: string): string => {
    return tiempo; // Ya viene en formato HH:MM
  };

  const convertirTiempoAMinutos = (tiempo: string): number => {
    const [horas, minutos] = tiempo.split(':').map(Number);
    return (horas * 60) + minutos;
  };

  const formatearTiempoCompleto = (tiempo: string): string => {
    const totalMinutos = convertirTiempoAMinutos(tiempo);
    const horas = Math.floor(totalMinutos / 60);
    const mins = totalMinutos % 60;
    
    if (horas > 0) {
      return `${horas} hora${horas > 1 ? 's' : ''} ${mins} minuto${mins !== 1 ? 's' : ''}`;
    }
    return `${mins} minuto${mins !== 1 ? 's' : ''}`;
  };

  const formatearFechaCreacion = (fechaStr: string): string => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fechaStr;
    }
  };

  // Calcular tiempo total - usa procedimientosEditables en modo edición, datosParaMostrar en modo visualización
  const calcularTiempoTotal = (): number => {
    const procedimientosParaCalcular = modoEdicion && puedeEditar ? procedimientosEditables : datosParaMostrar;
    return procedimientosParaCalcular.reduce((total, proc) => {
      const [h, m] = proc.tiempo.split(':').map(Number);
      return total + (h * 60) + m;
    }, 0);
  };

  // Obtener procedimientos actuales para mostrar
  const procedimientosActuales = modoEdicion && puedeEditar ? procedimientosEditables : datosParaMostrar;

  const formatearTiempoTotal = (minutos: number): string => {
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

  // Función para formatear fecha de YYYY-MM-DD a DD/MM/YYYY sin problemas de zona horaria
  const formatearFechaParaMostrar = (fecha: string): string => {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };

  // Función para formatear fecha de egreso (de YYYY-MM-DD HH:MM:SS o ISO a DD/MM/YYYY sin problemas de zona horaria)
  const formatearFechaEgreso = (fechaEgreso: string | null | undefined): string => {
    if (!fechaEgreso) return 'Fecha no disponible';
    
    // Manejar diferentes formatos de fecha
    let fechaSolo: string;
    
    if (fechaEgreso.includes('T')) {
      // Formato ISO: 2024-10-15T00:00:00.000Z
      fechaSolo = fechaEgreso.split('T')[0];
    } else if (fechaEgreso.includes(' ')) {
      // Formato: 2024-10-15 00:00:00
      fechaSolo = fechaEgreso.split(' ')[0];
    } else {
      // Formato: 2024-10-15
      fechaSolo = fechaEgreso;
    }
    
    const [year, month, day] = fechaSolo.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] md:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center rounded-t-lg md:rounded-t-2xl">
          <h2 className="text-lg md:text-2xl font-bold">
            {esGrupo ? `Detalle de Registro - Medicina` : `Detalle del Procedimiento - Medicina`}
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
          {modoEdicion && puedeEditar && (
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
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-900">
                    {datosParaMostrar[0]?.turno || '24 h'}
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center h-11 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                  {formatearFechaParaMostrar(datosParaMostrar[0]?.fecha || '')}
                </div>
              </div>
            </div>
          )}

          {/* Agregar procedimiento - Solo en modo edición */}
          {modoEdicion && puedeEditar && (
            <div className="bg-gray-50 p-3 md:p-4 rounded-lg space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Agregar Procedimiento</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Procedimiento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={nuevoProcedimiento.nombre}
                    onChange={(e) => {
                      const nuevoProcedimientoNombre = e.target.value;
                      setNuevoProcedimiento({ 
                        ...nuevoProcedimiento, 
                        nombre: nuevoProcedimientoNombre,
                        pacienteRut: requierePaciente(nuevoProcedimientoNombre) ? nuevoProcedimiento.pacienteRut : ''
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Seleccione...</option>
                    <optgroup label="🏥 Procedimientos habituales">
                      {procedimientosMedicina.map((proc, index) => (
                        <option key={`medicina-${index}`} value={proc}>{proc}</option>
                      ))}
                    </optgroup>
                    <optgroup label="⚕️ Otros procedimientos">
                      {otrosProcedimientos.map((proc, index) => (
                        <option key={`otros-${index}`} value={proc}>{proc}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paciente {requierePaciente(nuevoProcedimiento.nombre) && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={nuevoProcedimiento.pacienteRut}
                    onChange={(e) => setNuevoProcedimiento({ ...nuevoProcedimiento, pacienteRut: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    disabled={!requierePaciente(nuevoProcedimiento.nombre)}
                  >
                    <option value="">
                      {!requierePaciente(nuevoProcedimiento.nombre) && nuevoProcedimiento.nombre ? 
                        'Este procedimiento no requiere paciente' : 
                        'Seleccione...'}
                    </option>
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
                    
                    {/* Pacientes egresados en las últimas 24h */}
                    {pacientesEgresados.length > 0 && (
                      <optgroup label="📅 Pacientes egresados en las últimas 24 horas">
                            {pacientesEgresados.map((paciente) => (
                              <option key={`egresado-${paciente.id}`} value={paciente.rut}>
                                {paciente.nombreCompleto} - Egresado {formatearFechaEgreso(paciente.fechaEgresoUTI)}
                              </option>
                            ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiempo (HH:MM) <span className="text-red-500">*</span>
                  </label>
                  <TimePicker
                    value={nuevoProcedimiento.tiempo}
                    onChange={(value) => setNuevoProcedimiento({ ...nuevoProcedimiento, tiempo: value })}
                  />
                </div>
              </div>

              {/* Campo de observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones (opcional)
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={nuevoProcedimiento.observaciones}
                    onChange={(e) => setNuevoProcedimiento({ ...nuevoProcedimiento, observaciones: e.target.value })}
                    placeholder="Agregue observaciones adicionales si es necesario..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 resize-none"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={agregarNuevoProcedimiento}
                    className="px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors self-start"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Información general - Solo en modo visualización */}
          {!modoEdicion && (
          <div className="bg-gray-50 rounded-lg p-3 md:p-6 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Información General</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div>
                <p className="text-sm text-gray-500">Turno</p>
                <p className="font-semibold text-gray-800">{datosParaMostrar[0].turno}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-semibold text-gray-800">
                  {formatearFechaSinZonaHoraria(datosParaMostrar[0].fecha)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{esGrupo ? 'Tiempo Total' : 'Tiempo Empleado'}</p>
                <p className="font-semibold text-gray-800">
                  {esGrupo 
                    ? formatearTiempoTotal(calcularTiempoTotal())
                    : `${formatearTiempo(datosParaMostrar[0].tiempo)} (${formatearTiempoCompleto(datosParaMostrar[0].tiempo)})`
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{esGrupo ? 'Procedimientos' : 'Registrado por'}</p>
                <p className="font-semibold text-gray-800">
                  {esGrupo 
                    ? `${datosParaMostrar.length} procedimiento${datosParaMostrar.length > 1 ? 's' : ''}`
                    : `${datosParaMostrar[0].usuario.nombres} ${datosParaMostrar[0].usuario.apellidos}`
                  }
                </p>
              </div>
              {esGrupo && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Registrado por</p>
                  <p className="font-semibold text-gray-800">
                    {datosParaMostrar[0].usuario.nombres} {datosParaMostrar[0].usuario.apellidos}
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Lista de procedimientos agregados - Solo en modo edición */}
          {modoEdicion && puedeEditar && procedimientosEditables.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Procedimientos del Turno</h3>
                <span className="text-sm font-medium text-gray-600">
                  Tiempo Total: {formatearTiempoTotal(calcularTiempoTotal())}
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
                              <optgroup label="🏥 Procedimientos habituales">
                                {procedimientosMedicina.map((procName, idx) => (
                                  <option key={`medicina-${idx}`} value={procName}>{procName}</option>
                                ))}
                              </optgroup>
                              <optgroup label="⚕️ Otros procedimientos">
                                {otrosProcedimientos.map((procName, idx) => (
                                  <option key={`otros-${idx}`} value={procName}>{procName}</option>
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
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                              disabled={!requierePaciente(procedimientoEditado?.nombre || '')}
                            >
                              <option value="">
                                {!requierePaciente(procedimientoEditado?.nombre || '') && procedimientoEditado?.nombre ? 
                                  'Este procedimiento no requiere paciente' : 
                                  'Seleccione...'}
                              </option>
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
                                <optgroup label="📅 Pacientes egresados en las últimas 24 horas">
                                  {pacientesEgresados.map((paciente) => (
                                    <option key={`egresado-${paciente.id}`} value={paciente.rut}>
                                      {paciente.nombreCompleto} - Egresado {formatearFechaEgreso(paciente.fechaEgresoUTI)}
                                    </option>
                                  ))}
                                </optgroup>
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
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observaciones (opcional)
                          </label>
                          <textarea
                            value={procedimientoEditado?.observaciones || ''}
                            onChange={(e) => actualizarProcedimientoEditado('observaciones', e.target.value)}
                            placeholder="Agregue observaciones adicionales si es necesario..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 resize-none"
                            rows={2}
                          />
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
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
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
                            <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <p className="text-sm md:text-base font-semibold text-gray-900">{proc.nombre}</p>
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

          {/* Detalles de los procedimientos - Solo en modo visualización */}
          {!modoEdicion && (
            <div className="bg-white rounded-lg p-3 md:p-6 mb-4 md:mb-6 border border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
                {esGrupo ? `Procedimientos (${procedimientosActuales.length})` : 'Detalles del Procedimiento'}
              </h3>
              
              <div className="space-y-4">
                {procedimientosActuales.map((proc, index) => (
                <div key={proc.id} className={`${esGrupo ? 'bg-gray-50 rounded-lg p-3 md:p-4' : ''} ${modoEdicion && puedeEditar ? 'relative' : ''}`}>
                  {modoEdicion && puedeEditar && (
                    <button
                      onClick={() => eliminarProcedimiento(proc.id)}
                      disabled={loading}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-700 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Eliminar procedimiento"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  
                  {esGrupo && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <p className="text-sm md:text-base font-semibold text-gray-800">{proc.nombre}</p>
                    </div>
                  )}
                  
                  {!esGrupo && (
                    <div className="mb-3">
                      <p className="text-xs md:text-sm text-gray-500 mb-1">Nombre del Procedimiento</p>
                      <p className="font-semibold text-gray-800 text-base md:text-lg">{proc.nombre}</p>
                    </div>
                  )}

                  {esGrupo ? (
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
                  ) : (
                    proc.paciente && (
                      <div className="bg-blue-50 rounded-lg p-3 md:p-4 mb-3">
                        <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-2">Información del Paciente</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Nombre Completo</p>
                            <p className="font-semibold text-gray-800">{proc.paciente.nombreCompleto}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">RUT</p>
                            <p className="font-semibold text-gray-800">{proc.paciente.rut}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Número de Ficha</p>
                            <p className="font-semibold text-gray-800">{proc.paciente.numeroFicha}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Cama Asignada</p>
                            <p className="font-semibold text-gray-800">
                              {proc.paciente.camaAsignada ? `Cama ${proc.paciente.camaAsignada}` : 'Sin asignar'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {proc.observaciones && (
                    <div className="mb-3">
                      <p className="text-xs md:text-sm text-gray-500 mb-1">Observaciones</p>
                      <div className="bg-gray-50 rounded-lg p-2 md:p-3">
                        <p className="text-gray-800 text-xs md:text-sm">{proc.observaciones}</p>
                      </div>
                    </div>
                  )}

                  {esGrupo && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Tiempo Dedicado</p>
                      <p className="text-sm md:text-base font-medium text-gray-800">{formatearTiempo(proc.tiempo)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Información de registro - Solo en modo visualización */}
          {!modoEdicion && !esGrupo && (
            <div className="bg-gray-50 rounded-lg p-3 md:p-4">
              <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-2">Información de Registro</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm">
                <div>
                  <p className="text-gray-500">Fecha de Creación</p>
                  <p className="font-medium text-gray-800">{formatearFechaCreacion(datosParaMostrar[0].createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Última Modificación</p>
                  <p className="font-medium text-gray-800">{formatearFechaCreacion(datosParaMostrar[0].updatedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Estamento</p>
                  <p className="font-medium text-gray-800">{datosParaMostrar[0].usuario.estamento}</p>
                </div>
              </div>
            </div>
          )}
          </form>
        ) : (
          <div className="p-3 md:p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
            {/* Mensaje de estado */}
            {mensaje.texto && (
              <div className={`p-4 rounded-lg ${
                mensaje.tipo === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {mensaje.texto}
              </div>
            )}

            {/* Información general - Solo en modo visualización */}
            {!modoEdicion && (
            <div className="bg-gray-50 rounded-lg p-3 md:p-6 mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Información General</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div>
                  <p className="text-sm text-gray-500">Turno</p>
                  <p className="font-semibold text-gray-800">{datosParaMostrar[0].turno}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-semibold text-gray-800">
                    {formatearFechaSinZonaHoraria(datosParaMostrar[0].fecha)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{esGrupo ? 'Tiempo Total' : 'Tiempo Empleado'}</p>
                  <p className="font-semibold text-gray-800">
                    {esGrupo 
                      ? formatearTiempoTotal(calcularTiempoTotal())
                      : `${formatearTiempo(datosParaMostrar[0].tiempo)} (${formatearTiempoCompleto(datosParaMostrar[0].tiempo)})`
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{esGrupo ? 'Procedimientos' : 'Registrado por'}</p>
                  <p className="font-semibold text-gray-800">
                    {esGrupo 
                      ? `${procedimientosActuales.length} procedimiento${procedimientosActuales.length > 1 ? 's' : ''}`
                      : `${datosParaMostrar[0].usuario.nombres} ${datosParaMostrar[0].usuario.apellidos}`
                    }
                  </p>
                </div>
              </div>
              {esGrupo && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Registrado por</p>
                  <p className="font-semibold text-gray-800">
                    {datosParaMostrar[0].usuario.nombres} {datosParaMostrar[0].usuario.apellidos}
                  </p>
                </div>
              )}
            </div>
            )}

            {/* Detalles de los procedimientos - Solo en modo visualización */}
            {!modoEdicion && (
            <div className="bg-white rounded-lg p-3 md:p-6 mb-4 md:mb-6 border border-gray-200">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
                {esGrupo ? `Procedimientos (${procedimientosActuales.length})` : 'Detalles del Procedimiento'}
              </h3>
              
              <div className="space-y-4">
                {procedimientosActuales.map((proc, index) => (
                <div key={proc.id} className={`${esGrupo ? 'bg-gray-50 rounded-lg p-3 md:p-4' : ''}`}>
                  
                  {esGrupo && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <h4 className="text-sm md:text-base font-semibold text-gray-900">{proc.nombre}</h4>
                    </div>
                  )}

                  {esGrupo && (
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
                  )}

                  {esGrupo && proc.observaciones && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Observaciones</p>
                      <p className="text-sm md:text-base text-gray-700">{proc.observaciones}</p>
                    </div>
                  )}

                  {!esGrupo && proc.paciente && (
                    <div className="bg-blue-50 rounded-lg p-3 md:p-4 mb-3">
                      <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-2">Información del Paciente</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Nombre Completo</p>
                          <p className="font-semibold text-gray-800">{proc.paciente.nombreCompleto}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">RUT</p>
                          <p className="font-semibold text-gray-800">{proc.paciente.rut}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Número de Ficha</p>
                          <p className="font-semibold text-gray-800">{proc.paciente.numeroFicha}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Cama Asignada</p>
                          <p className="font-semibold text-gray-800">
                            {proc.paciente.camaAsignada ? `Cama ${proc.paciente.camaAsignada}` : 'Sin asignar'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                ))}
              </div>
            </div>
            )}

            {/* Información de registro - Solo en modo visualización */}
            {!modoEdicion && !esGrupo && (
            <div className="bg-gray-50 rounded-lg p-3 md:p-4">
              <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-2">Información de Registro</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm">
                <div>
                  <p className="text-gray-500">Fecha de Creación</p>
                  <p className="font-medium text-gray-800">{formatearFechaCreacion(datosParaMostrar[0].createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Última Modificación</p>
                  <p className="font-medium text-gray-800">{formatearFechaCreacion(datosParaMostrar[0].updatedAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Estamento</p>
                  <p className="font-medium text-gray-800">{datosParaMostrar[0].usuario.estamento}</p>
                </div>
              </div>
            </div>
            )}
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
                disabled={loading || procedimientosEditables.length === 0}
                className="px-4 md:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {loading ? 'Guardando...' : 'Confirmar Cambios'}
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

export default ModalDetalleProcedimientoMedicina;
