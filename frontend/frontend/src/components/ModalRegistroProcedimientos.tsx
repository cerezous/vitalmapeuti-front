import React, { useState, useEffect } from 'react';
import { pacienteService, Paciente } from '../services/api';
import registroProcedimientosAPI, { ProcedimientoRegistroData } from '../services/registroProcedimientosAPI';
import procedimientosKinesiologiaAPI from '../services/procedimientosKinesiologiaAPI';
import TimePicker from './TimePicker';

type TipoProcedimiento = 'enfermeria' | 'kinesiologia' | 'medicina';

interface ModalRegistroProcedimientosProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tipo?: TipoProcedimiento; // Para distinguir qué tipo de procedimientos guardar
}

interface ProcedimientoItem {
  id: string;
  nombre: string;
  tiempo: string; // Formato HH:MM
  pacienteRut?: string;
  pacienteNombre?: string;
}

const ModalRegistroProcedimientos: React.FC<ModalRegistroProcedimientosProps> = ({ isOpen, onClose, onSuccess, tipo = 'enfermeria' as TipoProcedimiento }) => {
  const [turno, setTurno] = useState<'Día' | 'Noche'>('Día');
  const [fecha, setFecha] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [procedimientos, setProcedimientos] = useState<ProcedimientoItem[]>([]);
  const [nuevoProcedimiento, setNuevoProcedimiento] = useState({
    nombre: '',
    tiempo: '00:00',
    pacienteRut: ''
  });
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacientesEgresados, setPacientesEgresados] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | ''; texto: string }>({ tipo: '', texto: '' });
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [tipoAlerta, setTipoAlerta] = useState<'success' | 'error'>('success');
  const [textoAlerta, setTextoAlerta] = useState('');

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

  // Procedimientos de Kinesiología
  const procedimientosKinesiologia = [
    'Kinesiterapia respiratoria (Ev, KTR, EMR, etc)',
    'Kinesiterapia motora',
    'Kinesiterapia integral (respiratorio + motor)',
    'Cultivo de secreción bronquial',
    'Film array respiratorio',
    'Baciloscopía',
    'Instalación de VMNI',
    'Instalación de CNAF',
    'IOT',
    'PCR',
    'Instalación de TQT',
    'Cambio de TQT',
    'Decanulación',
    'Tareas administrativas (evoluciones, estadísticas, etc)',
    'Entrega de turno (solo cuando se recibe turno)'
  ];

  // Otros procedimientos
  const otrosProcedimientos = [
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
    'TAC simple',
    'TAC con contraste',
    'RMN',
    'RMN con traslado a BUPA',
    'Electrocardiograma',
    'MAKI',
    'Premeditación QMT',
    'Cateterismo vesical',
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
    'Traslado a otra unidad',
    'Ingreso',
    'Curación simple',
    'Diálisis',
    'Curación avanzada'
  ];

  // Procedimientos que no requieren paciente
  const procedimientosSinPaciente = [
    'Tareas administrativas (evoluciones, estadísticas, etc)',
    'Entrega de turno (solo cuando se recibe turno)'
  ];

  // Cargar pacientes cuando se abre el modal
  useEffect(() => {
    const cargarPacientes = async () => {
      if (isOpen) {
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
  }, [isOpen]);

  // Limpiar formulario al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setTurno('Día');
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setFecha(`${year}-${month}-${day}`);
      setProcedimientos([]);
      setNuevoProcedimiento({ nombre: '', tiempo: '00:00', pacienteRut: '' });
      setMensaje({ tipo: '', texto: '' });
    }
  }, [isOpen]);

  // Verificar si el procedimiento seleccionado requiere paciente
  const requierePaciente = (nombreProcedimiento: string): boolean => {
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
    
    const procAgregado: ProcedimientoItem = {
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
  const handleEliminarProcedimiento = (id: string) => {
    setProcedimientos(procedimientos.filter(p => p.id !== id));
  };

  // Guardar todos los procedimientos
  const handleGuardar = async () => {
    if (procedimientos.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Debes agregar al menos un procedimiento' });
      return;
    }

    setLoading(true);
    try {
      if (tipo === 'kinesiologia') {
        // Para kinesiología, guardar cada procedimiento individualmente por paciente
        // Agrupar procedimientos por paciente (incluyendo los que no tienen paciente)
        const procedimientosPorPaciente: { [key: string]: any[] } = {};
        
        procedimientos.forEach(proc => {
          // Usar 'general' como clave para procedimientos sin paciente (entrega de turno, administrativos)
          const key = proc.pacienteRut || 'general';
          
          if (!procedimientosPorPaciente[key]) {
            procedimientosPorPaciente[key] = [];
          }
          
          procedimientosPorPaciente[key].push({
            nombre: proc.nombre,
            fecha: fecha,
            turno: turno, // Enviar el turno seleccionado
            tiempo: proc.tiempo,
            observaciones: ''
          });
        });
        
        // Guardar procedimientos de cada paciente
        for (const [key, procs] of Object.entries(procedimientosPorPaciente)) {
          await procedimientosKinesiologiaAPI.crearProcedimientos({
            pacienteRut: key === 'general' ? null : key, // Enviar null para procedimientos generales
            procedimientos: procs
          });
        }
      } else {
        // Para enfermería, usar el sistema de registros por turno
        const procedimientosData: ProcedimientoRegistroData[] = procedimientos.map(proc => ({
          nombre: proc.nombre,
          tiempo: proc.tiempo,
          pacienteRut: proc.pacienteRut
        }));

        // Determinar estamento basándose en el tipo
        const mapaTipoEstamento: { [K in TipoProcedimiento]: 'Kinesiología' | 'Enfermería' | 'Medicina' } = {
          kinesiologia: 'Kinesiología',
          medicina: 'Medicina',
          enfermeria: 'Enfermería'
        };
        const estamento = mapaTipoEstamento[tipo];
        
        await registroProcedimientosAPI.crear({
          turno,
          fecha,
          procedimientos: procedimientosData,
          estamento
        });
      }
      
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
    } catch (error) {
      console.error('Error al guardar:', error);
      const mensajeError = error instanceof Error ? error.message : 'Error al guardar el registro';
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

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg md:rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] md:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`${tipo === 'kinesiologia' ? 'bg-gray-800' : 'bg-blue-900'} text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center`}>
          <h2 className="text-lg md:text-2xl font-bold">
            {tipo === 'kinesiologia' ? 'Registro de Procedimientos - Kinesiología' : 'Registro de Procedimientos - Enfermería'}
          </h2>
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

        {/* Contenido */}
        <div className="p-4 md:p-6 pb-16 md:pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {/* Mensaje de feedback */}
          {mensaje.texto && (
            <div className={`mb-3 md:mb-4 p-3 md:p-4 rounded-lg ${
              mensaje.tipo === 'success' ? (tipo === 'kinesiologia' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700') : 'bg-red-100 text-red-700'
            }`}>
              {mensaje.texto}
            </div>
          )}

          {/* Información general */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* Turno - para ambos tipos */}
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
                    onChange={(e) => setTurno(e.target.value as 'Día' | 'Noche')}
                    className={`w-4 h-4 ${tipo === 'kinesiologia' ? 'text-gray-800' : 'text-blue-900'}`}
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm md:text-base text-gray-700">Día</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="Noche"
                    checked={turno === 'Noche'}
                    onChange={(e) => setTurno(e.target.value as 'Día' | 'Noche')}
                    className={`w-4 h-4 ${tipo === 'kinesiologia' ? 'text-gray-800' : 'text-blue-900'}`}
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm md:text-base text-gray-700">Noche</span>
                </label>
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={`w-full px-3 md:px-4 py-2 bg-gray-50 text-gray-900 text-sm md:text-base rounded-lg focus:ring-2 ${tipo === 'kinesiologia' ? 'focus:ring-gray-800' : 'focus:ring-blue-900'} focus:bg-white transition-all`}
                disabled={loading}
              />
            </div>
          </div>

          {/* Formulario para agregar procedimiento */}
          <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Agregar Procedimiento</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
              {/* Seleccionar procedimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Procedimiento
                </label>
                <select
                  value={nuevoProcedimiento.nombre}
                  onChange={(e) => setNuevoProcedimiento({ ...nuevoProcedimiento, nombre: e.target.value, pacienteRut: '' })}
                  className={`w-full px-3 md:px-4 py-2 bg-white text-gray-900 text-sm md:text-base rounded-lg focus:ring-2 ${tipo === 'kinesiologia' ? 'focus:ring-gray-800' : 'focus:ring-blue-900'} transition-all`}
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
                  className={`w-full px-3 md:px-4 py-2 bg-white text-gray-900 text-sm md:text-base rounded-lg focus:ring-2 ${tipo === 'kinesiologia' ? 'focus:ring-gray-800' : 'focus:ring-blue-900'} transition-all disabled:bg-gray-100`}
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

            {/* Botón agregar */}
            <button
              onClick={handleAgregarProcedimiento}
              className={`w-full ${tipo === 'kinesiologia' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-blue-900 hover:bg-blue-800'} text-white px-3 md:px-4 py-2 text-sm md:text-base rounded-lg transition-colors`}
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
            className={`w-full md:w-auto px-4 md:px-6 py-2.5 md:py-2 ${tipo === 'kinesiologia' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-blue-900 hover:bg-blue-800'} text-white text-sm md:text-base font-medium rounded-lg transition-colors disabled:bg-gray-400 order-1 md:order-2`}
            disabled={loading || procedimientos.length === 0}
          >
            {loading ? 'Guardando...' : 'Guardar Registro'}
          </button>
        </div>
        </div>
      </div>
    </>
  );
};

export default ModalRegistroProcedimientos;

