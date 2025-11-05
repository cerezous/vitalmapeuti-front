import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import categorizacionKinesiologiaAPI, { CategorizacionRequest } from '../services/categorizacionKinesiologiaAPI';
import procedimientosKinesiologiaAPI, { ProcedimientoRequest, ProcedimientoKinesiologia } from '../services/procedimientosKinesiologiaAPI';
import { authService } from '../services/api';
import TimePicker from './TimePicker';

interface ModalKinesiologiaProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteRut: string;
  pacienteNombre: string;
}

interface CategorizacionState {
  respiratorio: number | null;
  asistencia: number | null;
  glasgow: number | null;
  secreciones: number | null;
  asistenciaNueva: number | null;
}

interface Procedimiento {
  id?: number;
  nombre: string;
  fecha: string;
  tiempo: string; // Formato HH:MM
  observaciones?: string;
  usuario?: {
    nombres: string;
    apellidos: string;
    usuario: string;
  };
}

interface ProcedimientoRegistro {
  nombre: string;
  fecha: string;
  tiempo: string; // Formato HH:MM
  observaciones?: string;
}

const ModalKinesiologia: React.FC<ModalKinesiologiaProps> = ({ isOpen, onClose, pacienteRut, pacienteNombre }) => {
  const [activeTab, setActiveTab] = useState<'categorizacion' | 'procedimientos'>('categorizacion');
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
    return `${year}-${month}-${day}`;
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | ''; texto: string }>({ tipo: '', texto: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Estados para procedimientos
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
  const [nuevoProcedimiento, setNuevoProcedimiento] = useState<ProcedimientoRegistro>({
    nombre: '',
    fecha: (() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })(),
    tiempo: '00:00',
    observaciones: ''
  });
  const [loadingProcedimientos, setLoadingProcedimientos] = useState(false);
  
  const { user } = useAuth();

  // Cargar procedimientos del paciente cuando se abre el modal o cambia a la pestaña de procedimientos
  useEffect(() => {
    const cargarProcedimientos = async () => {
      if (isOpen && activeTab === 'procedimientos' && pacienteRut) {
        setLoadingProcedimientos(true);
        try {
          const data = await procedimientosKinesiologiaAPI.obtenerPorPaciente(pacienteRut, { limit: 50 });
          
          // Convertir los procedimientos del backend al formato local
          const procedimientosFormateados = data.procedimientos.map((proc: ProcedimientoKinesiologia) => ({
            id: proc.id,
            nombre: proc.nombre,
            fecha: proc.fecha,
            tiempo: proc.tiempo,
            observaciones: proc.observaciones || '',
            usuario: proc.usuario
          }));
          
          setProcedimientos(procedimientosFormateados);
        } catch (error) {
          console.error('Error al cargar procedimientos:', error);
          setMensaje({ 
            tipo: 'error', 
            texto: 'Error al cargar los procedimientos registrados' 
          });
        } finally {
          setLoadingProcedimientos(false);
        }
      }
    };

    cargarProcedimientos();
  }, [isOpen, activeTab, pacienteRut]);

  // Función helper para convertir HH:MM a minutos
  const tiempoAMinutos = (tiempo: string): number => {
    if (!tiempo) return 0;
    const [horas, minutos] = tiempo.split(':').map(Number);
    return (horas * 60) + minutos;
  };

  // Función helper para convertir minutos a HH:MM
  const minutosATiempo = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Lista de procedimientos disponibles
  const procedimientosKinesiologia = [
    'Kinesiterapia respiratoria (Ev, KTR, EMR, etc)',
    'Kinesiterapia motora',
    'Kinesiterapia integral (respiratorio + motor)',
    'Cultivo de secreción bronquial',
    'Film array respiratorio',
    'Baciloscopía',
    'Instalación de VMNI',
    'Instalación de CNAF'
  ];

  const procedimientosEnfermeria = [
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
    'IOT',
    'PCR',
    'Instalación de TQT',
    'Cambio de TQT',
    'Decanulación',
    'Traslado a pabellón',
    'Traslado a otra unidad',
    'Ingreso',
    'Curación simple',
    'Diálisis',
    'Curación avanzada',
    'Evaluación de enfermería',
    'Administrativo (redacción de ingresos/traslados, evoluciones, categorización, estadística, etc)',
    'Entrega de turno (solo cuando se recibe turno)'
  ];

  // Función para agregar un procedimiento y guardarlo inmediatamente
  const handleAgregarProcedimiento = async () => {
    if (!user) {
      setMensaje({ tipo: 'error', texto: 'No hay usuario autenticado' });
      return;
    }

    if (!nuevoProcedimiento.nombre || !nuevoProcedimiento.fecha || !nuevoProcedimiento.tiempo) {
      setMensaje({ tipo: 'error', texto: 'Complete todos los campos obligatorios del procedimiento' });
      return;
    }

    setLoadingProcedimientos(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // Preparar el procedimiento para el backend
      const procedimientoParaBackend: ProcedimientoRequest = {
        nombre: nuevoProcedimiento.nombre,
        fecha: nuevoProcedimiento.fecha,
        tiempo: nuevoProcedimiento.tiempo,
        observaciones: nuevoProcedimiento.observaciones || undefined
      };

      // Validar procedimiento
      const validacion = procedimientosKinesiologiaAPI.validarProcedimientos([procedimientoParaBackend]);
      if (!validacion.valido) {
        setMensaje({ tipo: 'error', texto: validacion.errores.join(', ') });
        setLoadingProcedimientos(false);
        return;
      }

      // Enviar al backend
      await procedimientosKinesiologiaAPI.crearProcedimientos({
        pacienteRut,
        procedimientos: [procedimientoParaBackend]
      });

      // Recargar la lista de procedimientos desde el backend
      const data = await procedimientosKinesiologiaAPI.obtenerPorPaciente(pacienteRut, { limit: 50 });
      const procedimientosFormateados = data.procedimientos.map((proc: ProcedimientoKinesiologia) => ({
        id: proc.id,
        nombre: proc.nombre,
        fecha: proc.fecha,
        tiempo: proc.tiempo,
        observaciones: proc.observaciones || '',
        usuario: proc.usuario
      }));
      setProcedimientos(procedimientosFormateados);

      // Limpiar formulario
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setNuevoProcedimiento({
        nombre: '',
        fecha: `${year}-${month}-${day}`,
        tiempo: '00:00',
        observaciones: ''
      });

      setMensaje({ 
        tipo: 'success', 
        texto: `Procedimiento guardado exitosamente para ${pacienteNombre}` 
      });
      
      // Limpiar mensaje después de 2 segundos
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);

    } catch (error: any) {
      console.error('Error al guardar procedimiento:', error);
      
      let errorMessage = 'Error al guardar el procedimiento';
      if (error.message) {
        errorMessage = error.message;
      }
      
      setMensaje({ 
        tipo: 'error', 
        texto: errorMessage 
      });
    } finally {
      setLoadingProcedimientos(false);
    }
  };

  // Función para eliminar un procedimiento
  const handleEliminarProcedimiento = async (id: number) => {
    if (!id) return;
    
    try {
      // Eliminar del backend
      await procedimientosKinesiologiaAPI.eliminar(id);
      
      // Actualizar la lista local
      setProcedimientos(prev => prev.filter(p => p.id !== id));
      setMensaje({ tipo: 'success', texto: 'Procedimiento eliminado correctamente' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    } catch (error) {
      console.error('Error al eliminar procedimiento:', error);
      setMensaje({ tipo: 'error', texto: 'Error al eliminar el procedimiento' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    }
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
    // Limpiar mensaje cuando el usuario cambie valores
    if (mensaje.texto) {
      setMensaje({ tipo: '', texto: '' });
    }
  };

  // Función para mostrar modal de confirmación
  const handleSubmitClick = () => {
    if (!user) {
      setMensaje({ tipo: 'error', texto: 'No hay usuario autenticado' });
      return;
    }

    const puntajeTotal = calcularPuntajeTotal();
    if (puntajeTotal === null) {
      setMensaje({ tipo: 'error', texto: 'Complete todas las categorías antes de guardar' });
      return;
    }

    // Si pasa todas las validaciones, mostrar modal de confirmación
    setShowConfirmModal(true);
  };

  // Función para enviar el formulario después de confirmar
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    
    if (!user) {
      setMensaje({ tipo: 'error', texto: 'No hay usuario autenticado' });
      return;
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const categorizacionData: CategorizacionRequest = {
        pacienteRut,
        fechaCategorizacion,
        patronRespiratorio: categorizacion.respiratorio!,
        asistenciaVentilatoria: categorizacion.asistencia!,
        sasGlasgow: categorizacion.glasgow!,
        tosSecreciones: categorizacion.secreciones!,
        asistencia: categorizacion.asistenciaNueva!
      };

      // Validar datos antes de enviar
      const validacion = categorizacionKinesiologiaAPI.validarCategorizacion(categorizacionData);
      if (!validacion.valido) {
        setMensaje({ tipo: 'error', texto: validacion.errores.join(', ') });
        return;
      }

      await categorizacionKinesiologiaAPI.crear(categorizacionData);
      
      setMensaje({ 
        tipo: 'success', 
        texto: `Categorización guardada exitosamente para ${pacienteNombre}` 
      });
      
      // Limpiar formulario después de guardar
      setTimeout(() => {
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
      }, 2000);

    } catch (error: any) {
      console.error('Error al guardar categorización:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      let errorMessage = 'Error al guardar la categorización';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor. Por favor, contacta al administrador.';
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
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center" style={{zIndex: 9999, width: '100vw', height: '100vh'}}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Registro Kinesiológico</h2>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Paciente:</span> {pacienteNombre} 
              <span className="ml-4 font-medium">RUT:</span> {pacienteRut}
            </p>
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
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Categorización
            </button>
            <button
              onClick={() => setActiveTab('procedimientos')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'procedimientos'
                  ? 'border-red-500 text-red-600'
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
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-center text-gray-800 mb-4">
                  CATEGORIZACIÓN UNIDAD DE PACIENTE CRÍTICO
                </h3>
                
                {/* Tabla principal de categorización */}
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 border">Variables</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700 border">1</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700 border">3</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700 border">5</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Patrón respiratorio */}
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-700 border bg-gray-50">
                          Patrón respiratorio
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('respiratorio', 1)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.respiratorio === 1
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Normal
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('respiratorio', 3)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.respiratorio === 3
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Superficial / FR {'>'}25 - 30 {'<'} / {'[EPOC >24]'}
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('respiratorio', 5)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.respiratorio === 5
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Apremio respiratorio y/o UMA / FR{'>'}30
                          </button>
                        </td>
                      </tr>

                      {/* Asistencia ventilatoria */}
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-700 border bg-gray-50">
                          Asistencia ventilatoria
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('asistencia', 1)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.asistencia === 1
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Sin
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('asistencia', 3)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.asistencia === 3
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            VMNI intermitente
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('asistencia', 5)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.asistencia === 5
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            VMNI o VM continua
                          </button>
                        </td>
                      </tr>

                      {/* Escala de Glasgow */}
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-700 border bg-gray-50">
                          SAS / Glasgow
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('glasgow', 1)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.glasgow === 1
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            5 / {'≥'}12
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('glasgow', 3)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.glasgow === 3
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            3-4 / 12-9
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('glasgow', 5)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.glasgow === 5
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            1-2 / {'>'}9
                          </button>
                        </td>
                      </tr>

                      {/* Secreciones */}
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-700 border bg-gray-50">
                          Tos / Secreciones
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('secreciones', 1)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.secreciones === 1
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Productiva efectiva / +
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('secreciones', 3)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.secreciones === 3
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Productiva poco efectiva / ++
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('secreciones', 5)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.secreciones === 5
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Succión / +++
                          </button>
                        </td>
                      </tr>

                      {/* Asistencia Nueva */}
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-700 border bg-gray-50">
                          Asistencia
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('asistenciaNueva', 1)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.asistenciaNueva === 1
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Mínima o con supervisión
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('asistenciaNueva', 3)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.asistenciaNueva === 3
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Moderada - Requiere asistencia para transferencias
                          </button>
                        </td>
                        <td className="px-2 py-3 text-center border">
                          <button
                            onClick={() => handleCategorizacionChange('asistenciaNueva', 5)}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                              categorizacion.asistenciaNueva === 5
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Máxima o N/E
                          </button>
                        </td>
                      </tr>

                      {/* Fila de puntajes */}
                      <tr className="bg-gray-200">
                        <td className="px-4 py-3 font-bold text-gray-800 border">
                          Puntaje
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-800 border">5</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-800 border">10</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-800 border">15</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tabla de resultados */}
                <div className="mt-6 bg-white rounded-lg shadow overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-4 py-3 text-center font-semibold text-gray-700 border">Complejidad</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700 border">Puntaje</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700 border">Carga Asistencial</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={calcularPuntajeTotal() === 5 ? 'bg-green-100 border-green-300' : ''}>
                        <td className={`px-4 py-3 text-center font-medium border ${
                          calcularPuntajeTotal() === 5 ? 'font-bold text-green-800' : ''
                        }`}>Baja</td>
                        <td className={`px-4 py-3 text-center border ${
                          calcularPuntajeTotal() === 5 ? 'font-bold text-green-800' : ''
                        }`}>5</td>
                        <td className={`px-4 py-3 text-center border ${
                          calcularPuntajeTotal() === 5 ? 'font-bold text-green-800' : ''
                        }`}>0-1</td>
                      </tr>
                      <tr className={calcularPuntajeTotal() !== null && calcularPuntajeTotal()! >= 6 && calcularPuntajeTotal()! <= 10 ? 'bg-yellow-100 border-yellow-300' : ''}>
                        <td className={`px-4 py-3 text-center font-medium border ${
                          calcularPuntajeTotal() !== null && calcularPuntajeTotal()! >= 6 && calcularPuntajeTotal()! <= 10 ? 'font-bold text-yellow-800' : ''
                        }`}>Mediana</td>
                        <td className={`px-4 py-3 text-center border ${
                          calcularPuntajeTotal() !== null && calcularPuntajeTotal()! >= 6 && calcularPuntajeTotal()! <= 10 ? 'font-bold text-yellow-800' : ''
                        }`}>6 a 10</td>
                        <td className={`px-4 py-3 text-center border ${
                          calcularPuntajeTotal() !== null && calcularPuntajeTotal()! >= 6 && calcularPuntajeTotal()! <= 10 ? 'font-bold text-yellow-800' : ''
                        }`}>2-3 + Noche</td>
                      </tr>
                      <tr className={calcularPuntajeTotal() !== null && calcularPuntajeTotal()! >= 11 ? 'bg-red-100 border-red-300' : ''}>
                        <td className={`px-4 py-3 text-center font-medium border ${
                          calcularPuntajeTotal() !== null && calcularPuntajeTotal()! >= 11 ? 'font-bold text-red-800' : ''
                        }`}>Alta</td>
                        <td className={`px-4 py-3 text-center border ${
                          calcularPuntajeTotal() !== null && calcularPuntajeTotal()! >= 11 ? 'font-bold text-red-800' : ''
                        }`}>11 a 15+</td>
                        <td className={`px-4 py-3 text-center border ${
                          calcularPuntajeTotal() !== null && calcularPuntajeTotal()! >= 11 ? 'font-bold text-red-800' : ''
                        }`}>3-4 + Noche</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Marcador de resultado */}
                {calcularPuntajeTotal() !== null && (
                  <div className="mt-6 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-8">
                        <div className="text-center px-4">
                          <span className="text-sm font-medium text-gray-600">Puntaje Total</span>
                          <div className="text-3xl font-bold text-blue-600">{calcularPuntajeTotal()}</div>
                        </div>
                        <div className="text-center px-4 border-l border-gray-300">
                          <span className="text-sm font-medium text-gray-600">Complejidad</span>
                          <div className="text-xl font-semibold text-blue-800">
                            {obtenerComplejidad(calcularPuntajeTotal()!).nivel}
                          </div>
                        </div>
                        <div className="text-center px-4 border-l border-gray-300">
                          <span className="text-sm font-medium text-gray-600">Carga Asistencial</span>
                          <div className="text-lg font-semibold text-blue-800">
                            {obtenerComplejidad(calcularPuntajeTotal()!).carga}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${
                          obtenerComplejidad(calcularPuntajeTotal()!).nivel === 'Baja' ? 'bg-green-500' :
                          obtenerComplejidad(calcularPuntajeTotal()!).nivel === 'Mediana' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Nivel {obtenerComplejidad(calcularPuntajeTotal()!).nivel}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensaje de estado */}
                {mensaje.texto && (
                  <div className={`mt-6 p-4 rounded-lg border ${
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
                      <span className="font-medium">{mensaje.texto}</span>
                    </div>
                  </div>
                )}

                {/* Input de fecha */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <label htmlFor="fecha-categorizacion" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Categorización
                  </label>
                  <input
                    type="date"
                    id="fecha-categorizacion"
                    value={fechaCategorizacion}
                    onChange={(e) => setFechaCategorizacion(e.target.value)}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Botones de acción */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setCategorizacion({ respiratorio: null, asistencia: null, glasgow: null, secreciones: null, asistenciaNueva: null });
                      const today = new Date();
                      const year = today.getFullYear();
                      const month = String(today.getMonth() + 1).padStart(2, '0');
                      const day = String(today.getDate()).padStart(2, '0');
                      setFechaCategorizacion(`${year}-${month}-${day}`);
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={handleSubmitClick}
                    disabled={calcularPuntajeTotal() === null || loading}
                    className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      'Guardar Categorización'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'procedimientos' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-center text-gray-800 mb-4">
                  REGISTRO DE PROCEDIMIENTOS KINESIOLÓGICOS
                </h3>
                
                {/* Formulario para agregar procedimiento */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-4">Agregar Nuevo Procedimiento</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Selector de procedimiento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Procedimiento <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={nuevoProcedimiento.nombre}
                        onChange={(e) => setNuevoProcedimiento(prev => ({ ...prev, nombre: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                      >
                        <option value="">Seleccionar procedimiento</option>
                        
                        {/* Procedimientos de Kinesiología */}
                        <optgroup label="━━━━━ PROCEDIMIENTOS KINESIOLOGÍA ━━━━━">
                          {procedimientosKinesiologia.map((proc) => (
                            <option key={proc} value={proc} className="bg-red-50">{proc}</option>
                          ))}
                        </optgroup>
                        
                        {/* Procedimientos de Equipo */}
                        <optgroup label="━━━━━ PROCEDIMIENTOS DE EQUIPO ━━━━━">
                          {procedimientosEnfermeria.map((proc) => (
                            <option key={proc} value={proc}>{proc}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Fecha */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={nuevoProcedimiento.fecha}
                        onChange={(e) => setNuevoProcedimiento(prev => ({ ...prev, fecha: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    {/* Tiempo en formato HH:MM */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiempo (HH:MM) <span className="text-red-500">*</span>
                      </label>
                      <TimePicker
                        value={nuevoProcedimiento.tiempo || '00:00'}
                        onChange={(value) => setNuevoProcedimiento(prev => ({ ...prev, tiempo: value }))}
                        className="justify-start"
                        required
                      />
                    </div>

                    {/* Botón agregar */}
                    <div className="flex items-end">
                      <button
                        onClick={handleAgregarProcedimiento}
                        disabled={loadingProcedimientos}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        {loadingProcedimientos ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Guardando...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Agregar y Guardar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={nuevoProcedimiento.observaciones}
                      onChange={(e) => setNuevoProcedimiento(prev => ({ ...prev, observaciones: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                      placeholder="Observaciones adicionales del procedimiento..."
                    />
                  </div>
                </div>

                {/* Lista de procedimientos registrados */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-md font-semibold text-gray-700">
                      Procedimientos Registrados ({procedimientos.length})
                    </h4>
                  </div>
                  
                  {procedimientos.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No hay procedimientos registrados</p>
                      <p className="text-sm">Agregue procedimientos utilizando el formulario superior</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {procedimientos.map((procedimiento) => (
                        <div key={procedimiento.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{procedimiento.nombre}</h5>
                                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                                    <span className="flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {new Date(procedimiento.fecha + 'T00:00:00').toLocaleDateString('es-ES')}
                                    </span>
                                    <span className="flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {procedimiento.tiempo}
                                    </span>
                                    {procedimiento.usuario && (
                                      <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {procedimiento.usuario.nombres} {procedimiento.usuario.apellidos}
                                      </span>
                                    )}
                                  </div>
                                  {procedimiento.observaciones && (
                                    <p className="mt-2 text-sm text-gray-600">{procedimiento.observaciones}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleEliminarProcedimiento(procedimiento.id!)}
                              className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                              title="Eliminar procedimiento"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mensaje de estado */}
                {mensaje.texto && (
                  <div className={`mt-4 p-4 rounded-lg border ${
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
                      <span className="font-medium">{mensaje.texto}</span>
                    </div>
                  </div>
                )}
              </div>
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
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirmar Categorización de Kinesiología</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-4">
                ¿Estás seguro de que deseas guardar esta categorización?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Paciente:</span>
                  <span>{pacienteNombre}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Fecha:</span>
                  <span>{new Date(fechaCategorizacion + 'T00:00:00').toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Patrón Respiratorio:</span>
                  <span>{categorizacion.respiratorio}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Asistencia Ventilatoria:</span>
                  <span>{categorizacion.asistencia}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">SAS Glasgow:</span>
                  <span>{categorizacion.glasgow}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Tos y Secreciones:</span>
                  <span>{categorizacion.secreciones}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Asistencia:</span>
                  <span>{categorizacion.asistenciaNueva}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-medium">Puntaje Total:</span>
                  <span className="text-blue-600 font-semibold">{calcularPuntajeTotal()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Complejidad:</span>
                  <span className={`font-semibold ${
                    obtenerComplejidad(calcularPuntajeTotal() || 0).nivel === 'Alta' ? 'text-red-600' :
                    obtenerComplejidad(calcularPuntajeTotal() || 0).nivel === 'Mediana' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {obtenerComplejidad(calcularPuntajeTotal() || 0).nivel}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Carga Asistencial:</span>
                  <span className="text-gray-600">
                    {obtenerComplejidad(calcularPuntajeTotal() || 0).carga}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={loading}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {loading ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalKinesiologia;