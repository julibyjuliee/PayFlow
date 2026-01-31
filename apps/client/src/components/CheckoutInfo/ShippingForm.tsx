import { FormInput } from '../ui/FormInput';
import type { CheckoutFormData, FormErrors } from '../../hooks/useCheckoutForm';

interface ShippingFormProps {
    formData: CheckoutFormData;
    fieldErrors: FormErrors;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const ShippingForm = ({
    formData,
    fieldErrors,
    onInputChange,
    onBlur,
}: ShippingFormProps) => {
    return (
        <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="size-8 rounded-full bg-sunset-peach text-sunset-orange flex items-center justify-center text-sm">
                    1
                </span>
                Dirección de Entrega
            </h2>
            <div className="grid grid-cols-2 gap-6">
                <FormInput
                    label="Nombre"
                    name="firstName"
                    value={formData.firstName}
                    onChange={onInputChange}
                    onBlur={onBlur}
                    error={fieldErrors.firstName}
                    placeholder="Jane"
                    className="col-span-1"
                />
                <FormInput
                    label="Apellido"
                    name="lastName"
                    value={formData.lastName}
                    onChange={onInputChange}
                    onBlur={onBlur}
                    error={fieldErrors.lastName}
                    placeholder="Doe"
                    className="col-span-1"
                />
                <FormInput
                    label="Dirección de correo"
                    name="email"
                    value={formData.email}
                    onChange={onInputChange}
                    onBlur={onBlur}
                    error={fieldErrors.email}
                    placeholder="ejemplo@dominio.com"
                    type="email"
                    className="col-span-2"
                />
                <FormInput
                    label="Dirección"
                    name="address"
                    value={formData.address}
                    onChange={onInputChange}
                    onBlur={onBlur}
                    error={fieldErrors.address}
                    placeholder="123 Sunset Blvd"
                    className="col-span-2"
                />
                <FormInput
                    label="Ciudad"
                    name="city"
                    value={formData.city}
                    onChange={onInputChange}
                    onBlur={onBlur}
                    error={fieldErrors.city}
                    placeholder="Los Angeles"
                    className="col-span-1"
                />
                <FormInput
                    label="Código Postal"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={onInputChange}
                    onBlur={onBlur}
                    error={fieldErrors.postalCode}
                    placeholder="90001"
                    className="col-span-1"
                />
            </div>
        </section>
    );
};
