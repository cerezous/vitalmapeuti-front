// Script para eliminar usuarios y sus registros relacionados excepto los de Catalina Brito
const { Sequelize } = require('sequelize');

async function eliminarUsuariosConRelaciones() {
  let sequelize;
  
  try {
    console.log('🗑️  Eliminando usuarios y registros relacionados excepto los de Catalina Brito...\n');
    
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
    
    // Obtener IDs de usuarios a eliminar (todos excepto Catalina)
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
    
    const idsAEliminar = usuariosAEliminar.map(user => user.id);
    
    console.log(`⚠️  Eliminando ${usuariosAEliminar.length} usuario(s) y sus registros relacionados:\n`);
    
    usuariosAEliminar.forEach((user, index) => {
      console.log(`${index + 1}. ❌ ${user.nombres} ${user.apellidos} (${user.estamento}) - ID: ${user.id}`);
    });
    
    // Iniciar transacción para eliminar en cascada
    const transaction = await sequelize.transaction();
    
    try {
      console.log('\n🗑️  Iniciando eliminación en cascada...\n');
      
      // Lista de tablas que pueden tener referencias a usuarios
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
      
      // Eliminar registros relacionados en cada tabla
      for (const tabla of tablasConReferencias) {
        try {
          const [resultado] = await sequelize.query(`
            DELETE FROM ${tabla} 
            WHERE "usuarioId" IN (${idsAEliminar.join(',')})
          `, { transaction });
          
          if (resultado > 0) {
            console.log(`   ✅ ${tabla}: ${resultado} registro(s) eliminado(s)`);
          }
        } catch (error) {
          // Si la tabla no existe o no tiene la columna, continuar
          if (error.message.includes('does not exist') || error.message.includes('column') || error.message.includes('relation')) {
            console.log(`   ⏭️  ${tabla}: tabla no existe o sin referencias`);
          } else {
            throw error;
          }
        }
      }
      
      // Ahora eliminar los usuarios
      console.log('\n🗑️  Eliminando usuarios...');
      const [resultadoUsuarios] = await sequelize.query(`
        DELETE FROM usuarios 
        WHERE id IN (${idsAEliminar.join(',')})
      `, { transaction });
      
      console.log(`✅ ${resultadoUsuarios} usuario(s) eliminado(s)`);
      
      // Confirmar transacción
      await transaction.commit();
      console.log('\n✅ Transacción confirmada exitosamente');
      
    } catch (error) {
      // Revertir transacción en caso de error
      await transaction.rollback();
      throw error;
    }
    
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
eliminarUsuariosConRelaciones();
