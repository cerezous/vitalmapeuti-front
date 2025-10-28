const sequelize = require('../backend/config/database');

async function verificarDatos() {
  try {
    console.log('🔍 Verificando datos en la base de datos...');
    
    // Verificar usuarios
    const usuarios = await sequelize.query(
      'SELECT id, usuario, nombres, apellidos FROM usuarios LIMIT 5',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('\n👥 Usuarios encontrados:', usuarios.length);
    usuarios.forEach(u => console.log(`- ID: ${u.id}, Usuario: ${u.usuario}, Nombre: ${u.nombres} ${u.apellidos}`));
    
    // Verificar registros de procedimientos
    const registros = await sequelize.query(
      'SELECT COUNT(*) as total FROM registro_procedimientos',
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
    
    // Verificar pacientes
    const pacientes = await sequelize.query(
      'SELECT COUNT(*) as total FROM pacientes',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('\n🏥 Total pacientes:', pacientes[0].total);
    
    // Verificar datos específicos del usuario ID 2
    console.log('\n🔍 Datos específicos del usuario ID 2:');
    
    const registrosUsuario2 = await sequelize.query(
      'SELECT COUNT(*) as total FROM registro_procedimientos WHERE "usuarioId" = 2',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('- Registros de procedimientos:', registrosUsuario2[0].total);
    
    const procedimientosUsuario2 = await sequelize.query(
      `SELECT COUNT(*) as total FROM procedimientos_registro pr 
       JOIN registro_procedimientos rp ON pr."registroId" = rp.id 
       WHERE rp."usuarioId" = 2`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('- Procedimientos individuales:', procedimientosUsuario2[0].total);
    
    const categorizacionesUsuario2 = await sequelize.query(
      'SELECT COUNT(*) as total FROM categorizaciones_kinesiologia WHERE "usuarioId" = 2',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('- Categorizaciones:', categorizacionesUsuario2[0].total);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

verificarDatos();
