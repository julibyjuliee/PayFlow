# Componentes Principales del Frontend - PayFlow

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Frontend](#arquitectura-del-frontend)
3. [Gestión de Estado (Redux)](#gestión-de-estado-redux)
4. [Componentes de Presentación](#componentes-de-presentación)
5. [Componentes de Negocio](#componentes-de-negocio)
6. [Custom Hooks](#custom-hooks)
7. [Servicios](#servicios)
8. [Flujo de Usuario](#flujo-de-usuario)

---

## Visión General

El frontend de PayFlow está construido con **React 18** y **TypeScript**, utilizando una arquitectura basada en componentes reutilizables y hooks personalizados. La aplicación implementa **Redux Toolkit** para la gestión de estado global y sigue los principios de composición de componentes.

### Tecnologías Principales

```yaml
Framework: React 18
Lenguaje: TypeScript 5
Build Tool: Vite
Estado Global: Redux Toolkit
Routing: React Router v6
Estilos: Tailwind CSS
Iconos: Material Symbols
```

---

## Arquitectura del Frontend

### Estructura de Directorios

```
apps/client/src/
├── components/           # Componentes reutilizables
│   ├── ui/              # Componentes UI básicos
│   ├── Header/          # Barra de navegación
│   ├── Product/         # Productos
│   ├── ProductDetail/   # Detalle de producto
│   ├── CheckoutInfo/    # Checkout y formularios
│   ├── PaymentSummaryModal/  # Modal de resumen
│   ├── Modal/           # Modal genérico
│   ├── EmptyCar/        # Estado vacío del carrito
│   ├── Navigation/      # Navegación inferior
│   └── States/          # Estados de carga/error
│
├── pages/               # Páginas de la aplicación
│   ├── ShopPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CartPage.tsx
│   ├── CheckoutPage.tsx
│   └── PaymentResultPage.tsx
│
├── store/               # Redux Store
│   ├── slices/          # Slices de estado
│   │   ├── cartSlice.ts
│   │   ├── productSlice.ts
│   │   └── checkoutSlice.ts
│   ├── middleware/      # Middleware personalizado
│   └── store.ts         # Configuración del store
│
├── hooks/               # Custom Hooks
│   ├── useCheckoutForm.ts
│   ├── usePaymentProcessing.ts
│   ├── useFormPersistence.ts
│   └── useOrderCalculations.ts
│
├── services/            # Servicios de API
│   ├── api.ts
│   ├── paymentService.ts
│   └── productService.ts
│
├── types/               # Tipos TypeScript
├── utils/               # Utilidades
└── routes/              # Configuración de rutas
```


---

## Gestión de Estado (Redux)

### Store Configuration

**Ubicación:** `src/store/store.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import productReducer from './slices/productSlice';
import checkoutReducer from './slices/checkoutSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    product: productReducer,
    checkout: checkoutReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 1. Cart Slice (Carrito de Compras)

**Ubicación:** `src/store/slices/cartSlice.ts`

**Propósito:** Gestiona el estado del carrito de compras.

```typescript
interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}
```

**Acciones Principales:**

| Acción | Descripción | Uso |
|--------|-------------|-----|
| `addToCart` | Agrega un producto al carrito | `dispatch(addToCart({ product, quantity }))` |
| `removeFromCart` | Elimina un producto del carrito | `dispatch(removeFromCart(productId))` |
| `updateQuantity` | Actualiza cantidad de un producto | `dispatch(updateQuantity({ productId, quantity }))` |
| `clearCart` | Vacía el carrito | `dispatch(clearCart())` |

**Ejemplo de Uso:**

```typescript
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToCart } from '../../store/slices/cartSlice';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  const totalItems = useAppSelector(state => state.cart.totalItems);

  const handleAddToCart = (product: Product, quantity: number) => {
    dispatch(addToCart({ product, quantity }));
  };

  return (
    <div>
      <p>Items en el carrito: {totalItems}</p>
      <button onClick={() => handleAddToCart(product, 1)}>
        Agregar al carrito
      </button>
    </div>
  );
};
```

### 2. Product Slice (Productos)

**Ubicación:** `src/store/slices/productSlice.ts`

**Propósito:** Gestiona el estado de los productos y su carga desde la API.

```typescript
interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  selectedProduct: Product | null;
}
```

**Acciones Principales:**

| Acción | Descripción | Tipo |
|--------|-------------|------|
| `fetchProducts` | Obtiene productos de la API | Async Thunk |
| `setSelectedProduct` | Establece producto seleccionado | Action |
| `clearSelectedProduct` | Limpia producto seleccionado | Action |

### 3. Checkout Slice (Checkout)

**Ubicación:** `src/store/slices/checkoutSlice.ts`

**Propósito:** Gestiona el estado del proceso de checkout.

```typescript
interface CheckoutState {
  shippingAddress: ShippingAddress | null;
  paymentStatus: 'idle' | 'processing' | 'success' | 'error';
}
```

---

## Componentes de Presentación

### 1. Header (Barra de Navegación)

**Ubicación:** `src/components/Header/Header.tsx`

**Propósito:** Barra de navegación principal con logo, menú y contador del carrito.

**Características:**
- ✅ Logo de la aplicación (STUDIO)
- ✅ Navegación entre Tienda y Carrito
- ✅ Badge con contador de items en el carrito
- ✅ Sticky header con backdrop blur
- ✅ Indicador visual de la pestaña activa


---

### 2. ProductCard (Tarjeta de Producto)

**Ubicación:** `src/components/Product/ProductCard.tsx`

**Propósito:** Muestra información resumida de un producto con acción de agregar al carrito.

**Características:**
- ✅ Imagen del producto con aspect ratio cuadrado
- ✅ Nombre del producto (truncado)
- ✅ Precio formateado en COP
- ✅ Categoría del producto
- ✅ Badge de stock (animado si hay >= 10 unidades)
- ✅ Botón flotante de agregar al carrito
- ✅ Click en la card para ver detalle


---

### 3. ProductDetail (Detalle de Producto)

**Ubicación:** `src/components/ProductDetail/ProductDetail.tsx`

**Propósito:** Vista detallada del producto con selector de cantidad y agregado al carrito.

**Características:**
- ✅ Galería de imágenes (implementación mock con 3 copias)
- ✅ Información completa del producto
- ✅ Descripción detallada
- ✅ Selector de cantidad con botones +/-
- ✅ Validación de stock disponible vs cantidad en carrito
- ✅ Badge de stock con estado
- ✅ SKU generado automáticamente
- ✅ Especificaciones (Categoría, Stock)
- ✅ Íconos de beneficios (Envío gratis, Garantía)
- ✅ Modal de confirmación al agregar al carrito


---

## Componentes de Negocio

### 4. CheckoutInfo (Formulario de Checkout)

**Ubicación:** `src/components/CheckoutInfo/CheckoutInfo.tsx`

**Propósito:** Componente principal del checkout que orquesta el flujo de pago.


**Sub-componentes:**

#### 4.1 ShippingForm
**Ubicación:** `src/components/CheckoutInfo/ShippingForm.tsx`

Formulario de datos de envío:
- Nombre y Apellido
- Email
- Dirección
- Ciudad
- Código Postal

#### 4.2 PaymentForm
**Ubicación:** `src/components/CheckoutInfo/PaymentForm.tsx`

Formulario de tarjeta de crédito:
- Número de tarjeta (con detección automática de tipo)
- Fecha de vencimiento (MM/YY)
- CVV (3 o 4 dígitos según el tipo de tarjeta)
- Logo de tarjeta dinámico (Visa, Mastercard, Amex)

**Validaciones en Tiempo Real:**
- ✅ Formato de número de tarjeta (Algoritmo de Luhn)
- ✅ Detección de tipo de tarjeta (Visa, Mastercard, Amex)
- ✅ Formato de fecha (MM/YY)
- ✅ Validación de CVV según tipo de tarjeta
- ✅ Validación de email
- ✅ Campos requeridos

#### 4.3 OrderSummary
**Ubicación:** `src/components/CheckoutInfo/OrderSummary.tsx`

Resumen del pedido:
- Lista de productos con imagen y cantidad
- Subtotal
- Impuestos (19%)
- Envío
- Total
- Botón de proceder al pago

**Características:**
- ✅ Sticky en desktop
- ✅ Botón habilitado solo si el formulario es válido
- ✅ Permite eliminar items del carrito


---

### 5. PaymentSummaryModal (Modal de Confirmación)

**Ubicación:** `src/components/PaymentSummaryModal/PaymentSummaryModal.tsx`

**Propósito:** Modal final que muestra el resumen y procesa el pago.


**Flujo de Procesamiento:**

```
1. Usuario hace click en "Revisar y Pagar"
   ↓
2. Se abre el modal con resumen
   ↓
3. Usuario confirma
   ↓
4. Hook usePaymentProcessing se ejecuta:
   a. Tokeniza la tarjeta con Payment Gateway
   b. Crea la transacción en el backend
   c. Backend procesa el pago
   ↓
5. Muestra resultado (éxito o error)
```

**Sub-componentes:**

- **PaymentSummary**: Resumen del total
- **ErrorAlert**: Alerta de error (si falla)
- **ModalActions**: Botones de acción (Cancelar/Confirmar)

**Estados:**
- `idle`: Estado inicial
- `processing`: Procesando pago (muestra spinner)
- `success`: Pago exitoso
- `error`: Error en el pago

---

### 6. EmptyCart (Carrito Vacío)

**Ubicación:** `src/components/EmptyCar/EmptyCar.tsx`

**Propósito:** Estado vacío del carrito con call-to-action.

**Características:**
- ✅ Ícono grande de bolsa de compras
- ✅ Mensaje amigable
- ✅ Botón para ir a la tienda
- ✅ Diseño centrado y atractivo


---

### 7. BottomNavigation (Navegación Inferior)

**Ubicación:** `src/components/Navigation/BottomNavigation.tsx`

**Propósito:** Barra de navegación inferior (para móviles).


**Características:**
- ✅ Fijo en la parte inferior
- ✅ Backdrop blur
- ✅ Badges para notificaciones
- ✅ Íconos Material Symbols
- ✅ Indicador de pestaña activa

---

## Custom Hooks

### 1. useCheckoutForm

**Ubicación:** `src/hooks/useCheckoutForm.ts`

**Propósito:** Gestiona el estado y validación del formulario de checkout.

**Características:**
- ✅ Validación en tiempo real
- ✅ Detección automática de tipo de tarjeta
- ✅ Formateo automático (número de tarjeta, fecha)
- ✅ Validación de Luhn para tarjetas
- ✅ Mensajes de error personalizados

---

### 2. usePaymentProcessing

**Ubicación:** `src/hooks/usePaymentProcessing.ts`

**Propósito:** Procesa el pago completo (tokenización + transacción).
---

### 3. useFormPersistence

**Ubicación:** `src/hooks/useFormPersistence.ts`

**Propósito:** Persiste el formulario en localStorage automáticamente.

**Características:**
- ✅ Guarda el formulario cada vez que cambia
- ✅ Recupera datos al montar el componente
- ✅ Excluye datos sensibles (tarjeta, CVV)
- ✅ Función para limpiar datos guardados

---

### 4. useOrderCalculations

**Ubicación:** `src/hooks/useOrderCalculations.ts`

**Propósito:** Calcula subtotal, impuestos, envío y total.
---

## Servicios

### 1. PaymentService

**Ubicación:** `src/services/paymentService.ts`

**Propósito:** Gestiona la comunicación con Payment Gateway y el backend.

---

## Flujo de Usuario

### 1. Flujo de Compra Completo

```
┌─────────────────────────────────────────────────────────┐
│                  FLUJO DE USUARIO                       │
└─────────────────────────────────────────────────────────┘

1. EXPLORAR PRODUCTOS (ShopPage)
   │
   ├─> Usuario ve grid de productos (ProductCard)
   ├─> Click en producto → ProductDetailPage
   └─> Click en "Agregar al carrito"
       │
       ├─> Validación de stock
       ├─> dispatch(addToCart())
       ├─> Modal de confirmación
       └─> Badge del carrito se actualiza

2. VER CARRITO (CartPage)
   │
   ├─> Si está vacío → EmptyCart
   └─> Si tiene items:
       ├─> Lista de productos
       ├─> Actualizar cantidades
       ├─> Eliminar items
       └─> Click en "Proceder al Pago"

3. CHECKOUT (CheckoutPage)
   │
   ├─> Formulario de envío (ShippingForm)
   │   └─> Validación en tiempo real
   │
   ├─> Formulario de pago (PaymentForm)
   │   ├─> Detección de tipo de tarjeta
   │   ├─> Validación de Luhn
   │   └─> Formateo automático
   │
   ├─> Resumen del pedido (OrderSummary)
   │   ├─> Subtotal
   │   ├─> Impuestos (19%)
   │   ├─> Envío
   │   └─> Total
   │
   └─> Click en "Revisar y Pagar"

4. CONFIRMACIÓN (PaymentSummaryModal)
   │
   ├─> Resumen final
   ├─> Click en "Confirmar Pago"
   │   │
   │   ├─> usePaymentProcessing:
   │   │   ├─> Tokenizar tarjeta (Payment Gateway)
   │   │   ├─> Crear transacción (Backend)
   │   │   └─> Backend procesa pago (Payment Gateway)
   │   │
   │   └─> Resultado:
   │       ├─> Éxito → PaymentResultPage
   │       └─> Error → Mostrar mensaje

5. RESULTADO (PaymentResultPage)
   │
   ├─> Estado: APPROVED
   │   ├─> Mensaje de éxito
   │   ├─> Número de transacción
   │   ├─> Resumen del pedido
   │   └─> Botón "Seguir Comprando"
   │
   └─> Estado: ERROR
       ├─> Mensaje de error
       └─> Botón "Reintentar"
```

---

### 2. Flujo de Validación de Formulario

```
Usuario escribe en input
   ↓
handleInputChange
   ↓
Actualiza formData
   ↓
Si es campo de tarjeta:
   ├─> Detecta tipo de tarjeta
   ├─> Formatea número
   └─> Aplica máscara
   ↓
Usuario sale del campo (blur)
   ↓
handleBlur
   ↓
Valida campo:
   ├─> Email: formato RFC 5322
   ├─> Tarjeta: algoritmo de Luhn
   ├─> Fecha: MM/YY válido
   └─> CVV: 3 o 4 dígitos
   ↓
Actualiza fieldErrors
   ↓
Muestra mensaje de error
(si hay error)
```

---

### 3. Flujo de Procesamiento de Pago

```
Usuario confirma pago
   ↓
usePaymentProcessing.processPayment()
   ↓
setIsProcessing(true)
   ↓
┌────────────────────────────────────┐
│  PASO 1: Tokenizar Tarjeta        │
└────────────────────────────────────┘
   ↓
paymentService.tokenizeCard()
   ↓
POST https://api-sandbox.co.uat.payment-gateway.dev/v1/tokens/cards
   {
     number: "4242424242424242",
     cvc: "123",
     exp_month: "12",
     exp_year: "2028",
     card_holder: "Juan Perez"
   }
   ↓
Payment Gateway valida y retorna token
   ↓
token = "tok_stagtest_..."
   ↓
┌────────────────────────────────────┐
│  PASO 2: Crear Transacción        │
└────────────────────────────────────┘
   ↓
paymentService.createTransaction()
   ↓
POST http://localhost:3000/api/transactions
   {
     productId: "...",
     quantity: 1,
     customerEmail: "juan@example.com",
     paymentToken: "tok_stagtest_...",
     firstName: "Juan",
     lastName: "Perez",
     address: "Calle 123",
     city: "Bogotá",
     postalCode: "110111"
   }
   ↓
Backend:
   ├─> Valida producto
   ├─> Crea orden
   ├─> Procesa pago con Payment Gateway
   │   (usando el token)
   └─> Actualiza stock
   ↓
Retorna transacción
   {
     id: "uuid",
     status: "APPROVED",
     amount: 85000,
     wpTransactionId: "15113-...",
     wpReference: "uuid"
   }
   ↓
┌────────────────────────────────────┐
│  PASO 3: Manejar Resultado        │
└────────────────────────────────────┘
   ↓
if (status === 'APPROVED'):
   ├─> dispatch(clearCart())
   ├─> clearSavedData()
   ├─> onSuccess()
   └─> navigate('/payment-result', { state: { transaction } })
else:
   └─> setError(message)
   ↓
setIsProcessing(false)
```

---

## Páginas Principales

### 1. ShopPage

**Ubicación:** `src/pages/ShopPage.tsx`

**Funcionalidad:**
- Carga productos desde el backend
- Grid responsivo (1, 2, 3 o 4 columnas según viewport)
- Navegación a detalle de producto
- Agregar al carrito desde la card

---

### 2. ProductDetailPage

**Ubicación:** `src/pages/ProductDetailPage.tsx`

**Funcionalidad:**
- Muestra detalle completo del producto
- Selector de cantidad
- Validación de stock
- Agregar al carrito con cantidad personalizada

---

### 3. CartPage

**Ubicación:** `src/pages/CartPage.tsx`

**Funcionalidad:**
- Ver items del carrito
- Actualizar cantidades
- Eliminar items
- Calcular totales
- Proceder al checkout

---

### 4. CheckoutPage

**Ubicación:** `src/pages/CheckoutPage.tsx`

**Funcionalidad:**
- Formulario de datos personales
- Formulario de tarjeta de crédito
- Validación completa
- Resumen del pedido
- Procesamiento de pago

---

### 5. PaymentResultPage

**Ubicación:** `src/pages/PaymentResultPage.tsx`

**Funcionalidad:**
- Muestra resultado del pago (éxito/error)
- Detalles de la transacción
- Número de referencia
- Botón para volver a la tienda

--
