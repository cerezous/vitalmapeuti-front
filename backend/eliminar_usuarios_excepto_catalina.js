// Script para eliminar usuarios excepto los de Catalina Brito Astudillo
const { Sequelize } = require('sequelize');

async function eliminarUsuariosExceptoCatalina() {
  let sequelize;
  
  try {
    console.log('🗑️  Eliminando usuarios excepto los de Catalina Brito Astudillo...\n');
    
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
    
    // Primero, mostrar usuarios que se van a eliminar
    console.log('🔍 Consultando usuarios a eliminar...\n');
    
    const [usuariosAEliminar] = await sequelize.query(`
      SELECT id, usuario, nombres, apellidos, correo, estamento
      FROM usuarios 
      WHERE nombres NOT LIKE '%Catalina%' OR apellidos NOT LIKE '%Brito%'
      ORDER BY id ASC
    `);
    
    if (usuariosAEliminar.length === 0) {
      console.log('✅ No hay usuarios para eliminar (solo quedan los de Catalina)');
      return;
    }
    
    console.log(`⚠️  Se van a eliminar ${usuariosAEliminar.length} usuario(s):\n`);
    
    usuariosAEliminar.forEach((user, index) => {
      console.log(`${index + 1}. ❌ ${user.nombres} ${user.apellidos} (${user.estamento})`);
      console.log(`   📧 ${user.correo} | 🔑 ${user.usuario} | 🆔 ID: ${user.id}`);
    });
    
    // Mostrar usuarios que se van a mantener
    const [usuariosAMantener] = await sequelize.query(`
      SELECT id, usuario, nombres, apellidos, correo, estamento
      FROM usuarios 
      WHERE nombres LIKE '%Catalina%' AND apellidos LIKE '%Brito%'
      ORDER BY id ASC
    `);
    
    console.log(`\n✅ Se van a mantener ${usuariosAMantener.length} usuario(s) de Catalina:\n`);
    
    usuariosAMantener.forEach((user, index) => {
      console.log(`${index + 1}. ✅ ${user.nombres} ${user.apellidos} (${user.estamento})`);
      console.log(`   📧 ${user.correo} | 🔑 ${user.usuario} | 🆔 ID: ${user.id}`);
    });
    
    // Confirmar eliminación
    console.log('\n🚨 CONFIRMACIÓN REQUERIDA:');
    console.log('   Esta operación eliminará permanentemente los usuarios listados arriba.');
    console.log('   Solo se mantendrán los usuarios de Catalina Brito Astudillo.');
    console.log('   ¿Continuar? (S/N)');
    
    // Proceder con la eliminación
    console.log('\n🗑️  Procediendo con la eliminación...\n');
    
    // Obtener IDs de usuarios a eliminar
    const idsAEliminar = usuariosAEliminar.map(user => user.id);
    
    // Eliminar usuarios
    const [resultado] = await sequelize.query(`
      DELETE FROM usuarios 
      WHERE id IN (${idsAEliminar.join(',')})
    `);
    
    console.log(`✅ Eliminación completada: ${resultado} usuario(s) eliminado(s)`);
    
    // Verificar resultado final
    const [usuariosFinales] = await sequelize.query(`
      SELECT id, usuario, nombres, apellidos, correo, estamento, "createdAt"
      FROM usuarios 
      ORDER BY "createdAt" ASC
    `);
    
    console.log(`\n📊 Estado final de la base de datos:`);
    console.log(`   Total usuarios restantes: ${usuariosFinales.length}`);
    
    if (usuariosFinales.length > 0) {
      console.log('\n👥 Usuarios restantes:');
      usuariosFinales.forEach((user, index) => {
        console.log(`${index + 1}. 👤 ${user.nombres} ${user.apellidos} (${user.estamento})`);
        console.log(`   📧 ${user.correo} | 🔑 ${user.usuario} | 🆔 ID: ${user.id}`);
      });
    }
    
    console.log('\n✅ Operación de limpieza completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error al eliminar usuarios:', error.message);
    console.error('🔧 Detalles del error:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Ejecutar la función
eliminarUsuariosExceptoCatalina();
