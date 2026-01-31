import { FormInput } from '../ui/FormInput';
import { CardLogo } from '../ui';
import type { CheckoutFormData, FormErrors } from '../../hooks/useCheckoutForm';
import type { CardType } from '../../utils/creditCardValidation';

interface PaymentFormProps {
    formData: CheckoutFormData;
    fieldErrors: FormErrors;
    cardType: CardType;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const PaymentForm = ({
    formData,
    fieldErrors,
    cardType,
    onInputChange,
    onBlur,
}: PaymentFormProps) => {
    return (
        <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="size-8 rounded-full bg-sunset-peach text-sunset-orange flex items-center justify-center text-sm">
                    2
                </span>
                Detalles de la Tarjeta de Crédito
            </h2>
            <div className="space-y-6">
                <FormInput
                    label="Número de Tarjeta"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={onInputChange}
                    onBlur={onBlur}
                    error={fieldErrors.cardNumber}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    icon={
                        cardType !== 'unknown' ? (
                            <CardLogo cardType={cardType} className="h-8" />
                        ) : (
                            <span className="material-symbols-outlined text-slate-400">
                                credit_card
                            </span>
                        )
                    }
                    hint="Prueba: Visa 4532015112830366 | Mastercard 5425233430109903"
                />
                <div className="grid grid-cols-2 gap-6">
                    <FormInput
                        label="Fecha de Vencimiento"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={onInputChange}
                        onBlur={onBlur}
                        error={fieldErrors.expiryDate}
                        placeholder="MM/YY"
                        maxLength={5}
                    />
                    <FormInput
                        label="CVV"
                        name="cvv"
                        value={formData.cvv}
                        onChange={onInputChange}
                        onBlur={onBlur}
                        error={fieldErrors.cvv}
                        placeholder={cardType === 'amex' ? '1234' : '123'}
                        maxLength={4}
                    />
                </div>
            </div>
        </section>
    );
};
