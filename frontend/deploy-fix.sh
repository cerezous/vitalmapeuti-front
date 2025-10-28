#!/bin/bash

echo "🚀 DESPLEGANDO CAMBIOS AL BACKEND EN RENDER"
echo "=========================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "backend/app.js" ]; then
    echo "❌ Error: No se encuentra backend/app.js"
    echo "Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

echo "📁 Archivos modificados:"
echo "- backend/app.js (timeout y manejo de errores de correo)"
echo "- backend/config/email.js (timeouts optimizados)"
echo "- frontend/src/services/api.ts (timeout aumentado)"

echo ""
echo "📋 Para desplegar estos cambios:"
echo "1. Ve a https://dashboard.render.com"
echo "2. Selecciona el servicio 'vitalmapeuti-back'"
echo "3. Ve a la pestaña 'Manual Deploy'"
echo "4. Haz clic en 'Deploy latest commit'"
echo ""
echo "O si tienes acceso al repositorio:"
echo "1. Sube los cambios a GitHub"
echo "2. Render se desplegará automáticamente"
echo ""
echo "⏱️ Los cambios optimizarán:"
echo "- Timeout del frontend: 30 segundos"
echo "- Timeout del correo: 10 segundos"
echo "- Reintentos reducidos: 2 en lugar de 3"
echo "- Tiempo entre reintentos: 2 segundos"
echo ""
echo "✅ Después del despliegue, el registro debería funcionar sin timeouts"
