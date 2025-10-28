// Script para crear usuario administrador en Render
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

async function crearUsuarioAdministrador() {
  let sequelize;
  
  try {
    console.log('👑 Creando usuario administrador en Render...\n');
    
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
    
    // Datos del usuario administrador
    const datosUsuario = {
      nombres: 'Matias',
      apellidos: 'Cerezo Prado',
      usuario: 'mcerezop',
      correo: 'mcerezopr@gmail.com',
      estamento: 'Administrador',
      contraseña: 'shualabn'
    };
    
    console.log('📋 Datos del usuario administrador:');
    console.log(`   👤 Nombre: ${datosUsuario.nombres} ${datosUsuario.apellidos}`);
    console.log(`   🔑 Usuario: ${datosUsuario.usuario}`);
    console.log(`   📧 Correo: ${datosUsuario.correo}`);
    console.log(`   👑 Estamento: ${datosUsuario.estamento}`);
    console.log(`   🔐 Contraseña: ${datosUsuario.contraseña}`);
    
    // Verificar si el usuario ya existe
    const [usuarioExistente] = await sequelize.query(`
      SELECT id, usuario, correo FROM usuarios 
      WHERE usuario = '${datosUsuario.usuario}' OR correo = '${datosUsuario.correo}'
    `);
    
    if (usuarioExistente.length > 0) {
      console.log('\n⚠️  El usuario ya existe:');
      usuarioExistente.forEach(user => {
        console.log(`   - Usuario: ${user.usuario} | Correo: ${user.correo} | ID: ${user.id}`);
      });
      console.log('\n❌ No se puede crear el usuario administrador');
      return;
    }
    
    // Encriptar contraseña
    console.log('\n🔐 Encriptando contraseña...');
    const salt = await bcrypt.genSalt(10);
    const contraseñaEncriptada = await bcrypt.hash(datosUsuario.contraseña, salt);
    console.log('✅ Contraseña encriptada correctamente');
    
    // Crear el usuario
    console.log('\n👑 Creando usuario administrador...');
    
    const [resultado] = await sequelize.query(`
      INSERT INTO usuarios (nombres, apellidos, usuario, correo, estamento, contraseña, "createdAt", "updatedAt")
      VALUES (
        '${datosUsuario.nombres}',
        '${datosUsuario.apellidos}',
        '${datosUsuario.usuario}',
        '${datosUsuario.correo}',
        '${datosUsuario.estamento}',
        '${contraseñaEncriptada}',
        NOW(),
        NOW()
      )
      RETURNING id, nombres, apellidos, usuario, correo, estamento, "createdAt"
    `);
    
    if (resultado.length > 0) {
      const nuevoUsuario = resultado[0];
      console.log('\n✅ Usuario administrador creado exitosamente:');
      console.log(`   🆔 ID: ${nuevoUsuario.id}`);
      console.log(`   👤 Nombre: ${nuevoUsuario.nombres} ${nuevoUsuario.apellidos}`);
      console.log(`   🔑 Usuario: ${nuevoUsuario.usuario}`);
      console.log(`   📧 Correo: ${nuevoUsuario.correo}`);
      console.log(`   👑 Estamento: ${nuevoUsuario.estamento}`);
      console.log(`   📅 Creado: ${new Date(nuevoUsuario.createdAt).toLocaleString('es-CL')}`);
    }
    
    // Verificar estado final de usuarios
    const [usuariosFinales] = await sequelize.query(`
      SELECT id, usuario, nombres, apellidos, correo, estamento, "createdAt"
      FROM usuarios 
      ORDER BY "createdAt" ASC
    `);
    
    console.log(`\n📊 Estado final de la base de datos:`);
    console.log(`   Total usuarios: ${usuariosFinales.length}`);
    
    // Agrupar por estamento
    const usuariosPorEstamento = {};
    usuariosFinales.forEach(user => {
      if (!usuariosPorEstamento[user.estamento]) {
        usuariosPorEstamento[user.estamento] = [];
      }
      usuariosPorEstamento[user.estamento].push(user);
    });
    
    console.log('\n👥 Usuarios por estamento:');
    Object.keys(usuariosPorEstamento).forEach(estamento => {
      const usuarios = usuariosPorEstamento[estamento];
      const emoji = estamento === 'Administrador' ? '👑' : 
                   estamento === 'TENS' ? '⚡' : '👤';
      console.log(`   ${emoji} ${estamento}: ${usuarios.length} usuario(s)`);
      
      usuarios.forEach(user => {
        console.log(`      - ${user.nombres} ${user.apellidos} (${user.usuario})`);
      });
    });
    
    console.log('\n🎉 ¡Usuario administrador creado exitosamente!');
    console.log('   Ahora puedes acceder al sistema con:');
    console.log(`   🔑 Usuario: ${datosUsuario.usuario}`);
    console.log(`   🔐 Contraseña: ${datosUsuario.contraseña}`);
    
  } catch (error) {
    console.error('❌ Error al crear usuario administrador:', error.message);
    console.error('🔧 Detalles del error:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Ejecutar la función
crearUsuarioAdministrador();
