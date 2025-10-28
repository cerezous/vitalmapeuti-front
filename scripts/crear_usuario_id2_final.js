const sequelize = require('../backend/config/database');

async function crearUsuarioID2() {
  try {
    console.log('🔍 Verificando estructura de usuarios y creando usuario ID 2...');
    
    // Verificar estructura de la tabla usuarios
    const columnas = await sequelize.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'usuarios' 
       ORDER BY ordinal_position`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📋 Columnas de la tabla usuarios:');
    columnas.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    // Verificar si ya existe un usuario con ID 2
    const usuarioExistente = await sequelize.query(
      'SELECT id FROM usuarios WHERE id = 2',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (usuarioExistente.length > 0) {
      console.log('✅ Usuario con ID 2 ya existe');
      return;
    }
    
    // Crear usuario con ID 2 basado en la estructura real
    await sequelize.query(
      `INSERT INTO usuarios (id, usuario, nombres, apellidos, correo, estamento, contraseña, "createdAt", "updatedAt") 
       VALUES (2, 'mcerezo', 'MATIAS ANDRES', 'CEREZO PRADO', 'mcerezo@test.com', 'Enfermería', '$2b$10$example', NOW(), NOW())`,
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
