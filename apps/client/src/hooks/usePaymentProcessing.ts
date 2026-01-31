import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { clearCart } from '../store/slices/cartSlice';
import { paymentService, type Transaction } from '../services/paymentService';
import type { CartItem } from '../store/slices/cartSlice';

export interface CustomerData {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    email: string;
}

type PaymentStatus = 'success' | 'error' | 'pending';

interface UsePaymentProcessingReturn {
    isProcessing: boolean;
    error: string | null;
    processPayment: () => Promise<void>;
    resetError: () => void;
}

export const usePaymentProcessing = (
    items: CartItem[],
    customerData: CustomerData,
    onSuccess: () => void
): UsePaymentProcessingReturn => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const resetError = useCallback(() => {
        setError(null);
    }, []);

    const determinePaymentStatus = (transaction: Transaction): PaymentStatus => {
        if (transaction.status === 'APPROVED' || transaction.status === 'PENDING') {
            return 'success';
        } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
            return 'error';
        }
        return 'pending';
    };

    const handleSuccessfulPayment = useCallback(() => {
        dispatch(clearCart());
        onSuccess();
    }, [dispatch, onSuccess]);

    const processPayment = useCallback(async () => {
        if (items.length === 0) {
            setError('No hay productos para procesar');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const [expiryMonth, expiryYear] = customerData.expiryDate.split('/').map(s => s.trim());

            const transaction = await paymentService.processPayment(
                {
                    cardNumber: customerData.cardNumber,
                    cvv: customerData.cvv,
                    expiryMonth,
                    expiryYear: expiryYear.slice(-2),
                    cardHolder: `${customerData.firstName} ${customerData.lastName}`,
                },
                {
                    productId: items[0].product.id,
                    quantity: items[0].quantity,
                    customerEmail: customerData.email,
                    firstName: customerData.firstName,
                    lastName: customerData.lastName,
                    address: customerData.address,
                    city: customerData.city,
                    postalCode: customerData.postalCode,
                }
            );

            const status = determinePaymentStatus(transaction);

            if (status === 'success') {
                handleSuccessfulPayment();
            }

            navigate(`/payment-result?transactionId=${transaction.id}&status=${status}`);
        } catch (err) {
            console.error('Error en el proceso de pago:', err);
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido en el pago';
            setError(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    }, [items, customerData, navigate, handleSuccessfulPayment]);

    return {
        isProcessing,
        error,
        processPayment,
        resetError,
    };
};
