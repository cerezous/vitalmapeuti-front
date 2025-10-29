# VitalMape UTI - Versión iOS

Esta es la versión nativa de iOS de la aplicación VitalMape UTI, creada usando Capacitor.

## 📋 Requisitos Previos

Para compilar y ejecutar la app de iOS, necesitas:

1. **macOS** (requerido para desarrollo iOS)
2. **Xcode** (versión 14.0 o superior)
   - Descargar desde el App Store de macOS
   - Instalar también las Command Line Tools: `xcode-select --install`
3. **CocoaPods** (gestor de dependencias de iOS)
   ```bash
   sudo gem install cocoapods
   ```

## 🚀 Instalación Inicial

### 1. Instalar dependencias de CocoaPods

```bash
cd ios/App
pod install
```

### 2. Sincronizar la web app con iOS

```bash
# Desde la raíz del proyecto frontend
npm run build
npm run cap:sync
```

O más rápido:

```bash
npm run ios:sync
```

## 📱 Desarrollo

### Abrir en Xcode

```bash
npm run ios:open
```

O manualmente:

```bash
open ios/App/App.xcworkspace
```

**⚠️ Importante:** Siempre abre el archivo `.xcworkspace`, NO el `.xcodeproj`

### Compilar y ejecutar

1. Abre Xcode con `npm run ios:open`
2. Selecciona un simulador o dispositivo iOS conectado
3. Presiona `Cmd + R` o haz clic en el botón "Run"

### Cambiar Bundle ID y Team

1. En Xcode, selecciona el proyecto `App` en el navegador
2. Ve a la pestaña "Signing & Capabilities"
3. Cambia el **Bundle Identifier** a uno único (ej: `com.tuempresa.vitalmapeuti`)
4. Selecciona tu **Team** de desarrollador de Apple

## 🔄 Actualizar la App

Cuando hagas cambios en el código React:

```bash
# 1. Reconstruir la web app
npm run build

# 2. Sincronizar con iOS
npm run cap:sync

# 3. Abrir Xcode y volver a compilar
npm run ios:open
```

O todo en uno:

```bash
npm run ios:build
```

## 📦 Configuración de la App

### Información de la App

Edita `ios/App/App/Info.plist` para cambiar:
- Nombre de la app
- Versión
- Permisos necesarios

### Capacitor Config

El archivo `capacitor.config.ts` en la raíz contiene la configuración principal.

### Iconos y Splash Screen

- **Iconos:** `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- **Splash:** `ios/App/App/Assets.xcassets/Splash.imageset/`

Para generar iconos automáticamente, puedes usar herramientas como:
- [AppIcon.co](https://www.appicon.co/)
- [IconKitchen](https://icon.kitchen/)

## 🎯 Despliegue a App Store

### 1. Configurar certificados y perfiles

1. Ve a [Apple Developer Portal](https://developer.apple.com/)
2. Crea un **App ID** para tu app
3. Crea certificados de desarrollo y distribución
4. Crea perfiles de aprovisionamiento

### 2. Configurar en Xcode

1. Abre el proyecto en Xcode
2. Ve a "Signing & Capabilities"
3. Selecciona tus certificados y perfiles
4. Configura "Automatically manage signing" si lo prefieres

### 3. Archivar la app

1. En Xcode: **Product > Archive**
2. Espera a que termine el proceso de archivo
3. Se abrirá el **Organizer**

### 4. Subir a App Store Connect

1. En Organizer, selecciona tu archivo
2. Haz clic en **"Distribute App"**
3. Selecciona **"App Store Connect"**
4. Sigue el asistente para subir

### 5. Configurar en App Store Connect

1. Ve a [App Store Connect](https://appstoreconnect.apple.com/)
2. Crea una nueva app si es necesario
3. Completa la información de la app
4. Sube las capturas de pantalla y descripción
5. Envía para revisión

## 🔧 Solución de Problemas

### CocoaPods no funciona

```bash
sudo gem install cocoapods
pod repo update
cd ios/App
pod install
```

### Errores de build

1. Limpia el build: **Product > Clean Build Folder** (Cmd + Shift + K)
2. Elimina DerivedData: 
   - Xcode > Preferences > Locations > DerivedData
   - Elimina la carpeta correspondiente
3. Reinstala pods:
   ```bash
   cd ios/App
   rm -rf Pods Podfile.lock
   pod install
   ```

### La app no se actualiza

```bash
npm run build
npm run cap:sync
```

Luego vuelve a compilar en Xcode.

## 📝 Notas Importantes

- **Siempre** usa `App.xcworkspace`, no `App.xcodeproj`
- Los cambios en el código React requieren `npm run build` antes de sincronizar
- Capacitor sincroniza automáticamente los archivos de `build/` a iOS
- El Bundle ID debe ser único en tu cuenta de Apple Developer

## 🔗 Enlaces Útiles

- [Documentación de Capacitor](https://capacitorjs.com/docs)
- [Guía de Xcode](https://developer.apple.com/xcode/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Apple Developer Portal](https://developer.apple.com/account/)

