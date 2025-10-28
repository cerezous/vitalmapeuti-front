const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProcedimientoAuxiliar = sequelize.define('ProcedimientoAuxiliar', {
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
    type: DataTypes.ENUM('Día', 'Noche', '24 h'),
    allowNull: false
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
      notEmpty: true,
      isIn: [[
        'Entrega de turno',
        'Aseo terminal',
        'Entrega de interconsulta',
        'Entrega de exámenes',
        'Entrega de recetas / recepción de fármacos (trayecto hacia y desde farmacia)',
        'Aseo regular',
        'Recepción / entrega de ropa'
      ]]
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
    allowNull: true, // Algunos procedimientos no requieren paciente específico
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
  tableName: 'procedimientos_auxiliares',
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
// Todos los procedimientos auxiliares ya no requieren paciente específico
ProcedimientoAuxiliar.requierePaciente = function(nombreProcedimiento) {
  return false; // Ningún procedimiento auxiliar requiere paciente
};

// Método estático para obtener lista de procedimientos válidos
ProcedimientoAuxiliar.getProcedimientosValidos = function() {
  return [
    'Entrega de turno',
    'Aseo terminal',
    'Entrega de interconsulta',
    'Entrega de exámenes',
    'Entrega de recetas / recepción de fármacos (trayecto hacia y desde farmacia)',
    'Aseo regular',
    'Recepción / entrega de ropa'
  ];
};

module.exports = ProcedimientoAuxiliar;
