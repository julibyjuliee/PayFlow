/**
 * @jest-environment jsdom
 */

import { ConfigService } from '@nestjs/config';
import { WompiClient } from './wompi.client';
import axios from 'axios';

// Mock de axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WompiClient', () => {
    let wompiClient: WompiClient;
    let configService: jest.Mocked<ConfigService>;
    let mockAxiosInstance: any;

    beforeEach(() => {
        // Mock de la instancia de axios
        mockAxiosInstance = {
            get: jest.fn(),
            post: jest.fn(),
        };

        mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

        // Mock del ConfigService
        configService = {
            get: jest.fn((key: string) => {
                const config: { [key: string]: string } = {
                    WP_BASE_URL: 'https://api-sandbox.co.uat.wompi.dev/v1',
                    WP_PUBLIC_KEY: 'pub_test_123456',
                    WP_PRIVATE_KEY: 'prv_test_123456',
                    APP_URL: 'http://localhost:5173',
                };
                return config[key];
            }),
        } as any;

        wompiClient = new WompiClient(configService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create WompiClient instance with correct configuration', () => {
            expect(wompiClient).toBeDefined();
            expect(mockedAxios.create).toHaveBeenCalledWith({
                baseURL: 'https://api-sandbox.co.uat.wompi.dev/v1',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        });

        it('should use default values when config is not provided', () => {
            const emptyConfigService = {
                get: jest.fn().mockReturnValue(undefined),
            } as any;

            new WompiClient(emptyConfigService);

            expect(mockedAxios.create).toHaveBeenCalledWith({
                baseURL: 'https://api-sandbox.co.uat.wompi.dev/v1',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        });
    });

    describe('processPayment', () => {
        const mockPaymentRequest = {
            amount: 1000,
            currency: 'COP',
            customerEmail: 'test@example.com',
            reference: 'ref-123',
            paymentMethod: {
                type: 'CARD',
                token: 'tok_test_12345',
                installments: 1,
            },
        };

        const mockAcceptanceTokenResponse = {
            data: {
                data: {
                    presigned_acceptance: {
                        acceptance_token: 'acceptance_token_123',
                    },
                },
            },
        };

        const mockTransactionResponse = {
            data: {
                data: {
                    id: 'wompi-trans-123',
                    status: 'APPROVED',
                    reference: 'ref-123',
                    amount_in_cents: 100000,
                    currency: 'COP',
                    payment_method_type: 'CARD',
                    created_at: '2024-01-01T00:00:00Z',
                    finalized_at: '2024-01-01T00:01:00Z',
                },
            },
        };

        it('should process payment successfully with card token', async () => {
            mockAxiosInstance.get.mockResolvedValue(mockAcceptanceTokenResponse);
            mockAxiosInstance.post.mockResolvedValue(mockTransactionResponse);

            const result = await wompiClient.processPayment(mockPaymentRequest);

            expect(result.isSuccess()).toBe(true);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(
                '/merchants/pub_test_123456',
            );
            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/transactions',
                expect.objectContaining({
                    acceptance_token: 'acceptance_token_123',
                    amount_in_cents: 100000,
                    currency: 'COP',
                    customer_email: 'test@example.com',
                    reference: 'ref-123',
                    redirect_url: 'http://localhost:5173',
                    signature: expect.any(String),
                    payment_method: {
                        type: 'CARD',
                        token: 'tok_test_12345',
                        installments: 1,
                    },
                }),
                expect.objectContaining({
                    headers: {
                        Authorization: 'Bearer prv_test_123456',
                    },
                }),
            );

            const paymentResponse = result.getValue();
            expect(paymentResponse.id).toBe('wompi-trans-123');
            expect(paymentResponse.status).toBe('APPROVED');
            expect(paymentResponse.amount).toBe(1000);
        });

        it('should process payment without payment method token', async () => {
            const requestWithoutToken = {
                ...mockPaymentRequest,
                paymentMethod: {
                    type: 'NEQUI',
                    phoneNumber: '3001234567',
                },
            };

            mockAxiosInstance.get.mockResolvedValue(mockAcceptanceTokenResponse);
            mockAxiosInstance.post.mockResolvedValue(mockTransactionResponse);

            const result = await wompiClient.processPayment(requestWithoutToken);

            expect(result.isSuccess()).toBe(true);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/transactions',
                expect.objectContaining({
                    payment_method: {
                        type: 'NEQUI',
                        phoneNumber: '3001234567',
                    },
                }),
                expect.any(Object),
            );
        });

        it('should handle payment processing errors', async () => {
            mockAxiosInstance.get.mockResolvedValue(mockAcceptanceTokenResponse);
            mockAxiosInstance.post.mockRejectedValue({
                response: {
                    data: {
                        error: {
                            message: 'Payment declined by issuer',
                        },
                    },
                },
            });

            const result = await wompiClient.processPayment(mockPaymentRequest);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Payment declined by issuer');
        });

        it('should handle acceptance token fetch errors', async () => {
            mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

            const result = await wompiClient.processPayment(mockPaymentRequest);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe(
                'No se pudo obtener el acceptance token',
            );
        });

        it('should log validation messages when available', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            mockAxiosInstance.get.mockResolvedValue(mockAcceptanceTokenResponse);
            mockAxiosInstance.post.mockRejectedValue({
                response: {
                    data: {
                        error: {
                            message: 'Validation error',
                            messages: {
                                amount_in_cents: ['Must be greater than 0'],
                                customer_email: ['Invalid email format'],
                            },
                        },
                    },
                },
            });

            await wompiClient.processPayment(mockPaymentRequest);

            expect(consoleSpy).toHaveBeenCalledWith(
                '📋 Validation Messages:',
                expect.any(String),
            );

            consoleSpy.mockRestore();
        });

        it('should use default error message when no specific message is provided', async () => {
            mockAxiosInstance.get.mockResolvedValue(mockAcceptanceTokenResponse);
            mockAxiosInstance.post.mockRejectedValue(new Error());

            const result = await wompiClient.processPayment(mockPaymentRequest);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe(
                'Fallo en el procesamiento del pago',
            );
        });

        it('should correctly convert amount to cents', async () => {
            const requestWithDecimal = {
                ...mockPaymentRequest,
                amount: 1234.56,
            };

            mockAxiosInstance.get.mockResolvedValue(mockAcceptanceTokenResponse);
            mockAxiosInstance.post.mockResolvedValue(mockTransactionResponse);

            await wompiClient.processPayment(requestWithDecimal);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/transactions',
                expect.objectContaining({
                    amount_in_cents: 123456,
                }),
                expect.any(Object),
            );
        });
    });

    describe('getTransactionStatus', () => {
        const mockStatusResponse = {
            data: {
                data: {
                    id: 'wompi-trans-123',
                    status: 'APPROVED',
                    reference: 'ref-123',
                    amount_in_cents: 100000,
                    currency: 'COP',
                    payment_method_type: 'CARD',
                    created_at: '2024-01-01T00:00:00Z',
                    finalized_at: '2024-01-01T00:01:00Z',
                },
            },
        };

        it('should get transaction status successfully', async () => {
            mockAxiosInstance.get.mockResolvedValue(mockStatusResponse);

            const result = await wompiClient.getTransactionStatus('wompi-trans-123');

            expect(result.isSuccess()).toBe(true);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(
                '/transactions/wompi-trans-123',
                {
                    headers: {
                        Authorization: 'Bearer prv_test_123456',
                    },
                },
            );

            const transaction = result.getValue();
            expect(transaction.id).toBe('wompi-trans-123');
            expect(transaction.status).toBe('APPROVED');
            expect(transaction.amount).toBe(1000);
        });

        it('should handle transaction not found error', async () => {
            mockAxiosInstance.get.mockRejectedValue({
                response: {
                    data: {
                        error: {
                            message: 'Transaction not found',
                        },
                    },
                },
            });

            const result = await wompiClient.getTransactionStatus('invalid-id');

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Transaction not found');
        });

        it('should use default error message when no specific message is provided', async () => {
            mockAxiosInstance.get.mockRejectedValue(new Error());

            const result = await wompiClient.getTransactionStatus('trans-123');

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe(
                'Error al obtener el estado de la transacción',
            );
        });
    });

    describe('createPaymentSource', () => {
        const mockCardInfo = {
            type: 'CARD',
            number: '4242424242424242',
            exp_month: '12',
            exp_year: '2025',
            cvc: '123',
            card_holder: 'John Doe',
        };

        const mockPaymentSourceResponse = {
            data: {
                data: {
                    id: 'source-123',
                    type: 'CARD',
                },
            },
        };

        it('should create payment source successfully', async () => {
            mockAxiosInstance.post.mockResolvedValue(mockPaymentSourceResponse);

            const result = await wompiClient.createPaymentSource(mockCardInfo);

            expect(result.isSuccess()).toBe(true);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith(
                '/payment_sources',
                mockCardInfo,
                {
                    headers: {
                        Authorization: 'Bearer pub_test_123456',
                    },
                },
            );

            const source = result.getValue();
            expect(source.id).toBe('source-123');
            expect(source.type).toBe('CARD');
        });

        it('should handle payment source creation errors', async () => {
            mockAxiosInstance.post.mockRejectedValue({
                response: {
                    data: {
                        error: {
                            message: 'Invalid card number',
                        },
                    },
                },
            });

            const result = await wompiClient.createPaymentSource(mockCardInfo);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Invalid card number');
        });

        it('should use default error message when no specific message is provided', async () => {
            mockAxiosInstance.post.mockRejectedValue(new Error());

            const result = await wompiClient.createPaymentSource(mockCardInfo);

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe(
                'Error al crear la fuente de pago',
            );
        });
    });

    describe('getMerchantInfo', () => {
        const mockMerchantResponse = {
            data: {
                data: {
                    id: 'merchant-123',
                    name: 'Test Merchant',
                    presigned_acceptance: {
                        acceptance_token: 'token-123',
                        permalink: 'https://wompi.co/terms',
                        type: 'END_USER_POLICY',
                    },
                },
            },
        };

        it('should get merchant info successfully', async () => {
            mockAxiosInstance.get.mockResolvedValue(mockMerchantResponse);

            const result = await wompiClient.getMerchantInfo();

            expect(result.isSuccess()).toBe(true);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith(
                '/merchants/pub_test_123456',
            );

            const merchantInfo = result.getValue();
            expect(merchantInfo.id).toBe('merchant-123');
            expect(merchantInfo.name).toBe('Test Merchant');
        });

        it('should handle merchant info fetch errors', async () => {
            mockAxiosInstance.get.mockRejectedValue({
                response: {
                    data: {
                        error: {
                            message: 'Merchant not found',
                        },
                    },
                },
            });

            const result = await wompiClient.getMerchantInfo();

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe('Merchant not found');
        });

        it('should use default error message when no specific message is provided', async () => {
            mockAxiosInstance.get.mockRejectedValue(new Error());

            const result = await wompiClient.getMerchantInfo();

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe(
                'Error al obtener información del comercio',
            );
        });
    });

    describe('mapToPaymentResponse', () => {
        it('should correctly map Wompi response to PaymentResponse', async () => {
            const mockTransactionResponse = {
                data: {
                    data: {
                        id: 'wompi-123',
                        status: 'APPROVED',
                        reference: 'ref-456',
                        amount_in_cents: 250000,
                        currency: 'COP',
                        payment_method_type: 'NEQUI',
                        created_at: '2024-01-01T10:00:00Z',
                        finalized_at: '2024-01-01T10:05:00Z',
                    },
                },
            };

            const mockAcceptanceTokenResponse = {
                data: {
                    data: {
                        presigned_acceptance: {
                            acceptance_token: 'token-123',
                        },
                    },
                },
            };

            mockAxiosInstance.get.mockResolvedValue(mockAcceptanceTokenResponse);
            mockAxiosInstance.post.mockResolvedValue(mockTransactionResponse);

            const result = await wompiClient.processPayment({
                amount: 2500,
                currency: 'COP',
                customerEmail: 'test@example.com',
                reference: 'ref-456',
                paymentMethod: {
                    type: 'NEQUI',
                },
            });

            expect(result.isSuccess()).toBe(true);
            const response = result.getValue();
            expect(response.id).toBe('wompi-123');
            expect(response.status).toBe('APPROVED');
            expect(response.reference).toBe('ref-456');
            expect(response.amount).toBe(2500);
            expect(response.currency).toBe('COP');
            expect(response.paymentMethod).toBe('NEQUI');
            expect(response.createdAt).toBeInstanceOf(Date);
            expect(response.finalizedAt).toBeInstanceOf(Date);
        });

        it('should handle response without finalized_at', async () => {
            const mockPendingTransactionResponse = {
                data: {
                    data: {
                        id: 'wompi-123',
                        status: 'PENDING',
                        reference: 'ref-456',
                        amount_in_cents: 250000,
                        currency: 'COP',
                        payment_method_type: 'CARD',
                        created_at: '2024-01-01T10:00:00Z',
                        finalized_at: null,
                    },
                },
            };

            const mockAcceptanceTokenResponse = {
                data: {
                    data: {
                        presigned_acceptance: {
                            acceptance_token: 'token-123',
                        },
                    },
                },
            };

            mockAxiosInstance.get.mockResolvedValue(mockAcceptanceTokenResponse);
            mockAxiosInstance.post.mockResolvedValue(mockPendingTransactionResponse);

            const result = await wompiClient.processPayment({
                amount: 2500,
                currency: 'COP',
                customerEmail: 'test@example.com',
                reference: 'ref-456',
                paymentMethod: {
                    type: 'CARD',
                    token: 'tok_test',
                },
            });

            expect(result.isSuccess()).toBe(true);
            const response = result.getValue();
            expect(response.finalizedAt).toBeUndefined();
        });

        it('should convert amount from cents to currency units correctly', async () => {
            const mockTransactionResponse = {
                data: {
                    data: {
                        id: 'wompi-123',
                        status: 'APPROVED',
                        reference: 'ref-456',
                        amount_in_cents: 123456,
                        currency: 'COP',
                        payment_method_type: 'CARD',
                        created_at: '2024-01-01T10:00:00Z',
                    },
                },
            };

            mockAxiosInstance.get.mockResolvedValue({
                data: {
                    data: {
                        presigned_acceptance: { acceptance_token: 'token' },
                    },
                },
            });
            mockAxiosInstance.post.mockResolvedValue(mockTransactionResponse);

            const result = await wompiClient.processPayment({
                amount: 1234.56,
                currency: 'COP',
                customerEmail: 'test@example.com',
                reference: 'ref-456',
                paymentMethod: { type: 'CARD', token: 'tok' },
            });

            expect(result.getValue().amount).toBe(1234.56);
        });
    });

    describe('Edge Cases', () => {
        it('should handle network timeout errors', async () => {
            mockAxiosInstance.get.mockRejectedValue({
                code: 'ECONNABORTED',
                message: 'timeout of 5000ms exceeded',
            });

            const result = await wompiClient.processPayment({
                amount: 1000,
                currency: 'COP',
                customerEmail: 'test@example.com',
                reference: 'ref-123',
                paymentMethod: { type: 'CARD', token: 'tok' },
            });

            expect(result.isFailure()).toBe(true);
        });

        it('should handle malformed API responses', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: {
                    data: null,
                },
            });

            const result = await wompiClient.processPayment({
                amount: 1000,
                currency: 'COP',
                customerEmail: 'test@example.com',
                reference: 'ref-123',
                paymentMethod: { type: 'CARD', token: 'tok' },
            });

            expect(result.isFailure()).toBe(true);
            expect(result.getError().message).toBe(
                'No se pudo obtener el acceptance token',
            );
        });

        it('should handle zero amount transactions', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: {
                    data: {
                        presigned_acceptance: {
                            acceptance_token: 'token-123',
                        },
                    },
                },
            });
            mockAxiosInstance.post.mockResolvedValue({
                data: {
                    data: {
                        id: 'wompi-123',
                        status: 'APPROVED',
                        reference: 'ref-123',
                        amount_in_cents: 0,
                        currency: 'COP',
                        payment_method_type: 'CARD',
                        created_at: '2024-01-01T00:00:00Z',
                    },
                },
            });

            const result = await wompiClient.processPayment({
                amount: 0,
                currency: 'COP',
                customerEmail: 'test@example.com',
                reference: 'ref-123',
                paymentMethod: { type: 'CARD', token: 'tok' },
            });

            expect(result.isSuccess()).toBe(true);
            expect(result.getValue().amount).toBe(0);
        });
    });
});
