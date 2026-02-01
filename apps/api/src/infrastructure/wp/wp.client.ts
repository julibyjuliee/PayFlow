import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  IPaymentGateway,
  PaymentRequest,
  PaymentResponse,
} from '../../domain/repositories/payment-gateway.interface';
import { Result } from '../../shared/result';

/**
 * WP API Client (Adapter)
 * Implementa el puerto IPaymentGateway utilizando la API REST de WP
 * Integración directa con la API de WP
 */
@Injectable()
export class WpClient implements IPaymentGateway {
  private readonly httpClient: AxiosInstance;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integrityKey: string;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('WP_BASE_URL') || 'https://api-sandbox.co.uat.wp.dev/v1';
    this.publicKey = this.configService.get<string>('WP_PUBLIC_KEY') || '';
    this.privateKey = this.configService.get<string>('WP_PRIVATE_KEY') || '';
    this.integrityKey = this.configService.get<string>('WP_INTEGRITY_KEY') || '';

    this.httpClient = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async getAcceptanceToken(): Promise<string> {
    try {
      const response = await this.httpClient.get(`/merchants/${this.publicKey}`);
      const presignedAcceptance = response.data.data.presigned_acceptance;
      const acceptanceToken = presignedAcceptance.acceptance_token;
      return acceptanceToken;
    } catch (error) {
      throw new Error('No se pudo obtener el acceptance token');
    }
  }

  /**
   * Genera la firma de integridad SHA256 requerida por WP
   * Esta firma es obligatoria para todas las transacciones
   * @param reference Referencia única de la transacción
   * @param amountInCents Valor total en centavos
   * @returns Firma SHA256 en formato hex
   */
  private generateIntegritySignature(reference: string, amountInCents: number): string {
    const chain = `${reference}${amountInCents}COP${this.integrityKey}`;
    return crypto.createHash('sha256').update(chain).digest('hex');
  }

  /**
   * Procesa un pago directo (API-to-API)
   */
  async processPayment(
    request: PaymentRequest,
  ): Promise<Result<PaymentResponse, Error>> {
    try {
      // Obtener acceptance_token (requerido por WP)
      const acceptanceToken = await this.getAcceptanceToken();

      const amountInCents = Math.round(request.amount * 100);

      // Generar firma de integridad (requerida por WP para seguridad)
      const integritySignature = this.generateIntegritySignature(
        request.reference,
        amountInCents,
      );

      // Construir el payload según el formato de WP para API directa
      const payload: any = {
        acceptance_token: acceptanceToken,
        amount_in_cents: amountInCents,
        currency: request.currency,
        customer_email: request.customerEmail,
        reference: request.reference,
        redirect_url: `${this.configService.get('APP_URL') || 'http://localhost:5173'}/payment-result`,
        signature: integritySignature,
      };

      if (request.paymentMethod.token) {
        payload.payment_method = {
          type: 'CARD',
          token: request.paymentMethod.token,
          installments: request.paymentMethod.installments || 1,
        };
      } else {
        payload.payment_method = request.paymentMethod;
      }


      const response = await this.httpClient.post(
        '/transactions',
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.privateKey}`,
          },
        },
      );


      const data = response.data.data;
      return Result.ok(this.mapToPaymentResponse(data));
    } catch (error: any) {

      if (error.response?.data?.error?.messages) {
        console.error('📋 Validation Messages:', JSON.stringify(error.response.data.error.messages, null, 2));
      }

      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        'Fallo en el procesamiento del pago';
      return Result.fail(new Error(errorMessage));
    }
  }

  async getTransactionStatus(
    transactionId: string,
  ): Promise<Result<PaymentResponse, Error>> {
    try {
      const response = await this.httpClient.get(
        `/transactions/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.privateKey}`,
          },
        },
      );

      const data = response.data.data;
      return Result.ok(this.mapToPaymentResponse(data));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        'Error al obtener el estado de la transacción';
      return Result.fail(new Error(errorMessage));
    }
  }

  async createPaymentSource(
    cardInfo: any,
  ): Promise<Result<{ id: string; type: string }, Error>> {
    try {
      const response = await this.httpClient.post(
        '/payment_sources',
        cardInfo,
        {
          headers: {
            Authorization: `Bearer ${this.publicKey}`,
          },
        },
      );

      const data = response.data.data;
      return Result.ok({
        id: data.id,
        type: data.type,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        'Error al crear la fuente de pago';
      return Result.fail(new Error(errorMessage));
    }
  }

  async getMerchantInfo(): Promise<Result<any, Error>> {
    try {
      const response = await this.httpClient.get(`/merchants/${this.publicKey}`);
      return Result.ok(response.data.data);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        'Error al obtener información del comercio';
      return Result.fail(new Error(errorMessage));
    }
  }


  private mapToPaymentResponse(data: any): PaymentResponse {
    return {
      id: data.id,
      status: data.status,
      reference: data.reference,
      amount: data.amount_in_cents / 100,
      currency: data.currency,
      paymentMethod: data.payment_method_type || 'CARD',
      createdAt: new Date(data.created_at),
      finalizedAt: data.finalized_at ? new Date(data.finalized_at) : undefined,
    };
  }
}