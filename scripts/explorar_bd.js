const sequelize = require('../backend/config/database');

async function explorarBaseDatos() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');
    
    // Listar todas las tablas
    console.log('\n📋 TABLAS DISPONIBLES:');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Explorar estructura de cada tabla
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`\n🔍 ESTRUCTURA DE LA TABLA: ${tableName}`);
      
      try {
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          ORDER BY ordinal_position;
        `);
        
        columns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        
        // Mostrar algunos datos de ejemplo
        const [sampleData] = await sequelize.query(`
          SELECT * FROM "${tableName}" LIMIT 3;
        `);
        
        if (sampleData.length > 0) {
          console.log(`\n📊 DATOS DE EJEMPLO (${sampleData.length} registros):`);
          sampleData.forEach((row, index) => {
            console.log(`  Registro ${index + 1}:`, JSON.stringify(row, null, 2));
          });
        } else {
          console.log(`\n📊 La tabla ${tableName} está vacía`);
        }
        
        // Contar registros totales
        const [count] = await sequelize.query(`
          SELECT COUNT(*) as total FROM "${tableName}";
        `);
        console.log(`📈 Total de registros: ${count[0].total}`);
        
      } catch (error) {
        console.log(`❌ Error al explorar ${tableName}: ${error.message}`);
      }
      
      console.log('\n' + '='.repeat(80));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  explorarBaseDatos();
}

module.exports = explorarBaseDatos;
