// Script para crear un nuevo usuario administrador con credenciales personalizadas
const sequelize = require('../backend/config/database');
const Usuario = require('../backend/models/Usuario');

async function crearNuevoAdmin() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    // Credenciales personalizables
    const nuevoAdmin = {
      nombres: 'Admin',
      apellidos: 'Producción',
      usuario: 'adminprod', // Cambia este usuario
      correo: 'adminprod@vitalmape.com', // Cambia este correo
      estamento: 'Administrador',
      contraseña: 'admin123' // Cambia esta contraseña
    };

    // Verificar si ya existe
    const existe = await Usuario.findOne({ 
      where: { 
        $or: [
          { usuario: nuevoAdmin.usuario },
          { correo: nuevoAdmin.correo }
        ]
      } 
    });

    if (existe) {
      console.log('❌ El usuario o correo ya existe. Cambia las credenciales en el script.');
      process.exit(1);
    }

    const admin = await Usuario.create(nuevoAdmin);
    console.log('✅ Usuario administrador creado exitosamente:');
    console.log(`   Usuario: ${admin.usuario}`);
    console.log(`   Correo: ${admin.correo}`);
    console.log(`   Contraseña: ${nuevoAdmin.contraseña}`);
    console.log(`   Estamento: ${admin.estamento}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear admin:', error.message);
    process.exit(1);
  }
}

crearNuevoAdmin();
