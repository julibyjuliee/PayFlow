# PayFlow 🛍️💳

**Sistema de Gestión de Pagos en Línea**

Aplicación full-stack moderna para procesamiento de pagos desarrollada como monorepo con arquitectura hexagonal, integración con Payment Gateway y despliegue en Railway.

---

## 🚀 Demo en Vivo

**Frontend:** [studiohomedecor](https://studiohomedecor.up.railway.app/)

---

## 📋 ¿Qué es PayFlow?

PayFlow es una plataforma de e-commerce que permite:
- 🛒 Explorar y comprar productos
- 💳 Procesar pagos seguros con tarjetas de crédito

---

## 🏗️ Arquitectura

### Monorepo

PayFlow está estructurado como **monorepo** usando **npm workspaces + TurboRepo**:

```
PayFlow/
├── apps/
│   ├── api/      # Backend - NestJS
│   └── client/   # Frontend - React
└── Documentation/
```

**¿Por qué monorepo?**
- ✅ **Desarrollo unificado**: Un solo repositorio para frontend y backend
- ✅ **Código compartido**: Tipos y utilidades reutilizables
- ✅ **Sincronización**: Garantiza compatibilidad entre aplicaciones
- ✅ **CI/CD optimizado**: Builds y deploys coordinados
- ✅ **Developer Experience**: Comandos unificados, hot-reload integrado

### Backend: Arquitectura Hexagonal

El backend implementa **Clean Architecture** con el patrón **Ports & Adapters**:

```
📦 Domain (Core)
   └─ Lógica de negocio pura, independiente de frameworks
📦 Application
   └─ Casos de uso y orquestación
📦 Infrastructure
   └─ Adaptadores (Database, Payment Gateway API)
📦 Presentation
   └─ Controladores REST
```

**Beneficios:**
- ✅ Lógica de negocio aislada y testeable
- ✅ Cambiar tecnologías sin afectar el core
- ✅ Fácil mantenimiento y escalabilidad

---

## 🛠️ Stack Tecnológico

### Backend
- **Framework:** NestJS 11
- **Lenguaje:** TypeScript 5
- **Base de Datos:** PostgreSQL (Supabase)
- **ORM:** TypeORM
- **Testing:** Jest (791 tests)
- **Pasarela de Pagos:** Payment Gateway

### Frontend
- **Framework:** React 18
- **Lenguaje:** TypeScript 5
- **Build Tool:** Vite
- **Estado:** Redux Toolkit
- **Estilos:** Tailwind CSS
- **Testing:** Vitest (319 tests)

### Infraestructura
- **Base de Datos:** Supabase (PostgreSQL gestionado)
- **Hosting:** Railway (Backend + Frontend)
- **Monorepo:** TurboRepo 2
- **Node.js:** v25.5.0

---

## 🗄️ Base de Datos - Supabase

**¿Por qué Supabase?**
- ✅ PostgreSQL completamente gestionado
- ✅ Backups automáticos
- ✅ SSL/TLS por defecto
- ✅ Connection pooling (PgBouncer)
- ✅ Dashboard intuitivo
- ✅ Tier gratuito generoso

---

## 🚂 Despliegue - Railway

**¿Por qué Railway?**
- ✅ Deploy automático desde GitHub
- ✅ Variables de entorno seguras
- ✅ Logs en tiempo real
- ✅ SSL/HTTPS gratuito
- ✅ Escalado automático
- ✅ Rollback instantáneo

**Servicios desplegados:**
- **Backend API:** NestJS en Railway
- **Frontend:** React (Vite) en Railway
- **Base de Datos:** Supabase (PostgreSQL)

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 25.5.0
- npm 11.8.0
- PostgreSQL (o cuenta de Supabase)


**URLs locales:**
- Frontend: http://localhost:8080
- Backend: http://localhost:3000

---

## 📚 Documentación Completa

### Backend
- [**Arquitectura Hexagonal**](./Documentation/Documentación%20del%20Backend/ArquitecturaHexagonal.md) - Diseño y capas del sistema
- [**Endpoints API**](./Documentation/Documentación%20del%20Backend/Endpoints.md) - Documentación completa de la API REST
- [**Seguridad**](./Documentation/Documentación%20del%20Backend/Seguridad.md) - Medidas de seguridad implementadas
- [**Pruebas Unitarias**](./Documentation/Documentación%20del%20Backend/PruebasUnitarias.md) - test del backend
- [**Instalación y Ejecución**](./Documentation/Documentación%20del%20Backend/InstalacionYEjecucion.md) - Guía de setup

### Frontend
- [**Componentes Principales**](./Documentation/Documentación%20del%20Frontend/ComponentesPrincipales.md) - Componentes React y hooks
- [**Pruebas Unitarias**](./Documentation/Documentación%20del%20Frontend/PruebasUnitarias.md) - test del frontend

### General
- [**Flujo y comunicación con Api Payment Gateway**](./Documentation/IntegracionPaymentGateway.md) - Diagrama completo del sistema

---

## 🔒 Seguridad

### Implementaciones de Seguridad
- ✅ **Validación exhaustiva** con class-validator
- ✅ **Tokenización de tarjetas** (no se almacenan datos sensibles)
- ✅ **Firma de integridad SHA256** para transacciones
- ✅ **HTTPS/SSL** en todas las comunicaciones
- ✅ **Variables de entorno** para credenciales
- ✅ **CORS configurado** correctamente
- ✅ **PCI DSS Compliance** mediante Payment Gateway

