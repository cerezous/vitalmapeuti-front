// Script para verificar variables de entorno en producción
const { Sequelize } = require('sequelize');

async function verificarVariablesEntorno() {
  let sequelize;
  
  try {
    console.log('🔍 Verificando variables de entorno en producción...\n');
    
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
    console.log('✅ Conexión a base de datos establecida');
    
    // Simular el entorno de Render
    console.log('\n🔧 Variables de entorno que debería recibir el servicio:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NO DEFINIDA'}`);
    console.log(`   PORT: ${process.env.PORT || 'NO DEFINIDA'}`);
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'NO DEFINIDA'}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 'NO DEFINIDA'}`);
    console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'NO DEFINIDA'}`);
    console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? 'DEFINIDA (' + process.env.SMTP_PASS.substring(0, 4) + '...)' : 'NO DEFINIDA'}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'DEFINIDA' : 'NO DEFINIDA'}`);
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'DEFINIDA' : 'NO DEFINIDA'}`);
    console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'NO DEFINIDA'}`);
    
    // Mostrar todas las variables de entorno disponibles
    console.log('\n📋 Todas las variables de entorno disponibles:');
    const envVars = Object.keys(process.env).filter(key => 
      key.includes('SMTP') || 
      key.includes('NODE') || 
      key.includes('PORT') || 
      key.includes('DATABASE') ||
      key.includes('JWT') ||
      key.includes('FRONTEND')
    );
    
    if (envVars.length > 0) {
      envVars.forEach(key => {
        const value = process.env[key];
        const displayValue = key.includes('PASS') || key.includes('SECRET') ? 
          value.substring(0, 4) + '...' : value;
        console.log(`   ${key}: ${displayValue}`);
      });
    } else {
      console.log('   ❌ No se encontraron variables de entorno relevantes');
    }
    
    // Probar configuración de correo con variables simuladas
    console.log('\n📧 Probando configuración de correo...');
    
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || 'mcerezopr@gmail.com',
      pass: process.env.SMTP_PASS || 'kwlx lwok dzus flcv'
    };
    
    console.log('   Configuración SMTP:');
    console.log(`   Host: ${smtpConfig.host}`);
    console.log(`   Port: ${smtpConfig.port}`);
    console.log(`   User: ${smtpConfig.user}`);
    console.log(`   Pass: ${smtpConfig.pass.substring(0, 4)}...`);
    
    // Verificar si las variables están definidas
    const variablesFaltantes = [];
    if (!process.env.SMTP_HOST) variablesFaltantes.push('SMTP_HOST');
    if (!process.env.SMTP_PORT) variablesFaltantes.push('SMTP_PORT');
    if (!process.env.SMTP_USER) variablesFaltantes.push('SMTP_USER');
    if (!process.env.SMTP_PASS) variablesFaltantes.push('SMTP_PASS');
    
    if (variablesFaltantes.length > 0) {
      console.log('\n❌ Variables de entorno faltantes:');
      variablesFaltantes.forEach(variable => {
        console.log(`   - ${variable}`);
      });
      console.log('\n💡 Solución: Configurar estas variables en Render');
    } else {
      console.log('\n✅ Todas las variables de correo están definidas');
    }
    
    console.log('\n🔧 Recomendaciones:');
    console.log('   1. Verificar variables en Render Dashboard');
    console.log('   2. Asegurar que no haya espacios extra');
    console.log('   3. Reiniciar el servicio después de cambios');
    console.log('   4. Verificar que el archivo .env no esté en .gitignore');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Ejecutar la función
verificarVariablesEntorno();
