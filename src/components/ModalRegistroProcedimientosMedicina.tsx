import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pacienteService, Paciente } from '../services/api';
import medicinaAPI, { ProcedimientoMedicinaData } from '../services/medicinaAPI';

interface ModalRegistroProcedimientosMedicinaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ProcedimientoItem {
  id: string;
  nombre: string;
  tiempo: string; // Formato HH:MM
  pacienteRut?: string;
  pacienteNombre?: string;
  observaciones?: string;
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

const ModalRegistroProcedimientosMedicina: React.FC<ModalRegistroProcedimientosMedicinaProps> = ({ isOpen, onClose, onSuccess }) => {
  const [turno, setTurno] = useState<'24 h' | '22 h' | '12 h'>('24 h');
  const [fecha, setFecha] = useState<string>(() => obtenerFechaLocal());
  const [procedimientos, setProcedimientos] = useState<ProcedimientoItem[]>([]);
  const [nuevoProcedimiento, setNuevoProcedimiento] = useState({
    nombre: '',
    tiempo: '00:00',
    pacienteRut: '',
    observaciones: ''
  });
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacientesEgresados, setPacientesEgresados] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | ''; texto: string }>({ tipo: '', texto: '' });
  const [yaExisteRegistroFecha, setYaExisteRegistroFecha] = useState(false);
  const [fechaMinima, setFechaMinima] = useState<string>(() => {
    // Inicializar con 30 días atrás como fecha mínima por defecto
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const year = hace30Dias.getFullYear();
    const month = String(hace30Dias.getMonth() + 1).padStart(2, '0');
    const day = String(hace30Dias.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [tipoAlerta, setTipoAlerta] = useState<'success' | 'error'>('success');
  const [textoAlerta, setTextoAlerta] = useState('');

  const { user } = useAuth();

  // Función para mostrar alerta emergente
  const mostrarAlertaEmergente = (tipo: 'success' | 'error', texto: string) => {
    setTipoAlerta(tipo);
    setTextoAlerta(texto);
    setMostrarAlerta(true);
    
    // Ocultar la alerta después de 3 segundos
    setTimeout(() => {
      setMostrarAlerta(false);
    }, 3000);
  };

  // Verificar si ya existe un registro para la fecha seleccionada
  const verificarRegistroExistente = async (fechaSeleccionada: string, turnoSeleccionado: string) => {
    if (!user) return false;
    
    try {
      const { procedimientos } = await medicinaAPI.obtenerTodos({
        usuarioId: user.id,
        fechaDesde: fechaSeleccionada,
        fechaHasta: fechaSeleccionada,
        turno: turnoSeleccionado as '24 h' | '22 h' | '12 h',
        limit: 1 // Solo necesitamos saber si existe al menos uno
      });
      
      return procedimientos.length > 0;
    } catch (error) {
      console.error('Error al verificar registro existente:', error);
      return false; // En caso de error, permitir continuar
    }
  };

  // Función para formatear fecha de YYYY-MM-DD a DD/MM/YYYY sin problemas de zona horaria
  const formatearFechaParaMostrar = (fecha: string): string => {
    if (!fecha) return '';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };

  // Función para obtener la fecha máxima permitida (siempre la fecha actual)
  const obtenerFechaMaxima = () => obtenerFechaLocal();

  // Función para formatear fecha de ingreso (de YYYY-MM-DD HH:MM:SS a YYYY-MM-DD)
  const formatearFechaIngreso = (fechaIngreso: string): string | null => {
    if (!fechaIngreso) return null;
    // Extraer solo la parte de la fecha (YYYY-MM-DD) 
    return fechaIngreso.split(' ')[0];
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

  // Función para calcular la fecha mínima permitida basada en los pacientes
  const calcularFechaMinima = (todosPacientes: Paciente[]): string => {
    // Si no hay pacientes, permitir desde 30 días atrás hasta hoy
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
      .filter((f): f is string => f !== null) // Type guard para filtrar nulls
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

  // Obtener todos los procedimientos válidos desde la API
  const todosLosProcedimientos = medicinaAPI.getProcedimientosValidos();
  
  // Separar en procedimientos habituales y otros procedimientos
  const procedimientosMedicina = [
    'Administrativo (evoluciones, revisión de HC, indicaciones, etc)',
    'Egreso (redacción de egreso, indicaciones, etc)',
    'Entrega de turno (solo cuando se recibe turno)',
    'Ingreso (redacción de ingreso, evaluación y procedimientos correspondientes)',
    'Instalación CHD',
    'Instalación CVC',
    'Interconsulta (lectura de HC, evaluación/reevaluación, evolución)',
    'IOT',
    'PCR'
  ];

  // Otros procedimientos (requieren paciente específico) - ordenados alfabéticamente
  const otrosProcedimientos = [
    'Cambio de TQT',
    'Colonoscopía',
    'Decanulación',
    'Ecografía',
    'Endoscopía',
    'Endoscopía + Colonoscopía',
    'Fibrobroncoscopía',
    'Instalación de Cistotomia',
    'Instalación de gastrotomía',
    'Instalación de SNY',
    'Instalación de TQT',
    'Instalación de tunelizado',
    'Instalación LA',
    'Instalación PICCLINE',
    'Mielograma',
    'Paracentesís',
    'Punción lumbar',
    'Radiografía',
    'RMN con traslado a BUPA',
    'Toracocentesís'
  ];

  // Verificar si un procedimiento requiere paciente
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

  // Cargar pacientes cuando se abre el modal
  useEffect(() => {
    const cargarPacientes = async () => {
      if (isOpen) {
        setLoadingPacientes(true);
        try {
          const { activos, egresadosRecientes } = await pacienteService.obtenerPacientesParaProcedimientos();
          // Ordenar por número de cama
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
          console.error('Error al cargar pacientes:', error);
          setMensaje({ tipo: 'error', texto: 'Error al cargar la lista de pacientes' });
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
      // Al abrir el modal, establecer siempre la fecha actual
      setFecha(obtenerFechaLocal());
    } else {
      // Al cerrar el modal, limpiar todo excepto fechaMinima que mantiene su valor por defecto
      setProcedimientos([]);
      setNuevoProcedimiento({ nombre: '', tiempo: '00:00', pacienteRut: '', observaciones: '' });
      setMensaje({ tipo: '', texto: '' });
      setYaExisteRegistroFecha(false);
      setFecha(obtenerFechaLocal());
    }
  }, [isOpen]);

  // Verificar si ya existe un registro para la fecha seleccionada
  useEffect(() => {
    const checkearRegistroExistente = async () => {
      if (isOpen && user && fecha) {
        const existeRegistro = await verificarRegistroExistente(fecha, turno);
        setYaExisteRegistroFecha(existeRegistro);
      }
    };

    checkearRegistroExistente();
  }, [isOpen, fecha, turno, user]);

  const agregarProcedimiento = () => {
    if (!nuevoProcedimiento.nombre || !nuevoProcedimiento.tiempo) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar un procedimiento y especificar el tiempo' });
      return;
    }

    // Verificar si el procedimiento requiere paciente
    const requiereP = requierePaciente(nuevoProcedimiento.nombre);
    
    if (requiereP && !nuevoProcedimiento.pacienteRut) {
      setMensaje({ tipo: 'error', texto: 'Este procedimiento requiere seleccionar un paciente' });
      return;
    }

    const pacienteSeleccionado = [...pacientes, ...pacientesEgresados].find(p => p.rut === nuevoProcedimiento.pacienteRut);

    const procedimiento: ProcedimientoItem = {
      id: Date.now().toString(),
      nombre: nuevoProcedimiento.nombre,
      tiempo: nuevoProcedimiento.tiempo,
      pacienteRut: nuevoProcedimiento.pacienteRut || undefined,
      pacienteNombre: pacienteSeleccionado?.nombreCompleto || undefined,
      observaciones: nuevoProcedimiento.observaciones || undefined
    };

    setProcedimientos([...procedimientos, procedimiento]);
    setNuevoProcedimiento({ nombre: '', tiempo: '', pacienteRut: '', observaciones: '' });
    setMensaje({ tipo: '', texto: '' });
  };

  const eliminarProcedimiento = (id: string) => {
    setProcedimientos(procedimientos.filter(p => p.id !== id));
  };

  const convertirTiempoAMinutos = (tiempo: string): number => {
    const [horas, minutos] = tiempo.split(':').map(Number);
    return (horas * 60) + minutos;
  };

  const calcularTiempoTotal = (): string => {
    const totalMinutos = procedimientos.reduce((total, proc) => {
      return total + convertirTiempoAMinutos(proc.tiempo);
    }, 0);

    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;

    return `${horas}h ${minutos}m`;
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (procedimientos.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Debe agregar al menos un procedimiento' });
      return;
    }

    // Verificar si ya existe un registro para esta fecha
    if (yaExisteRegistroFecha) {
      setMensaje({ 
        tipo: 'error', 
        texto: `Ya tiene un registro de procedimientos para la fecha ${formatearFechaParaMostrar(fecha)} en el turno ${turno}. No puede realizar múltiples registros en la misma fecha y turno.` 
      });
      return;
    }

    try {
      setLoading(true);

      const procedimientosData: ProcedimientoMedicinaData[] = procedimientos.map(proc => ({
        nombre: proc.nombre,
        tiempo: proc.tiempo,
        pacienteRut: proc.pacienteRut,
        observaciones: proc.observaciones
      }));

      const data = {
        turno,
        fecha: formatearFechaParaBackend(fecha),
        procedimientos: procedimientosData
      };

      await medicinaAPI.crear(data);

      // Mostrar alerta de éxito
      mostrarAlertaEmergente('success', 'Registro guardado exitosamente');
      
      // Llamar callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      }
      
      // Cerrar modal después de un breve delay para que se vea la alerta
      setTimeout(() => {
        onClose();
      }, 100);

    } catch (error: any) {
      console.error('Error al guardar registro:', error);
      const mensajeError = error.message || 'Error al guardar el registro';
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
        <div className="bg-white rounded-lg md:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-green-600 border-b border-green-700 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between rounded-t-lg md:rounded-t-2xl">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-white">Registro de Procedimientos - Medicina</h2>
            <p className="text-xs md:text-sm text-green-100 mt-1">Registra los procedimientos médicos realizados en el turno</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6 pb-16 md:pb-6">
          {/* Mensaje de estado */}
          {mensaje.texto && (
            <div className={`p-4 rounded-lg ${
              mensaje.tipo === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {mensaje.texto}
            </div>
          )}

          {/* Aviso de registro existente */}
          {yaExisteRegistroFecha && (
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Registro existente para esta fecha
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    Ya tiene un registro de procedimientos para el {formatearFechaParaMostrar(fecha)} en el turno {turno}. 
                    No puede realizar múltiples registros en la misma fecha y turno.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Información del turno */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turno <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="turno-24h"
                    name="turno"
                    value="24 h"
                    checked={turno === '24 h'}
                    onChange={(e) => setTurno(e.target.value as '24 h' | '22 h' | '12 h')}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                  />
                  <label htmlFor="turno-24h" className="ml-3 text-sm font-medium text-gray-900">
                    24 h
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="turno-22h"
                    name="turno"
                    value="22 h"
                    checked={turno === '22 h'}
                    onChange={(e) => setTurno(e.target.value as '24 h' | '22 h' | '12 h')}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                  />
                  <label htmlFor="turno-22h" className="ml-3 text-sm font-medium text-gray-900">
                    <span className="md:hidden">22 h</span>
                    <span className="hidden md:inline">22 h (08:00 - 13:00 h)</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="turno-12h"
                    name="turno"
                    value="12 h"
                    checked={turno === '12 h'}
                    onChange={(e) => setTurno(e.target.value as '24 h' | '22 h' | '12 h')}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                  />
                  <label htmlFor="turno-12h" className="ml-3 text-sm font-medium text-gray-900">
                    12 h
                  </label>
                </div>
              </div>
            </div>
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
                className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                required
              />
            </div>
          </div>

          {/* Agregar procedimiento */}
          <div className="bg-gray-50 p-3 md:p-4 rounded-lg space-y-3 md:space-y-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Agregar Procedimiento</h3>
            
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {/* Procedimiento */}
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
                      // Limpiar paciente si el nuevo procedimiento no requiere paciente
                      pacienteRut: requierePaciente(nuevoProcedimientoNombre) ? nuevoProcedimiento.pacienteRut : ''
                    });
                  }}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-sm md:text-base"
                >
                  <option value="">Seleccione...</option>
                  
                  {/* Procedimientos habituales */}
                  <optgroup label="🏥 Procedimientos habituales">
                    {procedimientosMedicina.map((proc, index) => (
                      <option key={`medicina-${index}`} value={proc}>{proc}</option>
                    ))}
                  </optgroup>
                  
                  {/* Otros procedimientos */}
                  <optgroup label="⚕️ Otros procedimientos">
                    {otrosProcedimientos.map((proc, index) => (
                      <option key={`otros-${index}`} value={proc}>{proc}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Paciente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paciente {requierePaciente(nuevoProcedimiento.nombre) && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={nuevoProcedimiento.pacienteRut}
                  onChange={(e) => setNuevoProcedimiento({ ...nuevoProcedimiento, pacienteRut: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-sm md:text-base"
                  disabled={loadingPacientes || !requierePaciente(nuevoProcedimiento.nombre)}
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

              {/* Tiempo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo (HH:MM) <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={nuevoProcedimiento.tiempo}
                  onChange={(e) => setNuevoProcedimiento({ ...nuevoProcedimiento, tiempo: e.target.value })}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            {/* Campo de observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (opcional)
              </label>
              <div className="space-y-3 md:space-y-0 md:flex md:gap-2">
                <textarea
                  value={nuevoProcedimiento.observaciones}
                  onChange={(e) => setNuevoProcedimiento({ ...nuevoProcedimiento, observaciones: e.target.value })}
                  placeholder="Agregue observaciones adicionales si es necesario..."
                  className="w-full md:flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 resize-none text-sm md:text-base"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={agregarProcedimiento}
                  className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors md:self-start flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="md:hidden">Agregar Procedimiento</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lista de procedimientos agregados */}
          {procedimientos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Procedimientos Agregados</h3>
                <span className="text-xs md:text-sm font-medium text-gray-600">
                  Tiempo Total: {calcularTiempoTotal()}
                </span>
              </div>
              
              <div className="space-y-2">
                {procedimientos.map((proc) => (
                  <div key={proc.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm md:text-base truncate">{proc.nombre}</p>
                      {proc.pacienteNombre && (
                        <p className="text-xs md:text-sm text-gray-600 truncate">Paciente: {proc.pacienteNombre}</p>
                      )}
                      <p className="text-xs md:text-sm text-gray-500">Tiempo: {proc.tiempo}</p>
                      {proc.observaciones && (
                        <p className="text-xs md:text-sm text-gray-600 italic truncate">Observaciones: {proc.observaciones}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarProcedimiento(proc.id)}
                      className="text-red-600 hover:text-red-700 p-1 flex-shrink-0"
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

          {/* Botones */}
          <div className="flex flex-col-reverse md:flex-row justify-end space-y-reverse space-y-3 md:space-y-0 md:space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full md:w-auto px-4 md:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || procedimientos.length === 0 || yaExisteRegistroFecha}
              className="w-full md:w-auto px-4 md:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {loading ? 'Guardando...' : yaExisteRegistroFecha ? 'Registro existente' : 'Guardar Registro'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
};

export default ModalRegistroProcedimientosMedicina;

