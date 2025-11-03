import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pacienteService, Paciente, PacienteInput } from '../services/api';
import { egresosService, Egreso } from '../services/egresosAPI';
import FichaPaciente from './FichaPaciente';
import MenuInicio from './MenuInicio';
import MenuKinesiologia from './MenuKinesiologia';
import MenuEnfermeria from './MenuEnfermeria';
import MenuMedicina from './MenuMedicina';
import MenuTENS from './MenuTENS';
import MenuAuxiliar from './MenuAuxiliar';
import MenuAdministrador from './MenuAdministrador';
import ModalEgresoPaciente from './ModalEgresoPaciente';
import ModalTrasladoInterno from './ModalTrasladoInterno';
import ModalEditarPaciente from './ModalEditarPaciente';
import ModalBloquearCama from './ModalBloquearCama';
import MenuEstadisticasUTI from './MenuEstadisticasUTI';
import MenuEstadisticasMedicina from './MenuEstadisticasMedicina';
import MenuEstadisticasEnfermeria from './MenuEstadisticasEnfermeria';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();  
  const { section, subsection, rut } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Función para obtener el nombre del menú activo basado en los parámetros de URL
  const getActiveMenuFromUrl = () => {
    // Si no hay section pero estamos en el dashboard, usar la URL completa como fallback
    if (!section) {
      // Verificar si estamos navegando a una ruta específica del dashboard
      const pathname = location.pathname;
      if (pathname !== '/dashboard' && pathname !== '/dashboard/') {
        // Extraer la sección de la URL manualmente si los parámetros no están disponibles aún
        const pathParts = pathname.split('/');
        if (pathParts.length >= 3) {
          const urlSection = pathParts[2];
          return getMenuNameFromSection(urlSection, pathParts[3]);
        }
      }
      return 'Inicio';
    }
    
    return getMenuNameFromSection(section, subsection);
  };

  // Función auxiliar para mapear secciones a nombres de menú
  const getMenuNameFromSection = (sectionName?: string, subsectionName?: string) => {
    if (!sectionName) return 'Inicio';
    
    // Mapear nombres de URL a nombres de menú
    const urlToMenuMap: { [key: string]: string } = {
      'inicio': 'Inicio',
      'pacientes': 'Listado de Pacientes',
      'medicina': 'Medicina',
      'enfermeria': 'Enfermería',
      'kinesiologia': 'Kinesiología',
      'tens': 'TENS',
      'auxiliares': 'Auxiliares',
      'egresos': 'Egresos',
      'estadisticas': 'Estadísticas',
      'administrador': 'Administrador'
    };
    
    const menuName = urlToMenuMap[sectionName] || 'Inicio';
    return subsectionName ? `${menuName} - ${subsectionName}` : menuName;
  };

  // Función para convertir nombres de menú a URLs
  const getUrlFromMenuName = (menuName: string) => {
    // Mapear nombres de menú a URLs
    const menuToUrlMap: { [key: string]: string } = {
      'Inicio': 'inicio',
      'Listado de Pacientes': 'pacientes',
      'Medicina': 'medicina',
      'Enfermería': 'enfermeria',
      'Kinesiología': 'kinesiologia',
      'TENS': 'tens',
      'Auxiliares': 'auxiliares',
      'Egresos': 'egresos',
      'Estadísticas': 'estadisticas',
      'Administrador': 'administrador'
    };
    
    // Manejar submenús (formato: "MenuPrincipal - Submenu")
    if (menuName.includes(' - ')) {
      const [mainMenu, submenu] = menuName.split(' - ');
      const mainUrl = menuToUrlMap[mainMenu] || 'inicio';
      const submenuUrl = submenu.toLowerCase().replace(/\s+/g, '-');
      return `/dashboard/${mainUrl}/${submenuUrl}`;
    }
    
    return `/dashboard/${menuToUrlMap[menuName] || 'inicio'}`;
  };
  
  const [activeMenu, setActiveMenu] = useState(getActiveMenuFromUrl());
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Paciente | null>(null);
  const [showFichaPaciente, setShowFichaPaciente] = useState(() => {
    // Mostrar ficha si hay parámetro rut en la URL
    return !!rut;
  });
  const [showModalEgreso, setShowModalEgreso] = useState(false);
  const [pacienteAEgresar, setPacienteAEgresar] = useState<Paciente | null>(null);
  const [showModalTraslado, setShowModalTraslado] = useState(false);
  const [pacienteATrasladar, setPacienteATrasladar] = useState<Paciente | null>(null);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [pacienteAEditar, setPacienteAEditar] = useState<Paciente | null>(null);
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [searchEgresos, setSearchEgresos] = useState('');
  const [searchPacientes, setSearchPacientes] = useState('');
  const [showModalBloquearCama, setShowModalBloquearCama] = useState(false);
  const [camaABloquear, setCamaABloquear] = useState<number | null>(null);
  const [camasBloqueadas, setCamasBloqueadas] = useState<number[]>(() => {
    // Cargar camas bloqueadas desde localStorage al inicializar
    const stored = localStorage.getItem('camasBloqueadas');
    return stored ? JSON.parse(stored) : [];
  });
  const [newPatient, setNewPatient] = useState({
    nombreCompleto: '',
    rut: '',
    numeroFicha: '',
    edad: '',
    camaAsignada: '',
    fechaIngresoUTI: ''
  });
  const [activeStatsTab, setActiveStatsTab] = useState('UTI');

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Actualizar activeMenu cuando cambian los parámetros de URL o la ubicación
  useEffect(() => {
    const newActiveMenu = getActiveMenuFromUrl();
    if (activeMenu !== newActiveMenu) {
      setActiveMenu(newActiveMenu);
    }
  }, [section, subsection, location.pathname]);

  // Actualizar showFichaPaciente basado en parámetro rut
  useEffect(() => {
    setShowFichaPaciente(!!rut);
  }, [rut]);

  // Redirigir a /dashboard/inicio SOLO si la ruta es exactamente /dashboard (sin sección)
  useEffect(() => {
    // Solo redirigir si estamos exactamente en /dashboard sin ninguna sección
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      navigate('/dashboard/inicio', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Definir funciones de carga de datos
  const cargarPacientes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const pacientesData = await pacienteService.obtenerPacientes();
      setPacientes(pacientesData);
    } catch (err) {
      console.error('Error al cargar pacientes:', err);
      setError('Error de conexión al cargar los pacientes');
      setPacientes([]); // Establecer array vacío en caso de error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cargarEgresos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const egresosData = await egresosService.obtenerEgresos();
      setEgresos(egresosData);
    } catch (err) {
      console.error('Error al cargar egresos:', err);
      setError('Error al cargar los egresos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar pacientes cuando se monta el componente
  useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  // Seleccionar paciente basado en parámetro rut de URL (buscar en pacientes activos y egresos)
  useEffect(() => {
    if (rut) {
      // Verificar si ya tenemos el paciente correcto seleccionado
      if (selectedPatient && selectedPatient.rut === rut) {
        return; // Ya está seleccionado el paciente correcto
      }
      
      // Primero buscar en pacientes activos
      if (pacientes.length > 0) {
        const pacienteActivo = pacientes.find(p => p.rut === rut);
        if (pacienteActivo) {
          setSelectedPatient(pacienteActivo);
          return;
        }
      }
      
      // Si no se encuentra en pacientes activos, buscar en egresos
      if (egresos.length > 0) {
        const egresoEncontrado = egresos.find(e => e.rut === rut);
        if (egresoEncontrado) {
          // Convertir egreso a formato Paciente
          const pacienteDesdeEgreso: Paciente = {
            id: egresoEncontrado.pacienteId,
            nombreCompleto: egresoEncontrado.nombreCompleto,
            rut: egresoEncontrado.rut,
            numeroFicha: egresoEncontrado.numeroFicha,
            edad: egresoEncontrado.edad,
            fechaIngresoUTI: egresoEncontrado.fechaIngresoUTI,
            fechaEgresoUTI: egresoEncontrado.fechaEgresoUTI,
            camaAsignada: egresoEncontrado.camaAsignada || undefined,
            createdAt: egresoEncontrado.createdAt || new Date().toISOString(),
            updatedAt: egresoEncontrado.updatedAt || new Date().toISOString()
          };
          setSelectedPatient(pacienteDesdeEgreso);
          return;
        }
      }
      
      // Si no se encuentra ni en pacientes ni en egresos, cargar egresos si no están cargados
      if (egresos.length === 0) {
        cargarEgresos();
        return;
      }
      
      // Si definitivamente no se encuentra, redirigir a lista de pacientes
      navigate('/dashboard/pacientes');
    } else if (!rut && selectedPatient) {
      // Si no hay rut en URL pero hay paciente seleccionado, limpiar selección
      setSelectedPatient(null);
    }
  }, [pacientes, egresos, rut, selectedPatient, navigate, cargarEgresos]);

  // Cargar egresos cuando se selecciona el menú de Egresos o cuando se necesita buscar un paciente por RUT
  useEffect(() => {
    if (activeMenu === 'Egresos' || (rut && egresos.length === 0)) {
      cargarEgresos();
    }
  }, [activeMenu, rut, egresos.length, cargarEgresos]);


  const handleAbrirModalEgreso = (paciente: Paciente) => {
    setPacienteAEgresar(paciente);
    setShowModalEgreso(true);
  };

  const handleCerrarModalEgreso = () => {
    setShowModalEgreso(false);
    setPacienteAEgresar(null);
  };

  const handleConfirmarEgreso = async (fechaEgreso: string, motivoEgreso: string) => {
    if (!pacienteAEgresar) return;

    try {
      setIsLoading(true);
      setError(null);

      await egresosService.crearEgreso({
        pacienteId: pacienteAEgresar.id,
        fechaEgresoUTI: fechaEgreso,
        motivoEgreso: motivoEgreso
      });

      // Recargar pacientes para actualizar la lista
      await cargarPacientes();

      // Cerrar modal
      handleCerrarModalEgreso();

    } catch (err: any) {
      console.error('Error al egresar paciente:', err);
      setError(err.response?.data?.message || 'Error al egresar el paciente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirModalTraslado = (paciente: Paciente) => {
    setPacienteATrasladar(paciente);
    setShowModalTraslado(true);
  };

  const handleCerrarModalTraslado = () => {
    setShowModalTraslado(false);
    setPacienteATrasladar(null);
  };

  const handleConfirmarTraslado = async (nuevaCama: number) => {
    if (!pacienteATrasladar) return;

    try {
      setIsLoading(true);
      setError(null);

      // Actualizar la cama del paciente
      await pacienteService.actualizarPaciente(pacienteATrasladar.id, {
        camaAsignada: nuevaCama.toString()
      });

      // Recargar pacientes para actualizar la lista
      await cargarPacientes();

      // Cerrar modal
      handleCerrarModalTraslado();

    } catch (err: any) {
      console.error('Error al realizar traslado interno:', err);
      setError(err.response?.data?.message || 'Error al realizar el traslado interno');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirModalEditar = (paciente: Paciente) => {
    setPacienteAEditar(paciente);
    setShowModalEditar(true);
  };

  const handleCerrarModalEditar = () => {
    setShowModalEditar(false);
    setPacienteAEditar(null);
  };

  const handleConfirmarEdicion = async (pacienteData: {
    nombreCompleto: string;
    rut: string;
    numeroFicha: string;
    edad: string;
    fechaIngresoUTI: string;
    camaAsignada: string;
  }) => {
    if (!pacienteAEditar) return;

    try {
      setIsLoading(true);
      setError(null);

      // Actualizar el paciente
      await pacienteService.actualizarPaciente(pacienteAEditar.id, pacienteData);

      // Recargar pacientes para actualizar la lista
      await cargarPacientes();

      // Cerrar modal
      handleCerrarModalEditar();

    } catch (err: any) {
      console.error('Error al actualizar paciente:', err);
      setError(err.response?.data?.message || 'Error al actualizar el paciente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirModalBloquearCama = (numeroCama: number) => {
    setCamaABloquear(numeroCama);
    setShowModalBloquearCama(true);
  };

  const handleCerrarModalBloquearCama = () => {
    setShowModalBloquearCama(false);
    setCamaABloquear(null);
  };

  const handleConfirmarBloquearCama = () => {
    if (camaABloquear === null) return;

    const estaBloqueada = camasBloqueadas.includes(camaABloquear);
    let nuevasCamasBloqueadas: number[];

    if (estaBloqueada) {
      // Desbloquear: quitar de la lista
      nuevasCamasBloqueadas = camasBloqueadas.filter(c => c !== camaABloquear);
    } else {
      // Bloquear: agregar a la lista
      nuevasCamasBloqueadas = [...camasBloqueadas, camaABloquear];
    }

    // Actualizar estado
    setCamasBloqueadas(nuevasCamasBloqueadas);
    
    // Guardar en localStorage
    localStorage.setItem('camasBloqueadas', JSON.stringify(nuevasCamasBloqueadas));

    // Cerrar modal
    handleCerrarModalBloquearCama();
  };

  const baseMenuItems = [
    {
      name: 'Inicio',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      submenus: []
    },
    {
      name: 'Listado de Pacientes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      submenus: []
    },
    {
      name: 'Medicina',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      submenus: []
    },
    {
      name: 'Enfermería',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      submenus: []
    },
    {
      name: 'Kinesiología',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      submenus: []
    },
    {
      name: 'TENS',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="8" width="12" height="8" rx="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 12h4M12 10v4" />
        </svg>
      ),
      submenus: []
    },
    {
      name: 'Auxiliares',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      submenus: []
    },
    {
      name: 'Egresos',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      submenus: []
    },
  ];

  // Menú de estadísticas solo para administradores
  const estadisticasMenuItem = {
    name: 'Estadísticas',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    submenus: []
  };

  // Agregar menú de Estadísticas para administradores y supervisores
  // El menú Administrador para administradores y supervisores (Supervisor solo ve Cuestionarios Burnout)
  const esAdministrador = user?.estamento === 'Administrador';
  const esSupervisor = user?.estamento === 'Supervisor';
  const tieneAccesoEstadisticas = esAdministrador || esSupervisor;
  const tieneAccesoAdministrador = esAdministrador || esSupervisor;
  
  const menuItems = esAdministrador
    ? [
        ...baseMenuItems,
        estadisticasMenuItem,
        {
          name: 'Administrador',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          submenus: []
        }
      ]
    : tieneAccesoAdministrador
    ? [
        ...baseMenuItems,
        estadisticasMenuItem,
        {
          name: 'Administrador',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          submenus: []
        }
      ]
    : tieneAccesoEstadisticas
    ? [...baseMenuItems, estadisticasMenuItem]
    : baseMenuItems;

  const handleLogout = () => {
    // Solo limpiar localStorage relacionado con camas bloqueadas
    // El routing ahora se maneja por URL, no por localStorage
    logout();
  };

  // Función para formatear RUT chileno
  // Función para resaltar texto en los resultados de búsqueda
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const formatRut = (rut: string) => {
    // Remover puntos y guiones existentes
    const cleanRut = rut.replace(/[.-]/g, '');
    // Solo permitir números y K
    const validRut = cleanRut.replace(/[^0-9kK]/g, '');
    
    if (validRut.length <= 1) return validRut;
    
    // Separar cuerpo y dígito verificador
    const body = validRut.slice(0, -1);
    const dv = validRut.slice(-1).toUpperCase();
    
    // Formatear con puntos
    let formattedBody = '';
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) {
        formattedBody = '.' + formattedBody;
      }
      formattedBody = body[i] + formattedBody;
    }
    
    return formattedBody + '-' + dv;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'nombreCompleto') {
      value = value.toUpperCase();
    } else if (field === 'rut') {
      value = formatRut(value);
    }
    
    setNewPatient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVerFicha = (paciente: Paciente) => {
    // Navegar a la URL de la ficha del paciente
    navigate(`/dashboard/pacientes/paciente/${paciente.rut}`);
  };

  const handleCloseFicha = () => {
    // Si el paciente es egresado, navegar a egresos, sino a pacientes
    if (selectedPatient?.fechaEgresoUTI) {
      navigate('/dashboard/egresos');
    } else {
      navigate('/dashboard/pacientes');
    }
  };

  const handleAddPatient = async () => {
    try {
      // Validar campos requeridos
      if (!newPatient.nombreCompleto || !newPatient.rut || !newPatient.numeroFicha || 
          !newPatient.edad || !newPatient.fechaIngresoUTI) {
        setError('Todos los campos son obligatorios');
        return;
      }

      setIsLoading(true);
      setError(null);

      // Preparar datos para enviar al backend (incluyendo camaAsignada)
      const pacienteData: PacienteInput = {
        nombreCompleto: newPatient.nombreCompleto,
        rut: newPatient.rut,
        numeroFicha: newPatient.numeroFicha,
        edad: newPatient.edad, // Se mantendrá como string para que el backend lo convierta
        fechaIngresoUTI: newPatient.fechaIngresoUTI,
        camaAsignada: newPatient.camaAsignada
      };


      // Crear paciente en el backend
      await pacienteService.crearPaciente(pacienteData);

      // Recargar lista de pacientes
      await cargarPacientes();

      // Resetear formulario y cerrar modal
      setNewPatient({
        nombreCompleto: '',
        rut: '',
        numeroFicha: '',
        edad: '',
        camaAsignada: '',
        fechaIngresoUTI: ''
      });
      setShowAddPatientModal(false);
      
    } catch (err: any) {
      console.error('Error al crear paciente:', err);
      console.error('Error response data:', err.response?.data);
      
      // Si es un error de la API con detalles específicos
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Si hay errores de validación específicos
        
        const errorMessages = err.response.data.errors.map((e: any) => {
          // Manejar diferentes formatos de error
          if (typeof e === 'string') return e;
          if (e.message) return e.message;
          if (e.msg) return e.msg;
          if (e.field && e.message) return `${e.field}: ${e.message}`;
          return JSON.stringify(e);
        });
        setError(`Errores de validación: ${errorMessages.join(', ')}`);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Error al crear el paciente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular camas disponibles (excluyendo ocupadas y bloqueadas)
  const camasOcupadasPorPacientes = pacientes.filter(p => p.camaAsignada).map(p => p.camaAsignada!);
  const cmasDisponibles = Array.from({ length: 27 }, (_, i) => i + 1)
    .filter(cama => !camasOcupadasPorPacientes.includes(cama) && !camasBloqueadas.includes(cama));
  
  // Función para filtrar pacientes basado en el término de búsqueda
  const pacientesFiltrados = pacientes.filter(paciente => {
    if (!searchPacientes.trim()) return true; // Si no hay término de búsqueda, mostrar todos
    
    const searchLower = searchPacientes.toLowerCase().trim();
    
    // Buscar en nombre completo
    if (paciente.nombreCompleto.toLowerCase().includes(searchLower)) return true;
    
    // Buscar en RUT (remover puntos y guión para búsqueda más flexible)
    if (paciente.rut.replace(/[.-]/g, '').toLowerCase().includes(searchLower.replace(/[.-]/g, ''))) return true;
    
    // Buscar en número de ficha
    if (paciente.numeroFicha.toLowerCase().includes(searchLower)) return true;
    
    // Buscar por número de cama
    if (paciente.camaAsignada && paciente.camaAsignada.toString().includes(searchLower)) return true;
    
    return false;
  });

  // Calcular estadísticas (usando todos los pacientes, no filtrados)
  const totalCamas = 27;
  const pacientesActivos = pacientes.filter(p => p.camaAsignada).length;
  const camasOcupadas = pacientesActivos;
  const camasLibres = totalCamas - camasOcupadas - camasBloqueadas.length;
  const porcentajeOcupacion = totalCamas > 0 ? Math.round((camasOcupadas / totalCamas) * 100) : 0;
  
  // Estadísticas de búsqueda (usando pacientes filtrados)
  const pacientesFiltradosConCama = pacientesFiltrados.filter(p => p.camaAsignada).length;
  const mostrarEstadisticasFiltro = searchPacientes.trim() !== '';

  // Función para obtener el paciente asignado a una cama específica (usando pacientes filtrados)
  const getPacientePorCama = (numeroCama: number) => {
    return pacientesFiltrados.find(paciente => 
      paciente.camaAsignada === numeroCama
    );
  };

  // Crear un array de camas con sus respectivos pacientes
  const camasConPacientes = (() => {
    if (searchPacientes.trim()) {
      // Si hay búsqueda, mostrar solo camas con pacientes que coinciden
      return pacientesFiltrados
        .filter(paciente => paciente.camaAsignada)
        .map(paciente => ({
          numero: paciente.camaAsignada!,
          paciente: paciente
        }))
        .sort((a, b) => a.numero - b.numero);
    } else {
      // Si no hay búsqueda, mostrar todas las 27 camas
      return Array.from({ length: 27 }, (_, index) => {
        const numeroCama = index + 1;
        const paciente = getPacientePorCama(numeroCama);
        return {
          numero: numeroCama,
          paciente: paciente || null
        };
      });
    }
  })();

  const renderContent = () => {
    // Si hay un paciente seleccionado, mostrar su ficha
    if (selectedPatient && showFichaPaciente) {
      return (
        <FichaPaciente
          paciente={selectedPatient}
          onClose={handleCloseFicha}
        />
      );
    }

    switch (activeMenu) {
      case 'Listado de Pacientes':
        return (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Listado de Pacientes UTI
              </h1>
              <p className="text-gray-600 mb-6">
                Listado completo de pacientes activos en la Unidad de Terapia Intensiva
              </p>
            </div>

            {/* Header con búsqueda y botón de agregar */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchPacientes}
                    onChange={(e) => setSearchPacientes(e.target.value)}
                    className="block w-80 pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Buscar por nombre, RUT o número de cama..."
                  />
                  {searchPacientes && (
                    <button
                      onClick={() => setSearchPacientes('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      title="Limpiar búsqueda"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {mostrarEstadisticasFiltro && (
                  <div className="text-sm text-gray-600">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                      {pacientesFiltradosConCama} paciente(s) encontrado(s)
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105"
                title="Agregar nuevo paciente"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Tabla estilo Apple */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Cama
                      </th>
                      <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        RUT
                      </th>
                      <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        N° Ficha
                      </th>
                      <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Apache II
                      </th>
                      <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        NAS
                      </th>
                      <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Cat. Kinesiología
                      </th>
                      <th scope="col" className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {/* Mensaje cuando no hay resultados de búsqueda */}
                    {mostrarEstadisticasFiltro && pacientesFiltradosConCama === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron pacientes</h3>
                            <p className="text-gray-500 mb-4">
                              No hay pacientes que coincidan con "{searchPacientes}"
                            </p>
                            <button
                              onClick={() => setSearchPacientes('')}
                              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              Limpiar búsqueda
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {/* Tabla normal de camas */}
                    {(!mostrarEstadisticasFiltro || pacientesFiltradosConCama > 0) && camasConPacientes.map((cama) => (
                      <tr key={cama.numero} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className={`h-8 w-8 rounded-md ${
                                cama.paciente 
                                  ? 'bg-red-100 border-red-200' 
                                  : camasBloqueadas.includes(cama.numero)
                                  ? 'bg-gray-200 border-gray-300'
                                  : 'bg-blue-100 border-gray-200'
                              } flex items-center justify-center border`}>
                                <span className={`text-sm font-semibold ${
                                  cama.paciente 
                                    ? 'text-red-700' 
                                    : camasBloqueadas.includes(cama.numero)
                                    ? 'text-gray-700'
                                    : 'text-blue-700'
                                }`}>{cama.numero}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          {cama.paciente ? (
                            <div>
                              <div className="font-medium text-gray-900">
                                {highlightText(cama.paciente.nombreCompleto, searchTerm)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Edad: {cama.paciente.edad} años
                              </div>
                            </div>
                          ) : camasBloqueadas.includes(cama.numero) ? (
                            <span className="text-gray-600 font-medium">Bloqueada</span>
                          ) : (
                            <span className="text-gray-400">Disponible</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          {cama.paciente ? (
                            <span className="text-gray-900">
                              {highlightText(cama.paciente.rut, searchTerm)}
                            </span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          {cama.paciente ? (
                            <span className="text-gray-900">
                              {highlightText(cama.paciente.numeroFicha, searchTerm)}
                            </span>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          {cama.paciente?.ultimoApache ? (
                            <div>
                              <div className="font-medium text-gray-900">{cama.paciente.ultimoApache.puntaje}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(cama.paciente.ultimoApache.fecha).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          {cama.paciente?.ultimoNAS ? (
                            <div>
                              <div className="font-medium text-gray-900">{cama.paciente.ultimoNAS.puntaje}%</div>
                              <div className="text-xs text-gray-500">
                                {new Date(cama.paciente.ultimoNAS.fecha).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          {cama.paciente?.ultimaCategorizacion ? (
                            <div>
                              <div className="font-medium text-gray-900">{cama.paciente.ultimaCategorizacion.complejidad}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(cama.paciente.ultimaCategorizacion.fecha).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-center text-sm">
                          {cama.paciente ? (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors duration-150"
                                title="Ver detalles"
                                onClick={() => handleVerFicha(cama.paciente!)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors duration-150"
                                title="Editar"
                                onClick={() => handleAbrirModalEditar(cama.paciente!)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded transition-colors duration-150"
                                title="Traslado interno (cambio de cama)"
                                onClick={() => handleAbrirModalTraslado(cama.paciente!)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              </button>
                              <button
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-150"
                                title="Egresar paciente"
                                onClick={() => handleAbrirModalEgreso(cama.paciente!)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              {camasBloqueadas.includes(cama.numero) ? (
                                <>
                                  <span className="text-xs text-orange-600 font-medium">Bloqueada</span>
                                  <button
                                    className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded transition-colors duration-150"
                                    title="Desbloquear cama"
                                    onClick={() => handleAbrirModalBloquearCama(cama.numero)}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="text-xs text-gray-400">Disponible</span>
                                  <button
                                    className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors duration-150"
                                    title="Bloquear cama"
                                    onClick={() => handleAbrirModalBloquearCama(cama.numero)}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Camas</dt>
                      <dd className="text-lg font-medium text-gray-900">27</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Camas Disponibles</dt>
                      <dd className="text-lg font-medium text-gray-900">{camasLibres}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Camas Ocupadas</dt>
                      <dd className="text-lg font-medium text-gray-900">{camasOcupadas}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Camas Bloqueadas</dt>
                      <dd className="text-lg font-medium text-gray-900">{camasBloqueadas.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Ocupación</dt>
                      <dd className="text-lg font-medium text-gray-900">{porcentajeOcupacion}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Inicio':
        return <MenuInicio />;

      case 'Kinesiología':
        return (
          <MenuKinesiologia 
            onOpenModal={() => {
              // Aquí se abrirá el modal de kinesiología
            }}
          />
        );

      case 'Enfermería':
        return (
          <MenuEnfermeria 
            onOpenModal={() => {
              // Aquí se abrirá el modal de enfermería
            }}
          />
        );

      case 'Medicina':
        return (
          <MenuMedicina 
            onOpenModal={() => {
              // Aquí se abrirá el modal de medicina
            }}
          />
        );

      case 'TENS':
        return (
          <MenuTENS 
            onOpenModal={() => {
              // Aquí se abrirá el modal de TENS
            }}
          />
        );

      case 'Auxiliares':
        return (
          <MenuAuxiliar 
            onOpenModal={() => {
              // Aquí se abrirá el modal de auxiliares
            }}
          />
        );

      case 'Egresos':
        // Filtrar egresos por búsqueda
        const egresosFiltrados = egresos.filter(egreso => {
          if (!searchEgresos.trim()) return true;
          const searchLower = searchEgresos.toLowerCase().trim();
          return (
            egreso.nombreCompleto.toLowerCase().includes(searchLower) ||
            egreso.rut.toLowerCase().includes(searchLower) ||
            egreso.numeroFicha.toLowerCase().includes(searchLower) ||
            egreso.motivoEgreso.toLowerCase().includes(searchLower)
          );
        });

        // Calcular estadísticas
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const egresosHoy = egresos.filter(e => {
          const fechaEgreso = new Date(e.fechaEgresoUTI);
          fechaEgreso.setHours(0, 0, 0, 0);
          return fechaEgreso.getTime() === hoy.getTime();
        }).length;

        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        const egresosSemana = egresos.filter(e => new Date(e.fechaEgresoUTI) >= inicioSemana).length;

        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const egresosMes = egresos.filter(e => new Date(e.fechaEgresoUTI) >= inicioMes).length;

        const formatearFecha = (fecha: string) => {
          // Extraer la fecha sin conversión de zona horaria
          const date = new Date(fecha);
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          return `${day}/${month}/${year}`;
        };

        const getColorMotivo = (motivo: string) => {
          switch (motivo) {
            case 'Traslado dentro de UPC':
              return 'bg-blue-500 text-white';
            case 'Traslado a UCM o fuera de UPC':
              return 'bg-yellow-500 text-white';
            case 'Traslado a extrasistema':
              return 'bg-purple-500 text-white';
            case 'Fallecimiento':
              return 'bg-gray-700 text-white';
            default:
              return 'bg-gray-500 text-white';
          }
        };

        const getEstadoCama = (camaAsignada: number | null) => {
          if (!camaAsignada) return { texto: '--', color: 'text-gray-500' };
          
          if (camasBloqueadas.includes(camaAsignada)) {
            return { texto: 'Bloqueada', color: 'text-gray-700' };
          }
          
          return { texto: camaAsignada.toString(), color: 'text-gray-900' };
        };

        return (
          <div className="space-y-4 md:space-y-6 pb-16 md:pb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Egresos de Pacientes</h1>
            
            {/* Estadísticas de Egresos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-green-500 rounded-lg shadow-lg p-4 md:p-6 text-white">
                <h3 className="text-sm md:text-lg font-semibold">Egresos Hoy</h3>
                <p className="text-2xl md:text-3xl font-bold">{egresosHoy}</p>
              </div>
              <div className="bg-blue-500 rounded-lg shadow-lg p-4 md:p-6 text-white">
                <h3 className="text-sm md:text-lg font-semibold">Esta Semana</h3>
                <p className="text-2xl md:text-3xl font-bold">{egresosSemana}</p>
              </div>
              <div className="bg-purple-500 rounded-lg shadow-lg p-4 md:p-6 text-white">
                <h3 className="text-sm md:text-lg font-semibold">Este Mes</h3>
                <p className="text-2xl md:text-3xl font-bold">{egresosMes}</p>
              </div>
            </div>

            {/* Lista de Egresos */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">Registro de Egresos</h2>
                </div>
                
                {/* Búsqueda */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchEgresos}
                    onChange={(e) => setSearchEgresos(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 md:py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                    placeholder="Buscar por nombre, RUT o número de ficha..."
                  />
                  {searchEgresos && (
                    <button
                      onClick={() => setSearchEgresos('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Vista Desktop - Tabla */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Ingreso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Egreso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días UTI</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {egresosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay egresos registrados</h3>
                            <p className="text-gray-500">
                              {searchEgresos ? 'No se encontraron egresos que coincidan con la búsqueda' : 'Los egresos aparecerán aquí'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      egresosFiltrados.map((egreso) => (
                        <tr key={egreso.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{egreso.nombreCompleto}</div>
                            <div className="text-xs text-gray-500">Edad: {egreso.edad} años</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{egreso.rut}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={getEstadoCama(egreso.camaAsignada).color}>
                              {getEstadoCama(egreso.camaAsignada).texto}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatearFecha(egreso.fechaIngresoUTI)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatearFecha(egreso.fechaEgresoUTI)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded ${getColorMotivo(egreso.motivoEgreso)}`}>
                              {egreso.motivoEgreso}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {egreso.diasEstadia} {egreso.diasEstadia === 1 ? 'día' : 'días'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => navigate(`/dashboard/pacientes/paciente/${egreso.rut}`)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Ver ficha
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Vista Móvil - Cards */}
              <div className="lg:hidden space-y-4">
                {egresosFiltrados.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-400 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay egresos registrados</h3>
                    <p className="text-gray-500">
                      {searchEgresos ? 'No se encontraron egresos que coincidan con la búsqueda' : 'Los egresos aparecerán aquí'}
                    </p>
                  </div>
                ) : (
                  egresosFiltrados.map((egreso) => (
                    <div key={egreso.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      {/* Header del paciente */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{egreso.nombreCompleto}</h3>
                            <p className="text-sm text-gray-600">RUT: {egreso.rut}</p>
                            <p className="text-sm text-gray-500">Edad: {egreso.edad} años</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              <span className="text-gray-500">Cama: </span>
                              <span className={getEstadoCama(egreso.camaAsignada).color}>
                                {getEstadoCama(egreso.camaAsignada).texto}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Información del paciente */}
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Fecha Ingreso:</span>
                            <span className="text-sm text-gray-900">{formatearFecha(egreso.fechaIngresoUTI)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Fecha Egreso:</span>
                            <span className="text-sm text-gray-900">{formatearFecha(egreso.fechaEgresoUTI)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">Días UTI:</span>
                            <span className="text-sm text-gray-900">
                              {egreso.diasEstadia} {egreso.diasEstadia === 1 ? 'día' : 'días'}
                            </span>
                          </div>
                        </div>

                        {/* Motivo de egreso */}
                        <div className="pt-2">
                          <span className="text-sm font-medium text-gray-500 block mb-1">Motivo:</span>
                          <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getColorMotivo(egreso.motivoEgreso)}`}>
                            {egreso.motivoEgreso}
                          </span>
                        </div>

                        {/* Botón de acción */}
                        <div className="pt-3">
                          <button
                            onClick={() => navigate(`/dashboard/pacientes/paciente/${egreso.rut}`)}
                            className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver ficha completa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'Estadísticas':
        // Verificar permisos de administrador o supervisor
        if (user?.estamento !== 'Administrador' && user?.estamento !== 'Supervisor') {
          return (
            <div className="space-y-6 pb-16 md:pb-8">
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Acceso Restringido
                </h2>
                <p className="text-gray-600 mb-6">
                  No tienes permisos para acceder a las estadísticas del sistema.
                </p>
                <p className="text-sm text-gray-500">
                  Esta sección está disponible únicamente para administradores.
                </p>
              </div>
            </div>
          );
        }

        const statsTabOptions = ['UTI', 'Medicina', 'Enfermería', 'Kinesiología', 'TENS', 'Auxiliares'];

        const getStatsTitle = () => {
          switch (activeStatsTab) {
            case 'UTI':
              return 'Estadísticas UTI';
            case 'Medicina':
              return 'Estadísticas de Medicina';
            case 'Enfermería':
              return 'Estadísticas de Enfermería';
            case 'Kinesiología':
              return 'Estadísticas de Kinesiología';
            case 'TENS':
              return 'Estadísticas de TENS';
            case 'Auxiliares':
              return 'Estadísticas de Auxiliares';
            default:
              return 'Estadísticas del Sistema';
          }
        };

        const getStatsDescription = () => {
          switch (activeStatsTab) {
            case 'UTI':
              return 'Métricas generales y estado de la Unidad de Terapia Intensiva';
            case 'Medicina':
              return 'Estadísticas de procedimientos y actividades médicas';
            case 'Enfermería':
              return 'Métricas de enfermería y evaluaciones NAS';
            case 'Kinesiología':
              return 'Estadísticas de categorizaciones y procedimientos kinesiológicos';
            case 'TENS':
              return 'Métricas de actividades y procedimientos TENS';
            case 'Auxiliares':
              return 'Métricas de actividades y procedimientos auxiliares';
            default:
              return 'Panel de estadísticas y métricas de rendimiento';
          }
        };

        const renderStatsContent = () => {
          switch (activeStatsTab) {
            case 'UTI':
              return (
                <div className="space-y-6">
                  <p className="text-gray-600 text-center">
                    Contenido de estadísticas UTI - En desarrollo
                  </p>
                </div>
              );
            case 'Medicina':
              return (
                <div className="space-y-6">
                  <p className="text-gray-600 text-center">
                    Contenido de estadísticas de Medicina - En desarrollo
                  </p>
                </div>
              );
            case 'Enfermería':
              return (
                <div className="space-y-6">
                  <p className="text-gray-600 text-center">
                    Contenido de estadísticas de Enfermería - En desarrollo
                  </p>
                </div>
              );
            case 'Kinesiología':
              return (
                <div className="space-y-6">
                  <p className="text-gray-600 text-center">
                    Contenido de estadísticas de Kinesiología - En desarrollo
                  </p>
                </div>
              );
            case 'TENS':
              return (
                <div className="space-y-6">
                  <p className="text-gray-600 text-center">
                    Contenido de estadísticas de TENS - En desarrollo
                  </p>
                </div>
              );
            case 'Auxiliares':
              return (
                <div className="space-y-6">
                  <p className="text-gray-600 text-center">
                    Contenido de estadísticas de Auxiliares - En desarrollo
                  </p>
                </div>
              );
            default:
              return null;
          }
        };

        // Mostrar estadísticas por estamento si hay subsection
        if (subsection) {
          switch (subsection.toLowerCase()) {
            case 'medicina':
              return <MenuEstadisticasMedicina />;
            case 'enfermeria':
              return <MenuEstadisticasEnfermeria />;
            case 'kinesiologia':
              return <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Estadísticas de Kinesiología
                </h2>
                <p className="text-gray-600">
                  Contenido de estadísticas de Kinesiología - En desarrollo
                </p>
              </div>;
            case 'tens':
              return <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Estadísticas de TENS
                </h2>
                <p className="text-gray-600">
                  Contenido de estadísticas de TENS - En desarrollo
                </p>
              </div>;
            case 'auxiliares':
              return <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Estadísticas de Auxiliares
                </h2>
                <p className="text-gray-600">
                  Contenido de estadísticas de Auxiliares - En desarrollo
                </p>
              </div>;
            default:
              return <MenuEstadisticasUTI />;
          }
        }
        
        return <MenuEstadisticasUTI />;

      case 'Administrador':
        // Administradores y supervisores pueden acceder al menú de administrador
        // (Supervisor solo verá la pestaña de Cuestionarios Burnout)
        if (user?.estamento !== 'Administrador' && user?.estamento !== 'Supervisor') {
          return (
            <div className="space-y-6 pb-16 md:pb-8">
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Acceso Restringido
                </h2>
                <p className="text-gray-600 mb-6">
                  No tienes permisos para acceder al menú de administración del sistema.
                </p>
                <p className="text-sm text-gray-500">
                  Esta sección está disponible únicamente para administradores.
                </p>
              </div>
            </div>
          );
        }
        return <MenuAdministrador />;

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {activeMenu}
            </h2>
            <p className="text-gray-600 mb-6">
              Contenido de {activeMenu} estará disponible próximamente.
            </p>
            
            {/* Mostrar información específica si es un submenú */}
            {activeMenu.includes(' - ') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-lg mx-auto">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  {activeMenu.split(' - ')[1]}
                </h3>
                <p className="text-blue-700 text-sm">
                  Sección específica del módulo {activeMenu.split(' - ')[0]}
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Overlay oscuro para móviles cuando el menú está abierto */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile 
          ? `fixed inset-y-0 left-0 z-50 w-72 sm:w-64 transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'w-64'
        } 
        bg-white shadow-lg flex flex-col
      `}>
        {/* App Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <div className="flex items-center space-x-2 sm:space-x-3">
               <img 
                src="/logodefinitivo5.png" 
                alt="VitalMape Logo" 
                className="h-6 sm:h-8"
              />
              <h2 className="text-xl font-bold">
                <span style={{ color: '#2595eb' }}>Vital</span>
                <span style={{ color: '#2563eb' }}>Mape UTI</span>
              </h2>
            </div>
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 mt-2 sm:mt-4 overflow-y-auto">
          {menuItems.map((item) => (
            <div 
              key={item.name}
              onMouseEnter={() => setHoveredMenu(item.name)}
              onMouseLeave={() => setHoveredMenu(null)}
            >
              <button
                onClick={() => {
                  const url = getUrlFromMenuName(item.name);
                  navigate(url);
                  if (isMobile) setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gray-50 transition-colors ${
                  activeMenu === item.name || activeMenu.startsWith(item.name + ' -')
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700'
                }`}
              >
                <span className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center ${activeMenu === item.name || activeMenu.startsWith(item.name + ' -') ? 'text-blue-700' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                <span className="ml-3 font-medium">{item.name}</span>
                {item.submenus.length > 0 && (
                  <svg
                    className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                      hoveredMenu === item.name ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              {/* Submenús desplegables dentro del sidebar */}
              {hoveredMenu === item.name && item.submenus.length > 0 && (
                <div className="bg-gray-50 border-l-2 border-blue-200">
                  {item.submenus.map((submenu) => (
                    <button
                      key={submenu}
                      onClick={() => {
                        const url = getUrlFromMenuName(`${item.name} - ${submenu}`);
                        navigate(url);
                        if (isMobile) setIsMobileMenuOpen(false);
                      }}
                      className={`w-full px-8 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                        activeMenu === `${item.name} - ${submenu}`
                          ? 'bg-blue-100 text-blue-800 font-medium'
                          : 'text-gray-600'
                      }`}
                    >
                      {submenu}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Section - Footer del Sidebar */}
        <div className="border-t bg-gray-50">
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-sm font-bold text-white">
                    {user?.nombres?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {user?.nombres || 'Nombre'} {user?.apellidos || 'Apellido'}
                  </p>
                  <p className="text-xs text-gray-500 leading-tight">
                    {user?.estamento || 'Rol'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Botón hamburguesa para móviles */}
              {isMobile && (
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Abrir menú"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <h1 className="text-2xl font-semibold text-gray-800 truncate">{activeMenu}</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="text-xs text-gray-500 sm:hidden">
                {new Date().toLocaleDateString('es-ES', { 
                  day: 'numeric', 
                  month: 'short'
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {renderContent()}
        </main>
      </div>

      {/* Modal para agregar paciente */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Agregar Nuevo Paciente</h3>
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 flex-1 overflow-y-auto">
              {/* Mensaje de error */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              
              <form className="space-y-4">
                {/* Nombre Completo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={newPatient.nombreCompleto}
                    onChange={(e) => handleInputChange('nombreCompleto', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase text-gray-900"
                    placeholder="INGRESE EL NOMBRE COMPLETO"
                  />
                </div>

                {/* RUT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUT
                  </label>
                  <input
                    type="text"
                    value={newPatient.rut}
                    onChange={(e) => handleInputChange('rut', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="12.345.678-9"
                    maxLength={12}
                  />
                </div>

                {/* Número de Ficha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° Ficha
                  </label>
                  <input
                    type="text"
                    value={newPatient.numeroFicha}
                    onChange={(e) => handleInputChange('numeroFicha', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="12345"
                  />
                </div>

                {/* Edad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Edad
                  </label>
                  <input
                    type="number"
                    value={newPatient.edad}
                    onChange={(e) => handleInputChange('edad', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Edad en años"
                    min="0"
                    max="150"
                  />
                </div>

                {/* Fecha de Ingreso a UTI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Ingreso a UTI
                  </label>
                  <input
                    type="date"
                    value={newPatient.fechaIngresoUTI}
                    onChange={(e) => handleInputChange('fechaIngresoUTI', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
                  />
                </div>

                {/* Cama Asignada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cama Asignada
                  </label>
                  <select
                    value={newPatient.camaAsignada}
                    onChange={(e) => handleInputChange('camaAsignada', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Seleccionar cama</option>
                    {cmasDisponibles.map((cama) => (
                      <option key={cama} value={cama}>
                        Cama {cama}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>

            {/* Footer del modal */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPatient}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </div>
                ) : (
                  'Agregar Paciente'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de egreso */}
      {showModalEgreso && pacienteAEgresar && (
        <ModalEgresoPaciente
          paciente={pacienteAEgresar}
          onClose={handleCerrarModalEgreso}
          onConfirm={handleConfirmarEgreso}
          isLoading={isLoading}
        />
      )}

      {/* Modal de traslado interno */}
      {showModalTraslado && pacienteATrasladar && (
        <ModalTrasladoInterno
          paciente={pacienteATrasladar}
          camasOcupadas={pacientes.filter(p => p.camaAsignada).map(p => p.camaAsignada!)}
          onClose={handleCerrarModalTraslado}
          onConfirm={handleConfirmarTraslado}
          isLoading={isLoading}
        />
      )}

      {/* Modal de edición */}
      {showModalEditar && pacienteAEditar && (
        <ModalEditarPaciente
          paciente={pacienteAEditar}
          camasOcupadas={pacientes.filter(p => p.camaAsignada).map(p => p.camaAsignada!)}
          onClose={handleCerrarModalEditar}
          onConfirm={handleConfirmarEdicion}
          isLoading={isLoading}
        />
      )}

      {/* Modal de bloquear/desbloquear cama */}
      {showModalBloquearCama && camaABloquear !== null && (
        <ModalBloquearCama
          numeroCama={camaABloquear}
          estaBloqueada={camasBloqueadas.includes(camaABloquear)}
          onClose={handleCerrarModalBloquearCama}
          onConfirm={handleConfirmarBloquearCama}
        />
      )}

    </div>
  );
};

export default Dashboard;