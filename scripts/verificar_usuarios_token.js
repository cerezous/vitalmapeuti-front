const sequelize = require('../backend/config/database');
const jwt = require('jsonwebtoken');

async function verificarUsuariosYToken() {
  try {
    console.log('🔍 Verificando usuarios existentes...');
    
    const usuarios = await sequelize.query(
      'SELECT id, usuario, nombres, apellidos FROM usuarios ORDER BY id',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n👥 Usuarios encontrados:');
    usuarios.forEach(u => {
      console.log(`- ID: ${u.id}, Usuario: ${u.usuario}, Nombre: ${u.nombres} ${u.apellidos}`);
    });
    
    // Crear un token válido para el usuario mcerezo (ID 16)
    console.log('\n🔑 Creando token válido para usuario mcerezo...');
    const token = jwt.sign(
      { 
        id: 16, 
        usuario: 'mcerezo', 
        estamento: 'Enfermería' 
      },
      process.env.JWT_SECRET || 'vitalmape-secret-key-2024',
      { expiresIn: '24h' }
    );
    
    console.log('Token generado:', token);
    
    // Verificar datos del usuario mcerezo
    console.log('\n🔍 Datos del usuario mcerezo (ID 16):');
    
    const registrosUsuario16 = await sequelize.query(
      'SELECT COUNT(*) as total FROM registros_procedimientos WHERE "usuarioId" = 16',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('- Registros de procedimientos:', registrosUsuario16[0].total);
    
    const procedimientosUsuario16 = await sequelize.query(
      `SELECT COUNT(*) as total FROM procedimientos_registro pr 
       JOIN registros_procedimientos rp ON pr."registroId" = rp.id 
       WHERE rp."usuarioId" = 16`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('- Procedimientos individuales:', procedimientosUsuario16[0].total);
    
    const categorizacionesUsuario16 = await sequelize.query(
      'SELECT COUNT(*) as total FROM categorizaciones_kinesiologia WHERE "usuarioId" = 16',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('- Categorizaciones:', categorizacionesUsuario16[0].total);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

verificarUsuariosYToken();
