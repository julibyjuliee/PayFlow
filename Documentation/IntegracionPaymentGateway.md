# Integración con Api - Flujo de Pago Completo

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Flujo de Pago Completo](#flujo-de-pago-completo)
4. [Integración con la API de Payment Gateway](#integración-con-la-api-de-payment-gateway)
5. [Seguridad](#seguridad)

---

## 🎯 Introducción

PayFlow integra la pasarela de pagos **Payment Gateway** para procesar transacciones con tarjetas de crédito/débito de manera segura. La integración sigue una arquitectura hexagonal que separa la lógica de negocio de los detalles de implementación, permitiendo flexibilidad y mantenibilidad.

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                                                                 │
│  ┌──────────────┐    ┌─────────────────┐   ┌────────────────┐ │
│  │ CheckoutInfo │───▶│ PaymentService  │──▶│ Payment Gateway API      │ │
│  │  Component   │    │  (Tokenización) │   │ (Directa)      │ │
│  └──────────────┘    └─────────────────┘   └────────────────┘ │
│         │                     │                                │
│         │                     ▼                                │
│         │            ┌─────────────────┐                       │
│         └───────────▶│ PayFlow API     │                       │
│                      │ (Transacciones) │                       │
└──────────────────────┴─────────────────┴───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (NestJS)                         │
│                                                                 │
│  ┌────────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │ Controller     │───▶│  Use Case    │───▶│  WpClient      │ │
│  │ (Presentation) │    │ (Application)│    │  (Adapter)     │ │
│  └────────────────┘    └──────────────┘    └────────────────┘ │
│                               │                     │          │
│                               ▼                     ▼          │
│                      ┌──────────────┐    ┌────────────────┐   │
│                      │ Transaction  │    │ Payment Gateway API      │   │
│                      │ Repository   │    │ (REST)         │   │
│                      └──────────────┘    └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Pago Completo

### Diagrama de Secuencia

```
Usuario          Frontend         PaymentService    PayFlow API    WpClient       Payment Gateway API
  │                 │                   │                │             │              │
  │ 1. Completa     │                   │                │             │              │
  │   formulario    │                   │                │             │              │
  │────────────────▶│                   │                │             │              │
  │                 │                   │                │             │              │
  │ 2. Click "Pagar"│                   │                │             │              │
  │────────────────▶│                   │                │             │              │
  │                 │                   │                │             │              │
  │                 │ 3. tokenizeCard() │                │             │              │
  │                 │──────────────────▶│                │             │              │
  │                 │                   │                │             │              │
  │                 │                   │ 4. POST /payment_sources     │              │
  │                 │                   │──────────────────────────────┼─────────────▶│
  │                 │                   │                │             │              │
  │                 │                   │ 5. Token ID    │             │              │
  │                 │                   │◀──────────────────────────────────────────────│
  │                 │                   │                │             │              │
  │                 │ 6. Token ID       │                │             │              │
  │                 │◀──────────────────│                │             │              │
  │                 │                   │                │             │              │
  │                 │ 7. createTransaction()             │             │              │
  │                 │────────────────────────────────────▶│             │              │
  │                 │                   │                │             │              │
  │                 │                   │    8. ProcessPaymentUseCase  │              │
  │                 │                   │                │────────────▶│              │
  │                 │                   │                │             │              │
  │                 │                   │                │             │ 9. getAcceptanceToken()
  │                 │                   │                │             │──────────────▶│
  │                 │                   │                │             │              │
  │                 │                   │                │             │ 10. acceptance_token
  │                 │                   │                │             │◀──────────────│
  │                 │                   │                │             │              │
  │                 │                   │                │             │ 11. generateIntegritySignature()
  │                 │                   │                │             │              │
  │                 │                   │                │             │ 12. POST /transactions
  │                 │                   │                │             │──────────────▶│
  │                 │                   │                │             │              │
  │                 │                   │                │             │ 13. Payment Response
  │                 │                   │                │             │◀──────────────│
  │                 │                   │                │             │              │
  │                 │                   │                │ 14. Update Transaction     │
  │                 │                   │                │◀────────────│              │
  │                 │                   │                │             │              │
  │                 │ 15. Transaction   │                │             │              │
  │                 │◀────────────────────────────────────│             │              │
  │                 │                   │                │             │              │
  │ 16. Redirect    │                   │                │             │              │
  │    /payment-    │                   │                │             │              │
  │    result       │                   │                │             │              │
  │◀────────────────│                   │                │             │              │
```

---

## 🔌 Integración con la API de Payment Gateway

### Endpoints Utilizados

#### 1. **GET /merchants/:publicKey**
- **Propósito**: Obtener información del comercio y acceptance_token
- **Autenticación**: Pública (Public Key)
- **Uso**: `apps/api/src/infrastructure/wp/wp.client.ts:38`
```typescript
GET https://api-sandbox.co.uat.wp.dev/v1/merchants/{PUBLIC_KEY}

Response:
{
  "data": {
    "presigned_acceptance": {
      "acceptance_token": "eyJhbGciOiJIUzI1NiJ9...",
      "permalink": "https://...",
      "type": "END_USER_POLICY"
    }
  }
}
```

#### 2. **POST /payment_sources**
- **Propósito**: Tokenizar tarjeta de crédito/débito
- **Autenticación**: Public Key
- **Uso**: `apps/client/src/services/paymentService.ts:49`
```typescript
POST https://api-sandbox.co.uat.wp.dev/v1/payment_sources

Headers:
  Authorization: Bearer {PUBLIC_KEY}
  Content-Type: application/json

Body:
{
  "number": "4242424242424242",
  "cvc": "123",
  "exp_month": "12",
  "exp_year": "25",
  "card_holder": "John Doe"
}

Response:
{
  "data": {
    "id": "tok_sandbox_123456",
    "type": "CARD",
    "status": "AVAILABLE"
  }
}
```

#### 3. **POST /transactions**
- **Propósito**: Procesar transacción de pago
- **Autenticación**: Private Key
- **Uso**: `apps/api/src/infrastructure/wp/wp.client.ts:101`
```typescript
POST https://api-sandbox.co.uat.wp.dev/v1/transactions

Headers:
  Authorization: Bearer {PRIVATE_KEY}
  Content-Type: application/json

Body:
{
  "acceptance_token": "eyJhbGciOiJIUzI1NiJ9...",
  "amount_in_cents": 5000000,
  "currency": "COP",
  "customer_email": "customer@example.com",
  "reference": "ORDER-123456",
  "redirect_url": "https://myapp.com/payment-result",
  "signature": "a1b2c3d4e5f6...", // SHA256 signature
  "payment_method": {
    "type": "CARD",
    "token": "tok_sandbox_123456",
    "installments": 1
  }
}

Response:
{
  "data": {
    "id": "123-1234567890-12345",
    "status": "APPROVED",
    "reference": "ORDER-123456",
    "amount_in_cents": 5000000,
    "currency": "COP",
    "payment_method_type": "CARD",
    "created_at": "2024-01-30T10:00:00.000Z",
    "finalized_at": "2024-01-30T10:00:05.000Z"
  }
}
```

#### 4. **GET /transactions/:id**
- **Propósito**: Consultar estado de una transacción
- **Autenticación**: Private Key
- **Uso**: `apps/api/src/infrastructure/wp/wp.client.ts:128`
```typescript
GET https://api-sandbox.co.uat.wp.dev/v1/transactions/{TRANSACTION_ID}

Headers:
  Authorization: Bearer {PRIVATE_KEY}

Response:
{
  "data": {
    "id": "123-1234567890-12345",
    "status": "APPROVED",
    // ... mismo formato que POST /transactions
  }
}
```

### Estados de Transacción en Payment Gateway

| Estado | Descripción | Acción en PayFlow |
|--------|-------------|-------------------|
| `APPROVED` | Pago aprobado exitosamente | Marcar como aprobado, reducir stock, mostrar éxito |
| `PENDING` | Pago pendiente de confirmación | Mantener como pendiente, notificar al usuario |
| `DECLINED` | Pago rechazado por el banco | Marcar como rechazado, mostrar error |
| `ERROR` | Error en el procesamiento | Marcar como error, mostrar mensaje al usuario |
| `VOIDED` | Transacción anulada | Revertir cambios si es necesario |

---

## 🔒 Seguridad

### 1. **Tokenización de Tarjetas**

✅ **Los datos sensibles NUNCA pasan por el servidor de PayFlow**
- El frontend se comunica **directamente** con Payment Gateway para tokenizar
- Solo el **token** se envía al backend de PayFlow
- Cumple con estándares **PCI DSS**

```typescript
// Frontend → Payment Gateway (Directo)
paymentService.tokenizeCard() → Payment Gateway API → Token

// Frontend → Backend (Solo token)
paymentService.createTransaction({ paymentToken: token })
```

### 2. **Firma de Integridad (Integrity Signature)**

✅ **Previene manipulación de datos de transacción**
- Firma SHA256 calculada en el backend
- Incluye: `reference + amountInCents + currency + integrityKey`
- Payment Gateway valida la firma antes de procesar

```typescript
// apps/api/src/infrastructure/wp/wp.client.ts:56
private generateIntegritySignature(reference: string, amountInCents: number): string {
  const chain = `${reference}${amountInCents}COP${this.integrityKey}`;
  return crypto.createHash('sha256').update(chain).digest('hex');
}
```

### 3. **Autenticación con Payment Gateway**

- **Public Key**: Solo para tokenización de tarjetas (frontend)
- **Private Key**: Solo para procesamiento de transacciones (backend)
- **Integrity Key**: Solo en backend para generar firmas

```typescript
// Solo en backend
const privateKey = this.configService.get<string>('WP_PRIVATE_KEY');
```

### 4. **Validación de Estados**

**El backend valida el estado de la transacción antes de procesar**

```typescript
// apps/api/src/application/use-cases/process-payment.use-case.ts:44
if (!transaction.isPending()) {
  return Result.fail(
    new Error(`Transaction ${input.transactionId} is not in PENDING state`),
  );
}
```

### 5. **HTTPS y Encriptación**

- Todas las comunicaciones con Payment Gateway usan **HTTPS**
- Datos en tránsito están encriptados con **TLS 1.2+**
- Tokens de pago expiran después de un tiempo limitado

---

## 📊 Diagrama de Estados de Transacción

```
┌─────────────────────────────────────────────────────────────────┐
│                    Ciclo de Vida de Transacción                 │
└─────────────────────────────────────────────────────────────────┘

    START
      │
      ▼
┌───────────┐
│  PENDING  │◀──────┐
└───────────┘       │
      │             │
      │ processPayment()
      │             │
      ▼             │
┌───────────┐       │
│ Processing│       │
│  Payment  │       │
└───────────┘       │
      │             │
      ├─────────────┼─────────────┐
      │             │             │
      ▼             ▼             ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│ APPROVED  │ │ DECLINED  │ │   ERROR   │
└───────────┘ └───────────┘ └───────────┘
      │
      │ (Reduce stock)
      │
      ▼
    END
```

---

## 📚 Referencias

- **API Reference**: https://app.swaggerhub.com/apis-docs/waybox/payment-gateway/1.2.0
- **Tarjetas de Prueba**: https://docs.wompi.co/docs/colombia/datos-de-prueba-en-sandbox/
- **Fuentes de pago & Tokenización**: https://docs.wompi.co/docs/colombia/fuentes-de-pago/
---

