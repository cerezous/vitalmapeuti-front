const Usuario = require('./models/Usuario');
const NAS = require('./models/NAS');
const Apache2 = require('./models/Apache2');
const CategorizacionKinesiologia = require('./models/CategorizacionKinesiologia');
const ProcedimientoKinesiologia = require('./models/ProcedimientoKinesiologia');
const RegistroProcedimientos = require('./models/RegistroProcedimientos');
const ProcedimientoAuxiliar = require('./models/ProcedimientoAuxiliar');
const ProcedimientoMedicina = require('./models/ProcedimientoMedicina');
const CuestionarioBurnout = require('./models/CuestionarioBurnout');
const RegistroProcedimientosTENS = require('./models/RegistroProcedimientosTENS');
const sequelize = require('./config/database');

// Configurar asociaciones
require('./config/associations');

async function verificarDependenciasUsuario(userId) {
  try {
    await sequelize.authenticate();
    
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return;
    }
    
    
    // Verificar todas las tablas que referencian al usuario
    const tablas = [
      { modelo: NAS, nombre: 'NAS' },
      { modelo: Apache2, nombre: 'Apache2' },
      { modelo: CategorizacionKinesiologia, nombre: 'CategorizacionKinesiologia' },
      { modelo: ProcedimientoKinesiologia, nombre: 'ProcedimientoKinesiologia' },
      { modelo: RegistroProcedimientos, nombre: 'RegistroProcedimientos' },
      { modelo: ProcedimientoAuxiliar, nombre: 'ProcedimientoAuxiliar' },
      { modelo: ProcedimientoMedicina, nombre: 'ProcedimientoMedicina' },
      { modelo: CuestionarioBurnout, nombre: 'CuestionarioBurnout' },
      { modelo: RegistroProcedimientosTENS, nombre: 'RegistroProcedimientosTENS' }
    ];
    
    for (const tabla of tablas) {
      try {
        const count = await tabla.modelo.count({
          where: { usuarioId: userId }
        });
        
        if (count > 0) {
        } else {
        }
      } catch (error) {
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

verificarDependenciasUsuario(3);