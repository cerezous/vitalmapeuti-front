# 📱 Pasos en Xcode - Guía Visual Rápida

## ✅ **Xcode ya está abierto** - Ahora sigue estos pasos:

### 1️⃣ **Seleccionar el Dispositivo** (Barra superior de Xcode)

En la parte superior de Xcode, verás una barra que dice algo como:
```
[Play] [Stop] [App] > [iPhone 15 Pro] > [Any iOS Device]
```

**Haz clic** en la parte que dice el dispositivo/simulador.

### 2️⃣ **Elegir iPhone 14 Pro Max**

En el menú desplegable:
- Busca y selecciona **"iPhone 14 Pro Max"** en la lista de simuladores
- Si no aparece, ve a: **Xcode > Settings > Platforms** y descarga iOS Simulator
- O crea uno: **File > New > Project** → No, mejor ve a **Window > Devices and Simulators**

### 3️⃣ **Presionar Play** ▶️

- **Botón Play** en la esquina superior izquierda, o
- Presiona **`Cmd + R`** (atajo de teclado)

### 4️⃣ **Esperar la Compilación**

- Xcode compilará la app (primera vez puede tardar 2-5 minutos)
- Verás el progreso en la barra superior
- Si aparece error de Pods, necesitarás instalar CocoaPods primero

### 5️⃣ **¡La App se Abre!**

- Se abrirá el simulador de iPhone 14 Pro Max
- La app debería ejecutarse automáticamente
- Si no, presiona el ícono de la app en el simulador

---

## 🔴 **Si Aparece un Error:**

### Error: "No such module 'Capacitor'" o problemas con Pods

**Solución:**
```bash
# Cierra Xcode primero, luego en terminal:
cd frontend
./ios/instalar_cocoapods.sh
# O manualmente:
sudo gem install cocoapods
cd ios/App
pod install
```

Luego vuelve a abrir:
```bash
npm run ios:open
```

### Error: "Signing" o "Team"

**Solución en Xcode:**
1. Selecciona el proyecto `App` en el navegador izquierdo
2. Selecciona el target `App`
3. Pestaña **"Signing & Capabilities"**
4. Marca ✅ **"Automatically manage signing"**
5. Selecciona tu **Team** (si no tienes, crea cuenta gratis en developer.apple.com)

### Error: No aparece iPhone 14 Pro Max en la lista

**Solución:**
1. **Xcode > Settings > Platforms**
2. Verifica que iOS está instalado
3. O: **Window > Devices and Simulators**
4. Agrega simuladores si es necesario

---

## ✅ **Checklist Visual en Xcode:**

- [ ] Xcode está abierto con el proyecto
- [ ] En la barra superior se ve "App" como target
- [ ] Se seleccionó "iPhone 14 Pro Max" como dispositivo
- [ ] Presionaste Play ▶️ o `Cmd + R`
- [ ] El simulador se abre
- [ ] La app se ejecuta sin errores

---

## 📸 **Para Probar:**

Una vez que la app esté corriendo:
- ✅ Verifica que se ve bien la pantalla completa
- ✅ No hay contenido oculto detrás del Dynamic Island
- ✅ Los botones funcionan
- ✅ La navegación funciona

---

**¡Eso es todo! Si tienes algún error específico, dímelo y te ayudo a solucionarlo.** 🚀

