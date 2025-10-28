const sequelize = require('../backend/config/database');

async function mostrarConfiguracionDB() {
  try {
    console.log('🔍 CONFIGURACIÓN DE BASE DE DATOS:');
    console.log('='.repeat(50));
    
    // Mostrar configuración actual
    const config = sequelize.config;
    console.log('Host:', config.host);
    console.log('Port:', config.port);
    console.log('Database:', config.database);
    console.log('Username:', config.username);
    console.log('Password:', config.password ? '[OCULTO]' : 'No configurado');
    console.log('Dialect:', config.dialect);
    console.log('SSL:', config.dialectOptions?.ssl ? 'Habilitado' : 'Deshabilitado');
    
    console.log('\n📊 DATABASE_URL (si está configurada):');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '[CONFIGURADA]' : 'No configurada');
    
    if (process.env.DATABASE_URL) {
      // Parsear DATABASE_URL para mostrar componentes
      const url = new URL(process.env.DATABASE_URL);
      console.log('Host:', url.hostname);
      console.log('Port:', url.port);
      console.log('Database:', url.pathname.substring(1));
      console.log('Username:', url.username);
      console.log('Password:', url.password ? '[OCULTO]' : 'No configurado');
    }
    
    console.log('\n✅ Probando conexión...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  mostrarConfiguracionDB();
}

module.exports = mostrarConfiguracionDB;
