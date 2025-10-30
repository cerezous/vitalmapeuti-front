#!/bin/bash

echo "🔧 Instalando CocoaPods..."
echo ""
echo "ℹ️  Esto instalará CocoaPods en tu Mac."
echo "ℹ️  Necesitarás tu contraseña de administrador."
echo "ℹ️  NO necesitas crear ninguna cuenta."
echo ""

# Verificar si gem está disponible
if ! command -v gem &> /dev/null; then
    echo "❌ Error: RubyGems no está instalado."
    echo "   Instala Xcode Command Line Tools:"
    echo "   xcode-select --install"
    exit 1
fi

# Instalar CocoaPods
echo "📦 Instalando CocoaPods (esto puede tomar unos minutos)..."
sudo gem install cocoapods

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CocoaPods instalado correctamente!"
    echo ""
    echo "📦 Instalando dependencias del proyecto..."
    cd "$(dirname "$0")/App"
    pod install
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ ¡Todo listo! Puedes abrir Xcode ahora."
    else
        echo ""
        echo "⚠️  Error instalando los Pods. Intenta manualmente:"
        echo "   cd ios/App"
        echo "   pod install"
    fi
else
    echo ""
    echo "❌ Error instalando CocoaPods."
    echo "   Intenta manualmente: sudo gem install cocoapods"
fi

