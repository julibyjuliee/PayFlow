import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ProductEntity, OrderEntity } from '../infrastructure/database/entities';

export const databaseConfig = (): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    url: process.env.DB_URL,
    entities: [ProductEntity, OrderEntity],
    logging: process.env.NODE_ENV === 'development',
    ssl: { rejectUnauthorized: false },
  }
};
