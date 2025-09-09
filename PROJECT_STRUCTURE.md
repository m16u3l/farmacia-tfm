# 🏗️ Estructura del Proyecto - BioFarm TFM

## 📁 Estructura de Carpetas y Archivos

```
farmacia-tfm/
├── 📄 README.md                    # Documentación principal del proyecto
├── 📄 package.json                 # Dependencias y scripts del proyecto
├── 📄 pnpm-lock.yaml              # Lock file de dependencias
├── 📄 tsconfig.json               # Configuración de TypeScript
├── 📄 next.config.ts              # Configuración de Next.js
├── 📄 next-env.d.ts               # Tipos de Next.js
├── 📄 envConfig.ts                # Configuración de variables de entorno
├── 📄 postcss.config.mjs          # Configuración de PostCSS
├── 📄 .eslintrc.json              # Configuración de ESLint
├── 📄 .gitignore                  # Archivos ignorados por Git
├── 📄 .env.sample                 # Ejemplo de variables de entorno
├── 📄 .env                        # Variables de entorno (no versionado)
│
├── 📂 public/                     # Archivos estáticos públicos
│
└── 📂 src/                        # Código fuente principal
    ├── 📂 app/                    # App Router de Next.js 15
    │   ├── 📄 layout.tsx          # Layout principal de la aplicación
    │   ├── 📄 page.tsx            # Página de inicio (Dashboard)
    │   ├── 📄 globals.css         # Estilos globales
    │   │
    │   ├── 📂 api/                # API Routes de Next.js
    │   │   ├── 📂 cron/           # Endpoints para tareas programadas
    │   │   │   ├── 📄 route.ts    # CRUD de tareas cron
    │   │   │   └── 📂 init/
    │   │   │       └── 📄 route.ts
    │   │   │
    │   │   ├── 📂 employees/      # API de empleados
    │   │   │   ├── 📄 route.ts    # GET, POST /api/employees
    │   │   │   └── 📂 [id]/
    │   │   │       └── 📄 route.ts # GET, PUT, DELETE /api/employees/[id]
    │   │   │
    │   │   ├── 📂 products/       # API de productos
    │   │   │   ├── 📄 route.ts    # GET, POST /api/products
    │   │   │   └── 📂 [id]/
    │   │   │       └── 📄 route.ts # GET, PUT, DELETE /api/products/[id]
    │   │   │
    │   │   ├── 📂 sells/          # API de ventas
    │   │   │   ├── 📄 route.ts    # GET, POST /api/sells
    │   │   │   └── 📂 [id]/
    │   │   │       └── 📄 route.ts # GET, PUT, DELETE /api/sells/[id]
    │   │   │
    │   │   ├── 📂 suppliers/      # API de proveedores
    │   │   │   ├── 📄 route.ts    # GET, POST /api/suppliers
    │   │   │   └── 📂 [id]/
    │   │   │       └── 📄 route.ts # GET, PUT, DELETE /api/suppliers/[id]
    │   │   │
    │   │   └── 📂 users/          # API de usuarios
    │   │       ├── 📄 route.js    # GET, POST /api/users
    │   │       └── 📂 [id]/
    │   │           └── 📄 route.js # GET, PUT, DELETE /api/users/[id]
    │   │
    │   ├── 📂 configuracion/      # Página de configuración
    │   │
    │   ├── 📂 employees/          # Página de gestión de empleados
    │   │
    │   ├── 📂 products/           # Página de gestión de productos
    │   │
    │   ├── 📂 sells/              # Página de gestión de ventas
    │   │
    │   ├── 📂 suppliers/          # Página de gestión de proveedores
    │   │
    │   └── 📂 users/              # Página de gestión de usuarios
    │
    ├── 📂 components/             # Componentes reutilizables de React
    │   ├── 📂 ErrorBoundary/      # Manejo de errores
    │   │
    │   ├── 📂 ThemeRegistry/      # Configuración de tema Material-UI
    │   │
    │   ├── 📂 employees/          # Componentes de empleados
    │   │
    │   ├── 📂 inventory/          # Componentes de inventario
    │   │
    │   ├── 📂 layout/             # Componentes de layout
    │   │
    │   ├── 📂 orders/             # Componentes de órdenes
    │   │
    │   ├── 📂 products/           # Componentes de productos
    │   │
    │   ├── 📂 sells/              # Componentes de ventas
    │   │
    │   ├── 📂 suppliers/          # Componentes de proveedores
    │   │
    │   └── 📂 users/              # Componentes de usuarios
    │
    ├── 📂 config/                 # Configuraciones del sistema
    │   └── 📄 db.ts               # Configuración de base de datos PostgreSQL
    │
    ├── 📂 hooks/                  # Custom Hooks de React
    │   ├── 📄 useEmployees.ts     # Hook para gestión de empleados
    │   ├── 📄 useProducts.ts      # Hook para gestión de productos
    │   ├── 📄 useSells.ts         # Hook para gestión de ventas
    │   ├── 📄 useSuppliers.ts     # Hook para gestión de proveedores
    │   └── 📄 useUsers.ts         # Hook para gestión de usuarios
    │
    ├── 📂 lib/                    # Librerías y utilidades compartidas
    │
    ├── 📂 services/               # Servicios para comunicación con APIs
    │   ├── 📄 api.ts              # Cliente HTTP base
    │   ├── 📄 employeeService.ts  # Servicio de empleados
    │   ├── 📄 inventoryService.ts # Servicio de inventario
    │   ├── 📄 orderService.ts     # Servicio de órdenes
    │   ├── 📄 sellService.ts      # Servicio de ventas
    │   └── 📄 supplierService.ts  # Servicio de proveedores
    │
    ├── 📂 types/                  # Definiciones de tipos TypeScript
    │   ├── 📄 index.ts            # Exportaciones principales
    │   ├── 📄 employee.ts         # Tipos de empleados
    │   ├── 📄 inventory.ts        # Tipos de inventario
    │   ├── 📄 order.ts            # Tipos de órdenes
    │   ├── 📄 products.ts         # Tipos de productos
    │   ├── 📄 sell.ts             # Tipos de ventas
    │   ├── 📄 supplier.ts         # Tipos de proveedores
    │   └── 📄 user.ts             # Tipos de usuarios
    │
    └── 📂 utils/                  # Funciones utilitarias
        └── 📄 formatters.ts       # Formateadores de datos
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Next.js 15** - Framework de React con App Router
- **React 19** - Librería de interfaz de usuario
- **TypeScript** - Tipado estático
- **Material-UI v6** - Componentes de interfaz
- **Emotion** - CSS-in-JS para estilos

### Backend
- **Next.js API Routes** - Endpoints de la API
- **PostgreSQL** - Base de datos relacional
- **Node.js** - Runtime de JavaScript

### Herramientas de Desarrollo
- **ESLint** - Linter de código
- **PostCSS** - Procesador de CSS
- **pnpm** - Gestor de paquetes
- **Git** - Control de versiones

### Servicios Externos
- **Nodemailer** - Envío de emails
- **Node-cron** - Tareas programadas
- **Axios** - Cliente HTTP

## 📋 Funcionalidades Principales

1. **Gestión de Productos** - CRUD completo de productos farmacéuticos
2. **Gestión de Proveedores** - Administración de proveedores
3. **Gestión de Empleados** - Control de personal
4. **Sistema de Ventas** - Procesamiento de transacciones
5. **Gestión de Usuarios** - Administración de accesos
6. **Sistema de Emails** - Notificaciones automáticas
7. **Tareas Programadas** - Automatización de procesos
8. **Dashboard** - Panel de control principal

## 🚀 Comandos Disponibles

```bash
# Desarrollo
pnpm dev          # Inicia el servidor de desarrollo

# Producción
pnpm build        # Construye la aplicación para producción
pnpm start        # Inicia el servidor de producción

# Calidad de Código
pnpm lint         # Ejecuta ESLint
```

## 🔧 Configuración

El proyecto utiliza variables de entorno definidas en `.env`:
- `DB_CONNECTION` - Cadena de conexión a PostgreSQL
- `SMTP_*` - Configuración de email
- `EMAIL_*` - Credenciales de email

## 📱 Arquitectura

El proyecto sigue una arquitectura modular con:
- **Separación de responsabilidades** entre componentes, hooks y servicios
- **Tipado fuerte** con TypeScript
- **API RESTful** con Next.js API Routes
- **Gestión de estado** con hooks personalizados
- **Interfaz responsive** con Material-UI
