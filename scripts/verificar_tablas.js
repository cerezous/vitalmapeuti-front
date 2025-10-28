const sequelize = require('../backend/config/database');

async function verificarTablas() {
  try {
    console.log('🔍 Verificando tablas existentes en la base de datos...');
    
    // Obtener todas las tablas
    const tablas = await sequelize.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📋 Tablas encontradas:');
    tablas.forEach(tabla => {
      console.log(`- ${tabla.tablename}`);
    });
    
    // Verificar si existe alguna tabla relacionada con procedimientos
    const tablasProcedimientos = tablas.filter(t => 
      t.tablename && (t.tablename.includes('procedimiento') || 
      t.tablename.includes('registro'))
    );
    
    console.log('\n🔧 Tablas relacionadas con procedimientos:');
    if (tablasProcedimientos.length > 0) {
      tablasProcedimientos.forEach(tabla => {
        console.log(`- ${tabla.tablename}`);
      });
    } else {
      console.log('❌ No se encontraron tablas relacionadas con procedimientos');
    }
    
    // Verificar si existe alguna tabla relacionada con categorizaciones
    const tablasCategorizaciones = tablas.filter(t => 
      t.tablename && (t.tablename.includes('categorizacion') || 
      t.tablename.includes('kinesiologia'))
    );
    
    console.log('\n📊 Tablas relacionadas con categorizaciones:');
    if (tablasCategorizaciones.length > 0) {
      tablasCategorizaciones.forEach(tabla => {
        console.log(`- ${tabla.tablename}`);
      });
    } else {
      console.log('❌ No se encontraron tablas relacionadas con categorizaciones');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

verificarTablas();
