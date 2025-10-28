#!/bin/bash

echo "🚀 PROBANDO APLICACIÓN VITALMAPE UTI"
echo "=================================="

# Verificar que el backend esté corriendo
echo "📡 Verificando backend..."
BACKEND_RESPONSE=$(curl -s http://localhost:3001/api/health)
if [[ $BACKEND_RESPONSE == *"OK"* ]]; then
    echo "✅ Backend funcionando correctamente"
else
    echo "❌ Backend no responde"
    exit 1
fi

# Verificar que el frontend esté corriendo
echo "🌐 Verificando frontend..."
FRONTEND_RESPONSE=$(curl -s http://localhost:3000 | head -1)
if [[ $FRONTEND_RESPONSE == *"<!DOCTYPE html>"* ]]; then
    echo "✅ Frontend funcionando correctamente"
else
    echo "❌ Frontend no responde"
    exit 1
fi

# Probar login
echo "🔐 Probando login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"usuario":"etest","contraseña":"123456"}')

if [[ $LOGIN_RESPONSE == *"token"* ]]; then
    echo "✅ Login funcionando correctamente"
    echo "👤 Usuario: etest"
    echo "🔑 Token recibido"
else
    echo "❌ Login falló"
    echo "Respuesta: $LOGIN_RESPONSE"
fi

echo ""
echo "🎉 APLICACIÓN LISTA PARA USAR"
echo "=============================="
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "Usuario de prueba: etest / 123456"
echo ""
echo "Para usar la aplicación:"
echo "1. Abre http://localhost:3000 en tu navegador"
echo "2. Haz login con usuario: etest, contraseña: 123456"
echo "3. ¡Disfruta usando VitalMape UTI!"
