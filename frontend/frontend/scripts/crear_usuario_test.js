const Usuario = require('./models/Usuario');
const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');

async function crearUsuarioTest() {
  try {
    await sequelize.authenticate();
    
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const contraseñaHasheada = await bcrypt.hash('test123', salt);
    
    // Crear usuario test
    const usuarioTest = await Usuario.create({
      nombres: 'Usuario',
      apellidos: 'Test',
      usuario: 'usertest',
      correo: 'test@test.com',
      estamento: 'Administrador',
      contraseña: contraseñaHasheada
    });
    
      id: usuarioTest.id,
      usuario: usuarioTest.usuario,
      estamento: usuarioTest.estamento
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

crearUsuarioTest();