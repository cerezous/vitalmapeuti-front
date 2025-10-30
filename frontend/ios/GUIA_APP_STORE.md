# Guía para Publicar en App Store - VitalMape UTI

## 📱 Configuración Previa para iPhone 14 Pro Max

Esta app está configurada específicamente para:
- ✅ iPhone 14 Pro Max (pantalla 6.7" con Dynamic Island)
- ✅ Safe Area support para pantallas con notch/island
- ✅ Soporte para iOS 15.0 y superior
- ✅ Orientación portrait y landscape
- ✅ Responsive design adaptado al ecosistema Apple

## 🚀 Pasos para Publicar en App Store

### 1. Preparar el Proyecto en Xcode

#### a. Abrir el proyecto
```bash
cd frontend
npm run ios:open
```

#### b. Configurar Bundle Identifier
1. Selecciona el proyecto `App` en el navegador izquierdo
2. Selecciona el target `App`
3. Ve a la pestaña **"Signing & Capabilities"**
4. Cambia el **Bundle Identifier** a algo único:
   - Ejemplo: `com.vitalmape.uti` o `com.tuempresa.vitalmapeuti`
   - Debe ser único y no estar usado en App Store

#### c. Configurar Team y Certificados
1. En "Signing & Capabilities", selecciona tu **Team** de Apple Developer
2. Si no tienes cuenta, créala en: https://developer.apple.com/account/
3. Marca **"Automatically manage signing"** (Xcode gestionará los certificados)

#### d. Verificar Configuración del Dispositivo
1. En el selector de dispositivo, verifica que aparece "iPhone 14 Pro Max"
2. Si no, Xcode lo descargará automáticamente al seleccionarlo

### 2. Configurar Version y Build Number

1. Selecciona el target `App` en Xcode
2. Ve a la pestaña **"General"**
3. Configura:
   - **Version:** 1.0.0 (o la versión que prefieras)
   - **Build:** 1 (incrementa esto con cada actualización)

Estos valores también están en `Info.plist` y se pueden editar ahí.

### 3. Crear Iconos de la App

#### Requisitos de App Store:
- Icono principal: 1024x1024 px (sin bordes redondeados, iOS los aplicará)
- Formatos: PNG o JPG (recomendado PNG)

#### Pasos:
1. Prepara tu icono en 1024x1024 px
2. En Xcode, ve a `App > Assets.xcassets > AppIcon`
3. Arrastra el icono a la casilla de 1024x1024
4. O usa herramientas como:
   - [AppIcon.co](https://www.appicon.co/)
   - [IconKitchen](https://icon.kitchen/)

### 4. Configurar Screenshots para App Store

Para iPhone 14 Pro Max necesitas:
- Screenshots de 6.7" (1290 x 2796 px) - Requerido
- Opcional: Screenshots de otros tamaños

**Pasos para capturar:**
1. Ejecuta la app en simulador de iPhone 14 Pro Max
2. Ve a **Device > Screenshot** en el menú del simulador
3. O presiona `Cmd + S` con el simulador seleccionado
4. Las capturas se guardan en el escritorio

### 5. Probar la App

#### En Simulador:
```bash
npm run ios:open
# En Xcode, selecciona iPhone 14 Pro Max y presiona Run
```

#### En Dispositivo Real (Recomendado):
1. Conecta tu iPhone 14 Pro Max al Mac
2. En Xcode, selecciona tu dispositivo
3. Si aparece error de confianza:
   - Ve a iPhone: Settings > General > VPN & Device Management
   - Confía en tu perfil de desarrollador
4. Presiona Run

**Verificaciones importantes:**
- ✅ La app se ve bien en la pantalla completa
- ✅ No hay contenido oculto detrás del Dynamic Island
- ✅ Los botones son fáciles de tocar
- ✅ El teclado no tapa los campos de entrada
- ✅ La navegación funciona correctamente

### 6. Preparar para Archive

#### a. Cambiar a Release Build
1. En Xcode, arriba del proyecto, cambia de "Debug" a "Release"
2. O selecciona: **Product > Scheme > Edit Scheme > Run > Build Configuration = Release**

#### b. Limpiar el Build
1. **Product > Clean Build Folder** (Cmd + Shift + K)
2. Esto asegura un build limpio

#### c. Seleccionar "Any iOS Device" o tu dispositivo
- En el selector de dispositivo, selecciona "Any iOS Device" o tu iPhone real
- No uses simulador para archivar

### 7. Crear Archive

1. **Product > Archive**
2. Esto puede tomar varios minutos
3. Cuando termine, se abrirá el **Organizer**

### 8. Validar y Subir a App Store Connect

#### a. Validar
1. En Organizer, selecciona tu Archive
2. Haz clic en **"Validate App"**
3. Selecciona **"Automatically manage signing"**
4. Sigue el asistente
5. Si hay errores, corrígelos y vuelve a archivar

#### b. Subir
1. En Organizer, haz clic en **"Distribute App"**
2. Selecciona **"App Store Connect"**
3. Selecciona **"Upload"**
4. Selecciona **"Automatically manage signing"**
5. Revisa el resumen y haz clic en **"Upload"**
6. Espera a que termine (puede tomar varios minutos)

### 9. Configurar en App Store Connect

#### a. Acceder
Ve a: https://appstoreconnect.apple.com/

#### b. Crear Nueva App (si es la primera vez)
1. **My Apps > + (nuevo)**
2. Plataforma: iOS
3. Nombre: VitalMape UTI (o el que prefieras)
4. Idioma principal: Español
5. Bundle ID: Selecciona el que configuraste en Xcode
6. SKU: Puede ser el mismo que Bundle ID

#### c. Completar Información de la App

**1. Información de la App:**
- Nombre: VitalMape UTI
- Subtítulo: (opcional) Máximo 30 caracteres
- Categoría principal: Medical o Health & Fitness
- Categoría secundaria: (opcional)
- Contenido de terceros: Según tu caso

**2. Precio y Disponibilidad:**
- Selecciona precio o "Gratis"
- Disponibilidad: Países donde se venderá

**3. Preparación para Envío:**
Este apartado se activa cuando subes el primer build.

**Descripción (requerido):**
```
VitalMape UTI es una aplicación diseñada para la gestión de pacientes en Unidades de Terapia Intensiva. 

CARACTERÍSTICAS:
• Registro completo de pacientes en UTI
• Seguimiento de procedimientos médicos
• Estadísticas y métricas en tiempo real
• Interfaz intuitiva y fácil de usar
• Optimizada para iPhone 14 Pro Max

La aplicación facilita el trabajo diario del personal médico, permitiendo un registro rápido y preciso de la información de los pacientes.
```

**Palabras clave:** (máximo 100 caracteres)
```
uti, hospital, medicina, cuidados intensivos, pacientes
```

**URL de Soporte:** (requerido)
- URL de tu sitio web o página de ayuda

**URL de Marketing:** (opcional)
- URL de marketing de la app

**4. Capturas de pantalla:**
- Sube al menos 3 capturas de 6.7" (1290 x 2796 px)
- Máximo 10 capturas
- Puedes añadir capturas de otros tamaños (opcional pero recomendado)

**5. Icono de la App:**
- 1024x1024 px
- PNG o JPG

**6. Información de Revisión:**
- Datos de contacto: Tu nombre y email
- Información de cuenta: (si la app requiere login)
- Notas para revisión: Información adicional para los revisores

**7. Versión (Build):**
- Selecciona el build que subiste
- Puede tardar algunas horas en aparecer después de subirlo

### 10. Enviar para Revisión

1. Una vez completada toda la información
2. Verifica que todo esté correcto
3. Haz clic en **"Enviar para revisión"**
4. Revisión típicamente toma 24-48 horas

### 11. Monitorear el Estado

En App Store Connect puedes ver:
- ⏳ En espera de revisión
- 🔍 En revisión
- ✅ Aprobada
- ❌ Rechazada (con explicación)

## 🔧 Configuración Específica para iPhone 14 Pro Max

### Safe Area
La app ya está configurada para usar Safe Area en:
- `index.css`: Soporte para `env(safe-area-inset-*)`
- `Info.plist`: Configuración de UI
- `capacitor.config.ts`: Configuración de Capacitor

### Orientaciones Soportadas
- Portrait: ✅
- Landscape Left: ✅
- Landscape Right: ✅

### Optimizaciones Implementadas
- ✅ Viewport configurado para `viewport-fit=cover`
- ✅ Soporte para Dynamic Island (no oculta contenido)
- ✅ Teclado virtual no tapa campos de entrada
- ✅ Scroll suave con `-webkit-overflow-scrolling: touch`
- ✅ Tap highlight deshabilitado para mejor UX

## ⚠️ Problemas Comunes y Soluciones

### El build falla con "Code signing"
- Verifica que tu Team esté seleccionado en Xcode
- Asegúrate de tener certificados válidos en Apple Developer
- Usa "Automatically manage signing"

### La app se ve mal en iPhone 14 Pro Max
- Verifica que hayas hecho `npm run build` antes de sincronizar
- Asegúrate de que `index.css` tiene las reglas de Safe Area
- Limpia el build y vuelve a compilar

### Los archivos no se sincronizan
```bash
npm run build
npm run cap:sync
```

### App Store Connect no muestra el build
- Puede tardar 1-2 horas después de subir
- Verifica que el build sea válido en Xcode Organizer
- Asegúrate de que el Bundle ID coincida

## 📝 Checklist Final Antes de Enviar

- [ ] App probada en iPhone 14 Pro Max (simulador y/o dispositivo real)
- [ ] Bundle ID único configurado
- [ ] Versión y Build Number correctos
- [ ] Icono de 1024x1024 px subido
- [ ] Al menos 3 capturas de pantalla de 6.7"
- [ ] Descripción completa en App Store Connect
- [ ] URL de soporte configurada
- [ ] Build archivado y validado
- [ ] Build subido a App Store Connect
- [ ] Toda la información completada en App Store Connect
- [ ] Revisado que no hay contenido oculto detrás del Dynamic Island

## 🎉 ¡Listo!

Una vez enviada, Apple revisará tu app típicamente en 24-48 horas. Recibirás notificaciones por email sobre el estado de la revisión.

