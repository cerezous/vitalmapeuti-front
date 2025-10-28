// Script para consultar usuarios administradores en Render (Producción Real)
const { Sequelize } = require('sequelize');

async function consultarAdministradoresRender() {
  let sequelize;
  
  try {
    console.log('🔍 Consultando usuarios administradores en RENDER (Producción Real)...\n');
    
    // Configurar conexión a Render
    const DATABASE_URL = 'postgresql://vitalmapeuti_db_user:EDZU8QayOlnrtDhuhSXuQkyeMabjjkAw@dpg-d3vp7a3ipnbc739jqnhg-a.oregon-postgres.render.com/vitalmapeuti_db';
    
    sequelize = new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    
    // Probar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a Render establecida correctamente');
    
    // Consultar usuarios administradores
    const [results] = await sequelize.query(`
      SELECT id, usuario, nombres, apellidos, correo, estamento, "createdAt"
      FROM usuarios 
      WHERE estamento = 'Administrador'
      ORDER BY "createdAt" ASC
    `);
    
    if (results.length === 0) {
      console.log('❌ No se encontraron usuarios administradores en Render');
      
      // Consultar todos los usuarios para ver qué hay
      const [allUsers] = await sequelize.query(`
        SELECT id, usuario, nombres, apellidos, correo, estamento, "createdAt"
        FROM usuarios 
        ORDER BY "createdAt" ASC
        LIMIT 10
      `);
      
      if (allUsers.length > 0) {
        console.log(`\n📊 Se encontraron ${allUsers.length} usuario(s) en total:`);
        allUsers.forEach((user, index) => {
          console.log(`${index + 1}. 👤 ${user.nombres} ${user.apellidos} (${user.estamento})`);
        });
      } else {
        console.log('❌ No se encontraron usuarios en la base de datos');
      }
      
      return;
    }
    
    console.log(`📊 Se encontraron ${results.length} usuario(s) administrador(es) en RENDER:\n`);
    
    results.forEach((admin, index) => {
      console.log(`${index + 1}. 👤 ${admin.nombres} ${admin.apellidos}`);
      console.log(`   📧 Correo: ${admin.correo}`);
      console.log(`   🔑 Usuario: ${admin.usuario}`);
      console.log(`   🆔 ID: ${admin.id}`);
      console.log(`   📅 Creado: ${new Date(admin.createdAt).toLocaleDateString('es-CL')}`);
      console.log('   ' + '─'.repeat(50));
    });
    
    // También mostrar información de la base de datos
    console.log('\n🌍 Información de la base de datos Render:');
    console.log(`   Host: dpg-d3vp7a3ipnbc739jqnhg-a.oregon-postgres.render.com`);
    console.log(`   Base de datos: vitalmapeuti_db`);
    console.log(`   Usuario: vitalmapeuti_db_user`);
    console.log(`   Región: Oregon (US West)`);
    
    // Consultar estadísticas adicionales
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN estamento = 'Administrador' THEN 1 END) as administradores,
        COUNT(CASE WHEN estamento = 'Enfermería' THEN 1 END) as enfermeria,
        COUNT(CASE WHEN estamento = 'Medicina' THEN 1 END) as medicina,
        COUNT(CASE WHEN estamento = 'Kinesiología' THEN 1 END) as kinesiologia
      FROM usuarios
    `);
    
    if (stats.length > 0) {
      const stat = stats[0];
      console.log('\n📈 Estadísticas de usuarios:');
      console.log(`   Total usuarios: ${stat.total_usuarios}`);
      console.log(`   Administradores: ${stat.administradores}`);
      console.log(`   Enfermería: ${stat.enfermeria}`);
      console.log(`   Medicina: ${stat.medicina}`);
      console.log(`   Kinesiología: ${stat.kinesiologia}`);
    }
    
    console.log('\n✅ Consulta de Render completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error al consultar administradores en Render:', error.message);
    console.error('🔧 Detalles del error:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Ejecutar la función
consultarAdministradoresRender();
