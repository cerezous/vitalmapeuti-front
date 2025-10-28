const sequelize = require('../backend/config/database');

async function verificarUsuarioExistente() {
  try {
    console.log('🔍 Verificando usuario existente para copiar estructura...');
    
    // Obtener un usuario existente
    const usuarioExistente = await sequelize.query(
      'SELECT * FROM usuarios WHERE id = 16 LIMIT 1',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (usuarioExistente.length > 0) {
      console.log('\n👤 Usuario existente (ID 16):');
      console.log(JSON.stringify(usuarioExistente[0], null, 2));
      
      // Crear usuario ID 2 copiando la estructura del usuario existente
      console.log('\n🔧 Creando usuario ID 2...');
      
      await sequelize.query(
        `INSERT INTO usuarios (id, usuario, nombres, apellidos, correo, estamento, contraseña, "createdAt", "updatedAt") 
         VALUES (2, 'mcerezo', 'MATIAS ANDRES', 'CEREZO PRADO', 'mcerezo@test.com', 'Enfermería', '${usuarioExistente[0].contraseña}', NOW(), NOW())`,
        { type: sequelize.QueryTypes.INSERT }
      );
      
      console.log('✅ Usuario con ID 2 creado exitosamente');
      
      // Verificar que se creó correctamente
      const usuarioCreado = await sequelize.query(
        'SELECT id, usuario, nombres, apellidos FROM usuarios WHERE id = 2',
        { type: sequelize.QueryTypes.SELECT }
      );
      
      console.log('👤 Usuario creado:', usuarioCreado[0]);
      
    } else {
      console.log('❌ No se encontró usuario existente para copiar');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

verificarUsuarioExistente();
