const sequelize = require('../backend/config/database');

async function verificarCategorizaciones() {
  try {
    console.log('🔍 Verificando categorizaciones existentes...');
    
    const categorizaciones = await sequelize.query(
      'SELECT "usuarioId", COUNT(*) as total FROM categorizaciones_kinesiologia GROUP BY "usuarioId"',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📊 Categorizaciones por usuario:');
    categorizaciones.forEach(cat => {
      console.log(`- Usuario ID ${cat.usuarioId}: ${cat.total} categorizaciones`);
    });
    
    // Verificar qué usuario es el que está haciendo la petición
    console.log('\n🔍 Verificando usuario del token...');
    const usuarios = await sequelize.query(
      'SELECT id, usuario, nombres, apellidos FROM usuarios WHERE id = 2',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (usuarios.length > 0) {
      console.log(`- Usuario ID 2: ${usuarios[0].usuario} (${usuarios[0].nombres} ${usuarios[0].apellidos})`);
    } else {
      console.log('- Usuario ID 2 no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

verificarCategorizaciones();
