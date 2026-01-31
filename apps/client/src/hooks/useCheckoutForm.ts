import { useState, useEffect } from 'react';
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
} from '../utils/creditCardValidation';

export interface CheckoutFormData {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
}

export interface FormErrors {
    [key: string]: string;
}

interface UseCheckoutFormReturn {
    formData: CheckoutFormData;
    fieldErrors: FormErrors;
    touched: Record<string, boolean>;
    cardType: CardType;
    isFormValid: () => boolean;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    setFormData: React.Dispatch<React.SetStateAction<CheckoutFormData>>;
    resetCardData: () => void;
    resetFormData: () => void;
}

const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

export const useCheckoutForm = (initialData: CheckoutFormData): UseCheckoutFormReturn => {
    const [formData, setFormData] = useState<CheckoutFormData>(initialData);
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [cardType, setCardType] = useState<CardType>('unknown');

    useEffect(() => {
        const errors: FormErrors = {};

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

    useEffect(() => {
        const type = detectCardType(formData.cardNumber);
        setCardType(type);
    }, [formData.cardNumber]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'cardNumber') {
            formattedValue = formatCardNumber(value);
        } else if (name === 'expiryDate') {
            formattedValue = formatExpiryDate(value);
        } else if (name === 'cvv') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        } else if (name === 'postalCode') {
            formattedValue = value.replace(/\D/g, '').slice(0, 5);
        }

        setFormData(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const isFormValid = (): boolean => {
        return (
            validateName(formData.firstName) &&
            validateName(formData.lastName) &&
            validateEmail(formData.email) &&
            validateAddress(formData.address) &&
            validateCity(formData.city) &&
            validatePostalCode(formData.postalCode) &&
            validateCardNumber(formData.cardNumber).isValid &&
            validateExpiryDate(formData.expiryDate) &&
            validateCVV(formData.cvv, cardType)
        );
    };

    const resetCardData = () => {
        setFormData(prev => ({
            ...prev,
            cardNumber: '',
            expiryDate: '',
            cvv: '',
        }));
    };

    const resetFormData = () => {
        setFormData({
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
    };

    return {
        formData,
        fieldErrors,
        touched,
        cardType,
        isFormValid,
        handleInputChange,
        handleBlur,
        setFormData,
        resetCardData,
        resetFormData,
    };
};
