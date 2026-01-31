import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StateComponent } from '../components/States';

interface TransactionData {
    orderNumber: string;
    status: 'success' | 'error' | 'pending';
    customerInfo: {
        firstName: string;
        lastName: string;
    };
    product: {
        name: string;
        price: number;
        quantity: number;
        imageUrl?: string;
    };
    deliveryAddress: {
        street: string;
        city: string;
        postalCode: string;
    };
    totalAmount: number;
    errorMessage?: string;
}

export const PaymentResultPage = () => {
    const [searchParams] = useSearchParams();
    const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadTransactionData = async () => {
            try {
                const transactionId = searchParams.get('transactionId');
                const status = searchParams.get('status') as 'success' | 'error' | 'pending';

                if (!transactionId || !status) {
                    // Si no hay parámetros, mostrar error
                    setTransactionData({
                        orderNumber: '',
                        status: 'error',
                        customerInfo: { firstName: '', lastName: '' },
                        product: { name: '', price: 0, quantity: 0 },
                        deliveryAddress: { street: '', city: '', postalCode: '' },
                        totalAmount: 0,
                        errorMessage: 'No se encontró información de la transacción',
                    });
                    setIsLoading(false);
                    return;
                }

                // Obtener datos de la transacción desde el backend
                const response = await fetch(import.meta.env.VITE_API_URL + `/transactions/${transactionId}`);

                if (!response.ok) {
                    throw new Error('No se pudo obtener la información de la transacción');
                }

                const transaction = await response.json();

                // Obtener datos del producto
                const productResponse = await fetch(import.meta.env.VITE_API_URL + `/products/${transaction.productId}`);
                const product = productResponse.ok ? await productResponse.json() : null;

                setTransactionData({
                    orderNumber: transaction.id,
                    status: status,
                    customerInfo: {
                        firstName: transaction.firstName || '',
                        lastName: transaction.lastName || '',
                    },
                    product: product ? {
                        name: product.name,
                        price: product.price,
                        quantity: transaction.quantity,
                        imageUrl: product.imageUrl,
                    } : {
                        name: 'Producto',
                        price: transaction.amount,
                        quantity: transaction.quantity,
                    },
                    deliveryAddress: {
                        street: transaction.address || '',
                        city: transaction.city || '',
                        postalCode: transaction.postalCode || '',
                    },
                    totalAmount: transaction.amount,
                    errorMessage: transaction.errorMessage || undefined,
                });
            } catch (error) {
                console.error('Error loading transaction:', error);
                setTransactionData({
                    orderNumber: '',
                    status: 'error',
                    customerInfo: { firstName: '', lastName: '' },
                    product: { name: '', price: 0, quantity: 0 },
                    deliveryAddress: { street: '', city: '', postalCode: '' },
                    totalAmount: 0,
                    errorMessage: 'Error al cargar la información de la transacción',
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadTransactionData();
    }, [searchParams]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-16 border-4 border-sunset-orange border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-600 font-medium">Cargando resultado...</p>
                </div>
            </div>
        );
    }

    if (!transactionData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light">
                <p className="text-slate-600">No se encontró información de la transacción</p>
            </div>
        );
    }

    return (
        <StateComponent
            status={transactionData.status}
            orderNumber={transactionData.orderNumber}
            customerInfo={transactionData.customerInfo}
            product={transactionData.product}
            deliveryAddress={transactionData.deliveryAddress}
            totalAmount={transactionData.totalAmount}
            errorMessage={transactionData.errorMessage}
        />
    );
};
