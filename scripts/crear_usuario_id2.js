const sequelize = require('../backend/config/database');

async function crearUsuarioID2() {
  try {
    console.log('🔍 Creando usuario con ID 2...');
    
    // Verificar si ya existe un usuario con ID 2
    const usuarioExistente = await sequelize.query(
      'SELECT id FROM usuarios WHERE id = 2',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (usuarioExistente.length > 0) {
      console.log('✅ Usuario con ID 2 ya existe');
      return;
    }
    
    // Crear usuario con ID 2
    await sequelize.query(
      `INSERT INTO usuarios (id, usuario, nombres, apellidos, correo, password, estamento, activo, "createdAt", "updatedAt") 
       VALUES (2, 'mcerezo', 'MATIAS ANDRES', 'CEREZO PRADO', 'mcerezo@test.com', '$2b$10$example', 'Enfermería', true, NOW(), NOW())`,
      { type: sequelize.QueryTypes.INSERT }
    );
    
    console.log('✅ Usuario con ID 2 creado exitosamente');
    
    // Verificar que se creó correctamente
    const usuarioCreado = await sequelize.query(
      'SELECT id, usuario, nombres, apellidos FROM usuarios WHERE id = 2',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('👤 Usuario creado:', usuarioCreado[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

crearUsuarioID2();
