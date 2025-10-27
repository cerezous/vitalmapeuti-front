# 🏥 VitalMape UTI - Sistema de Gestión Hospitalaria

Sistema completo de gestión para Unidad de Terapia Intensiva (UTI) desarrollado con React y Node.js.

## 📋 Características

- **Gestión de Pacientes**: Registro, seguimiento y egreso de pacientes
- **Procedimientos Médicos**: Registro de procedimientos por especialidad
- **Sistema de Usuarios**: Roles diferenciados (Administrador, Medicina, Enfermería, etc.)
- **Estadísticas**: Reportes y métricas en tiempo real
- **Cuestionarios**: Sistema de evaluación de burnout
- **Interfaz Responsiva**: Optimizada para dispositivos móviles
- **Base de Datos PostgreSQL**: Escalable y robusta para producción

## 🏗️ Arquitectura

```
vitalmape-uti/
├── backend/          # API Node.js + Express + PostgreSQL
├── frontend/         # React + TypeScript + Tailwind
├── scripts/          # Scripts de utilidad y tests
├── docs/            # Documentación
├── data/            # Bases de datos y archivos de datos
└── package.json     # Configuración principal
```

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js >= 18.0.0
- PostgreSQL >= 12
- npm

### Instalación Rápida
```bash
# 1. Configurar PostgreSQL
./scripts/setup-postgresql.sh

# 2. Instalar todas las dependencias
npm run install-all

# 3. Configurar base de datos
cd backend
npm run db:migrate
npm run db:seed

# 4. Desarrollo (backend + frontend)
npm run dev
```

### Instalación Manual
```bash
# Instalar dependencias
npm run install-all

# Configurar PostgreSQL (ver docs/POSTGRESQL_SETUP.md)
cd backend
cp env.development .env
# Ajustar variables en .env

# Crear base de datos
createdb vitalmape_dev

# Ejecutar migraciones
npm run db:migrate

# Poblar datos iniciales
npm run db:seed

# Desarrollo
npm run dev
```

## 🌐 Despliegue

### Backend (Railway + PostgreSQL)
1. Ve a https://railway.app
2. Conecta tu repositorio
3. Agrega servicio PostgreSQL
4. Configura las variables de entorno desde `scripts/production.env`

### Frontend (Vercel)
1. Ve a https://vercel.com
2. Conecta tu repositorio
3. Configura el directorio como `frontend`

### Script Automatizado
```bash
npm run deploy
```

## 📁 Estructura del Proyecto

### Backend (`/backend`)
- **API REST** con Express.js
- **Base de datos** PostgreSQL
- **Autenticación** JWT
- **Envío de correos** con Nodemailer
- **Modelos** Sequelize ORM
- **Migraciones** automáticas

### Frontend (`/frontend`)
- **React 19** con TypeScript
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Axios** para peticiones HTTP
- **Context API** para estado global

### Scripts (`/scripts`)
- Scripts de migración de base de datos
- Tests y verificaciones
- Utilidades de desarrollo

## 🔧 Variables de Entorno

### Backend (Desarrollo)
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vitalmape_dev
DB_USER=postgres
DB_PASSWORD=password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mcerezopr@gmail.com
SMTP_PASS=tu_password_de_aplicacion
FRONTEND_URL=http://localhost:3000
JWT_SECRET=tu_jwt_secret_seguro
```

### Backend (Producción)
```env
NODE_ENV=production
DATABASE_URL=postgresql://usuario:password@host:puerto/database
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mcerezopr@gmail.com
SMTP_PASS=tu_password_de_aplicacion
FRONTEND_URL=https://tu-frontend-url.vercel.app
JWT_SECRET=vitalmape_jwt_secret_production_2024_secure_key
```

### Frontend
```env
REACT_APP_API_URL=https://tu-backend-url.railway.app/api
```

## 👥 Roles de Usuario

- **Administrador**: Gestión completa del sistema
- **Medicina**: Procedimientos médicos y estadísticas
- **Enfermería**: Cuidados de enfermería y procedimientos
- **Kinesiología**: Terapias y rehabilitación
- **TENS**: Técnicos en enfermería
- **Auxiliares**: Procedimientos auxiliares

## 📊 Funcionalidades Principales

### Gestión de Pacientes
- Registro de ingreso
- Seguimiento de evolución
- Procedimientos por especialidad
- Egreso y traslados

### Procedimientos
- Medicina: Cirugías, tratamientos
- Enfermería: Cuidados, medicamentos
- Kinesiología: Terapias físicas
- TENS: Procedimientos técnicos
- Auxiliares: Apoyo técnico

### Estadísticas
- Métricas por especialidad
- Reportes de ocupación
- Análisis de procedimientos
- Evaluación de personal

## 🐘 Base de Datos PostgreSQL

### Ventajas
- ✅ **Escalabilidad**: Mejor rendimiento con grandes volúmenes
- ✅ **Concurrencia**: Múltiples usuarios simultáneos
- ✅ **Integridad**: Mejor control de transacciones
- ✅ **Funciones Avanzadas**: JSON, arrays, funciones personalizadas
- ✅ **Producción**: Estándar en la industria

### Comandos Útiles
```bash
# Configurar PostgreSQL
./scripts/setup-postgresql.sh

# Probar configuración
./scripts/test-postgresql.sh

# Ejecutar migraciones
cd backend && npm run db:migrate

# Poblar datos iniciales
cd backend && npm run db:seed
```

## 🆘 Soporte

Para soporte técnico contacta a: mcerezopr@gmail.com

## 📄 Licencia

ISC License - Ver archivo LICENSE para más detalles.
