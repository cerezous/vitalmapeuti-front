import React, { useState } from 'react';

interface ModalMedicinaProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteRut: string;
  pacienteNombre: string;
}

interface ApacheScore {
  temperatura: number;
  presionArterial: number;
  frecuenciaCardiaca: number;
  frecuenciaRespiratoria: number;
  oxigenacion: number;
  phArterial: number;
  sodio: number;
  potasio: number;
  creatinina: number;
  hematocrito: number;
  leucocitos: number;
  glasgow: number;
  edad: number;
  enfermedadCronica: number;
}

const ModalMedicina: React.FC<ModalMedicinaProps> = ({ isOpen, onClose, pacienteRut, pacienteNombre }) => {
  const [activeTab, setActiveTab] = useState<'categorizacion' | 'procedimientos'>('categorizacion');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [apacheScores, setApacheScores] = useState<ApacheScore>({
    temperatura: 0,
    presionArterial: 0,
    frecuenciaCardiaca: 0,
    frecuenciaRespiratoria: 0,
    oxigenacion: 0,
    phArterial: 0,
    sodio: 0,
    potasio: 0,
    creatinina: 0,
    hematocrito: 0,
    leucocitos: 0,
    glasgow: 0,
    edad: 0,
    enfermedadCronica: 0,
  });

  // Estado para rastrear el rango específico seleccionado en cada parámetro
  const [selectedRanges, setSelectedRanges] = useState<{[key: string]: string}>({});

    const updateScore = (parameter: keyof ApacheScore, score: number, range?: string) => {
    setApacheScores(prev => ({
      ...prev,
      [parameter]: score
    }));
    if (range) {
      setSelectedRanges(prev => ({
        ...prev,
        [parameter]: range
      }));
    }
  };

  // Función para verificar si un botón específico está seleccionado
  const isButtonSelected = (parameter: keyof ApacheScore, score: number, range?: string): boolean => {
    if (range) {
      return selectedRanges[parameter] === range;
    }
    // Si no hay range definido y tampoco hay selectedRange para este parámetro, usar el score
    return !selectedRanges[parameter] && apacheScores[parameter] === score;
  };

  const getTotalScore = () => {
    return Object.values(apacheScores).reduce((sum, score) => sum + score, 0);
  };

  const getMortalityRisk = (score: number) => {
    if (score <= 4) return { risk: '4%', level: 'Bajo', color: 'text-green-600' };
    if (score <= 9) return { risk: '8%', level: 'Bajo-Moderado', color: 'text-yellow-600' };
    if (score <= 14) return { risk: '15%', level: 'Moderado', color: 'text-orange-600' };
    if (score <= 19) return { risk: '25%', level: 'Alto', color: 'text-red-600' };
    if (score <= 24) return { risk: '40%', level: 'Muy Alto', color: 'text-red-700' };
    if (score <= 29) return { risk: '55%', level: 'Crítico', color: 'text-red-800' };
    if (score <= 34) return { risk: '73%', level: 'Crítico', color: 'text-red-900' };
    return { risk: '85%', level: 'Crítico', color: 'text-red-900' };
  };

  const handleSave = () => {
    setShowConfirmation(true);
  };

  const confirmSave = async () => {
    try {
      // Importar el servicio API dinámicamente
      const { apache2Service } = await import('../services/apache2API');
      
      // Preparar los datos para enviar
      const apache2Data = {
        pacienteRut: pacienteRut, // Usar el RUT real del paciente
        temperatura: apacheScores.temperatura,
        presionArterial: apacheScores.presionArterial,
        frecuenciaCardiaca: apacheScores.frecuenciaCardiaca,
        frecuenciaRespiratoria: apacheScores.frecuenciaRespiratoria,
        oxigenacion: apacheScores.oxigenacion,
        phArterial: apacheScores.phArterial,
        sodio: apacheScores.sodio,
        potasio: apacheScores.potasio,
        creatinina: apacheScores.creatinina,
        hematocrito: apacheScores.hematocrito,
        leucocitos: apacheScores.leucocitos,
        glasgow: apacheScores.glasgow,
        edad: apacheScores.edad,
        enfermedadCronica: apacheScores.enfermedadCronica,
        rangosSeleccionados: selectedRanges,
        // usuarioId: puedes agregar aquí el ID del usuario actual si lo tienes disponible
      };

      
      // Guardar en la base de datos
      const response = await apache2Service.crear(apache2Data);
      
      if (response.success) {
        alert('Evaluación APACHE II guardada exitosamente');
        setShowConfirmation(false);
        onClose();
      } else {
        console.error('Error al guardar:', response.message);
        alert(`Error al guardar: ${response.message}`);
      }
    } catch (error: any) {
      console.error('Error al guardar evaluación APACHE II:', error);
      alert(`Error al guardar la evaluación: ${error.message}`);
    }
  };

  const cancelSave = () => {
    setShowConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center" style={{zIndex: 9999, width: '100vw', height: '100vh'}}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Registro médico</h2>
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
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              APACHE II
            </button>
            <button
              onClick={() => setActiveTab('procedimientos')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'procedimientos'
                  ? 'border-blue-500 text-blue-600'
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
            <div>
              {/* Header con resultado */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">APACHE II Score</h3>
                    <p className="text-sm text-gray-600">Acute Physiology and Chronic Health Evaluation</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{getTotalScore()}</div>
                    <div className={`text-sm font-medium ${getMortalityRisk(getTotalScore()).color}`}>
                      Riesgo de mortalidad: {getMortalityRisk(getTotalScore()).risk} ({getMortalityRisk(getTotalScore()).level})
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla APACHE II Compacta */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-2 text-left text-sm font-medium">Variable Fisiológica</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+4</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+3</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+2</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+1</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs bg-green-50">0</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+1</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+2</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+3</th>
                      <th className="border border-gray-300 px-2 py-1 text-center text-xs">+4</th>
                      <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Temperatura */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Temperatura (°C)</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('temperatura', 4, 'temp_≥41')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 4, 'temp_≥41') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≥41</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('temperatura', 3, 'temp_39-40.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 3, 'temp_39-40.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>39-40.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('temperatura', 1, 'temp_38.5-38.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 1, 'temp_38.5-38.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>38.5-38.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <button onClick={() => updateScore('temperatura', 0, 'temp_36-38.4')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 0, 'temp_36-38.4') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>36-38.4</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('temperatura', 1, 'temp_34-35.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 1, 'temp_34-35.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>34-35.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('temperatura', 2, 'temp_32-33.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 2, 'temp_32-33.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>32-33.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('temperatura', 3, 'temp_≤31.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('temperatura', 3, 'temp_≤31.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≤31.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.temperatura}</td>
                    </tr>

                    {/* Presión Arterial Media */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Presión Arterial Media</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('presionArterial', 4, 'pa_≥160')} className={`text-xs p-1 w-full rounded ${isButtonSelected('presionArterial', 4, 'pa_≥160') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≥160</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('presionArterial', 3, 'pa_130-159')} className={`text-xs p-1 w-full rounded ${isButtonSelected('presionArterial', 3, 'pa_130-159') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>130-159</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('presionArterial', 2, 'pa_110-129')} className={`text-xs p-1 w-full rounded ${isButtonSelected('presionArterial', 2, 'pa_110-129') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>110-129</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <button onClick={() => updateScore('presionArterial', 0, 'pa_70-109')} className={`text-xs p-1 w-full rounded ${isButtonSelected('presionArterial', 0, 'pa_70-109') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>70-109</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('presionArterial', 2, 'pa_50-69')} className={`text-xs p-1 w-full rounded ${isButtonSelected('presionArterial', 2, 'pa_50-69') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>50-69</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('presionArterial', 4, 'pa_≤49')} className={`text-xs p-1 w-full rounded ${isButtonSelected('presionArterial', 4, 'pa_≤49') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≤49</button>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.presionArterial}</td>
                    </tr>

                    {/* Frecuencia Cardíaca */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Frecuencia Cardíaca</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('frecuenciaCardiaca', 4, 'fc_≥180')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaCardiaca', 4, 'fc_≥180') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≥180</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('frecuenciaCardiaca', 3, 'fc_140-179')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaCardiaca', 3, 'fc_140-179') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>140-179</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('frecuenciaCardiaca', 2, 'fc_110-139')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaCardiaca', 2, 'fc_110-139') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>110-139</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <button onClick={() => updateScore('frecuenciaCardiaca', 0, 'fc_70-109')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaCardiaca', 0, 'fc_70-109') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>70-109</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('frecuenciaCardiaca', 2, 'fc_55-69')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaCardiaca', 2, 'fc_55-69') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>55-69</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('frecuenciaCardiaca', 3, 'fc_≤54')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaCardiaca', 3, 'fc_≤54') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≤54</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.frecuenciaCardiaca}</td>
                    </tr>

                    {/* Resto de filas de la tabla */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Frecuencia Respiratoria</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('frecuenciaRespiratoria', 4, 'fr_≥50')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaRespiratoria', 4, 'fr_≥50') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≥50</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('frecuenciaRespiratoria', 3, 'fr_35-49')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaRespiratoria', 3, 'fr_35-49') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>35-49</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('frecuenciaRespiratoria', 1, 'fr_25-34')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaRespiratoria', 1, 'fr_25-34') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>25-34</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <button onClick={() => updateScore('frecuenciaRespiratoria', 0, 'fr_12-24')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaRespiratoria', 0, 'fr_12-24') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>12-24</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('frecuenciaRespiratoria', 1, 'fr_10-11')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaRespiratoria', 1, 'fr_10-11') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>10-11</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('frecuenciaRespiratoria', 2, 'fr_≤9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('frecuenciaRespiratoria', 2, 'fr_≤9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≤9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.frecuenciaRespiratoria}</td>
                    </tr>

                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">
                        <div>Oxigenación:</div>
                        <div className="text-xs text-gray-500 mt-1">Si FiO₂ ≥ 0.5 (AaDO₂)</div>
                        <div className="text-xs text-gray-500">Si FiO₂ &lt; 0.5 (paO₂)</div>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('oxigenacion', 4, 'ox_aado2_high')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 4, 'ox_aado2_high') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
                          <div>&gt;499</div>
                          <div>-</div>
                        </button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('oxigenacion', 3, 'ox_aado2_med')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 3, 'ox_aado2_med') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
                          <div>350-499</div>
                          <div>-</div>
                        </button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('oxigenacion', 2, 'ox_aado2_low')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 2, 'ox_aado2_low') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
                          <div>200-349</div>
                          <div>-</div>
                        </button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <button onClick={() => updateScore('oxigenacion', 0, 'ox_normal')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 0, 'ox_normal') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>
                          <div>&lt;200</div>
                          <div>&gt;70</div>
                        </button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('oxigenacion', 1, 'ox_pao2_61_70')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 1, 'ox_pao2_61_70') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
                          <div>-</div>
                          <div>61-70</div>
                        </button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('oxigenacion', 3, 'ox_pao2_56_60')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 3, 'ox_pao2_56_60') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
                          <div>-</div>
                          <div>56-60</div>
                        </button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('oxigenacion', 4, 'ox_pao2_low')} className={`text-xs p-1 w-full rounded ${isButtonSelected('oxigenacion', 4, 'ox_pao2_low') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
                          <div>-</div>
                          <div>&lt;56</div>
                        </button>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.oxigenacion}</td>
                    </tr>

                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">pH Arterial</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('phArterial', 4, 'ph_≥7.7')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 4, 'ph_≥7.7') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≥7.7</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('phArterial', 3, 'ph_7.6-7.69')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 3, 'ph_7.6-7.69') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>7.6-7.69</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('phArterial', 1, 'ph_7.5-7.59')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 1, 'ph_7.5-7.59') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>7.5-7.59</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <button onClick={() => updateScore('phArterial', 0, 'ph_7.33-7.49')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 0, 'ph_7.33-7.49') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>7.33-7.49</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('phArterial', 2, 'ph_7.25-7.32')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 2, 'ph_7.25-7.32') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>7.25-7.32</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('phArterial', 3, 'ph_7.15-7.24')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 3, 'ph_7.15-7.24') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>7.15-7.24</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('phArterial', 4, 'ph_<7.15')} className={`text-xs p-1 w-full rounded ${isButtonSelected('phArterial', 4, 'ph_<7.15') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>&lt;7.15</button>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.phArterial}</td>
                    </tr>

                    {/* Sodio */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Sodio Sérico</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('sodio', 4, 'sodio_≥180')} className={`text-xs p-1 w-full rounded ${isButtonSelected('sodio', 4, 'sodio_≥180') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≥180</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('sodio', 3, 'sodio_160-179')} className={`text-xs p-1 w-full rounded ${isButtonSelected('sodio', 3, 'sodio_160-179') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>160-179</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('sodio', 2, 'sodio_155-159')} className={`text-xs p-1 w-full rounded ${isButtonSelected('sodio', 2, 'sodio_155-159') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>155-159</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('sodio', 1, 'sodio_150-154')} className={`text-xs p-1 w-full rounded ${isButtonSelected('sodio', 1, 'sodio_150-154') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>150-154</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <button onClick={() => updateScore('sodio', 0, 'sodio_130-149')} className={`text-xs p-1 w-full rounded ${isButtonSelected('sodio', 0, 'sodio_130-149') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>130-149</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('sodio', 2, 'sodio_≤129')} className={`text-xs p-1 w-full rounded ${isButtonSelected('sodio', 2, 'sodio_≤129') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≤129</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.sodio}</td>
                    </tr>

                    {/* Potasio */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Potasio Sérico</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('potasio', 4, 'potasio_≥7')} className={`text-xs p-1 w-full rounded ${isButtonSelected('potasio', 4, 'potasio_≥7') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≥7</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('potasio', 3, 'potasio_6-6.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('potasio', 3, 'potasio_6-6.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>6-6.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('potasio', 1, 'potasio_5.5-5.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('potasio', 1, 'potasio_5.5-5.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>5.5-5.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <button onClick={() => updateScore('potasio', 0, 'potasio_3.5-5.4')} className={`text-xs p-1 w-full rounded ${isButtonSelected('potasio', 0, 'potasio_3.5-5.4') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>3.5-5.4</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('potasio', 1, 'potasio_3-3.4')} className={`text-xs p-1 w-full rounded ${isButtonSelected('potasio', 1, 'potasio_3-3.4') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>3-3.4</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('potasio', 2, 'potasio_≤2.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('potasio', 2, 'potasio_≤2.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≤2.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.potasio}</td>
                    </tr>

                    {/* Creatinina */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Creatinina Sérica</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('creatinina', 4, 'creatinina_≥3.5')} className={`text-xs p-1 w-full rounded ${isButtonSelected('creatinina', 4, 'creatinina_≥3.5') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≥3.5</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('creatinina', 3, 'creatinina_2-3.4')} className={`text-xs p-1 w-full rounded ${isButtonSelected('creatinina', 3, 'creatinina_2-3.4') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>2-3.4</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('creatinina', 2, 'creatinina_1.5-1.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('creatinina', 2, 'creatinina_1.5-1.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>1.5-1.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <button onClick={() => updateScore('creatinina', 0, 'creatinina_0.6-1.4')} className={`text-xs p-1 w-full rounded ${isButtonSelected('creatinina', 0, 'creatinina_0.6-1.4') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>0.6-1.4</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('creatinina', 2, 'creatinina_≤0.6')} className={`text-xs p-1 w-full rounded ${isButtonSelected('creatinina', 2, 'creatinina_≤0.6') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≤0.6</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.creatinina}</td>
                    </tr>

                    {/* Hematocrito */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Hematocrito</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('hematocrito', 4, 'hto_≥60')} className={`text-xs p-1 w-full rounded ${isButtonSelected('hematocrito', 4, 'hto_≥60') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≥60</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('hematocrito', 2, 'hto_50-59.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('hematocrito', 2, 'hto_50-59.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>50-59.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('hematocrito', 1, 'hto_46-49.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('hematocrito', 1, 'hto_46-49.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>46-49.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <button onClick={() => updateScore('hematocrito', 0, 'hto_30-45.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('hematocrito', 0, 'hto_30-45.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>30-45.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('hematocrito', 2, 'hto_≤29.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('hematocrito', 2, 'hto_≤29.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≤29.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.hematocrito}</td>
                    </tr>

                    {/* Leucocitos */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Leucocitos</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('leucocitos', 4, 'leuco_≥40')} className={`text-xs p-1 w-full rounded ${isButtonSelected('leucocitos', 4, 'leuco_≥40') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≥40</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('leucocitos', 2, 'leuco_20-39.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('leucocitos', 2, 'leuco_20-39.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>20-39.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('leucocitos', 1, 'leuco_15-19.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('leucocitos', 1, 'leuco_15-19.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>15-19.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center bg-green-50">
                        <button onClick={() => updateScore('leucocitos', 0, 'leuco_3-14.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('leucocitos', 0, 'leuco_3-14.9') ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}`}>3-14.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        <button onClick={() => updateScore('leucocitos', 2, 'leuco_≤2.9')} className={`text-xs p-1 w-full rounded ${isButtonSelected('leucocitos', 2, 'leuco_≤2.9') ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>≤2.9</button>
                      </td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">-</td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.leucocitos}</td>
                    </tr>

                    {/* Escala de Glasgow con input */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Glasgow Coma Scale</td>
                      <td className="border border-gray-300 px-1 py-1 text-center" colSpan={9}>
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="3"
                            max="15"
                            placeholder="3-15"
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (value >= 15) updateScore('glasgow', 0);
                              else if (value >= 13) updateScore('glasgow', 1);
                              else if (value >= 10) updateScore('glasgow', 2);
                              else if (value >= 3) updateScore('glasgow', 3);
                            }}
                          />
                          <span className="text-xs text-gray-600">
                            (15=0pts, 13-14=1pt, 10-12=2pts, ≤9=3pts)
                          </span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.glasgow}</td>
                    </tr>

                    {/* Edad */}
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-sm font-medium">Edad</td>
                      <td className="border border-gray-300 px-1 py-1 text-center" colSpan={9}>
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="120"
                            placeholder="Años"
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (value <= 44) updateScore('edad', 0);
                              else if (value <= 54) updateScore('edad', 2);
                              else if (value <= 64) updateScore('edad', 3);
                              else if (value <= 74) updateScore('edad', 5);
                              else if (value >= 75) updateScore('edad', 6);
                            }}
                          />
                          <span className="text-xs text-gray-600">
                            (≤44=0pts, 45-54=2pts, 55-64=3pts, 65-74=5pts, ≥75=6pts)
                          </span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center font-semibold text-blue-600">{apacheScores.edad}</td>
                    </tr>

                  </tbody>
                </table>
                
                {/* Explicación de Enfermedades Crónicas */}
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Evaluación de Salud Crónica</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <strong>0 puntos:</strong> No antecedentes de enfermedad crónica severa.<br/>
                    <strong>2 puntos (Paciente NO quirúrgico):</strong> Historia de insuficiencia orgánica severa o estado inmunocomprometido.<br/>
                    <strong>5 puntos (Paciente quirúrgico de emergencia):</strong> Historia de insuficiencia orgánica severa o estado inmunocomprometido.<br/><br/>
                    <em>Incluye:</em> Cirrosis hepática, insuficiencia cardíaca clase IV NYHA, EPOC severa con limitación funcional, 
                    diálisis crónica, inmunosupresión por medicamentos o enfermedad.
                  </p>
                </div>
              </div>

              {/* Sección de Enfermedad Crónica con explicación */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Evaluación de Salud Crónica</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Si el paciente tiene historia de insuficiencia orgánica severa o está inmunocomprometido, 
                  asignar puntos según el tipo de admisión:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button 
                    onClick={() => updateScore('enfermedadCronica', 0, 'enf_sin')}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      isButtonSelected('enfermedadCronica', 0, 'enf_sin') 
                        ? 'bg-green-500 text-white border-green-500' 
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium">Sin enfermedad crónica</div>
                    <div className="text-sm opacity-80">0 puntos</div>
                  </button>
                  <button 
                    onClick={() => updateScore('enfermedadCronica', 2, 'enf_electiva')}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      isButtonSelected('enfermedadCronica', 2, 'enf_electiva') 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium">Cirugía electiva</div>
                    <div className="text-sm opacity-80">2 puntos</div>
                    <div className="text-xs opacity-70 mt-1">Con enfermedad crónica</div>
                  </button>
                  <button 
                    onClick={() => updateScore('enfermedadCronica', 5, 'enf_urgente')}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      isButtonSelected('enfermedadCronica', 5, 'enf_urgente') 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium">Médico o cirugía urgente</div>
                    <div className="text-sm opacity-80">5 puntos</div>
                    <div className="text-xs opacity-70 mt-1">Con enfermedad crónica</div>
                  </button>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <strong>Enfermedades crónicas incluyen:</strong> Cirrosis, ICC clase IV, EPOC severo, diálisis crónica, 
                  inmunodeficiencia o inmunosupresión.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'procedimientos' && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Procedimientos Médicos</h3>
              <p className="text-gray-500">
                Tratamientos y procedimientos médicos realizados.
              </p>
            </div>
          )}

          {/* Botón Guardar */}
          <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Guardar Evaluación
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmation && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-75 flex items-center justify-center" style={{zIndex: 10000}}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirmar Guardado</h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                ¿Estás seguro de que deseas guardar la evaluación APACHE II para <strong>{pacienteNombre}</strong>?
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Puntaje Total:</span> {getTotalScore()} puntos
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Riesgo de Mortalidad:</span> {getMortalityRisk(getTotalScore()).risk} ({getMortalityRisk(getTotalScore()).level})
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelSave}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSave}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalMedicina;