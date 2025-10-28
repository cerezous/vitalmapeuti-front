import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import registroProcedimientosAPI from '../services/registroProcedimientosAPI';
import burnoutAPI from '../services/burnoutAPI';

interface MenuInicioProps {}

const MenuInicio: React.FC<MenuInicioProps> = () => {
  const { user } = useAuth();
  const [showModalBurnout, setShowModalBurnout] = useState(false);
  const [respuestasBurnout, setRespuestasBurnout] = useState<{[key: string]: number}>({});
  const [yaRespondioTest, setYaRespondioTest] = useState(false);
  const [respuestaAnterior, setRespuestaAnterior] = useState<any>(null);
  const [metricasUsuario, setMetricasUsuario] = useState({
    totalProcedimientos: 0,
    tiempoTotal: { texto: '0 hrs', horas: 0, minutos: 0, minutosRestantes: 0 },
    totalCategorizaciones: 0,
    pacientesAtendidos: 0
  });

  // Cargar métricas del usuario y verificar si ya respondió el test al montar el componente
  useEffect(() => {
    cargarMetricasUsuario();
    verificarRespuestaExistente();
  }, []);

  const cargarMetricasUsuario = async () => {
    try {
      const metricas = await registroProcedimientosAPI.obtenerMetricasUsuario();
      setMetricasUsuario(metricas);
    } catch (error) {
      console.error('Error al cargar métricas del usuario:', error);
      // Mantener valores por defecto en caso de error
      setMetricasUsuario({
        totalProcedimientos: 0,
        tiempoTotal: { texto: '0 hrs', horas: 0, minutos: 0, minutosRestantes: 0 },
        totalCategorizaciones: 0,
        pacientesAtendidos: 0
      });
    }
  };

  const verificarRespuestaExistente = async () => {
    try {
      const ultimaRespuesta = await burnoutAPI.obtenerUltimaRespuesta();
      if (ultimaRespuesta) {
        setYaRespondioTest(true);
        setRespuestaAnterior(ultimaRespuesta);
      }
    } catch (err) {
      console.error('Error al verificar respuesta existente:', err);
    }
  };

  return (
    <div className="pb-16 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Bienvenido, {user?.nombres}!
        </h1>
        <p className="text-gray-600">
          Sistema de gestión VitalMape UTI - Panel de control principal
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total de Procedimientos</dt>
                <dd className="text-lg font-medium text-gray-900">{metricasUsuario.totalProcedimientos}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Tiempo Total</dt>
                <dd className="text-lg font-medium text-gray-900">{metricasUsuario.tiempoTotal.texto}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Categorizaciones</dt>
                <dd className="text-lg font-medium text-gray-900">{metricasUsuario.totalCategorizaciones}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">N° Pacientes Atendidos</dt>
                <dd className="text-lg font-medium text-gray-900">{metricasUsuario.pacientesAtendidos}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 sm:p-6 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-2 sm:ml-3">
            <h3 className="text-base sm:text-lg font-medium text-blue-900 mb-1 sm:mb-2">Información de Sesión</h3>
            <div className="text-xs sm:text-sm text-blue-800 space-y-0.5 sm:space-y-1">
              <p className="truncate"><span className="font-medium">Usuario:</span> {user?.nombres} {user?.apellidos}</p>
              <p className="truncate"><span className="font-medium">Rol:</span> {user?.estamento}</p>
              <p className="truncate"><span className="font-medium">Email:</span> {user?.correo}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Test de Burnout */}
      <div className="bg-green-50 border-l-4 border-green-400 p-4 sm:p-6 rounded-r-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-medium text-green-900 mb-2">Test de Burnout</h3>
            {!yaRespondioTest ? (
              <p className="text-xs sm:text-sm text-green-700 mb-3">
                Completa el cuestionario de evaluación de síndrome de desgaste profesional
              </p>
            ) : (
              <div className="text-xs sm:text-sm text-green-700">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium text-green-800">Test completado</span>
                </div>
                {respuestaAnterior && (
                  <div className="space-y-1">
                    <p>Fecha: {respuestaAnterior.fechaRespuesta ? new Date(respuestaAnterior.fechaRespuesta).toLocaleDateString('es-ES') : 'No disponible'}</p>
                    <p>• Agotamiento: {respuestaAnterior.agotamientoEmocional || respuestaAnterior.nivelAgotamiento || 'No disponible'}</p>
                    <p>• Despersonalización: {respuestaAnterior.despersonalizacion || respuestaAnterior.nivelDespersonalizacion || 'No disponible'}</p>
                    <p>• Realización personal: {respuestaAnterior.realizacionPersonal || respuestaAnterior.nivelRealizacion || 'No disponible'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="ml-4">
            {!yaRespondioTest ? (
              <button 
                onClick={() => setShowModalBurnout(true)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-400 text-white text-xs sm:text-sm font-medium rounded-full hover:bg-green-600 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Contestar test
              </button>
            ) : (
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Encuesta de Burnout */}
      {showModalBurnout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-2 md:p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-sm sm:max-w-2xl md:max-w-4xl max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] flex flex-col mx-2 sm:mx-0">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 bg-blue-50 rounded-t-lg sm:rounded-t-xl">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-lg md:text-xl font-bold text-blue-900 truncate">Test Maslach Burnout Inventory (MBI)</h3>
                <p className="text-xs sm:text-xs md:text-sm text-blue-700 mt-1">Evaluación de síndrome de desgaste profesional</p>
              </div>
              <button
                onClick={() => setShowModalBurnout(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0 ml-2"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Advertencia si ya respondió */}
            {yaRespondioTest && (
              <div className="p-3 sm:p-4 md:p-6 bg-yellow-50 border-b border-yellow-200">
                <div className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5C3.498 16.333 4.46 18 6 18z" />
                  </svg>
                  <div className="min-w-0">
                    <h4 className="text-yellow-800 font-semibold text-xs sm:text-sm md:text-base">Ya has completado este cuestionario</h4>
                    <p className="text-xs sm:text-xs md:text-sm text-yellow-700 mt-1">
                      Solo puedes responder el Test de Burnout una vez. 
                      {respuestaAnterior && ` Lo completaste el ${new Date(respuestaAnterior.fechaRespuesta).toLocaleDateString('es-ES')}.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contenido del modal */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {/* Instrucciones */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-2 sm:p-3 md:p-4 rounded-r-lg">
                  <p className="text-xs sm:text-xs md:text-sm text-blue-800">
                    <strong>Instrucciones:</strong> Por favor, lee cada afirmación cuidadosamente y decide si alguna vez te sientes de esta forma en tu trabajo. 
                    Indica la frecuencia con la que te sientes así en el trabajo.
                  </p>
                </div>

                {/* Escala de respuestas */}
                <div className="bg-gray-50 p-2 sm:p-3 md:p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2 text-xs sm:text-sm md:text-base">Escala de respuestas:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-1 sm:gap-2 text-xs">
                    <div className="text-center p-1 sm:p-2 bg-green-100 rounded text-xs">0 - Nunca</div>
                    <div className="text-center p-1 sm:p-2 bg-blue-100 rounded text-xs">1 - Pocas veces al año</div>
                    <div className="text-center p-1 sm:p-2 bg-cyan-100 rounded text-xs">2 - Una vez al mes</div>
                    <div className="text-center p-1 sm:p-2 bg-yellow-100 rounded text-xs">3 - Pocas veces al mes</div>
                    <div className="text-center p-1 sm:p-2 bg-orange-100 rounded text-xs">4 - Una vez a la semana</div>
                    <div className="text-center p-1 sm:p-2 bg-red-100 rounded text-xs">5 - Pocas veces a la semana</div>
                    <div className="text-center p-1 sm:p-2 bg-gray-800 text-white rounded text-xs">6 - Todos los días</div>
                  </div>
                </div>

                {/* Preguntas */}
                <div className="space-y-3 md:space-y-4">
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
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-3 md:space-x-4">
                        <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs md:text-sm font-medium text-blue-800">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base text-gray-800 mb-3">{item.pregunta}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                            {[0, 1, 2, 3, 4, 5, 6].map((valor) => (
                              <label key={valor} className="flex items-center space-x-1 cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors">
                                <input
                                  type="radio"
                                  name={item.id}
                                  value={valor}
                                  checked={respuestasBurnout[item.id] === valor}
                                  onChange={(e) => setRespuestasBurnout(prev => ({
                                    ...prev,
                                    [item.id]: parseInt(e.target.value)
                                  }))}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs md:text-sm text-gray-600">{valor}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 md:p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl space-y-3 sm:space-y-0">
              <div className="text-xs md:text-sm text-gray-600 text-center sm:text-left">
                Progreso: {Object.keys(respuestasBurnout).length}/22 preguntas respondidas
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowModalBurnout(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    // Verificar si ya respondió previamente
                    if (yaRespondioTest) {
                      alert('Ya has completado este cuestionario anteriormente. Solo se permite una respuesta por usuario.');
                      return;
                    }

                    const totalPreguntas = 22;
                    const respondidas = Object.keys(respuestasBurnout).length;
                    
                    if (respondidas < totalPreguntas) {
                      alert(`Por favor responde todas las preguntas. Te faltan ${totalPreguntas - respondidas} preguntas.`);
                      return;
                    }

                    try {
                      // Verificar autenticación
                      if (!user) {
                        alert('Error: Usuario no autenticado. Por favor, inicia sesión nuevamente.');
                        return;
                      }


                      // Enviar respuestas al backend
                      const resultado = await burnoutAPI.guardarRespuesta({
                        respuestas: respuestasBurnout as any,
                        estamento: user?.estamento || 'Usuario'
                      });


                      // Mostrar mensaje de agradecimiento
                      alert('¡Gracias por completar el test de burnout!');
                      
                      // Actualizar estado para reflejar que ya respondió
                      setYaRespondioTest(true);
                      setRespuestaAnterior(resultado);
                      setRespuestasBurnout({});
                      setShowModalBurnout(false);
                    } catch (error: any) {
                      console.error('Error al guardar cuestionario:', error);
                      alert('Error al guardar el cuestionario. Por favor, inténtalo de nuevo.');
                    }
                  }}
                  disabled={Object.keys(respuestasBurnout).length < 22 || yaRespondioTest}
                  className={`px-4 md:px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors w-full sm:w-auto ${
                    Object.keys(respuestasBurnout).length < 22 || yaRespondioTest
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {yaRespondioTest ? 'Ya completado' : 'Enviar Respuestas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuInicio;
