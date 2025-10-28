#!/bin/bash

echo "🚀 DESPLIEGUE MANUAL DE CAMBIOS"
echo "================================"
echo ""

# Verificar que el build existe
if [ ! -d "frontend/build" ]; then
    echo "❌ Error: No existe el directorio build/"
    echo "Ejecuta primero: cd frontend && npm run build"
    exit 1
fi

echo "✅ Build encontrado en frontend/build/"
echo ""

echo "📋 OPCIONES DE DESPLIEGUE:"
echo ""
echo "1️⃣ VERCEL (Recomendado):"
echo "   - Ve a https://vercel.com/dashboard"
echo "   - Haz clic en 'New Project'"
echo "   - Arrastra la carpeta 'frontend/build'"
echo "   - O conecta con GitHub si creas el repo"
echo ""
echo "2️⃣ NETLIFY:"
echo "   - Ve a https://app.netlify.com/drop"
echo "   - Arrastra la carpeta 'frontend/build'"
echo ""
echo "3️⃣ CREAR REPOSITORIO GITHUB:"
echo "   - Ve a https://github.com/new"
echo "   - Nombre: vitalmapeuti"
echo "   - Público, sin README"
echo "   - Luego ejecuta:"
echo "     git push -u origin main"
echo ""

echo "📁 Archivos listos para deploy:"
ls -la frontend/build/ | head -10
echo "..."

echo ""
echo "💡 Los cambios incluyen:"
echo "   - Nuevo logo (logodefinitivo4.png)"
echo "   - Actualización del Login.tsx"
echo "   - Cambios en index.html"
echo ""
echo "🎯 Una vez desplegado, los cambios se verán inmediatamente"
