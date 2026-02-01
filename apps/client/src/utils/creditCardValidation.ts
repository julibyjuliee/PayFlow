export type CardType = 'visa' | 'mastercard' | 'amex' | 'unknown';

export interface CardValidation {
    isValid: boolean;
    cardType: CardType;
}

export const detectCardType = (cardNumber: string): CardType => {
    const cleaned = cardNumber.replace(/\s/g, '');

    // Visa: Empieza con 4
    if (/^4/.test(cleaned)) {
        return 'visa';
    }

    // Mastercard: Empieza con 51-55 o 2221-2720
    if (/^5[1-5]/.test(cleaned) || /^2(2[2-9][1-9]|[3-6][0-9]{2}|7[0-1][0-9]|720)/.test(cleaned)) {
        return 'mastercard';
    }

    // American Express: Empieza con 34 o 37
    if (/^3[47]/.test(cleaned)) {
        return 'amex';
    }

    return 'unknown';
};

/**
 * Algoritmo de Luhn para validar números de tarjeta
 * https://en.wikipedia.org/wiki/Luhn_algorithm
 */
export const luhnCheck = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');

    if (!/^\d+$/.test(cleaned)) {
        return false;
    }

    let sum = 0;
    let isEven = false;

    // Recorrer de derecha a izquierda
    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned.charAt(i), 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
};

/**
 * Valida el número de tarjeta de crédito
 */
export const validateCardNumber = (cardNumber: string): CardValidation => {
    const cleaned = cardNumber.replace(/\s/g, '');
    const cardType = detectCardType(cleaned);

    // Validar longitud según tipo de tarjeta
    let validLength = false;
    if (cardType === 'visa' || cardType === 'mastercard') {
        validLength = cleaned.length === 16;
    } else if (cardType === 'amex') {
        validLength = cleaned.length === 15;
    }

    const isValid = validLength && luhnCheck(cleaned);

    return {
        isValid,
        cardType,
    };
};

/**
 * Formatea el número de tarjeta con espacios
 */
export const formatCardNumber = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    const cardType = detectCardType(cleaned);

    // American Express: XXXX XXXXXX XXXXX
    if (cardType === 'amex') {
        return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim();
    }

    // Visa/Mastercard: XXXX XXXX XXXX XXXX
    return cleaned.replace(/(\d{4})/g, '$1 ').trim();
};

/**
 * Valida la fecha de expiración (MM/YY)
 */
export const validateExpiryDate = (expiryDate: string): boolean => {
    const cleaned = expiryDate.replace(/\s/g, '');

    // Formato MM/YY
    if (!/^\d{2}\/\d{2}$/.test(cleaned)) {
        return false;
    }

    const [month, year] = cleaned.split('/').map(Number);

    // Validar mes
    if (month < 1 || month > 12) {
        return false;
    }

    // Validar que no esté vencida
    const now = new Date();
    const currentYear = now.getFullYear() % 100; // Últimos 2 dígitos
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) {
        return false;
    }

    if (year === currentYear && month < currentMonth) {
        return false;
    }

    return true;
};

/**
 * Formatea la fecha de expiración (MM/YY)
 */
export const formatExpiryDate = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length >= 2) {
        return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }

    return cleaned;
};

/**
 * Valida el CVV según el tipo de tarjeta
 */
export const validateCVV = (cvv: string, cardType: CardType): boolean => {
    const cleaned = cvv.replace(/\s/g, '');

    if (!/^\d+$/.test(cleaned)) {
        return false;
    }

    // American Express usa 4 dígitos
    if (cardType === 'amex') {
        return cleaned.length === 4;
    }

    // Visa y Mastercard usan 3 dígitos
    return cleaned.length === 3;
};

/**
 * Valida nombre (solo letras y espacios)
 */
export const validateName = (name: string): boolean => {
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/.test(name.trim());
};

/**
 * Valida dirección (al menos 5 caracteres)
 */
export const validateAddress = (address: string): boolean => {
    return address.trim().length >= 5;
};

/**
 * Valida ciudad (solo letras y espacios)
 */
export const validateCity = (city: string): boolean => {
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/.test(city.trim());
};

/**
 * Valida código postal (máximo 6 dígitos)
 */
export const validatePostalCode = (postalCode: string): boolean => {
    return /^\d{1,6}$/.test(postalCode.trim());
};

/**
 * Genera números de tarjeta de prueba válidos usando el algoritmo de Luhn
 */
export const generateTestCardNumber = (cardType: CardType): string => {
    let prefix = '';
    let length = 16;

    switch (cardType) {
        case 'visa':
            prefix = '4';
            break;
        case 'mastercard':
            prefix = '5';
            break;
        case 'amex':
            prefix = '34';
            length = 15;
            break;
        default:
            prefix = '4';
    }

    // Generar dígitos aleatorios
    let cardNumber = prefix;
    while (cardNumber.length < length - 1) {
        cardNumber += Math.floor(Math.random() * 10);
    }

    // Calcular dígito de control con Luhn
    let sum = 0;
    let isEven = true;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i), 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return cardNumber + checkDigit;
};

