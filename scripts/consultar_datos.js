const sequelize = require('../backend/config/database');

async function consultarDatos() {
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
    
    // Consultar usuarios
    console.log('\n👥 USUARIOS:');
    const [usuarios] = await sequelize.query(`
      SELECT id, usuario, nombres, apellidos, estamento 
      FROM usuarios 
      ORDER BY id 
      LIMIT 10;
    `);
    
    usuarios.forEach(user => {
      console.log(`ID: ${user.id} | Usuario: ${user.usuario} | Nombre: ${user.nombres} ${user.apellidos} | Estamento: ${user.estamento}`);
    });
    
    // Consultar pacientes
    console.log('\n🏥 PACIENTES:');
    const [pacientes] = await sequelize.query(`
      SELECT id, nombres, apellidos, rut, fecha_ingreso, estado 
      FROM pacientes 
      ORDER BY id 
      LIMIT 10;
    `);
    
    pacientes.forEach(paciente => {
      console.log(`ID: ${paciente.id} | Nombre: ${paciente.nombres} ${paciente.apellidos} | RUT: ${paciente.rut} | Estado: ${paciente.estado}`);
    });
    
    // Consultar procedimientos
    console.log('\n⚕️ PROCEDIMIENTOS RECIENTES:');
    const [procedimientos] = await sequelize.query(`
      SELECT id, nombre, tipo 
      FROM procedimientos_sistema 
      ORDER BY id DESC 
      LIMIT 10;
    `);
    
    procedimientos.forEach(proc => {
      console.log(`ID: ${proc.id} | Nombre: ${proc.nombre} | Tipo: ${proc.tipo}`);
    });
    
    // Estadísticas generales
    console.log('\n📊 ESTADÍSTICAS:');
    const [stats] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM pacientes) as total_pacientes,
        (SELECT COUNT(*) FROM procedimientos_sistema) as total_procedimientos;
    `);
    
    console.log(`Total Usuarios: ${stats[0].total_usuarios}`);
    console.log(`Total Pacientes: ${stats[0].total_pacientes}`);
    console.log(`Total Procedimientos: ${stats[0].total_procedimientos}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  consultarDatos();
}

module.exports = consultarDatos;
