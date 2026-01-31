import { useEffect } from 'react';
import type { CheckoutFormData } from './useCheckoutForm';

const STORAGE_KEY = 'checkoutFormData';

interface PersistableData {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
}

export const useFormPersistence = (
    formData: CheckoutFormData,
    onChange: (data: CheckoutFormData) => void
) => {
    useEffect(() => {
        const loadSavedData = () => {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved) as PersistableData;
                    onChange({
                        firstName: parsed.firstName || '',
                        lastName: parsed.lastName || '',
                        email: parsed.email || '',
                        address: parsed.address || '',
                        city: parsed.city || '',
                        postalCode: parsed.postalCode || '',
                        cardNumber: '',
                        expiryDate: '',
                        cvv: '',
                    });
                }
            } catch (error) {
                console.error('Error loading saved form data:', error);
            }
        };

        loadSavedData();
    }, []);

    useEffect(() => {
        const saveData = () => {
            try {
                const dataToSave: PersistableData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    address: formData.address,
                    city: formData.city,
                    postalCode: formData.postalCode,
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
            } catch (error) {
                console.error('Error saving form data:', error);
            }
        };

        const hasData = Object.values(formData).some(value => value.trim() !== '');
        if (hasData) {
            saveData();
        }
    }, [formData]);

    const clearSavedData = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing form data:', error);
        }
    };

    return { clearSavedData };
};
