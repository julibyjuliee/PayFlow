interface TokenizeCardRequest {
    cardNumber: string;
    cvv: string;
    expiryMonth: string;
    expiryYear: string;
    cardHolder: string;
}

interface TokenizeCardResponse {
    data: {
        id: string;
    };
}

interface CreateTransactionRequest {
    productId: string;
    quantity: number;
    customerEmail: string;
    paymentToken: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
}

export interface Transaction {
    id: string;
    status: 'APPROVED' | 'PENDING' | 'DECLINED' | 'ERROR';
    amount?: number;
    errorMessage?: string;
}

class PaymentServiceClass {
    private readonly wpApiUrl: string;
    private readonly wpPublicKey: string;
    private readonly apiUrl: string;

    constructor() {
        this.wpApiUrl = import.meta.env.VITE_WP_API_URL;
        this.wpPublicKey = import.meta.env.VITE_WP_PUBLIC_KEY;
        this.apiUrl = import.meta.env.VITE_API_URL;
    }

    /**
     * Tokenize credit card with WP
     * @throws Error if tokenization fails
     */
    async tokenizeCard(request: TokenizeCardRequest): Promise<string> {
        try {
            const response = await fetch(this.wpApiUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.wpPublicKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    number: request.cardNumber.replace(/\s/g, ''),
                    cvc: request.cvv,
                    exp_month: request.expiryMonth,
                    exp_year: request.expiryYear,
                    card_holder: request.cardHolder,
                }),
            });

            if (!response.ok) {
                const errorDetail = await response.json();
                console.error('Error en tokenización WP:', errorDetail);
                throw new Error('No se pudo procesar la tarjeta. Por favor verifica los datos.');
            }

            const data: TokenizeCardResponse = await response.json();
            return data.data.id;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error desconocido al tokenizar la tarjeta');
        }
    }

    /**
     * Create transaction with payment token
     * @throws Error if transaction creation fails
     */
    async createTransaction(request: CreateTransactionRequest): Promise<Transaction> {
        try {
            const response = await fetch(`${this.apiUrl}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: request.productId,
                    quantity: request.quantity,
                    customerEmail: request.customerEmail.toLowerCase(),
                    paymentToken: request.paymentToken,
                    firstName: request.firstName,
                    lastName: request.lastName,
                    address: request.address,
                    city: request.city,
                    postalCode: request.postalCode,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al procesar el pago');
            }

            return await response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error desconocido al crear la transacción');
        }
    }

    /**
     * Process full payment flow: tokenize + create transaction
     */
    async processPayment(
        cardData: TokenizeCardRequest,
        transactionData: Omit<CreateTransactionRequest, 'paymentToken'>
    ): Promise<Transaction> {
        const paymentToken = await this.tokenizeCard(cardData);
        return await this.createTransaction({
            ...transactionData,
            paymentToken,
        });
    }
}

// Export singleton instance
export const paymentService = new PaymentServiceClass();
