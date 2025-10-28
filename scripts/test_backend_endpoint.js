const axios = require('axios');

async function testBackendEndpoint() {
  try {
    console.log('🧪 Probando endpoint del backend directamente...');
    
    // URL del backend en producción
    const backendUrl = 'https://vitalmapeuti-back.onrender.com';
    const endpoint = `${backendUrl}/api/registro-procedimientos/metricas/usuario`;
    
    console.log(`📍 Endpoint: ${endpoint}`);
    
    // Necesitamos un token válido para probar
    // Por ahora vamos a probar sin token para ver qué error obtenemos
    console.log('🔍 Probando sin token (debería dar 401)...');
    
    try {
      const response = await axios.get(endpoint, {
        timeout: 10000
      });
      console.log('✅ Respuesta inesperada:', response.status, response.data);
    } catch (error) {
      if (error.response) {
        console.log(`📊 Status: ${error.response.status}`);
        console.log(`📊 Response:`, JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 401) {
          console.log('✅ Endpoint existe y requiere autenticación (correcto)');
        } else if (error.response.status === 404) {
          console.log('❌ Endpoint no encontrado');
        } else if (error.response.status === 500) {
          console.log('❌ Error interno del servidor');
        }
      } else if (error.request) {
        console.log('❌ No se pudo conectar al servidor');
        console.log('Error:', error.message);
      }
    }
    
    // Ahora probemos con un token de prueba (si existe)
    const testToken = process.env.TEST_TOKEN;
    if (testToken) {
      console.log('\n🔑 Probando con token...');
      try {
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        console.log('✅ Respuesta exitosa con token:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
        
      } catch (error) {
        if (error.response) {
          console.log(`❌ Error con token - Status: ${error.response.status}`);
          console.log('Response:', JSON.stringify(error.response.data, null, 2));
        } else {
          console.log('❌ Error de conexión:', error.message);
        }
      }
    } else {
      console.log('\n💡 Para probar con token, configura TEST_TOKEN en las variables de entorno');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar la prueba
testBackendEndpoint();
