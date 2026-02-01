import { useEffect } from 'react';
import type { CartItem } from '../../store/slices/cartSlice';
import { usePaymentProcessing, type CustomerData } from '../../hooks/usePaymentProcessing';
import { PaymentSummary } from './PaymentSummary';
import { ErrorAlert } from './ErrorAlert';
import { ModalActions } from './ModalActions';

interface PaymentSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    items: CartItem[];
    total: number;
    customerData: CustomerData;
}

export const PaymentSummaryModal = ({
    isOpen,
    onClose,
    onSuccess,
    items,
    total,
    customerData,
}: PaymentSummaryModalProps) => {
    const { isProcessing, error, processPayment, resetError } = usePaymentProcessing(
        items,
        customerData,
        total,
        onSuccess
    );

    useEffect(() => {
        if (isOpen) {
            resetError();
        }
    }, [isOpen, resetError]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Confirmación Final</h2>

                <PaymentSummary total={total} />

                {error && <ErrorAlert message={error} />}

                <ModalActions
                    isProcessing={isProcessing}
                    onCancel={onClose}
                    onConfirm={processPayment}
                />
            </div>
        </div>
    );
};