// Script para probar el servicio de correo en producción
const { Sequelize } = require('sequelize');
const nodemailer = require('nodemailer');

async function probarServicioCorreo() {
  let sequelize;
  
  try {
    console.log('📧 Probando servicio de correo en producción...\n');
    
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
    
    // Probar conexión a base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');
    
    // Simular variables de entorno de Render
    const envVars = {
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      SMTP_USER: 'mcerezopr@gmail.com',
      SMTP_PASS: 'kwlx lwok dzus flcv',
      NODE_ENV: 'production'
    };
    
    console.log('\n🔧 Variables de entorno simuladas:');
    console.log(`   SMTP_HOST: ${envVars.SMTP_HOST}`);
    console.log(`   SMTP_PORT: ${envVars.SMTP_PORT}`);
    console.log(`   SMTP_USER: ${envVars.SMTP_USER}`);
    console.log(`   SMTP_PASS: ${envVars.SMTP_PASS.substring(0, 4)}...`);
    console.log(`   NODE_ENV: ${envVars.NODE_ENV}`);
    
    // Crear transporter de correo
    console.log('\n📧 Configurando transporter de correo...');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: envVars.SMTP_HOST,
      port: parseInt(envVars.SMTP_PORT),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });
    
    console.log('✅ Transporter configurado');
    
    // Probar conexión SMTP
    console.log('\n🔍 Probando conexión SMTP...');
    
    try {
      await transporter.verify();
      console.log('✅ Conexión SMTP exitosa');
    } catch (error) {
      console.log('❌ Error en conexión SMTP:', error.message);
      console.log('🔧 Detalles del error:', error);
      return;
    }
    
    // Probar envío de correo de prueba
    console.log('\n📤 Enviando correo de prueba...');
    
    const mailOptions = {
      from: `"VitalMape UTI" <${envVars.SMTP_USER}>`,
      to: envVars.SMTP_USER, // Enviar a sí mismo para prueba
      subject: 'Prueba de Correo - VitalMape UTI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4f46e5; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0;">📧 Prueba de Correo</h1>
            <p style="margin: 10px 0 0 0;">Sistema VitalMape UTI</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333;">¡El correo está funcionando!</h2>
            <p style="color: #666; line-height: 1.6;">
              Este es un correo de prueba enviado desde el sistema VitalMape UTI en producción.
            </p>
            <p style="color: #666;">
              <strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}<br>
              <strong>Servidor:</strong> Render<br>
              <strong>Estado:</strong> ✅ Funcionando correctamente
            </p>
          </div>
          
          <div style="background: #374151; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0;">Sistema VitalMape - Gestión UTI</p>
          </div>
        </div>
      `
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Correo enviado exitosamente');
      console.log(`   📧 Message ID: ${info.messageId}`);
      console.log(`   📬 Destinatario: ${mailOptions.to}`);
      console.log(`   📅 Enviado: ${new Date().toLocaleString('es-CL')}`);
    } catch (error) {
      console.log('❌ Error al enviar correo:', error.message);
      console.log('🔧 Detalles del error:', error);
      return;
    }
    
    // Probar función de bienvenida
    console.log('\n👤 Probando función de correo de bienvenida...');
    
    const usuarioPrueba = {
      nombres: 'Usuario',
      apellidos: 'Prueba',
      usuario: 'testuser',
      correo: envVars.SMTP_USER,
      estamento: 'Administrador'
    };
    
    const contraseñaPrueba = 'test123';
    
    const mailOptionsBienvenida = {
      from: `"VitalMape UTI" <${envVars.SMTP_USER}>`,
      to: usuarioPrueba.correo,
      subject: 'Bienvenido a VitalMape - Sistema de Gestión UTI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4f46e5; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 2rem;">
              <i style="margin-right: 10px;">🏥</i>
              VitalMape
            </h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Sistema de Gestión UTI</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">¡Bienvenido/a ${usuarioPrueba.nombres}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Tu cuenta ha sido creada exitosamente en VitalMape. A continuación encontrarás 
              tus credenciales de acceso:
            </p>
            
            <div style="background: white; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">Credenciales de Acceso</h3>
              <p style="margin: 5px 0;"><strong>Usuario:</strong> ${usuarioPrueba.usuario}</p>
              <p style="margin: 5px 0;"><strong>Contraseña:</strong> ${contraseñaPrueba}</p>
              <p style="margin: 5px 0;"><strong>Estamento:</strong> ${usuarioPrueba.estamento}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://vitalmapeuti-front.vercel.app" 
                 style="background: #4f46e5; 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        display: inline-block;
                        font-weight: bold;">
                Acceder al Sistema
              </a>
            </div>
          </div>
          
          <div style="background: #374151; color: white; padding: 20px; text-align: center; font-size: 0.9rem;">
            <p style="margin: 0;">
              Este es un correo automático del sistema VitalMape. 
              Por favor, no respondas a este mensaje.
            </p>
          </div>
        </div>
      `
    };
    
    try {
      const infoBienvenida = await transporter.sendMail(mailOptionsBienvenida);
      console.log('✅ Correo de bienvenida enviado exitosamente');
      console.log(`   📧 Message ID: ${infoBienvenida.messageId}`);
    } catch (error) {
      console.log('❌ Error al enviar correo de bienvenida:', error.message);
      console.log('🔧 Detalles del error:', error);
    }
    
    console.log('\n🎉 ¡Prueba de correo completada exitosamente!');
    console.log('   📧 Revisa tu bandeja de entrada en:', envVars.SMTP_USER);
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('🔧 Detalles del error:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Ejecutar la función
probarServicioCorreo();
