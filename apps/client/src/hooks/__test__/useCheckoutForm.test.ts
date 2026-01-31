import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckoutForm, type CheckoutFormData } from '../useCheckoutForm';

const initialFormData: CheckoutFormData = {
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

const validFormData: CheckoutFormData = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    address: 'Calle 123 #45-67',
    city: 'Bogotá',
    postalCode: '12345',
    cardNumber: '4532015112830366', // Visa válida
    expiryDate: '12/28', // Fecha futura válida
    cvv: '123',
};

describe('useCheckoutForm', () => {
    describe('Inicialización', () => {
        it('debe inicializar con los datos proporcionados', () => {
            const { result } = renderHook(() => useCheckoutForm(validFormData));

            expect(result.current.formData).toEqual(validFormData);
            expect(result.current.fieldErrors).toEqual({});
            expect(result.current.touched).toEqual({});
            expect(result.current.cardType).toBe('visa');
        });

        it('debe inicializar con datos vacíos', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            expect(result.current.formData).toEqual(initialFormData);
            expect(result.current.cardType).toBe('unknown');
        });
    });

    describe('Validación de campos', () => {
        describe('firstName', () => {
            it('debe validar nombre válido', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    const event = {
                        target: { name: 'firstName', value: 'Juan' },
                    } as React.ChangeEvent<HTMLInputElement>;
                    result.current.handleInputChange(event);
                });

                act(() => {
                    const blurEvent = {
                        target: { name: 'firstName' },
                    } as React.FocusEvent<HTMLInputElement>;
                    result.current.handleBlur(blurEvent);
                });

                expect(result.current.fieldErrors.firstName).toBeUndefined();
            });

            it('debe mostrar error para nombre con números', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    const event = {
                        target: { name: 'firstName', value: 'Juan123' },
                    } as React.ChangeEvent<HTMLInputElement>;
                    result.current.handleInputChange(event);
                });

                act(() => {
                    const blurEvent = {
                        target: { name: 'firstName' },
                    } as React.FocusEvent<HTMLInputElement>;
                    result.current.handleBlur(blurEvent);
                });

                expect(result.current.fieldErrors.firstName).toBe('Nombre inválido (solo letras)');
            });

            it('no debe mostrar error si el campo no ha sido tocado', () => {
                const { result } = renderHook(() => useCheckoutForm({
                    ...initialFormData,
                    firstName: 'Juan123',
                }));

                expect(result.current.fieldErrors.firstName).toBeUndefined();
            });
        });

        describe('lastName', () => {
            it('debe validar apellido válido', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'lastName', value: 'Pérez' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'lastName' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.lastName).toBeUndefined();
            });

            it('debe mostrar error para apellido inválido', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'lastName', value: 'Pérez123' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'lastName' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.lastName).toBe('Apellido inválido (solo letras)');
            });
        });

        describe('email', () => {
            it('debe validar email válido', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'email', value: 'test@example.com' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'email' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.email).toBeUndefined();
            });

            it('debe mostrar error para email inválido', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'email', value: 'invalid-email' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'email' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.email).toBe('Email inválido');
            });
        });

        describe('address', () => {
            it('debe validar dirección válida', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'address', value: 'Calle 123 #45-67' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'address' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.address).toBeUndefined();
            });

            it('debe mostrar error para dirección muy corta', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'address', value: 'abc' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'address' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.address).toBe('Dirección muy corta (mínimo 5 caracteres)');
            });
        });

        describe('city', () => {
            it('debe validar ciudad válida', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'city', value: 'Bogotá' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'city' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.city).toBeUndefined();
            });

            it('debe mostrar error para ciudad con números', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'city', value: 'Bogotá123' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'city' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.city).toBe('Ciudad inválida (solo letras)');
            });
        });

        describe('postalCode', () => {
            it('debe validar código postal válido', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'postalCode', value: '12345' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'postalCode' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.postalCode).toBeUndefined();
            });

            it('debe mostrar error para código postal inválido', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'postalCode', value: '123' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'postalCode' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.postalCode).toBe('Código postal inválido (5 dígitos)');
            });
        });
    });

    describe('Validación de tarjeta', () => {
        describe('cardNumber', () => {
            it('debe validar número de tarjeta Visa válido', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'cardNumber', value: '4532015112830366' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'cardNumber' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.cardNumber).toBeUndefined();
            });

            it('debe mostrar error para número de tarjeta inválido', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'cardNumber', value: '1234567890123456' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'cardNumber' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.cardNumber).toBe('Número de tarjeta inválido');
            });
        });

        describe('expiryDate', () => {
            it('debe validar fecha de expiración válida', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'expiryDate', value: '12/28' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'expiryDate' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.expiryDate).toBeUndefined();
            });

            it('debe mostrar error para fecha expirada', () => {
                const { result } = renderHook(() => useCheckoutForm(initialFormData));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'expiryDate', value: '01/20' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'expiryDate' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.expiryDate).toBe('Fecha inválida o vencida (MM/YY)');
            });
        });

        describe('cvv', () => {
            it('debe validar CVV de 3 dígitos para Visa', () => {
                const { result } = renderHook(() => useCheckoutForm({
                    ...initialFormData,
                    cardNumber: '4532015112830366', // Visa
                }));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'cvv', value: '123' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'cvv' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.cvv).toBeUndefined();
            });

            it('debe validar CVV de 4 dígitos para American Express', () => {
                const { result } = renderHook(() => useCheckoutForm({
                    ...initialFormData,
                    cardNumber: '378282246310005', // Amex
                }));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'cvv', value: '1234' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'cvv' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.cvv).toBeUndefined();
            });

            it('debe mostrar error para CVV inválido', () => {
                const { result } = renderHook(() => useCheckoutForm({
                    ...initialFormData,
                    cardNumber: '4532015112830366', // Visa (requiere 3 dígitos)
                }));

                act(() => {
                    result.current.handleInputChange({
                        target: { name: 'cvv', value: '12' },
                    } as React.ChangeEvent<HTMLInputElement>);
                });

                act(() => {
                    result.current.handleBlur({
                        target: { name: 'cvv' },
                    } as React.FocusEvent<HTMLInputElement>);
                });

                expect(result.current.fieldErrors.cvv).toBe('CVV inválido (3 dígitos)');
            });
        });
    });

    describe('Formateo de campos', () => {
        it('debe formatear número de tarjeta con espacios', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.handleInputChange({
                    target: { name: 'cardNumber', value: '4532015112830366' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.formData.cardNumber).toMatch(/\d{4}\s\d{4}\s\d{4}\s\d{4}/);
        });

        it('debe formatear fecha de expiración con barra', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.handleInputChange({
                    target: { name: 'expiryDate', value: '1225' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.formData.expiryDate).toBe('12/25');
        });

        it('debe limitar CVV a 4 dígitos', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.handleInputChange({
                    target: { name: 'cvv', value: '12345' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.formData.cvv).toBe('1234');
        });

        it('debe limitar código postal a 5 dígitos', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.handleInputChange({
                    target: { name: 'postalCode', value: '123456' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.formData.postalCode).toBe('12345');
        });

        it('debe eliminar caracteres no numéricos del CVV', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.handleInputChange({
                    target: { name: 'cvv', value: '1a2b3c' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.formData.cvv).toBe('123');
        });

        it('debe eliminar caracteres no numéricos del código postal', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.handleInputChange({
                    target: { name: 'postalCode', value: '1a2b3c4d5e' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.formData.postalCode).toBe('12345');
        });
    });

    describe('Detección de tipo de tarjeta', () => {
        it('debe detectar tarjeta Visa', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.handleInputChange({
                    target: { name: 'cardNumber', value: '4532015112830366' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.cardType).toBe('visa');
        });

        it('debe detectar tarjeta Mastercard', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.handleInputChange({
                    target: { name: 'cardNumber', value: '5555555555554444' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.cardType).toBe('mastercard');
        });

        it('debe detectar tarjeta American Express', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.handleInputChange({
                    target: { name: 'cardNumber', value: '378282246310005' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.cardType).toBe('amex');
        });

        it('debe retornar unknown para tarjeta no reconocida', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.handleInputChange({
                    target: { name: 'cardNumber', value: '1234' },
                } as React.ChangeEvent<HTMLInputElement>);
            });

            expect(result.current.cardType).toBe('unknown');
        });
    });

    describe('isFormValid', () => {
        it('debe retornar true para formulario válido', () => {
            const { result } = renderHook(() => useCheckoutForm(validFormData));

            expect(result.current.isFormValid()).toBe(true);
        });

        it('debe retornar false cuando falta firstName', () => {
            const { result } = renderHook(() => useCheckoutForm({
                ...validFormData,
                firstName: '',
            }));

            expect(result.current.isFormValid()).toBe(false);
        });

        it('debe retornar false cuando el email es inválido', () => {
            const { result } = renderHook(() => useCheckoutForm({
                ...validFormData,
                email: 'invalid-email',
            }));

            expect(result.current.isFormValid()).toBe(false);
        });

        it('debe retornar false cuando la tarjeta es inválida', () => {
            const { result } = renderHook(() => useCheckoutForm({
                ...validFormData,
                cardNumber: '1234567890123456',
            }));

            expect(result.current.isFormValid()).toBe(false);
        });

        it('debe retornar false para formulario vacío', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            expect(result.current.isFormValid()).toBe(false);
        });
    });

    describe('resetCardData', () => {
        it('debe limpiar solo los datos de la tarjeta', () => {
            const { result } = renderHook(() => useCheckoutForm(validFormData));

            act(() => {
                result.current.resetCardData();
            });

            expect(result.current.formData.cardNumber).toBe('');
            expect(result.current.formData.expiryDate).toBe('');
            expect(result.current.formData.cvv).toBe('');
            // Otros campos deben permanecer
            expect(result.current.formData.firstName).toBe('Juan');
            expect(result.current.formData.lastName).toBe('Pérez');
            expect(result.current.formData.email).toBe('juan@example.com');
        });
    });

    describe('resetFormData', () => {
        it('debe limpiar todos los campos del formulario', () => {
            const { result } = renderHook(() => useCheckoutForm(validFormData));

            act(() => {
                result.current.resetFormData();
            });

            expect(result.current.formData).toEqual(initialFormData);
        });
    });

    describe('handleBlur', () => {
        it('debe marcar un campo como tocado', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            expect(result.current.touched.firstName).toBeUndefined();

            act(() => {
                result.current.handleBlur({
                    target: { name: 'firstName' },
                } as React.FocusEvent<HTMLInputElement>);
            });

            expect(result.current.touched.firstName).toBe(true);
        });

        it('debe marcar múltiples campos como tocados', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.handleBlur({
                    target: { name: 'firstName' },
                } as React.FocusEvent<HTMLInputElement>);
            });

            act(() => {
                result.current.handleBlur({
                    target: { name: 'email' },
                } as React.FocusEvent<HTMLInputElement>);
            });

            expect(result.current.touched.firstName).toBe(true);
            expect(result.current.touched.email).toBe(true);
            expect(result.current.touched.lastName).toBeUndefined();
        });
    });

    describe('setFormData', () => {
        it('debe permitir actualizar formData directamente', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.setFormData(validFormData);
            });

            expect(result.current.formData).toEqual(validFormData);
        });

        it('debe permitir actualización parcial', () => {
            const { result } = renderHook(() => useCheckoutForm(initialFormData));

            act(() => {
                result.current.setFormData(prev => ({
                    ...prev,
                    firstName: 'Pedro',
                    lastName: 'García',
                }));
            });

            expect(result.current.formData.firstName).toBe('Pedro');
            expect(result.current.formData.lastName).toBe('García');
            expect(result.current.formData.email).toBe('');
        });
    });
});
