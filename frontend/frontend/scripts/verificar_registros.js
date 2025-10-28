require('dotenv').config();
const sequelize = require('./config/database');
const RegistroProcedimientosTENS = require('./models/RegistroProcedimientosTENS');
const ProcedimientoTENS = require('./models/ProcedimientoTENS');
require('./config/associations');

async function verificarTodosLosRegistros() {
  try {
    
    const registros = await RegistroProcedimientosTENS.findAll({
      include: [{
        model: ProcedimientoTENS,
        as: 'procedimientos'
      }],
      order: [['createdAt', 'DESC']]
    });
    
    
    registros.forEach((registro, index) => {
      
      registro.procedimientos.forEach((proc, procIndex) => {
        if (proc.nombre.includes('Aseo y cuidados')) {
        }
      });
    });
    
    // Buscar específicamente procedimientos de aseo
    const procedimientoAseo = await ProcedimientoTENS.findOne({
      where: {
        nombre: 'Aseo y cuidados del paciente (aseo parcial o completo, cuidados de la piel, etc)'
      }
    });
    
    if (procedimientoAseo) {
      const registrosConAseo = await RegistroProcedimientosTENS.findAll({
        include: [{
          model: ProcedimientoTENS,
          as: 'procedimientos',
          where: {
            id: procedimientoAseo.id
          }
        }]
      });
      
      
      let totalTiempos = [];
      registrosConAseo.forEach((registro, index) => {
        
        const procedimientosAseo = registro.procedimientos.filter(p => p.id === procedimientoAseo.id);
        procedimientosAseo.forEach(proc => {
          totalTiempos.push(proc.tiempo);
        });
      });
      
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

verificarTodosLosRegistros();