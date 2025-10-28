// Script para resetear contraseña de usuario existente
const sequelize = require('../backend/config/database');
const Usuario = require('../backend/models/Usuario');

async function resetearContraseña() {
  try {
    await sequelize.authenticate();
    
    const usuarioTarget = 'admin'; // Cambia por el usuario que quieras
    const nuevaContraseña = 'admin123'; // Cambia por la contraseña que quieras
    
    const usuario = await Usuario.findOne({ where: { usuario: usuarioTarget } });
    
    if (!usuario) {
      console.log(`❌ Usuario '${usuarioTarget}' no encontrado.`);
      process.exit(1);
    }
    
    // Actualizar contraseña
    usuario.contraseña = nuevaContraseña;
    await usuario.save();
    
    console.log('✅ Contraseña actualizada exitosamente:');
    console.log(`   Usuario: ${usuario.usuario}`);
    console.log(`   Nueva contraseña: ${nuevaContraseña}`);
    console.log(`   Estamento: ${usuario.estamento}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error.message);
    process.exit(1);
  }
}

resetearContraseña();
