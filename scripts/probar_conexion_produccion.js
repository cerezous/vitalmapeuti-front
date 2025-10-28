// Script para probar conexión a base de datos de producción
const { Sequelize } = require('sequelize');

async function probarConexionProduccion() {
  // Reemplaza estos valores con tus credenciales reales de Render
  const config = {
    host: 'dpg-xxxxx-a.oregon-postgres.render.com', // Tu host de Render
    port: 5432,
    database: 'vitalmape_db', // Tu nombre de base de datos
    username: 'vitalmape_user', // Tu usuario
    password: 'tu_password_aqui', // Tu contraseña
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: console.log
  };

  const sequelize = new Sequelize(config);

  try {
    console.log('🔄 Probando conexión a base de datos de producción...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa a la base de datos de producción!');
    
    // Probar una consulta simple
    const [results] = await sequelize.query('SELECT COUNT(*) as total FROM usuarios;');
    console.log(`📊 Total de usuarios en producción: ${results[0].total}`);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n💡 Verifica que:');
    console.log('1. Las credenciales sean correctas');
    console.log('2. El servicio PostgreSQL esté activo en Render');
    console.log('3. La configuración SSL esté habilitada');
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  probarConexionProduccion();
}

module.exports = probarConexionProduccion;
