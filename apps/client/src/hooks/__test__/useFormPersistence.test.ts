import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFormPersistence } from '../useFormPersistence';
import type { CheckoutFormData } from '../useCheckoutForm';

const STORAGE_KEY = 'checkoutFormData';

describe('useFormPersistence', () => {
    let getItemSpy: any;
    let setItemSpy: any;
    let removeItemSpy: any;

    beforeEach(() => {
        const store: Record<string, string> = {};
        globalThis.localStorage = {
            getItem: vi.fn((key) => store[key] ?? null),
            setItem: vi.fn((key, value) => { store[key] = value; }),
            removeItem: vi.fn((key) => { delete store[key]; }),
            clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
            key: vi.fn(),
            length: 0,
        } as any;
        getItemSpy = vi.spyOn(globalThis.localStorage, 'getItem');
        setItemSpy = vi.spyOn(globalThis.localStorage, 'setItem');
        removeItemSpy = vi.spyOn(globalThis.localStorage, 'removeItem');
        getItemSpy.mockClear();
        setItemSpy.mockClear();
        removeItemSpy.mockClear();
    });

    it('loads saved data and calls onChange', () => {
        const saved = {
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan@mail.com',
            address: 'Calle 1',
            city: 'Bogotá',
            postalCode: '110111',
        };
        getItemSpy.mockReturnValueOnce(JSON.stringify(saved));
        const onChange = vi.fn();
        renderHook(() => useFormPersistence({
            firstName: '', lastName: '', email: '', address: '', city: '', postalCode: '', cardNumber: '', expiryDate: '', cvv: ''
        }, onChange));
        expect(onChange).toHaveBeenCalledWith({
            ...saved,
            cardNumber: '',
            expiryDate: '',
            cvv: '',
        });
    });

    it('saves data to localStorage when formData changes', () => {
        const formData: CheckoutFormData = {
            firstName: 'Ana',
            lastName: 'García',
            email: 'ana@mail.com',
            address: 'Calle 2',
            city: 'Medellín',
            postalCode: '220222',
            cardNumber: '4111',
            expiryDate: '12/30',
            cvv: '123',
        };
        const onChange = vi.fn();
        renderHook(({ data }) => useFormPersistence(data, onChange), {
            initialProps: { data: formData },
        });
        expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify({
            firstName: 'Ana',
            lastName: 'García',
            email: 'ana@mail.com',
            address: 'Calle 2',
            city: 'Medellín',
            postalCode: '220222',
        }));
    });

    it('does not save if all fields are empty', () => {
        const formData: CheckoutFormData = {
            firstName: '', lastName: '', email: '', address: '', city: '', postalCode: '', cardNumber: '', expiryDate: '', cvv: ''
        };
        const onChange = vi.fn();
        renderHook(() => useFormPersistence(formData, onChange));
        expect(setItemSpy).not.toHaveBeenCalled();
    });

    it('clearSavedData removes item from localStorage', () => {
        const formData: CheckoutFormData = {
            firstName: 'A', lastName: 'B', email: 'C', address: 'D', city: 'E', postalCode: 'F', cardNumber: '', expiryDate: '', cvv: ''
        };
        const onChange = vi.fn();
        const { result } = renderHook(() => useFormPersistence(formData, onChange));
        act(() => {
            result.current.clearSavedData();
        });
        expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    });
});
