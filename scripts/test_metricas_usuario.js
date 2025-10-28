const axios = require('axios');

async function testMetricasUsuario() {
  try {
    console.log('🧪 Probando endpoint de métricas del usuario...');
    
    // URL del endpoint (ajustar según el entorno)
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const endpoint = `${baseUrl}/api/registro-procedimientos/metricas/usuario`;
    
    console.log(`📍 Endpoint: ${endpoint}`);
    
    // Simular token de autenticación (necesitarás un token válido)
    const token = process.env.TEST_TOKEN || 'test-token';
    
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Verificar estructura de datos
    if (response.data && response.data.data) {
      const metricas = response.data.data;
      console.log('\n📊 Métricas recibidas:');
      console.log(`- Total procedimientos: ${metricas.totalProcedimientos}`);
      console.log(`- Tiempo total: ${metricas.tiempoTotal?.texto || 'N/A'}`);
      console.log(`- Total categorizaciones: ${metricas.totalCategorizaciones}`);
      console.log(`- Pacientes atendidos: ${metricas.pacientesAtendidos}`);
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:');
    
    if (error.response) {
      // Error del servidor
      console.error(`Status: ${error.response.status}`);
      console.error(`Status Text: ${error.response.statusText}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n💡 Sugerencia: Verifica que el token de autenticación sea válido');
      } else if (error.response.status === 500) {
        console.log('\n💡 Sugerencia: Revisa los logs del servidor para más detalles');
      }
      
    } else if (error.request) {
      // Error de conexión
      console.error('No se recibió respuesta del servidor');
      console.error('Request:', error.request);
      console.log('\n💡 Sugerencia: Verifica que el backend esté corriendo');
      
    } else {
      // Error de configuración
      console.error('Error de configuración:', error.message);
    }
    
    console.error('\nStack trace:', error.stack);
  }
}

// Ejecutar la prueba
testMetricasUsuario();
