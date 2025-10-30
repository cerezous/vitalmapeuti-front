# 📋 Resumen: ¿Qué Hacer en Terminal vs Xcode?

## ✅ **LO QUE HACES EN TERMINAL** (No necesitas hacer nada manual en Xcode)

### 1️⃣ Preparación Inicial (Una vez)
```bash
cd frontend
npm run build          # Construye la app web
npm run cap:sync       # Sincroniza con iOS
cd ios/App
pod install            # Instala dependencias (solo primera vez)
cd ../..
```

### 2️⃣ Cada vez que cambias código React
```bash
cd frontend
npm run build          # Reconstruye
npm run cap:sync       # Sincroniza cambios
```

### 3️⃣ Abrir Xcode (para probar o publicar)
```bash
npm run ios:open
# O simplemente:
cd frontend
open ios/App/App.xcworkspace
```

---

## 🍎 **LO QUE HACES EN XCODE** (Solo cuando pruebas o publicas)

### Para PROBAR la app:

1. **Abrir proyecto** (ya está hecho con `npm run ios:open`)
2. **Seleccionar dispositivo:**
   - En la barra superior de Xcode, haz clic donde dice el dispositivo
   - Elige "iPhone 14 Pro Max" (simulador) o tu iPhone real
3. **Presionar Play ▶️** o `Cmd + R`
4. **¡Listo!** La app se ejecuta

### Para PUBLICAR en App Store:

Solo necesitas entrar a Xcode para configurar estas 3 cosas:

#### 1. **Bundle ID y Certificados** (5 minutos)
- En Xcode: Selecciona proyecto `App` → Target `App` → Pestaña **"Signing & Capabilities"**
- Cambia **Bundle Identifier** (ej: `com.vitalmape.uti`)
- Selecciona tu **Team** (cuenta de Apple Developer)
- Marca ✅ **"Automatically manage signing"**

#### 2. **Versión** (1 minuto)
- En Xcode: Target `App` → Pestaña **"General"**
- Cambia **Version:** a `1.0.0`
- Cambia **Build:** a `1`

#### 3. **Crear Archive y Subir** (10 minutos)
- **Product → Archive** (Xcode crea el archivo para App Store)
- Cuando termine, en la ventana que aparece:
  - Clic en **"Distribute App"**
  - Selecciona **"App Store Connect"**
  - Sigue el asistente (Xcode hace todo automático)

---

## 📸 **Iconos y Screenshots** (Opcional usar herramientas web)

### Iconos:
- Puedes subirlos directamente en **App Store Connect** (no necesitas Xcode)
- O en Xcode: `App > Assets.xcassets > AppIcon` (arrastrar icono 1024x1024px)

### Screenshots:
- Capturas desde el simulador (en Xcode: `Cmd + S`)
- O desde tu iPhone directamente (botones de volumen)
- Se suben directamente en **App Store Connect** (no en Xcode)

---

## 🎯 **Flujo Completo Simplificado**

### Primera vez:
```bash
# 1. Terminal: Preparar
cd frontend
npm run build
npm run cap:sync
cd ios/App && pod install && cd ../..

# 2. Terminal: Abrir Xcode
npm run ios:open

# 3. Xcode: Configurar Bundle ID (una vez)
# 4. Xcode: Seleccionar iPhone 14 Pro Max
# 5. Xcode: Presionar Play ▶️
```

### Cada actualización:
```bash
# Terminal: Reconstruir
cd frontend
npm run build
npm run cap:sync

# Xcode: Solo presionar Play ▶️ de nuevo
```

### Para publicar:
```bash
# Terminal: Última construcción
cd frontend
npm run build
npm run cap:sync

# Xcode: 
# 1. Product → Archive
# 2. Distribute App → App Store Connect
# 3. Siguiente, siguiente, siguiente... ✅
```

---

## 💡 **Respuesta Directa a tu Pregunta**

**¿Tienes que hacer todo en Xcode?**

**NO**, solo necesitas Xcode para:
- ✅ Probar la app (seleccionar dispositivo y presionar Play)
- ✅ Configurar Bundle ID y Team (una vez, 5 minutos)
- ✅ Crear Archive y subir a App Store (10 minutos)

**Todo lo demás se hace en Terminal:**
- ✅ Construir la app (`npm run build`)
- ✅ Sincronizar (`npm run cap:sync`)
- ✅ Abrir Xcode (`npm run ios:open`)

---

## 🚀 **Comandos Rápidos que Necesitas Recordar**

```bash
# Construir y sincronizar
cd frontend && npm run build && npm run cap:sync

# Abrir Xcode
npm run ios:open

# Todo en uno (build + sync + open)
npm run ios:build
```

---

## 📝 **Checklist Simple**

### Terminal:
- [ ] `npm run build` - Construir app
- [ ] `npm run cap:sync` - Sincronizar con iOS
- [ ] `npm run ios:open` - Abrir Xcode

### Xcode (primera vez):
- [ ] Configurar Bundle ID (Signing & Capabilities)
- [ ] Seleccionar Team
- [ ] Seleccionar iPhone 14 Pro Max
- [ ] Presionar Play ▶️

### Xcode (para publicar):
- [ ] Product → Archive
- [ ] Distribute App → App Store Connect
- [ ] Seguir asistente

### App Store Connect (web):
- [ ] Crear app en https://appstoreconnect.apple.com
- [ ] Subir iconos y screenshots
- [ ] Completar descripción
- [ ] Enviar para revisión

---

**En resumen:** La mayor parte se hace en Terminal automáticamente. Xcode solo lo usas para probar y para los pasos finales de publicación. 🎉

