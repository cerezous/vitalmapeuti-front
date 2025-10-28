import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import burnoutAPI, { RespuestaBurnout } from '../services/burnoutAPI';

interface CuestionarioBurnout {
  id: number;
  usuarioId: number;
  estamento: string;
  fechaRespuesta: string;
  agotamientoEmocional: number;
  despersonalizacion: number;
  realizacionPersonal: number;
  nivelAgotamiento: string;
  nivelDespersonalizacion: string;
  nivelRealizacion: string;
  usuario?: {
    nombres: string;
    apellidos: string;
    usuario: string;
  };
}

interface EstadisticasBurnout {
  totalCuestionarios: number;
  porEstamento: {
    [key: string]: {
      total: number;
      promedioAgotamiento: number;
      promedioDespersonalizacion: number;
      promedioRealizacion: number;
      nivelAgotamientoAlto: number;
      nivelDespersonalizacionAlto: number;
      nivelRealizacionBajo: number;
    };
  };
}

const MenuCuestionariosBurnout: React.FC = () => {
  const { user } = useAuth();
  const [cuestionarios, setCuestionarios] = useState<CuestionarioBurnout[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasBurnout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCuestionario, setSelectedCuestionario] = useState<CuestionarioBurnout | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRespuestasModal, setShowRespuestasModal] = useState(false);
  const [respuestasDetalladas, setRespuestasDetalladas] = useState<RespuestaBurnout | null>(null);
  const [loadingRespuestas, setLoadingRespuestas] = useState(false);
  const [filtroEstamento, setFiltroEstamento] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.estamento === 'Administrador') {
      cargarDatos();
    }
  }, [user]);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar cuestionarios y estadísticas en paralelo
      const [cuestionariosData, estadisticasData] = await Promise.all([
        burnoutAPI.obtenerTodosCuestionarios(),
        burnoutAPI.obtenerEstadisticas()
      ]);

      setCuestionarios(cuestionariosData);
      setEstadisticas(estadisticasData);
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      
      // Si es un error de estadísticas pero hay cuestionarios, mostrar solo los cuestionarios
      if (err.message?.includes('estadísticas') && cuestionarios.length === 0) {
        try {
          const soloCuestionarios = await burnoutAPI.obtenerTodosCuestionarios();
          setCuestionarios(soloCuestionarios);
          setEstadisticas({
            totalCuestionarios: soloCuestionarios.length,
            porEstamento: {}
          });
        } catch (cuestionariosError) {
          setError('Error al cargar los cuestionarios. Por favor, inténtalo de nuevo.');
        }
      } else {
        setError('Error al cargar los cuestionarios. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerDetalle = (cuestionario: CuestionarioBurnout) => {
    setSelectedCuestionario(cuestionario);
    setShowDetailModal(true);
  };

  const handleVerRespuestas = async (cuestionario: CuestionarioBurnout) => {
    try {
      setLoadingRespuestas(true);
      setSelectedCuestionario(cuestionario);
      
      // Obtener respuestas detalladas del backend
      const respuestas = await burnoutAPI.obtenerRespuestasDetalladas(cuestionario.id);
      setRespuestasDetalladas(respuestas);
      setShowRespuestasModal(true);
    } catch (error) {
      console.error('Error al cargar respuestas detalladas:', error);
      alert('Error al cargar las respuestas detalladas. Por favor, inténtalo de nuevo.');
    } finally {
      setLoadingRespuestas(false);
    }
  };

  const formatearFecha = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel.toLowerCase()) {
      case 'alto':
        return 'bg-red-100 text-red-800';
      case 'medio':
        return 'bg-yellow-100 text-yellow-800';
      case 'bajo':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función helper para obtener la respuesta de manera type-safe
  const obtenerRespuesta = (respuestas: RespuestaBurnout, preguntaId: string): number => {
    const key = preguntaId as keyof RespuestaBurnout;
    return respuestas[key] || 0;
  };

  // Función para imprimir las respuestas
  const imprimirRespuestas = () => {
    if (!selectedCuestionario || !respuestasDetalladas) return;

    const preguntas = [
      { id: 'p1', pregunta: 'Me siento emocionalmente agotado/a por mi trabajo' },
      { id: 'p2', pregunta: 'Me siento cansado/a al final de una jornada laboral' },
      { id: 'p3', pregunta: 'Me siento fatigado/a cuando me levanto por la mañana y me enfrento a otra jornada laboral' },
      { id: 'p4', pregunta: 'Comprendo fácilmente cómo se sienten los pacientes/usuarios' },
      { id: 'p5', pregunta: 'Creo que trato a algunos pacientes/usuarios como objetos impersonales' },
      { id: 'p6', pregunta: 'Trabajar todo el día con mucha gente es un esfuerzo' },
      { id: 'p7', pregunta: 'Trato muy eficazmente los problemas personales' },
      { id: 'p8', pregunta: 'Me siento quemado (extremadamente agotado) por mi trabajo' },
      { id: 'p9', pregunta: 'Creo que estoy influyendo positivamente con mi trabajo en las vidas de otras personas' },
      { id: 'p10', pregunta: 'Me he vuelto más insensible con la gente desde que ejerzo esta profesión' },
      { id: 'p11', pregunta: 'Me preocupa el hecho de que este trabajo me esté endureciendo emocionalmente' },
      { id: 'p12', pregunta: 'Me siento muy activo/a' },
      { id: 'p13', pregunta: 'Me siento frustrado/a en mi trabajo' },
      { id: 'p14', pregunta: 'Creo que estoy trabajando demasiado' },
      { id: 'p15', pregunta: 'En realidad, no me preocupa lo que ocurre a alguno de mis pacientes/usuarios' },
      { id: 'p16', pregunta: 'Trabajar directamente con las personas me produce estrés' },
      { id: 'p17', pregunta: 'Me siento estimulado/a después de trabajar en contacto con mis pacientes' },
      { id: 'p18', pregunta: 'Puedo crear fácilmente una atmósfera relajada con mis pacientes' },
      { id: 'p19', pregunta: 'He conseguido muchas cosas útiles en mi profesión' },
      { id: 'p20', pregunta: 'Me siento acabado/a' },
      { id: 'p21', pregunta: 'Trato los problemas emocionales con mucha calma en mi trabajo' },
      { id: 'p22', pregunta: 'Siento que los pacientes/usuarios me culpan por algunos de sus problemas' }
    ];

    const obtenerDescripcionRespuesta = (valor: number): string => {
      switch (valor) {
        case 0: return 'Nunca';
        case 1: return 'Pocas veces al año';
        case 2: return 'Una vez al mes';
        case 3: return 'Pocas veces al mes';
        case 4: return 'Una vez a la semana';
        case 5: return 'Pocas veces a la semana';
        case 6: return 'Todos los días';
        default: return 'Sin respuesta';
      }
    };

    const obtenerColorRespuesta = (valor: number): string => {
      switch (valor) {
        case 0: return '#10B981'; // green-500
        case 1: return '#3B82F6'; // blue-500
        case 2: return '#06B6D4'; // cyan-500
        case 3: return '#EAB308'; // yellow-500
        case 4: return '#F97316'; // orange-500
        case 5: return '#EF4444'; // red-500
        case 6: return '#1F2937'; // gray-900 (más oscuro para mejor contraste)
        default: return '#6B7280'; // gray-500
      }
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test de Burnout - ${selectedCuestionario.usuario?.nombres} ${selectedCuestionario.usuario?.apellidos}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 12px;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 8px;
            border-bottom: 2px solid #000;
            padding-bottom: 4px;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
          }
          .header p {
            margin: 2px 0 0 0;
            font-size: 12px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 11px;
          }
          .info-table td {
            padding: 2px 4px;
            border: 1px solid #ccc;
          }
          .info-label {
            background: #f0f0f0;
            font-weight: bold;
            width: 25%;
          }
          .scale-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 10px;
          }
          .scale-table td {
            padding: 1px 2px;
            text-align: center;
            border: 1px solid #ccc;
            font-weight: bold;
          }
          .scale-header {
            background: #f0f0f0;
            font-weight: bold;
          }
          .questions-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 10px;
          }
          .questions-table th {
            background: #f0f0f0;
            padding: 2px;
            border: 1px solid #000;
            font-weight: bold;
            text-align: center;
          }
          .questions-table td {
            padding: 1px 2px;
            border: 1px solid #ccc;
            vertical-align: top;
          }
          .question-num {
            width: 4%;
            text-align: center;
            font-weight: bold;
          }
          .question-text {
            width: 70%;
            font-size: 9px;
          }
          .answer-cell {
            width: 13%;
            text-align: center;
          }
          .answer-badge {
            display: inline-block;
            padding: 3px 6px;
            border-radius: 3px;
            color: white;
            font-weight: bold;
            font-size: 10px;
            min-width: 16px;
          }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          .summary-table td {
            padding: 2px 4px;
            border: 1px solid #000;
          }
          .summary-header {
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          .summary-value {
            text-align: center;
            font-weight: bold;
          }
          @media print {
            body { 
              background: white !important; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .answer-badge {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Test Maslach Burnout Inventory (MBI)</h1>
          <p>Respuestas Detalladas del Cuestionario</p>
        </div>

        <table class="info-table">
          <tr>
            <td class="info-label">Nombre:</td>
            <td>${selectedCuestionario.usuario?.nombres} ${selectedCuestionario.usuario?.apellidos}</td>
            <td class="info-label">Usuario:</td>
            <td>@${selectedCuestionario.usuario?.usuario}</td>
          </tr>
          <tr>
            <td class="info-label">Estamento:</td>
            <td>${selectedCuestionario.estamento}</td>
            <td class="info-label">Fecha:</td>
            <td>${formatearFecha(selectedCuestionario.fechaRespuesta)}</td>
          </tr>
        </table>

        <table class="scale-table">
          <tr>
            <td class="scale-header" style="background: #10B981; color: white;">0 - Nunca</td>
            <td class="scale-header" style="background: #3B82F6; color: white;">1 - Pocas veces al año</td>
            <td class="scale-header" style="background: #06B6D4; color: white;">2 - Una vez al mes</td>
            <td class="scale-header" style="background: #EAB308; color: #000;">3 - Pocas veces al mes</td>
            <td class="scale-header" style="background: #F97316; color: white;">4 - Una vez a la semana</td>
            <td class="scale-header" style="background: #EF4444; color: white;">5 - Pocas veces a la semana</td>
            <td class="scale-header" style="background: #1F2937; color: white;">6 - Todos los días</td>
          </tr>
        </table>

        <table class="questions-table">
          <thead>
            <tr>
              <th style="width: 4%;">#</th>
              <th style="width: 70%;">Pregunta</th>
              <th style="width: 13%;">Respuesta</th>
              <th style="width: 13%;">Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${preguntas.map((item, index) => {
              const respuesta = obtenerRespuesta(respuestasDetalladas, item.id);
              const descripcion = obtenerDescripcionRespuesta(respuesta);
              const color = obtenerColorRespuesta(respuesta);
              
              return `
                <tr>
                  <td class="question-num">${index + 1}</td>
                  <td class="question-text">${item.pregunta}</td>
                  <td class="answer-cell">
                    <span class="answer-badge" style="background: ${color};">${respuesta}</span>
                  </td>
                  <td style="font-size: 9px;">${descripcion}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <table class="summary-table">
          <tr>
            <td class="summary-header" colspan="3">RESUMEN DE RESULTADOS</td>
          </tr>
          <tr>
            <td class="summary-header">Dimensión</td>
            <td class="summary-header">Puntaje</td>
            <td class="summary-header">Nivel</td>
          </tr>
          <tr>
            <td>Agotamiento Emocional</td>
            <td class="summary-value">${selectedCuestionario.agotamientoEmocional}/54</td>
            <td class="summary-value">${selectedCuestionario.nivelAgotamiento}</td>
          </tr>
          <tr>
            <td>Despersonalización</td>
            <td class="summary-value">${selectedCuestionario.despersonalizacion}/30</td>
            <td class="summary-value">${selectedCuestionario.nivelDespersonalizacion}</td>
          </tr>
          <tr>
            <td>Realización Personal</td>
            <td class="summary-value">${selectedCuestionario.realizacionPersonal}/48</td>
            <td class="summary-value">${selectedCuestionario.nivelRealizacion}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Abrir nueva ventana con el HTML
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Esperar a que se cargue el contenido y luego imprimir
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const cuestionariosFiltrados = cuestionarios.filter(cuestionario => {
    const matchEstamento = filtroEstamento === 'Todos' || cuestionario.estamento === filtroEstamento;
    const matchSearch = searchTerm === '' || 
      cuestionario.usuario?.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cuestionario.usuario?.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cuestionario.usuario?.usuario.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchEstamento && matchSearch;
  });

  const estamentos = ['Todos', ...Array.from(new Set(cuestionarios.map(c => c.estamento)))];

  if (user?.estamento !== 'Administrador') {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Acceso Restringido</h3>
            <p className="text-red-700">
              Solo los administradores pueden acceder a los cuestionarios de burnout.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Cargando cuestionarios...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={cargarDatos}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Cuestionarios de Burnout
        </h2>
        <p className="text-gray-600">
          Análisis de cuestionarios Maslach Burnout Inventory (MBI) contestados por el personal.
        </p>
      </div>

      {/* Estadísticas Generales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total Cuestionarios</p>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.totalCuestionarios}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-900">Agotamiento Alto</p>
                <p className="text-2xl font-bold text-red-600">
                  {Object.values(estadisticas.porEstamento).reduce((acc, est) => acc + est.nivelAgotamientoAlto, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-900">Despersonalización Alta</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Object.values(estadisticas.porEstamento).reduce((acc, est) => acc + est.nivelDespersonalizacionAlto, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Realización Baja</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Object.values(estadisticas.porEstamento).reduce((acc, est) => acc + est.nivelRealizacionBajo, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar por nombre de usuario..."
            />
          </div>
        </div>
        
        <div className="sm:w-48">
          <select
            value={filtroEstamento}
            onChange={(e) => setFiltroEstamento(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {estamentos.map(estamento => (
              <option key={estamento} value={estamento}>{estamento}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Cuestionarios */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Cuestionarios Contestados ({cuestionariosFiltrados.length})
          </h3>
        </div>

        {cuestionariosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cuestionarios</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron cuestionarios con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agotamiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Despersonalización
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Realización
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cuestionariosFiltrados.map((cuestionario) => (
                  <tr key={cuestionario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {cuestionario.usuario?.nombres.charAt(0)}{cuestionario.usuario?.apellidos.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {cuestionario.usuario?.nombres} {cuestionario.usuario?.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{cuestionario.usuario?.usuario}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {cuestionario.estamento}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatearFecha(cuestionario.fechaRespuesta)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">
                          {cuestionario.agotamientoEmocional}/54
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getNivelColor(cuestionario.nivelAgotamiento)}`}>
                          {cuestionario.nivelAgotamiento}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">
                          {cuestionario.despersonalizacion}/30
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getNivelColor(cuestionario.nivelDespersonalizacion)}`}>
                          {cuestionario.nivelDespersonalizacion}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">
                          {cuestionario.realizacionPersonal}/48
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getNivelColor(cuestionario.nivelRealizacion)}`}>
                          {cuestionario.nivelRealizacion}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVerDetalle(cuestionario)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Ver detalle
                        </button>
                        <button
                          onClick={() => handleVerRespuestas(cuestionario)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Ver respuestas
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      {showDetailModal && selectedCuestionario && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header del modal */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalle del Cuestionario de Burnout
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="mt-6 space-y-6">
                {/* Información del usuario */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Información del Usuario</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedCuestionario.usuario?.nombres} {selectedCuestionario.usuario?.apellidos}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Usuario</p>
                      <p className="text-sm font-medium text-gray-900">@{selectedCuestionario.usuario?.usuario}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estamento</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCuestionario.estamento}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Respuesta</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatearFecha(selectedCuestionario.fechaRespuesta)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resultados por dimensión */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Agotamiento Emocional */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h5 className="text-sm font-medium text-red-900">Agotamiento Emocional</h5>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-700">Puntaje:</span>
                        <span className="text-lg font-bold text-red-900">
                          {selectedCuestionario.agotamientoEmocional}/54
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-700">Nivel:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getNivelColor(selectedCuestionario.nivelAgotamiento)}`}>
                          {selectedCuestionario.nivelAgotamiento}
                        </span>
                      </div>
                      <div className="w-full bg-red-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${(selectedCuestionario.agotamientoEmocional / 54) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Despersonalización */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h5 className="text-sm font-medium text-orange-900">Despersonalización</h5>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-orange-700">Puntaje:</span>
                        <span className="text-lg font-bold text-orange-900">
                          {selectedCuestionario.despersonalizacion}/30
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-orange-700">Nivel:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getNivelColor(selectedCuestionario.nivelDespersonalizacion)}`}>
                          {selectedCuestionario.nivelDespersonalizacion}
                        </span>
                      </div>
                      <div className="w-full bg-orange-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${(selectedCuestionario.despersonalizacion / 30) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Realización Personal */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h5 className="text-sm font-medium text-green-900">Realización Personal</h5>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Puntaje:</span>
                        <span className="text-lg font-bold text-green-900">
                          {selectedCuestionario.realizacionPersonal}/48
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Nivel:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getNivelColor(selectedCuestionario.nivelRealizacion)}`}>
                          {selectedCuestionario.nivelRealizacion}
                        </span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(selectedCuestionario.realizacionPersonal / 48) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interpretación */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Interpretación del Resultado</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>
                      <strong>Agotamiento Emocional ({selectedCuestionario.nivelAgotamiento}):</strong> 
                      {selectedCuestionario.nivelAgotamiento === 'alto' && 
                        ' Indica un alto nivel de fatiga emocional y agotamiento debido al trabajo.'}
                      {selectedCuestionario.nivelAgotamiento === 'medio' && 
                        ' Muestra un nivel moderado de fatiga emocional que requiere atención.'}
                      {selectedCuestionario.nivelAgotamiento === 'bajo' && 
                        ' Refleja un buen manejo del estrés emocional en el trabajo.'}
                    </p>
                    <p>
                      <strong>Despersonalización ({selectedCuestionario.nivelDespersonalizacion}):</strong>
                      {selectedCuestionario.nivelDespersonalizacion === 'alto' && 
                        ' Sugiere actitudes cínicas hacia los pacientes y el trabajo.'}
                      {selectedCuestionario.nivelDespersonalizacion === 'medio' && 
                        ' Indica algunas actitudes de distanciamiento que deben monitorearse.'}
                      {selectedCuestionario.nivelDespersonalizacion === 'bajo' && 
                        ' Muestra una actitud empática y comprometida con los pacientes.'}
                    </p>
                    <p>
                      <strong>Realización Personal ({selectedCuestionario.nivelRealizacion}):</strong>
                      {selectedCuestionario.nivelRealizacion === 'bajo' && 
                        ' Indica baja satisfacción y logro personal en el trabajo.'}
                      {selectedCuestionario.nivelRealizacion === 'medio' && 
                        ' Muestra un nivel moderado de satisfacción laboral.'}
                      {selectedCuestionario.nivelRealizacion === 'alto' && 
                        ' Refleja alta satisfacción y sentimiento de logro en el trabajo.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer del modal */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Respuestas Detalladas */}
      {showRespuestasModal && selectedCuestionario && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-2 md:top-4 mx-auto p-2 md:p-4 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header del modal */}
              <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-gray-200">
                <h3 className="text-base md:text-lg font-medium text-gray-900 truncate">
                  Respuestas Detalladas del Test de Burnout
                </h3>
                <button
                  onClick={() => setShowRespuestasModal(false)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Información del usuario */}
              <div className="mt-3 md:mt-4 mb-4 md:mb-6 bg-gray-50 rounded-lg p-3 md:p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs md:text-sm font-medium text-gray-700">
                        {selectedCuestionario.usuario?.nombres.charAt(0)}{selectedCuestionario.usuario?.apellidos.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 md:ml-4 min-w-0">
                    <div className="text-sm md:text-base font-medium text-gray-900 truncate">
                      {selectedCuestionario.usuario?.nombres} {selectedCuestionario.usuario?.apellidos}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 truncate">
                      {selectedCuestionario.estamento} • {formatearFecha(selectedCuestionario.fechaRespuesta)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="mt-4 md:mt-6">
                {loadingRespuestas ? (
                  <div className="flex items-center justify-center py-8 md:py-12">
                    <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-sm md:text-base text-gray-600">Cargando respuestas...</span>
                  </div>
                ) : respuestasDetalladas ? (
                  <div className="space-y-3 md:space-y-4">
                    {/* Escala de respuestas */}
                    <div className="bg-gray-50 p-3 md:p-4 rounded-lg mb-4 md:mb-6">
                      <h4 className="font-semibold text-gray-800 mb-2 md:mb-3 text-sm md:text-base">Escala de respuestas:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2 text-xs">
                        <div className="text-center p-2 bg-green-100 rounded">0 - Nunca</div>
                        <div className="text-center p-2 bg-blue-100 rounded">1 - Pocas veces al año</div>
                        <div className="text-center p-2 bg-cyan-100 rounded">2 - Una vez al mes</div>
                        <div className="text-center p-2 bg-yellow-100 rounded">3 - Pocas veces al mes</div>
                        <div className="text-center p-2 bg-orange-100 rounded">4 - Una vez a la semana</div>
                        <div className="text-center p-2 bg-red-100 rounded">5 - Pocas veces a la semana</div>
                        <div className="text-center p-2 bg-gray-800 text-white rounded">6 - Todos los días</div>
                      </div>
                    </div>

                    {/* Preguntas y respuestas */}
                    <div className="space-y-2 md:space-y-3">
                      {[
                        { id: 'p1', pregunta: 'Me siento emocionalmente agotado/a por mi trabajo' },
                        { id: 'p2', pregunta: 'Me siento cansado/a al final de una jornada laboral' },
                        { id: 'p3', pregunta: 'Me siento fatigado/a cuando me levanto por la mañana y me enfrento a otra jornada laboral' },
                        { id: 'p4', pregunta: 'Comprendo fácilmente cómo se sienten los pacientes/usuarios' },
                        { id: 'p5', pregunta: 'Creo que trato a algunos pacientes/usuarios como objetos impersonales' },
                        { id: 'p6', pregunta: 'Trabajar todo el día con mucha gente es un esfuerzo' },
                        { id: 'p7', pregunta: 'Trato muy eficazmente los problemas personales' },
                        { id: 'p8', pregunta: 'Me siento quemado (extremadamente agotado) por mi trabajo' },
                        { id: 'p9', pregunta: 'Creo que estoy influyendo positivamente con mi trabajo en las vidas de otras personas' },
                        { id: 'p10', pregunta: 'Me he vuelto más insensible con la gente desde que ejerzo esta profesión' },
                        { id: 'p11', pregunta: 'Me preocupa el hecho de que este trabajo me esté endureciendo emocionalmente' },
                        { id: 'p12', pregunta: 'Me siento muy activo/a' },
                        { id: 'p13', pregunta: 'Me siento frustrado/a en mi trabajo' },
                        { id: 'p14', pregunta: 'Creo que estoy trabajando demasiado' },
                        { id: 'p15', pregunta: 'En realidad, no me preocupa lo que ocurre a alguno de mis pacientes/usuarios' },
                        { id: 'p16', pregunta: 'Trabajar directamente con las personas me produce estrés' },
                        { id: 'p17', pregunta: 'Me siento estimulado/a después de trabajar en contacto con mis pacientes' },
                        { id: 'p18', pregunta: 'Puedo crear fácilmente una atmósfera relajada con mis pacientes' },
                        { id: 'p19', pregunta: 'He conseguido muchas cosas útiles en mi profesión' },
                        { id: 'p20', pregunta: 'Me siento acabado/a' },
                        { id: 'p21', pregunta: 'Trato los problemas emocionales con mucha calma en mi trabajo' },
                        { id: 'p22', pregunta: 'Siento que los pacientes/usuarios me culpan por algunos de sus problemas' }
                      ].map((item, index) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-3 md:p-4">
                          <div className="flex items-start space-x-3 md:space-x-4">
                            <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs md:text-sm font-medium text-blue-800">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm md:text-base text-gray-800 mb-2 md:mb-3">{item.pregunta}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                <span className="text-xs md:text-sm text-gray-600">Respuesta:</span>
                                <div className="flex items-center space-x-1">
                                  {(() => {
                                    const respuesta = obtenerRespuesta(respuestasDetalladas, item.id);
                                    return (
                                      <>
                                        <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                                          respuesta === 0 ? 'bg-green-100 text-green-800' :
                                          respuesta === 1 ? 'bg-blue-100 text-blue-800' :
                                          respuesta === 2 ? 'bg-cyan-100 text-cyan-800' :
                                          respuesta === 3 ? 'bg-yellow-100 text-yellow-800' :
                                          respuesta === 4 ? 'bg-orange-100 text-orange-800' :
                                          respuesta === 5 ? 'bg-red-100 text-red-800' :
                                          'bg-gray-800 text-white'
                                        }`}>
                                          {respuesta}
                                        </span>
                                        <span className="text-xs md:text-sm text-gray-600">
                                          {respuesta === 0 ? 'Nunca' :
                                           respuesta === 1 ? 'Pocas veces al año' :
                                           respuesta === 2 ? 'Una vez al mes' :
                                           respuesta === 3 ? 'Pocas veces al mes' :
                                           respuesta === 4 ? 'Una vez a la semana' :
                                           respuesta === 5 ? 'Pocas veces a la semana' :
                                           'Todos los días'}
                                        </span>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No se pudieron cargar las respuestas detalladas.</p>
                  </div>
                )}
              </div>

              {/* Footer del modal */}
              <div className="mt-4 md:mt-6 flex justify-between">
                <button
                  onClick={() => imprimirRespuestas()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setShowRespuestasModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm md:text-base"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCuestionariosBurnout;
