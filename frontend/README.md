# VitalMape Frontend

Frontend React para el Sistema de Gestión de UTI VitalMape.

## Descripción

Este es el frontend del sistema VitalMape, una aplicación web moderna para la gestión de pacientes en Unidades de Terapia Intensiva (UTI). Proporciona una interfaz intuitiva y responsive para el manejo de pacientes, procedimientos médicos y estadísticas.

## Características

- **React 19** con TypeScript
- **Tailwind CSS** para estilos modernos y responsive
- **Axios** para comunicación con la API
- **React Router** para navegación
- **Recharts** para gráficos y estadísticas
- **Autenticación JWT** integrada
- **Diseño responsive** para móviles y desktop

## Tecnologías

- React 19.x
- TypeScript 4.x
- Tailwind CSS 3.x
- Axios para HTTP requests
- React Router DOM 7.x
- Recharts para gráficos

## Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd vitalmape-frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp env.example .env
```

4. Edita el archivo `.env` con la URL de tu backend:
```env
REACT_APP_API_URL=https://tu-backend.railway.app/api
```

5. Inicia el servidor de desarrollo:
```bash
npm start
```

## Scripts disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm test` - Ejecuta las pruebas
- `npm run eject` - Expone la configuración de Create React App

## Estructura del proyecto

```
frontend/
├── public/           # Archivos públicos (HTML, imágenes, etc.)
├── src/
│   ├── components/  # Componentes React reutilizables
│   ├── services/     # Servicios para comunicación con API
│   ├── contexts/     # Contextos de React (Auth, etc.)
│   ├── App.tsx       # Componente principal
│   └── index.tsx     # Punto de entrada
├── package.json      # Dependencias y scripts
└── tailwind.config.js # Configuración de Tailwind
```

## Configuración del Backend

El frontend necesita conectarse a un backend API. Asegúrate de que:

1. El backend esté desplegado y funcionando
2. La variable `REACT_APP_API_URL` apunte a la URL correcta del backend
3. El backend tenga CORS configurado para permitir requests desde el frontend

### URLs de ejemplo:
- **Desarrollo local**: `http://localhost:3001/api`
- **Producción Railway**: `https://tu-backend.railway.app/api`

## Despliegue

### Vercel (Recomendado para frontend)
1. Conecta tu repositorio a Vercel
2. Configura la variable de entorno `REACT_APP_API_URL`
3. Vercel detectará automáticamente que es una aplicación React

### Railway
1. Conecta tu repositorio a Railway
2. Configura la variable de entorno `REACT_APP_API_URL`
3. Railway construirá y desplegará automáticamente

### Variables de entorno requeridas:
- `REACT_APP_API_URL` - URL del backend API

## Características de la UI

- **Diseño flat** sin gradientes ni bordes (según preferencias del usuario)
- **Colores planos** para una apariencia moderna
- **Responsive design** que funciona en móviles y desktop
- **Navegación intuitiva** con menús organizados
- **Formularios accesibles** con validación
- **Gráficos interactivos** para estadísticas

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

ISC - Ver archivo LICENSE para más detalles.

## Autor

Matías Cerezo Prado - mcerezopr@gmail.com
