# Documentación de Endpoints - PayFlow API

## Índice
1. [Información General](#información-general)
2. [Products](#products-productos)
3. [Transactions](#transactions-transacciones)

---

## Información General

### Base URL
```
http://localhost:3000/api
```

### Configuración Global
- **Prefijo Global:** `/api`
- **CORS:** Habilitado
- **Validación:** Habilitada con `ValidationPipe`
- **Puerto por defecto:** `3000`

### Respuestas Comunes

#### Código de Estados HTTP
- `200 OK` - Solicitud exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Datos inválidos o error en la solicitud
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error interno del servidor

#### Formato de Error
```json
{
  "statusCode": 400,
  "message": "Descripción del error",
  "timestamp": "2026-02-01T14:00:00.000Z",
  "path": "/api/endpoint"
}
```

---

## Products (Productos)

### 1. Obtener Todos los Productos

Obtiene la lista completa de productos disponibles en el catálogo.

**Endpoint:**
```
GET /api/products
```

**Descripción:**
- Retorna todos los productos disponibles
- No requiere autenticación
- Sin parámetros de entrada

**Colección de postman:**
```json
curl --location 'https://api-production-home-decor.up.railway.app/api/products' \
--header 'accept: */*' \
--header 'accept-language: es-419,es;q=0.9,es-ES;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5,es-CO;q=0.4' \
--header 'if-none-match: W/"a40-/gTrh9IczEucXsw07TwerB6Hkys"' \
--header 'origin: https://studiohomedecor.up.railway.app' \
--header 'priority: u=1, i' \
--header 'referer: https://studiohomedecor.up.railway.app/' \
--header 'sec-ch-ua: "Not(A:Brand";v="8", "Chromium";v="144", "Microsoft Edge";v="144"' \
--header 'sec-ch-ua-mobile: ?0' \
--header 'sec-ch-ua-platform: "macOS"' \
--header 'sec-fetch-dest: empty' \
--header 'sec-fetch-mode: cors' \
--header 'sec-fetch-site: cross-site' \
--header 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0' \
--header 'Cache-Control: no-cache'
```
**Respuesta Exitosa (200 OK):**
```json
[
    {
        "id": "81774d07-acea-4e4f-b3a2-7b09d2103943",
        "name": "Reloj de Pared Industrial",
        "price": "85600.00",
        "category": "Pared",
        "description": "Reloj de metal con engranajes a la vista. Estilo vintage loft.",
        "stock": 0,
        "imageUrl": "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c",
        "createdAt": "2026-01-30T22:08:31.550Z"
    },
    {
        "id": "56a31084-bfc6-48d3-800a-1d6cff467ea5",
        "name": "Alfombra Geométrica Gris",
        "price": "406050.00",
        "category": "Textil",
        "description": "Alfombra de 2x3 metros tejida en fibras sintéticas de fácil limpieza.",
        "stock": 0,
        "imageUrl": "https://images.unsplash.com/photo-1531835551805-16d864c8d311",
        "createdAt": "2026-01-30T22:08:31.550Z"
    },
]
```

---

### 2. Obtener Producto por ID

Obtiene los detalles de un producto específico mediante su identificador único.

**Endpoint:**
```
GET /api/products/:id
```

**Parámetros de Ruta:**
| Parámetro | Tipo   | Descripción                    |
|-----------|--------|--------------------------------|
| `id`      | string | UUID del producto a consultar  |

**Descripción:**
- Retorna información detallada de un producto específico
- Valida que el producto exista

**Colección de postman:**
```json
curl --location 'https://api-production-home-decor.up.railway.app/api/products/81774d07-acea-4e4f-b3a2-7b09d2103943' \
--header 'accept: */*' \
--header 'accept-language: es-419,es;q=0.9,es-ES;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5,es-CO;q=0.4' \
--header 'if-none-match: W/"a40-/gTrh9IczEucXsw07TwerB6Hkys"' \
--header 'origin: https://studiohomedecor.up.railway.app' \
--header 'priority: u=1, i' \
--header 'referer: https://studiohomedecor.up.railway.app/' \
--header 'sec-ch-ua: "Not(A:Brand";v="8", "Chromium";v="144", "Microsoft Edge";v="144"' \
--header 'sec-ch-ua-mobile: ?0' \
--header 'sec-ch-ua-platform: "macOS"' \
--header 'sec-fetch-dest: empty' \
--header 'sec-fetch-mode: cors' \
--header 'sec-fetch-site: cross-site' \
--header 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0' \
--header 'Cache-Control: no-cache'
```

**Respuesta Exitosa (200 OK):**
```json
{
    "id": "81774d07-acea-4e4f-b3a2-7b09d2103943",
    "name": "Reloj de Pared Industrial",
    "price": "85600.00",
    "category": "Pared",
    "description": "Reloj de metal con engranajes a la vista. Estilo vintage loft.",
    "stock": 0,
    "imageUrl": "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c",
    "createdAt": "2026-01-30T22:08:31.550Z"
}
```

---

## Transactions (Transacciones)

### 1. Crear Transacción

Crea una nueva transacción con la información del cliente y opcionalmente procesa el pago inmediatamente si se proporciona un token de pago.

**Endpoint:**
```
POST /api/transactions
```

**Descripción:**
- Crea una transacción (orden) con estado `PENDING`
- Si se proporciona `paymentToken`, procesa el pago automáticamente
- Valida la existencia del producto y calcula el precio total
- Genera una referencia única para la transacción

**Body (JSON):**
```json
{
    "productId": "b0cc5ae9-498f-43ad-b7b9-c24850e8612a",
    "quantity": 1,
    "customerEmail": "jurigo2003@gmail.com",
    "paymentToken": "tok_stagtest_5113_9f0076b06041fe5D969248d061cEf73c",
    "firstName": "ssdsd",
    "lastName": "asasds",
    "address": "av 42",
    "city": "niquia",
    "postalCode": "05105"
}
```

**Colección de postman:**
```json

curl --location 'https://api-production-home-decor.up.railway.app/api/transactions' \
--header 'Accept: */*' \
--header 'Accept-Language: es-419,es;q=0.9,es-ES;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5,es-CO;q=0.4' \
--header 'Connection: keep-alive' \
--header 'Content-Type: application/json' \
--header 'Origin: http://localhost:8080' \
--header 'Referer: http://localhost:8080/' \
--header 'Sec-Fetch-Dest: empty' \
--header 'Sec-Fetch-Mode: cors' \
--header 'Sec-Fetch-Site: same-site' \
--header 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0' \
--header 'sec-ch-ua: "Not(A:Brand";v="8", "Chromium";v="144", "Microsoft Edge";v="144"' \
--header 'sec-ch-ua-mobile: ?0' \
--header 'sec-ch-ua-platform: "macOS"' \
--data-raw '{
    "productId": "b0cc5ae9-498f-43ad-b7b9-c24850e8612a",
    "quantity": 1,
    "customerEmail": "jurigo2003@gmail.com",
    "paymentToken": "tok_stagtest_5113_9f0076b06041fe5D969248d061cEf73c",
    "firstName": "ssdsd",
    "lastName": "asasds",
    "address": "av 42",
    "city": "niquia",
    "postalCode": "05105"
}'
```
**Validaciones:**
| Campo           | Tipo   | Requerido | Validación                              |
|-----------------|--------|-----------|------------------------------------------|
| `productId`     | string | Sí        | UUID válido                              |
| `quantity`      | number | Sí        | Número entero mayor a 0                  |
| `customerEmail` | string | Sí        | Email válido                             |
| `firstName`     | string | Sí        | String no vacío                          |
| `lastName`      | string | Sí        | String no vacío                          |
| `address`       | string | Sí        | String no vacío                          |
| `city`          | string | Sí        | String no vacío                          |
| `postalCode`    | string | Sí        | String no vacío                          |
| `paymentToken`  | string | No        | Token de pago de Payment Gateway (opcional)        |


**Respuesta Exitosa (200 OK):**
```json
{
    "id": "9c298d98-29d1-4bb2-a2c7-41f81776c6b5",
    "productId": "b0cc5ae9-498f-43ad-b7b9-c24850e8612a",
    "quantity": 1,
    "amount": 85000,
    "currency": "COP",
    "status": "APPROVED",
    "customerEmail": "jurigo2003@gmail.com",
    "firstName": "ssdsd",
    "lastName": "asasds",
    "address": "av 42",
    "city": "niquia",
    "postalCode": "05105",
    "wpTransactionId": "15113-1769963936-10961",
    "wpReference": "9c298d98-29d1-4bb2-a2c7-41f81776c6b5",
    "createdAt": "2026-02-01T16:38:54.415Z",
    "updatedAt": "2026-02-01T16:38:58.282Z"
}
```