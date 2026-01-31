import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  GetProductsUseCase,
  GetProductByIdUseCase,
} from '../../application/use-cases';
import { ProductDto } from '../../application/dtos';

/**
 * Products Controller
 * Handles product-related HTTP requests
 */
@Controller('products')
export class ProductsController {
  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get()
  async getAllProducts(): Promise<ProductDto[]> {
    const result = await this.getProductsUseCase.execute();

    if (result.isFailure()) {
      throw new HttpException(
        result.getError().message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return result.getValue().map((product) => product.toJSON());
  }

  @Get(':id')
  async getProductById(@Param('id') id: string): Promise<ProductDto> {
    const result = await this.getProductByIdUseCase.execute(id);
    if (result.isFailure()) {
      throw new HttpException(
        result.getError().message,
        HttpStatus.NOT_FOUND,
      );
    }

    return result.getValue().toJSON();
  }
}
