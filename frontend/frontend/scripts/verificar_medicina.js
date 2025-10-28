// Script para verificar y crear/actualizar tablas de medicina
const sequelize = require('./config/database');
const ProcedimientoMedicina = require('./models/ProcedimientoMedicina');

async function verificarYActualizar() {
  try {
    
    // Verificar conexión
    await sequelize.authenticate();
    
    // Listar todas las tablas
    const tables = await sequelize.getQueryInterface().showAllTables();
    
    // Verificar si la tabla ProcedimientoMedicina existe
    const tableName = 'procedimientos_medicina'; // Nombre real de la tabla
    const tableExists = tables.includes(tableName);
    
    if (!tableExists) {
      
      // Sincronizar solo el modelo ProcedimientoMedicina
      await ProcedimientoMedicina.sync({ force: false });
    } else {
      
      // Verificar la estructura actual
      const tableDescription = await sequelize.getQueryInterface().describeTable(tableName);
      
      // Si existe, sincronizar para actualizar si es necesario
      await ProcedimientoMedicina.sync({ alter: true });
    }
    
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

verificarYActualizar();