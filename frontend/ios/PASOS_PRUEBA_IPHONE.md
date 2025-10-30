# Pasos para Probar en iPhone 14 Pro Max

## 🔧 Preparación Inicial

### 1. Construir la App
```bash
cd frontend
npm run build
```

### 2. Sincronizar con iOS
```bash
npm run cap:sync
```

### 3. Instalar Dependencias de CocoaPods (si es primera vez)
```bash
cd ios/App
pod install
cd ../..
```

## 📱 Probar en Simulador de iPhone 14 Pro Max

### Opción 1: Desde Terminal
```bash
npm run ios:open
```

Luego en Xcode:
1. Selecciona "iPhone 14 Pro Max" del selector de dispositivos (arriba del editor)
2. Presiona `Cmd + R` o el botón Play ▶️

### Opción 2: Desde Xcode Directamente
```bash
open ios/App/App.xcworkspace
```

En Xcode:
1. Ve a la barra superior donde dice el dispositivo/simulador
2. Haz clic y selecciona "iPhone 14 Pro Max"
3. Si no aparece, ve a: **Xcode > Settings > Platforms** y descarga iOS
4. Presiona `Cmd + R`

## 📲 Probar en iPhone 14 Pro Max Real

### 1. Conectar el iPhone
- Conecta tu iPhone 14 Pro Max al Mac con cable USB
- Desbloquea el iPhone
- Si aparece diálogo "¿Confiar en esta computadora?", selecciona "Confiar"

### 2. Configurar Certificado en Xcode
1. Abre el proyecto: `npm run ios:open`
2. Selecciona el proyecto `App` en el navegador izquierdo
3. Selecciona el target `App`
4. Ve a **"Signing & Capabilities"**
5. En "Team", selecciona tu cuenta de Apple Developer
   - Si no tienes, crea una gratis en: https://developer.apple.com/account/
   - Para desarrollo básico, la cuenta gratis funciona por 7 días

### 3. Seleccionar Dispositivo
1. En el selector de dispositivos (arriba), selecciona tu iPhone
2. Puede aparecer como: "iPhone de [Tu Nombre]"

### 4. Ejecutar
1. Presiona `Cmd + R` o el botón Play ▶️
2. Si aparece error de confianza en el iPhone:
   - Ve a: **Settings > General > VPN & Device Management**
   - Selecciona tu perfil de desarrollador
   - Toca "Trust"

### 5. Verificar
- ✅ La app debe abrirse en tu iPhone
- ✅ Verifica que el contenido no quede oculto detrás del Dynamic Island
- ✅ Prueba el scroll y la navegación
- ✅ Verifica que los botones respondan bien al tacto

## 🔍 Verificaciones Específicas para iPhone 14 Pro Max

### Safe Area (Área Segura)
✅ Verifica que:
- No hay contenido oculto detrás del Dynamic Island (parte superior)
- No hay contenido oculto detrás del Home Indicator (parte inferior)
- Los botones de navegación son accesibles
- Los campos de entrada no quedan tapados por el teclado

### Pantalla Completa
✅ Verifica:
- La app ocupa toda la pantalla (1290 x 2796 px)
- El fondo se extiende correctamente
- No hay barras negras en los bordes

### Interacciones
✅ Prueba:
- Scroll vertical y horizontal si aplica
- Toques en botones y enlaces
- Apertura de modales y dropdowns
- Inputs de texto (el teclado no debe tapar campos)

### Orientación (si aplica)
✅ Prueba:
- Portrait (vertical) - Principal
- Landscape (horizontal) - Si es necesario

## 🐛 Solución de Problemas

### "No such module 'Capacitor'"
```bash
cd ios/App
pod install
cd ../..
```

### La app no aparece en el selector de dispositivos
1. Asegúrate de que el iPhone esté desbloqueado
2. Confía en la computadora en el iPhone
3. Verifica que el cable USB funcione bien
4. Intenta desconectar y volver a conectar

### Error de certificado
1. En Xcode, ve a **Signing & Capabilities**
2. Selecciona un Team diferente o crea uno nuevo
3. Marca "Automatically manage signing"

### La app se ve mal o desalineada
1. Asegúrate de haber hecho `npm run build` antes de `npm run cap:sync`
2. Verifica que `index.css` tenga las reglas de Safe Area
3. Limpia el build: En Xcode, **Product > Clean Build Folder** (`Cmd + Shift + K`)
4. Reconstruye: `npm run build && npm run cap:sync`

### Los cambios no se reflejan
Cada vez que cambias código React:
```bash
npm run build
npm run cap:sync
```

Luego vuelve a ejecutar en Xcode o en el dispositivo.

## 📸 Capturar Screenshots para App Store

Mientras pruebas en iPhone 14 Pro Max:

1. Ejecuta la app en el simulador o dispositivo
2. Navega a las pantallas más representativas
3. Captura:
   - **En Simulador:** `Cmd + S` o **Device > Screenshot**
   - **En Dispositivo:** Presiona Volumen Arriba + Botón Lateral
4. Necesitas capturas de **1290 x 2796 px** para App Store

## ✅ Checklist de Pruebas

- [ ] App se ejecuta sin errores
- [ ] Contenido visible completo (no oculto por Dynamic Island)
- [ ] Navegación funciona correctamente
- [ ] Botones y enlaces responden al tacto
- [ ] Inputs de texto funcionan (teclado no tapa campos)
- [ ] Scroll funciona suavemente
- [ ] Modales y popups se muestran correctamente
- [ ] La app se ve bien en portrait
- [ ] (Opcional) La app se ve bien en landscape si aplica
- [ ] No hay errores en consola de Xcode
- [ ] Performance es aceptable (sin lag)

## 🎯 Siguiente Paso

Una vez que todo funciona correctamente en iPhone 14 Pro Max, puedes proceder con la publicación en App Store siguiendo la guía en `GUIA_APP_STORE.md`.

