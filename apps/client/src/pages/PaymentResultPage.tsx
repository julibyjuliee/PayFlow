import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
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
    const location = useLocation();
    const navigate = useNavigate();
    const transactionData = location.state as TransactionData | null;

    // Redirigir si no hay datos (acceso directo a la URL)
    useEffect(() => {
        if (!transactionData) {
            navigate('/cart');
        }
    }, [transactionData, navigate]);

    if (!transactionData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-16 border-4 border-sunset-orange border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-600 font-medium">Redirigiendo...</p>
                </div>
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
