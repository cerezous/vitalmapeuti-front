const sequelize = require('../backend/config/database');

async function explorarTabla() {
  try {
    console.log('🔍 Explorando estructura de la tabla procedimientos_registro...');
    
    // Consulta para obtener información de las columnas
    const columnas = await sequelize.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'procedimientos_registro' ORDER BY ordinal_position`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('📋 Columnas encontradas:');
    columnas.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    // También probar una consulta simple
    console.log('\n🧪 Probando consulta simple...');
    const resultado = await sequelize.query(
      `SELECT * FROM procedimientos_registro LIMIT 1`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('📊 Resultado de consulta:', resultado);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

explorarTabla();
