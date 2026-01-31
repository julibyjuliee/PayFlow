import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Encryption key (in production, this should be in environment variables)
const STORAGE_KEY = 'payflow_app_state';

// Simple encryption/decryption (in production, use a proper encryption library)
const encrypt = (data: string): string => {
    try {
        // Simple XOR encryption (replace with proper encryption in production)
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

// Middleware to save state to localStorage
export const localStorageMiddleware: Middleware<{}, RootState> =
    (store) => (next) => (action) => {
        const result = next(action);

        // Actions that trigger localStorage save
        const actionsToSave = [
            'cart/addToCart',
            'cart/removeFromCart',
            'cart/updateQuantity',
            'cart/clearCart',
            'checkout/setShippingAddress',
            'checkout/completeTransaction',
        ];

        if (actionsToSave.some((type) => action.type.startsWith(type))) {
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

// Function to load state from localStorage
export const loadStateFromStorage = (): Partial<RootState> | undefined => {
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

// Function to clear state from localStorage
export const clearStateFromStorage = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
};
