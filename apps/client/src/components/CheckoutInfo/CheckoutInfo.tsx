import { useState, useMemo } from 'react';
import { Header } from '../Header';
import type { Product } from '../../types';
import type { CartItem } from '../../store/slices/cartSlice';
import { useAppDispatch } from '../../store/hooks';
import { setShippingAddress } from '../../store/slices/checkoutSlice';
import { removeFromCart } from '../../store/slices/cartSlice';
import { PaymentSummaryModal } from '../PaymentSummaryModal/PaymentSummaryModal';
import { useCheckoutForm } from '../../hooks/useCheckoutForm';
import { useFormPersistence } from '../../hooks/useFormPersistence';
import { useOrderCalculations } from '../../hooks/useOrderCalculations';
import { ShippingForm } from './ShippingForm';
import { PaymentForm } from './PaymentForm';
import { OrderSummary } from './OrderSummary';

interface CheckoutInfoProps {
    product?: Product;
    quantity?: number;
    cartItems?: CartItem[];
    onNavigateBack?: () => void;
}

/**
 * Main checkout component following SOLID principles:
 * - Single Responsibility: Only orchestrates child components and business logic
 * - Open/Closed: Open for extension through props, closed for modification
 * - Dependency Inversion: Depends on abstractions (custom hooks) not concretions
 */
export const CheckoutInfo = ({
    product,
    quantity = 1,
    cartItems = [],
    onNavigateBack,
}: CheckoutInfoProps) => {
    const items: CartItem[] = useMemo(
        () =>
            cartItems.length > 0
                ? cartItems
                : product
                  ? [{ product, quantity }]
                  : [],
        [cartItems, product, quantity]
    );

    const dispatch = useAppDispatch();

    // Use custom hooks following SOLID principles
    const {
        formData,
        fieldErrors,
        cardType,
        isFormValid,
        handleInputChange,
        handleBlur,
        setFormData,
        resetCardData,
        resetFormData,
    } = useCheckoutForm({
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        city: '',
        postalCode: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
    });

    const { clearSavedData } = useFormPersistence(formData, setFormData);
    const { subtotal, tax, shipping, total } = useOrderCalculations(items);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Event handlers following Single Responsibility Principle
    const handleRemoveItem = (productId: string) => {
        dispatch(removeFromCart(productId));
    };

    const handleProceedToReview = () => {
        if (!isFormValid() || items.length === 0) {
            alert('Por favor completa todos los campos correctamente');
            return;
        }

        dispatch(
            setShippingAddress({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                address: formData.address,
                city: formData.city,
                postalCode: formData.postalCode,
            })
        );

        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        resetCardData();
        setIsModalOpen(false);
    };

    const handlePaymentSuccess = () => {
        resetFormData();
        clearSavedData();
        setIsModalOpen(false);
    };

    return (
        <div className="min-h-screen">
            <Header activeTab="cart" onNavigate={onNavigateBack} />

            <div className="relative flex min-h-screen w-full flex-col max-w-[1280px] mx-auto">
                {/* Secure Checkout Banner */}
                <div className="sticky top-20 z-40 flex items-center bg-background-light/80 backdrop-blur-md px-8 py-4 justify-end border-b border-orange-100">
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-slate-400">lock</span>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                            Secure Checkout
                        </span>
                    </div>
                </div>

                <main className="flex-1 p-8 lg:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Left Column - Forms (Composition of smaller components) */}
                        <div className="lg:col-span-8 space-y-12">
                            <ShippingForm
                                formData={formData}
                                fieldErrors={fieldErrors}
                                onInputChange={handleInputChange}
                                onBlur={handleBlur}
                            />
                            <PaymentForm
                                formData={formData}
                                fieldErrors={fieldErrors}
                                cardType={cardType}
                                onInputChange={handleInputChange}
                                onBlur={handleBlur}
                            />
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:col-span-4">
                            <OrderSummary
                                items={items}
                                subtotal={subtotal}
                                tax={tax}
                                shipping={shipping}
                                total={total}
                                isFormValid={isFormValid() && items.length > 0}
                                onRemoveItem={handleRemoveItem}
                                onProceedToReview={handleProceedToReview}
                            />
                            <PaymentSummaryModal
                                isOpen={isModalOpen}
                                onClose={handleModalClose}
                                items={items}
                                subtotal={subtotal}
                                customerData={formData}
                                onSuccess={handlePaymentSuccess}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
