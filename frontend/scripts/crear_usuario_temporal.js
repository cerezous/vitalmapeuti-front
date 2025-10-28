const Usuario = require('./models/Usuario');
const sequelize = require('./config/database');

async function crearUsuarioTemporal() {
  try {
    await sequelize.authenticate();
    
    // Crear un usuario temporal para pruebas
    const usuarioTemporal = await Usuario.create({
      nombres: 'Usuario',
      apellidos: 'Temporal',
      usuario: 'temp_admin',
      contraseña: 'temp123',
      correo: 'temp@test.com',
      estamento: 'Administrador'
    });
    
      id: usuarioTemporal.id,
      usuario: usuarioTemporal.usuario,
      estamento: usuarioTemporal.estamento
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

crearUsuarioTemporal();