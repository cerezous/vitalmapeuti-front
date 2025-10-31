#!/bin/bash
set -e

echo "🔨 Instalando dependencias del frontend..."
cd frontend && npm install

echo "🔨 Construyendo aplicación..."
npm run build

echo "📦 Copiando build a la raíz..."
cd ..
cp -r frontend/build ./build

echo "✅ Build completado exitosamente"

