import { useState, useEffect } from 'react';
import { Header } from '../Header';
import type { Product } from '../../types';
import type { CartItem } from '../../store/slices/cartSlice';
import { useAppDispatch } from '../../store/hooks';
import { setShippingAddress } from '../../store/slices/checkoutSlice';
import { removeFromCart } from '../../store/slices/cartSlice';
import { CardLogo } from '../ui';
import {
    validateCardNumber,
    validateExpiryDate,
    validateCVV,
    validateName,
    validateAddress,
    validateCity,
    validatePostalCode,
    formatCardNumber,
    formatExpiryDate,
    detectCardType,
    type CardType,
} from '../../utils/creditCardValidation';
import { PaymentSummaryModal } from '../PaymentSummaryModal/PaymentSummaryModal';

interface CheckoutInfoProps {
    product?: Product;
    quantity?: number;
    cartItems?: CartItem[];
    onNavigateBack?: () => void;
}

export const CheckoutInfo = ({
    product,
    quantity = 1,
    cartItems = [],
    onNavigateBack,
}: CheckoutInfoProps) => {
    const items: CartItem[] = cartItems.length > 0
        ? cartItems
        : product
            ? [{ product, quantity }]
            : [];
    const dispatch = useAppDispatch();

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    };

    const loadSavedFormData = () => {
        try {
            const saved = localStorage.getItem('checkoutFormData');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    firstName: parsed.firstName || '',
                    lastName: parsed.lastName || '',
                    email: parsed.email || '',
                    address: parsed.address || '',
                    city: parsed.city || '',
                    postalCode: parsed.postalCode || '',
                    cardNumber: '', // NUNCA guardar datos de tarjeta
                    expiryDate: '', // NUNCA guardar datos de tarjeta
                    cvv: '', // NUNCA guardar datos de tarjeta
                };
            }
        } catch (error) {
            console.error('Error loading saved form data:', error);
        }
        return {
            firstName: '',
            lastName: '',
            email: '',
            address: '',
            city: '',
            postalCode: '',
            cardNumber: '',
            expiryDate: '',
            cvv: '',
        };
    };

    const [formData, setFormData] = useState(loadSavedFormData());

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [cardType, setCardType] = useState<CardType>('unknown');
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Validar campos en tiempo real
    useEffect(() => {
        const errors: Record<string, string> = {};

        if (touched.firstName && !validateName(formData.firstName)) {
            errors.firstName = 'Nombre inválido (solo letras)';
        }

        if (touched.lastName && !validateName(formData.lastName)) {
            errors.lastName = 'Apellido inválido (solo letras)';
        }

        if (touched.email && !validateEmail(formData.email)) {
            errors.email = 'Email inválido';
        }

        if (touched.address && !validateAddress(formData.address)) {
            errors.address = 'Dirección muy corta (mínimo 5 caracteres)';
        }

        if (touched.city && !validateCity(formData.city)) {
            errors.city = 'Ciudad inválida (solo letras)';
        }

        if (touched.postalCode && !validatePostalCode(formData.postalCode)) {
            errors.postalCode = 'Código postal inválido (5 dígitos)';
        }

        if (touched.cardNumber) {
            const validation = validateCardNumber(formData.cardNumber);
            if (!validation.isValid) {
                errors.cardNumber = 'Número de tarjeta inválido';
            }
        }

        if (touched.expiryDate && !validateExpiryDate(formData.expiryDate)) {
            errors.expiryDate = 'Fecha inválida o vencida (MM/YY)';
        }

        if (touched.cvv && !validateCVV(formData.cvv, cardType)) {
            errors.cvv = `CVV inválido (${cardType === 'amex' ? '4' : '3'} dígitos)`;
        }

        setFieldErrors(errors);
    }, [formData, touched, cardType]);

    // Detectar tipo de tarjeta
    useEffect(() => {
        const type = detectCardType(formData.cardNumber);
        setCardType(type);
    }, [formData.cardNumber]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        // Formatear automáticamente ciertos campos
        if (name === 'cardNumber') {
            formattedValue = formatCardNumber(value);
        } else if (name === 'expiryDate') {
            formattedValue = formatExpiryDate(value);
        } else if (name === 'cvv') {
            // Solo números, máximo 4 dígitos
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        } else if (name === 'postalCode') {
            // Solo números, máximo 5 dígitos
            formattedValue = value.replace(/\D/g, '').slice(0, 5);
        }

        const newFormData = { ...formData, [name]: formattedValue };
        setFormData(newFormData);

        // Guardar en localStorage (excepto datos de tarjeta)
        if (name !== 'cardNumber' && name !== 'expiryDate' && name !== 'cvv') {
            try {
                localStorage.setItem('checkoutFormData', JSON.stringify({
                    firstName: newFormData.firstName,
                    lastName: newFormData.lastName,
                    email: newFormData.email,
                    address: newFormData.address,
                    city: newFormData.city,
                    postalCode: newFormData.postalCode,
                }));
            } catch (error) {
                console.error('Error saving form data:', error);
            }
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name } = e.target;
        setTouched({ ...touched, [name]: true });
    };

    const handleRemoveItem = (productId: string) => {
        dispatch(removeFromCart(productId));
    };

    // Verificar si el formulario es válido
    const isFormValid = () => {
        return (
            validateName(formData.firstName) &&
            validateName(formData.lastName) &&
            validateEmail(formData.email) &&
            validateAddress(formData.address) &&
            validateCity(formData.city) &&
            validatePostalCode(formData.postalCode) &&
            validateCardNumber(formData.cardNumber).isValid &&
            validateExpiryDate(formData.expiryDate) &&
            validateCVV(formData.cvv, cardType) &&
            items.length > 0
        );
    };

    const handleProceedToReview = () => {
        // 1. Validaciones básicas
        if (!isFormValid()) {
            alert('Por favor completa todos los campos correctamente');
            return;
        }

        if (items.length === 0) {
            alert('No hay productos para procesar');
            return;
        }

        // 2. Guardar la dirección en Redux (esto está bien mantenerlo aquí)
        dispatch(
            setShippingAddress({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                address: formData.address,
                city: formData.city,
                postalCode: formData.postalCode,
            }),
        );

        // 3. Simplemente abrimos el Modal de Resumen
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        // Cuando se cierra el modal (por error o cancelación),
        // limpiar solo los datos de tarjeta, mantener los datos personales
        setFormData({
            ...formData,
            cardNumber: '',
            expiryDate: '',
            cvv: '',
        });
        setIsModalOpen(false);
    };

    // Calculate totals from all items
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    return (
        <div className="min-h-screen">
            <Header activeTab="cart" onNavigate={onNavigateBack} />

            <div className="relative flex min-h-screen w-full flex-col max-w-[1280px] mx-auto">
                {/* Secure Checkout Banner */}
                <div className="sticky top-20 z-40 flex items-center bg-background-light/80 backdrop-blur-md px-8 py-4 justify-end border-b border-orange-100">
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-slate-400">
                            lock
                        </span>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                            Secure Checkout
                        </span>
                    </div>
                </div>

                <main className="flex-1 p-8 lg:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Left Column - Forms */}
                        <div className="lg:col-span-8 space-y-12">
                            {/* Delivery Address Section */}
                            <section>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    <span className="size-8 rounded-full bg-sunset-peach text-sunset-orange flex items-center justify-center text-sm">
                                        1
                                    </span>
                                    Dirección de Entrega
                                </h2>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                            Nombre
                                        </label>
                                        <input
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.firstName ? 'border-red-500' : 'border-orange-100'} bg-white focus:ring-1 focus:ring-terracotta transition-all`}
                                            placeholder="Jane"
                                            type="text"
                                        />
                                        {fieldErrors.firstName && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
                                        )}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                            Apellido
                                        </label>
                                        <input
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.lastName ? 'border-red-500' : 'border-orange-100'} bg-white focus:ring-1 focus:ring-terracotta transition-all`}
                                            placeholder="Doe"
                                            type="text"
                                        />
                                        {fieldErrors.lastName && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                            Dirección de correo
                                        </label>
                                        <input
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.email ? 'border-red-500' : 'border-orange-100'} bg-white focus:ring-1 focus:ring-terracotta transition-all`}
                                            placeholder="ejemplo@dominio.com"
                                            type="email"
                                        />
                                        {fieldErrors.email && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                            Dirección
                                        </label>
                                        <input
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.address ? 'border-red-500' : 'border-orange-100'} bg-white focus:ring-1 focus:ring-terracotta transition-all`}
                                            placeholder="123 Sunset Blvd"
                                            type="text"
                                        />
                                        {fieldErrors.address && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>
                                        )}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                            Ciudad
                                        </label>
                                        <input
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.city ? 'border-red-500' : 'border-orange-100'} bg-white focus:ring-1 focus:ring-terracotta transition-all`}
                                            placeholder="Los Angeles"
                                            type="text"
                                        />
                                        {fieldErrors.city && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.city}</p>
                                        )}
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                            Código Postal
                                        </label>
                                        <input
                                            name="postalCode"
                                            value={formData.postalCode}
                                            onChange={handleInputChange}
                                            onBlur={handleBlur}
                                            className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.postalCode ? 'border-red-500' : 'border-orange-100'} bg-white focus:ring-1 focus:ring-terracotta transition-all`}
                                            placeholder="90001"
                                            type="text"
                                        />
                                        {fieldErrors.postalCode && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.postalCode}</p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Credit Card Section */}
                            <section>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    <span className="size-8 rounded-full bg-sunset-peach text-sunset-orange flex items-center justify-center text-sm">
                                        2
                                    </span>
                                    Detalles de la Tarjeta de Crédito
                                </h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                            Número de Tarjeta
                                        </label>
                                        <div className="relative">
                                            <input
                                                name="cardNumber"
                                                value={formData.cardNumber}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                className={`w-full px-4 py-3 pr-20 rounded-xl border ${fieldErrors.cardNumber ? 'border-red-500' : 'border-orange-100'} bg-white focus:ring-1 focus:ring-terracotta transition-all`}
                                                placeholder="0000 0000 0000 0000"
                                                type="text"
                                                maxLength={19}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                                                {cardType !== 'unknown' ? (
                                                    <CardLogo cardType={cardType} className="h-8" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-slate-400">
                                                        credit_card
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {fieldErrors.cardNumber && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.cardNumber}</p>
                                        )}
                                        <p className="text-xs text-slate-500 mt-1">
                                            Prueba: Visa 4532015112830366 | Mastercard 5425233430109903
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                                Fecha de Vencimiento
                                            </label>
                                            <input
                                                name="expiryDate"
                                                value={formData.expiryDate}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.expiryDate ? 'border-red-500' : 'border-orange-100'} bg-white focus:ring-1 focus:ring-terracotta transition-all`}
                                                placeholder="MM/YY"
                                                type="text"
                                                maxLength={5}
                                            />
                                            {fieldErrors.expiryDate && (
                                                <p className="text-red-500 text-xs mt-1">{fieldErrors.expiryDate}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                                CVV
                                            </label>
                                            <input
                                                name="cvv"
                                                value={formData.cvv}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.cvv ? 'border-red-500' : 'border-orange-100'} bg-white focus:ring-1 focus:ring-terracotta transition-all`}
                                                placeholder={cardType === 'amex' ? '1234' : '123'}
                                                type="text"
                                                maxLength={4}
                                            />
                                            {fieldErrors.cvv && (
                                                <p className="text-red-500 text-xs mt-1">{fieldErrors.cvv}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-28 bg-white rounded-3xl p-6 border border-orange-100 shadow-sm">
                                <h3 className="text-xl font-bold mb-6">Resumen de la compra</h3>

                                {/* Product List */}
                                <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto">
                                    {items.map((item, index) => (
                                        <div key={`${item.product.id}-${index}`} className="flex gap-4 pb-4 border-b border-orange-50 last:border-b-0 relative group">
                                            <div className="size-20 bg-sunset-peach rounded-2xl overflow-hidden flex-shrink-0">
                                                <div
                                                    className="w-full h-full bg-center bg-cover"
                                                    style={{ backgroundImage: `url("${item.product.imageUrl}")` }}
                                                />
                                            </div>
                                            <div className="flex flex-col justify-center flex-1">
                                                <p className="font-semibold text-slate-900 text-sm">
                                                    {item.product.name}
                                                </p>
                                                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                                <p className="text-sunset-orange font-bold mt-1 text-sm">
                                                    ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(item.product.price))} x {item.quantity}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.product.id)}
                                                className="absolute top-0 right-0 size-6 rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                                                aria-label={`Eliminar ${item.product.name}`}
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    close
                                                </span>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-3 border-t border-orange-50 pt-6 mb-8">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Subtotal</span>
                                        <span>${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(subtotal.toFixed(2)))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Envío</span>
                                        <span className="text-green-600 font-medium">Free</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Impuestos Incluidos</span>
                                        <span>${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(tax.toFixed(2)))}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-orange-50 ">
                                        <span>Total</span>
                                        <span className="text-slate-900">
                                            ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(total.toFixed(2)))}
                                        </span>
                                    </div>
                                </div>

                                {/* Proceed Button */}
                                <button
                                    onClick={handleProceedToReview}
                                    disabled={!isFormValid()}
                                    className={`w-full h-14 rounded-2xl font-bold text-lg tracking-tight transition-all flex items-center justify-center gap-2 ${isFormValid()
                                        ? 'bg-orange-600 text-white shadow-lg shadow-sunset-orange/20 hover:bg-orange-700 cursor-pointer'
                                        : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                        }`}
                                >
                                    Pagar ahora
                                    <span className="material-symbols-outlined text-[20px]">
                                        chevron_right
                                    </span>
                                </button>
                                {!isFormValid() && (
                                    <p className="text-center text-xs text-red-500 mt-2">
                                        Por favor completa todos los campos correctamente
                                    </p>
                                )}

                                {/* Terms */}
                                <p className="text-center text-xs text-slate-400 mt-4 px-4 leading-relaxed">
                                    Al continuar, acepta nuestros Términos de servicio y Política
                                    de privacidad.
                                </p>
                            </div>
                            <PaymentSummaryModal
                                isOpen={isModalOpen}
                                onClose={handleModalClose}
                                items={items}
                                subtotal={subtotal}
                                customerData={formData}
                                onSuccess={() => {
                                    setFormData({
                                        firstName: '', lastName: '', email: '', address: '', city: '',
                                        postalCode: '', cardNumber: '', expiryDate: '', cvv: ''
                                    });
                                    try {
                                        localStorage.removeItem('checkoutFormData');
                                    } catch (error) {
                                        console.error('Error clearing form data:', error);
                                    }
                                    setIsModalOpen(false);
                                }}
                            />
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};
