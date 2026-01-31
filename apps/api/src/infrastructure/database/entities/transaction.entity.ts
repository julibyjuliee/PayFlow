import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

/**
 * Order TypeORM Entity (Infrastructure)
 * Maps the domain Order entity to the database
 * Matches Supabase 'orders' table structure
 */
@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, name: 'product_id' })
  productId?: string;

  @Column('text', { name: 'first_name' })
  firstName: string;

  @Column('text', { name: 'last_name' })
  lastName: string;

  @Column('text')
  address: string;

  @Column('text')
  city: string;

  @Column('text', { name: 'postal_code' })
  postalCode: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @Column({ type: 'text', default: 'pending' })
  status: string;

  // Campos adicionales para Wompi (agregados en Supabase)
  @Column({ type: 'text', nullable: true, name: 'customer_email' })
  customerEmail?: string;

  @Column({ type: 'text', nullable: true, name: 'wompi_transaction_id' })
  wompiTransactionId?: string;

  @Column({ type: 'text', nullable: true, name: 'wompi_reference' })
  wompiReference?: string;

  @Column({ type: 'text', nullable: true, name: 'payment_method' })
  paymentMethod?: string;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;
}
