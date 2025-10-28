#!/bin/bash

echo "🚀 PROBANDO APLICACIÓN VITALMAPE UTI EN PRODUCCIÓN"
echo "================================================="

# Verificar que el backend esté corriendo
echo "📡 Verificando backend en producción..."
BACKEND_RESPONSE=$(curl -s https://vitalmapeuti-back.onrender.com/api/health)
if [[ $BACKEND_RESPONSE == *"OK"* ]]; then
    echo "✅ Backend funcionando correctamente en producción"
else
    echo "❌ Backend no responde en producción"
    exit 1
fi

# Verificar que el frontend esté corriendo
echo "🌐 Verificando frontend en producción..."
FRONTEND_RESPONSE=$(curl -s https://vitalmapeuti.onrender.com | head -1)
if [[ $FRONTEND_RESPONSE == *"<!doctype html>"* ]]; then
    echo "✅ Frontend funcionando correctamente en producción"
else
    echo "❌ Frontend no responde en producción"
    exit 1
fi

# Probar login con usuario existente
echo "🔐 Probando login en producción..."
LOGIN_RESPONSE=$(curl -s -X POST https://vitalmapeuti-back.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"usuario":"mcerezo","contraseña":"shualabn"}')

if [[ $LOGIN_RESPONSE == *"token"* ]]; then
    echo "✅ Login funcionando correctamente en producción"
    echo "👤 Usuario: mcerezo"
    echo "🔑 Token recibido"
else
    echo "❌ Login falló en producción"
    echo "Respuesta: $LOGIN_RESPONSE"
fi

echo ""
echo "🎉 APLICACIÓN EN PRODUCCIÓN LISTA PARA USAR"
echo "==========================================="
echo "Frontend: https://vitalmapeuti.onrender.com"
echo "Backend: https://vitalmapeuti-back.onrender.com"
echo "Usuario de prueba: mcerezo / shualabn"
echo ""
echo "Para usar la aplicación:"
echo "1. Abre https://vitalmapeuti.onrender.com en tu navegador"
echo "2. Haz login con usuario: mcerezo, contraseña: shualabn"
echo "3. ¡Disfruta usando VitalMape UTI en producción!"
