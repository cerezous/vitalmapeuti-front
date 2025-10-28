const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProcedimientoMedicina = sequelize.define('ProcedimientoMedicina', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true
    },
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  turno: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: [['24 h', '22 h', '12 h']]
    }
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
      // La validación de procedimientos válidos se hace en las rutas usando getProcedimientosValidos()
    }
  },
  tiempo: {
    type: DataTypes.STRING(5), // Formato HH:MM
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  },
  pacienteRut: {
    type: DataTypes.STRING(15),
    allowNull: true, // Algunos procedimientos médicos no requieren paciente específico
    validate: {
      is: /^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9kK]$/i
    },
    references: {
      model: 'pacientes',
      key: 'rut'
    }
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'procedimientos_medicina',
  timestamps: true,
  indexes: [
    {
      fields: ['usuarioId']
    },
    {
      fields: ['fecha']
    },
    {
      fields: ['turno']
    },
    {
      fields: ['nombre']
    },
    {
      fields: ['pacienteRut']
    },
    {
      fields: ['fecha', 'turno']
    },
    {
      fields: ['usuarioId', 'fecha']
    }
  ]
});

// Método estático para validar si un procedimiento requiere paciente
ProcedimientoMedicina.requierePaciente = function(nombreProcedimiento) {
  const procedimientosSinPaciente = [
    'Administrativo (evoluciones, revisión de HC, indicaciones, etc)',
    'Entrega de turno (solo cuando se recibe turno)',
    'Interconsulta (lectura de HC, evaluación/reevaluación, evolución)'
  ];
  return !procedimientosSinPaciente.includes(nombreProcedimiento);
};

// Método estático para obtener procedimientos válidos
ProcedimientoMedicina.getProcedimientosValidos = function() {
  return [
    // Procedimientos habituales de medicina
    'Administrativo (evoluciones, revisión de HC, indicaciones, etc)',
    'Egreso (redacción de egreso, indicaciones, etc)',
    'Entrega de turno (solo cuando se recibe turno)',
    'Ingreso (redacción de ingreso, evaluación y procedimientos correspondientes)',
    'Interconsulta (lectura de HC, evaluación/reevaluación, evolución)',
    // Otros procedimientos
    'Cambio de TQT',
    'Colonoscopía',
    'Decanulación',
    'Ecografía',
    'Endoscopía',
    'Endoscopía + Colonoscopía',
    'Fibrobroncoscopía',
    'Instalación CHD',
    'Instalación CVC',
    'Instalación de Cistotomia',
    'Instalación de gastrotomía',
    'Instalación de SNY',
    'Instalación de TQT',
    'Instalación de tunelizado',
    'Instalación LA',
    'Instalación PICCLINE',
    'IOT',
    'Mielograma',
    'Paracentesís',
    'PCR',
    'Punción lumbar',
    'Radiografía',
    'RMN con traslado a BUPA',
    'Toracocentesís'
  ];
};

module.exports = ProcedimientoMedicina;
