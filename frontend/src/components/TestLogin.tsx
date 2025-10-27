import React, { useState } from 'react';
import axios from 'axios';

const TestLogin: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Probando login...');
    
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        usuario: 'admin',
        contraseña: 'admin123'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setResult(`✅ Login exitoso! Token: ${response.data.token ? 'Recibido' : 'No recibido'}`);
    } catch (error: any) {
      setResult(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Test de Login</h1>
        
        <div className="space-y-4">
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
          >
            {loading ? 'Probando...' : 'Probar Login'}
          </button>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Resultado:</h3>
            <p className="text-sm">{result}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestLogin;
