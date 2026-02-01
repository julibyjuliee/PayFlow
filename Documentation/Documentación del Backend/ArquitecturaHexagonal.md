# Arquitectura Hexagonal en PayFlow

## Índice
1. [Introducción](#introducción)
2. [¿Qué es la Arquitectura Hexagonal?](#qué-es-la-arquitectura-hexagonal)
3. [Implementación en PayFlow](#implementación-en-payflow)
4. [Capas de la Arquitectura](#capas-de-la-arquitectura)
5. [Flujo de Datos](#flujo-de-datos)
6. [Ventajas de esta Arquitectura](#ventajas-de-esta-arquitectura)
7. [Patrones Aplicados](#patrones-aplicados)

---

## Introducción

PayFlow implementa una **Arquitectura Hexagonal** (también conocida como **Ports and Adapters**) en su backend. Esta arquitectura permite mantener el núcleo de negocio independiente de frameworks, bases de datos y servicios externos, facilitando el mantenimiento, testing y evolución del sistema.

## ¿Qué es la Arquitectura Hexagonal?

La Arquitectura Hexagonal, propuesta por Alistair Cockburn, es un patrón arquitectónico que separa las preocupaciones de la aplicación en capas concéntricas:

- **Núcleo (Domain)**: Contiene la lógica de negocio pura, independiente de cualquier tecnología externa.
- **Puertos (Ports)**: Interfaces que definen contratos de comunicación entre capas.
- **Adaptadores (Adapters)**: Implementaciones concretas que conectan el dominio con el mundo exterior.

### Principios Fundamentales

1. **Independencia del Framework**: El dominio no debe depender de NestJS, Express, o cualquier framework.
2. **Testabilidad**: La lógica de negocio puede ser probada sin infraestructura.
3. **Independencia de la UI**: La lógica no depende de REST, GraphQL o cualquier protocolo.
4. **Independencia de la Base de Datos**: El dominio no conoce si usa PostgreSQL, MongoDB, etc.
5. **Separación de Responsabilidades**: Cada capa tiene un propósito claro y definido.

---

## Implementación en PayFlow

### Estructura de Directorios

```
apps/api/src/
├── domain/                    # Capa de Dominio (Núcleo)
│   ├── entities/             # Entidades de dominio
│   │   ├── order.entity.ts
│   │   ├── product.entity.ts
│   │   └── transaction.entity.ts
│   ├── value-objects/        # Objetos de valor
│   │   ├── money.ts
│   │   └── transaction-status.ts
│   └── repositories/         # Puertos (Interfaces)
│       ├── order.repository.interface.ts
│       ├── product.repository.interface.ts
│       ├── transaction.repository.interface.ts
│       └── payment-gateway.interface.ts
│
├── application/              # Capa de Aplicación
│   ├── use-cases/           # Casos de uso
│   │   ├── create-order.use-case.ts
│   │   ├── process-payment.use-case.ts
│   │   ├── get-order.use-case.ts
│   │   └── ...
│   └── dtos/                # Data Transfer Objects
│       ├── create-order.dto.ts
│       ├── order.dto.ts
│       └── ...
│
├── infrastructure/           # Capa de Infraestructura (Adaptadores)
│   ├── database/
│   │   ├── entities/        # Entidades de TypeORM
│   │   ├── repositories/    # Implementaciones de repositorios
│   │   │   ├── order.repository.ts
│   │   │   ├── product.repository.ts
│   │   │   └── transaction.repository.ts
│   │   └── mappers/         # Mappers entre dominio y persistencia
│   │       └── order.mapper.ts
│   └── wp/                 # Adaptador de pasarela de pagos
│       └── wp.client.ts
│
└── presentation/            # Capa de Presentación
    └── controllers/         # Controladores HTTP
        ├── orders.controller.ts
        ├── products.controller.ts
        └── transactions.controller.ts
```

---

## Capas de la Arquitectura

### 1. Capa de Dominio (Domain)

Es el **corazón de la aplicación**. Contiene la lógica de negocio pura y las reglas de dominio.

#### Entidades de Dominio

Las entidades representan conceptos del negocio con identidad propia:

```typescript
// domain/entities/order.entity.ts
export class Order {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly totalPrice: Money,
    private status: TransactionStatusVO,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly address: string,
    public readonly city: string,
    public readonly postalCode: string,
    public readonly customerEmail: string,
    public wpTransactionId?: string,
    public wpReference?: string,
    public paymentMethod?: string,
    public errorMessage?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  // Lógica de negocio
  markAsPending(): void {
    this.status = new TransactionStatusVO(TransactionStatus.PENDING);
  }

  markAsCompleted(
    wpTransactionId: string,
    wpReference: string,
    paymentMethod: string,
  ): void {
    if (this.status.value !== TransactionStatus.PENDING) {
      throw new InvalidTransactionStateException(
        'Solo se pueden completar pedidos pendientes',
      );
    }
    this.status = new TransactionStatusVO(TransactionStatus.COMPLETED);
    this.wpTransactionId = wpTransactionId;
    this.wpReference = wpReference;
    this.paymentMethod = paymentMethod;
  }

  markAsFailed(errorMessage: string): void {
    this.status = new TransactionStatusVO(TransactionStatus.FAILED);
    this.errorMessage = errorMessage;
  }
}
```

#### Value Objects

Objetos sin identidad que representan conceptos del dominio:

```typescript
// domain/value-objects/money.ts
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'COP',
  ) {
    if (amount < 0) {
      throw new Error('El monto no puede ser negativo');
    }
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }
}
```

#### Puertos (Interfaces de Repositorios)

Definen el contrato de comunicación con el exterior:

```typescript
// domain/repositories/order.repository.interface.ts
export interface IOrderRepository {
  findAll(): Promise<Result<Order[], Error>>;
  findById(id: string): Promise<Result<Order, Error>>;
  findByStatus(status: TransactionStatus): Promise<Result<Order[], Error>>;
  save(order: Order): Promise<Result<Order, Error>>;
  update(order: Order): Promise<Result<Order, Error>>;
}
```

```typescript
// domain/repositories/payment-gateway.interface.ts
export interface IPaymentGateway {
  processPayment(request: PaymentRequest): Promise<Result<PaymentResponse, Error>>;
  getTransactionStatus(transactionId: string): Promise<Result<PaymentResponse, Error>>;
  createPaymentSource(cardInfo: any): Promise<Result<{ id: string; type: string }, Error>>;
}
```

**Características clave:**
- ❌ No tiene dependencias externas (no usa NestJS decorators, TypeORM, etc.)
- ✅ Solo lógica de negocio pura
- ✅ Define interfaces (puertos) pero no sus implementaciones
- ✅ Altamente testeable sin infraestructura

---

### 2. Capa de Aplicación (Application)

Orquesta los casos de uso del sistema, coordinando el dominio con los puertos.

#### Casos de Uso (Use Cases)

Representan las intenciones del usuario y orquestan la lógica de negocio:

```typescript
// application/use-cases/create-order.use-case.ts
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(input: {
    productId: string;
    quantity: number;
    shippingAddress: {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      postalCode: string;
    };
    customerEmail: string;
  }): Promise<Result<Order, Error>> {
    // 1. Validar que el producto existe
    const productResult = await this.productRepository.findById(input.productId);
    if (productResult.isFailure()) {
      return Result.fail(productResult.getError());
    }

    const product = productResult.getValue();

    // 2. Calcular el precio total usando lógica de dominio
    const totalPrice = product.price.multiply(input.quantity);

    // 3. Crear la entidad de dominio
    const order = new Order(
      uuidv4(),
      input.productId,
      input.quantity,
      totalPrice,
      new TransactionStatusVO(TransactionStatus.PENDING),
      input.shippingAddress.firstName,
      input.shippingAddress.lastName,
      input.shippingAddress.address,
      input.shippingAddress.city,
      input.shippingAddress.postalCode,
      input.customerEmail,
    );

    // 4. Persistir usando el puerto
    return await this.orderRepository.save(order);
  }
}
```

#### DTOs (Data Transfer Objects)

Definen la estructura de datos para comunicación entre capas:

```typescript
// application/dtos/create-order.dto.ts
export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsNotEmpty()
  @IsEmail()
  customerEmail: string;
}
```

**Características clave:**
- ✅ Coordina la lógica de negocio del dominio
- ✅ No contiene lógica de negocio compleja (esa va en el dominio)
- ✅ Usa inyección de dependencias con interfaces (puertos)
- ✅ Independiente de la infraestructura

---

### 3. Capa de Infraestructura (Infrastructure)

Contiene las **implementaciones concretas** (adaptadores) de los puertos definidos en el dominio.

#### Adaptadores de Repositorios

Implementan los puertos usando tecnologías concretas (TypeORM):

```typescript
// infrastructure/database/repositories/order.repository.ts
@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async findById(id: string): Promise<Result<Order, Error>> {
    try {
      const entity = await this.repository.findOne({ where: { id } });
      if (!entity) {
        return Result.fail(new Error(`Order with id ${id} not found`));
      }
      const order = OrderMapper.toDomain(entity);
      return Result.ok(order);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async save(order: Order): Promise<Result<Order, Error>> {
    try {
      const entity = OrderMapper.toEntity(order);
      const savedEntity = await this.repository.save(entity);
      const savedOrder = OrderMapper.toDomain(savedEntity);
      return Result.ok(savedOrder);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  // ... más métodos
}
```

#### Mappers

Traducen entre entidades de dominio y entidades de persistencia:

```typescript
// infrastructure/database/mappers/order.mapper.ts
export class OrderMapper {
  static toDomain(entity: OrderEntity): Order {
    return new Order(
      entity.id,
      entity.productId,
      entity.quantity,
      new Money(entity.totalAmount, entity.currency),
      new TransactionStatusVO(entity.status as TransactionStatus),
      entity.firstName,
      entity.lastName,
      entity.address,
      entity.city,
      entity.postalCode,
      entity.customerEmail,
      entity.wpTransactionId,
      entity.wpReference,
      entity.paymentMethod,
      entity.errorMessage,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(order: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.id = order.id;
    entity.productId = order.productId;
    entity.quantity = order.quantity;
    entity.totalAmount = order.totalPrice.amount;
    entity.currency = order.totalPrice.currency;
    entity.status = order.getStatus();
    // ... más campos
    return entity;
  }
}
```

#### Adaptadores de Servicios Externos

Implementan puertos para comunicarse con APIs externas:

```typescript
// infrastructure/wp/wp.client.ts
@Injectable()
export class WpClient implements IPaymentGateway {
  private readonly axiosInstance: AxiosInstance;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integritySecret: string;

  constructor(private readonly configService: ConfigService) {
    this.publicKey = this.configService.get<string>('WP_PUBLIC_KEY');
    this.privateKey = this.configService.get<string>('WP_PRIVATE_KEY');
    this.integritySecret = this.configService.get<string>('WP_INTEGRITY_SECRET');
    
    this.axiosInstance = axios.create({
      baseURL: this.configService.get<string>('WP_BASE_URL'),
      headers: {
        'Authorization': `Bearer ${this.privateKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async processPayment(request: PaymentRequest): Promise<Result<PaymentResponse, Error>> {
    try {
      const response = await this.axiosInstance.post('/transactions', {
        acceptance_token: await this.getAcceptanceToken(),
        amount_in_cents: request.amount,
        currency: request.currency,
        customer_email: request.customerEmail,
        reference: request.reference,
        payment_method: request.paymentMethod,
      });

      return Result.ok(this.mapToPaymentResponse(response.data));
    } catch (error) {
      return Result.fail(new Error(`Payment processing failed: ${error.message}`));
    }
  }

  // ... más métodos
}
```

**Características clave:**
- ✅ Implementa los puertos definidos en el dominio
- ✅ Conoce tecnologías específicas (TypeORM, Axios, etc.)
- ✅ Puede ser reemplazado sin afectar el dominio
- ✅ Los mappers mantienen aislado el dominio de la persistencia

---

### 4. Capa de Presentación (Presentation)

Expone la funcionalidad a través de interfaces externas (HTTP REST en este caso).

#### Controladores

```typescript
// presentation/controllers/orders.controller.ts
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly processOrderPaymentUseCase: ProcessOrderPaymentUseCase,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderDto> {
    const result = await this.createOrderUseCase.execute({
      productId: createOrderDto.productId,
      quantity: createOrderDto.quantity,
      shippingAddress: createOrderDto.shippingAddress,
      customerEmail: createOrderDto.customerEmail,
    });

    if (result.isFailure()) {
      throw new HttpException(
        result.getError().message,
        HttpStatus.BAD_REQUEST,
      );
    }

    const order = result.getValue();
    return {
      id: order.id,
      productId: order.productId,
      quantity: order.quantity,
      totalPrice: order.totalPrice.amount,
      currency: order.totalPrice.currency,
      status: order.getStatus(),
      // ... más campos
    };
  }

  @Get(':id')
  async getOrder(@Param('id') id: string): Promise<OrderDto> {
    const result = await this.getOrderUseCase.execute(id);
    
    if (result.isFailure()) {
      throw new HttpException(
        result.getError().message,
        HttpStatus.NOT_FOUND,
      );
    }

    const order = result.getValue();
    return this.mapToDto(order);
  }

  // ... más endpoints
}
```

**Características clave:**
- ✅ Solo maneja HTTP concerns (validación, status codes, serialización)
- ✅ Delega toda la lógica a los casos de uso
- ✅ Traduce entre DTOs y respuestas HTTP
- ✅ Maneja errores y convierte a códigos HTTP apropiados

---

## Flujo de Datos

### Ejemplo: Crear una Orden

```
┌──────────────┐
│   Cliente    │
│   (HTTP)     │
└──────┬───────┘
       │ POST /orders
       │ { productId, quantity, ... }
       ▼
┌──────────────────────────────────────────────────────┐
│           Capa de Presentación                       │
│  ┌────────────────────────────────────────┐         │
│  │   OrdersController.createOrder()       │         │
│  │   - Recibe CreateOrderDto              │         │
│  │   - Valida con ValidationPipe          │         │
│  └───────────────┬────────────────────────┘         │
└────────────────────┼──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│           Capa de Aplicación                         │
│  ┌────────────────────────────────────────┐         │
│  │   CreateOrderUseCase.execute()         │         │
│  │   - Valida producto (IProductRepo)     │─────┐   │
│  │   - Calcula precio (Domain)            │     │   │
│  │   - Crea Order entity (Domain)         │     │   │
│  │   - Persiste orden (IOrderRepo)        │─────┤   │
│  └────────────────────────────────────────┘     │   │
└────────────────────────────────────────────────────────┘
                                                   │
                    ┌──────────────────────────────┤
                    │                              │
                    ▼                              ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│    Capa de Dominio           │  │   Capa de Infraestructura    │
│  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │
│  │  Order Entity          │  │  │  │  ProductRepository     │  │
│  │  - markAsPending()     │  │  │  │  - findById()          │  │
│  │  - totalPrice.multiply │  │  │  │    (TypeORM)           │  │
│  └────────────────────────┘  │  │  └────────────────────────┘  │
│                               │  │                               │
│  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │
│  │  IOrderRepository      │◄─┼──┼──┤  OrderRepository       │  │
│  │  (Puerto/Interface)    │  │  │  │  - save()              │  │
│  └────────────────────────┘  │  │  │    (TypeORM)           │  │
│                               │  │  │  - OrderMapper         │  │
└───────────────────────────────┘  │  └────────────┬───────────┘  │
                                   └───────────────┼──────────────┘
                                                   │
                                                   ▼
                                         ┌──────────────────┐
                                         │   PostgreSQL     │
                                         │   (Base de Datos)│
                                         └──────────────────┘
```

### Flujo de Dependencias

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    Presentación                              │
│                   (Controllers)                              │
│                         │                                    │
│                         ▼                                    │
│                    Aplicación                                │
│                   (Use Cases)                                │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Dominio (Core)                          │  │
│  │  ┌─────────────┐         ┌──────────────────┐       │  │
│  │  │  Entities   │         │  Puertos         │       │  │
│  │  │  - Order    │         │  (Interfaces)    │       │  │
│  │  │  - Product  │         │  - IOrderRepo    │       │  │
│  │  └─────────────┘         │  - IPaymentGW    │       │  │
│  │                          └──────────────────┘       │  │
│  └────────────────────────────┬─────────────────────────┘  │
│                         ▲     │                            │
│                         │     │                            │
│                         │     ▼                            │
│                    Infraestructura                         │
│                   (Adaptadores)                            │
│              - OrderRepository (TypeORM)                   │
│              - WPClient (HTTP)                          │
│                                                            │
└────────────────────────────────────────────────────────────┘

         Las flechas apuntan hacia el dominio
         (Dependency Inversion Principle)
```

**Nota importante:** Las dependencias siempre apuntan hacia el dominio. La infraestructura **depende** del dominio (implementa sus interfaces), pero el dominio **NO depende** de la infraestructura.

---

## Ventajas de esta Arquitectura

### 1. **Testabilidad**
- Podemos testear la lógica de negocio sin infraestructura
- Los tests son rápidos y confiables
- Facilita TDD (Test-Driven Development)

### 2. **Mantenibilidad**
- Código organizado y fácil de entender
- Cambios aislados en una capa no afectan otras
- Facilita onboarding de nuevos desarrolladores

### 3. **Flexibilidad**
- Cambiar tecnologías sin afectar el negocio
- Soportar múltiples interfaces (REST, GraphQL, CLI)
- Reemplazar servicios externos fácilmente

### 4. **Independencia de Frameworks**
- El dominio no depende de NestJS
- Podríamos migrar a Express, Fastify, etc.
- El negocio está protegido de cambios tecnológicos

### 5. **Escalabilidad**
- Fácil agregar nuevas funcionalidades
- Permite crecer el equipo organizadamente
- Facilita microservicios si es necesario

### 6. **Cumplimiento de SOLID**
- **S**ingle Responsibility: Cada clase tiene una responsabilidad
- **O**pen/Closed: Abierto a extensión, cerrado a modificación
- **L**iskov Substitution: Los adaptadores son intercambiables
- **I**nterface Segregation: Interfaces pequeñas y específicas
- **D**ependency Inversion: Dependencias apuntan al dominio

---

## Patrones Aplicados

### 1. **Ports and Adapters**
- **Puertos:** Interfaces en `domain/repositories/`
- **Adaptadores:** Implementaciones en `infrastructure/`

### 2. **Dependency Injection**
```typescript
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject('IOrderRepository')  // Inyecta la interfaz, no la implementación
    private readonly orderRepository: IOrderRepository,
  ) {}
}
```

### 3. **Repository Pattern**
- Abstrae el acceso a datos
- Permite cambiar el storage sin afectar el dominio

### 4. **Mapper Pattern**
- Traduce entre capas
- Mantiene aisladas las representaciones de datos

### 5. **Use Case Pattern**
- Cada caso de uso es una clase
- Representa una intención del usuario
- Orquesta el dominio

### 6. **Result Pattern**
```typescript
export class Result<T, E extends Error> {
  private constructor(
    private readonly value?: T,
    private readonly error?: E,
  ) {}

  static ok<T, E extends Error>(value: T): Result<T, E> {
    return new Result(value);
  }

  static fail<T, E extends Error>(error: E): Result<T, E> {
    return new Result(undefined, error);
  }

  isSuccess(): boolean {
    return this.error === undefined;
  }

  isFailure(): boolean {
    return this.error !== undefined;
  }

  getValue(): T {
    if (this.error) {
      throw new Error('Cannot get value of a failed result');
    }
    return this.value!;
  }

  getError(): E {
    return this.error!;
  }
}
```

Este patrón evita usar excepciones para control de flujo y hace explícito el manejo de errores.

### 7. **Value Objects**
- Inmutables
- Validación en el constructor
- Representan conceptos del dominio sin identidad

---

## Configuración de Inyección de Dependencias

En `app.module.ts`, configuramos los providers para inyectar implementaciones:

```typescript
const orderRepositoryProvider = {
  provide: 'IOrderRepository',      // Token (nombre de la interfaz)
  useClass: OrderRepository,        // Implementación concreta
};

const paymentGatewayProvider = {
  provide: 'IPaymentGateway',
  useClass: WPClient,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, OrderEntity]),
  ],
  providers: [
    // Providers de repositorios
    orderRepositoryProvider,
    productRepositoryProvider,
    paymentGatewayProvider,
    
    // Implementaciones concretas (para cuando se inyectan directamente)
    OrderRepository,
    ProductRepository,
    WPClient,
    
    // Casos de uso
    CreateOrderUseCase,
    ProcessPaymentUseCase,
    GetOrderUseCase,
  ],
  controllers: [OrdersController, ProductsController],
})
export class AppModule {}
```