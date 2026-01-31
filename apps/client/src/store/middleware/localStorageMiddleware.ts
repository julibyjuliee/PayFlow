import type { Middleware } from '@reduxjs/toolkit';

const STORAGE_KEY = 'payflow_app_state';

const encrypt = (data: string): string => {
    try {
        return btoa(data);
    } catch (error) {
        console.error('Encryption error:', error);
        return data;
    }
};

const decrypt = (data: string): string => {
    try {
        return atob(data);
    } catch (error) {
        console.error('Decryption error:', error);
        return data;
    }
};

export const localStorageMiddleware: Middleware =
    (store) => (next) => (action) => {
        const result = next(action);

        const actionsToSave = [
            'cart/addToCart',
            'cart/removeFromCart',
            'cart/updateQuantity',
            'cart/clearCart',
            'checkout/setShippingAddress',
            'checkout/completeTransaction',
        ];

        if (typeof action === 'object' && action !== null && 'type' in action && typeof action.type === 'string' && actionsToSave.some((type) => (action.type as string).startsWith(type))) {
            try {
                const state = store.getState();
                const dataToStore = {
                    cart: state.cart,
                    checkout: {
                        ...state.checkout,
                        currentTransaction: null, // Don't persist current transaction
                    },
                };

                const serialized = JSON.stringify(dataToStore);
                const encrypted = encrypt(serialized);
                localStorage.setItem(STORAGE_KEY, encrypted);
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }
        }

        return result;
    };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loadStateFromStorage = (): any => {
    try {
        const encrypted = localStorage.getItem(STORAGE_KEY);
        if (!encrypted) {
            return undefined;
        }

        const decrypted = decrypt(encrypted);
        const state = JSON.parse(decrypted);
        return state;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return undefined;
    }
};

export const clearStateFromStorage = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
};
