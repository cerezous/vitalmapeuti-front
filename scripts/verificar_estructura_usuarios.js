const sequelize = require('../backend/config/database');

async function verificarEstructuraUsuarios() {
  try {
    console.log('🔍 Verificando estructura de la tabla usuarios...');
    
    const columnas = await sequelize.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'usuarios' 
       ORDER BY ordinal_position`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📋 Columnas de la tabla usuarios:');
    columnas.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
    // Verificar un usuario existente para ver la estructura
    console.log('\n👤 Ejemplo de usuario existente:');
    const usuarioEjemplo = await sequelize.query(
      'SELECT * FROM usuarios WHERE id = 16 LIMIT 1',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (usuarioEjemplo.length > 0) {
      console.log('Usuario ejemplo:', usuarioEjemplo[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

verificarEstructuraUsuarios();
