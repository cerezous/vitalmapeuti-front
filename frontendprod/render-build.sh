#!/bin/bash
set -e

echo "🔨 Instalando dependencias..."
npm install

echo "🔨 Construyendo aplicación..."
npm run build

echo "✅ Build completado exitosamente"

