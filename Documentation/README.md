
# Documentación de PayFlow

Bienvenido a la documentación técnica completa de PayFlow, un sistema de gestión de pagos en línea con arquitectura hexagonal.

---

## 📚 Índice de Documentación

### General
- **[README Principal](../README.md)** - Visión general del proyecto y arquitectura de monorepo

### Integración con Payment Gateway
- **[Integración con Payment Gateway](./IntegracionPayment Gateway.md)** - 📍 **COMIENZA AQUÍ** para entender el flujo de pago completo
  - Arquitectura general
  - Flujo de pago paso a paso
  - Diagramas de secuencia
  - Integración con API de Payment Gateway
  - Configuración y seguridad

### Backend (NestJS)
- **[Arquitectura Hexagonal](./Documentación%20del%20Backend/ArquitecturaHexagonal.md)** - Explicación detallada de la arquitectura hexagonal
- **[Endpoints de la API](./Documentación%20del%20Backend/Endpoints.md)** - Documentación de todos los endpoints REST
- **[Pruebas Unitarias](./Documentación%20del%20Backend/PruebasUnitarias.md)** - Guía de pruebas del backend

### Frontend (React)
- **[Componentes Principales](./Documentación%20del%20Frontend/ComponentesPrincipales.md)** - Descripción de los componentes React principales
- **[Pruebas Unitarias](./Documentación%20del%20Frontend/PruebasUnitarias.md)** - Guía de pruebas del frontend

---

## 🔄 Diagrama de Flujo de Pago (Resumen Visual)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO COMPLETO DE PAGO                              │
└──────────────────────────────────────────────────────────────────────────────┘

                                   USUARIO
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                    NAVEGA TIENDA            AGREGA AL CARRITO
                         │                         │
                         └────────────┬────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────┐
                        │   PÁGINA DE CHECKOUT    │
                        │                         │
                        │  • Datos de envío       │
                        │  • Datos de pago        │
                        └───────────┬─────────────┘
                                    │
                        ┌───────────▼────────────┐
                        │  CLICK "CONFIRM PAGO"  │
                        └───────────┬────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │   FRONTEND      │   │      WP API     │   │  PAYFLOW API    │
    │   (React)       │   │   (Gateway)     │   │  (NestJS)       │
    └─────────────────┘   └─────────────────┘   └─────────────────┘
              │                     │                     │
              │                     │                     │
              │  1. tokenizeCard()  │                     │
              │────────────────────▶│                     │
              │                     │                     │
              │  2. Payment Token   │                     │
              │◀────────────────────│                     │
              │                                           │
              │  3. createTransaction(token)              │
              │──────────────────────────────────────────▶│
              │                                           │
              │                     │  4. processPayment()│
              │                     │◀────────────────────│
              │                     │                     │
              │                     │  5. GET acceptance  │
              │                     │     _token          │
              │                     │────────────────────▶│
              │                     │                     │
              │                     │  6. POST /          │
              │                     │     transactions    │
              │                     │────────────────────▶│
              │                     │                     │
              │                     │  7. Payment         │
              │                     │     Response        │
              │                     │◀────────────────────│
              │                                           │
              │  8. Transaction Result                    │
              │  (APPROVED/DECLINED/ERROR)                │
              │◀──────────────────────────────────────────│
              │                                           │
              ▼                                           ▼
    ┌─────────────────┐                        ┌─────────────────┐
    │ REDIRECT TO     │                        │ UPDATE DB       │
    │ /payment-result │                        │ • Transaction   │
    │                 │                        │ • Product Stock │
    └─────────────────┘                        └─────────────────┘
              │
              ▼
    ┌─────────────────┐
    │  MOSTRAR        │
    │  RESULTADO      │
    │  • Success ✓    │
    │  • Error ✗      │
    └─────────────────┘
```

---

## 🔑 Conceptos Clave

### Arquitectura Hexagonal (Backend)

```
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                             │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              CAPA DE PRESENTACIÓN                     │ │
│  │  • TransactionsController                             │ │
│  │  • OrdersController                                   │ │
│  └───────────────────────┬───────────────────────────────┘ │
│                          │                                 │
│  ┌───────────────────────▼───────────────────────────────┐ │
│  │              CAPA DE APLICACIÓN                       │ │
│  │  • ProcessPaymentUseCase                              │ │
│  │  • ProcessOrderPaymentUseCase                         │ │
│  │  • CreateTransactionUseCase                           │ │
│  └───────────────────────┬───────────────────────────────┘ │
│                          │                                 │
│  ┌───────────────────────▼───────────────────────────────┐ │
│  │              CAPA DE DOMINIO                          │ │
│  │  • Transaction Entity                                 │ │
│  │  • Order Entity                                       │ │
│  │  • IPaymentGateway Interface (Puerto)                │ │
│  └───────────────────────┬───────────────────────────────┘ │
│                          │                                 │
│  ┌───────────────────────▼───────────────────────────────┐ │
│  │            CAPA DE INFRAESTRUCTURA                    │ │
│  │  • WpClient (Adaptador de Payment Gateway)                      │ │
│  │  • TransactionRepository                              │ │
│  │  • OrderRepository                                    │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Seguridad en la Integración

**Claves de Payment Gateway:**
- **Public Key**: Se usa en el frontend para tokenizar tarjetas
- **Private Key**: Solo en el backend para procesar transacciones
- **Integrity Key**: Solo en el backend para generar firmas SHA256

**Flujo Seguro:**
1. Frontend tokeniza tarjeta directamente con Payment Gateway (PCI Compliance)
2. Solo el token se envía al backend de PayFlow
3. Backend genera firma de integridad antes de procesar
4. Payment Gateway valida la firma y procesa la transacción

---

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: NestJS
- **Arquitectura**: Hexagonal (Ports & Adapters)
- **Base de datos**: PostgreSQL con TypeORM
- **Testing**: Jest
- **Validación**: class-validator, class-transformer

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Estado**: Redux Toolkit
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library

### Integración de Pagos
- **Pasarela**: Payment Gateway (REST API)
- **Tokenización**: Directa desde frontend
- **Procesamiento**: API-to-API desde backend

---