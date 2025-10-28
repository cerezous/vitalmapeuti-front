const Usuario = require('../backend/models/Usuario');
const sequelize = require('../backend/config/database');

async function listarUsuarios() {
  try {
    await sequelize.authenticate();
    
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'usuario', 'nombres', 'apellidos', 'estamento'],
      order: [['id', 'ASC']]
    });
    
    console.log('\n📋 Usuarios en la base de datos:');
    console.log('================================');
    usuarios.forEach(usuario => {
      console.log(`ID: ${usuario.id} | Usuario: ${usuario.usuario} | Nombre: ${usuario.nombres} ${usuario.apellidos} | Estamento: ${usuario.estamento}`);
    });
    console.log(`\nTotal usuarios: ${usuarios.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

listarUsuarios();