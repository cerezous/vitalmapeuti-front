// Script para consultar todos los usuarios en Render con detalles completos
const { Sequelize } = require('sequelize');

async function consultarTodosUsuariosRender() {
  let sequelize;
  
  try {
    console.log('🔍 Consultando TODOS los usuarios en RENDER (Producción Real)...\n');
    
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
      logging: false
    });
    
    // Probar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a Render establecida correctamente');
    
    // Consultar todos los usuarios con detalles
    const [results] = await sequelize.query(`
      SELECT id, usuario, nombres, apellidos, correo, estamento, "createdAt", "updatedAt"
      FROM usuarios 
      ORDER BY "createdAt" ASC
    `);
    
    if (results.length === 0) {
      console.log('❌ No se encontraron usuarios en la base de datos');
      return;
    }
    
    console.log(`📊 Se encontraron ${results.length} usuario(s) en RENDER:\n`);
    
    // Agrupar por estamento
    const usuariosPorEstamento = {};
    results.forEach(user => {
      if (!usuariosPorEstamento[user.estamento]) {
        usuariosPorEstamento[user.estamento] = [];
      }
      usuariosPorEstamento[user.estamento].push(user);
    });
    
    // Mostrar por estamento
    Object.keys(usuariosPorEstamento).forEach(estamento => {
      const usuarios = usuariosPorEstamento[estamento];
      console.log(`\n🏷️  ${estamento.toUpperCase()} (${usuarios.length} usuario(s)):`);
      console.log('   ' + '─'.repeat(60));
      
      usuarios.forEach((user, index) => {
        console.log(`   ${index + 1}. 👤 ${user.nombres} ${user.apellidos}`);
        console.log(`      📧 Correo: ${user.correo}`);
        console.log(`      🔑 Usuario: ${user.usuario}`);
        console.log(`      🆔 ID: ${user.id}`);
        console.log(`      📅 Creado: ${new Date(user.createdAt).toLocaleDateString('es-CL')}`);
        console.log('');
      });
    });
    
    // Estadísticas finales
    console.log('\n📈 RESUMEN ESTADÍSTICO:');
    console.log('   ' + '═'.repeat(50));
    Object.keys(usuariosPorEstamento).forEach(estamento => {
      const count = usuariosPorEstamento[estamento].length;
      const emoji = estamento === 'Administrador' ? '👑' : 
                   estamento === 'Enfermería' ? '🏥' :
                   estamento === 'Medicina' ? '🩺' :
                   estamento === 'Kinesiología' ? '💪' :
                   estamento === 'TENS' ? '⚡' : '👤';
      console.log(`   ${emoji} ${estamento}: ${count} usuario(s)`);
    });
    
    console.log(`\n   📊 TOTAL: ${results.length} usuario(s)`);
    
    // Verificar si hay administradores
    const administradores = usuariosPorEstamento['Administrador'] || [];
    if (administradores.length === 0) {
      console.log('\n⚠️  ADVERTENCIA: No hay usuarios administradores en producción');
      console.log('   💡 Recomendación: Crear al menos un usuario administrador');
    }
    
    console.log('\n✅ Consulta completa de Render finalizada');
    
  } catch (error) {
    console.error('❌ Error al consultar usuarios en Render:', error.message);
    console.error('🔧 Detalles del error:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Ejecutar la función
consultarTodosUsuariosRender();
