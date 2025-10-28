const axios = require('axios');

// Configuración
const API_URL = 'https://vitalmapeuti-back.onrender.com';

async function testMetricasUsuarioTest() {
  try {
    console.log('🧪 Probando endpoint de prueba sin autenticación...');
    console.log(`URL: ${API_URL}/api/registro-procedimientos/metricas/usuario-test`);
    
    const response = await axios.get(
      `${API_URL}/api/registro-procedimientos/metricas/usuario-test`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error en la prueba:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Ejecutar prueba
testMetricasUsuarioTest();
