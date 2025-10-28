const sequelize = require('../backend/config/database');

async function verificarDatosReales() {
  try {
    console.log('🔍 Verificando datos reales en las tablas...');
    
    // Verificar registros de procedimientos
    const registros = await sequelize.query(
      'SELECT COUNT(*) as total FROM registros_procedimientos',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('\n📋 Total registros de procedimientos:', registros[0].total);
    
    // Verificar procedimientos individuales
    const procedimientos = await sequelize.query(
      'SELECT COUNT(*) as total FROM procedimientos_registro',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('\n🔧 Total procedimientos individuales:', procedimientos[0].total);
    
    // Verificar categorizaciones
    const categorizaciones = await sequelize.query(
      'SELECT COUNT(*) as total FROM categorizaciones_kinesiologia',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('\n📊 Total categorizaciones:', categorizaciones[0].total);
    
    // Verificar datos específicos del usuario ID 2
    console.log('\n🔍 Datos específicos del usuario ID 2:');
    
    const registrosUsuario2 = await sequelize.query(
      'SELECT COUNT(*) as total FROM registros_procedimientos WHERE "usuarioId" = 2',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('- Registros de procedimientos:', registrosUsuario2[0].total);
    
    const procedimientosUsuario2 = await sequelize.query(
      `SELECT COUNT(*) as total FROM procedimientos_registro pr 
       JOIN registros_procedimientos rp ON pr."registroId" = rp.id 
       WHERE rp."usuarioId" = 2`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('- Procedimientos individuales:', procedimientosUsuario2[0].total);
    
    const categorizacionesUsuario2 = await sequelize.query(
      'SELECT COUNT(*) as total FROM categorizaciones_kinesiologia WHERE "usuarioId" = 2',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('- Categorizaciones:', categorizacionesUsuario2[0].total);
    
    // Verificar datos específicos del usuario mcerezo (ID 16)
    console.log('\n🔍 Datos específicos del usuario mcerezo (ID 16):');
    
    const registrosUsuario16 = await sequelize.query(
      'SELECT COUNT(*) as total FROM registros_procedimientos WHERE "usuarioId" = 16',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('- Registros de procedimientos:', registrosUsuario16[0].total);
    
    const procedimientosUsuario16 = await sequelize.query(
      `SELECT COUNT(*) as total FROM procedimientos_registro pr 
       JOIN registros_procedimientos rp ON pr."registroId" = rp.id 
       WHERE rp."usuarioId" = 16`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('- Procedimientos individuales:', procedimientosUsuario16[0].total);
    
    const categorizacionesUsuario16 = await sequelize.query(
      'SELECT COUNT(*) as total FROM categorizaciones_kinesiologia WHERE "usuarioId" = 16',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('- Categorizaciones:', categorizacionesUsuario16[0].total);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

verificarDatosReales();
