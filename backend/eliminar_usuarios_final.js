// Script simplificado para eliminar usuarios excepto los de Catalina Brito
const { Sequelize } = require('sequelize');

async function eliminarUsuariosSimple() {
  let sequelize;
  
  try {
    console.log('🗑️  Eliminando usuarios excepto los de Catalina Brito (método simplificado)...\n');
    
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
    
    // Obtener usuarios a eliminar
    const [usuariosAEliminar] = await sequelize.query(`
      SELECT id, usuario, nombres, apellidos, correo, estamento
      FROM usuarios 
      WHERE nombres NOT LIKE '%Catalina%' OR apellidos NOT LIKE '%Brito%'
      ORDER BY id ASC
    `);
    
    if (usuariosAEliminar.length === 0) {
      console.log('✅ No hay usuarios para eliminar');
      return;
    }
    
    console.log(`⚠️  Eliminando ${usuariosAEliminar.length} usuario(s):\n`);
    
    usuariosAEliminar.forEach((user, index) => {
      console.log(`${index + 1}. ❌ ${user.nombres} ${user.apellidos} (${user.estamento}) - ID: ${user.id}`);
    });
    
    // Eliminar registros relacionados primero
    console.log('\n🗑️  Eliminando registros relacionados...\n');
    
    // Lista de tablas que pueden tener referencias
    const tablasConReferencias = [
      'procedimientos_kinesiologia',
      'procedimientos_enfermeria', 
      'procedimientos_medicina',
      'procedimientos_tens',
      'procedimientos_auxiliares',
      'evaluaciones_apache2',
      'evaluaciones_nas',
      'registros_burnout',
      'categorizacion_kinesiologia',
      'turnos_medicina',
      'egresos'
    ];
    
    let totalRegistrosEliminados = 0;
    
    for (const tabla of tablasConReferencias) {
      try {
        // Verificar si la tabla existe
        const [tablaExiste] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tabla}'
          );
        `);
        
        if (tablaExiste[0].exists) {
          // Verificar si tiene columna usuarioId
          const [columnaExiste] = await sequelize.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = '${tabla}' 
              AND column_name = 'usuarioId'
            );
          `);
          
          if (columnaExiste[0].exists) {
            const [resultado] = await sequelize.query(`
              DELETE FROM ${tabla} 
              WHERE "usuarioId" IN (${usuariosAEliminar.map(u => u.id).join(',')})
            `);
            
            if (resultado > 0) {
              console.log(`   ✅ ${tabla}: ${resultado} registro(s) eliminado(s)`);
              totalRegistrosEliminados += resultado;
            } else {
              console.log(`   ⏭️  ${tabla}: sin registros relacionados`);
            }
          } else {
            console.log(`   ⏭️  ${tabla}: sin columna usuarioId`);
          }
        } else {
          console.log(`   ⏭️  ${tabla}: tabla no existe`);
        }
      } catch (error) {
        console.log(`   ❌ ${tabla}: error - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Total registros relacionados eliminados: ${totalRegistrosEliminados}`);
    
    // Ahora eliminar los usuarios
    console.log('\n🗑️  Eliminando usuarios...');
    
    const idsAEliminar = usuariosAEliminar.map(user => user.id);
    const [resultadoUsuarios] = await sequelize.query(`
      DELETE FROM usuarios 
      WHERE id IN (${idsAEliminar.join(',')})
    `);
    
    console.log(`✅ ${resultadoUsuarios} usuario(s) eliminado(s)`);
    
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
        console.log(`${index + 1}. ✅ ${user.nombres} ${user.apellidos} (${user.estamento})`);
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
eliminarUsuariosSimple();
