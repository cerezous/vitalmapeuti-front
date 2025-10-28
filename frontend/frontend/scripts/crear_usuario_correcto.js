const Usuario = require('./models/Usuario');
const sequelize = require('./config/database');

async function crearUsuarioTestCorrectamente() {
  try {
    await sequelize.authenticate();
    
    // Eliminar usuario test anterior si existe
    await Usuario.destroy({ where: { usuario: 'usertest' } });
    
    // Crear usuario test con contraseña sin hashear (Sequelize lo hará automáticamente)
    const usuarioTest = await Usuario.create({
      nombres: 'Usuario',
      apellidos: 'Test',
      usuario: 'usertest',
      correo: 'test@test.com',
      estamento: 'Administrador',
      contraseña: 'test123' // Sin hashear
    });
    
      id: usuarioTest.id,
      usuario: usuarioTest.usuario,
      estamento: usuarioTest.estamento
    });
    
    // Probar verificación de contraseña
    const contraseñaCorrecta = await usuarioTest.verificarContraseña('test123');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

crearUsuarioTestCorrectamente();