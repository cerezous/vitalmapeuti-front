# 🚀 Instrucciones Finales - VitalMape UTI iOS

## ✅ **Configuración Completada**

### Lo que ya está listo:
- ✅ Capacitor configurado para cargar desde `https://vitalmapeuti.onrender.com`
- ✅ Bundle ID: `com.vitalmape.vitalmapeuti`
- ✅ Biometría nativa implementada (Face ID/Touch ID)
- ✅ Política de 15 minutos en background
- ✅ Safe Area configurado para iPhone 14 Pro Max
- ✅ Info.plist con permisos de biometría

---

## 📱 **Pasos para Probar AHORA**

### 1. Sincronizar cambios (ya hecho)
```bash
cd frontend
npm run cap:sync
```

### 2. Abrir Xcode
```bash
npm run ios:open
```

### 3. En Xcode:
1. **Seleccionar dispositivo:** iPhone 14 Pro Max
2. **Configurar firma:** 
   - Proyecto `App` → Target `App` → "Signing & Capabilities"
   - Marcar ✅ "Automatically manage signing"
   - Seleccionar tu Team
3. **Presionar Play** ▶️

### 4. Probar la biometría:
1. La app carga `https://vitalmapeuti.onrender.com`
2. Haz login normal
3. **Simular background:** `Cmd + Shift + H` (home)
4. **Esperar 15+ minutos** o cambiar reloj del simulador
5. **Volver a la app:** debería pedir Face ID/Touch ID

---

## 🔧 **Configuración de App Store**

### Bundle ID y Team:
- **Bundle ID:** `com.vitalmape.vitalmapeuti` (ya configurado)
- **Team:** Tu cuenta de Apple Developer
- **Signing:** Automático

### Versión:
- **Version:** 1.0.0
- **Build:** 1

### Iconos necesarios:
- **1024x1024 px** (PNG, sin bordes redondeados)
- Subir en App Store Connect o en Xcode Assets

### Screenshots necesarios:
- **iPhone 14 Pro Max:** 1290 x 2796 px
- Mínimo 3 capturas
- Capturar desde simulador: `Cmd + S`

---

## 📝 **Información para App Store Connect**

### Datos de la App:
- **Nombre:** VitalMape UTI
- **Subtítulo:** Gestión de pacientes en UTI
- **Categoría:** Medical
- **Bundle ID:** com.vitalmape.vitalmapeuti

### Descripción sugerida:
```
VitalMape UTI es una aplicación diseñada para la gestión de pacientes en Unidades de Terapia Intensiva.

CARACTERÍSTICAS:
• Registro completo de pacientes en UTI
• Seguimiento de procedimientos médicos
• Estadísticas y métricas en tiempo real
• Interfaz intuitiva y fácil de usar
• Protección biométrica (Face ID/Touch ID)
• Optimizada para iPhone 14 Pro Max

La aplicación facilita el trabajo diario del personal médico, permitiendo un registro rápido y preciso de la información de los pacientes con máxima seguridad.
```

### Palabras clave:
```
uti, hospital, medicina, cuidados intensivos, pacientes, salud, medical
```

### URL de soporte:
- Usa tu dominio: `https://vitalmapeuti.onrender.com` o crea una página de ayuda

---

## 🎯 **Próximos Pasos**

### Para probar:
1. Ejecutar en iPhone 14 Pro Max
2. Verificar que carga tu web
3. Probar login
4. Probar biometría (simular 15+ min en background)

### Para publicar:
1. **Xcode:** Product → Archive
2. **Organizer:** Distribute App → App Store Connect
3. **App Store Connect:** Completar información y subir assets
4. **Enviar para revisión**

---

## 🔍 **Verificaciones Importantes**

### En la app:
- ✅ Carga `https://vitalmapeuti.onrender.com`
- ✅ Login funciona
- ✅ No hay contenido oculto detrás del Dynamic Island
- ✅ Biometría funciona después de 15 min en background
- ✅ Navegación fluida

### En App Store Connect:
- ✅ Bundle ID correcto
- ✅ Icono 1024x1024 subido
- ✅ Screenshots 1290x2796 subidos
- ✅ Descripción completa
- ✅ URL de soporte configurada

---

## 🆘 **Si hay problemas**

### Error de compilación:
```bash
cd frontend/ios/App
pod install
```

### Error de firma:
- Verificar Team en Xcode
- Marcar "Automatically manage signing"

### La app no carga la web:
- Verificar que `https://vitalmapeuti.onrender.com` esté funcionando
- Revisar `capacitor.config.ts`

### Biometría no funciona:
- Verificar que el simulador tenga Face ID configurado
- En simulador: Device → Face ID → Enrolled

---

## 🎉 **¡Listo para publicar!**

Tu app está configurada con:
- ✅ Carga desde servidor de producción
- ✅ Biometría nativa con política de 15 minutos
- ✅ Optimizada para iPhone 14 Pro Max
- ✅ Configuración lista para App Store

**Solo necesitas probar y subir a App Store Connect.**
