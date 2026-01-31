// src/components/PaymentSummaryModal.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CartItem } from '../../store/slices/cartSlice';
import { useAppDispatch } from '../../store/hooks';
import { clearCart } from '../../store/slices/cartSlice';

interface PaymentSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    items: CartItem[];
    subtotal: number;
    customerData: {
        firstName: string;
        lastName: string;
        address: string;
        city: string;
        postalCode: string;
        cardNumber: string;
        expiryDate: string;
        cvv: string;
        email: string;
    };
}

export const PaymentSummaryModal = ({
    isOpen,
    onClose,
    onSuccess,
    items,
    subtotal,
    customerData
}: PaymentSummaryModalProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const finalTotal = subtotal;

    useEffect(() => {
        if (isOpen) {
            setError(null);
        }
    }, [isOpen]);

    const handleFinalPayment = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            const tokenRes = await fetch(import.meta.env.VITE_WP_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + import.meta.env.VITE_WP_PUBLIC_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    number: customerData.cardNumber.replace(/\s/g, ''),
                    cvc: customerData.cvv,
                    exp_month: customerData.expiryDate.split('/')[0].trim(),
                    exp_year: customerData.expiryDate.split('/')[1].trim().slice(-2),
                    card_holder: `${customerData.firstName} ${customerData.lastName}`
                })
            });

            if (!tokenRes.ok) {
                const errorDetail = await tokenRes.json();
                console.error("Error en tokenización Wompi:", errorDetail);
                throw new Error('No se pudo procesar la tarjeta. Por favor verifica los datos.');
            }

            const tokenData = await tokenRes.json();
            const paymentToken = tokenData.data.id;

            const response = await fetch(import.meta.env.VITE_API_URL + '/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: items[0].product.id,
                    quantity: items[0].quantity,
                    customerEmail: `${customerData.email.toLowerCase()}`,
                    paymentToken: paymentToken,
                    firstName: customerData.firstName,
                    lastName: customerData.lastName,
                    address: customerData.address,
                    city: customerData.city,
                    postalCode: customerData.postalCode
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al procesar el pago');
            }

            const transaction = await response.json();

            let status: 'success' | 'error' | 'pending' = 'pending';

            if (transaction.status === 'APPROVED' || transaction.status === 'PENDING') {
                status = 'success';
                dispatch(clearCart());
                onSuccess();
            } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
                status = 'error';
            } else {
                status = 'pending';
            }
            navigate(`/payment-result?transactionId=${transaction.id}&status=${status}`);

        } catch (error) {
            console.error("Error en el proceso de pago:", error);
            const errorMsg = error instanceof Error ? error.message : 'Error desconocido en el pago';
            setError(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Confirmación Final</h2>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span>${new Intl.NumberFormat('es-CO').format(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-4">
                        <span>Envío</span>
                        <span className="text-green-600 font-medium">Gratis</span>
                    </div>
                    <div className="pt-2 flex justify-between text-2xl font-black text-orange-600">
                        <span>Total</span>
                        <span>${new Intl.NumberFormat('es-CO').format(finalTotal)}</span>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-700 text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </p>
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 h-12 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleFinalPayment}
                        disabled={isProcessing}
                        className="flex-[2] h-12 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                Pagar Ahora
                                <span className="material-symbols-outlined text-sm">payments</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};