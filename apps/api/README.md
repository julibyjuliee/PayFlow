# PayFlow API - Wompi Payment Integration

A complete payment flow system built with NestJS following Hexagonal Architecture and Railway Oriented Programming patterns, integrated with Wompi payment gateway.

## Architecture

This project implements **Hexagonal Architecture** (Ports & Adapters) with the following layers:

```
src/
├── domain/                 # Domain Layer (Business Logic)
│   ├── entities/          # Domain entities (Product, Transaction)
│   ├── value-objects/     # Value objects (Money, TransactionStatus)
│   └── repositories/      # Repository interfaces (Ports)
├── application/           # Application Layer
│   ├── use-cases/        # Use cases with Railway Oriented Programming
│   └── dtos/             # Data Transfer Objects
├── infrastructure/        # Infrastructure Layer (Adapters)
│   ├── database/         # TypeORM repositories & entities
│   └── wompi/            # Wompi API client
├── presentation/          # Presentation Layer
│   └── controllers/      # HTTP controllers
└── shared/               # Shared utilities
    ├── result/           # Result type for ROP
    ├── exceptions/       # Domain exceptions
    └── filters/          # Global exception filters
```

## Features

- **Hexagonal Architecture**: Clean separation of concerns with ports and adapters
- **Railway Oriented Programming**: Error handling using Result types
- **Wompi Integration**: Full payment processing with Wompi sandbox
- **TypeORM**: SQLite database with automatic migrations
- **Validation**: Request validation using class-validator
- **Database Seeding**: Automatic seeding with 10 dummy products
- **CORS Enabled**: Ready for frontend integration
- **Global Error Handling**: Consistent error responses

## Installation

```bash
npm install
```

## Configuration

The `.env` file is already configured with Wompi sandbox credentials:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DB_TYPE=sqlite
DB_DATABASE=payflow.db

# Wompi API Configuration (Sandbox)
WP_BASE_URL=https://api-sandbox.co.uat.wompi.dev/v1
WP_PUBLIC_KEY=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7
WP_PRIVATE_KEY=prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg
```

## Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3000/api`

## API Endpoints

### Products

#### Get All Products
```bash
GET /api/products
```

**Response:**
```json
[
  {
    "id": "1",
    "name": "Premium Wireless Headphones",
    "description": "High-quality wireless headphones...",
    "price": 299.99,
    "currency": "COP",
    "stock": 50,
    "imageUrl": "https://...",
    "createdAt": "2026-01-30T19:14:58.000Z",
    "updatedAt": "2026-01-30T19:14:58.000Z"
  }
]
```

#### Get Product by ID
```bash
GET /api/products/:id
```

### Transactions

#### Create Transaction
Creates a new transaction in PENDING state.

```bash
POST /api/transactions
Content-Type: application/json

{
  "productId": "1",
  "quantity": 2,
  "customerEmail": "customer@example.com"
}
```

**Response:**
```json
{
  "id": "uuid-transaction-id",
  "productId": "1",
  "quantity": 2,
  "amount": 599.98,
  "currency": "COP",
  "status": "PENDING",
  "customerEmail": "customer@example.com",
  "createdAt": "2026-01-30T19:15:54.811Z"
}
```

#### Get Transaction
```bash
GET /api/transactions/:id
```

#### Process Payment
Processes payment through Wompi API and updates transaction status.

```bash
POST /api/transactions/process-payment
Content-Type: application/json

{
  "transactionId": "uuid-transaction-id",
  "paymentMethod": {
    "type": "CARD",
    "token": "payment-token-from-wompi",
    "installments": 1
  }
}
```

## Payment Flow

The complete payment flow follows these steps:

1. **User selects a product and quantity** - `GET /api/products`
2. **Create transaction in PENDING state** - `POST /api/transactions`
3. **Process payment with Wompi** - `POST /api/transactions/process-payment`
4. **System automatically:**
   - Calls Wompi API to process payment
   - Updates transaction status (APPROVED/DECLINED/ERROR)
   - If APPROVED: Decreases product stock
   - Returns updated transaction to client

## Business Logic

### Domain Rules

**Product Entity:**
- Stock cannot be negative
- Cannot sell more than available stock
- Automatically calculates total price

**Transaction Entity:**
- Created in PENDING state
- Can only transition from PENDING to other states
- Final states (APPROVED, DECLINED, VOIDED) cannot transition

### Railway Oriented Programming

All use cases follow ROP pattern using `Result<T, E>` type for error handling.

## Transaction States

- **PENDING**: Initial state after creation
- **APPROVED**: Payment successful, stock updated
- **DECLINED**: Payment declined by Wompi
- **ERROR**: Payment processing error
- **VOIDED**: Transaction cancelled

## Database

### Seeded Products

The database is automatically seeded with 10 products including headphones, smartwatches, and various tech accessories.

### Reset Database

To reset the database:

```bash
rm payflow.db
npm run dev
```

## Technologies

- **NestJS** - Backend framework
- **TypeScript** - Type-safe development
- **TypeORM** - ORM for database access
- **SQLite** - Development database
- **class-validator** - DTO validation
- **Axios** - HTTP client for Wompi API
- **Wompi** - Payment gateway integration

## License

UNLICENSED
